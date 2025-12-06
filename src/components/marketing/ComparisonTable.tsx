// ============================================
// EZ CYCLE RAMP — 3-COLUMN COMPARISON TABLE
// AUN 200 vs AUN 250 (center/featured) vs AUN 210
// ============================================

import Link from 'next/link'

export function ComparisonTable() {
  const specs = [
    {
      feature: "Best For",
      aun200: "Full-size truck beds (6.5'+)",
      aun250: "Short-bed trucks (5.5')",
      aun210: "Full-size truck beds (6.5'+)", // PLACEHOLDER - UPDATE WITH REAL SPECS
      highlight: true
    },
    {
      feature: "Max Length",
      aun200: '98.43" (8\' 2")',
      aun250: '81.10" (6\' 9") — folds to fit',
      aun210: '98.43" (8\' 2")', // PLACEHOLDER
    },
    {
      feature: "Weight Capacity",
      aun200: "1,200 lbs",
      aun250: "1,212 lbs",
      aun210: "1,200 lbs", // PLACEHOLDER
    },
    {
      feature: "Load Height",
      aun200: 'Up to 36" (60" with extender)',
      aun250: 'Up to 36" (60" with extender)',
      aun210: 'Up to 36" (60" with extender)', // PLACEHOLDER
    },
    {
      feature: "Tailgate Compatible",
      aun200: "Must remove or leave open",
      aun250: "✓ Close tailgate with ramp installed",
      aun210: "Must remove or leave open", // PLACEHOLDER
      highlight: true
    },
    {
      feature: "Fat Tire Support",
      aun200: 'Up to 11.81" rear tire',
      aun250: 'Up to 11.81" rear tire',
      aun210: 'Up to 11.81" rear tire', // PLACEHOLDER
    },
    {
      feature: "Material",
      aun200: "T6 6061 Aerospace Aluminum",
      aun250: "T6 6061 Aerospace Aluminum",
      aun210: "T6 6061 Aerospace Aluminum", // PLACEHOLDER
    },
    {
      feature: "Assembly Time",
      aun200: "~4 hours (DIY kit)",
      aun250: "~4 hours (DIY kit)",
      aun210: "~4 hours (DIY kit)", // PLACEHOLDER
    },
    {
      feature: "Price",
      aun200: "$2,495",
      aun250: "$2,795",
      aun210: "$2,495", // PLACEHOLDER - UPDATE WITH REAL PRICE
      highlight: true
    },
  ];

  return (
    <section className="py-16 bg-zinc-100 dark:bg-zinc-950">
      <div className="max-w-6xl mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-zinc-900 dark:text-white mb-4">
            Which Ramp Is Right for You?
          </h2>
          <p className="text-zinc-600 dark:text-zinc-400 text-lg">
            Three models. Same quality. Choose based on your truck bed.
          </p>
        </div>

        {/* Comparison Table */}
        <div className="overflow-x-auto mt-8">
          <table className="w-full border-collapse text-sm md:text-base border border-zinc-300 dark:border-zinc-800">
            <thead>
              <tr>
                {/* Empty corner cell */}
                <th className="p-4 text-left text-zinc-500 dark:text-zinc-500 font-medium border-b border-zinc-300 dark:border-zinc-800 w-1/4"></th>

                {/* AUN 200 Header */}
                <th className="p-4 text-center border-b border-l border-zinc-300 dark:border-zinc-800 w-1/4 align-bottom">
                  <div className="text-amber-600 dark:text-amber-500 font-bold text-xl">AUN 200</div>
                  <div className="text-zinc-500 dark:text-zinc-400 text-sm">Standard Ramp</div>
                </th>

                {/* AUN 250 Header - Center/Featured */}
                <th className="p-4 pt-12 text-center border-b border-l border-zinc-300 dark:border-zinc-800 bg-amber-500/10 dark:bg-amber-500/10 w-1/4 align-bottom relative">
                  {/* Floating badge - absolutely positioned */}
                  <span className="absolute top-3 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-amber-500 text-black text-xs font-bold rounded-full whitespace-nowrap">
                    MOST POPULAR
                  </span>
                  <div className="text-amber-600 dark:text-amber-500 font-bold text-xl">AUN 250</div>
                  <div className="text-zinc-500 dark:text-zinc-400 text-sm">Folding Ramp</div>
                </th>

                {/* AUN 210 Header */}
                <th className="p-4 text-center border-b border-l border-zinc-300 dark:border-zinc-800 w-1/4 align-bottom">
                  <div className="text-amber-600 dark:text-amber-500 font-bold text-xl">AUN 210</div>
                  <div className="text-zinc-500 dark:text-zinc-400 text-sm">{/* UPDATE SUBTITLE */}Standard Ramp</div>
                </th>
              </tr>
            </thead>
            <tbody>
              {specs.map((spec) => (
                <tr
                  key={spec.feature}
                  className={`border-b border-zinc-300 dark:border-zinc-800 ${spec.highlight ? 'bg-zinc-200/50 dark:bg-zinc-900/50' : ''}`}
                >
                  <td className="p-4 text-zinc-900 dark:text-zinc-100 font-bold">
                    {spec.feature}
                  </td>
                  <td className="p-4 text-center text-zinc-600 dark:text-zinc-400 border-l border-zinc-300 dark:border-zinc-800">
                    {spec.feature === "Tailgate Compatible" && spec.aun200.startsWith("✓") ? (
                      <span className="text-green-600 dark:text-green-400">{spec.aun200}</span>
                    ) : spec.aun200}
                  </td>
                  <td className="p-4 text-center text-zinc-600 dark:text-zinc-400 bg-amber-500/5 dark:bg-amber-500/5 border-l border-zinc-300 dark:border-zinc-800">
                    {spec.feature === "Tailgate Compatible" && spec.aun250.startsWith("✓") ? (
                      <span className="text-green-600 dark:text-green-400">{spec.aun250}</span>
                    ) : spec.aun250}
                  </td>
                  <td className="p-4 text-center text-zinc-600 dark:text-zinc-400 border-l border-zinc-300 dark:border-zinc-800">
                    {spec.feature === "Tailgate Compatible" && spec.aun210.startsWith("✓") ? (
                      <span className="text-green-600 dark:text-green-400">{spec.aun210}</span>
                    ) : spec.aun210}
                  </td>
                </tr>
              ))}
              {/* Shop Buttons Row */}
              <tr>
                <td className="p-4"></td>
                <td className="p-6 text-center border-l border-zinc-300 dark:border-zinc-800">
                  <Link
                    href="/products/aun-200-basic-ramp"
                    className="inline-block py-2 px-6 text-sm border-2 border-zinc-400 dark:border-zinc-600 hover:border-amber-500 dark:hover:border-amber-500 text-zinc-700 dark:text-white font-semibold rounded transition-colors"
                  >
                    Shop AUN 200
                  </Link>
                </td>
                <td className="p-6 text-center bg-amber-500/5 dark:bg-amber-500/5 border-l border-zinc-300 dark:border-zinc-800">
                  <Link
                    href="/products/aun-250-folding-ramp"
                    className="inline-block py-2 px-6 text-sm bg-amber-500 hover:bg-amber-400 text-black font-semibold rounded transition-colors"
                  >
                    Shop AUN 250
                  </Link>
                </td>
                <td className="p-6 text-center border-l border-zinc-300 dark:border-zinc-800">
                  <Link
                    href="/products/aun-210-standard-ramp"
                    className="inline-block py-2 px-6 text-sm border-2 border-zinc-400 dark:border-zinc-600 hover:border-amber-500 dark:hover:border-amber-500 text-zinc-700 dark:text-white font-semibold rounded transition-colors"
                  >
                    Shop AUN 210
                  </Link>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Help Text */}
        <p className="mt-8 text-center text-zinc-500 dark:text-zinc-500 text-sm">
          Not sure which one? <Link href="#configurator" className="text-amber-600 dark:text-amber-500 hover:underline">Use our configurator</Link> to find your perfect fit.
        </p>
      </div>
    </section>
  );
}

export default ComparisonTable;
