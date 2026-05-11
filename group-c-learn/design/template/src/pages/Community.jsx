// Mira Learn — Community (/community)
// List + world map placeholder with pulsing markers

function CommunityPage() {
  const D = window.MiraData;
  const [view, setView] = useState('map'); // 'map' | 'list'
  const [cityFilter, setCityFilter] = useState([]);
  const [targetFilter, setTargetFilter] = useState([]);
  const [validatedFilter, setValidatedFilter] = useState([]);
  const [activeMember, setActiveMember] = useState(null);

  const cities = [...new Set(D.community.map(m => m.city.split(',')[0].trim()))];
  const allTargets = [...new Set(D.community.flatMap(m => m.target))];
  const allValidated = [...new Set(D.community.flatMap(m => m.validated))];

  const filtered = D.community.filter(m => {
    if (cityFilter.length && !cityFilter.includes(m.city.split(',')[0].trim())) return false;
    if (targetFilter.length && !targetFilter.some(t => m.target.includes(t))) return false;
    if (validatedFilter.length && !validatedFilter.some(t => m.validated.includes(t))) return false;
    return true;
  });

  const toggle = (setter, val) => setter(prev => prev.includes(val) ? prev.filter(x => x !== val) : [...prev, val]);

  return (
    <div data-screen-label="08 Community" className="page-enter">
      <section style={{padding:'48px 0 24px'}}>
        <div className="container">
          <div className="eyebrow" style={{marginBottom:14}}>Communauté</div>
          <h1 style={{fontFamily:'var(--font-serif)',fontWeight:500,fontSize:'clamp(34px,4.5vw,52px)',letterSpacing:'-0.02em',margin:0,lineHeight:1.05}}>
            La communauté <span className="serif-i" style={{color:'var(--mira-red)'}}>Mira.</span>
          </h1>
          <p style={{fontSize:17,color:'var(--muted)',margin:'18px 0 0',maxWidth:560,lineHeight:1.55}}>
            Les apprenants qui acceptent d'être visibles partagent leur ville et leurs skills cibles. {filtered.length} nomades affichés.
          </p>
        </div>
      </section>

      {/* Filters + view toggle */}
      <section style={{padding:'16px 0',borderBottom:'1px solid var(--rule)',position:'sticky',top:72,background:'var(--warm-beige)',zIndex:20}}>
        <div className="container" style={{display:'flex',gap:12,alignItems:'center',flexWrap:'wrap'}}>
          <FilterDropdown label="Ville" options={cities.map(c => ({ id: c, label: c }))} selected={cityFilter} onToggle={v => toggle(setCityFilter, v)} />
          <FilterDropdown label="Skill cible" options={allTargets.map(t => ({ id: t, label: t }))} selected={targetFilter} onToggle={v => toggle(setTargetFilter, v)} />
          <FilterDropdown label="Skill validée" options={allValidated.map(t => ({ id: t, label: t }))} selected={validatedFilter} onToggle={v => toggle(setValidatedFilter, v)} />
          <div style={{marginLeft:'auto',display:'flex',background:'#fff',border:'1px solid var(--rule)',borderRadius:10,padding:3,height:36}}>
            <button onClick={() => setView('map')} style={{
              padding:'0 14px',height:'100%',border:0,borderRadius:8,fontWeight:500,fontSize:13,
              background: view === 'map' ? 'var(--charcoal)' : 'transparent',
              color: view === 'map' ? '#fff' : 'var(--charcoal)',
              display:'inline-flex',alignItems:'center',gap:6,cursor:'pointer',
            }}><Icon name="globe" size={14}/> Carte</button>
            <button onClick={() => setView('list')} style={{
              padding:'0 14px',height:'100%',border:0,borderRadius:8,fontWeight:500,fontSize:13,
              background: view === 'list' ? 'var(--charcoal)' : 'transparent',
              color: view === 'list' ? '#fff' : 'var(--charcoal)',
              display:'inline-flex',alignItems:'center',gap:6,cursor:'pointer',
            }}><Icon name="menu" size={14}/> Liste</button>
          </div>
        </div>
      </section>

      {view === 'map' ? (
        <section style={{padding:'40px 0 96px'}}>
          <div className="container">
            <WorldMap members={filtered} active={activeMember} onSelect={setActiveMember} />
          </div>
        </section>
      ) : (
        <section style={{padding:'40px 0 96px'}}>
          <div className="container">
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill, minmax(320px, 1fr))',gap:20}}>
              {filtered.map(m => <CommunityCard key={m.id} member={m}/>)}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

function CommunityCard({ member }) {
  const isMe = member.id === 'anna';
  return (
    <article className="card" style={{padding:24,display:'flex',flexDirection:'column',gap:14,position:'relative',transition:'all .3s'}}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 14px 32px rgba(0,0,0,0.06)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
    >
      {isMe && <span style={{position:'absolute',top:14,right:14}} className="chip chip-skill">Toi</span>}
      {member.completed && <span style={{position:'absolute',top:14,right:14}} className="chip chip-gold"><Icon name="star" size={11} strokeWidth={0}/> Mira graduate</span>}
      <div style={{display:'flex',alignItems:'center',gap:12}}>
        <Avatar src={member.avatar} name={member.name} size={48}/>
        <div>
          <div style={{fontWeight:600,fontSize:15,letterSpacing:'-0.01em'}}>{member.name}</div>
          <div style={{fontSize:12,color:'var(--muted)',display:'flex',alignItems:'center',gap:6,marginTop:2}}>
            <span style={{fontSize:14}}>{member.flag}</span> {member.city} · {member.since}
          </div>
        </div>
      </div>
      <div>
        <div style={{fontSize:11,color:'var(--muted)',fontWeight:600,letterSpacing:0.5,textTransform:'uppercase',marginBottom:6}}>Cible</div>
        {member.target.length === 0 ? (
          <div style={{fontSize:13,color:'var(--muted)',fontStyle:'italic'}}>Pas encore de skill déclarée</div>
        ) : (
          <div className="chip-row">{member.target.map(t => <SkillChip key={t}>{t}</SkillChip>)}</div>
        )}
      </div>
      {member.validated.length > 0 && (
        <div>
          <div style={{fontSize:11,color:'var(--muted)',fontWeight:600,letterSpacing:0.5,textTransform:'uppercase',marginBottom:6}}>Validée</div>
          <div className="chip-row">{member.validated.map(t => <SkillChip key={t} validated>{t}</SkillChip>)}</div>
        </div>
      )}
      <button className="btn btn-ghost btn-sm" style={{marginTop:'auto',justifyContent:'center'}}>Envoyer un message</button>
    </article>
  );
}

// --- WorldMap placeholder ---
// SVG world map with pulsing markers. Not a real interactive map — explicitly a stylized placeholder.
function WorldMap({ members, active, onSelect }) {
  // map: lat/lng → x/y in viewBox 0 0 1000 500 (equirectangular)
  // x = (lng + 180) * (1000/360); y = (90 - lat) * (500/180)
  const toXY = (lat, lng) => ({ x: (lng + 180) * (1000/360), y: (90 - lat) * (500/180) });

  return (
    <div style={{
      background:'#fff',border:'1px solid var(--rule)',borderRadius:24,overflow:'hidden',
      position:'relative',
    }}>
      <div style={{position:'relative',width:'100%',aspectRatio:'2/1'}}>
        <svg viewBox="0 0 1000 500" style={{width:'100%',height:'100%',display:'block',background:'#F6F2EC'}}>
          {/* Soft world outline — simplified continent dots */}
          <WorldDots />
          {/* Members */}
          {members.map(m => {
            const { x, y } = toXY(m.lat, m.lng);
            const isActive = active === m.id;
            return (
              <g key={m.id} transform={`translate(${x} ${y})`} onClick={() => onSelect(isActive ? null : m.id)} style={{cursor:'pointer'}}>
                <circle r="14" fill="var(--mira-red)" opacity="0.18">
                  <animate attributeName="r" values="8;22;8" dur="2.2s" repeatCount="indefinite" begin={`${Math.random()*2}s`}/>
                  <animate attributeName="opacity" values="0.25;0;0.25" dur="2.2s" repeatCount="indefinite" begin={`${Math.random()*2}s`}/>
                </circle>
                <circle r={isActive ? 8 : 6} fill="var(--mira-red)" stroke="#fff" strokeWidth="2.5"/>
                {m.completed && <circle r="3" fill="var(--gold)" cx="6" cy="-6"/>}
              </g>
            );
          })}
        </svg>

        {/* Legend overlay */}
        <div style={{position:'absolute',top:18,left:18,background:'rgba(255,255,255,0.92)',backdropFilter:'blur(8px)',padding:'10px 14px',borderRadius:12,display:'flex',gap:14,alignItems:'center',fontSize:12,border:'1px solid var(--rule)'}}>
          <span style={{display:'inline-flex',alignItems:'center',gap:6}}>
            <span style={{width:10,height:10,borderRadius:'50%',background:'var(--mira-red)',boxShadow:'0 0 0 3px rgba(230,51,42,0.18)'}}/>
            Nomade visible
          </span>
          <span style={{opacity:0.4}}>·</span>
          <span style={{display:'inline-flex',alignItems:'center',gap:6}}>
            <span style={{width:6,height:6,borderRadius:'50%',background:'var(--gold)'}}/>
            Mira graduate
          </span>
        </div>

        {/* Hint */}
        <div style={{position:'absolute',bottom:18,right:18,background:'rgba(255,255,255,0.92)',backdropFilter:'blur(8px)',padding:'10px 14px',borderRadius:12,fontSize:12,color:'var(--muted)',border:'1px solid var(--rule)'}}>
          Clique sur un marker pour voir le profil
        </div>

        {/* Active member popup */}
        {active && (() => {
          const m = members.find(x => x.id === active);
          if (!m) return null;
          const { x, y } = toXY(m.lat, m.lng);
          const left = `${(x / 1000) * 100}%`;
          const top = `${(y / 500) * 100}%`;
          return (
            <div style={{
              position:'absolute',left,top,transform:'translate(-50%, calc(-100% - 18px))',
              background:'#fff',border:'1px solid var(--rule)',borderRadius:14,padding:14,
              boxShadow:'0 14px 36px rgba(0,0,0,0.12)',width:240,zIndex:5,
            }}>
              <div style={{display:'flex',gap:10,marginBottom:10}}>
                <Avatar src={m.avatar} name={m.name} size={36}/>
                <div>
                  <div style={{fontSize:13,fontWeight:600}}>{m.name}</div>
                  <div style={{fontSize:11,color:'var(--muted)'}}>{m.flag} {m.city}</div>
                </div>
              </div>
              {m.target.length > 0 && (
                <div className="chip-row" style={{gap:4}}>
                  {m.target.map(t => <span key={t} className="chip chip-skill" style={{fontSize:10,height:22,padding:'0 8px'}}>{t}</span>)}
                </div>
              )}
              <button onClick={() => onSelect(null)} style={{position:'absolute',top:8,right:8,background:'none',border:0,padding:4,color:'var(--muted)'}}>
                <Icon name="x" size={14} strokeWidth={2}/>
              </button>
            </div>
          );
        })()}
      </div>

      {/* Bottom strip with avatars */}
      <div style={{padding:'18px 24px',borderTop:'1px solid var(--rule)',display:'flex',gap:14,alignItems:'center',flexWrap:'wrap'}}>
        <div className="eyebrow">Visible aujourd'hui</div>
        <div style={{display:'flex',marginLeft:6}}>
          {members.slice(0,8).map((m, i) => (
            <button key={m.id} onClick={() => onSelect(m.id)} style={{
              marginLeft: i === 0 ? 0 : -8, border:0,background:'transparent',padding:0,cursor:'pointer',
              transition:'transform .2s',
            }} title={`${m.name} · ${m.city}`}>
              <Avatar src={m.avatar} name={m.name} size={32} ring={active === m.id}/>
            </button>
          ))}
        </div>
        <span style={{fontSize:13,color:'var(--muted)',marginLeft:'auto'}}>{members.length} apprenants partagent leur profil</span>
      </div>
    </div>
  );
}

// Approximated continent dots (sparse, stylized)
function WorldDots() {
  // Pre-computed coordinate clusters for continents (rough)
  const coords = [
    // North America
    [200,150],[220,150],[240,150],[260,150],[280,150],[180,170],[200,170],[220,170],[240,170],[260,170],[280,170],[300,170],[200,190],[220,190],[240,190],[260,190],[280,190],[300,190],[180,210],[210,210],[240,210],[270,210],[300,210],[225,230],[260,230],
    // South America
    [320,260],[340,260],[330,280],[350,280],[330,300],[350,300],[340,320],[360,320],[340,340],[360,340],[350,360],[360,360],
    // Europe
    [490,140],[510,140],[530,140],[480,160],[500,160],[520,160],[540,160],[490,180],[510,180],[530,180],
    // Africa
    [490,220],[510,220],[530,220],[490,240],[510,240],[530,240],[550,240],[490,260],[510,260],[530,260],[550,260],[500,280],[520,280],[540,280],[510,300],[530,300],[510,320],[530,320],
    // Asia
    [580,160],[610,160],[640,160],[670,160],[700,160],[730,160],[760,160],[580,180],[610,180],[640,180],[670,180],[700,180],[730,180],[760,180],[780,180],[610,200],[640,200],[670,200],[700,200],[730,200],[760,200],[640,220],[670,220],[700,220],[730,220],[760,220],[660,240],[690,240],[720,240],
    // Australia
    [780,300],[800,300],[820,300],[840,300],[790,320],[810,320],[830,320],[800,340],[820,340],
  ];
  return (
    <g fill="#D6CFC4">
      {coords.map(([x,y], i) => <circle key={i} cx={x} cy={y} r="3.5"/>)}
    </g>
  );
}

Object.assign(window, { CommunityPage });
