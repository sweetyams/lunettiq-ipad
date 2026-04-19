// clients-screen.jsx

function ClientsScreen({ onStartSession, clientMode, initialClient }) {
  const [selected, setSelected] = React.useState(initialClient || null);
  const [query, setQuery] = React.useState('');

  React.useEffect(() => { if (initialClient) setSelected(initialClient); }, [initialClient]);

  const filtered = query
    ? CLIENTS.filter(c => c.name.toLowerCase().includes(query.toLowerCase()) || c.email.toLowerCase().includes(query.toLowerCase()))
    : CLIENTS;

  return (
    <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
      {/* Sidebar list */}
      <div style={{ width: 300, borderRight: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', background: C.white }}>
        <div style={{ padding: '16px 16px 12px' }}>
          <div style={{ background: C.offwhite, borderRadius: 2, padding: '9px 12px', display: 'flex', alignItems: 'center', gap: 8, border: `1px solid ${C.border}` }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.muted} strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search clients…" style={{ border: 'none', background: 'none', outline: 'none', fontSize: 13, color: C.text, flex: 1 }} />
          </div>
        </div>
        <div style={{ padding: '4px 16px 8px', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: C.muted, textTransform: 'uppercase' }}>
          {query ? `${filtered.length} result${filtered.length !== 1 ? 's' : ''}` : 'Recent clients'}
        </div>
        <div style={{ overflowY: 'auto', flex: 1 }}>
          {filtered.map(client => (
            <button key={client.id} onClick={() => setSelected(client)} style={{ width: '100%', background: selected?.id === client.id ? C.offwhite : 'none', border: 'none', borderLeft: `3px solid ${selected?.id === client.id ? C.green : 'transparent'}`, padding: '12px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left' }}>
              <Avatar src={client.avatar} name={client.name} size={36} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.navy, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{client.name}</div>
                <div style={{ fontSize: 11, color: C.muted }}>{client.tierLabel} · {client.lastVisit}</div>
              </div>
              {client.tier === 3 && <div style={{ width: 6, height: 6, borderRadius: '50%', background: C.gold, flexShrink: 0 }} />}
            </button>
          ))}
        </div>
        <div style={{ padding: 12, borderTop: `1px solid ${C.border}` }}>
          <button style={{ width: '100%', background: C.navy, border: 'none', borderRadius: 2, padding: '10px', color: C.white, fontSize: 13, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            New client
          </button>
        </div>
      </div>

      {/* Profile detail */}
      {selected ? <ClientProfile client={selected} onStartSession={onStartSession} clientMode={clientMode} /> : (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.muted, fontSize: 14 }}>
          Select a client to view their profile
        </div>
      )}
    </div>
  );
}

function ClientProfile({ client, onStartSession, clientMode }) {
  const [activePanel, setActivePanel] = React.useState('overview');

  return (
    <div style={{ flex: 1, display: 'flex', overflow: 'hidden', background: C.offwhite }}>
      {/* Main content */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {/* Top identity band */}
        <div style={{ background: C.white, borderBottom: `1px solid ${C.border}`, padding: '20px 24px', display: 'flex', alignItems: 'flex-start', gap: 18 }}>
          <Avatar src={client.avatar} name={client.name} size={64} />
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <h2 style={{ fontSize: 22, fontWeight: 600, color: C.navy, margin: 0 }}>{client.name}</h2>
              <TierBadge tier={client.tier} label={client.tierLabel} />
            </div>
            <div style={{ display: 'flex', gap: 16, fontSize: 12, color: C.muted }}>
              <span>{client.email}</span>
              <span>·</span>
              <span>{client.phone}</span>
              <span>·</span>
              <span>Last visit: {client.lastVisit}</span>
            </div>
            {!clientMode && (
              <div style={{ display: 'flex', gap: 16, marginTop: 8, fontSize: 12 }}>
                <div style={{ background: C.offwhite, borderRadius: 2, padding: '4px 10px' }}>
                  <span style={{ color: C.muted }}>Credits </span>
                  <span style={{ fontWeight: 600, color: C.navy }}>${client.credits.toLocaleString()}</span>
                </div>
                <div style={{ background: C.offwhite, borderRadius: 2, padding: '4px 10px' }}>
                  <span style={{ color: C.muted }}>LTV </span>
                  <span style={{ fontWeight: 600, color: C.navy }}>${client.ltv.toLocaleString()}</span>
                </div>
                <div style={{ background: C.offwhite, borderRadius: 2, padding: '4px 10px' }}>
                  <span style={{ color: C.muted }}>Returns </span>
                  <span style={{ fontWeight: 600, color: C.navy }}>{client.returnRate}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Panel tabs */}
        <div style={{ background: C.white, borderBottom: `1px solid ${C.border}`, padding: '0 24px', display: 'flex', gap: 0 }}>
          {['overview', 'orders', 'timeline'].map(p => (
            <button key={p} onClick={() => setActivePanel(p)} style={{ background: 'none', border: 'none', borderBottom: `2px solid ${activePanel === p ? C.green : 'transparent'}`, padding: '12px 16px', color: activePanel === p ? C.navy : C.muted, fontSize: 13, fontWeight: activePanel === p ? 600 : 400, cursor: 'pointer', textTransform: 'capitalize' }}>{p}</button>
          ))}
        </div>

        <div style={{ padding: '20px 24px', display: 'flex', gap: 18, flexWrap: 'wrap' }}>
          {activePanel === 'overview' && <>
            {/* Fit Profile */}
            <div style={{ flex: 1, minWidth: 220 }}>
              <SectionLabel>Fit Profile</SectionLabel>
              <Card style={{ padding: '14px 16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {[
                    { label: 'Face shape', value: client.faceShape || '—' },
                    { label: 'Frame width', value: client.measurements?.frameWidth || '—' },
                    { label: 'Bridge', value: client.measurements?.bridge || '—' },
                    { label: 'Temple', value: client.measurements?.temple || '—' },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <div style={{ fontSize: 11, color: C.muted, marginBottom: 2 }}>{label}</div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: C.navy }}>{value}</div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* Preferences */}
            <div style={{ flex: 1, minWidth: 220 }}>
              <SectionLabel>Preferences</SectionLabel>
              <Card style={{ padding: '14px 16px' }}>
                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 11, color: C.muted, marginBottom: 6 }}>Preferred</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {client.preferences.stated.length > 0
                      ? client.preferences.stated.map(p => <span key={p} style={{ background: C.greenLight, color: C.green, padding: '3px 9px', borderRadius: 2, fontSize: 11, fontWeight: 500 }}>{p}</span>)
                      : <span style={{ fontSize: 12, color: C.muted }}>None stated</span>}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: C.muted, marginBottom: 6 }}>Avoid</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {client.preferences.avoid.length > 0
                      ? client.preferences.avoid.map(p => <span key={p} style={{ background: C.redLight, color: C.red, padding: '3px 9px', borderRadius: 2, fontSize: 11, fontWeight: 500 }}>{p}</span>)
                      : <span style={{ fontSize: 12, color: C.muted }}>None stated</span>}
                  </div>
                </div>
              </Card>
            </div>

            {/* Wishlist */}
            {client.wishlist.length > 0 && (
              <div style={{ width: '100%' }}>
                <SectionLabel>Wishlist</SectionLabel>
                <div style={{ display: 'flex', gap: 10 }}>
                  {client.wishlist.map(item => (
                    <Card key={item} style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.gold} strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                      <span style={{ fontSize: 13, fontWeight: 500, color: C.navy }}>{item}</span>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </>}

          {activePanel === 'orders' && (
            <div style={{ width: '100%' }}>
              {client.orders.length === 0
                ? <div style={{ color: C.muted, fontSize: 14 }}>No orders yet.</div>
                : client.orders.map(order => (
                  <Card key={order.id} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 16px', marginBottom: 10 }}>
                    <div style={{ width: 64, height: 48, borderRadius: 2, overflow: 'hidden', background: C.cream, flexShrink: 0 }}>
                      <img src={order.img} alt={order.product} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: C.navy }}>{order.product}</div>
                      <div style={{ fontSize: 12, color: C.muted }}>{order.date} · {order.id}</div>
                    </div>
                    {!clientMode && <div style={{ fontSize: 15, fontWeight: 600, color: C.navy }}>{order.price}</div>}
                  </Card>
                ))
              }
            </div>
          )}

          {activePanel === 'timeline' && (
            <div style={{ width: '100%' }}>
              {[
                { date: 'Apr 19, 2026', type: 'Session started', detail: 'Fitting appointment — 10:00', icon: '●' },
                { date: 'Jan 28, 2026', type: 'Purchase', detail: 'Senna — Navy · $520', icon: '◆' },
                { date: 'Sep 14, 2025', type: 'Purchase', detail: 'Maison — Black · $480', icon: '◆' },
                { date: 'Jul 4, 2025', type: 'Note added', detail: 'Prefers wider bridges. Brought own Rx.', icon: '○' },
              ].map((entry, i) => (
                <div key={i} style={{ display: 'flex', gap: 14, marginBottom: 16 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: C.navy, flexShrink: 0, marginTop: 3 }} />
                    {i < 3 && <div style={{ width: 1, flex: 1, background: C.border }} />}
                  </div>
                  <div style={{ flex: 1, paddingBottom: 14 }}>
                    <div style={{ fontSize: 11, color: C.muted, marginBottom: 2 }}>{entry.date}</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: C.navy }}>{entry.type}</div>
                    <div style={{ fontSize: 12, color: C.muted }}>{entry.detail}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right action bar */}
      <div style={{ width: 180, background: C.white, borderLeft: `1px solid ${C.border}`, padding: '20px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <button onClick={() => onStartSession(client)} style={{ background: C.green, border: 'none', borderRadius: 2, padding: '12px', color: C.white, fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          Start session
        </button>
        {[
          { label: 'Book appointment', icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> },
          { label: 'Second Sight intake', icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/></svg> },
          { label: 'Custom design', icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg> },
          { label: 'Add note', icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg> },
          { label: 'Recommend product', icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg> },
        ].map((action, i) => (
          <button key={i} style={{ background: 'none', border: `1px solid ${C.border}`, borderRadius: 2, padding: '10px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, color: C.navy, fontSize: 12, fontWeight: 500, textAlign: 'left' }}>
            <span style={{ color: C.muted }}>{action.icon}</span>
            {action.label}
          </button>
        ))}
        {!clientMode && (
          <div style={{ marginTop: 'auto', padding: '12px 0', borderTop: `1px solid ${C.border}` }}>
            {client.tags.map(tag => (
              <span key={tag} style={{ background: C.cream, color: C.muted, padding: '2px 8px', borderRadius: 2, fontSize: 10, fontWeight: 600, letterSpacing: '0.05em', marginRight: 4 }}>{tag}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

Object.assign(window, { ClientsScreen, ClientProfile });
