import { fmtMoney, fmtDate, OFFER_STATUS_LABELS } from './utils'

// ─── Category definitions ────────────────────────────────────────────────────

export const EMAIL_TEMPLATE_CATEGORIES: Record<string, string> = {
  offer:        'Προσφορά',
  counter_offer:'Αντιπροσφορά',
  acceptance:   'Αποδοχή',
  rejection:    'Απόρριψη',
  follow_up:    'Follow-up',
  general:      'Γενικό',
}

// ─── Variable definitions (shown as hints in the editor) ─────────────────────

export const TEMPLATE_VARIABLES: { key: string; label: string; example: string }[] = [
  { key: 'contact_name',      label: 'Όνομα επαφής / αγοραστή',     example: 'Γιώργος Παπαδόπουλος' },
  { key: 'contact_email',     label: 'Email επαφής',                 example: 'g.papadopoulos@gmail.com' },
  { key: 'contact_phone',     label: 'Τηλέφωνο επαφής',             example: '6912345678' },
  { key: 'property_address',  label: 'Διεύθυνση ακινήτου',           example: 'Λαζαράκη 32, Αθήνα' },
  { key: 'offer_price',       label: 'Τιμή προσφοράς',              example: '€285.000' },
  { key: 'offer_date',        label: 'Ημερομηνία προσφοράς',        example: '14 Απρ 2026' },
  { key: 'offer_status',      label: 'Κατάσταση προσφοράς',         example: 'Αποδεκτή' },
  { key: 'date',              label: 'Σημερινή ημερομηνία',          example: fmtDate(new Date().toISOString()) },
]

// ─── Substitution ────────────────────────────────────────────────────────────

export function substituteVars(text: string, vars: Record<string, string>): string {
  return text.replace(/\{\{(\w+)\}\}/g, (_match, key) => vars[key] ?? `{{${key}}}`)
}

// Build vars record from offer context
export function offerVars(offer: any): Record<string, string> {
  const contactName = offer.buyer?.full_name ?? offer.contractor?.full_name ?? ''
  return {
    contact_name:     contactName,
    contact_email:    offer.buyer?.email ?? offer.contractor?.email ?? '',
    contact_phone:    offer.buyer?.mobile ?? offer.buyer?.phone ?? offer.contractor?.mobile ?? offer.contractor?.phone ?? '',
    property_address: [offer.property?.address, offer.property?.city].filter(Boolean).join(', '),
    offer_price:      fmtMoney(offer.offer_price),
    offer_date:       fmtDate(offer.offer_date),
    offer_status:     OFFER_STATUS_LABELS[offer.status] ?? offer.status ?? '',
    date:             fmtDate(new Date().toISOString()),
  }
}

// Build vars record from contact context
export function contactVars(contact: any): Record<string, string> {
  return {
    contact_name:  contact.full_name ?? '',
    contact_email: contact.email ?? '',
    contact_phone: contact.mobile ?? contact.phone ?? '',
    date:          fmtDate(new Date().toISOString()),
  }
}
