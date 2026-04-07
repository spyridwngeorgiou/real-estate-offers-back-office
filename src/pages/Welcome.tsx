import { useNavigate } from 'react-router-dom'
import { Building2, FileText, Users, BarChart3, Upload, GitCompare, Bell, CheckCircle, Wrench, Home } from 'lucide-react'
import { Topbar } from '../components/layout/Topbar'
import { Button } from '../components/ui/Button'

const STEPS = [
  {
    icon: Building2,
    color: 'bg-blue-100 text-blue-700',
    title: '1. Καταχωρίστε Ακίνητα',
    description: 'Προσθέστε ακίνητα προς πώληση, ενοικίαση ή ανακαίνιση — διαμερίσματα, μεζονέτες, βίλες, οικόπεδα, επαγγελματικά. Συμπληρώστε τετραγωνικά, ενεργειακή κλάση, τιμή και ανεβάστε φωτογραφίες. Καταστάσεις: Προς Πώληση, Προς Ενοικίαση, Υπό Ανακαίνιση, Εκτός Αγοράς κ.ά.',
  },
  {
    icon: Users,
    color: 'bg-purple-100 text-purple-700',
    title: '2. Προσθέστε Επαφές',
    description: 'Διαχειριστείτε αγοραστές, πωλητές, ενοικιαστές, μεσίτες, συμβολαιογράφους, δικηγόρους, αναδόχους και προμηθευτές. Κάθε επαφή συνδέεται αυτόματα με τις προσφορές της.',
  },
  {
    icon: FileText,
    color: 'bg-green-100 text-green-700',
    title: '3. Καταγράψτε Προσφορές',
    description: 'Για κάθε ακίνητο καταγράψτε προσφορές αγοράς, ενοικίασης ή εργασιών ανακαίνισης (ηλεκτρολογικά, υδραυλικά, HVAC, δομικά, δάπεδα, κουφώματα, βαψίματα κ.ά.). Παρακολουθήστε τιμή, ημερομηνίες και κατάσταση.',
  },
  {
    icon: Wrench,
    color: 'bg-orange-100 text-orange-700',
    title: '4. Διαχειριστείτε Ανακαινίσεις',
    description: 'Καταγράψτε προσφορές από αναδόχους ανά ειδικότητα (ολική/μερική ανακαίνιση, θερμομόνωση, στέγη, φινίρισμα κ.ά.). Συγκρίνετε τιμές, παρακολουθήστε την εξέλιξη και διατηρήστε ιστορικό αντιπροσφορών.',
  },
  {
    icon: GitCompare,
    color: 'bg-cyan-100 text-cyan-700',
    title: '5. Συγκρίνετε Προσφορές',
    description: 'Επιλέξτε 2-4 προσφορές και συγκρίνετέ τες δίπλα-δίπλα. Δείτε ποια έχει την καλύτερη τιμή, προκαταβολή και όρους — για αγορά, ενοικίαση ή εργασίες.',
  },
  {
    icon: Upload,
    color: 'bg-red-100 text-red-700',
    title: '6. Επισυνάψτε Έγγραφα',
    description: 'Ανεβάστε PDFs, φωτογραφίες, τοπογραφικά και συμβόλαια απευθείας στο ακίνητο, την προσφορά ή την επαφή. Αποθηκεύονται στο cloud (25GB δωρεάν).',
  },
  {
    icon: Bell,
    color: 'bg-yellow-100 text-yellow-700',
    title: '7. Συνεργασία σε Πραγματικό Χρόνο',
    description: 'Πολλαπλοί χρήστες μπορούν να συνδεθούν ταυτόχρονα. Οι αλλαγές εμφανίζονται αμέσως σε όλους χωρίς refresh. Για πρόσβαση νέου χρήστη, επικοινωνήστε με τον διαχειριστή.',
  },
  {
    icon: BarChart3,
    color: 'bg-indigo-100 text-indigo-700',
    title: '8. Αναλύστε τα Δεδομένα',
    description: 'Η σελίδα Αναλυτικά δείχνει ποσοστό επιτυχίας, μέση τιμή προσφορών, κατανομή ανά κατάσταση και κατηγορία, και τάσεις ανά μήνα.',
  },
]

const PROPERTY_STATUSES = [
  { label: 'Προς Πώληση', color: 'bg-blue-100 text-blue-700' },
  { label: 'Υπό Διαπραγμάτευση', color: 'bg-amber-100 text-amber-700' },
  { label: 'Πουλήθηκε', color: 'bg-green-100 text-green-700' },
  { label: 'Προς Ενοικίαση', color: 'bg-teal-100 text-teal-700' },
  { label: 'Ενοικιάστηκε', color: 'bg-cyan-100 text-cyan-700' },
  { label: 'Προς Ανακαίνιση', color: 'bg-orange-100 text-orange-700' },
  { label: 'Υπό Ανακαίνιση', color: 'bg-yellow-100 text-yellow-700' },
  { label: 'Έληξε / Εκτός Αγοράς', color: 'bg-slate-100 text-slate-600' },
]

const OFFER_CATEGORIES = [
  { group: 'Αγοραπωλησία & Ενοικίαση', items: ['Αγορά Ακινήτου', 'Ενοικίαση Ακινήτου'] },
  { group: 'Ανακαίνιση', items: ['Ολική Ανακαίνιση', 'Μερική Ανακαίνιση', 'Ηλεκτρολογικά', 'Υδραυλικά', 'Κλιματισμός / HVAC', 'Δομικά', 'Θερμομόνωση', 'Δάπεδα / Πλακάκια', 'Βαψίματα', 'Κουφώματα', 'Στέγη', 'Φινίρισμα'] },
  { group: 'Λοιπά', items: ['Εξοπλισμός', 'Νομικές / Συμβολαιογραφικές', 'Άλλο'] },
]

export function Welcome() {
  const navigate = useNavigate()

  function handleStart() {
    localStorage.setItem('re_onboarded', '1')
    navigate('/')
  }

  return (
    <div>
      <Topbar title="Οδηγός Χρήσης" actions={
        <Button variant="primary" onClick={handleStart}>
          <CheckCircle size={16} /> Ξεκινήστε
        </Button>
      } />
      <div className="p-4 lg:p-8 max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Building2 size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-3">RE Back Office</h1>
          <p className="text-slate-500 text-lg max-w-xl mx-auto">
            Διαχείριση ακινήτων, προσφορών αγοραπωλησίας, ενοικίασης και ανακαίνισης — όλα σε ένα μέρος.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-10">
          {STEPS.map(({ icon: Icon, color, title, description }) => (
            <div key={title} className="bg-white rounded-xl border border-slate-200 p-5 flex gap-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
                <Icon size={20} />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 mb-1">{title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Property statuses reference */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Home size={18} className="text-slate-600" />
            <h2 className="font-semibold text-slate-900">Καταστάσεις Ακινήτου</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {PROPERTY_STATUSES.map(s => (
              <span key={s.label} className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${s.color}`}>
                {s.label}
              </span>
            ))}
          </div>
        </div>

        {/* Offer categories reference */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <FileText size={18} className="text-slate-600" />
            <h2 className="font-semibold text-slate-900">Κατηγορίες Προσφορών</h2>
          </div>
          <div className="space-y-3">
            {OFFER_CATEGORIES.map(g => (
              <div key={g.group}>
                <p className="text-xs font-semibold text-slate-400 uppercase mb-1.5">{g.group}</p>
                <div className="flex flex-wrap gap-2">
                  {g.items.map(item => (
                    <span key={item} className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 text-center">
          <p className="text-blue-800 font-medium mb-1">Έτοιμοι να ξεκινήσετε;</p>
          <p className="text-blue-600 text-sm mb-4">Ξεκινήστε με την προσθήκη του πρώτου σας ακινήτου.</p>
          <Button variant="primary" onClick={handleStart}>
            <CheckCircle size={16} /> Πήγαινε στο Dashboard
          </Button>
        </div>
      </div>
    </div>
  )
}
