// Mira Learn — Path Generate (/me/path/generate)
// Form + dramatic loading state

function PathGeneratePage() {
  const D = window.MiraData;
  const [skills, setSkills] = useState(['pitch','funding']);
  const [horizon, setHorizon] = useState('6');
  const [budget, setBudget] = useState(80);
  const [cv, setCv] = useState(null);
  const [adding, setAdding] = useState(false);
  const [generating, setGenerating] = useState(false);

  const submit = () => {
    if (skills.length === 0) return;
    setGenerating(true);
    setTimeout(() => window.MiraNav.go('/me/path?generated=1'), 6500);
  };

  if (generating) return <GeneratingState />;

  const remaining = Object.values(D.skills).filter(s => !skills.includes(s.id));

  return (
    <div data-screen-label="05 Path Generate" className="page-enter">
      <div className="container" style={{maxWidth:680,margin:'0 auto',padding:'56px 32px 96px'}}>
        <div style={{marginBottom:32}}>
          <a href="#/me" className="arrow-link" style={{fontSize:13,color:'var(--muted)',display:'inline-flex',whiteSpace:'nowrap'}}>
            <Icon name="arrow-left" size={13} strokeWidth={2}/> Retour au profil
          </a>
        </div>

        <div className="eyebrow" style={{marginBottom:14,display:'inline-flex',alignItems:'center',gap:6,color:'var(--mira-red)'}}>
          <Icon name="sparkles" size={13}/> Mira AI
        </div>
        <h1 style={{fontFamily:'var(--font-serif)',fontWeight:500,fontSize:'clamp(34px,4.4vw,46px)',letterSpacing:'-0.02em',margin:0,lineHeight:1.05}}>
          Génère ton parcours <span className="serif-i" style={{color:'var(--mira-red)'}}>sur mesure.</span>
        </h1>
        <p style={{fontSize:17,color:'var(--muted)',margin:'18px 0 48px',lineHeight:1.55}}>
          On va te proposer un parcours d'apprentissage à partir de tes objectifs. Tu pourras toujours le modifier ou en générer un nouveau.
        </p>

        {/* Skills */}
        <Field label="Tes skills cibles" hint="Min. 1 skill. Mira AI les croise avec le catalogue.">
          <div className="chip-row">
            {skills.map((s,i) => (
              <SkillChip key={s} primary={i===0} removable onRemove={() => setSkills(skills.filter(x => x !== s))}>
                {D.skillLabel(s)}
                {i === 0 && <span style={{fontSize:10,marginLeft:4,padding:'1px 5px',background:'rgba(0,0,0,0.08)',borderRadius:4}}>primaire</span>}
              </SkillChip>
            ))}
            {adding ? (
              <span className="chip chip-outline" style={{padding:'0 4px 0 12px',gap:4}}>
                <span>Ajouter…</span>
                <select onChange={e => { if (e.target.value) { setSkills([...skills, e.target.value]); setAdding(false); } }}
                  style={{border:0,background:'transparent',font:'inherit',color:'inherit',padding:'4px 6px',outline:'none'}} defaultValue="">
                  <option value="" disabled>Choisir</option>
                  {remaining.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                </select>
                <button onClick={() => setAdding(false)} style={{background:'none',border:0,padding:4,color:'var(--muted)'}}><Icon name="x" size={12} strokeWidth={2.4}/></button>
              </span>
            ) : (
              <button onClick={() => setAdding(true)} className="chip chip-outline" style={{cursor:'pointer',border:'1px dashed var(--muted-soft)'}}>
                <Icon name="plus" size={12} strokeWidth={2.4}/> Ajouter
              </button>
            )}
          </div>
        </Field>

        {/* Horizon */}
        <Field label="Ton horizon" hint="Le rythme auquel tu veux progresser.">
          <div style={{display:'grid',gridTemplateColumns:'repeat(3, 1fr)',gap:12}}>
            {[
              { id:'3', t:'3 mois', d:'Sprint focus' },
              { id:'6', t:'6 mois', d:'Rythme soutenable' },
              { id:'12', t:'1 an', d:'Approfondi' },
            ].map(o => (
              <label key={o.id} style={{
                padding:'18px 16px',borderRadius:14,cursor:'pointer',
                border:'2px solid', borderColor: horizon === o.id ? 'var(--charcoal)' : 'var(--rule)',
                background: horizon === o.id ? 'var(--warm-beige)' : '#fff',
                transition:'all .2s',
              }}>
                <input type="radio" name="hz" checked={horizon === o.id} onChange={() => setHorizon(o.id)} style={{display:'none'}}/>
                <div style={{fontSize:16,fontWeight:600,letterSpacing:'-0.01em'}}>{o.t}</div>
                <div style={{fontSize:12,color:'var(--muted)',marginTop:4}}>{o.d}</div>
              </label>
            ))}
          </div>
        </Field>

        {/* Budget */}
        <Field label="Ton budget total" hint="Tu peux toujours t'inscrire à plus de classes ensuite.">
          <div style={{display:'flex',alignItems:'center',gap:20,background:'#fff',border:'1px solid var(--rule)',borderRadius:14,padding:'20px 24px'}}>
            <input type="range" min="0" max="500" step="10" value={budget} onChange={e => setBudget(+e.target.value)}
              style={{flex:1,accentColor:'var(--mira-red)'}}
            />
            <div style={{textAlign:'right',minWidth:80}}>
              <div style={{fontFamily:'var(--font-serif)',fontSize:28,fontWeight:600,color:'var(--mira-red)',lineHeight:1}}>{budget} €</div>
              <div style={{fontSize:11,color:'var(--muted)',marginTop:2}}>max</div>
            </div>
          </div>
        </Field>

        {/* CV */}
        <Field label="Ton CV (optionnel)" hint="On identifiera tes skills déjà acquises pour ne pas te les reproposer.">
          {cv ? (
            <div className="card" style={{padding:'16px 20px',display:'flex',alignItems:'center',gap:14}}>
              <div style={{width:40,height:40,borderRadius:10,background:'var(--sage-soft)',display:'flex',alignItems:'center',justifyContent:'center',color:'#2F4A26'}}>
                <Icon name="check" size={18} strokeWidth={2.5}/>
              </div>
              <div style={{flex:1}}>
                <div style={{fontWeight:600,fontSize:14}}>{cv.name}</div>
                <div style={{fontSize:12,color:'var(--muted)'}}>{cv.size}</div>
              </div>
              <button onClick={() => setCv(null)} style={{background:'none',border:0,padding:8,color:'var(--muted)'}}><Icon name="x" size={16} strokeWidth={2}/></button>
            </div>
          ) : (
            <label style={{
              border:'1px dashed var(--muted-soft)',borderRadius:14,padding:'28px 24px',
              display:'flex',alignItems:'center',gap:18,cursor:'pointer',background:'#fff',
            }}>
              <input type="file" style={{display:'none'}} onChange={() => setCv({ name: 'Anna_Lopez_CV.pdf', size: '218 KB' })}/>
              <div style={{width:44,height:44,borderRadius:12,background:'var(--warm-beige)',display:'inline-flex',alignItems:'center',justifyContent:'center'}}>
                <Icon name="upload" size={20}/>
              </div>
              <div style={{flex:1}}>
                <div style={{fontWeight:600,fontSize:14}}>Glisse ton CV ici ou clique pour parcourir</div>
                <div style={{fontSize:12,color:'var(--muted)',marginTop:2}}>PDF · max 5 MB</div>
              </div>
            </label>
          )}
        </Field>

        <div style={{marginTop:40,display:'flex',flexDirection:'column',alignItems:'center',gap:14}}>
          <button onClick={submit} disabled={skills.length===0} className="btn btn-primary btn-lg" style={{minWidth:280,height:56,fontSize:16,opacity:skills.length===0?0.5:1}}>
            <Icon name="sparkles" size={18}/> Générer mon parcours
          </button>
          <p style={{margin:0,fontSize:12,color:'var(--muted)'}}>~15 secondes · gratuit</p>
        </div>
      </div>
    </div>
  );
}

function Field({ label, hint, children }) {
  return (
    <div style={{marginBottom:32}}>
      <h2 style={{margin:'0 0 6px',fontSize:16,fontWeight:600,letterSpacing:'-0.01em'}}>{label}</h2>
      {hint && <p style={{margin:'0 0 14px',fontSize:13,color:'var(--muted)'}}>{hint}</p>}
      {children}
    </div>
  );
}

// --- Dramatic loading state: timeline assembles step-by-step ---
function GeneratingState() {
  const phases = [
    'Mira analyse tes objectifs…',
    'On croise avec le catalogue…',
    'On classe les mentors par fit…',
    'Construction du parcours…',
  ];
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [revealed, setRevealed] = useState(0); // 0, 1, 2 dots appearing

  useEffect(() => {
    const t1 = setTimeout(() => setPhaseIdx(1), 1400);
    const t2 = setTimeout(() => setPhaseIdx(2), 2800);
    const t3 = setTimeout(() => setPhaseIdx(3), 4200);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  useEffect(() => {
    const ts = [
      setTimeout(() => setRevealed(1), 1800),
      setTimeout(() => setRevealed(2), 3800),
      setTimeout(() => setRevealed(3), 5400),
    ];
    return () => ts.forEach(clearTimeout);
  }, []);

  return (
    <div data-screen-label="05b Generating" style={{minHeight:'calc(100vh - 72px)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'64px 32px',position:'relative'}}>
      {/* Soft warm photo backdrop */}
      <div style={{position:'absolute',inset:0,opacity:0.10,pointerEvents:'none'}}>
        <img src="https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1600&q=80" alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
      </div>
      <div style={{position:'relative',display:'flex',flexDirection:'column',alignItems:'center',gap:48,maxWidth:520}}>
        <div style={{position:'relative',width:96,height:96}}>
          <div style={{position:'absolute',inset:0,borderRadius:'50%',background:'radial-gradient(circle, rgba(230,51,42,0.22), transparent 70%)',animation:'pulse 2s ease-in-out infinite'}}/>
          <div style={{position:'absolute',inset:24,borderRadius:'50%',background:'var(--mira-red)',display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',animation:'spin 3s linear infinite'}}>
            <Icon name="sparkles" size={22}/>
          </div>
        </div>

        <div style={{textAlign:'center'}}>
          <h2 style={{fontFamily:'var(--font-serif)',fontWeight:500,fontSize:32,letterSpacing:'-0.02em',margin:0,lineHeight:1.1,minHeight:42}}>
            <span key={phaseIdx} style={{animation:'fadeIn .5s'}}>{phases[phaseIdx]}</span>
          </h2>
          <p style={{margin:'12px 0 0',color:'var(--muted)',fontSize:14}}>~15 secondes · ne ferme pas la page</p>
        </div>

        {/* Skeleton timeline */}
        <div style={{width:'100%',maxWidth:420,position:'relative',paddingLeft:24}}>
          <div style={{position:'absolute',left:5,top:8,bottom:8,width:2,background:'var(--rule)'}}/>
          {[
            { t:'Skill cible : Pitch investor', d:'Class flagship d\'Antoine →' },
            { t:'Skill cible : Funding strategy', d:'Class continue (1 mentor →)' },
            { t:'Validation : QCM mobile', d:'+ projet final →' },
          ].map((node, i) => (
            <div key={i} style={{
              display:'grid',gridTemplateColumns:'12px 1fr',gap:18,marginBottom:18,
              opacity: revealed > i ? 1 : 0.25,
              transition:'opacity .6s cubic-bezier(0.16,1,0.3,1)',
            }}>
              <div style={{
                width:12,height:12,borderRadius:'50%',marginTop:6,
                background: revealed > i ? 'var(--mira-red)' : 'var(--muted-soft)',
                boxShadow: revealed > i ? '0 0 0 5px rgba(230,51,42,0.15)' : 'none',
                transition: 'all .5s',
              }}/>
              <div className="card" style={{padding:'12px 16px',
                background: revealed > i ? '#fff' : 'rgba(255,255,255,0.5)',
                transform: revealed > i ? 'translateX(0)' : 'translateX(-8px)',
                transition: 'all .6s cubic-bezier(0.16,1,0.3,1)',
              }}>
                <div style={{fontSize:13,fontWeight:600}}>{node.t}</div>
                <div style={{fontSize:12,color:'var(--muted)'}}>{node.d}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <style>{`
        @keyframes pulse { 0%,100%{transform:scale(1);opacity:1} 50%{transform:scale(1.15);opacity:.6} }
        @keyframes spin { from{transform:rotate(0)} to{transform:rotate(360deg)} }
        @keyframes fadeIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
      `}</style>
    </div>
  );
}

Object.assign(window, { PathGeneratePage });
