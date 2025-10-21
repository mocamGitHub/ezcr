// src/app/(support)/installation/page.tsx
import { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
  title: 'Installation Guide | EZ Cycle Ramp',
  description: 'Step-by-step installation instructions for EZ Cycle Ramp motorcycle loading ramps. Tools needed, safety tips, and installation videos.',
}

export default function InstallationPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <section className="bg-gradient-to-br from-[#0B5394] to-blue-800 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Installation Guide
          </h1>
          <p className="text-xl text-blue-100">
            Complete step-by-step instructions for installing your EZ Cycle Ramp
          </p>
        </div>
      </section>

      {/* Overview */}
      <section className="py-12 border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-muted/30 rounded-lg">
              <div className="text-3xl font-bold text-[#F78309] mb-2">30-60 min</div>
              <p className="text-sm text-muted-foreground">Average Installation Time</p>
            </div>
            <div className="text-center p-6 bg-muted/30 rounded-lg">
              <div className="text-3xl font-bold text-[#F78309] mb-2">Basic</div>
              <p className="text-sm text-muted-foreground">Skill Level Required</p>
            </div>
            <div className="text-center p-6 bg-muted/30 rounded-lg">
              <div className="text-3xl font-bold text-[#F78309] mb-2">1-2</div>
              <p className="text-sm text-muted-foreground">People Recommended</p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Before You Begin */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-6 text-[#0B5394] border-b pb-2">
              Before You Begin
            </h2>
            <div className="bg-yellow-50 dark:bg-yellow-950/20 border-l-4 border-yellow-600 p-6 rounded-r mb-6">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Important Safety Notice
              </h3>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Always wear safety glasses when drilling or using power tools</li>
                <li>• Ensure truck is parked on level ground with parking brake engaged</li>
                <li>• Have a helper assist with heavy components</li>
                <li>• Read all instructions completely before beginning installation</li>
                <li>• Keep children and pets away from work area</li>
              </ul>
            </div>
          </div>

          {/* Tools & Materials */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-6 text-[#0B5394] border-b pb-2">
              Tools & Materials Needed
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-4 text-lg">Required Tools</h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-[#F78309] mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Socket wrench set (SAE sizes: 7/16", 1/2", 9/16")</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-[#F78309] mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Adjustable wrench (10-12")</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-[#F78309] mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Electric or cordless drill</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-[#F78309] mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Drill bits: 1/4", 5/16", 1/2"</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-[#F78309] mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Phillips and flathead screwdrivers</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-[#F78309] mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Measuring tape (25 ft minimum)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-[#F78309] mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Level (2-3 ft)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-[#F78309] mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Marker or pencil for marking holes</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-[#F78309] mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Center punch or nail (for pilot holes)</span>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-4 text-lg">Optional But Helpful</h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Torque wrench (for precise tightening)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Shop vacuum (for cleaning metal shavings)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Touch-up paint (for drill holes)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Rubber mallet (for alignment adjustments)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Clamps or C-clamps (to hold pieces during assembly)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Thread locker (Loctite Blue 242)</span>
                  </li>
                </ul>

                <div className="mt-6 p-4 bg-muted/30 rounded">
                  <p className="text-sm text-muted-foreground">
                    <strong>Note:</strong> All mounting hardware, bolts, nuts, and washers are included with your ramp purchase.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Step-by-Step Instructions */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-6 text-[#0B5394] border-b pb-2">
              Installation Steps
            </h2>

            {/* Step 1 */}
            <div className="mb-8 border-l-4 border-[#F78309] pl-6 py-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-[#F78309] text-white flex items-center justify-center font-bold text-xl flex-shrink-0">1</div>
                <h3 className="text-xl font-bold">Unpack and Inventory</h3>
              </div>
              <p className="text-muted-foreground mb-3">
                Carefully remove all components from the packaging. Lay them out on a clean surface and verify
                all parts are present using the included parts list.
              </p>
              <div className="bg-muted/30 p-4 rounded">
                <p className="font-semibold mb-2">You should have:</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Main ramp assembly</li>
                  <li>• Mounting brackets (2)</li>
                  <li>• Hardware bag containing bolts, nuts, washers, and cotter pins</li>
                  <li>• Safety strap with carabiner</li>
                  <li>• Installation instructions and parts diagram</li>
                </ul>
              </div>
            </div>

            {/* Step 2 */}
            <div className="mb-8 border-l-4 border-[#F78309] pl-6 py-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-[#F78309] text-white flex items-center justify-center font-bold text-xl flex-shrink-0">2</div>
                <h3 className="text-xl font-bold">Measure Truck Bed Height</h3>
              </div>
              <p className="text-muted-foreground mb-3">
                Measure from the ground to the top edge of your truck bed or tailgate (in the down position).
                This measurement will determine your ramp angle and mounting position.
              </p>
              <div className="bg-yellow-50 dark:bg-yellow-950/20 p-4 rounded">
                <p className="text-sm">
                  <strong>Tip:</strong> For optimal loading angle, aim for less than 30 degrees. Our ramps adjust
                  to bed heights from 18" to 48".
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="mb-8 border-l-4 border-[#F78309] pl-6 py-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-[#F78309] text-white flex items-center justify-center font-bold text-xl flex-shrink-0">3</div>
                <h3 className="text-xl font-bold">Position Mounting Brackets</h3>
              </div>
              <p className="text-muted-foreground mb-3">
                Place the mounting brackets on the outside of the truck bed, approximately 12-18 inches from
                the tailgate. The brackets should be centered on the bed rails.
              </p>
              <ul className="space-y-2 text-muted-foreground text-sm">
                <li className="flex gap-2">
                  <span className="text-[#F78309]">•</span>
                  <span>Ensure brackets are level and perpendicular to the truck bed</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-[#F78309]">•</span>
                  <span>Verify both sides are positioned at the same distance from tailgate</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-[#F78309]">•</span>
                  <span>Double-check clearance for bed liner lips or tonneau cover hardware</span>
                </li>
              </ul>
            </div>

            {/* Step 4 */}
            <div className="mb-8 border-l-4 border-[#F78309] pl-6 py-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-[#F78309] text-white flex items-center justify-center font-bold text-xl flex-shrink-0">4</div>
                <h3 className="text-xl font-bold">Mark Mounting Holes</h3>
              </div>
              <p className="text-muted-foreground mb-3">
                Using the bracket as a template, mark the locations for the mounting holes with a marker or
                center punch. Most installations require 4 holes per bracket (8 total).
              </p>
              <div className="bg-yellow-50 dark:bg-yellow-950/20 p-4 rounded">
                <p className="text-sm">
                  <strong>Important:</strong> Measure twice, drill once! Verify your marks are in the correct
                  location before drilling. Check underneath the bed to avoid hitting fuel lines, brake lines,
                  or wiring.
                </p>
              </div>
            </div>

            {/* Step 5 */}
            <div className="mb-8 border-l-4 border-[#F78309] pl-6 py-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-[#F78309] text-white flex items-center justify-center font-bold text-xl flex-shrink-0">5</div>
                <h3 className="text-xl font-bold">Drill Pilot Holes</h3>
              </div>
              <p className="text-muted-foreground mb-3">
                Start with a 1/4" pilot hole at each marked location. Then enlarge to the final size (typically
                1/2") using the larger bit. This two-step process ensures clean, accurate holes.
              </p>
              <ul className="space-y-2 text-muted-foreground text-sm">
                <li className="flex gap-2">
                  <span className="text-[#F78309]">•</span>
                  <span>Use cutting oil or WD-40 to lubricate the bit</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-[#F78309]">•</span>
                  <span>Drill straight and perpendicular to the surface</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-[#F78309]">•</span>
                  <span>Clean metal shavings immediately to prevent rust</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-[#F78309]">•</span>
                  <span>Apply touch-up paint to exposed metal edges</span>
                </li>
              </ul>
            </div>

            {/* Step 6 */}
            <div className="mb-8 border-l-4 border-[#F78309] pl-6 py-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-[#F78309] text-white flex items-center justify-center font-bold text-xl flex-shrink-0">6</div>
                <h3 className="text-xl font-bold">Attach Mounting Brackets</h3>
              </div>
              <p className="text-muted-foreground mb-3">
                Bolt the mounting brackets to the truck bed using the provided hardware. Install in this order:
                bolt → washer → bracket → washer → lock nut.
              </p>
              <ul className="space-y-2 text-muted-foreground text-sm mb-3">
                <li className="flex gap-2">
                  <span className="text-[#F78309]">•</span>
                  <span>Hand-tighten all bolts first to allow for adjustment</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-[#F78309]">•</span>
                  <span>Verify brackets are level and properly aligned</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-[#F78309]">•</span>
                  <span>Tighten bolts in a cross pattern to 30-35 ft-lbs torque</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-[#F78309]">•</span>
                  <span>Optional: Apply thread locker (Loctite Blue 242) for extra security</span>
                </li>
              </ul>
            </div>

            {/* Step 7 */}
            <div className="mb-8 border-l-4 border-[#F78309] pl-6 py-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-[#F78309] text-white flex items-center justify-center font-bold text-xl flex-shrink-0">7</div>
                <h3 className="text-xl font-bold">Install Main Ramp Assembly</h3>
              </div>
              <p className="text-muted-foreground mb-3">
                With a helper, lift the main ramp assembly and align the pivot points with the mounted brackets.
                Insert the pivot pins and secure with cotter pins or locking clips.
              </p>
              <div className="bg-yellow-50 dark:bg-yellow-950/20 p-4 rounded">
                <p className="text-sm">
                  <strong>Safety Note:</strong> The ramp assembly is heavy (85-120 lbs depending on model).
                  Always use a helper to prevent injury or damage.
                </p>
              </div>
            </div>

            {/* Step 8 */}
            <div className="mb-8 border-l-4 border-[#F78309] pl-6 py-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-[#F78309] text-white flex items-center justify-center font-bold text-xl flex-shrink-0">8</div>
                <h3 className="text-xl font-bold">Adjust Ramp Angle</h3>
              </div>
              <p className="text-muted-foreground mb-3">
                Adjust the telescoping sections to achieve the desired loading angle. The ramp should extend
                to the ground at a comfortable angle (less than 30 degrees recommended).
              </p>
              <ul className="space-y-2 text-muted-foreground text-sm">
                <li className="flex gap-2">
                  <span className="text-[#F78309]">•</span>
                  <span>Extend the ramp and verify it sits flat on the ground</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-[#F78309]">•</span>
                  <span>Adjust the height pins to the appropriate setting</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-[#F78309]">•</span>
                  <span>Ensure locking pins are fully seated and secured</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-[#F78309]">•</span>
                  <span>Test the folding mechanism (for folding models)</span>
                </li>
              </ul>
            </div>

            {/* Step 9 */}
            <div className="mb-8 border-l-4 border-[#F78309] pl-6 py-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-[#F78309] text-white flex items-center justify-center font-bold text-xl flex-shrink-0">9</div>
                <h3 className="text-xl font-bold">Install Safety Strap</h3>
              </div>
              <p className="text-muted-foreground mb-3">
                Attach the included safety strap between the ramp and a secure point on your truck bed.
                This prevents the ramp from sliding during loading.
              </p>
              <div className="bg-red-50 dark:bg-red-950/20 p-4 rounded border-l-4 border-red-600">
                <p className="text-sm font-semibold mb-1">CRITICAL SAFETY REQUIREMENT</p>
                <p className="text-sm">
                  Always use the safety strap during loading and unloading. Never attempt to load a motorcycle
                  without the strap properly secured.
                </p>
              </div>
            </div>

            {/* Step 10 */}
            <div className="mb-8 border-l-4 border-[#0B5394] pl-6 py-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-[#0B5394] text-white flex items-center justify-center font-bold text-xl flex-shrink-0">10</div>
                <h3 className="text-xl font-bold">Final Inspection & Testing</h3>
              </div>
              <p className="text-muted-foreground mb-3">
                Before loading your motorcycle, perform a thorough inspection and test:
              </p>
              <ul className="space-y-2 text-muted-foreground text-sm">
                <li className="flex gap-2">
                  <span className="text-[#0B5394]">✓</span>
                  <span>Verify all bolts are tight (re-check after first use)</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-[#0B5394]">✓</span>
                  <span>Check that all pins and locks are properly seated</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-[#0B5394]">✓</span>
                  <span>Test the ramp with your body weight (walk up slowly)</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-[#0B5394]">✓</span>
                  <span>Ensure ramp sits flat and stable on ground</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-[#0B5394]">✓</span>
                  <span>Verify safety strap is secure and undamaged</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-[#0B5394]">✓</span>
                  <span>Practice folding/unfolding (if applicable) several times</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Maintenance */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-6 text-[#0B5394] border-b pb-2">
              Maintenance & Care
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="border rounded-lg p-5">
                <h3 className="font-semibold mb-3">Regular Maintenance</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Check all bolts for tightness monthly</li>
                  <li>• Inspect welds and structural components quarterly</li>
                  <li>• Clean and lubricate pivot points every 3 months</li>
                  <li>• Remove dirt and debris after each use</li>
                  <li>• Inspect safety strap for wear or damage</li>
                </ul>
              </div>

              <div className="border rounded-lg p-5">
                <h3 className="font-semibold mb-3">Long-Term Care</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Touch up scratches with rust-resistant paint</li>
                  <li>• Store in dry location when possible</li>
                  <li>• Avoid prolonged exposure to road salt</li>
                  <li>• Apply light oil to moving parts annually</li>
                  <li>• Replace worn hardware as needed</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Troubleshooting */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-6 text-[#0B5394] border-b pb-2">
              Common Issues & Solutions
            </h2>
            <div className="space-y-4">
              <div className="bg-muted/30 p-4 rounded">
                <h3 className="font-semibold mb-2">Ramp won't fold smoothly</h3>
                <p className="text-sm text-muted-foreground">
                  <strong>Solution:</strong> Clean and lubricate pivot points with WD-40 or similar lubricant.
                  Check for debris or dirt in folding mechanism.
                </p>
              </div>

              <div className="bg-muted/30 p-4 rounded">
                <h3 className="font-semibold mb-2">Ramp feels unstable</h3>
                <p className="text-sm text-muted-foreground">
                  <strong>Solution:</strong> Verify all mounting bolts are tight. Ensure truck is on level ground.
                  Check that height adjustment pins are fully seated. Confirm safety strap is attached.
                </p>
              </div>

              <div className="bg-muted/30 p-4 rounded">
                <h3 className="font-semibold mb-2">Pins difficult to insert/remove</h3>
                <p className="text-sm text-muted-foreground">
                  <strong>Solution:</strong> Apply light oil to pins and holes. Ensure components are properly aligned.
                  May require slight adjustment of ramp position.
                </p>
              </div>

              <div className="bg-muted/30 p-4 rounded">
                <h3 className="font-semibold mb-2">Excessive noise or squeaking</h3>
                <p className="text-sm text-muted-foreground">
                  <strong>Solution:</strong> Lubricate all moving parts and pivot points. Check for loose hardware
                  and tighten as needed. Verify no parts are rubbing where they shouldn't.
                </p>
              </div>
            </div>
          </div>

          {/* Safety Tips */}
          <div className="mb-12 bg-red-50 dark:bg-red-950/20 border-l-4 border-red-600 p-6 rounded-r">
            <h2 className="text-xl font-bold mb-4">Safety Reminders for Loading</h2>
            <ul className="space-y-2 text-sm">
              <li className="flex gap-2">
                <span className="text-red-600 font-bold">•</span>
                <span>Always park on level ground with parking brake engaged</span>
              </li>
              <li className="flex gap-2">
                <span className="text-red-600 font-bold">•</span>
                <span>Never exceed the weight capacity of your ramp</span>
              </li>
              <li className="flex gap-2">
                <span className="text-red-600 font-bold">•</span>
                <span>Use the safety strap every single time</span>
              </li>
              <li className="flex gap-2">
                <span className="text-red-600 font-bold">•</span>
                <span>Keep ramp surface clean and dry for maximum traction</span>
              </li>
              <li className="flex gap-2">
                <span className="text-red-600 font-bold">•</span>
                <span>Have a helper spot you during loading when possible</span>
              </li>
              <li className="flex gap-2">
                <span className="text-red-600 font-bold">•</span>
                <span>Ride motorcycle up in first gear at steady speed (no hesitation)</span>
              </li>
              <li className="flex gap-2">
                <span className="text-red-600 font-bold">•</span>
                <span>Never load/unload in wet, icy, or windy conditions</span>
              </li>
            </ul>
          </div>

        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-muted/50 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Need Installation Help?</h2>
          <p className="text-muted-foreground mb-6">
            Our customer service team is available to assist with installation questions and troubleshooting.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="bg-[#F78309] hover:bg-[#F78309]/90">
              <Link href="/contact">Contact Support</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/faq">View FAQ</Link>
            </Button>
          </div>
          <div className="mt-8 text-sm text-muted-foreground">
            <p>
              Phone: <a href="tel:8006874410" className="hover:text-[#F78309]">800-687-4410</a>
              {' | '}
              Email: <a href="mailto:support@ezcycleramp.com" className="hover:text-[#F78309]">support@ezcycleramp.com</a>
            </p>
            <p className="mt-2">
              Monday-Friday 8 AM - 6 PM EST | Saturday 9 AM - 2 PM EST
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
