// Mira Learn — Profile (/me) — Anna Lopez

function MePage({ personaState }) {
  // personaState: 'empty' | 'declared' | 'mid-journey'
  const D = window.MiraData;
  const isEmpty = personaState === 'empty';
  const isDeclared = personaState === 'declared';
  const isMid = personaState === 'mid-journey';

  const skillsTarget = isEmpty ? [] : (isDeclared || isMid ? ['pitch','funding'] : []);
  const skillsValidated = []; // none in any state per prompt
  const pathActive = isMid;

  return (
    <div data-screen-label="04 Profile" className="page-enter">
      <div className="container" style={{padding:'40px 0 96px',display:'flex',gap:48}}>
        <AuthSidebar current="/me" />
        <div style={{flex:1,minWidth:0,maxWidth:880,display:'flex',flexDirection:'column',gap:40}}>
          <ProfileHeader anna={D.anna} />
          <ProfileSkills label="Mes skills cibles" emptyText="Définis tes skills cibles pour qu'on te génère ton parcours d'apprentissage." items={skillsTarget} primaryId="pitch" emptyCtaHref="#/me/path/generate" emptyCtaLabel="Définir mes skills" canAdd />
          <ProfileSkills label="Mes skills validées" emptyText="Passe des QCM pour valider tes skills sur l'app mobile. Ça apparaît ici." items={skillsValidated} validated emptyCtaLabel="Télécharger l'app" />
          <VisibilitySection visibility={D.anna.visibility} />
          <PathPreview active={pathActive} skillsTarget={skillsTarget} />
          <EnrolmentsSection isEmpty={isEmpty || isDeclared} />
        </div>
      </div>
    </div>
  );
}

function ProfileHeader({ anna }) {
  return (
    <header style={{display:'flex',alignItems:'center',gap:24,paddingTop:8}}>
      <Avatar src={anna.avatar} name={anna.name} size={96}/>
      <div style={{flex:1}}>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <h1 style={{fontFamily:'var(--font-serif)',fontWeight:500,fontSize:32,letterSpacing:'-0.02em',margin:0,lineHeight:1.1}}>{anna.name}</h1>
          <button style={{background:'none',border:0,color:'var(--muted)',padding:6,cursor:'pointer'}} title="Modifier"><Icon name="pencil" size={15}/></button>
        </div>
        <p style={{margin:'4px 0 12px',color:'var(--muted)',fontSize:15}}>{anna.headline}</p>
        <div style={{display:'flex',gap:14,fontSize:13,color:'var(--muted)',alignItems:'center'}}>
          <span style={{display:'inline-flex',alignItems:'center',gap:6}}>
            <span style={{fontSize:16}}>{anna.flag}</span> {anna.city}
          </span>
          <span style={{opacity:0.4}}>·</span>
          <span>{anna.since}</span>
        </div>
      </div>
      <button className="btn btn-ghost btn-sm">Modifier le profil</button>
    </header>
  );
}

function ProfileSkills({ label, items, primaryId, validated, emptyText, emptyCtaHref, emptyCtaLabel, canAdd }) {
  const D = window.MiraData;
  const [adding, setAdding] = useState(false);
  const [list, setList] = useState(items);
  useEffect(() => setList(items), [items]);
  const allOptions = Object.values(D.skills);
  const remaining = allOptions.filter(s => !list.includes(s.id));

  return (
    <section>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline',marginBottom:14}}>
        <h2 style={{margin:0,fontSize:18,fontWeight:600,letterSpacing:'-0.01em'}}>{label}</h2>
      </div>
      {list.length === 0 ? (
        <EmptyState text={emptyText} ctaLabel={emptyCtaLabel} ctaHref={emptyCtaHref} icon={validated ? 'check-circle' : 'sparkles'} />
      ) : (
        <div className="chip-row">
          {list.map(s => (
            <SkillChip key={s} primary={!validated && s === primaryId} validated={validated} removable={canAdd && !validated} onRemove={() => setList(list.filter(x => x !== s))}>
              {D.skillLabel(s)}
              {!validated && s === primaryId && <span style={{fontSize:10,marginLeft:4,padding:'1px 5px',background:'rgba(0,0,0,0.08)',borderRadius:4}}>primaire</span>}
            </SkillChip>
          ))}
          {canAdd && !validated && (
            adding ? (
              <span className="chip chip-outline" style={{padding:'0 4px 0 12px',gap:4}}>
                <span>Ajouter…</span>
                <select onChange={e => { if (e.target.value) { setList([...list, e.target.value]); setAdding(false); } }}
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
            )
          )}
        </div>
      )}
    </section>
  );
}

function EmptyState({ text, ctaLabel, ctaHref, icon }) {
  return (
    <div style={{
      background:'#fff',border:'1px dashed var(--muted-soft)',borderRadius:16,
      padding:'24px 28px',display:'flex',alignItems:'center',gap:18,
    }}>
      <div style={{width:44,height:44,borderRadius:12,background:'var(--warm-beige)',display:'inline-flex',alignItems:'center',justifyContent:'center',flexShrink:0,color:'var(--mira-red)'}}>
        <Icon name={icon} size={20} />
      </div>
      <p style={{margin:0,flex:1,fontSize:14,color:'var(--charcoal)'}}>{text}</p>
      {ctaLabel && (
        ctaHref ? <a href={ctaHref} className="btn btn-primary btn-sm">{ctaLabel} <Icon name="arrow-right" size={13} strokeWidth={2.2}/></a>
                : <button className="btn btn-ghost btn-sm">{ctaLabel}</button>
      )}
    </div>
  );
}

function VisibilitySection({ visibility }) {
  const [v, setV] = useState(visibility);
  return (
    <section>
      <h2 style={{margin:'0 0 14px',fontSize:18,fontWeight:600,letterSpacing:'-0.01em'}}>Visibilité</h2>
      <div className="card" style={{padding:24}}>
        <div style={{display:'flex',gap:24}}>
          {[
            { id: 'public', label: 'Public', desc: 'Apparais sur la carte de la communauté Mira.' },
            { id: 'private', label: 'Privé', desc: 'Ton profil reste invisible aux autres apprenants.' },
          ].map(opt => (
            <label key={opt.id} style={{flex:1,display:'flex',gap:12,padding:18,borderRadius:14,cursor:'pointer',
              border:'2px solid', borderColor: v === opt.id ? 'var(--charcoal)' : 'var(--rule)',
              background: v === opt.id ? 'var(--warm-beige)' : '#fff',transition:'all .2s',
            }}>
              <input type="radio" name="visibility" checked={v === opt.id} onChange={() => setV(opt.id)} style={{accentColor:'var(--mira-red)',marginTop:4}} />
              <div>
                <div style={{fontWeight:600,fontSize:14,marginBottom:4}}>{opt.label}</div>
                <div style={{fontSize:13,color:'var(--muted)'}}>{opt.desc}</div>
              </div>
            </label>
          ))}
        </div>
      </div>
    </section>
  );
}

function PathPreview({ active, skillsTarget }) {
  const D = window.MiraData;
  if (!active) {
    return (
      <section>
        <h2 style={{margin:'0 0 14px',fontSize:18,fontWeight:600,letterSpacing:'-0.01em'}}>Mon parcours</h2>
        <div style={{
          background:'linear-gradient(135deg, var(--charcoal) 0%, #2D2D2A 100%)',color:'#fff',
          borderRadius:20,padding:'32px 36px',position:'relative',overflow:'hidden',
          display:'grid',gridTemplateColumns:'1fr auto',gap:24,alignItems:'center',
        }}>
          <div>
            <div className="eyebrow" style={{color:'#B6B0A6',marginBottom:10}}>✨ Mira AI</div>
            <h3 style={{fontFamily:'var(--font-serif)',fontWeight:500,fontSize:28,letterSpacing:'-0.02em',margin:0,lineHeight:1.1,color:'#fff'}}>
              Génère ton parcours <span className="serif-i" style={{color:'var(--mira-red-hover)'}}>sur mesure.</span>
            </h3>
            <p style={{margin:'12px 0 0',color:'#B6B0A6',fontSize:14,maxWidth:440}}>
              On t'aide à passer du point A au point B en 4 étapes max. Démarre quand tu veux — ~15 secondes pour générer.
            </p>
          </div>
          <a href="#/me/path/generate" className="btn btn-primary btn-lg"><Icon name="sparkles" size={16}/> Générer</a>
          <div style={{position:'absolute',right:-60,bottom:-60,width:200,height:200,borderRadius:'50%',background:'radial-gradient(circle, rgba(230,51,42,0.25), transparent 70%)',pointerEvents:'none'}}/>
        </div>
      </section>
    );
  }
  // Active path preview
  return (
    <section>
      <h2 style={{margin:'0 0 14px',fontSize:18,fontWeight:600,letterSpacing:'-0.01em'}}>Mon parcours</h2>
      <a href="#/me/path" className="card" style={{display:'block',padding:28,textDecoration:'none',transition:'all .3s'}}
         onMouseEnter={e=>e.currentTarget.style.transform='translateY(-2px)'}
         onMouseLeave={e=>e.currentTarget.style.transform='translateY(0)'}
      >
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:20,gap:24}}>
          <div>
            <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
              <Icon name="compass" size={18} style={{color:'var(--mira-red)'}}/>
              <span className="eyebrow" style={{color:'var(--mira-red)'}}>Parcours actif</span>
            </div>
            <h3 style={{margin:0,fontSize:22,fontWeight:600,letterSpacing:'-0.01em',fontFamily:'var(--font-serif)'}}>
              Pitch + Funding
            </h3>
            <p style={{margin:'6px 0 0',color:'var(--muted)',fontSize:14}}>2 étapes · estimé 6 mois · ~80 € total</p>
          </div>
          <span className="arrow-link">Voir mon parcours <Icon name="arrow-right" size={14} strokeWidth={2}/></span>
        </div>
        <div style={{display:'flex',gap:10,alignItems:'center',marginBottom:8}}>
          <div style={{flex:1,height:6,background:'var(--rule)',borderRadius:9999,overflow:'hidden'}}>
            <div style={{width:'15%',height:'100%',background:'var(--mira-red)',borderRadius:9999}}/>
          </div>
          <span style={{fontSize:12,color:'var(--muted)',fontWeight:500}}>Étape 1 sur 2 · en cours</span>
        </div>
      </a>
    </section>
  );
}

function EnrolmentsSection({ isEmpty }) {
  const D = window.MiraData;
  if (isEmpty) {
    return (
      <section>
        <h2 style={{margin:'0 0 14px',fontSize:18,fontWeight:600,letterSpacing:'-0.01em'}}>Mes inscriptions</h2>
        <EmptyState text="Tu n'as pas encore postulé à une Mira Class. Parcours le catalogue, candidate quand t'es prêt." ctaLabel="Voir le catalogue" ctaHref="#/classes" icon="briefcase" />
      </section>
    );
  }
  return (
    <section>
      <h2 style={{margin:'0 0 14px',fontSize:18,fontWeight:600,letterSpacing:'-0.01em'}}>Mes inscriptions</h2>
      <div className="card" style={{padding:0,overflow:'hidden'}}>
        {D.anna.enrolments.map((e, i) => {
          const klass = D.classBySlug(e.classSlug);
          return (
            <a key={i} href={`#/classes/${klass.slug}`} style={{
              display:'grid',gridTemplateColumns:'auto 1fr auto auto',gap:16,padding:'18px 24px',alignItems:'center',
              borderTop: i === 0 ? '0' : '1px solid var(--rule)',textDecoration:'none',color:'inherit',
            }}>
              <div style={{width:48,height:48,borderRadius:10,overflow:'hidden',flexShrink:0}} className="img-skel">
                <img src={klass.photo} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
              </div>
              <div>
                <div style={{fontWeight:600,fontSize:15}}>{klass.title}</div>
                <div style={{fontSize:12,color:'var(--muted)',marginTop:2}}>par {D.mentors[klass.mentor].name}</div>
              </div>
              <span className="chip chip-gold">En attente · {e.when}</span>
              <Icon name="arrow-right" size={16} style={{color:'var(--muted)'}}/>
            </a>
          );
        })}
      </div>
    </section>
  );
}

Object.assign(window, { MePage });
