// products-screen.jsx

function ProductsScreen({ clientMode }) {
  const [selected, setSelected] = React.useState(null);
  const [filters, setFilters] = React.useState({ collection: null, shape: null, material: null });
  const [sort, setSort] = React.useState('newest');

  const filtered = PRODUCTS.filter(p => {
    if (filters.collection && p.collection !== filters.collection) return false;
    if (filters.shape && p.shape !== filters.shape) return false;
    if (filters.material && p.material !== filters.material) return false;
    return true;
  });

  const toggleFilter = (key, val) => setFilters(f => ({ ...f, [key]: f[key] === val ? null : val }));

  if (selected) return <ProductDetail product={selected} onBack={() => setSelected(null)} clientMode={clientMode} />;

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: C.offwhite }}>
      {/* Filter bar */}
      <div style={{ background: C.white, borderBottom: `1px solid ${C.border}`, padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 8, overflowX: 'auto' }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: C.muted, letterSpacing: '0.08em', textTransform: 'uppercase', whiteSpace: 'nowrap', marginRight: 4 }}>Filter</span>
        {[
          { key: 'collection', values: ['Signature', 'Permanent', 'Collaborations', 'Archives'] },
          { key: 'shape', values: ['Round', 'Cat-eye', 'Oval', 'Square'] },
          { key: 'material', values: ['Acetate', 'Titanium'] },
        ].map(({ key, values }) => values.map(val => {
          const active = filters[key] === val;
          return (
            <button key={val} onClick={() => toggleFilter(key, val)} style={{ background: active ? C.navy : C.white, border: `1px solid ${active ? C.navy : C.border}`, borderRadius: 2, padding: '5px 12px', cursor: 'pointer', fontSize: 12, fontWeight: active ? 600 : 400, color: active ? C.white : C.text, whiteSpace: 'nowrap' }}>
              {val}
            </button>
          );
        }))}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          {!clientMode && (
            <select value={sort} onChange={e => setSort(e.target.value)} style={{ border: `1px solid ${C.border}`, borderRadius: 2, padding: '5px 10px', fontSize: 12, color: C.text, background: C.white, outline: 'none' }}>
              <option value="newest">Newest</option>
              <option value="price-asc">Price: Low–High</option>
              <option value="price-desc">Price: High–Low</option>
            </select>
          )}
          <span style={{ fontSize: 12, color: C.muted }}>{filtered.length} items</span>
        </div>
      </div>

      {/* Grid */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          {filtered.map(product => (
            <ProductCard key={product.id} product={product} onSelect={setSelected} clientMode={clientMode} />
          ))}
        </div>
      </div>
    </div>
  );
}

function ProductCard({ product, onSelect, clientMode }) {
  const [hovered, setHovered] = React.useState(false);
  const [priceRevealed, setPriceRevealed] = React.useState(false);

  return (
    <div onClick={() => onSelect(product)} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{ background: C.white, borderRadius: 2, border: `1px solid ${hovered ? C.navy : C.border}`, overflow: 'hidden', cursor: 'pointer', transition: 'border-color 0.15s, transform 0.15s', transform: hovered ? 'translateY(-2px)' : 'none' }}>
      <div style={{ height: 160, overflow: 'hidden', background: C.cream, position: 'relative' }}>
        <img src={product.img} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        {product.inventory === 0 && (
          <div style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(10,21,61,0.85)', color: C.white, fontSize: 10, fontWeight: 600, padding: '3px 7px', borderRadius: 2, letterSpacing: '0.06em' }}>OUT OF STOCK</div>
        )}
        {product.inventory > 0 && product.inventory <= 2 && !clientMode && (
          <div style={{ position: 'absolute', top: 10, right: 10, background: C.goldLight, color: C.gold, fontSize: 10, fontWeight: 600, padding: '3px 7px', borderRadius: 2 }}>LOW STOCK</div>
        )}
      </div>
      <div style={{ padding: '12px 14px' }}>
        <div style={{ fontSize: 11, color: C.muted, marginBottom: 3 }}>{product.collection}</div>
        <div style={{ fontSize: 14, fontWeight: 600, color: C.navy }}>{product.name}</div>
        <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{product.shape} · {product.material}</div>
        <div style={{ marginTop: 8, display: 'flex', gap: 4 }}>
          {product.colours.slice(0, 3).map(col => (
            <div key={col} title={col} style={{ width: 12, height: 12, borderRadius: '50%', border: `1px solid ${C.border}`, background: col === 'Navy' ? '#0A0A0A' : col === 'Black' ? '#1A1A1A' : col === 'Sage' ? '#7B9E87' : col === 'Tortoise' ? '#7B4F2E' : col === 'Champagne' ? '#F0D9A8' : col === 'Gold' ? '#C4973A' : col === 'Silver' ? '#A8A8A8' : col === 'Gunmetal' ? '#4A4A4A' : col === 'Caramel' ? '#C68642' : col === 'Forest' ? '#2D6A4F' : col === 'Slate' ? '#708090' : col === 'Rose Gold' ? '#E8B4A0' : '#ccc' }} />
          ))}
          {product.colours.length > 3 && <span style={{ fontSize: 10, color: C.muted }}>+{product.colours.length - 3}</span>}
        </div>
        <div style={{ marginTop: 8, fontSize: 13, fontWeight: 600, color: C.navy }}>
          {clientMode && !priceRevealed
            ? <span onClick={e => { e.stopPropagation(); setPriceRevealed(true); }} style={{ color: C.muted, fontSize: 12, cursor: 'pointer', textDecoration: 'underline' }}>Show price</span>
            : `$${product.price}`
          }
        </div>
      </div>
    </div>
  );
}

function ProductDetail({ product, onBack, clientMode }) {
  const [priceRevealed, setPriceRevealed] = React.useState(!clientMode);

  return (
    <div style={{ flex: 1, display: 'flex', overflow: 'hidden', background: C.offwhite }}>
      {/* Left: image */}
      <div style={{ width: '45%', background: C.cream, position: 'relative', overflow: 'hidden' }}>
        <button onClick={onBack} style={{ position: 'absolute', top: 16, left: 16, background: 'rgba(255,255,255,0.9)', border: 'none', borderRadius: 2, padding: '8px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: C.navy, fontWeight: 500, zIndex: 2 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
          Back
        </button>
        <img src={product.img} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        {/* Colour variants */}
        <div style={{ position: 'absolute', bottom: 16, left: 16, display: 'flex', gap: 8 }}>
          {product.colours.map((col, i) => (
            <div key={col} style={{ width: 32, height: 32, borderRadius: '50%', border: `2px solid ${i === 0 ? C.navy : 'rgba(255,255,255,0.6)'}`, background: col === 'Navy' ? '#0A0A0A' : col === 'Black' ? '#1A1A1A' : col === 'Sage' ? '#7B9E87' : col === 'Tortoise' ? '#7B4F2E' : col === 'Champagne' ? '#F0D9A8' : col === 'Gold' ? '#C4973A' : col === 'Silver' ? '#A8A8A8' : col === 'Gunmetal' ? '#4A4A4A' : col === 'Caramel' ? '#C68642' : col === 'Forest' ? '#2D6A4F' : col === 'Slate' ? '#708090' : col === 'Rose Gold' ? '#E8B4A0' : '#ccc', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }} title={col} />
          ))}
        </div>
      </div>

      {/* Right: details */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '28px 28px' }}>
        <div style={{ marginBottom: 6, fontSize: 12, color: C.muted, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{product.collection}</div>
        <h2 style={{ fontSize: 32, fontWeight: 300, color: C.navy, margin: '0 0 8px', letterSpacing: '-0.02em' }}>{product.name}</h2>
        <div style={{ fontSize: 14, color: C.muted, marginBottom: 20, lineHeight: 1.6 }}>{product.desc}</div>

        <div style={{ fontSize: 22, fontWeight: 600, color: C.navy, marginBottom: 24 }}>
          {clientMode && !priceRevealed
            ? <button onClick={() => setPriceRevealed(true)} style={{ background: C.offwhite, border: `1px solid ${C.border}`, borderRadius: 2, padding: '8px 16px', cursor: 'pointer', fontSize: 13, color: C.muted, fontWeight: 500 }}>Tap to reveal price</button>
            : `$${product.price}`}
        </div>

        {/* Dimensions */}
        <div style={{ marginBottom: 20 }}>
          <SectionLabel>Dimensions</SectionLabel>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            {[['Frame width', product.frameWidth], ['Bridge', product.bridge], ['Temple', product.temple]].map(([k, v]) => (
              <div key={k} style={{ background: C.white, borderRadius: 2, padding: '12px 14px', border: `1px solid ${C.border}` }}>
                <div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>{k}</div>
                <div style={{ fontSize: 16, fontWeight: 600, color: C.navy }}>{v}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Specs */}
        <div style={{ marginBottom: 20 }}>
          <SectionLabel>Details</SectionLabel>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {[product.shape, product.material, 'Made in France', 'Lunettiq case included'].map(d => (
              <span key={d} style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 2, padding: '5px 12px', fontSize: 12, color: C.navy }}>{d}</span>
            ))}
          </div>
        </div>

        {/* Staff-only: inventory */}
        {!clientMode && (
          <div style={{ marginBottom: 20 }}>
            <SectionLabel>Inventory</SectionLabel>
            <Card style={{ padding: '12px 16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: product.inventory === 0 ? C.red : C.navy }}>{product.inventory === 0 ? 'Out of stock' : `${product.inventory} in stock`}</div>
                  <div style={{ fontSize: 12, color: C.muted }}>Outremont · as of today</div>
                </div>
                {product.inventory === 0 && (
                  <button style={{ background: C.navy, border: 'none', borderRadius: 2, padding: '7px 14px', color: C.white, fontSize: 12, cursor: 'pointer' }}>Request transfer</button>
                )}
              </div>
            </Card>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button style={{ background: C.green, border: 'none', borderRadius: 2, padding: '12px 18px', color: C.white, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Try in fitting</button>
          <button style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 2, padding: '12px 18px', color: C.navy, fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>Add to wishlist</button>
          {!clientMode && <button style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 2, padding: '12px 18px', color: C.navy, fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>Recommend to client</button>}
          {!clientMode && <button style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 2, padding: '12px 18px', color: C.navy, fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>Start custom design</button>}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { ProductsScreen, ProductCard, ProductDetail });
