// Mira Learn — Catalogue (/classes)

function CataloguePage() {
  const D = window.MiraData;
  const [filters, setFilters] = useState({
    skills: [],
    categories: [],
    formats: [],
    maxPrice: 200,
  });

  const allSkills = useMemo(() => {
    const set = new Set();
    D.classes.forEach(c => c.skills.forEach(s => set.add(s)));
    return [...set];
  }, []);
  const allCategories = ['Business', 'Design', 'Tech', 'Soft', 'Lifestyle'];
  const allFormats = ['Physique', 'Virtuel', 'Hybride'];

  const filtered = D.classes.filter(c => {
    if (filters.skills.length && !filters.skills.some(s => c.skills.includes(s))) return false;
    if (filters.categories.length && !filters.categories.includes(c.category)) return false;
    if (filters.formats.length && !filters.formats.includes(c.format)) return false;
    if (c.price > filters.maxPrice) return false;
    return true;
  });

  const toggle = (key, val) => {
    setFilters(f => ({ ...f, [key]: f[key].includes(val) ? f[key].filter(x => x !== val) : [...f[key], val] }));
  };
  const reset = () => setFilters({ skills: [], categories: [], formats: [], maxPrice: 200 });
  const activeCount = filters.skills.length + filters.categories.length + filters.formats.length + (filters.maxPrice < 200 ? 1 : 0);

  return (
    <div data-screen-label="02 Catalogue" className="page-enter">
      <section style={{padding:'48px 0 24px'}}>
        <div className="container">
          <div className="eyebrow" style={{marginBottom:14}}>Catalogue</div>
          <h1 style={{fontFamily:'var(--font-serif)',fontWeight:500,fontSize:'clamp(34px,4.5vw,52px)',letterSpacing:'-0.02em',margin:0,lineHeight:1.05}}>
            {D.classes.length} Mira Classes,<br/>
            <span className="serif-i" style={{color:'var(--mira-red)'}}>animées par des mentors validés.</span>
          </h1>
          <p style={{fontSize:17,color:'var(--muted)',margin:'20px 0 0',maxWidth:560}}>
            Filtres par skill, catégorie, format. Chaque class est conçue avec un livrable concret à la sortie.
          </p>
        </div>
      </section>

      {/* Filter bar */}
      <section style={{padding:'24px 0 32px',position:'sticky',top:72,background:'var(--warm-beige)',zIndex:20,borderBottom:'1px solid var(--rule)'}}>
        <div className="container" style={{display:'flex',gap:12,alignItems:'center',flexWrap:'wrap'}}>
          <FilterDropdown label="Skill" options={allSkills.map(s => ({ id: s, label: D.skillLabel(s) }))} selected={filters.skills} onToggle={v => toggle('skills', v)} />
          <FilterDropdown label="Catégorie" options={allCategories.map(s => ({ id: s, label: s }))} selected={filters.categories} onToggle={v => toggle('categories', v)} />
          <FilterDropdown label="Format" options={allFormats.map(s => ({ id: s, label: s }))} selected={filters.formats} onToggle={v => toggle('formats', v)} />
          <PriceSlider value={filters.maxPrice} onChange={v => setFilters(f => ({ ...f, maxPrice: v }))} />
          {activeCount > 0 && (
            <button className="btn btn-text btn-sm" onClick={reset} style={{color:'var(--mira-red)'}}>
              Reset ({activeCount}) <Icon name="x" size={13} strokeWidth={2}/>
            </button>
          )}
          <div style={{marginLeft:'auto',fontSize:13,color:'var(--muted)'}}>
            {filtered.length} résultat{filtered.length>1?'s':''}
          </div>
        </div>
      </section>

      <section style={{padding:'40px 0 96px'}}>
        <div className="container">
          {filtered.length === 0 ? (
            <div style={{textAlign:'center',padding:'80px 20px',color:'var(--muted)'}}>
              <Icon name="compass" size={28} />
              <p style={{margin:'12px 0 0'}}>Pas de class qui matche. Élargis tes filtres.</p>
            </div>
          ) : (
            <div style={{display:'grid',gridTemplateColumns:'repeat(2, 1fr)',gap:28}}>
              {filtered.map(c => (
                <ClassCard key={c.slug} klass={c} onClick={() => window.MiraNav.go(`/classes/${c.slug}`)} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function FilterDropdown({ label, options, selected, onToggle }) {
  const [open, setOpen] = useState(false);
  const ref = useRef();
  useEffect(() => {
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);
  const has = selected.length > 0;
  return (
    <div ref={ref} style={{position:'relative'}}>
      <button onClick={() => setOpen(o => !o)} className="btn btn-sm" style={{
        background: has ? 'var(--charcoal)' : '#fff',
        color: has ? '#fff' : 'var(--charcoal)',
        border:'1px solid', borderColor: has ? 'var(--charcoal)' : 'var(--rule)',
      }}>
        {label} {has && <span style={{background:'#fff',color:'var(--charcoal)',borderRadius:9999,padding:'1px 7px',fontSize:11,fontWeight:600,marginLeft:2}}>{selected.length}</span>}
        <svg width="10" height="10" viewBox="0 0 12 12" style={{transition:'transform .2s',transform:open?'rotate(180deg)':'none'}}><path d="m3 4.5 3 3 3-3" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round"/></svg>
      </button>
      {open && (
        <div style={{position:'absolute',top:'calc(100% + 6px)',left:0,minWidth:240,background:'#fff',border:'1px solid var(--rule)',borderRadius:14,padding:8,boxShadow:'0 14px 36px rgba(0,0,0,0.10)',zIndex:30}}>
          {options.map(o => {
            const on = selected.includes(o.id);
            return (
              <button key={o.id} onClick={() => onToggle(o.id)} style={{
                display:'flex',alignItems:'center',gap:10,width:'100%',
                padding:'8px 10px',borderRadius:8,border:0,
                background: on ? 'var(--warm-beige)' : 'transparent',
                fontSize:13,color:'var(--charcoal)',textAlign:'left',
              }}>
                <span style={{
                  width:16,height:16,borderRadius:4,border:'1.5px solid',
                  borderColor: on ? 'var(--mira-red)' : 'var(--rule)',
                  background: on ? 'var(--mira-red)' : '#fff',
                  display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',
                }}>
                  {on && <Icon name="check" size={11} strokeWidth={3} />}
                </span>
                {o.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function PriceSlider({ value, onChange }) {
  return (
    <div style={{display:'flex',alignItems:'center',gap:12,background:'#fff',border:'1px solid var(--rule)',borderRadius:10,padding:'6px 14px',height:36}}>
      <span style={{fontSize:13,fontWeight:500}}>Prix max</span>
      <input type="range" min="0" max="200" step="5" value={value} onChange={e => onChange(+e.target.value)}
        style={{width:120,accentColor:'var(--mira-red)'}}
      />
      <span style={{fontSize:13,fontWeight:600,fontVariantNumeric:'tabular-nums',minWidth:46,textAlign:'right'}}>{value} €</span>
    </div>
  );
}

Object.assign(window, { CataloguePage });
