/**
 * seed-comms-full.ts
 * Seeds:
 * - comms_phone_numbers (Twilio mapping)
 * - comms_inbound_routes (Mailgun inbound secret)
 * - example templates + versions + publish
 * - example contact + preferences
 *
 * Usage:
 *   node ./scripts/seed-comms-full.ts
 *
 * Env required:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   EZCR_TENANT_ID
 * Optional:
 *   EZCR_TWILIO_NUMBER
 *   EZCR_MAILGUN_INBOUND_SECRET
 */
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

// Load .env.local (Next.js convention)
config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

function must(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

async function main() {
  const tenantId = must("EZCR_TENANT_ID");

  const twilioNumber = process.env.EZCR_TWILIO_NUMBER;
  if (twilioNumber) {
    const { error } = await supabase.from("comms_phone_numbers").upsert(
      [{
        tenant_id: tenantId,
        provider: "twilio",
        phone_number: twilioNumber,
        label: "EZ Cycle Ramp - Primary",
        is_active: true,
        is_primary: true,
        capabilities: { sms: true, mms: false },
        metadata: {},
      }],
      { onConflict: "provider,phone_number" }
    );
    if (error) throw error;
    console.log("[seed] comms_phone_numbers upserted:", twilioNumber);
  } else {
    console.warn("[seed] EZCR_TWILIO_NUMBER not set; skipping phone number mapping.");
  }

  const inboundSecret = process.env.EZCR_MAILGUN_INBOUND_SECRET;
  if (inboundSecret) {
    const { error } = await supabase.from("comms_inbound_routes").upsert(
      [{
        tenant_id: tenantId,
        provider: "mailgun",
        channel: "email",
        route_secret: inboundSecret,
        is_active: true,
        metadata: { purpose: "mailgun_inbound_route" },
      }],
      { onConflict: "tenant_id,provider,route_secret" }
    );
    if (error) throw error;
    console.log("[seed] comms_inbound_routes upserted: mailgun inbound secret");
  } else {
    console.warn("[seed] EZCR_MAILGUN_INBOUND_SECRET not set; skipping inbound route seed.");
  }

  // Example contact - check if exists first due to partial unique index
  let contact: { id: string };
  const { data: existingContact } = await supabase
    .from("comms_contacts")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("email", "customer@example.com")
    .single();

  if (existingContact) {
    contact = existingContact;
    console.log("[seed] comms_contacts: existing contact found");
  } else {
    const { data: newContact, error: cErr } = await supabase
      .from("comms_contacts")
      .insert({
        tenant_id: tenantId,
        email: "customer@example.com",
        phone_e164: "+15555550123",
        display_name: "Example Customer",
        metadata: { seeded: true },
      })
      .select("id")
      .single();
    if (cErr) throw cErr;
    contact = newContact;
    console.log("[seed] comms_contacts: created example contact");
  }

  await supabase.from("comms_channel_preferences").upsert(
    [
      { tenant_id: tenantId, contact_id: contact.id, channel: "email", consent_status: "opted_in", consent_source: "seed" },
      { tenant_id: tenantId, contact_id: contact.id, channel: "sms", consent_status: "opted_in", consent_source: "seed" },
    ],
    { onConflict: "tenant_id,contact_id,channel" }
  );

  // Template: Email - check if exists first
  let tplEmail: { id: string };
  const { data: existingEmailTpl } = await supabase
    .from("comms_templates")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("name", "Order Follow-up (Email)")
    .single();

  if (existingEmailTpl) {
    tplEmail = existingEmailTpl;
    console.log("[seed] comms_templates: email template already exists");
  } else {
    const { data: newTpl, error: t1Err } = await supabase
      .from("comms_templates")
      .insert({ tenant_id: tenantId, name: "Order Follow-up (Email)", channel: "email", status: "draft" })
      .select("id")
      .single();
    if (t1Err) throw t1Err;
    tplEmail = newTpl;
    console.log("[seed] comms_templates: created email template");
  }

  // Check if email template version exists
  const { data: existingV1 } = await supabase
    .from("comms_template_versions")
    .select("id")
    .eq("template_id", tplEmail.id)
    .eq("version_number", 1)
    .single();

  let v1: { id: string };
  if (existingV1) {
    v1 = existingV1;
    console.log("[seed] comms_template_versions: email version already exists");
  } else {
    const { data: newV1, error: v1Err } = await supabase
      .from("comms_template_versions")
      .insert({
        tenant_id: tenantId,
        template_id: tplEmail.id,
        version_number: 1,
        channel: "email",
        subject: "Thanks for your order {{order.number}}",
        text_body: "Hi {{contact.display_name}},\n\nWe received your order {{order.number}} totaling {{order.total}}.\n\n— EZ Cycle Ramp",
        html_body: "<p>Hi {{contact.display_name}},</p><p>We received your order <b>{{order.number}}</b> totaling <b>{{order.total}}</b>.</p><p>— EZ Cycle Ramp</p>",
        metadata: { seeded: true },
      })
      .select("id")
      .single();
    if (v1Err) throw v1Err;
    v1 = newV1;
    console.log("[seed] comms_template_versions: created email version");
  }

  await supabase.from("comms_templates").update({ active_version_id: v1.id, status: "active" }).eq("id", tplEmail.id);

  // Template: SMS - check if exists first
  let tplSms: { id: string };
  const { data: existingSmsTpl } = await supabase
    .from("comms_templates")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("name", "Order Follow-up (SMS)")
    .single();

  if (existingSmsTpl) {
    tplSms = existingSmsTpl;
    console.log("[seed] comms_templates: SMS template already exists");
  } else {
    const { data: newTpl, error: t2Err } = await supabase
      .from("comms_templates")
      .insert({ tenant_id: tenantId, name: "Order Follow-up (SMS)", channel: "sms", status: "draft" })
      .select("id")
      .single();
    if (t2Err) throw t2Err;
    tplSms = newTpl;
    console.log("[seed] comms_templates: created SMS template");
  }

  // Check if SMS template version exists
  const { data: existingV2 } = await supabase
    .from("comms_template_versions")
    .select("id")
    .eq("template_id", tplSms.id)
    .eq("version_number", 1)
    .single();

  let v2: { id: string };
  if (existingV2) {
    v2 = existingV2;
    console.log("[seed] comms_template_versions: SMS version already exists");
  } else {
    const { data: newV2, error: v2Err } = await supabase
      .from("comms_template_versions")
      .insert({
        tenant_id: tenantId,
        template_id: tplSms.id,
        version_number: 1,
        channel: "sms",
        subject: null,
        text_body: "EZ Cycle Ramp: Thanks {{contact.display_name}} — order {{order.number}} received ({{order.total}}). Reply STOP to opt out.",
        html_body: null,
        metadata: { seeded: true },
      })
      .select("id")
      .single();
    if (v2Err) throw v2Err;
    v2 = newV2;
    console.log("[seed] comms_template_versions: created SMS version");
  }

  await supabase.from("comms_templates").update({ active_version_id: v2.id, status: "active" }).eq("id", tplSms.id);

  console.log("[seed] done");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
