/* ============================================================
   Real Estate Offers Tracker  —  localStorage + Supabase SPA
   ============================================================ */

'use strict';

// ==================== DATA LAYER ====================

const DB_KEY = 're_offers_db';
let _sb = null;          // Supabase client
let _syncTimer = null;   // debounce timer
let _syncStatus = 'idle'; // 'idle' | 'syncing' | 'ok' | 'error'

function defaultDb() {
  return {
    properties: [],
    offers: [],
    contacts: [],
    notes: [],
    activities: [],
  };
}

let db = defaultDb();

// ---------- Supabase helpers ----------

const SB_URL = 'https://trfblvmmrrijwdqtdlyx.supabase.co';
const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRyZmJsdm1tcnJpandkcXRkbHl4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwNjEwMTcsImV4cCI6MjA5MDYzNzAxN30.6rs2x6bLzzai8q1o0jjgnf12jfxMr0sDor8qa0ek5Sk';

function sbInit() {
  const url = localStorage.getItem('sb_url') || SB_URL;
  const key = localStorage.getItem('sb_key') || SB_KEY;
  if (url && key && window.supabase) {
    _sb = window.supabase.createClient(url, key);
    return true;
  }
  _sb = null;
  return false;
}

async function sbLoad() {
  if (!_sb) return null;
  try {
    const { data, error } = await _sb
      .from('app_data')
      .select('value')
      .eq('key', DB_KEY)
      .maybeSingle();
    if (error) { console.warn('Supabase load error:', error.message); return null; }
    return data ? data.value : null;
  } catch (e) { console.warn('Supabase unreachable:', e); return null; }
}

async function sbSave() {
  if (!_sb) return;
  setSyncStatus('syncing');
  try {
    const { error } = await _sb.from('app_data').upsert({ key: DB_KEY, value: db });
    setSyncStatus(error ? 'error' : 'ok');
    if (error) console.warn('Supabase save error:', error.message);
  } catch (e) { setSyncStatus('error'); }
}

function scheduleSbSave() {
  clearTimeout(_syncTimer);
  _syncTimer = setTimeout(sbSave, 800);
}

function sbSubscribeRealtime() {
  if (!_sb) return;
  _sb.channel('app_data_changes')
    .on('postgres_changes', {
      event: 'UPDATE', schema: 'public', table: 'app_data',
      filter: `key=eq.${DB_KEY}`
    }, payload => {
      if (!payload.new || !payload.new.value) return;
      // Ignore updates we just pushed ourselves (debounce window)
      if (_syncStatus === 'syncing') return;
      db = { ...defaultDb(), ...payload.new.value };
      localStorage.setItem(DB_KEY, JSON.stringify(db));
      renderView();
      toast('🔄 Updated by a partner', 'info');
    })
    .subscribe();
}

function setSyncStatus(s) {
  _syncStatus = s;
  const btn = document.getElementById('cloudBtn');
  if (!btn) return;
  const icons = { idle: '☁️', syncing: '🔄', ok: '✅', error: '❌' };
  const labels = { idle: 'Cloud', syncing: 'Syncing…', ok: 'Synced', error: 'Sync error' };
  btn.innerHTML = `${icons[s]} ${labels[s]}`;
}

// ---------- Local storage ----------

function loadLocalDb() {
  try {
    const raw = localStorage.getItem(DB_KEY);
    if (raw) return JSON.parse(raw);
  } catch (_) {}
  return defaultDb();
}

function saveDb() {
  localStorage.setItem(DB_KEY, JSON.stringify(db));
  scheduleSbSave();
}

// ---------- Cloud sync settings modal ----------

function openCloudSettings() {
  const url = localStorage.getItem('sb_url') || '';
  const key = localStorage.getItem('sb_key') || '';
  const connected = !!_sb;
  openModal('☁️ Cloud Sync — Supabase', `
    <div style="margin-bottom:12px;font-size:.9rem;color:var(--text2)">
      Connect to a free <strong>Supabase</strong> project so your data lives in the cloud and works on any device.<br><br>
      <strong>Setup (one time):</strong><br>
      1. Go to <strong>supabase.com</strong> → create a free project<br>
      2. In SQL Editor run:<br>
      <code style="display:block;background:var(--bg);padding:8px;border-radius:4px;margin:6px 0;font-size:.8rem;white-space:pre">create table app_data (key text primary key, value jsonb);
alter table app_data enable row level security;
create policy "anon full access" on app_data
  for all to anon using (true) with check (true);</code>
      3. Go to <strong>Settings → API</strong> and copy Project URL + anon key below
    </div>
    <div class="form-group">
      <label class="form-label">Supabase Project URL</label>
      <input class="form-control" id="sbUrl" value="${escHtml(url)}" placeholder="https://xxxx.supabase.co" />
    </div>
    <div class="form-group">
      <label class="form-label">Supabase Anon Key</label>
      <input class="form-control" id="sbKey" value="${escHtml(key)}" placeholder="eyJhbGci..." />
    </div>
    ${connected ? '<div style="color:var(--green);margin-top:4px">✅ Currently connected</div>' : '<div style="color:var(--text2);margin-top:4px">Not connected — data stored locally only</div>'}
  `, [
    { label: 'Cancel', cls: 'btn-secondary', action: closeModal },
    ...(connected ? [{ label: 'Disconnect', cls: 'btn-danger', action: () => {
      localStorage.removeItem('sb_url'); localStorage.removeItem('sb_key');
      _sb = null; setSyncStatus('idle');
      closeModal(); toast('Disconnected from Supabase', 'info');
    }}] : []),
    { label: connected ? 'Update & Test' : 'Connect & Sync', cls: 'btn-primary', action: saveCloudSettings },
  ]);
}

async function saveCloudSettings() {
  const url = document.getElementById('sbUrl').value.trim();
  const key = document.getElementById('sbKey').value.trim();
  if (!url || !key) { toast('Both URL and key are required', 'error'); return; }
  localStorage.setItem('sb_url', url);
  localStorage.setItem('sb_key', key);
  sbInit();
  toast('Testing connection…', 'info');
  closeModal();
  // push current data to cloud
  await sbSave();
  if (_syncStatus === 'ok') {
    toast('Connected! Data synced to cloud ✅', 'success');
  } else {
    toast('Connection failed — check URL and key', 'error');
  }
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function now() {
  return new Date().toISOString();
}

// ==================== FORMATTING ====================

function fmt(v) {
  if (v == null || v === '') return '—';
  return v;
}

function fmtMoney(v) {
  if (!v && v !== 0) return '—';
  return '$' + Number(v).toLocaleString('en-US');
}

function fmtDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d)) return iso;
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function fmtDateTime(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d)) return iso;
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function timeAgo(iso) {
  if (!iso) return '';
  const ms = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return fmtDate(iso);
}

// ==================== BADGE HELPERS ====================

function offerStatusBadge(s) {
  const cls = {
    pending: 'badge-pending', accepted: 'badge-accepted', rejected: 'badge-rejected',
    withdrawn: 'badge-withdrawn', countered: 'badge-countered', closed: 'badge-closed',
  }[s] || 'badge-pending';
  return `<span class="badge ${cls}">${s || 'pending'}</span>`;
}

function propertyStatusBadge(s) {
  const cls = {
    listed: 'badge-listed', sold: 'badge-sold', expired: 'badge-expired',
    'off-market': 'badge-offmarket', pending: 'badge-pending',
  }[s] || 'badge-listed';
  return `<span class="badge ${cls}">${s || 'listed'}</span>`;
}

function contactTypeBadge(t) {
  const cls = {
    buyer: 'badge-buyer', seller: 'badge-seller', agent: 'badge-agent',
  }[t] || 'badge-buyer';
  return `<span class="badge ${cls}">${t || 'buyer'}</span>`;
}

// ==================== ACTIVITY LOG ====================

function logActivity(type, description, entityType, entityId) {
  db.activities.unshift({ id: uid(), type, description, entityType, entityId, createdAt: now() });
  if (db.activities.length > 200) db.activities = db.activities.slice(0, 200);
  saveDb();
}

// ==================== ROUTER / VIEWS ====================

let currentView = 'dashboard';
let viewState = {};  // per-view state (selected ID, search, filter)

const VIEW_TITLES = {
  dashboard: 'Dashboard',
  properties: 'Properties',
  offers: 'Offers',
  contacts: 'Contacts',
  analytics: 'Analytics',
  'property-detail': 'Property Detail',
  'offer-detail': 'Offer Detail',
  'contact-detail': 'Contact Detail',
};

function navigate(view, state = {}) {
  currentView = view;
  viewState = state;
  renderView();
  // Update nav highlights
  document.querySelectorAll('.nav-item').forEach(el => {
    const base = view.split('-')[0];
    el.classList.toggle('active', el.dataset.view === view || el.dataset.view === base);
  });
}

function renderView() {
  const content = document.getElementById('mainContent');
  const title = document.getElementById('pageTitle');
  const actions = document.getElementById('topbarActions');
  title.textContent = VIEW_TITLES[currentView] || currentView;
  actions.innerHTML = '';

  switch (currentView) {
    case 'dashboard':       renderDashboard(content, actions); break;
    case 'properties':      renderProperties(content, actions); break;
    case 'property-detail': renderPropertyDetail(content, actions, viewState.id); break;
    case 'offers':          renderOffers(content, actions); break;
    case 'offer-detail':    renderOfferDetail(content, actions, viewState.id); break;
    case 'contacts':        renderContacts(content, actions); break;
    case 'contact-detail':  renderContactDetail(content, actions, viewState.id); break;
    case 'analytics':       renderAnalytics(content, actions); break;
    default: content.innerHTML = '<p>View not found.</p>';
  }
}

// ==================== DASHBOARD ====================

function renderDashboard(el, actions) {
  const totalProps = db.properties.length;
  const totalOffers = db.offers.length;
  const activeOffers = db.offers.filter(o => o.status === 'pending' || o.status === 'countered').length;
  const acceptedOffers = db.offers.filter(o => o.status === 'accepted' || o.status === 'closed').length;
  const totalValue = db.offers.reduce((s, o) => s + (Number(o.offerPrice) || 0), 0);
  const contacts = db.contacts.length;

  const recentOffers = [...db.offers].sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);
  const recentActivity = db.activities.slice(0, 8);

  el.innerHTML = `
    <div class="grid-4 mb24">
      <div class="stat-card accent">
        <div class="label">Properties</div>
        <div class="value">${totalProps}</div>
        <div class="delta">Total tracked</div>
      </div>
      <div class="stat-card info">
        <div class="label">Total Offers</div>
        <div class="value">${totalOffers}</div>
        <div class="delta">All time</div>
      </div>
      <div class="stat-card warning">
        <div class="label">Active Offers</div>
        <div class="value">${activeOffers}</div>
        <div class="delta">Pending / countered</div>
      </div>
      <div class="stat-card success">
        <div class="label">Accepted</div>
        <div class="value">${acceptedOffers}</div>
        <div class="delta">Accepted / closed</div>
      </div>
    </div>

    <div class="grid-2 gap16">
      <div>
        <div class="section-header">
          <div class="section-title">Recent Offers</div>
          <a href="#" class="section-link" onclick="navigate('offers');return false;">View all</a>
        </div>
        ${recentOffers.length ? `
        <div class="table-wrap">
          <table>
            <thead><tr><th>Property</th><th>Price</th><th>Status</th><th>Date</th></tr></thead>
            <tbody>
              ${recentOffers.map(o => {
                const prop = db.properties.find(p => p.id === o.propertyId);
                return `<tr style="cursor:pointer" onclick="navigate('offer-detail',{id:'${o.id}'})">
                  <td>${prop ? prop.address : '—'}</td>
                  <td>${fmtMoney(o.offerPrice)}</td>
                  <td>${offerStatusBadge(o.status)}</td>
                  <td style="font-size:.8rem;color:var(--text2)">${timeAgo(o.createdAt)}</td>
                </tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>` : '<div class="empty-state"><div class="empty-icon">&#128203;</div><div class="empty-desc">No offers yet. Add a property and start tracking offers.</div></div>'}
      </div>

      <div>
        <div class="section-header">
          <div class="section-title">Recent Activity</div>
        </div>
        ${recentActivity.length ? `
        <div class="card" style="padding:0;overflow:hidden">
          ${recentActivity.map(a => `
            <div style="display:flex;gap:12px;align-items:flex-start;padding:12px 16px;border-bottom:1px solid var(--border)">
              <div style="font-size:1.1rem;margin-top:2px">${activityIcon(a.type)}</div>
              <div>
                <div style="font-size:.88rem">${a.description}</div>
                <div style="font-size:.75rem;color:var(--text2)">${timeAgo(a.createdAt)}</div>
              </div>
            </div>
          `).join('')}
        </div>` : '<div class="card text-muted" style="font-size:.88rem">No activity yet.</div>'}
      </div>
    </div>

    <div class="mt24 grid-2 gap16">
      <div>
        <div class="section-header">
          <div class="section-title">Properties Overview</div>
          <a href="#" class="section-link" onclick="navigate('properties');return false;">View all</a>
        </div>
        ${db.properties.length ? `
        <div class="table-wrap">
          <table>
            <thead><tr><th>Address</th><th>List Price</th><th>Status</th><th>Offers</th></tr></thead>
            <tbody>
              ${[...db.properties].slice(0,6).map(p => {
                const cnt = db.offers.filter(o => o.propertyId === p.id).length;
                return `<tr style="cursor:pointer" onclick="navigate('property-detail',{id:'${p.id}'})">
                  <td>${p.address}</td>
                  <td>${fmtMoney(p.listPrice)}</td>
                  <td>${propertyStatusBadge(p.status)}</td>
                  <td>${cnt}</td>
                </tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>` : '<div class="empty-state"><div class="empty-icon">&#127968;</div><div class="empty-desc">No properties yet.</div></div>'}
      </div>

      <div>
        <div class="section-header">
          <div class="section-title">Offer Value Summary</div>
        </div>
        <div class="card" style="display:flex;flex-direction:column;gap:14px">
          ${renderValueSummary()}
        </div>
      </div>
    </div>
  `;
}

function activityIcon(type) {
  const map = {
    offer_added: '&#128203;', offer_updated: '&#9998;', offer_deleted: '&#128465;',
    property_added: '&#127968;', property_updated: '&#9998;', property_deleted: '&#128465;',
    contact_added: '&#128100;', contact_updated: '&#9998;', contact_deleted: '&#128465;',
    note_added: '&#128221;', status_changed: '&#128260;',
  };
  return map[type] || '&#9679;';
}

function renderValueSummary() {
  const statuses = ['pending','countered','accepted','rejected','withdrawn','closed'];
  const groups = statuses.map(s => ({
    label: s.charAt(0).toUpperCase()+s.slice(1),
    count: db.offers.filter(o => o.status === s).length,
    value: db.offers.filter(o => o.status === s).reduce((sum,o) => sum + (Number(o.offerPrice)||0), 0),
  })).filter(g => g.count > 0);

  if (!groups.length) return '<div class="text-muted" style="font-size:.88rem">No offers to summarize.</div>';

  return groups.map(g => `
    <div style="display:flex;justify-content:space-between;align-items:center">
      <div>${offerStatusBadge(g.label.toLowerCase())}</div>
      <div style="text-align:right">
        <div style="font-weight:700">${fmtMoney(g.value)}</div>
        <div style="font-size:.75rem;color:var(--text2)">${g.count} offer${g.count !== 1 ? 's' : ''}</div>
      </div>
    </div>
  `).join('<div class="divider" style="margin:6px 0"></div>');
}

// ==================== PROPERTIES VIEW ====================

function renderProperties(el, actions) {
  actions.innerHTML = `<button class="btn btn-primary" onclick="openPropertyForm()">+ Add Property</button>`;

  const search = viewState.propSearch || '';
  const filter = viewState.propFilter || '';

  let props = [...db.properties];
  if (search) {
    const q = search.toLowerCase();
    props = props.filter(p => p.address.toLowerCase().includes(q) || (p.city||'').toLowerCase().includes(q) || (p.type||'').toLowerCase().includes(q));
  }
  if (filter) props = props.filter(p => p.status === filter);
  props.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));

  el.innerHTML = `
    <div class="filter-bar">
      <div class="search-wrap">
        <span class="search-icon">&#128269;</span>
        <input class="form-control search-input" id="propSearch" placeholder="Search properties..." value="${escHtml(search)}" oninput="viewState.propSearch=this.value;renderView()" />
      </div>
      <select class="filter-select" onchange="viewState.propFilter=this.value;renderView()">
        <option value="" ${!filter?'selected':''}>All statuses</option>
        <option value="listed"     ${filter==='listed'?'selected':''}>Listed</option>
        <option value="pending"    ${filter==='pending'?'selected':''}>Pending</option>
        <option value="sold"       ${filter==='sold'?'selected':''}>Sold</option>
        <option value="expired"    ${filter==='expired'?'selected':''}>Expired</option>
        <option value="off-market" ${filter==='off-market'?'selected':''}>Off Market</option>
      </select>
    </div>
    ${props.length ? `
    <div class="grid-auto">
      ${props.map(p => propertyCard(p)).join('')}
    </div>` : `
    <div class="empty-state">
      <div class="empty-icon">&#127968;</div>
      <div class="empty-title">No properties found</div>
      <div class="empty-desc">Add your first property to start tracking offers.</div>
      <button class="btn btn-primary mt16" onclick="openPropertyForm()">+ Add Property</button>
    </div>`}
  `;
}

function propertyCard(p) {
  const offerCount = db.offers.filter(o => o.propertyId === p.id).length;
  const typeEmoji = { 'single-family':'&#127968;', condo:'&#127963;', townhouse:'&#127967;', 'multi-family':'&#127960;', land:'&#127757;', commercial:'&#127970;' }[p.type] || '&#127968;';
  return `
    <div class="prop-card" onclick="navigate('property-detail',{id:'${p.id}'})">
      <div class="prop-card-img">${typeEmoji}</div>
      <div class="prop-card-body">
        <div class="prop-card-addr">${escHtml(p.address)}</div>
        <div class="prop-card-meta">${[p.city, p.state].filter(Boolean).join(', ')} ${p.zip||''}</div>
        <div class="prop-card-price">${fmtMoney(p.listPrice)}</div>
        <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
          ${propertyStatusBadge(p.status)}
          ${p.beds ? `<span class="text-muted" style="font-size:.8rem">${p.beds}bd</span>` : ''}
          ${p.baths ? `<span class="text-muted" style="font-size:.8rem">${p.baths}ba</span>` : ''}
          ${p.sqft ? `<span class="text-muted" style="font-size:.8rem">${Number(p.sqft).toLocaleString()} sqft</span>` : ''}
        </div>
      </div>
      <div class="prop-card-footer">
        <span class="text-muted" style="font-size:.8rem">${offerCount} offer${offerCount!==1?'s':''}</span>
        <span class="text-muted" style="font-size:.8rem">${timeAgo(p.createdAt)}</span>
      </div>
    </div>
  `;
}

// ==================== PROPERTY DETAIL ====================

function renderPropertyDetail(el, actions, id) {
  const p = db.properties.find(x => x.id === id);
  if (!p) { el.innerHTML = '<div class="empty-state"><div class="empty-title">Property not found.</div></div>'; return; }

  const propOffers = db.offers.filter(o => o.propertyId === id).sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
  const propNotes = db.notes.filter(n => n.entityType === 'property' && n.entityId === id).sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));

  actions.innerHTML = `
    <button class="btn btn-secondary btn-sm" onclick="navigate('properties')">&#8592; Back</button>
    <button class="btn btn-primary btn-sm" onclick="openPropertyForm('${id}')">Edit</button>
    <button class="btn btn-danger btn-sm" onclick="confirmDeleteProperty('${id}')">Delete</button>
  `;

  el.innerHTML = `
    <div class="detail-header">
      <div>
        <div class="detail-title">${escHtml(p.address)}</div>
        <div class="detail-sub">${[p.city,p.state,p.zip].filter(Boolean).join(', ')} &bull; ${p.type||'Property'}</div>
      </div>
      <div style="display:flex;gap:8px;align-items:center">
        ${propertyStatusBadge(p.status)}
      </div>
    </div>

    <div class="grid-2 gap16 mb24">
      <div class="card">
        <div class="card-title">Property Info</div>
        <div class="info-grid mt16">
          ${infoItem('List Price', fmtMoney(p.listPrice))}
          ${infoItem('Type', p.type||'—')}
          ${infoItem('Bedrooms', p.beds||'—')}
          ${infoItem('Bathrooms', p.baths||'—')}
          ${infoItem('Sq Ft', p.sqft ? Number(p.sqft).toLocaleString() : '—')}
          ${infoItem('Year Built', p.yearBuilt||'—')}
          ${infoItem('Lot Size', p.lotSize||'—')}
          ${infoItem('HOA / mo', p.hoa ? fmtMoney(p.hoa) : '—')}
          ${infoItem('Listing Date', fmtDate(p.listingDate))}
          ${infoItem('MLS #', p.mlsNumber||'—')}
          ${infoItem('Added', fmtDate(p.createdAt))}
        </div>
        ${p.description ? `<div class="divider"></div><div style="font-size:.88rem;color:var(--text2);line-height:1.6">${escHtml(p.description)}</div>` : ''}
      </div>

      <div>
        <div class="section-header">
          <div class="section-title">Offers (${propOffers.length})</div>
          <button class="btn btn-primary btn-sm" onclick="openOfferForm(null,'${id}')">+ Add Offer</button>
        </div>
        ${propOffers.length ? `
        <div class="table-wrap">
          <table>
            <thead><tr><th>Buyer</th><th>Price</th><th>Status</th><th>Date</th><th></th></tr></thead>
            <tbody>
              ${propOffers.map(o => {
                const buyer = db.contacts.find(c => c.id === o.buyerId);
                return `<tr>
                  <td>${buyer ? escHtml(buyer.name) : '—'}</td>
                  <td>${fmtMoney(o.offerPrice)}</td>
                  <td>${offerStatusBadge(o.status)}</td>
                  <td style="font-size:.8rem;color:var(--text2)">${fmtDate(o.offerDate)}</td>
                  <td><button class="btn btn-secondary btn-sm" onclick="navigate('offer-detail',{id:'${o.id}'})">View</button></td>
                </tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>` : `<div class="card text-muted" style="font-size:.88rem">No offers yet. <a href="#" style="color:var(--accent)" onclick="openOfferForm(null,'${id}');return false;">Add one</a>.</div>`}

        <div class="section-header mt24">
          <div class="section-title">Notes</div>
          <button class="btn btn-secondary btn-sm" onclick="openNoteForm('property','${id}')">+ Note</button>
        </div>
        ${renderNotesList(propNotes, 'property', id)}
      </div>
    </div>
  `;
}

function infoItem(lbl, val) {
  return `<div class="info-item"><div class="lbl">${lbl}</div><div class="val">${val}</div></div>`;
}

// ==================== OFFERS VIEW ====================

function renderOffers(el, actions) {
  actions.innerHTML = `<button class="btn btn-primary" onclick="openOfferForm()">+ Add Offer</button>`;

  const search = viewState.offerSearch || '';
  const filter = viewState.offerFilter || '';
  const sortBy = viewState.offerSort || 'date';

  let offers = [...db.offers];
  if (search) {
    const q = search.toLowerCase();
    offers = offers.filter(o => {
      const prop = db.properties.find(p => p.id === o.propertyId);
      const buyer = db.contacts.find(c => c.id === o.buyerId);
      return (prop&&prop.address.toLowerCase().includes(q)) ||
             (buyer&&buyer.name.toLowerCase().includes(q)) ||
             (o.offerPrice+'').includes(q);
    });
  }
  if (filter) offers = offers.filter(o => o.status === filter);

  if (sortBy === 'price-asc') offers.sort((a,b) => (Number(a.offerPrice)||0) - (Number(b.offerPrice)||0));
  else if (sortBy === 'price-desc') offers.sort((a,b) => (Number(b.offerPrice)||0) - (Number(a.offerPrice)||0));
  else offers.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));

  el.innerHTML = `
    <div class="filter-bar">
      <div class="search-wrap">
        <span class="search-icon">&#128269;</span>
        <input class="form-control" placeholder="Search offers..." value="${escHtml(search)}" oninput="viewState.offerSearch=this.value;renderView()" />
      </div>
      <select class="filter-select" onchange="viewState.offerFilter=this.value;renderView()">
        <option value="" ${!filter?'selected':''}>All statuses</option>
        <option value="pending"   ${filter==='pending'?'selected':''}>Pending</option>
        <option value="countered" ${filter==='countered'?'selected':''}>Countered</option>
        <option value="accepted"  ${filter==='accepted'?'selected':''}>Accepted</option>
        <option value="rejected"  ${filter==='rejected'?'selected':''}>Rejected</option>
        <option value="withdrawn" ${filter==='withdrawn'?'selected':''}>Withdrawn</option>
        <option value="closed"    ${filter==='closed'?'selected':''}>Closed</option>
      </select>
      <select class="filter-select" onchange="viewState.offerSort=this.value;renderView()">
        <option value="date"       ${sortBy==='date'?'selected':''}>Newest first</option>
        <option value="price-desc" ${sortBy==='price-desc'?'selected':''}>Price &#8595;</option>
        <option value="price-asc"  ${sortBy==='price-asc'?'selected':''}>Price &#8593;</option>
      </select>
    </div>

    ${offers.length ? `
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Property</th><th>Buyer</th><th>Offer Price</th><th>List Price</th>
            <th>&#916; vs List</th><th>Status</th><th>Date</th><th>Expires</th><th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${offers.map(o => {
            const prop = db.properties.find(p => p.id === o.propertyId);
            const buyer = db.contacts.find(c => c.id === o.buyerId);
            const list = Number(prop?.listPrice) || 0;
            const offer = Number(o.offerPrice) || 0;
            const diff = list ? ((offer - list) / list * 100).toFixed(1) : null;
            const diffStr = diff !== null ? `<span class="${diff >= 0 ? 'text-success' : 'text-danger'}">${diff >= 0 ? '+' : ''}${diff}%</span>` : '—';
            return `<tr>
              <td><a href="#" class="text-accent" onclick="navigate('property-detail',{id:'${o.propertyId}'});return false;">${prop ? escHtml(prop.address) : '—'}</a></td>
              <td>${buyer ? escHtml(buyer.name) : '—'}</td>
              <td class="fw700">${fmtMoney(o.offerPrice)}</td>
              <td class="text-muted">${fmtMoney(prop?.listPrice)}</td>
              <td>${diffStr}</td>
              <td>${offerStatusBadge(o.status)}</td>
              <td style="font-size:.82rem">${fmtDate(o.offerDate)}</td>
              <td style="font-size:.82rem">${o.expiresAt ? fmtDate(o.expiresAt) : '—'}</td>
              <td>
                <div class="table-actions">
                  <button class="btn btn-secondary btn-sm" onclick="navigate('offer-detail',{id:'${o.id}'})">View</button>
                  <button class="btn btn-secondary btn-sm" onclick="openOfferForm('${o.id}')">Edit</button>
                </div>
              </td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>` : `
    <div class="empty-state">
      <div class="empty-icon">&#128203;</div>
      <div class="empty-title">No offers found</div>
      <div class="empty-desc">Track offer submissions, counters, and final outcomes here.</div>
      <button class="btn btn-primary mt16" onclick="openOfferForm()">+ Add Offer</button>
    </div>`}
  `;
}

// ==================== OFFER DETAIL ====================

function renderOfferDetail(el, actions, id) {
  const o = db.offers.find(x => x.id === id);
  if (!o) { el.innerHTML = '<div class="empty-state"><div class="empty-title">Offer not found.</div></div>'; return; }

  const prop = db.properties.find(p => p.id === o.propertyId);
  const buyer = db.contacts.find(c => c.id === o.buyerId);
  const agent = db.contacts.find(c => c.id === o.agentId);
  const notes = db.notes.filter(n => n.entityType === 'offer' && n.entityId === id).sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));

  const list = Number(prop?.listPrice) || 0;
  const offer = Number(o.offerPrice) || 0;
  const diff = list ? ((offer - list) / list * 100).toFixed(1) : null;

  actions.innerHTML = `
    <button class="btn btn-secondary btn-sm" onclick="navigate('offers')">&#8592; Back</button>
    <button class="btn btn-primary btn-sm" onclick="openOfferForm('${id}')">Edit Offer</button>
    <button class="btn btn-danger btn-sm" onclick="confirmDeleteOffer('${id}')">Delete</button>
  `;

  el.innerHTML = `
    <div class="detail-header">
      <div>
        <div class="detail-title">${prop ? escHtml(prop.address) : 'Unknown Property'}</div>
        <div class="detail-sub">Offer from ${buyer ? escHtml(buyer.name) : 'Unknown Buyer'} &bull; ${fmtDate(o.offerDate)}</div>
      </div>
      ${offerStatusBadge(o.status)}
    </div>

    <div class="grid-2 gap16 mb24">
      <div>
        <div class="card mb16">
          <div class="card-title">Offer Details</div>
          <div class="info-grid mt16">
            ${infoItem('Offer Price', fmtMoney(o.offerPrice))}
            ${infoItem('List Price', fmtMoney(prop?.listPrice))}
            ${infoItem('vs List', diff !== null ? `${diff >= 0 ? '+' : ''}${diff}%` : '—')}
            ${infoItem('Earnest Money', fmtMoney(o.earnestMoney))}
            ${infoItem('Down Payment', o.downPayment ? fmtMoney(o.downPayment) : '—')}
            ${infoItem('Financing', o.financing || '—')}
            ${infoItem('Offer Date', fmtDate(o.offerDate))}
            ${infoItem('Expires', fmtDate(o.expiresAt))}
            ${infoItem('Closing Date', fmtDate(o.closingDate))}
            ${infoItem('Inspection', o.inspectionDays ? `${o.inspectionDays} days` : '—')}
            ${infoItem('Contingencies', o.contingencies || '—')}
          </div>
        </div>

        <div class="card">
          <div class="card-title">Parties</div>
          <div class="info-grid mt16">
            ${infoItem('Buyer', buyer ? `<a href="#" class="text-accent" onclick="navigate('contact-detail',{id:'${buyer.id}'});return false;">${escHtml(buyer.name)}</a>` : '—')}
            ${infoItem('Buyer Agent', agent ? `<a href="#" class="text-accent" onclick="navigate('contact-detail',{id:'${agent.id}'});return false;">${escHtml(agent.name)}</a>` : '—')}
            ${infoItem('Property', prop ? `<a href="#" class="text-accent" onclick="navigate('property-detail',{id:'${prop.id}'});return false;">${escHtml(prop.address)}</a>` : '—')}
          </div>
        </div>

        <div class="card mt16">
          <div class="card-title">Quick Status Change</div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px">
            ${['pending','countered','accepted','rejected','withdrawn','closed'].map(s =>
              `<button class="btn btn-sm ${o.status === s ? 'btn-primary' : 'btn-secondary'}" onclick="changeOfferStatus('${id}','${s}')">${s.charAt(0).toUpperCase()+s.slice(1)}</button>`
            ).join('')}
          </div>
        </div>
      </div>

      <div>
        ${o.counterOffer ? `
        <div class="card mb16" style="border-left:4px solid var(--accent2)">
          <div class="card-title">Counter Offer</div>
          <div class="info-grid mt16">
            ${infoItem('Counter Price', fmtMoney(o.counterPrice))}
            ${infoItem('Counter Date', fmtDate(o.counterDate))}
            ${infoItem('Counter Expires', fmtDate(o.counterExpires))}
          </div>
          ${o.counterNotes ? `<div class="divider"></div><div style="font-size:.88rem;color:var(--text2)">${escHtml(o.counterNotes)}</div>` : ''}
        </div>` : ''}

        ${o.terms ? `
        <div class="card mb16">
          <div class="card-title">Additional Terms</div>
          <div style="font-size:.88rem;color:var(--text2);line-height:1.6;margin-top:12px">${escHtml(o.terms)}</div>
        </div>` : ''}

        <div class="section-header">
          <div class="section-title">Notes</div>
          <button class="btn btn-secondary btn-sm" onclick="openNoteForm('offer','${id}')">+ Note</button>
        </div>
        ${renderNotesList(notes, 'offer', id)}

        <div class="section-header mt24">
          <div class="section-title">Timeline</div>
        </div>
        ${renderOfferTimeline(o)}
      </div>
    </div>
  `;
}

function renderOfferTimeline(o) {
  const events = [];
  events.push({ date: o.createdAt, title: 'Offer Submitted', note: `Price: ${fmtMoney(o.offerPrice)}`, type: 'accent' });
  if (o.counterOffer) events.push({ date: o.counterDate||o.updatedAt, title: 'Counter Offer', note: `Counter: ${fmtMoney(o.counterPrice)}`, type: 'warning' });
  if (o.status === 'accepted') events.push({ date: o.updatedAt, title: 'Offer Accepted', note: '', type: 'success' });
  if (o.status === 'rejected') events.push({ date: o.updatedAt, title: 'Offer Rejected', note: '', type: 'danger' });
  if (o.status === 'withdrawn') events.push({ date: o.updatedAt, title: 'Offer Withdrawn', note: '', type: 'danger' });
  if (o.status === 'closed') events.push({ date: o.updatedAt, title: 'Deal Closed', note: '', type: 'success' });

  if (!events.length) return '<div class="text-muted" style="font-size:.88rem">No timeline events.</div>';

  return `<div class="offer-timeline">
    ${events.map(ev => `
      <div class="timeline-item">
        <div class="timeline-dot ${ev.type}">&#9679;</div>
        <div class="timeline-content">
          <div class="timeline-title">${ev.title}</div>
          <div class="timeline-date">${fmtDateTime(ev.date)}</div>
          ${ev.note ? `<div class="timeline-note">${ev.note}</div>` : ''}
        </div>
      </div>
    `).join('')}
  </div>`;
}

function changeOfferStatus(id, status) {
  const o = db.offers.find(x => x.id === id);
  if (!o) return;
  const prev = o.status;
  o.status = status;
  o.updatedAt = now();
  saveDb();
  logActivity('status_changed', `Offer status changed from ${prev} to ${status}`, 'offer', id);
  toast(`Status updated to "${status}"`, 'success');
  renderView();
}

// ==================== CONTACTS VIEW ====================

function renderContacts(el, actions) {
  actions.innerHTML = `<button class="btn btn-primary" onclick="openContactForm()">+ Add Contact</button>`;

  const search = viewState.contactSearch || '';
  const filter = viewState.contactFilter || '';

  let contacts = [...db.contacts];
  if (search) {
    const q = search.toLowerCase();
    contacts = contacts.filter(c => c.name.toLowerCase().includes(q) || (c.email||'').toLowerCase().includes(q) || (c.phone||'').toLowerCase().includes(q));
  }
  if (filter) contacts = contacts.filter(c => c.type === filter);
  contacts.sort((a,b) => a.name.localeCompare(b.name));

  el.innerHTML = `
    <div class="filter-bar">
      <div class="search-wrap">
        <span class="search-icon">&#128269;</span>
        <input class="form-control" placeholder="Search contacts..." value="${escHtml(search)}" oninput="viewState.contactSearch=this.value;renderView()" />
      </div>
      <select class="filter-select" onchange="viewState.contactFilter=this.value;renderView()">
        <option value="" ${!filter?'selected':''}>All types</option>
        <option value="buyer"  ${filter==='buyer'?'selected':''}>Buyers</option>
        <option value="seller" ${filter==='seller'?'selected':''}>Sellers</option>
        <option value="agent"  ${filter==='agent'?'selected':''}>Agents</option>
      </select>
    </div>

    ${contacts.length ? `
    <div class="table-wrap">
      <table>
        <thead><tr><th>Name</th><th>Type</th><th>Email</th><th>Phone</th><th>Company</th><th>Offers</th><th>Actions</th></tr></thead>
        <tbody>
          ${contacts.map(c => {
            const cnt = db.offers.filter(o => o.buyerId === c.id || o.agentId === c.id).length;
            return `<tr>
              <td><a href="#" class="text-accent fw700" onclick="navigate('contact-detail',{id:'${c.id}'});return false;">${escHtml(c.name)}</a></td>
              <td>${contactTypeBadge(c.type)}</td>
              <td>${c.email ? `<a href="mailto:${c.email}" style="color:var(--text2)">${escHtml(c.email)}</a>` : '—'}</td>
              <td>${c.phone ? `<a href="tel:${c.phone}" style="color:var(--text2)">${escHtml(c.phone)}</a>` : '—'}</td>
              <td>${escHtml(c.company||'—')}</td>
              <td>${cnt}</td>
              <td>
                <div class="table-actions">
                  <button class="btn btn-secondary btn-sm" onclick="openContactForm('${c.id}')">Edit</button>
                  <button class="btn btn-danger btn-sm" onclick="confirmDeleteContact('${c.id}')">Delete</button>
                </div>
              </td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>` : `
    <div class="empty-state">
      <div class="empty-icon">&#128100;</div>
      <div class="empty-title">No contacts found</div>
      <div class="empty-desc">Add buyers, sellers, and agents to track your relationships.</div>
      <button class="btn btn-primary mt16" onclick="openContactForm()">+ Add Contact</button>
    </div>`}
  `;
}

// ==================== CONTACT DETAIL ====================

function renderContactDetail(el, actions, id) {
  const c = db.contacts.find(x => x.id === id);
  if (!c) { el.innerHTML = '<div class="empty-state"><div class="empty-title">Contact not found.</div></div>'; return; }

  const relatedOffers = db.offers.filter(o => o.buyerId === id || o.agentId === id);
  const notes = db.notes.filter(n => n.entityType === 'contact' && n.entityId === id).sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));

  actions.innerHTML = `
    <button class="btn btn-secondary btn-sm" onclick="navigate('contacts')">&#8592; Back</button>
    <button class="btn btn-primary btn-sm" onclick="openContactForm('${id}')">Edit</button>
    <button class="btn btn-danger btn-sm" onclick="confirmDeleteContact('${id}')">Delete</button>
  `;

  el.innerHTML = `
    <div class="detail-header">
      <div>
        <div class="detail-title">${escHtml(c.name)}</div>
        <div class="detail-sub">${c.company ? escHtml(c.company) + ' &bull; ' : ''}${c.type || 'Contact'}</div>
      </div>
      ${contactTypeBadge(c.type)}
    </div>

    <div class="grid-2 gap16">
      <div>
        <div class="card mb16">
          <div class="card-title">Contact Info</div>
          <div class="info-grid mt16">
            ${infoItem('Email', c.email ? `<a href="mailto:${c.email}" style="color:var(--accent)">${escHtml(c.email)}</a>` : '—')}
            ${infoItem('Phone', c.phone ? `<a href="tel:${c.phone}" style="color:var(--accent)">${escHtml(c.phone)}</a>` : '—')}
            ${infoItem('Company', c.company||'—')}
            ${infoItem('License #', c.license||'—')}
            ${infoItem('Address', c.address||'—')}
            ${infoItem('Added', fmtDate(c.createdAt))}
          </div>
          ${c.notes ? `<div class="divider"></div><div style="font-size:.88rem;color:var(--text2);line-height:1.6">${escHtml(c.notes)}</div>` : ''}
        </div>

        <div class="section-header">
          <div class="section-title">Notes</div>
          <button class="btn btn-secondary btn-sm" onclick="openNoteForm('contact','${id}')">+ Note</button>
        </div>
        ${renderNotesList(notes, 'contact', id)}
      </div>

      <div>
        <div class="section-header">
          <div class="section-title">Related Offers (${relatedOffers.length})</div>
        </div>
        ${relatedOffers.length ? `
        <div class="table-wrap">
          <table>
            <thead><tr><th>Property</th><th>Price</th><th>Status</th><th>Date</th></tr></thead>
            <tbody>
              ${relatedOffers.map(o => {
                const prop = db.properties.find(p => p.id === o.propertyId);
                return `<tr style="cursor:pointer" onclick="navigate('offer-detail',{id:'${o.id}'})">
                  <td>${prop ? escHtml(prop.address) : '—'}</td>
                  <td>${fmtMoney(o.offerPrice)}</td>
                  <td>${offerStatusBadge(o.status)}</td>
                  <td style="font-size:.8rem">${fmtDate(o.offerDate)}</td>
                </tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>` : '<div class="card text-muted" style="font-size:.88rem">No related offers.</div>'}
      </div>
    </div>
  `;
}

// ==================== ANALYTICS VIEW ====================

function renderAnalytics(el, actions) {
  const total = db.offers.length;
  const byStatus = {};
  db.offers.forEach(o => { byStatus[o.status] = (byStatus[o.status]||0) + 1; });

  const accepted = byStatus.accepted||0 + byStatus.closed||0;
  const rejected = byStatus.rejected||0;
  const successRate = total ? (((byStatus.accepted||0)+(byStatus.closed||0)) / total * 100).toFixed(1) : 0;

  const pricesByProp = {};
  db.offers.forEach(o => {
    if (!pricesByProp[o.propertyId]) pricesByProp[o.propertyId] = [];
    pricesByProp[o.propertyId].push(Number(o.offerPrice)||0);
  });

  const avgOffer = total ? Math.round(db.offers.reduce((s,o) => s+(Number(o.offerPrice)||0),0) / total) : 0;
  const maxOffer = total ? Math.max(...db.offers.map(o=>Number(o.offerPrice)||0)) : 0;

  const statusColors = { pending:'accent', countered:'warning', accepted:'success', rejected:'danger', withdrawn:'', closed:'success' };
  const statusLabels = Object.keys(byStatus);
  const maxCount = Math.max(...Object.values(byStatus), 1);

  // Offers per month (last 6)
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    months.push({ label: d.toLocaleDateString('en-US',{month:'short',year:'2-digit'}), year: d.getFullYear(), month: d.getMonth() });
  }
  const offersByMonth = months.map(m => ({
    ...m,
    count: db.offers.filter(o => {
      const d = new Date(o.createdAt);
      return d.getFullYear() === m.year && d.getMonth() === m.month;
    }).length
  }));
  const maxMonthCount = Math.max(...offersByMonth.map(m => m.count), 1);

  el.innerHTML = `
    <div class="grid-4 mb24">
      <div class="stat-card accent"><div class="label">Total Offers</div><div class="value">${total}</div></div>
      <div class="stat-card success"><div class="label">Success Rate</div><div class="value">${successRate}%</div><div class="delta">Accepted or closed</div></div>
      <div class="stat-card info"><div class="label">Avg Offer Price</div><div class="value">${fmtMoney(avgOffer)}</div></div>
      <div class="stat-card warning"><div class="label">Highest Offer</div><div class="value">${fmtMoney(maxOffer)}</div></div>
    </div>

    <div class="grid-2 gap16 mb24">
      <div class="card">
        <div class="card-title">Offers by Status</div>
        <div class="bar-chart mt16">
          ${statusLabels.length ? statusLabels.map(s => `
            <div class="bar-row">
              <div class="bar-label">${s.charAt(0).toUpperCase()+s.slice(1)}</div>
              <div class="bar-track"><div class="bar-fill ${statusColors[s]||''}" style="width:${Math.round((byStatus[s]||0)/maxCount*100)}%"></div></div>
              <div class="bar-value">${byStatus[s]||0} offer${byStatus[s]!==1?'s':''}</div>
            </div>
          `).join('') : '<div class="text-muted" style="font-size:.88rem">No data yet.</div>'}
        </div>
      </div>

      <div class="card">
        <div class="card-title">Offers per Month (Last 6)</div>
        <div class="bar-chart mt16">
          ${offersByMonth.map(m => `
            <div class="bar-row">
              <div class="bar-label">${m.label}</div>
              <div class="bar-track"><div class="bar-fill" style="width:${Math.round(m.count/maxMonthCount*100)}%"></div></div>
              <div class="bar-value">${m.count}</div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>

    <div class="grid-2 gap16">
      <div class="card">
        <div class="card-title">Properties by Status</div>
        <div class="bar-chart mt16">
          ${renderPropStatusBars()}
        </div>
      </div>

      <div class="card">
        <div class="card-title">Top Properties by Offer Count</div>
        <div style="margin-top:16px;display:flex;flex-direction:column;gap:12px">
          ${topPropertiesByOffers()}
        </div>
      </div>
    </div>

    <div class="card mt24">
      <div class="card-title">Offer Price vs List Price Comparison</div>
      <div class="table-wrap mt16" style="border:none">
        <table>
          <thead><tr><th>Property</th><th>List Price</th><th>Avg Offer</th><th>Highest Offer</th><th>Offers</th><th>Best %</th></tr></thead>
          <tbody>
            ${db.properties.filter(p => db.offers.some(o => o.propertyId === p.id)).map(p => {
              const propOffers = db.offers.filter(o => o.propertyId === p.id);
              const prices = propOffers.map(o => Number(o.offerPrice)||0);
              const avg = Math.round(prices.reduce((s,v)=>s+v,0)/prices.length);
              const max = Math.max(...prices);
              const list = Number(p.listPrice)||0;
              const pct = list ? ((max-list)/list*100).toFixed(1) : null;
              return `<tr>
                <td>${escHtml(p.address)}</td>
                <td>${fmtMoney(p.listPrice)}</td>
                <td>${fmtMoney(avg)}</td>
                <td>${fmtMoney(max)}</td>
                <td>${propOffers.length}</td>
                <td>${pct !== null ? `<span class="${pct>=0?'text-success':'text-danger'}">${pct>=0?'+':''}${pct}%</span>` : '—'}</td>
              </tr>`;
            }).join('') || '<tr><td colspan="6" class="text-muted" style="text-align:center">No data</td></tr>'}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function renderPropStatusBars() {
  const statuses = ['listed','pending','sold','expired','off-market'];
  const counts = statuses.map(s => ({ label: s, count: db.properties.filter(p => p.status === s).length })).filter(x => x.count > 0);
  if (!counts.length) return '<div class="text-muted" style="font-size:.88rem">No data yet.</div>';
  const max = Math.max(...counts.map(c => c.count), 1);
  return counts.map(c => `
    <div class="bar-row">
      <div class="bar-label">${c.label.charAt(0).toUpperCase()+c.label.slice(1)}</div>
      <div class="bar-track"><div class="bar-fill" style="width:${Math.round(c.count/max*100)}%"></div></div>
      <div class="bar-value">${c.count}</div>
    </div>
  `).join('');
}

function topPropertiesByOffers() {
  const data = db.properties.map(p => ({
    p, count: db.offers.filter(o => o.propertyId === p.id).length
  })).filter(x => x.count > 0).sort((a,b) => b.count - a.count).slice(0, 6);
  if (!data.length) return '<div class="text-muted" style="font-size:.88rem">No data yet.</div>';
  return data.map(d => `
    <div style="display:flex;justify-content:space-between;align-items:center">
      <a href="#" class="text-accent" style="font-size:.88rem;flex:1;margin-right:12px" onclick="navigate('property-detail',{id:'${d.p.id}'});return false;">${escHtml(d.p.address)}</a>
      <span class="badge badge-accepted">${d.count} offer${d.count!==1?'s':''}</span>
    </div>
  `).join('');
}

// ==================== NOTES ====================

function renderNotesList(notes, entityType, entityId) {
  if (!notes.length) return '<div class="text-muted" style="font-size:.88rem">No notes yet.</div>';
  return `<div class="notes-list">
    ${notes.map(n => `
      <div class="note-item">
        <div class="note-meta">${fmtDateTime(n.createdAt)}</div>
        <div class="note-text">${escHtml(n.text)}</div>
        <div class="note-actions">
          <button class="btn btn-secondary btn-sm" onclick="openNoteForm('${entityType}','${entityId}','${n.id}')">Edit</button>
          <button class="btn btn-danger btn-sm" onclick="deleteNote('${n.id}')">Delete</button>
        </div>
      </div>
    `).join('')}
  </div>`;
}

function openNoteForm(entityType, entityId, noteId) {
  const note = noteId ? db.notes.find(n => n.id === noteId) : null;
  openModal(note ? 'Edit Note' : 'Add Note', `
    <div class="form-group">
      <label class="form-label">Note</label>
      <textarea class="form-control" id="noteText" rows="4" placeholder="Enter note...">${note ? escHtml(note.text) : ''}</textarea>
    </div>
  `, [
    { label: 'Cancel', cls: 'btn-secondary', action: closeModal },
    { label: note ? 'Save' : 'Add Note', cls: 'btn-primary', action: () => {
      const text = document.getElementById('noteText').value.trim();
      if (!text) { toast('Note cannot be empty', 'error'); return; }
      if (note) {
        note.text = text;
        note.updatedAt = now();
      } else {
        db.notes.push({ id: uid(), entityType, entityId, text, createdAt: now() });
        logActivity('note_added', `Note added`, entityType, entityId);
      }
      saveDb();
      closeModal();
      renderView();
      toast('Note saved', 'success');
    }}
  ]);
}

function deleteNote(id) {
  db.notes = db.notes.filter(n => n.id !== id);
  saveDb();
  renderView();
  toast('Note deleted', 'info');
}

// ==================== PROPERTY FORM ====================

function openPropertyForm(id) {
  const p = id ? db.properties.find(x => x.id === id) : null;
  const v = f => p ? (p[f] || '') : '';

  openModal(p ? 'Edit Property' : 'Add Property', `
    <div class="form-grid">
      <div class="form-group span2">
        <label class="form-label">Address *</label>
        <input class="form-control" id="pAddr" value="${escHtml(v('address'))}" placeholder="123 Main St" />
      </div>
      <div class="form-group">
        <label class="form-label">City</label>
        <input class="form-control" id="pCity" value="${escHtml(v('city'))}" placeholder="City" />
      </div>
      <div class="form-group">
        <label class="form-label">State</label>
        <input class="form-control" id="pState" value="${escHtml(v('state'))}" placeholder="CA" />
      </div>
      <div class="form-group">
        <label class="form-label">ZIP Code</label>
        <input class="form-control" id="pZip" value="${escHtml(v('zip'))}" placeholder="90210" />
      </div>
      <div class="form-group">
        <label class="form-label">Property Type</label>
        <select class="form-control" id="pType">
          ${['single-family','condo','townhouse','multi-family','land','commercial'].map(t =>
            `<option value="${t}" ${v('type')===t?'selected':''}>${t.replace('-',' ').replace(/\b\w/g,c=>c.toUpperCase())}</option>`
          ).join('')}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Status</label>
        <select class="form-control" id="pStatus">
          ${['listed','pending','sold','expired','off-market'].map(s =>
            `<option value="${s}" ${v('status')===s?'selected':''}>${s.charAt(0).toUpperCase()+s.slice(1)}</option>`
          ).join('')}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">List Price ($)</label>
        <input class="form-control" id="pListPrice" type="number" value="${v('listPrice')}" placeholder="500000" />
      </div>
      <div class="form-group">
        <label class="form-label">Bedrooms</label>
        <input class="form-control" id="pBeds" type="number" value="${v('beds')}" placeholder="3" />
      </div>
      <div class="form-group">
        <label class="form-label">Bathrooms</label>
        <input class="form-control" id="pBaths" type="number" step="0.5" value="${v('baths')}" placeholder="2" />
      </div>
      <div class="form-group">
        <label class="form-label">Square Feet</label>
        <input class="form-control" id="pSqft" type="number" value="${v('sqft')}" placeholder="1800" />
      </div>
      <div class="form-group">
        <label class="form-label">Year Built</label>
        <input class="form-control" id="pYearBuilt" type="number" value="${v('yearBuilt')}" placeholder="1995" />
      </div>
      <div class="form-group">
        <label class="form-label">Lot Size</label>
        <input class="form-control" id="pLotSize" value="${escHtml(v('lotSize'))}" placeholder="0.25 acres" />
      </div>
      <div class="form-group">
        <label class="form-label">HOA ($/mo)</label>
        <input class="form-control" id="pHoa" type="number" value="${v('hoa')}" placeholder="200" />
      </div>
      <div class="form-group">
        <label class="form-label">MLS Number</label>
        <input class="form-control" id="pMls" value="${escHtml(v('mlsNumber'))}" placeholder="MLS#12345" />
      </div>
      <div class="form-group">
        <label class="form-label">Listing Date</label>
        <input class="form-control" id="pListDate" type="date" value="${v('listingDate') ? v('listingDate').slice(0,10) : ''}" />
      </div>
      <div class="form-group span2">
        <label class="form-label">Description</label>
        <textarea class="form-control" id="pDesc" rows="3" placeholder="Optional description...">${escHtml(v('description'))}</textarea>
      </div>
    </div>
  `, [
    { label: 'Cancel', cls: 'btn-secondary', action: closeModal },
    { label: p ? 'Save Changes' : 'Add Property', cls: 'btn-primary', action: () => savePropertyForm(id) }
  ]);
}

function savePropertyForm(id) {
  const addr = document.getElementById('pAddr').value.trim();
  if (!addr) { toast('Address is required', 'error'); return; }

  const data = {
    address: addr,
    city: document.getElementById('pCity').value.trim(),
    state: document.getElementById('pState').value.trim(),
    zip: document.getElementById('pZip').value.trim(),
    type: document.getElementById('pType').value,
    status: document.getElementById('pStatus').value,
    listPrice: document.getElementById('pListPrice').value,
    beds: document.getElementById('pBeds').value,
    baths: document.getElementById('pBaths').value,
    sqft: document.getElementById('pSqft').value,
    yearBuilt: document.getElementById('pYearBuilt').value,
    lotSize: document.getElementById('pLotSize').value.trim(),
    hoa: document.getElementById('pHoa').value,
    mlsNumber: document.getElementById('pMls').value.trim(),
    listingDate: document.getElementById('pListDate').value,
    description: document.getElementById('pDesc').value.trim(),
  };

  if (id) {
    const p = db.properties.find(x => x.id === id);
    Object.assign(p, data, { updatedAt: now() });
    logActivity('property_updated', `Property updated: ${addr}`, 'property', id);
    toast('Property updated', 'success');
  } else {
    const p = { id: uid(), ...data, createdAt: now() };
    db.properties.push(p);
    logActivity('property_added', `Property added: ${addr}`, 'property', p.id);
    toast('Property added', 'success');
  }
  saveDb();
  closeModal();
  renderView();
}

function confirmDeleteProperty(id) {
  const p = db.properties.find(x => x.id === id);
  const offerCount = db.offers.filter(o => o.propertyId === id).length;
  openModal('Delete Property', `
    <div class="confirm-msg">Are you sure you want to delete <strong>${escHtml(p?.address)}</strong>?</div>
    ${offerCount > 0 ? `<div class="confirm-sub text-danger" style="margin-top:8px">Warning: This will also delete ${offerCount} associated offer${offerCount!==1?'s':''}.</div>` : ''}
  `, [
    { label: 'Cancel', cls: 'btn-secondary', action: closeModal },
    { label: 'Delete', cls: 'btn-danger', action: () => {
      db.offers = db.offers.filter(o => o.propertyId !== id);
      db.notes = db.notes.filter(n => !(n.entityType === 'property' && n.entityId === id));
      db.properties = db.properties.filter(x => x.id !== id);
      logActivity('property_deleted', `Property deleted: ${p?.address}`, 'property', id);
      saveDb();
      closeModal();
      navigate('properties');
      toast('Property deleted', 'info');
    }}
  ]);
}

// ==================== OFFER FORM ====================

function openOfferForm(id, prePropertyId) {
  const o = id ? db.offers.find(x => x.id === id) : null;
  const v = f => o ? (o[f] || '') : '';
  const propId = o ? o.propertyId : (prePropertyId || '');

  openModal(o ? 'Edit Offer' : 'Add Offer', `
    <div class="form-grid">
      <div class="form-group span2">
        <label class="form-label">Property *</label>
        <select class="form-control" id="oProperty">
          <option value="">-- Select Property --</option>
          ${db.properties.map(p => `<option value="${p.id}" ${p.id===propId?'selected':''}>${escHtml(p.address)}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Buyer</label>
        <select class="form-control" id="oBuyer">
          <option value="">-- Select Buyer --</option>
          ${db.contacts.filter(c=>c.type!=='seller').map(c => `<option value="${c.id}" ${c.id===v('buyerId')?'selected':''}>${escHtml(c.name)}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Buyer's Agent</label>
        <select class="form-control" id="oAgent">
          <option value="">-- Select Agent --</option>
          ${db.contacts.filter(c=>c.type==='agent').map(c => `<option value="${c.id}" ${c.id===v('agentId')?'selected':''}>${escHtml(c.name)}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Offer Price ($) *</label>
        <input class="form-control" id="oPrice" type="number" value="${v('offerPrice')}" placeholder="485000" />
      </div>
      <div class="form-group">
        <label class="form-label">Earnest Money ($)</label>
        <input class="form-control" id="oEarnest" type="number" value="${v('earnestMoney')}" placeholder="5000" />
      </div>
      <div class="form-group">
        <label class="form-label">Down Payment ($)</label>
        <input class="form-control" id="oDown" type="number" value="${v('downPayment')}" placeholder="100000" />
      </div>
      <div class="form-group">
        <label class="form-label">Financing Type</label>
        <select class="form-control" id="oFinancing">
          ${['','Conventional','FHA','VA','USDA','Cash','Jumbo','Other'].map(f =>
            `<option value="${f}" ${v('financing')===f?'selected':''}>${f||'-- Select --'}</option>`
          ).join('')}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Status</label>
        <select class="form-control" id="oStatus">
          ${['pending','countered','accepted','rejected','withdrawn','closed'].map(s =>
            `<option value="${s}" ${(v('status')||'pending')===s?'selected':''}>${s.charAt(0).toUpperCase()+s.slice(1)}</option>`
          ).join('')}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Offer Date</label>
        <input class="form-control" id="oOfferDate" type="date" value="${v('offerDate') ? v('offerDate').slice(0,10) : ''}" />
      </div>
      <div class="form-group">
        <label class="form-label">Expiration Date</label>
        <input class="form-control" id="oExpires" type="date" value="${v('expiresAt') ? v('expiresAt').slice(0,10) : ''}" />
      </div>
      <div class="form-group">
        <label class="form-label">Closing Date</label>
        <input class="form-control" id="oClosing" type="date" value="${v('closingDate') ? v('closingDate').slice(0,10) : ''}" />
      </div>
      <div class="form-group">
        <label class="form-label">Inspection Period (days)</label>
        <input class="form-control" id="oInspection" type="number" value="${v('inspectionDays')}" placeholder="10" />
      </div>
      <div class="form-group span2">
        <label class="form-label">Contingencies</label>
        <input class="form-control" id="oContingencies" value="${escHtml(v('contingencies'))}" placeholder="Financing, Inspection, Appraisal..." />
      </div>

      <div class="form-group span2" style="background:var(--bg3);border:1px solid var(--border);border-radius:8px;padding:14px">
        <label class="form-label" style="margin-bottom:10px">Counter Offer</label>
        <div class="form-grid">
          <div class="form-group">
            <label class="form-label">Counter Price ($)</label>
            <input class="form-control" id="oCounterPrice" type="number" value="${v('counterPrice')}" placeholder="490000" />
          </div>
          <div class="form-group">
            <label class="form-label">Counter Date</label>
            <input class="form-control" id="oCounterDate" type="date" value="${v('counterDate') ? v('counterDate').slice(0,10) : ''}" />
          </div>
          <div class="form-group">
            <label class="form-label">Counter Expires</label>
            <input class="form-control" id="oCounterExpires" type="date" value="${v('counterExpires') ? v('counterExpires').slice(0,10) : ''}" />
          </div>
          <div class="form-group">
            <label class="form-label">Counter Notes</label>
            <input class="form-control" id="oCounterNotes" value="${escHtml(v('counterNotes'))}" placeholder="Counter offer notes..." />
          </div>
        </div>
      </div>

      <div class="form-group span2">
        <label class="form-label">Additional Terms / Notes</label>
        <textarea class="form-control" id="oTerms" rows="3" placeholder="Any additional terms...">${escHtml(v('terms'))}</textarea>
      </div>
    </div>
  `, [
    { label: 'Cancel', cls: 'btn-secondary', action: closeModal },
    { label: o ? 'Save Changes' : 'Add Offer', cls: 'btn-primary', action: () => saveOfferForm(id) }
  ]);
}

function saveOfferForm(id) {
  const propId = document.getElementById('oProperty').value;
  const price = document.getElementById('oPrice').value;
  if (!propId) { toast('Please select a property', 'error'); return; }
  if (!price) { toast('Offer price is required', 'error'); return; }

  const counterPrice = document.getElementById('oCounterPrice').value;

  const data = {
    propertyId: propId,
    buyerId: document.getElementById('oBuyer').value,
    agentId: document.getElementById('oAgent').value,
    offerPrice: price,
    earnestMoney: document.getElementById('oEarnest').value,
    downPayment: document.getElementById('oDown').value,
    financing: document.getElementById('oFinancing').value,
    status: document.getElementById('oStatus').value,
    offerDate: document.getElementById('oOfferDate').value,
    expiresAt: document.getElementById('oExpires').value,
    closingDate: document.getElementById('oClosing').value,
    inspectionDays: document.getElementById('oInspection').value,
    contingencies: document.getElementById('oContingencies').value.trim(),
    counterOffer: !!counterPrice,
    counterPrice,
    counterDate: document.getElementById('oCounterDate').value,
    counterExpires: document.getElementById('oCounterExpires').value,
    counterNotes: document.getElementById('oCounterNotes').value.trim(),
    terms: document.getElementById('oTerms').value.trim(),
  };

  const prop = db.properties.find(p => p.id === propId);

  if (id) {
    const o = db.offers.find(x => x.id === id);
    Object.assign(o, data, { updatedAt: now() });
    logActivity('offer_updated', `Offer updated: ${fmtMoney(price)} on ${prop?.address}`, 'offer', id);
    toast('Offer updated', 'success');
  } else {
    const o = { id: uid(), ...data, createdAt: now() };
    db.offers.push(o);
    logActivity('offer_added', `Offer added: ${fmtMoney(price)} on ${prop?.address}`, 'offer', o.id);
    toast('Offer added', 'success');
  }
  saveDb();
  closeModal();
  renderView();
}

function confirmDeleteOffer(id) {
  const o = db.offers.find(x => x.id === id);
  const prop = db.properties.find(p => p.id === o?.propertyId);
  openModal('Delete Offer', `
    <div class="confirm-msg">Delete offer of <strong>${fmtMoney(o?.offerPrice)}</strong> on <strong>${escHtml(prop?.address)}</strong>?</div>
    <div class="confirm-sub">This action cannot be undone.</div>
  `, [
    { label: 'Cancel', cls: 'btn-secondary', action: closeModal },
    { label: 'Delete', cls: 'btn-danger', action: () => {
      db.notes = db.notes.filter(n => !(n.entityType === 'offer' && n.entityId === id));
      db.offers = db.offers.filter(x => x.id !== id);
      logActivity('offer_deleted', `Offer deleted: ${fmtMoney(o?.offerPrice)}`, 'offer', id);
      saveDb();
      closeModal();
      navigate('offers');
      toast('Offer deleted', 'info');
    }}
  ]);
}

// ==================== CONTACT FORM ====================

function openContactForm(id) {
  const c = id ? db.contacts.find(x => x.id === id) : null;
  const v = f => c ? (c[f] || '') : '';

  openModal(c ? 'Edit Contact' : 'Add Contact', `
    <div class="form-grid">
      <div class="form-group span2">
        <label class="form-label">Full Name *</label>
        <input class="form-control" id="cName" value="${escHtml(v('name'))}" placeholder="John Smith" />
      </div>
      <div class="form-group">
        <label class="form-label">Type</label>
        <select class="form-control" id="cType">
          ${['buyer','seller','agent'].map(t =>
            `<option value="${t}" ${v('type')===t?'selected':''}>${t.charAt(0).toUpperCase()+t.slice(1)}</option>`
          ).join('')}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Company</label>
        <input class="form-control" id="cCompany" value="${escHtml(v('company'))}" placeholder="ABC Realty" />
      </div>
      <div class="form-group">
        <label class="form-label">Email</label>
        <input class="form-control" id="cEmail" type="email" value="${escHtml(v('email'))}" placeholder="john@example.com" />
      </div>
      <div class="form-group">
        <label class="form-label">Phone</label>
        <input class="form-control" id="cPhone" type="tel" value="${escHtml(v('phone'))}" placeholder="(555) 123-4567" />
      </div>
      <div class="form-group">
        <label class="form-label">License #</label>
        <input class="form-control" id="cLicense" value="${escHtml(v('license'))}" placeholder="DRE #01234567" />
      </div>
      <div class="form-group">
        <label class="form-label">Address</label>
        <input class="form-control" id="cAddress" value="${escHtml(v('address'))}" placeholder="City, State" />
      </div>
      <div class="form-group span2">
        <label class="form-label">Notes</label>
        <textarea class="form-control" id="cNotes" rows="3" placeholder="Optional notes...">${escHtml(v('notes'))}</textarea>
      </div>
    </div>
  `, [
    { label: 'Cancel', cls: 'btn-secondary', action: closeModal },
    { label: c ? 'Save Changes' : 'Add Contact', cls: 'btn-primary', action: () => saveContactForm(id) }
  ]);
}

function saveContactForm(id) {
  const name = document.getElementById('cName').value.trim();
  if (!name) { toast('Name is required', 'error'); return; }

  const data = {
    name,
    type: document.getElementById('cType').value,
    company: document.getElementById('cCompany').value.trim(),
    email: document.getElementById('cEmail').value.trim(),
    phone: document.getElementById('cPhone').value.trim(),
    license: document.getElementById('cLicense').value.trim(),
    address: document.getElementById('cAddress').value.trim(),
    notes: document.getElementById('cNotes').value.trim(),
  };

  if (id) {
    const c = db.contacts.find(x => x.id === id);
    Object.assign(c, data, { updatedAt: now() });
    logActivity('contact_updated', `Contact updated: ${name}`, 'contact', id);
    toast('Contact updated', 'success');
  } else {
    const c = { id: uid(), ...data, createdAt: now() };
    db.contacts.push(c);
    logActivity('contact_added', `Contact added: ${name}`, 'contact', c.id);
    toast('Contact added', 'success');
  }
  saveDb();
  closeModal();
  renderView();
}

function confirmDeleteContact(id) {
  const c = db.contacts.find(x => x.id === id);
  openModal('Delete Contact', `
    <div class="confirm-msg">Delete contact <strong>${escHtml(c?.name)}</strong>?</div>
    <div class="confirm-sub">This action cannot be undone.</div>
  `, [
    { label: 'Cancel', cls: 'btn-secondary', action: closeModal },
    { label: 'Delete', cls: 'btn-danger', action: () => {
      db.notes = db.notes.filter(n => !(n.entityType === 'contact' && n.entityId === id));
      db.contacts = db.contacts.filter(x => x.id !== id);
      logActivity('contact_deleted', `Contact deleted: ${c?.name}`, 'contact', id);
      saveDb();
      closeModal();
      navigate('contacts');
      toast('Contact deleted', 'info');
    }}
  ]);
}

// ==================== MODAL ENGINE ====================

function openModal(title, bodyHtml, buttons) {
  document.getElementById('modalTitle').textContent = title;
  document.getElementById('modalBody').innerHTML = bodyHtml;
  const footer = document.getElementById('modalFooter');
  footer.innerHTML = '';
  buttons.forEach(btn => {
    const b = document.createElement('button');
    b.className = `btn ${btn.cls}`;
    b.textContent = btn.label;
    b.onclick = btn.action;
    footer.appendChild(b);
  });
  document.getElementById('modalOverlay').classList.add('open');
}

function closeModal() {
  document.getElementById('modalOverlay').classList.remove('open');
}

// ==================== TOAST ====================

function toast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  const icon = { success: '&#10003;', error: '&#10007;', info: '&#8505;' }[type] || '';
  t.innerHTML = `<span>${icon}</span><span>${message}</span>`;
  container.appendChild(t);
  setTimeout(() => { t.style.opacity = '0'; t.style.transition = 'opacity .4s'; setTimeout(() => t.remove(), 400); }, 3000);
}

// ==================== EXPORT / IMPORT ====================

function exportData() {
  const json = JSON.stringify(db, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `re_offers_backup_${new Date().toISOString().slice(0,10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
  toast('Data exported successfully', 'success');
}

function importData(file) {
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const parsed = JSON.parse(e.target.result);
      if (!parsed.properties || !parsed.offers || !parsed.contacts) {
        toast('Invalid backup file format', 'error'); return;
      }
      db = { ...defaultDb(), ...parsed };
      saveDb();
      renderView();
      toast('Data imported successfully', 'success');
    } catch (_) {
      toast('Failed to parse backup file', 'error');
    }
  };
  reader.readAsText(file);
}

// ==================== UTILS ====================

function escHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ==================== SEED DATA ====================

function seedDemoData() {
  if (db.properties.length > 0) return; // already has data

  const contacts = [
    { id: uid(), name: 'Sarah Johnson', type: 'buyer', email: 'sarah@email.com', phone: '(555) 234-5678', company: '', createdAt: now() },
    { id: uid(), name: 'Mike Chen', type: 'buyer', email: 'mchen@email.com', phone: '(555) 345-6789', company: '', createdAt: now() },
    { id: uid(), name: 'Jennifer Williams', type: 'seller', email: 'jwilliams@email.com', phone: '(555) 456-7890', company: '', createdAt: now() },
    { id: uid(), name: 'Robert Davis', type: 'agent', email: 'rdavis@realty.com', phone: '(555) 567-8901', company: 'Premier Realty', license: 'DRE#01234567', createdAt: now() },
    { id: uid(), name: 'Lisa Martinez', type: 'agent', email: 'lmartinez@realty.com', phone: '(555) 678-9012', company: 'Apex Properties', license: 'DRE#07654321', createdAt: now() },
  ];
  db.contacts = contacts;

  const p1id = uid(), p2id = uid(), p3id = uid();
  db.properties = [
    { id: p1id, address: '142 Maple Ave', city: 'Pasadena', state: 'CA', zip: '91103', type: 'single-family', status: 'listed', listPrice: 875000, beds: 4, baths: 2.5, sqft: 2200, yearBuilt: 1987, mlsNumber: 'MLS#112233', listingDate: '2026-03-01', description: 'Beautiful craftsman home in sought-after neighborhood.', createdAt: now() },
    { id: p2id, address: '55 Ocean View Blvd, Unit 12', city: 'Santa Monica', state: 'CA', zip: '90401', type: 'condo', status: 'pending', listPrice: 625000, beds: 2, baths: 2, sqft: 980, yearBuilt: 2005, hoa: 450, mlsNumber: 'MLS#445566', listingDate: '2026-02-15', createdAt: now() },
    { id: p3id, address: '8831 Hillcrest Dr', city: 'Beverly Hills', state: 'CA', zip: '90210', type: 'single-family', status: 'listed', listPrice: 2450000, beds: 5, baths: 4, sqft: 4800, yearBuilt: 2001, mlsNumber: 'MLS#778899', listingDate: '2026-03-10', createdAt: now() },
  ];

  const o1id = uid(), o2id = uid(), o3id = uid(), o4id = uid();
  db.offers = [
    { id: o1id, propertyId: p1id, buyerId: contacts[0].id, agentId: contacts[3].id, offerPrice: 855000, earnestMoney: 10000, downPayment: 175000, financing: 'Conventional', status: 'pending', offerDate: '2026-03-20', expiresAt: '2026-03-23', closingDate: '2026-04-30', inspectionDays: 10, contingencies: 'Financing, Inspection, Appraisal', createdAt: new Date('2026-03-20').toISOString() },
    { id: o2id, propertyId: p1id, buyerId: contacts[1].id, agentId: contacts[4].id, offerPrice: 870000, earnestMoney: 15000, downPayment: 200000, financing: 'Conventional', status: 'countered', counterOffer: true, counterPrice: 880000, counterDate: '2026-03-21', counterExpires: '2026-03-24', counterNotes: 'Seller prefers 45-day close.', offerDate: '2026-03-19', closingDate: '2026-05-05', inspectionDays: 7, contingencies: 'Financing, Inspection', createdAt: new Date('2026-03-19').toISOString() },
    { id: o3id, propertyId: p2id, buyerId: contacts[0].id, agentId: contacts[3].id, offerPrice: 610000, earnestMoney: 8000, financing: 'FHA', status: 'accepted', offerDate: '2026-03-05', expiresAt: '2026-03-08', closingDate: '2026-04-15', inspectionDays: 10, contingencies: 'Financing, Inspection', createdAt: new Date('2026-03-05').toISOString(), updatedAt: new Date('2026-03-07').toISOString() },
    { id: o4id, propertyId: p3id, buyerId: contacts[1].id, agentId: contacts[4].id, offerPrice: 2300000, earnestMoney: 50000, financing: 'Jumbo', status: 'pending', offerDate: '2026-03-25', expiresAt: '2026-03-28', closingDate: '2026-05-15', inspectionDays: 14, contingencies: 'Financing, Inspection, Appraisal', createdAt: new Date('2026-03-25').toISOString() },
  ];

  db.notes = [
    { id: uid(), entityType: 'property', entityId: p1id, text: 'Sellers are motivated — already purchased new home in Arizona.', createdAt: now() },
    { id: uid(), entityType: 'offer', entityId: o2id, text: 'Buyer is pre-approved for up to $900K. Flexible on close date.', createdAt: now() },
    { id: uid(), entityType: 'contact', entityId: contacts[0].id, text: 'First-time buyer. Very excited about the Maple Ave property.', createdAt: now() },
  ];

  db.activities = [
    { id: uid(), type: 'property_added', description: 'Property added: 142 Maple Ave', entityType: 'property', entityId: p1id, createdAt: new Date('2026-03-01').toISOString() },
    { id: uid(), type: 'offer_added', description: 'Offer added: $870,000 on 142 Maple Ave', entityType: 'offer', entityId: o2id, createdAt: new Date('2026-03-19').toISOString() },
    { id: uid(), type: 'offer_added', description: 'Offer added: $855,000 on 142 Maple Ave', entityType: 'offer', entityId: o1id, createdAt: new Date('2026-03-20').toISOString() },
    { id: uid(), type: 'status_changed', description: 'Offer status changed from pending to accepted', entityType: 'offer', entityId: o3id, createdAt: new Date('2026-03-07').toISOString() },
  ];

  saveDb();
}

// ==================== INIT ====================

document.addEventListener('DOMContentLoaded', async () => {
  // Show loading state
  document.getElementById('mainContent').innerHTML =
    '<div style="display:flex;align-items:center;justify-content:center;height:60vh;color:var(--text2);font-size:1rem">Loading…</div>';

  // Try to load from Supabase first, fall back to localStorage
  sbInit();
  sbSubscribeRealtime();
  if (_sb) {
    setSyncStatus('syncing');
    const cloudData = await sbLoad();
    if (cloudData) {
      db = { ...defaultDb(), ...cloudData };
      localStorage.setItem(DB_KEY, JSON.stringify(db));
      setSyncStatus('ok');
      toast('Data loaded from cloud ☁️', 'success');
    } else {
      db = loadLocalDb();
      setSyncStatus('idle');
    }
  } else {
    db = loadLocalDb();
  }

  // Seed demo data on first load
  seedDemoData();

  // Nav clicks
  document.querySelectorAll('.nav-item').forEach(el => {
    el.addEventListener('click', e => {
      e.preventDefault();
      navigate(el.dataset.view);
    });
  });

  // Modal close
  document.getElementById('modalClose').addEventListener('click', closeModal);
  document.getElementById('modalOverlay').addEventListener('click', e => {
    if (e.target === document.getElementById('modalOverlay')) closeModal();
  });

  // Export
  document.getElementById('exportBtn').addEventListener('click', exportData);

  // Import
  document.getElementById('importFile').addEventListener('change', e => {
    const file = e.target.files[0];
    if (file) { importData(file); e.target.value = ''; }
  });

  // Cloud settings
  document.getElementById('cloudBtn').addEventListener('click', openCloudSettings);

  // Mobile menu toggle
  document.getElementById('menuToggle').addEventListener('click', () => {
    document.getElementById('sidebar').classList.toggle('open');
  });

  // Close sidebar on nav click (mobile)
  document.querySelectorAll('.nav-item').forEach(el => {
    el.addEventListener('click', () => {
      document.getElementById('sidebar').classList.remove('open');
    });
  });

  // Keyboard close modal
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeModal();
  });

  // Initial render
  navigate('dashboard');
});
