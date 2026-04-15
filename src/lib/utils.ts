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
  for_rent: 'Προς Ενοικίαση', rented: 'Ενοικιάστηκε',
  for_renovation: 'Προς Ανακαίνιση', under_renovation: 'Υπό Ανακαίνιση',
}

export const OFFER_STATUS_LABELS: Record<string, string> = {
  pending: 'Εκκρεμής', countered: 'Αντιπροσφορά', accepted: 'Αποδεκτή',
  rejected: 'Απορρίφθηκε', withdrawn: 'Ανακλήθηκε', signed: 'Υπογράφηκε',
}

export const CONTACT_TYPE_LABELS: Record<string, string> = {
  buyer: 'Αγοραστής', seller: 'Πωλητής', agent: 'Μεσίτης',
  notary: 'Συμβολαιογράφος', lawyer: 'Δικηγόρος',
  supplier: 'Προμηθευτής', contractor: 'Ανάδοχος', other: 'Άλλο',
}

export const OFFER_CATEGORY_LABELS: Record<string, string> = {
  // Αγοραπωλησία
  purchase: 'Αγορά Ακινήτου',
  // Ενοικίαση
  rental: 'Ενοικίαση Ακινήτου',
  // Νέα Κατασκευή
  new_construction: 'Νέα Κατασκευή',
  construction_full: 'Ολοκληρωμένη Κατασκευή',
  demolition: 'Κατεδάφιση',
  masonry: 'Κτίσιμο / Τοιχοποιία',
  concrete: 'Σκυρόδεμα / Σκελετός',
  // Ανακαίνιση — γενικά
  renovation_full: 'Ολική Ανακαίνιση',
  renovation_partial: 'Μερική Ανακαίνιση',
  // Τεχνικές Εργασίες — ειδικότητες
  electrical: 'Ηλεκτρολογικά',
  plumbing: 'Υδραυλικά',
  hvac: 'Κλιματισμός / HVAC',
  structural: 'Δομικά / Κατασκευαστικά',
  insulation: 'Θερμομόνωση / Μόνωση',
  flooring: 'Δάπεδα / Πλακάκια',
  painting: 'Βαψίματα / Χρωματισμός',
  windows: 'Κουφώματα / Παράθυρα',
  roofing: 'Στέγη / Στέγαση',
  finishing: 'Φινίρισμα / Αποπεράτωση',
  landscaping: 'Διαμόρφωση Χώρου',
  elevator: 'Ανελκυστήρας',
  // Λοιπά
  equipment: 'Εξοπλισμός',
  legal: 'Νομικές / Συμβολαιογραφικές',
  other: 'Άλλο',
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

export function exportCSV(rows: Record<string, any>[], filename: string) {
  if (!rows.length) return
  const headers = Object.keys(rows[0])
  const escape = (v: any) => `"${String(v ?? '').replace(/"/g, '""')}"`
  const csv = [headers.join(','), ...rows.map(r => headers.map(h => escape(r[h])).join(','))].join('\n')
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}

export const FILE_LABELS = [
  'Προσφορά PDF', 'Τίτλος Ιδιοκτησίας', 'Πιστοποιητικό Ενεργειακής Απόδοσης',
  'Φωτογραφία', 'Συμβόλαιο', 'Τοπογραφικό', 'Κάτοψη', 'Άλλο',
]
