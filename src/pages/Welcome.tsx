import { useNavigate } from 'react-router-dom'
import { Building2, FileText, Users, BarChart3, Upload, GitCompare, Bell, CheckCircle } from 'lucide-react'
import { Topbar } from '../components/layout/Topbar'
import { Button } from '../components/ui/Button'

const STEPS = [
  {
    icon: Building2,
    color: 'bg-blue-100 text-blue-700',
    title: '1. Καταχωρίστε Ακίνητα',
    description: 'Ξεκινήστε προσθέτοντας τα ακίνητα που διαχειρίζεστε — διαμερίσματα, μεζονέτες, βίλες, οικόπεδα. Συμπληρώστε τετραγωνικά, ενεργειακή κλάση, τιμή ζήτησης και ανεβάστε φωτογραφίες.',
  },
  {
    icon: Users,
    color: 'bg-purple-100 text-purple-700',
    title: '2. Προσθέστε Επαφές',
    description: 'Διαχειριστείτε αγοραστές, πωλητές, μεσίτες και συμβολαιογράφους. Κάθε επαφή συνδέεται αυτόματα με τις προσφορές της.',
  },
  {
    icon: FileText,
    color: 'bg-green-100 text-green-700',
    title: '3. Καταγράψτε Προσφορές',
    description: 'Για κάθε ακίνητο καταγράψτε τις προσφορές με όλες τις λεπτομέρειες: τιμή, προκαταβολή, τρόπο χρηματοδότησης, ημερομηνία υπογραφής. Ο φόρος μεταβίβασης (3%) υπολογίζεται αυτόματα.',
  },
  {
    icon: GitCompare,
    color: 'bg-orange-100 text-orange-700',
    title: '4. Συγκρίνετε Προσφορές',
    description: 'Επιλέξτε 2-4 προσφορές για ένα ακίνητο και συγκρίνετέ τες δίπλα-δίπλα. Δείτε ποια έχει την καλύτερη τιμή, προκαταβολή και όρους.',
  },
  {
    icon: Upload,
    color: 'bg-red-100 text-red-700',
    title: '5. Επισυνάψτε Έγγραφα',
    description: 'Ανεβάστε PDFs, φωτογραφίες και συμβόλαια απευθείας στο ακίνητο, την προσφορά ή την επαφή. Αποθηκεύονται δωρεάν στο cloud (Cloudinary, 25GB).',
  },
  {
    icon: Bell,
    color: 'bg-yellow-100 text-yellow-700',
    title: '6. Παρακολουθείτε σε Πραγματικό Χρόνο',
    description: 'Οι συνεργάτες σας βλέπουν αλλαγές αμέσως χωρίς να χρειαστεί refresh. Μοιραστείτε τον σύνδεσμο της εφαρμογής και δουλεύετε ταυτόχρονα.',
  },
  {
    icon: BarChart3,
    color: 'bg-indigo-100 text-indigo-700',
    title: '7. Αναλύστε τα Δεδομένα',
    description: 'Η σελίδα Αναλυτικά δείχνει ποσοστό επιτυχίας, μέση τιμή προσφορών, κατανομή ανά κατάσταση και τάσεις ανά μήνα.',
  },
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
          <h1 className="text-3xl font-bold text-slate-900 mb-3">RE Offers Greece</h1>
          <p className="text-slate-500 text-lg max-w-xl mx-auto">
            Πλατφόρμα διαχείρισης προσφορών ακινήτων για μεσίτες και ομάδες. Όλα τα ακίνητα, οι προσφορές και τα έγγραφα σε ένα μέρος.
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
