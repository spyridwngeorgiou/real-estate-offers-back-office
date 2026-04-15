export type PropertyType = 'apartment' | 'maisonette' | 'villa' | 'single_family' | 'plot' | 'commercial' | 'office' | 'other'
export type PropertyStatus = 'listed' | 'under_offer' | 'sold' | 'expired' | 'off_market' | 'for_rent' | 'rented' | 'for_renovation' | 'under_renovation'
export type OfferStatus = 'pending' | 'countered' | 'accepted' | 'rejected' | 'withdrawn' | 'signed'
export type ContactType = 'buyer' | 'seller' | 'agent' | 'notary' | 'lawyer' | 'supplier' | 'contractor' | 'other'
export type FinancingType = 'cash' | 'mortgage' | 'pre_approved' | 'other'

export interface Property {
  id: string
  address: string
  city: string | null
  neighborhood: string | null
  postal_code: string | null
  property_type: PropertyType
  status: PropertyStatus
  list_price: number | null
  sqm: number | null
  plot_sqm: number | null
  bedrooms: number | null
  bathrooms: number | null
  floor: string | null
  year_built: number | null
  energy_rating: string | null
  has_parking: boolean
  has_storage: boolean
  common_expenses: number | null
  listing_code: string | null
  listing_date: string | null
  description: string | null
  created_at: string
  updated_at: string
}

export interface Contact {
  id: string
  full_name: string
  contact_type: ContactType
  company: string | null
  email: string | null
  phone: string | null
  mobile: string | null
  license_no: string | null
  address: string | null
  tax_id: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface Offer {
  id: string
  property_id: string
  buyer_id: string | null
  contractor_id: string | null
  seller_agent_id: string | null
  buyer_agent_id: string | null
  notary_id: string | null
  category: string | null
  offer_price: number
  earnest_money: number | null
  down_payment: number | null
  financing: string | null
  status: OfferStatus
  offer_date: string
  expires_at: string | null
  signing_date: string | null
  due_diligence_days: number | null
  vat_rate: number | null
  vat_included: boolean
  scope: string | null
  special_terms: string | null
  internal_notes: string | null
  created_at: string
  updated_at: string
}

export interface CounterOffer {
  id: string
  offer_id: string
  round: number
  counter_price: number
  counter_date: string | null
  expires_at: string | null
  notes: string | null
  from_party: string | null
  created_at: string
}

export interface Note {
  id: string
  entity_type: string
  entity_id: string
  text: string
  created_at: string
  updated_at: string
}

export interface FileAttachment {
  id: string
  entity_type: string
  entity_id: string
  bucket_path: string
  file_name: string
  file_size: number | null
  mime_type: string | null
  label: string | null
  created_at: string
}

export interface Activity {
  id: string
  event_type: string
  description: string
  entity_type: string | null
  entity_id: string | null
  created_at: string
}

export interface Task {
  id: string
  entity_type: string
  entity_id: string
  title: string
  due_date: string | null
  status: 'open' | 'done'
  created_at: string
}

export interface Commission {
  id: string
  offer_id: string
  agent_contact_id: string | null
  rate: number | null
  amount: number | null
  invoiced: boolean
  received: boolean
  notes: string | null
  created_at: string
  agent?: { full_name: string } | null
}

export interface Viewing {
  id: string
  property_id: string
  contact_id: string
  viewed_at: string
  notes: string | null
  created_at: string
  contact?: { full_name: string } | null
}

export interface EmailTemplate {
  id: string
  name: string
  subject: string | null
  body: string
  category: string | null
  created_at: string
}

export interface OfferTemplate {
  id: string
  name: string
  category: string | null
  status: string | null
  offer_price: number | null
  vat_rate: number | null
  vat_included: boolean
  payment_terms: string | null
  notes: string | null
  created_at: string
}
