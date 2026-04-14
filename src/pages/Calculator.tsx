import { useState } from 'react'
import { Calculator as CalcIcon, Info } from 'lucide-react'
import { Topbar } from '../components/layout/Topbar'

function fmtEur(v: number) {
  return '€' + Math.round(v).toLocaleString('el-GR')
}

interface CostRow {
  label: string
  amount: number
  note?: string
  highlight?: boolean
}

function ResultRow({ label, amount, note, highlight }: CostRow) {
  return (
    <div className={`flex items-center justify-between py-3 border-b border-slate-100 dark:border-slate-700 last:border-0 ${highlight ? 'font-bold' : ''}`}>
      <div>
        <span className={`text-sm ${highlight ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'}`}>{label}</span>
        {note && <span className="ml-2 text-xs text-slate-400 dark:text-slate-500">{note}</span>}
      </div>
      <span className={`text-sm tabular-nums ${highlight ? 'text-blue-600 dark:text-blue-400 text-base' : 'text-slate-700 dark:text-slate-300'}`}>
        {fmtEur(amount)}
      </span>
    </div>
  )
}

export function Calculator() {
  const [price, setPrice] = useState('')
  const [agentRate, setAgentRate] = useState('2')
  const [notaryRate, setNotaryRate] = useState('1.2')
  const [includeVAT, setIncludeVAT] = useState(false)
  const [withMortgage, setWithMortgage] = useState(false)

  const p = parseFloat(price.replace(/[^0-9.]/g, '')) || 0

  // Transfer tax (Φόρος Μεταβίβασης) — 3% on objective value (we use offer price as proxy)
  const transferTax = p * 0.03
  // Notary fees — typically 1%–1.5% on contract value + VAT 24%
  const notaryBase = p * (parseFloat(notaryRate) / 100)
  const notaryVAT = includeVAT ? notaryBase * 0.24 : 0
  const notaryTotal = notaryBase + notaryVAT
  // Agent commission — configurable rate, + VAT 24%
  const agentBase = p * (parseFloat(agentRate) / 100)
  const agentVAT = includeVAT ? agentBase * 0.24 : 0
  const agentTotal = agentBase + agentVAT
  // Land registry / cadastre fees — approx 0.475% + fixed €50
  const registryFee = p * 0.00475 + 50
  // Mortgage bank costs (if applicable) — typical appraisal + file fees
  const mortgageCosts = withMortgage ? 600 : 0

  const totalExtra = transferTax + notaryTotal + agentTotal + registryFee + mortgageCosts
  const totalAcquisition = p + totalExtra

  return (
    <div>
      <Topbar title="Υπολογιστής Κόστους Αγοράς" />

      <div className="p-4 lg:p-6 space-y-6 max-w-3xl">
        {/* Info banner */}
        <div className="flex gap-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl p-4 text-sm text-blue-800 dark:text-blue-300">
          <Info size={16} className="mt-0.5 shrink-0" />
          <span>Ενδεικτικοί υπολογισμοί βάσει τρέχουσας ελληνικής νομοθεσίας. Συμβουλευτείτε συμβολαιογράφο για ακριβείς αμοιβές.</span>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Inputs */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-5 space-y-4">
            <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <CalcIcon size={16} className="text-blue-500" />
              Παράμετροι
            </h3>

            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 uppercase mb-1">
                Τιμή Αγοράς (€)
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={price}
                onChange={e => setPrice(e.target.value)}
                placeholder="π.χ. 250000"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 uppercase mb-1">
                Μεσιτική Αμοιβή (%)
              </label>
              <input
                type="number"
                min="0"
                max="10"
                step="0.5"
                value={agentRate}
                onChange={e => setAgentRate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 uppercase mb-1">
                Συμβολαιογραφικά (%)
              </label>
              <input
                type="number"
                min="0"
                max="5"
                step="0.1"
                value={notaryRate}
                onChange={e => setNotaryRate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-2 pt-1">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeVAT}
                  onChange={e => setIncludeVAT(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-slate-700 dark:text-slate-300">Συμπερίληψη ΦΠΑ 24% (αμοιβές)</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={withMortgage}
                  onChange={e => setWithMortgage(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-slate-700 dark:text-slate-300">Χρηματοδότηση μέσω δανείου</span>
              </label>
            </div>
          </div>

          {/* Results */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-5">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Ανάλυση Κόστους</h3>

            {p === 0 ? (
              <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-8">Εισάγετε τιμή αγοράς για υπολογισμό.</p>
            ) : (
              <>
                <ResultRow label="Τιμή Αγοράς" amount={p} />
                <div className="py-2 border-b border-slate-100 dark:border-slate-700">
                  <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase mb-1">Πρόσθετα Κόστη</p>
                </div>
                <ResultRow
                  label="Φόρος Μεταβίβασης"
                  amount={transferTax}
                  note="3%"
                />
                <ResultRow
                  label="Συμβολαιογραφικά"
                  amount={notaryTotal}
                  note={includeVAT ? `${notaryRate}% + ΦΠΑ 24%` : `${notaryRate}%`}
                />
                <ResultRow
                  label="Μεσιτική Αμοιβή"
                  amount={agentTotal}
                  note={includeVAT ? `${agentRate}% + ΦΠΑ 24%` : `${agentRate}%`}
                />
                <ResultRow
                  label="Τέλη Κτηματολογίου"
                  amount={registryFee}
                  note="~0.475% + €50"
                />
                {withMortgage && (
                  <ResultRow
                    label="Έξοδα Δανείου"
                    amount={mortgageCosts}
                    note="εκτίμηση + φάκελος"
                  />
                )}
                <div className="mt-3 pt-3 border-t-2 border-slate-200 dark:border-slate-600">
                  <ResultRow
                    label="Σύνολο Πρόσθετων Εξόδων"
                    amount={totalExtra}
                    highlight
                  />
                  <div className="flex items-center justify-between pt-3">
                    <span className="text-sm font-bold text-slate-900 dark:text-white">Συνολικό Κόστος Απόκτησης</span>
                    <span className="text-lg font-bold text-blue-600 dark:text-blue-400 tabular-nums">{fmtEur(totalAcquisition)}</span>
                  </div>
                  <div className="mt-2 text-right">
                    <span className="text-xs text-slate-400 dark:text-slate-500">
                      +{((totalExtra / p) * 100).toFixed(1)}% επί της τιμής αγοράς
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Quick reference table */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700">
            <h3 className="font-semibold text-slate-900 dark:text-white">Ενδεικτικό Κόστος ανά Εύρος Τιμής</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                  <th className="px-5 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Τιμή</th>
                  <th className="px-5 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Φόρος 3%</th>
                  <th className="px-5 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Νοταρ. 1.2%</th>
                  <th className="px-5 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Μεσίτης 2%</th>
                  <th className="px-5 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Σύνολο Εξόδων</th>
                </tr>
              </thead>
              <tbody>
                {[100000, 150000, 200000, 300000, 400000, 500000].map(v => {
                  const tax = v * 0.03
                  const notary = v * 0.012
                  const agent = v * 0.02
                  const registry = v * 0.00475 + 50
                  const total = tax + notary + agent + registry
                  return (
                    <tr key={v} className="border-b border-slate-50 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/30">
                      <td className="px-5 py-3 font-medium text-slate-900 dark:text-white">{fmtEur(v)}</td>
                      <td className="px-5 py-3 text-right text-slate-600 dark:text-slate-300">{fmtEur(tax)}</td>
                      <td className="px-5 py-3 text-right text-slate-600 dark:text-slate-300">{fmtEur(notary)}</td>
                      <td className="px-5 py-3 text-right text-slate-600 dark:text-slate-300">{fmtEur(agent)}</td>
                      <td className="px-5 py-3 text-right font-semibold text-blue-600 dark:text-blue-400">{fmtEur(total)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
