import { useState, useEffect } from 'react'
import { Copy, Check, MessageCircle } from 'lucide-react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { fmtMoney, fmtDate, OFFER_CATEGORY_LABELS, OFFER_STATUS_LABELS } from '../../lib/utils'

const WORK_CATEGORIES = new Set([
  'new_construction', 'construction_full', 'demolition', 'masonry', 'concrete',
  'renovation_full', 'renovation_partial',
  'electrical', 'plumbing', 'hvac', 'structural', 'insulation',
  'flooring', 'painting', 'windows', 'roofing', 'finishing',
  'landscaping', 'elevator', 'equipment',
])

function buildMessage(offer: any): string {
  const category = offer.category ?? ''
  const isWork = WORK_CATEGORIES.has(category)
  const property = [offer.property?.address, offer.property?.city].filter(Boolean).join(', ')
  const contact = offer.contractor?.full_name ?? offer.buyer?.full_name ?? ''
  const trade = OFFER_CATEGORY_LABELS[category] ?? category
  const status = OFFER_STATUS_LABELS[offer.status] ?? offer.status
  const scope = offer.scope ? `\nΕύρος εργασιών: ${offer.scope}` : ''
  const price = fmtMoney(offer.offer_price)
  const date = fmtDate(offer.offer_date)

  if (isWork) {
    if (offer.status === 'accepted' || offer.status === 'signed') {
      return `Αγαπητέ/ή ${contact},

με χαρά σας ενημερώνουμε ότι η προσφορά σας για *${trade}* στο ακίνητο *${property}* έχει γίνει αποδεκτή.${scope}

Ποσό: *${price}*
Ημερομηνία: ${date}

Παρακαλούμε επικοινωνήστε μαζί μας για τα επόμενα βήματα και τον καθορισμό έναρξης εργασιών.`
    }
    if (offer.status === 'rejected') {
      return `Αγαπητέ/ή ${contact},

σας ενημερώνουμε ότι η προσφορά σας για *${trade}* στο ακίνητο *${property}* δεν έγινε αποδεκτή αυτή τη φορά.${scope}

Ποσό προσφοράς: *${price}*

Σας ευχαριστούμε για τη συμμετοχή σας και ελπίζουμε σε μελλοντική συνεργασία.`
    }
    return `Αγαπητέ/ή ${contact},

σας στέλνουμε ενημέρωση για την προσφορά σας:

Εργασία: *${trade}*
Ακίνητο: *${property}*${scope}
Ποσό: *${price}*
Κατάσταση: ${status}
Ημερομηνία: ${date}

Για οποιαδήποτε διευκρίνιση είμαστε στη διάθεσή σας.`
  }

  // Purchase / rental offer
  if (offer.status === 'accepted' || offer.status === 'signed') {
    return `Αγαπητέ/ή ${contact},

με χαρά σας ενημερώνουμε ότι η προσφορά σας για το ακίνητο *${property}* έχει γίνει αποδεκτή.

Τιμή: *${price}*
Ημερομηνία: ${date}

Παρακαλούμε επικοινωνήστε μαζί μας για τα επόμενα βήματα.`
  }
  if (offer.status === 'countered') {
    const lastCounter = [...(offer.counter_offers ?? [])].sort((a: any, b: any) => b.round - a.round)[0]
    const counterPrice = lastCounter ? fmtMoney(lastCounter.counter_price) : '—'
    return `Αγαπητέ/ή ${contact},

αναφορικά με την προσφορά σας *${price}* για το ακίνητο *${property}*, σας ενημερώνουμε ότι έχει υποβληθεί αντιπροσφορά.

Αντιπροσφορά: *${counterPrice}*

Παρακαλούμε επικοινωνήστε μαζί μας για να συνεχίσουμε τη διαπραγμάτευση.`
  }
  if (offer.status === 'rejected') {
    return `Αγαπητέ/ή ${contact},

σας ενημερώνουμε ότι η προσφορά σας *${price}* για το ακίνητο *${property}* δεν έγινε αποδεκτή.

Σας ευχαριστούμε για το ενδιαφέρον σας. Είμαστε στη διάθεσή σας για να εξετάσουμε άλλες επιλογές.`
  }

  // Default / pending
  return `Αγαπητέ/ή ${contact},

σας στέλνουμε ενημέρωση για την προσφορά σας:

Ακίνητο: *${property}*
Τιμή: *${price}*
Κατάσταση: ${status}
Ημερομηνία: ${date}

Για οποιαδήποτε διευκρίνιση είμαστε στη διάθεσή σας.`
}

interface MessageModalProps {
  open: boolean
  onClose: () => void
  offer: any
}

export function MessageModal({ open, onClose, offer }: MessageModalProps) {
  const [text, setText] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (open) setText(buildMessage(offer))
  }, [open, offer])

  async function handleCopy() {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Modal open={open} onClose={onClose} title="Μήνυμα WhatsApp / Viber" size="md">
      <div className="space-y-4">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Επεξεργαστείτε το μήνυμα και αντιγράψτε το για να το στείλετε.
        </p>
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          rows={14}
          className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono leading-relaxed resize-none"
        />
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>Κλείσιμο</Button>
          <Button variant="primary" onClick={handleCopy}>
            {copied
              ? <><Check size={15} /> Αντιγράφηκε!</>
              : <><Copy size={15} /> Αντιγραφή</>
            }
          </Button>
        </div>
      </div>
    </Modal>
  )
}

// Small inline copy button for use in cards/tables
interface QuickCopyButtonProps {
  offer: any
  size?: 'sm' | 'xs'
}

export function QuickMessageButton({ offer, size = 'sm' }: QuickCopyButtonProps) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        onClick={e => { e.stopPropagation(); setOpen(true) }}
        className="flex items-center gap-1 text-xs text-slate-400 hover:text-green-600 dark:hover:text-green-400 transition-colors px-1.5 py-1 rounded hover:bg-green-50 dark:hover:bg-green-900/20"
        title="Δημιουργία μηνύματος WhatsApp"
      >
        <MessageCircle size={14} />
      </button>
      {open && <MessageModal open={open} onClose={() => setOpen(false)} offer={offer} />}
    </>
  )
}
