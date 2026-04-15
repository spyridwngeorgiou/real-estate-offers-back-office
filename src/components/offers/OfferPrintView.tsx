import { fmtMoney, fmtDate, OFFER_STATUS_LABELS, OFFER_CATEGORY_LABELS, FINANCING_OPTIONS, transferTax } from '../../lib/utils'

// Rendered hidden on screen; visible only @media print via data-print="show"
// The parent calls window.print() to trigger browser Print→Save as PDF.

interface OfferPrintViewProps {
  offer: any
}

function Row({ label, value }: { label: string; value?: string | number | null }) {
  if (value == null || value === '' || value === '—') return null
  return (
    <tr>
      <td style={{ padding: '4px 8px 4px 0', color: '#64748b', fontSize: '10pt', width: '45%', verticalAlign: 'top', borderBottom: '1px solid #f1f5f9' }}>{label}</td>
      <td style={{ padding: '4px 0 4px 8px', fontWeight: 500, fontSize: '10pt', verticalAlign: 'top', borderBottom: '1px solid #f1f5f9' }}>{value}</td>
    </tr>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="print-card" style={{ marginBottom: '20px', breakInside: 'avoid' }}>
      <div style={{ borderBottom: '2px solid #2563eb', paddingBottom: '4px', marginBottom: '10px' }}>
        <span style={{ fontSize: '10pt', fontWeight: 700, color: '#2563eb', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{title}</span>
      </div>
      {children}
    </div>
  )
}

export function OfferPrintView({ offer }: OfferPrintViewProps) {
  const counterOffers = [...(offer.counter_offers ?? [])].sort((a: any, b: any) => a.round - b.round)
  const financing = FINANCING_OPTIONS.find(f => f.value === offer.financing)?.label ?? offer.financing
  const category = OFFER_CATEGORY_LABELS[offer.category] ?? offer.category
  const status = OFFER_STATUS_LABELS[offer.status] ?? offer.status
  const isPurchase = !offer.category || offer.category === 'purchase'
  const tax = isPurchase ? transferTax(offer.offer_price) : null
  const vatAmount = offer.vat_rate && offer.vat_rate > 0
    ? (offer.vat_included
        ? Math.round(offer.offer_price - offer.offer_price / (1 + offer.vat_rate / 100))
        : Math.round(offer.offer_price * offer.vat_rate / 100))
    : null

  const printedAt = new Date().toLocaleDateString('el-GR', { day: '2-digit', month: 'long', year: 'numeric' })

  return (
    <div
      data-print="show"
      style={{
        display: 'none', // hidden on screen; print CSS overrides to block
        fontFamily: 'Arial, Helvetica, sans-serif',
        color: '#0f172a',
        background: 'white',
        padding: 0,
        maxWidth: '100%',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', paddingBottom: '16px', borderBottom: '3px solid #2563eb' }}>
        <div>
          <div style={{ fontSize: '20pt', fontWeight: 800, color: '#1e293b', lineHeight: 1.1 }}>
            Προσφορά Αγοράς
          </div>
          {category && (
            <div style={{ fontSize: '11pt', color: '#64748b', marginTop: '4px' }}>{category}</div>
          )}
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '22pt', fontWeight: 800, color: '#2563eb' }}>{fmtMoney(offer.offer_price)}</div>
          <div style={{ display: 'inline-block', marginTop: '6px', padding: '3px 10px', borderRadius: '20px', fontSize: '9pt', fontWeight: 700,
            background: offer.status === 'accepted' || offer.status === 'signed' ? '#dcfce7' : offer.status === 'rejected' || offer.status === 'withdrawn' ? '#fee2e2' : '#dbeafe',
            color: offer.status === 'accepted' || offer.status === 'signed' ? '#15803d' : offer.status === 'rejected' || offer.status === 'withdrawn' ? '#dc2626' : '#1d4ed8',
          }}>{status}</div>
        </div>
      </div>

      {/* Property */}
      <Section title="Ακίνητο">
        <div style={{ fontSize: '12pt', fontWeight: 700, marginBottom: '4px' }}>
          {offer.property?.address ?? '—'}
          {offer.property?.city ? `, ${offer.property.city}` : ''}
        </div>
        {offer.property?.list_price && (
          <div style={{ fontSize: '10pt', color: '#64748b' }}>
            Ζητούμενη τιμή: {fmtMoney(offer.property.list_price)}
            {offer.property.list_price && offer.offer_price && (
              <> &nbsp;·&nbsp; Διαφορά: {((offer.offer_price - offer.property.list_price) / offer.property.list_price * 100).toFixed(1)}%</>
            )}
          </div>
        )}
      </Section>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Financial */}
        <Section title="Οικονομικά Στοιχεία">
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              {offer.scope && <Row label="Εύρος Εργασιών" value={offer.scope} />}
              <Row label="Τιμή Προσφοράς" value={fmtMoney(offer.offer_price)} />
              {offer.vat_rate != null && offer.vat_rate > 0 && <>
                <Row label="ΦΠΑ" value={`${offer.vat_rate}% ${offer.vat_included ? '(περιλαμβάνεται)' : ''}`} />
                {vatAmount != null && <Row label={offer.vat_included ? 'Καθαρή Αξία' : 'Τελική με ΦΠΑ'} value={fmtMoney(offer.vat_included ? offer.offer_price - vatAmount : offer.offer_price + vatAmount)} />}
              </>}
              {isPurchase && tax != null && <Row label="Φόρος Μεταβίβασης (3%)" value={fmtMoney(tax)} />}
              <Row label="Αρραβώνας" value={fmtMoney(offer.earnest_money)} />
              <Row label="Ίδια Κεφάλαια" value={fmtMoney(offer.down_payment)} />
              <Row label="Χρηματοδότηση" value={financing} />
              {offer.due_diligence_days && <Row label="Due Diligence" value={`${offer.due_diligence_days} ημέρες`} />}
            </tbody>
          </table>
        </Section>

        {/* Dates */}
        <Section title="Ημερομηνίες">
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              <Row label="Ημ. Προσφοράς" value={fmtDate(offer.offer_date)} />
              <Row label="Λήξη Προσφοράς" value={fmtDate(offer.expires_at)} />
              <Row label="Ημ. Υπογραφής" value={fmtDate(offer.signing_date)} />
            </tbody>
          </table>
        </Section>
      </div>

      {/* Parties */}
      <Section title="Εμπλεκόμενα Μέρη">
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <tbody>
            {offer.buyer?.full_name && <>
              <Row label="Αγοραστής" value={offer.buyer.full_name} />
              {offer.buyer.phone && <Row label="Τηλ. Αγοραστή" value={offer.buyer.phone} />}
              {offer.buyer.email && <Row label="Email Αγοραστή" value={offer.buyer.email} />}
            </>}
            {offer.contractor?.full_name && <>
              <Row label="Ανάδοχος" value={offer.contractor.full_name} />
              {offer.contractor.phone && <Row label="Τηλ. Αναδόχου" value={offer.contractor.phone} />}
            </>}
            {offer.buyer_agent?.full_name && <Row label="Μεσίτης Αγοραστή" value={offer.buyer_agent.full_name} />}
            {offer.seller_agent?.full_name && <Row label="Μεσίτης Πωλητή" value={offer.seller_agent.full_name} />}
            {offer.notary?.full_name && <Row label="Συμβολαιογράφος" value={offer.notary.full_name} />}
          </tbody>
        </table>
      </Section>

      {/* Terms */}
      {(offer.special_terms || offer.internal_notes) && (
        <Section title="Όροι & Σημειώσεις">
          {offer.special_terms && (
            <div style={{ marginBottom: '8px' }}>
              <div style={{ fontSize: '9pt', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '3px' }}>Ειδικοί Όροι</div>
              <div style={{ fontSize: '10pt', lineHeight: 1.5 }}>{offer.special_terms}</div>
            </div>
          )}
          {offer.internal_notes && (
            <div>
              <div style={{ fontSize: '9pt', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '3px' }}>Εσωτερικές Σημειώσεις</div>
              <div style={{ fontSize: '10pt', lineHeight: 1.5 }}>{offer.internal_notes}</div>
            </div>
          )}
        </Section>
      )}

      {/* Counter offers */}
      {counterOffers.length > 0 && (
        <Section title={`Ιστορικό Αντιπροσφορών (${counterOffers.length})`}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10pt' }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                <th style={{ padding: '6px 8px', textAlign: 'left', fontWeight: 600, color: '#64748b', fontSize: '9pt', borderBottom: '1px solid #e2e8f0' }}>Γύρος</th>
                <th style={{ padding: '6px 8px', textAlign: 'left', fontWeight: 600, color: '#64748b', fontSize: '9pt', borderBottom: '1px solid #e2e8f0' }}>Τιμή</th>
                <th style={{ padding: '6px 8px', textAlign: 'left', fontWeight: 600, color: '#64748b', fontSize: '9pt', borderBottom: '1px solid #e2e8f0' }}>Από</th>
                <th style={{ padding: '6px 8px', textAlign: 'left', fontWeight: 600, color: '#64748b', fontSize: '9pt', borderBottom: '1px solid #e2e8f0' }}>Ημερομηνία</th>
                <th style={{ padding: '6px 8px', textAlign: 'left', fontWeight: 600, color: '#64748b', fontSize: '9pt', borderBottom: '1px solid #e2e8f0' }}>Σημειώσεις</th>
              </tr>
            </thead>
            <tbody>
              {counterOffers.map((c: any) => (
                <tr key={c.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '5px 8px', color: '#64748b' }}>#{c.round}</td>
                  <td style={{ padding: '5px 8px', fontWeight: 700 }}>{fmtMoney(c.counter_price)}</td>
                  <td style={{ padding: '5px 8px' }}>{c.from_party === 'seller' ? 'Πωλητής' : c.from_party === 'buyer' ? 'Αγοραστής' : c.from_party ?? '—'}</td>
                  <td style={{ padding: '5px 8px', color: '#94a3b8' }}>{fmtDate(c.counter_date)}</td>
                  <td style={{ padding: '5px 8px', color: '#94a3b8', fontSize: '9pt' }}>{c.notes ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>
      )}

      {/* Footer */}
      <div style={{ marginTop: '32px', paddingTop: '12px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', fontSize: '9pt', color: '#94a3b8' }}>
        <span>RE Offers Greece</span>
        <span>Εκτυπώθηκε: {printedAt}</span>
        <span>Εμπιστευτικό — Εσωτερική χρήση</span>
      </div>
    </div>
  )
}
