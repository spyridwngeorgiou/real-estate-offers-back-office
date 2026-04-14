interface BadgeProps {
  label: string
  variant: 'pending' | 'countered' | 'accepted' | 'rejected' | 'withdrawn' | 'signed' |
           'listed' | 'under_offer' | 'sold' | 'expired' | 'off_market' | 'for_rent' | 'rented' | 'for_renovation' | 'under_renovation' |
           'buyer' | 'seller' | 'agent' | 'notary' | 'lawyer' | 'supplier' | 'contractor' | 'other' | 'default'
}

const VARIANTS: Record<string, string> = {
  pending:      'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  countered:    'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  accepted:     'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
  rejected:     'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
  withdrawn:    'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400',
  signed:       'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
  listed:       'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  under_offer:  'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  sold:         'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
  expired:          'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400',
  off_market:       'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400',
  for_rent:         'bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300',
  rented:           'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/40 dark:text-cyan-300',
  for_renovation:   'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300',
  under_renovation: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300',
  buyer:        'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300',
  seller:       'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300',
  agent:        'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/40 dark:text-cyan-300',
  notary:       'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300',
  lawyer:       'bg-pink-100 text-pink-800 dark:bg-pink-900/40 dark:text-pink-300',
  supplier:     'bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300',
  contractor:   'bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-300',
  other:        'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400',
  default:      'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400',
}

export function Badge({ label, variant }: BadgeProps) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${VARIANTS[variant] ?? VARIANTS.default}`}>
      {label}
    </span>
  )
}
