// home-screen.jsx

function HomeScreen({ onStartSession, onViewClient, clientMode }) {
  const [checkedIn, setCheckedIn] = React.useState({});

  const statusColors = {
    'in-progress': { bg: C.greenLight, text: C.green, label: 'In progress' },
    'confirmed': { bg: '#EEF2FF', text: C.navy, label: 'Confirmed' },
    'scheduled': { bg: C.cream, text: C.muted, label: 'Scheduled' },
    'open': { bg: C.cream, text: C.muted, label: 'Open slot' },
  };

  return (
    <div style={{ flex: 1, overflowY: 'auto', background: C.offwhite, padding: '24px 28px', display: 'flex', gap: 24 }}>
      {/* Left column */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 22 }}>

        {/* Greeting */}
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 300, color: C.navy, margin: 0, letterSpacing: '-0.02em' }}>Good morning, Marie.</h1>
          <p style={{ fontSize: 14, color: C.muted, margin: '4px 0 0', fontWeight: 400 }}>4 appointments today · 2 active holds</p>
        </div>

        {/* Today's Appointments */}
        <div>
          <SectionLabel>Today's Appointments</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {APPOINTMENTS.map(apt => {
              const sc = statusColors[apt.status];
              return (
                <Card key={apt.id} style={{ padding: '14px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ textAlign: 'right', minWidth: 48 }}>
                      <div style={{ fontSize: 15, fontWeight: 600, color: C.navy }}>{apt.time}</div>
                      <div style={{ fontSize: 11, color: C.muted }}>{apt.duration}</div>
                    </div>
                    <div style={{ width: 1, height: 36, background: C.border }} />
                    {apt.avatar
                      ? <Avatar src={apt.avatar} name={apt.client} size={38} />
                      : <div style={{ width: 38, height: 38, borderRadius: '50%', background: C.cream, border: `1.5px dashed ${C.border}`, flexShrink: 0 }} />
                    }
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: C.navy }}>{apt.client || 'Walk-in slot'}</div>
                      <div style={{ fontSize: 12, color: C.muted }}>{apt.type}</div>
                      {apt.holds.length > 0 && (
                        <div style={{ fontSize: 11, color: C.green, marginTop: 2 }}>{apt.holds.length} frame{apt.holds.length > 1 ? 's' : ''} held · {apt.holds.join(', ')}</div>
                      )}
                    </div>
                    <span style={{ background: sc.bg, color: sc.text, padding: '3px 10px', borderRadius: 2, fontSize: 11, fontWeight: 600 }}>{sc.label}</span>
                    {apt.client && (
                      <button
                        onClick={() => apt.status === 'in-progress' ? onStartSession(CLIENTS.find(c => c.id === apt.clientId)) : null}
                        style={{ background: apt.status === 'in-progress' ? C.green : C.navy, border: 'none', borderRadius: 2, padding: '8px 14px', color: C.white, fontSize: 12, fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                        {apt.status === 'in-progress' ? 'Resume session' : 'Check in'}
                      </button>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Active Holds */}
        <div>
          <SectionLabel>Active Holds — Outremont</SectionLabel>
          <div style={{ display: 'flex', gap: 12 }}>
            {[
              { frame: 'Senna — Sage', client: 'Isabelle Fontaine', until: '10:00 today', img: 'https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=200&q=80' },
              { frame: 'Rêve — Caramel', client: 'Isabelle Fontaine', until: '10:00 today', img: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=200&q=80' },
            ].map((hold, i) => (
              <Card key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', flex: 1 }}>
                <div style={{ width: 48, height: 36, borderRadius: 2, overflow: 'hidden', background: C.cream, flexShrink: 0 }}>
                  <img src={hold.img} alt={hold.frame} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: C.navy }}>{hold.frame}</div>
                  <div style={{ fontSize: 11, color: C.muted }}>{hold.client} · until {hold.until}</div>
                </div>
                <div style={{ marginLeft: 'auto', width: 8, height: 8, borderRadius: '50%', background: C.green }} />
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Right column */}
      <div style={{ width: 260, display: 'flex', flexDirection: 'column', gap: 22 }}>

        {/* Quick Actions */}
        <div>
          <SectionLabel>Quick Actions</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { label: 'Search client', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>, color: C.navy },
              { label: 'New client', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/><line x1="12" y1="14" x2="12" y2="20"/><line x1="9" y1="17" x2="15" y2="17"/></svg>, color: C.navy },
              { label: 'Browse products', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>, color: C.navy },
              { label: 'Start Second Sight intake', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/></svg>, color: C.green },
            ].map((action, i) => (
              <button key={i} style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 2, padding: '11px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, color: C.navy, fontSize: 13, fontWeight: 500, textAlign: 'left' }}>
                <span style={{ color: action.color }}>{action.icon}</span>
                {action.label}
              </button>
            ))}
          </div>
        </div>

        {/* Recent Clients */}
        <div>
          <SectionLabel>Recent Clients</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {CLIENTS.slice(0, 4).map(client => (
              <button key={client.id} onClick={() => onViewClient(client)} style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 2, padding: '10px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left' }}>
                <Avatar src={client.avatar} name={client.name} size={32} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: C.navy }}>{client.name}</div>
                  <div style={{ fontSize: 11, color: C.muted }}>{client.tierLabel} · {client.lastVisit}</div>
                </div>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.muted} strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
              </button>
            ))}
          </div>
        </div>

        {/* Second Sight queue */}
        {!clientMode && (
          <Card style={{ padding: '14px 16px' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.navy, marginBottom: 8 }}>Second Sight Queue</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 13, color: C.muted }}>2 intakes pending review</div>
              <span style={{ background: C.goldLight, color: C.gold, padding: '2px 8px', borderRadius: 2, fontSize: 11, fontWeight: 600 }}>2</span>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

Object.assign(window, { HomeScreen });
