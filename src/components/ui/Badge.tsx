interface BadgeProps {
  label: string
  variant: 'pending' | 'countered' | 'accepted' | 'rejected' | 'withdrawn' | 'signed' |
           'listed' | 'under_offer' | 'sold' | 'expired' | 'off_market' |
           'buyer' | 'seller' | 'agent' | 'notary' | 'lawyer' | 'other' | 'default'
}

const VARIANTS: Record<string, string> = {
  pending:      'bg-amber-100 text-amber-800',
  countered:    'bg-blue-100 text-blue-800',
  accepted:     'bg-green-100 text-green-800',
  rejected:     'bg-red-100 text-red-800',
  withdrawn:    'bg-slate-100 text-slate-600',
  signed:       'bg-emerald-100 text-emerald-800',
  listed:       'bg-blue-100 text-blue-800',
  under_offer:  'bg-amber-100 text-amber-800',
  sold:         'bg-green-100 text-green-800',
  expired:      'bg-slate-100 text-slate-600',
  off_market:   'bg-slate-100 text-slate-600',
  buyer:        'bg-purple-100 text-purple-800',
  seller:       'bg-orange-100 text-orange-800',
  agent:        'bg-cyan-100 text-cyan-800',
  notary:       'bg-indigo-100 text-indigo-800',
  lawyer:       'bg-pink-100 text-pink-800',
  other:        'bg-slate-100 text-slate-600',
  default:      'bg-slate-100 text-slate-600',
}

export function Badge({ label, variant }: BadgeProps) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${VARIANTS[variant] ?? VARIANTS.default}`}>
      {label}
    </span>
  )
}
