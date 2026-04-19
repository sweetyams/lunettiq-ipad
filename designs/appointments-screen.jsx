// appointments-screen.jsx

function AppointmentsScreen({ onStartSession, clientMode }) {
  const [selected, setSelected] = React.useState(null);

  const statusConfig = {
    'in-progress': { bg: C.greenLight, text: C.green, label: 'In progress' },
    'confirmed':   { bg: '#EEF2FF', text: C.navy, label: 'Confirmed' },
    'scheduled':   { bg: C.cream, text: C.muted, label: 'Scheduled' },
    'open':        { bg: C.cream, text: C.muted, label: 'Open slot' },
  };

  const typeIcons = {
    'Fitting appointment':       <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg>,
    'Second Sight intake':       <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
    'New client consultation':   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
    'Open / walk-in slot':       <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  };

  return (
    <div style={{ flex: 1, display: 'flex', overflow: 'hidden', background: C.offwhite }}>

      {/* Sidebar — day view */}
      <div style={{ width: 360, borderRight: `1px solid ${C.border}`, background: C.white, display: 'flex', flexDirection: 'column' }}>
        {/* Date header */}
        <div style={{ padding: '18px 20px', borderBottom: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: C.muted }}>Saturday</div>
          <div style={{ fontSize: 28, fontWeight: 300, color: C.navy, letterSpacing: '-0.02em' }}>April 19, 2026</div>
          <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>Montréal — Outremont · 4 appointments</div>
        </div>

        {/* Day timeline */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 0' }}>
          {/* Time blocks */}
          {['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'].map(hour => {
            const apt = APPOINTMENTS.find(a => a.time === hour);
            return (
              <div key={hour} style={{ display: 'flex', minHeight: 60, position: 'relative' }}>
                {/* Time label */}
                <div style={{ width: 52, paddingTop: 8, paddingLeft: 16, fontSize: 11, color: C.muted, fontWeight: 500, flexShrink: 0 }}>{hour}</div>
                {/* Slot */}
                <div style={{ flex: 1, borderTop: `1px solid ${C.border}`, paddingTop: 6, paddingRight: 12 }}>
                  {apt && (
                    <button onClick={() => setSelected(apt)}
                      style={{ width: '100%', background: selected?.id === apt.id ? C.offwhite : 'none', border: `1px solid ${selected?.id === apt.id ? C.navy : 'transparent'}`, borderLeft: `3px solid ${apt.status === 'in-progress' ? C.green : apt.status === 'confirmed' ? C.navy : C.border}`, borderRadius: '0 8px 8px 0', padding: '8px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left' }}>
                      {apt.avatar
                        ? <Avatar src={apt.avatar} name={apt.client} size={28} />
                        : <div style={{ width: 28, height: 28, borderRadius: '50%', background: C.cream, border: `1.5px dashed ${C.border}`, flexShrink: 0 }} />
                      }
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: C.navy, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{apt.client || 'Walk-in slot'}</div>
                        <div style={{ fontSize: 11, color: C.muted }}>{apt.type}</div>
                      </div>
                      <span style={{ background: statusConfig[apt.status].bg, color: statusConfig[apt.status].text, fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 2, flexShrink: 0 }}>
                        {statusConfig[apt.status].label}
                      </span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Detail panel */}
      <div style={{ flex: 1, display: 'flex', alignItems: selected ? 'flex-start' : 'center', justifyContent: 'center', padding: selected ? '28px' : 0 }}>
        {!selected ? (
          <div style={{ textAlign: 'center', color: C.muted }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ marginBottom: 8, opacity: 0.4 }}><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            <div style={{ fontSize: 14 }}>Select an appointment</div>
          </div>
        ) : (
          <div style={{ width: '100%', maxWidth: 560 }}>
            {/* Appointment card */}
            <div style={{ background: C.white, borderRadius: 2, border: `1px solid ${C.border}`, overflow: 'hidden', marginBottom: 16 }}>
              {/* Header */}
              <div style={{ background: selected.status === 'in-progress' ? C.green : C.navy, padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
                {selected.avatar
                  ? <Avatar src={selected.avatar} name={selected.client} size={48} />
                  : <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', border: '2px dashed rgba(255,255,255,0.3)', flexShrink: 0 }} />
                }
                <div>
                  <div style={{ fontSize: 20, fontWeight: 600, color: C.white }}>{selected.client || 'Walk-in slot'}</div>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span>{typeIcons[selected.type]}</span>
                    {selected.type}
                  </div>
                </div>
                <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                  <div style={{ fontSize: 24, fontWeight: 300, color: C.white }}>{selected.time}</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>{selected.duration}</div>
                </div>
              </div>

              {/* Body */}
              <div style={{ padding: '18px 20px' }}>
                {/* Holds */}
                {selected.holds.length > 0 && (
                  <div style={{ marginBottom: 16 }}>
                    <SectionLabel>Frames on hold</SectionLabel>
                    <div style={{ display: 'flex', gap: 10 }}>
                      {selected.holds.map((hold, i) => (
                        <div key={i} style={{ background: C.greenLight, borderRadius: 2, padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div style={{ width: 6, height: 6, borderRadius: '50%', background: C.green }} />
                          <span style={{ fontSize: 12, fontWeight: 600, color: C.green }}>{hold}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Status */}
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 16 }}>
                  <span style={{ background: statusConfig[selected.status].bg, color: statusConfig[selected.status].text, padding: '4px 12px', borderRadius: 2, fontSize: 12, fontWeight: 600 }}>{statusConfig[selected.status].label}</span>
                  {selected.status === 'in-progress' && <span style={{ fontSize: 12, color: C.muted }}>Session started 10:05 · 37 min elapsed</span>}
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  {selected.client && selected.status !== 'open' && (
                    <>
                      <button onClick={() => onStartSession(CLIENTS.find(c => c.id === selected.clientId))}
                        style={{ background: selected.status === 'in-progress' ? C.green : C.navy, border: 'none', borderRadius: 2, padding: '11px 18px', color: C.white, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                        {selected.status === 'in-progress' ? 'Resume session' : 'Start session'}
                      </button>
                      {selected.status !== 'in-progress' && (
                        <button style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 2, padding: '11px 18px', color: C.navy, fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
                          Check in client
                        </button>
                      )}
                    </>
                  )}
                  {selected.status !== 'in-progress' && selected.client && (
                    <button style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 2, padding: '11px 18px', color: C.red, fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
                      Mark no-show
                    </button>
                  )}
                  {selected.status === 'open' && (
                    <button style={{ background: C.navy, border: 'none', borderRadius: 2, padding: '11px 18px', color: C.white, fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                      New walk-in
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Upcoming summary */}
            <div>
              <SectionLabel>Remaining today</SectionLabel>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {APPOINTMENTS.filter(a => a.id !== selected.id).map(apt => (
                  <div key={apt.id} onClick={() => setSelected(apt)} style={{ background: C.white, borderRadius: 2, border: `1px solid ${C.border}`, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: C.navy, minWidth: 44 }}>{apt.time}</span>
                    <span style={{ fontSize: 13, color: C.muted }}>{apt.client || 'Walk-in slot'}</span>
                    <span style={{ marginLeft: 'auto', background: statusConfig[apt.status].bg, color: statusConfig[apt.status].text, padding: '2px 8px', borderRadius: 2, fontSize: 10, fontWeight: 600 }}>{statusConfig[apt.status].label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

Object.assign(window, { AppointmentsScreen });
