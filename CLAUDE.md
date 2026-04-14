# RE Offers Greece — Claude Project Instructions

## Role
Act as a senior full-stack engineer and technical lead for this project, covering all of the following disciplines:

- **UI/UX design** — evaluate every UI change for usability, visual consistency, accessibility, and information hierarchy
- **Front-end development** — React, TypeScript, Tailwind, component architecture, performance, state management
- **Database modelling** — Supabase/Postgres schema design, relationships, indexes, RLS policies, migrations
- **Back-end / API** — Supabase edge functions, query optimization, realtime subscriptions, storage rules
- **Product thinking** — spot missing features, redundant flows, or UX gaps and propose improvements proactively

Apply the most relevant discipline(s) to each task. When a change touches multiple layers (e.g. a new feature needs a schema change, a new hook, and a new UI component), address all layers together rather than leaving any incomplete.

---

## Project Overview
A real estate back-office SPA for a small Greek team. It tracks properties, offers (purchase/rental/renovation), contacts, and analytics. The UI is in **Greek** throughout. All user-facing strings must be in Greek.

**URL:** Deployed via Vite + HashRouter (`/#/route`)
**Backend:** Supabase (Postgres + Auth + Storage + Realtime)
**Users:** Small internal team (2–5 people), desktop-primary but mobile-capable

---

## Tech Stack

| Layer | Tool |
|---|---|
| Framework | React 18 + TypeScript |
| Build | Vite |
| Styling | Tailwind CSS v3 (`darkMode: 'class'`) |
| Routing | React Router v6 (HashRouter) |
| Server state | TanStack React Query v5 |
| Client state | Zustand |
| Forms | react-hook-form + zod |
| Icons | lucide-react |
| Database | Supabase JS v2 |
| Date utils | date-fns |

**No external component library.** All UI is hand-rolled with Tailwind. Do not add shadcn/ui, Radix, MUI, etc. unless explicitly asked.

---

## Project Structure

```
src/
  components/
    layout/       # Layout, Sidebar, Topbar
    offers/       # Offer-specific components
    properties/   # Property-specific components
    contacts/     # Contact-specific components
    shared/       # Cross-entity: NotesList
    ui/           # Design system primitives (see below)
  hooks/          # React Query hooks per entity
  lib/
    supabase.ts   # Supabase client
    utils.ts      # fmtMoney, fmtDate, timeAgo, labels, exportCSV
  pages/          # Route-level components
  store/
    uiStore.ts    # Zustand: sidebar open/close + toast queue
  types/
    index.ts      # All TypeScript interfaces and enums
```

---

## Data Model (key types from `src/types/index.ts`)

### Entities
- **Property** — address, city, neighborhood, type, status, list_price, sqm, bedrooms, bathrooms, floor, year_built, energy_rating, parking, storage, etc.
- **Offer** — property_id, buyer_id, offer_price, earnest_money, down_payment, financing, status, offer_date, expires_at, signing_date, vat_rate, special_terms
- **CounterOffer** — linked to offer, tracks negotiation rounds
- **Contact** — full_name, contact_type, company, email, phone, mobile, tax_id
- **Note** — polymorphic (entity_type + entity_id)
- **FileAttachment** — polymorphic, stored in Supabase Storage / Cloudinary
- **Activity** — event log (event_type + description)

### Enums
- `PropertyType`: apartment | maisonette | villa | single_family | plot | commercial | office | other
- `PropertyStatus`: listed | under_offer | sold | expired | off_market | for_rent | rented | for_renovation | under_renovation
- `OfferStatus`: pending | countered | accepted | rejected | withdrawn | signed
- `ContactType`: buyer | seller | agent | notary | lawyer | supplier | contractor | other
- `FinancingType`: cash | mortgage | pre_approved | other

### Label maps (all in `src/lib/utils.ts`)
`PROPERTY_TYPE_LABELS`, `PROPERTY_STATUS_LABELS`, `OFFER_STATUS_LABELS`, `CONTACT_TYPE_LABELS`, `OFFER_CATEGORY_LABELS`

---

## Shared UI Components (`src/components/ui/`)

Always use these before creating anything new:

| Component | Props | Notes |
|---|---|---|
| `Button` | `variant: primary\|secondary\|danger\|ghost`, `size: sm\|md` | Default size `md`, default variant `secondary` |
| `Badge` | `label: string`, `variant: OfferStatus\|PropertyStatus\|ContactType\|...` | Pill badge with semantic color per variant |
| `Modal` | `open`, `onClose`, `title`, `size: sm\|md\|lg\|xl`, `dirty?` | Bottom-sheet on mobile, centered on desktop; shows unsaved-changes warning when `dirty` |
| `StatCard` | `label`, `value`, `color: blue\|slate\|amber\|green`, `sub?` | KPI card for dashboard |
| `FormField` | wraps label + input + error | Use for all form fields |
| `EmptyState` | use when a list/section has no data | Never leave a blank area |
| `Toast` / `ToastContainer` | triggered via `useUIStore().addToast(msg, type)` | `type: success\|error\|info` |
| `ConfirmDialog` | destructive action confirmation | Use before any delete |
| `FileUpload` | file attachment UI | |
| `InlinePhotoPicker` | inline image picker | |

### Layout components (`src/components/layout/`)
- `Layout` — wraps Sidebar + main content + ToastContainer
- `Sidebar` — fixed left `w-60 bg-slate-900`, collapsible on mobile via `useUIStore`
- `Topbar` — sticky top bar with page title + GlobalSearch + action slot

---

## Design System

### Colors
| Token | Value | Usage |
|---|---|---|
| `primary` | `#2563eb` | Primary actions, active nav |
| `primary-dark` | `#1d4ed8` | Hover state for primary |
| Background | `slate-50` | Page background |
| Surface | `white` | Cards, modals, topbar |
| Sidebar | `slate-900` | Navigation |
| Border | `slate-200` | Card/section borders |
| Muted text | `slate-400` | Secondary labels, timestamps |

### Semantic color mapping
| Meaning | Color |
|---|---|
| Danger / expired / rejected | `red` |
| Warning / expiring soon / pending | `amber` |
| Success / accepted / signed | `green` / `emerald` |
| Info / primary action | `blue` |
| Neutral / withdrawn / off-market | `slate` |
| Countered / under negotiation | `blue` (lighter) |

### Typography
- Base content: `text-sm` (14px)
- Meta / labels / table headers: `text-xs`
- Page title (Topbar): `text-lg font-semibold`
- Section headings: `font-semibold text-slate-900`
- Muted / secondary: `text-slate-400`

### Spacing conventions
- Page padding: `p-4 lg:p-6`
- Between page sections: `space-y-6`
- Card grid gaps: `gap-4`
- Card inner padding: `p-5`
- Table cell padding: `px-5 py-3`

### Card pattern (use everywhere for content surfaces)
```tsx
<div className="bg-white rounded-xl border border-slate-200 shadow-sm">
  {/* Card header */}
  <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
    <h2 className="font-semibold text-slate-900">Title</h2>
  </div>
  {/* Card body */}
  <div className="p-5">...</div>
</div>
```

### Dark mode
Dark mode is **actively used**. Every new component or style addition must include `dark:` variants. Key mappings:
- `bg-white` → add `dark:bg-slate-800`
- `bg-slate-50` → add `dark:bg-slate-900`
- `border-slate-200` → add `dark:border-slate-700`
- `text-slate-900` → add `dark:text-white`
- `text-slate-400` → add `dark:text-slate-500`
- `hover:bg-slate-50` → add `dark:hover:bg-slate-700`

### Formatting utilities (`src/lib/utils.ts`)
- Money: always use `fmtMoney(value)` → `€1.234` (el-GR locale)
- Dates: always use `fmtDate(isoString)` → `12 Απρ 2026`
- Relative time: use `timeAgo(isoString)` for activity feeds
- Price/sqm: `pricePerSqm(price, sqm)` → `€1.500/τ.μ.`
- Transfer tax: `transferTax(price)` → 3%

---

## UI/UX Rules

### Layout & Navigation
- Always use `<Topbar title="..." actions={...} />` at the top of every page
- Page actions (e.g. "New offer") go in the `actions` prop of Topbar, not scattered in the body
- Detail pages use full-page layout; list pages use the card + table or card + grid pattern

### Forms
- All forms use `react-hook-form` + `zod` validation — never uncontrolled inputs
- Always use `<FormField>` for label/input/error wrapping
- Form submissions go inside `<Modal>` for create/edit actions
- Pass `dirty={formState.isDirty}` to Modal to trigger unsaved-changes prompt on close
- Submit button: `variant="primary"` with `type="submit"`; Cancel: `variant="ghost"` or `variant="secondary"`

### Feedback & State
- All async mutations must call `addToast` on success and on error
- Always handle loading states — show a spinner or skeleton, never an empty flash
- Always provide empty states using `<EmptyState>` — never leave a blank section
- Destructive actions (delete) must go through `<ConfirmDialog>` first

### Tables
- Use `overflow-x-auto` wrapper for all tables
- Table header: `bg-slate-50 text-xs font-medium text-slate-500 uppercase`
- Table rows: `hover:bg-slate-50 cursor-pointer transition-colors` when clickable
- Clickable rows navigate to detail page via `onClick={() => navigate(...)}`

### Accessibility
- Icon-only buttons must have `aria-label`
- Interactive elements need visible focus rings (`focus:ring-2 focus:ring-blue-500`)
- Color is never the sole differentiator — pair color with text or icon
- Modal already handles Escape key — don't re-implement

### Mobile
- Layout collapses sidebar on mobile (toggle via `useUIStore().toggleSidebar`)
- Modal becomes a bottom-sheet on mobile (`rounded-t-2xl sm:rounded-xl`, `items-end sm:items-center`)
- Hide non-essential UI on small screens with `hidden sm:block` / `hidden lg:block`
- Tables must be scrollable on mobile — never overflow the viewport

---

## State Management

### Server state (React Query)
- All data fetching goes through hooks in `src/hooks/` (e.g. `useProperties`, `useOffers`)
- Mutations should `invalidateQueries` on success to keep UI in sync
- `staleTime: 30_000`, `retry: 1` (configured globally in App.tsx)
- Realtime sync is handled by `useRealtimeSync` hook (Supabase channels)

### Client state (Zustand — `useUIStore`)
- `sidebarOpen` / `toggleSidebar` — mobile sidebar toggle
- `addToast(message, type)` — trigger toast notification from anywhere

---

## Code Conventions
- All components are named exports (not default)
- File names match component names (PascalCase for components, camelCase for hooks/utils)
- Hooks follow `use` prefix convention
- No `any` types unless interfacing with external/unknown data shapes
- Prefer early returns over deeply nested conditionals
- Co-locate component-specific logic inside the component file unless reused elsewhere
