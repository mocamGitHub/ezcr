/**
 * BOL Import Script
 *
 * Recursively searches a folder for PDF files with "BOL" in the name,
 * extracts shipping information using Claude's vision API,
 * and updates matching orders in the database.
 *
 * Usage:
 *   npx tsx scripts/import-bols.ts <folder-path> [--dry-run]
 *
 * Options:
 *   --dry-run    Show what would be imported without making changes
 */

import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

// Load environment variables from .env.local
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

// Types
interface BOLData {
  fileName: string;
  filePath: string;
  ebolId: string | null;
  proNumber: string | null;
  shipDate: string | null;
  consignee: {
    name: string | null;
    street: string | null;
    city: string | null;
    state: string | null;
    zip: string | null;
    phone: string | null;
  };
  shipper: {
    name: string | null;
    street: string | null;
    city: string | null;
    state: string | null;
    zip: string | null;
    phone: string | null;
  };
  weight: number | null;
  pieces: number | null;
  description: string | null;
  specialInstructions: string | null;
  isResidential: boolean;
  hasLiftgate: boolean;
}

interface MatchedOrder {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  created_at: string;
}

// Initialize clients
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase credentials not configured');
  }

  return createClient(supabaseUrl, supabaseKey);
}

function getAnthropicClient() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY not configured');
  }
  return new Anthropic({ apiKey });
}

// Find all BOL files recursively
async function findBOLFiles(folderPath: string): Promise<string[]> {
  const absolutePath = path.resolve(folderPath);

  if (!fs.existsSync(absolutePath)) {
    throw new Error(`Folder not found: ${absolutePath}`);
  }

  // Find all PDF files with "BOL" in the name (case-insensitive)
  const pattern = path.join(absolutePath, '**/*[Bb][Oo][Ll]*.pdf');
  const files = await glob(pattern, { nocase: true, windowsPathsNoEscape: true });

  return files.sort();
}

// Extract BOL data using Claude Vision
async function extractBOLData(filePath: string, anthropic: Anthropic): Promise<BOLData> {
  const fileName = path.basename(filePath);

  // Read the PDF file as base64
  const fileBuffer = fs.readFileSync(filePath);
  const base64Data = fileBuffer.toString('base64');

  // Determine media type
  const ext = path.extname(filePath).toLowerCase();
  let mediaType: 'application/pdf' | 'image/png' | 'image/jpeg' | 'image/gif' | 'image/webp' = 'application/pdf';
  if (ext === '.png') mediaType = 'image/png';
  else if (ext === '.jpg' || ext === '.jpeg') mediaType = 'image/jpeg';

  const prompt = `Analyze this TForce Freight Bill of Lading (BOL) document and extract the following information in JSON format:

{
  "ebolId": "the eBOL ID number from the top right (e.g., 77793261)",
  "proNumber": "the PRO number from the bottom left barcode area (9 digits, e.g., 191826180)",
  "shipDate": "the date in YYYY-MM-DD format",
  "consignee": {
    "name": "consignee/recipient name",
    "street": "street address",
    "city": "city",
    "state": "state abbreviation",
    "zip": "zip code",
    "phone": "phone number with area code"
  },
  "shipper": {
    "name": "shipper name",
    "street": "street address",
    "city": "city",
    "state": "state abbreviation",
    "zip": "zip code",
    "phone": "phone number with area code"
  },
  "weight": 330,
  "pieces": 1,
  "description": "description of articles",
  "specialInstructions": "any special delivery instructions",
  "isResidential": true,
  "hasLiftgate": true
}

Look carefully at:
- The eBOL ID # in the top right corner
- The PRO number in the barcode area at the bottom left (labeled MAR followed by digits)
- CONSIGNEE (TO) section on the left for recipient info
- SHIPPER (FROM) section on the right for shipper info
- Check boxes for Residential and Liftgate
- Special Instructions section

Return ONLY the JSON object, no other text.`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'document',
              source: {
                type: 'base64',
                media_type: mediaType,
                data: base64Data,
              },
            },
            {
              type: 'text',
              text: prompt,
            },
          ],
        },
      ],
    });

    // Parse the response
    const textContent = response.content.find(c => c.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text response from Claude');
    }

    // Extract JSON from response (handle potential markdown code blocks)
    let jsonStr = textContent.text.trim();
    if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/```json?\n?/g, '').replace(/```$/g, '').trim();
    }

    const data = JSON.parse(jsonStr);

    return {
      fileName,
      filePath,
      ebolId: data.ebolId || null,
      proNumber: data.proNumber || null,
      shipDate: data.shipDate || null,
      consignee: {
        name: data.consignee?.name || null,
        street: data.consignee?.street || null,
        city: data.consignee?.city || null,
        state: data.consignee?.state || null,
        zip: data.consignee?.zip || null,
        phone: data.consignee?.phone || null,
      },
      shipper: {
        name: data.shipper?.name || null,
        street: data.shipper?.street || null,
        city: data.shipper?.city || null,
        state: data.shipper?.state || null,
        zip: data.shipper?.zip || null,
        phone: data.shipper?.phone || null,
      },
      weight: data.weight || null,
      pieces: data.pieces || null,
      description: data.description || null,
      specialInstructions: data.specialInstructions || null,
      isResidential: data.isResidential === true,
      hasLiftgate: data.hasLiftgate === true,
    };
  } catch (error: any) {
    console.error(`  Error extracting data from ${fileName}:`, error.message);
    return {
      fileName,
      filePath,
      ebolId: null,
      proNumber: null,
      shipDate: null,
      consignee: { name: null, street: null, city: null, state: null, zip: null, phone: null },
      shipper: { name: null, street: null, city: null, state: null, zip: null, phone: null },
      weight: null,
      pieces: null,
      description: null,
      specialInstructions: null,
      isResidential: false,
      hasLiftgate: false,
    };
  }
}

// Find matching order in database
async function findMatchingOrder(
  bolData: BOLData,
  supabase: ReturnType<typeof getSupabaseClient>
): Promise<MatchedOrder | null> {
  if (!bolData.consignee.name) return null;

  // Clean up the name for matching
  const consigneeName = bolData.consignee.name.trim().toUpperCase();

  // Try to find by customer name (case-insensitive)
  const { data: orders, error } = await supabase
    .from('orders')
    .select('id, order_number, customer_name, customer_email, created_at, pro_number')
    .ilike('customer_name', `%${consigneeName}%`)
    .is('pro_number', null) // Only match orders without PRO number
    .order('created_at', { ascending: false })
    .limit(10);

  if (error || !orders || orders.length === 0) {
    // Try partial name match (first and last name separately)
    const nameParts = consigneeName.split(/\s+/);
    if (nameParts.length >= 2) {
      const { data: partialMatches } = await supabase
        .from('orders')
        .select('id, order_number, customer_name, customer_email, created_at, pro_number')
        .or(`customer_name.ilike.%${nameParts[0]}%,customer_name.ilike.%${nameParts[nameParts.length - 1]}%`)
        .is('pro_number', null)
        .order('created_at', { ascending: false })
        .limit(10);

      if (partialMatches && partialMatches.length > 0) {
        // Find best match
        for (const order of partialMatches) {
          const orderName = order.customer_name.toUpperCase();
          if (nameParts.every(part => orderName.includes(part))) {
            return order;
          }
        }
      }
    }
    return null;
  }

  // If ship date is available, try to match by date proximity
  if (bolData.shipDate && orders.length > 1) {
    const shipDate = new Date(bolData.shipDate);
    let bestMatch = orders[0];
    let bestDiff = Infinity;

    for (const order of orders) {
      const orderDate = new Date(order.created_at);
      const diff = Math.abs(shipDate.getTime() - orderDate.getTime());
      if (diff < bestDiff) {
        bestDiff = diff;
        bestMatch = order;
      }
    }
    return bestMatch;
  }

  return orders[0];
}

// Update order with BOL data
async function updateOrderWithBOL(
  orderId: string,
  bolData: BOLData,
  supabase: ReturnType<typeof getSupabaseClient>
): Promise<boolean> {
  const updateData: Record<string, any> = {
    updated_at: new Date().toISOString(),
  };

  // PRO number
  if (bolData.proNumber) {
    updateData.pro_number = bolData.proNumber;
    updateData.carrier = 'tforce';
  }

  // BOL number (eBOL ID)
  if (bolData.ebolId) {
    updateData.bol_number = bolData.ebolId;
  }

  // Shipping address - only update if we have data
  if (bolData.consignee.street || bolData.consignee.city) {
    // Fetch current order to merge address data
    const { data: currentOrder } = await supabase
      .from('orders')
      .select('shipping_address, customer_phone')
      .eq('id', orderId)
      .single();

    const currentAddress = currentOrder?.shipping_address || {};

    updateData.shipping_address = {
      ...currentAddress,
      name: bolData.consignee.name || currentAddress.name,
      line1: bolData.consignee.street || currentAddress.line1,
      city: bolData.consignee.city || currentAddress.city,
      state: bolData.consignee.state || currentAddress.state,
      postalCode: bolData.consignee.zip || currentAddress.postalCode,
      is_residential: bolData.isResidential,
    };

    // Update phone if available and not already set
    if (bolData.consignee.phone && !currentOrder?.customer_phone) {
      updateData.customer_phone = bolData.consignee.phone;
    }
  }

  // Ship date
  if (bolData.shipDate) {
    updateData.shipped_at = bolData.shipDate;
    // Also update status if not already shipped/delivered
    const { data: order } = await supabase
      .from('orders')
      .select('status')
      .eq('id', orderId)
      .single();

    if (order && !['shipped', 'delivered'].includes(order.status)) {
      updateData.status = 'shipped';
    }
  }

  // Delivery requirements in notes
  const deliveryNotes: string[] = [];
  if (bolData.isResidential) deliveryNotes.push('Residential delivery');
  if (bolData.hasLiftgate) deliveryNotes.push('Liftgate required');
  if (bolData.specialInstructions) deliveryNotes.push(bolData.specialInstructions);

  if (deliveryNotes.length > 0) {
    updateData.internal_notes = deliveryNotes.join('; ');
  }

  const { error } = await supabase
    .from('orders')
    .update(updateData)
    .eq('id', orderId);

  return !error;
}

// Main function
async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const folderPath = args.find(arg => !arg.startsWith('--'));

  if (!folderPath) {
    console.log('Usage: npx tsx scripts/import-bols.ts <folder-path> [--dry-run]');
    console.log('');
    console.log('Options:');
    console.log('  --dry-run    Show what would be imported without making changes');
    process.exit(1);
  }

  console.log('='.repeat(60));
  console.log('BOL Import Script');
  console.log('='.repeat(60));
  console.log(`Folder: ${folderPath}`);
  console.log(`Mode: ${dryRun ? 'DRY RUN (no changes)' : 'LIVE'}`);
  console.log('');

  // Initialize clients
  const supabase = getSupabaseClient();
  const anthropic = getAnthropicClient();

  // Find BOL files
  console.log('Searching for BOL files...');
  const files = await findBOLFiles(folderPath);
  console.log(`Found ${files.length} BOL file(s)`);
  console.log('');

  if (files.length === 0) {
    console.log('No BOL files found. Looking for files with "BOL" in the name.');
    process.exit(0);
  }

  // Process each file
  const results = {
    processed: 0,
    matched: 0,
    updated: 0,
    errors: 0,
  };

  for (const filePath of files) {
    const fileName = path.basename(filePath);
    console.log(`Processing: ${fileName}`);

    try {
      // Extract data from BOL
      const bolData = await extractBOLData(filePath, anthropic);
      results.processed++;

      if (!bolData.proNumber && !bolData.ebolId) {
        console.log(`  Warning: Could not extract PRO or eBOL ID`);
      } else {
        console.log(`  PRO: ${bolData.proNumber || 'N/A'}, eBOL: ${bolData.ebolId || 'N/A'}`);
      }

      if (bolData.consignee.name) {
        console.log(`  Consignee: ${bolData.consignee.name}`);
        if (bolData.consignee.street) {
          console.log(`  Address: ${bolData.consignee.street}, ${bolData.consignee.city}, ${bolData.consignee.state} ${bolData.consignee.zip}`);
        }
        if (bolData.consignee.phone) {
          console.log(`  Phone: ${bolData.consignee.phone}`);
        }
      }

      // Find matching order
      const matchedOrder = await findMatchingOrder(bolData, supabase);

      if (matchedOrder) {
        results.matched++;
        console.log(`  Matched: Order #${matchedOrder.order_number} (${matchedOrder.customer_name})`);

        if (!dryRun) {
          const updated = await updateOrderWithBOL(matchedOrder.id, bolData, supabase);
          if (updated) {
            results.updated++;
            console.log(`  Updated successfully`);
          } else {
            console.log(`  Failed to update`);
            results.errors++;
          }
        } else {
          console.log(`  [DRY RUN] Would update order`);
        }
      } else {
        console.log(`  No matching order found`);
      }

    } catch (error: any) {
      console.log(`  Error: ${error.message}`);
      results.errors++;
    }

    console.log('');
  }

  // Summary
  console.log('='.repeat(60));
  console.log('Summary');
  console.log('='.repeat(60));
  console.log(`Files processed: ${results.processed}`);
  console.log(`Orders matched: ${results.matched}`);
  console.log(`Orders updated: ${results.updated}`);
  console.log(`Errors: ${results.errors}`);

  if (dryRun) {
    console.log('');
    console.log('This was a DRY RUN. No changes were made.');
    console.log('Run without --dry-run to apply changes.');
  }
}

main().catch(console.error);
