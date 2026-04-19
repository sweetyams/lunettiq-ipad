// session-fitting.jsx

function SessionMode({ client, onEnd, clientMode, onToggleMode }) {
  const [subMode, setSubMode] = React.useState('browse'); // browse | fitting
  const [triedFrames, setTriedFrames] = React.useState([
    { id: 1, product: PRODUCTS[0], verdict: 'loved', notes: 'Great fit, loves the colour', img: PRODUCTS[0].img },
    { id: 2, product: PRODUCTS[3], verdict: 'liked', notes: 'Slightly wide at temples', img: PRODUCTS[3].img },
  ]);
  const [sessionNotes, setSessionNotes] = React.useState('Client prefers rounder shapes. Looking to replace Maison.');
  const [selectedFrame, setSelectedFrame] = React.useState(null);
  const [compareIds, setCompareIds] = React.useState([]);

  const verdictConfig = {
    loved: { color: C.green, label: 'Loved' },
    liked: { color: C.navy, label: 'Liked' },
    unsure: { color: C.gold, label: 'Unsure' },
    rejected: { color: C.red, label: 'Rejected' },
  };

  const toggleCompare = (id) => setCompareIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : prev.length < 4 ? [...prev, id] : prev);

  if (subMode === 'fitting') return (
    <FittingMode client={client} triedFrames={triedFrames} setTriedFrames={setTriedFrames} onBack={() => setSubMode('browse')} clientMode={clientMode} compareIds={compareIds} toggleCompare={toggleCompare} />
  );

  return (
    <div style={{ flex: 1, display: 'flex', overflow: 'hidden', background: C.offwhite }}>

      {/* Left 60% — main area */}
      <div style={{ flex: '0 0 60%', display: 'flex', flexDirection: 'column', overflow: 'hidden', borderRight: `1px solid ${C.border}` }}>
        {/* Session toolbar */}
        <div style={{ background: C.white, borderBottom: `1px solid ${C.border}`, padding: '10px 18px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: C.green, boxShadow: `0 0 0 3px ${C.greenLight}` }} />
          <span style={{ fontSize: 13, fontWeight: 600, color: C.navy }}>Session — {client.name}</span>
          <span style={{ fontSize: 12, color: C.muted }}>started 10:05</span>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            <button onClick={() => setSubMode('fitting')} style={{ background: C.green, border: 'none', borderRadius: 2, padding: '8px 14px', color: C.white, fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg>
              Start fitting
            </button>
            <button onClick={onEnd} style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 2, padding: '8px 14px', color: C.navy, fontSize: 12, fontWeight: 500, cursor: 'pointer' }}>End session</button>
          </div>
        </div>

        {/* Product browse area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '18px 18px' }}>
          <div style={{ marginBottom: 16 }}>
            <SectionLabel>Best match for {client.name}</SectionLabel>
            <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
              {['Best match', 'All products', 'Wishlist'].map((label, i) => (
                <button key={label} style={{ background: i === 0 ? C.navy : C.white, border: `1px solid ${i === 0 ? C.navy : C.border}`, borderRadius: 2, padding: '5px 14px', fontSize: 12, fontWeight: i === 0 ? 600 : 400, color: i === 0 ? C.white : C.text, cursor: 'pointer' }}>{label}</button>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              {PRODUCTS.slice(0, 6).map((product, i) => (
                <div key={product.id} style={{ background: C.white, borderRadius: 2, border: `1px solid ${C.border}`, overflow: 'hidden', cursor: 'pointer' }}
                  onClick={() => setSelectedFrame(selectedFrame?.id === product.id ? null : product)}>
                  <div style={{ height: 110, overflow: 'hidden', background: C.cream }}>
                    <img src={product.img} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <div style={{ padding: '10px 12px' }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: C.navy }}>{product.name}</div>
                    <div style={{ fontSize: 11, color: C.muted }}>{product.shape} · {product.material}</div>
                    {i < 3 && (
                      <div style={{ marginTop: 6, fontSize: 10, color: C.green, fontWeight: 600 }}>
                        {i === 0 ? '✓ Matches oval preference · Acetate' : i === 1 ? '✓ Preferred cat-eye shape' : '✓ In wishlist'}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tried frames shelf */}
          {triedFrames.length > 0 && (
            <div style={{ marginTop: 8 }}>
              <SectionLabel>Tried today ({triedFrames.length})</SectionLabel>
              <div style={{ display: 'flex', gap: 10 }}>
                {triedFrames.map(frame => {
                  const vc = verdictConfig[frame.verdict] || verdictConfig.unsure;
                  return (
                    <div key={frame.id} style={{ width: 130, background: C.white, borderRadius: 2, border: `1px solid ${C.border}`, overflow: 'hidden', cursor: 'pointer' }}>
                      <div style={{ height: 90, overflow: 'hidden', background: C.cream }}>
                        <img src={frame.img} alt={frame.product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                      <div style={{ padding: '8px 10px' }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: C.navy }}>{frame.product.name}</div>
                        <span style={{ background: `${vc.color}15`, color: vc.color, fontSize: 10, fontWeight: 600, padding: '2px 6px', borderRadius: 2 }}>{vc.label}</span>
                      </div>
                    </div>
                  );
                })}
                {compareIds.length >= 2 && (
                  <div style={{ display: 'flex', alignItems: 'center', padding: '0 10px' }}>
                    <button style={{ background: C.navy, border: 'none', borderRadius: 2, padding: '8px 12px', color: C.white, fontSize: 11, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>Compare {compareIds.length}</button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right 40% — client context */}
      <div style={{ flex: '0 0 40%', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: C.white }}>
        {/* Client header */}
        <div style={{ padding: '16px 18px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 12 }}>
          <Avatar src={client.avatar} name={client.name} size={40} />
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: C.navy }}>{client.name}</div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <TierBadge tier={client.tier} label={client.tierLabel} />
              <span style={{ fontSize: 11, color: C.muted }}>· {client.faceShape} face</span>
            </div>
          </div>
          {!clientMode && <div style={{ marginLeft: 'auto', fontSize: 13, fontWeight: 600, color: C.navy }}>${client.credits.toLocaleString()} cr.</div>}
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Fit profile */}
          <div>
            <SectionLabel>Fit Profile</SectionLabel>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[['Face', client.faceShape], ['Width', client.measurements?.frameWidth || '—'], ['Bridge', client.measurements?.bridge || '—'], ['Temple', client.measurements?.temple || '—']].map(([k, v]) => (
                <div key={k} style={{ background: C.offwhite, borderRadius: 2, padding: '8px 10px' }}>
                  <div style={{ fontSize: 10, color: C.muted }}>{k}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: C.navy }}>{v}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Preferences */}
          <div>
            <SectionLabel>Preferences</SectionLabel>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 6 }}>
              {client.preferences.stated.map(p => <span key={p} style={{ background: C.greenLight, color: C.green, padding: '3px 8px', borderRadius: 2, fontSize: 11, fontWeight: 500 }}>{p}</span>)}
            </div>
            {client.preferences.avoid.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {client.preferences.avoid.map(p => <span key={p} style={{ background: C.redLight, color: C.red, padding: '3px 8px', borderRadius: 2, fontSize: 11, fontWeight: 500 }}>avoid: {p}</span>)}
              </div>
            )}
          </div>

          {/* Recent orders */}
          <div>
            <SectionLabel>Recent orders</SectionLabel>
            {client.orders.slice(0, 2).map(order => (
              <div key={order.id} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <div style={{ width: 44, height: 32, borderRadius: 2, overflow: 'hidden', background: C.cream, flexShrink: 0 }}>
                  <img src={order.img} alt={order.product} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: C.navy }}>{order.product}</div>
                  <div style={{ fontSize: 11, color: C.muted }}>{order.date}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Wishlist */}
          {client.wishlist.length > 0 && (
            <div>
              <SectionLabel>Wishlist</SectionLabel>
              {client.wishlist.map(item => (
                <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: `1px solid ${C.border}` }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill={C.gold} stroke={C.gold} strokeWidth="1"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                  <span style={{ fontSize: 12, color: C.navy }}>{item}</span>
                </div>
              ))}
            </div>
          )}

          {/* Session notes */}
          {!clientMode && (
            <div>
              <SectionLabel>Session notes (internal)</SectionLabel>
              <textarea value={sessionNotes} onChange={e => setSessionNotes(e.target.value)}
                style={{ width: '100%', minHeight: 80, border: `1px solid ${C.border}`, borderRadius: 2, padding: '10px 12px', fontSize: 12, color: C.navy, background: C.offwhite, resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.6, boxSizing: 'border-box', outline: 'none' }} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FittingMode({ client, triedFrames, setTriedFrames, onBack, clientMode, compareIds, toggleCompare }) {
  const [showCompare, setShowCompare] = React.useState(false);
  const [activeFrame, setActiveFrame] = React.useState(null);

  const verdictConfig = {
    loved: { color: C.green, label: 'Loved' },
    liked: { color: C.navy, label: 'Liked' },
    unsure: { color: C.gold, label: 'Unsure' },
    rejected: { color: C.red, label: 'Rejected' },
  };

  const setVerdict = (frameId, verdict) => {
    setTriedFrames(frames => frames.map(f => f.id === frameId ? { ...f, verdict } : f));
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#0A0A0A' }}>
      {/* Top bar */}
      <div style={{ background: 'rgba(0,0,0,0.8)', padding: '10px 18px', display: 'flex', alignItems: 'center', gap: 12, backdropFilter: 'blur(8px)' }}>
        <button onClick={onBack} style={{ background: 'rgba(255,255,255,0.12)', border: 'none', borderRadius: 2, padding: '8px 12px', color: C.white, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
          Exit fitting
        </button>
        <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>Fitting — {client.name}</span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          {triedFrames.length >= 2 && (
            <button onClick={() => setShowCompare(!showCompare)} style={{ background: showCompare ? C.white : 'rgba(255,255,255,0.12)', border: 'none', borderRadius: 2, padding: '8px 14px', color: showCompare ? C.navy : C.white, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Compare {triedFrames.length}</button>
          )}
        </div>
      </div>

      {showCompare ? (
        /* Compare view */
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: `repeat(${triedFrames.length}, 1fr)`, gap: 2, overflow: 'hidden' }}>
          {triedFrames.map(frame => {
            const vc = verdictConfig[frame.verdict] || verdictConfig.unsure;
            return (
              <div key={frame.id} style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <img src={frame.img} alt={frame.product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div style={{ background: 'rgba(0,0,0,0.85)', padding: '12px 14px' }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: C.white }}>{frame.product.name}</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginBottom: 8 }}>{frame.product.shape} · {frame.product.material}</div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {Object.entries(verdictConfig).map(([key, v]) => (
                      <button key={key} onClick={() => setVerdict(frame.id, key)} style={{ background: frame.verdict === key ? v.color : 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 2, padding: '5px 10px', color: C.white, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>{v.label}</button>
                    ))}
                  </div>
                  {frame.notes && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 6 }}>{frame.notes}</div>}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Camera + shelf view */
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Camera area */}
          <div style={{ flex: 1, position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {/* Placeholder camera view */}
            <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #1a1a2e 0%, #0f0f1a 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
              {/* Face guide overlay */}
              <div style={{ width: 280, height: 340, border: '2px solid rgba(255,255,255,0.2)', borderRadius: '50%', position: 'absolute' }} />
              <div style={{ width: 2, height: 20, background: 'rgba(255,255,255,0.2)', position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }} />
              <div style={{ width: 20, height: 2, background: 'rgba(255,255,255,0.2)', position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }} />
              <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)' }}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ marginBottom: 8 }}><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/><path d="m21 21-4.35-4.35"/></svg>
                <div style={{ fontSize: 13 }}>Camera ready</div>
              </div>
            </div>

            {/* Capture button */}
            <div style={{ position: 'absolute', bottom: 24, left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <button style={{ width: 72, height: 72, borderRadius: '50%', background: C.white, border: '4px solid rgba(255,255,255,0.3)', cursor: 'pointer', boxShadow: '0 4px 20px rgba(0,0,0,0.4)' }} />
              <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>Tap to capture · volume button also works</span>
            </div>
          </div>

          {/* Frame shelf */}
          <div style={{ background: 'rgba(0,0,0,0.9)', borderTop: '1px solid rgba(255,255,255,0.08)', padding: '12px 16px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>
              {triedFrames.length} frame{triedFrames.length !== 1 ? 's' : ''} tried
            </div>
            <div style={{ display: 'flex', gap: 10, overflowX: 'auto' }}>
              {triedFrames.map(frame => {
                const vc = verdictConfig[frame.verdict] || {};
                return (
                  <div key={frame.id} onClick={() => setActiveFrame(activeFrame?.id === frame.id ? null : frame)}
                    style={{ width: 110, flexShrink: 0, borderRadius: 2, overflow: 'hidden', border: `2px solid ${activeFrame?.id === frame.id ? C.white : 'rgba(255,255,255,0.1)'}`, cursor: 'pointer' }}>
                    <div style={{ height: 70, overflow: 'hidden', background: '#1a1a1a' }}>
                      <img src={frame.img} alt={frame.product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <div style={{ padding: '6px 8px', background: 'rgba(255,255,255,0.05)' }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: C.white, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{frame.product.name}</div>
                      {frame.verdict && <span style={{ fontSize: 10, color: vc.color, fontWeight: 600 }}>{vc.label}</span>}
                    </div>
                  </div>
                );
              })}
              {/* Add frame placeholder */}
              <div style={{ width: 110, flexShrink: 0, borderRadius: 2, border: '2px dashed rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', minHeight: 100 }}>
                <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  <div style={{ fontSize: 10, marginTop: 4 }}>Link frame</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

Object.assign(window, { SessionMode, FittingMode });
