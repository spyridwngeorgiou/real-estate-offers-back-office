export function fmtMoney(v: number | null | undefined): string {
  if (v == null) return '—'
  return '€' + v.toLocaleString('el-GR')
}

export function fmtDate(d: string | null | undefined): string {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('el-GR', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(ms / 60000)
  if (mins < 1) return 'μόλις τώρα'
  if (mins < 60) return `${mins}λ πριν`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}ω πριν`
  const days = Math.floor(hrs / 24)
  if (days < 30) return `${days}μ πριν`
  return fmtDate(iso)
}

export function pricePerSqm(price: number | null, sqm: number | null): string {
  if (!price || !sqm) return '—'
  return '€' + Math.round(price / sqm).toLocaleString('el-GR') + '/τ.μ.'
}

export function transferTax(price: number): number {
  return Math.round(price * 0.03)
}

export const PROPERTY_TYPE_LABELS: Record<string, string> = {
  apartment: 'Διαμέρισμα', maisonette: 'Μεζονέτα', villa: 'Βίλα',
  single_family: 'Μονοκατοικία', plot: 'Οικόπεδο', commercial: 'Επαγγελματικό',
  office: 'Γραφείο', other: 'Άλλο',
}

export const PROPERTY_STATUS_LABELS: Record<string, string> = {
  listed: 'Προς Πώληση', under_offer: 'Υπό Διαπραγμάτευση',
  sold: 'Πουλήθηκε', expired: 'Έληξε', off_market: 'Εκτός Αγοράς',
}

export const OFFER_STATUS_LABELS: Record<string, string> = {
  pending: 'Εκκρεμής', countered: 'Αντιπροσφορά', accepted: 'Αποδεκτή',
  rejected: 'Απορρίφθηκε', withdrawn: 'Ανακλήθηκε', signed: 'Υπογράφηκε',
}

export const CONTACT_TYPE_LABELS: Record<string, string> = {
  buyer: 'Αγοραστής', seller: 'Πωλητής', agent: 'Μεσίτης',
  notary: 'Συμβολαιογράφος', lawyer: 'Δικηγόρος', other: 'Άλλο',
}

export const FLOOR_OPTIONS = [
  { value: 'basement', label: 'Υπόγειο' },
  { value: 'ground', label: 'Ισόγειο' },
  { value: '1st', label: '1ος' },
  { value: '2nd', label: '2ος' },
  { value: '3rd', label: '3ος' },
  { value: '4th', label: '4ος' },
  { value: '5th', label: '5ος' },
  { value: '6th_plus', label: '6ος+' },
  { value: 'penthouse', label: 'Ρετιρέ' },
]

export const ENERGY_RATINGS = ['A+', 'A', 'B+', 'B', 'C', 'D', 'E', 'F', 'G']

export const FINANCING_OPTIONS = [
  { value: 'cash', label: 'Μετρητά' },
  { value: 'mortgage', label: 'Στεγαστικό Δάνειο' },
  { value: 'pre_approved', label: 'Προεγκεκριμένο Δάνειο' },
  { value: 'other', label: 'Άλλο' },
]

export const FILE_LABELS = [
  'Προσφορά PDF', 'Τίτλος Ιδιοκτησίας', 'Πιστοποιητικό Ενεργειακής Απόδοσης',
  'Φωτογραφία', 'Συμβόλαιο', 'Τοπογραφικό', 'Κάτοψη', 'Άλλο',
]
