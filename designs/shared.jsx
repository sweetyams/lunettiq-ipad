// shared.jsx — tokens, data, shared components

const C = {
  navy: '#0A0A0A',
  navyLight: '#222222',
  green: '#0E0FD0',
  greenLight: '#EEEEFF',
  offwhite: '#F7F7F7',
  cream: '#F0F0F0',
  gold: '#7A5C1E',
  goldLight: '#F5F0E6',
  text: '#0A0A0A',
  muted: '#767676',
  border: '#E5E5E5',
  white: '#FFFFFF',
  red: '#C0392B',
  redLight: '#FDECEA',
};

const FONTS = `font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;`;

// ── Data ─────────────────────────────────────────────────────────────────────

const CLIENTS = [
  { id: 1, name: 'Isabelle Fontaine', email: 'isabelle@fontaine.ca', phone: '+1 514 555 0182', tier: 3, tierLabel: 'Tier III', credits: 2840, ltv: 8450, avatar: 'https://i.pravatar.cc/100?img=47', faceShape: 'Oval', measurements: { frameWidth: '140mm', bridge: '18mm', temple: '145mm' }, tags: ['VIP', 'fit-sensitive'], returnRate: '4%', lastVisit: 'Jan 28, 2026', preferences: { stated: ['Round', 'Oval', 'Acetate', 'Dark tones'], avoid: ['Metal', 'Square'] }, orders: [ { id: 'LQ-2891', date: 'Jan 28, 2026', product: 'Senna — Navy', price: '$520', img: 'https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=200&q=80' }, { id: 'LQ-2340', date: 'Sep 14, 2025', product: 'Maison — Black', price: '$480', img: 'https://images.unsplash.com/photo-1508296695146-257a814070b4?w=200&q=80' }, { id: 'LQ-1970', date: 'Mar 02, 2025', product: 'Rêve — Sage', price: '$545', img: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=200&q=80' } ], wishlist: ['Collette — Tortoise', 'Birch — Gold'] },
  { id: 2, name: 'Thomas Bouchard', email: 'thomas.b@gmail.com', phone: '+1 514 555 0234', tier: 1, tierLabel: 'Tier I', credits: 310, ltv: 940, avatar: 'https://i.pravatar.cc/100?img=12', faceShape: 'Square', measurements: { frameWidth: '148mm', bridge: '20mm', temple: '150mm' }, tags: [], returnRate: '0%', lastVisit: 'Nov 5, 2025', preferences: { stated: ['Metal', 'Minimal'], avoid: ['Bold colours'] }, orders: [ { id: 'LQ-2210', date: 'Nov 5, 2025', product: 'Birch — Silver', price: '$440', img: 'https://images.unsplash.com/photo-1509695507497-903c140c43b0?w=200&q=80' } ], wishlist: [] },
  { id: 3, name: 'Margot Arsenault', email: 'margot.a@icloud.com', phone: '+1 514 555 0371', tier: 1, tierLabel: 'New', credits: 0, ltv: 0, avatar: 'https://i.pravatar.cc/100?img=25', faceShape: 'Heart', measurements: null, tags: ['new'], returnRate: '—', lastVisit: '—', preferences: { stated: [], avoid: [] }, orders: [], wishlist: [] },
  { id: 4, name: 'Sophie Tremblay', email: 's.tremblay@outlook.com', phone: '+1 438 555 0099', tier: 2, tierLabel: 'Tier II', credits: 980, ltv: 3100, avatar: 'https://i.pravatar.cc/100?img=9', faceShape: 'Round', measurements: { frameWidth: '136mm', bridge: '16mm', temple: '140mm' }, tags: [], returnRate: '8%', lastVisit: 'Feb 3, 2026', preferences: { stated: ['Cat-eye', 'Tortoise', 'Acetate'], avoid: [] }, orders: [ { id: 'LQ-2750', date: 'Feb 3, 2026', product: 'Collette — Tortoise', price: '$495', img: 'https://images.unsplash.com/photo-1591076482161-42ce6da69f67?w=200&q=80' } ], wishlist: ['Véronique — Champagne'] },
  { id: 5, name: 'Jean-Luc Morin', email: 'jlmorin@bell.net', phone: '+1 514 555 0412', tier: 2, tierLabel: 'Tier II', credits: 650, ltv: 2200, avatar: 'https://i.pravatar.cc/100?img=67', faceShape: 'Oblong', measurements: { frameWidth: '144mm', bridge: '19mm', temple: '148mm' }, tags: [], returnRate: '5%', lastVisit: 'Dec 18, 2025', preferences: { stated: ['Oval', 'Acetate', 'Earth tones'], avoid: ['Plastic'] }, orders: [], wishlist: ['Ardoise — Slate'] },
];

const PRODUCTS = [
  { id: 1, name: 'Senna', collection: 'Signature', shape: 'Round', material: 'Acetate', colours: ['Navy', 'Black', 'Sage'], price: 520, img: 'https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=600&q=80', frameWidth: '138mm', bridge: '18mm', temple: '143mm', inventory: 4, desc: 'A refined round silhouette in premium Italian acetate. The Senna has been part of the Signature collection since 2019.' },
  { id: 2, name: 'Collette', collection: 'Signature', shape: 'Cat-eye', material: 'Acetate', colours: ['Tortoise', 'Champagne', 'Black'], price: 495, img: 'https://images.unsplash.com/photo-1591076482161-42ce6da69f67?w=600&q=80', frameWidth: '134mm', bridge: '17mm', temple: '140mm', inventory: 2, desc: 'The defining cat-eye of the Signature range. Handmade in France from Mazzucchelli acetate.' },
  { id: 3, name: 'Birch', collection: 'Permanent', shape: 'Square', material: 'Titanium', colours: ['Gold', 'Silver', 'Gunmetal'], price: 640, img: 'https://images.unsplash.com/photo-1509695507497-903c140c43b0?w=600&q=80', frameWidth: '146mm', bridge: '20mm', temple: '150mm', inventory: 6, desc: 'Razor-thin titanium in a wide square format. Understated hardware with Japanese precision hinges.' },
  { id: 4, name: 'Rêve', collection: 'Signature', shape: 'Oval', material: 'Acetate', colours: ['Sage', 'Caramel', 'Black'], price: 545, img: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=600&q=80', frameWidth: '136mm', bridge: '17mm', temple: '142mm', inventory: 3, desc: 'A soft oval with a slightly upsweep. Available in seasonal colourways twice a year.' },
  { id: 5, name: 'Maison', collection: 'Permanent', shape: 'Round', material: 'Acetate', colours: ['Black', 'Tortoise', 'Navy'], price: 480, img: 'https://images.unsplash.com/photo-1508296695146-257a814070b4?w=600&q=80', frameWidth: '140mm', bridge: '18mm', temple: '145mm', inventory: 8, desc: 'The house frame. Clean, generous, and endlessly versatile. A Lunettiq permanent.' },
  { id: 6, name: 'Véronique', collection: 'Collaborations', shape: 'Cat-eye', material: 'Acetate', colours: ['Champagne', 'Forest'], price: 580, img: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&q=80', frameWidth: '133mm', bridge: '16mm', temple: '138mm', inventory: 1, desc: 'A collaboration with Studio Atelier Marcelle. Limited run of 150 pieces per colourway.' },
  { id: 7, name: 'Ardoise', collection: 'Permanent', shape: 'Square', material: 'Titanium', colours: ['Slate', 'Black', 'Rose Gold'], price: 610, img: 'https://images.unsplash.com/photo-1577803645773-f96470509666?w=600&q=80', frameWidth: '144mm', bridge: '19mm', temple: '148mm', inventory: 5, desc: 'Wide titanium squares with a gentle keyhole bridge. Popular with clients who prefer bold geometry.' },
  { id: 8, name: 'Camille', collection: 'Signature', shape: 'Oval', material: 'Acetate', colours: ['Forest', 'Navy', 'Black'], price: 515, img: 'https://images.unsplash.com/photo-1589450870685-df1a0d7f7e42?w=600&q=80', frameWidth: '137mm', bridge: '18mm', temple: '143mm', inventory: 0, desc: 'A tighter oval with an architectural bridge. The green colourways have a short waitlist.' },
];

const APPOINTMENTS = [
  { id: 1, clientId: 1, client: 'Isabelle Fontaine', time: '10:00', duration: '60 min', type: 'Fitting appointment', status: 'in-progress', holds: ['Senna — Sage', 'Rêve — Caramel'], avatar: 'https://i.pravatar.cc/100?img=47' },
  { id: 2, clientId: 2, client: 'Thomas Bouchard', time: '11:30', duration: '30 min', type: 'Second Sight intake', status: 'confirmed', holds: [], avatar: 'https://i.pravatar.cc/100?img=12' },
  { id: 3, clientId: 3, client: 'Margot Arsenault', time: '14:00', duration: '45 min', type: 'New client consultation', status: 'scheduled', holds: [], avatar: 'https://i.pravatar.cc/100?img=25' },
  { id: 4, clientId: null, client: null, time: '16:30', duration: '60 min', type: 'Open / walk-in slot', status: 'open', holds: [], avatar: null },
];

// ── Shared Components ─────────────────────────────────────────────────────────

function TierBadge({ tier, label }) {
  const colors = { 1: { bg: C.cream, text: C.muted }, 2: { bg: '#EBEBEB', text: '#333' }, 3: { bg: C.text, text: C.white } };
  const c = colors[tier] || colors[1];
  return <span style={{ background: c.bg, color: c.text, padding: '2px 8px', borderRadius: 2, fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{label}</span>;
}

function Avatar({ src, name, size = 40 }) {
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', overflow: 'hidden', background: C.cream, flexShrink: 0, border: `1.5px solid ${C.border}` }}>
      <img src={src} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.target.style.display = 'none'; }} />
    </div>
  );
}

function Card({ children, style, onClick }) {
  return (
    <div onClick={onClick} style={{ background: C.white, borderRadius: 0, border: `1px solid ${C.border}`, overflow: 'hidden', ...(onClick ? { cursor: 'pointer' } : {}), ...style }}>
      {children}
    </div>
  );
}

function SectionLabel({ children }) {
  return <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: C.muted, textTransform: 'uppercase', marginBottom: 10 }}>{children}</div>;
}

function ActionBtn({ icon, label, color, onClick, small }) {
  return (
    <button onClick={onClick} style={{ background: color || C.navy, border: 'none', borderRadius: 0, padding: small ? '8px 14px' : '10px 18px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, color: C.white, fontSize: small ? 12 : 13, fontWeight: 500, whiteSpace: 'nowrap' }}>
      {icon && <span style={{ opacity: 0.9 }}>{icon}</span>}
      {label}
    </button>
  );
}

function ModeBar({ clientMode }) {
  if (!clientMode) return null;
  return (
    <div style={{ background: C.text, padding: '6px 20px', display: 'flex', alignItems: 'center', gap: 10, fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: C.white }}>
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
      CLIENT VIEW — internal data hidden
      <span style={{ marginLeft: 'auto', fontSize: 10, fontWeight: 400, opacity: 0.6 }}>Double-tap home to exit</span>
    </div>
  );
}

function StatusBar({ staffName, syncStatus, clientMode, onToggleMode }) {
  return (
    <div style={{ background: C.text, padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
        <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: C.white, letterSpacing: '0.04em' }}>
          {staffName.split(' ').map(n => n[0]).join('')}
        </div>
        <span style={{ color: C.white, fontSize: 13, fontWeight: 500 }}>{staffName}</span>
        <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>·</span>
        <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>Montréal — Outremont</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: syncStatus === 'synced' ? '#4CAF50' : syncStatus === 'pending' ? '#FFC107' : '#F44336' }} />
        <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>{syncStatus === 'synced' ? 'Synced' : syncStatus === 'pending' ? '3 pending' : 'Sync error'}</span>
      </div>
      <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12, marginLeft: 4 }}>Apr 19, 2026</span>
      <button onClick={onToggleMode} style={{ background: clientMode ? C.white : 'rgba(255,255,255,0.1)', border: `1px solid ${clientMode ? C.white : 'rgba(255,255,255,0.15)'}`, borderRadius: 0, padding: '5px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, color: clientMode ? C.text : C.white, fontSize: 11, fontWeight: 600, letterSpacing: '0.06em' }}>
        {clientMode ? (
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
        ) : (
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
        )}
        {clientMode ? 'CLIENT VIEW' : 'STAFF VIEW'}
      </button>
    </div>
  );
}

function TabBar({ activeTab, onTabChange, sessionActive }) {
  const tabs = [
    { id: 'home', label: 'Home', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> },
    { id: 'clients', label: 'Clients', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
    { id: 'products', label: 'Products', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="7" height="7" rx="0"/><rect x="14" y="3" width="7" height="7" rx="0"/><rect x="3" y="14" width="7" height="7" rx="0"/><rect x="14" y="14" width="7" height="7" rx="0"/></svg> },
    { id: 'appointments', label: 'Calendar', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="4" width="18" height="18" rx="0"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> },
    { id: 'more', label: 'More', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="5" cy="12" r="1" fill="currentColor"/><circle cx="12" cy="12" r="1" fill="currentColor"/><circle cx="19" cy="12" r="1" fill="currentColor"/></svg> },
  ];
  return (
    <div style={{ background: C.text, borderTop: `1px solid rgba(255,255,255,0.06)`, display: 'flex', padding: '0 12px' }}>
      {tabs.map(tab => {
        const active = activeTab === tab.id;
        return (
          <button key={tab.id} onClick={() => onTabChange(tab.id)} style={{ flex: 1, background: 'none', border: 'none', cursor: 'pointer', padding: '10px 8px 12px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, color: active ? C.white : 'rgba(255,255,255,0.3)', transition: 'color 0.1s' }}>
            {tab.icon}
            <span style={{ fontSize: 10, fontWeight: active ? 700 : 400, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{tab.label}</span>
            {active && <div style={{ width: 16, height: 1.5, background: C.white, marginTop: -2 }} />}
          </button>
        );
      })}
      {sessionActive && (
        <div style={{ display: 'flex', alignItems: 'center', padding: '0 14px', borderLeft: '1px solid rgba(255,255,255,0.08)', marginLeft: 8 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#4CAF50', marginRight: 8 }} />
          <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 10, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Session</span>
        </div>
      )}
    </div>
  );
}

Object.assign(window, { C, FONTS, CLIENTS, PRODUCTS, APPOINTMENTS, ModeBar, StatusBar, TabBar, TierBadge, Avatar, Card, SectionLabel, ActionBtn });
