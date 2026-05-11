// Mira Learn — Apply (/classes/{slug}/apply)

function ApplyPage({ params, query }) {
  const D = window.MiraData;
  const klass = D.classBySlug(params.slug);
  if (!klass) return <div className="container" style={{padding:80}}>Class introuvable.</div>;
  const mentor = D.mentors[klass.mentor];

  const [session, setSession] = useState(query.s || klass.sessions[0].id);
  const [level, setLevel] = useState('quelques-bases');
  const [goal, setGoal] = useState('');
  const [avail, setAvail] = useState({ soir: true, weekend: false, semaine: false });
  const [submitted, setSubmitted] = useState(false);

  if (submitted) return <ApplySuccess klass={klass} mentor={mentor}/>;

  const charCount = goal.length;
  const goalValid = charCount >= 50 && charCount <= 500;

  return (
    <div data-screen-label="07 Apply" className="page-enter">
      <div className="container" style={{maxWidth:720,margin:'0 auto',padding:'40px 32px 96px'}}>
        <a href={`#/classes/${klass.slug}`} className="arrow-link" style={{fontSize:13,color:'var(--muted)',marginBottom:24,display:'inline-flex'}}>
          <Icon name="arrow-left" size={13} strokeWidth={2}/> Class : {klass.title}
        </a>

        <h1 style={{fontFamily:'var(--font-serif)',fontWeight:500,fontSize:'clamp(30px,4vw,42px)',letterSpacing:'-0.02em',margin:0,lineHeight:1.05}}>
          Postuler à cette <span className="serif-i" style={{color:'var(--mira-red)'}}>Mira Class.</span>
        </h1>
        <div style={{display:'flex',alignItems:'center',gap:12,marginTop:18,marginBottom:8}}>
          <Avatar src={mentor.avatar} name={mentor.name} size={36}/>
          <p style={{margin:0,fontSize:15,color:'var(--muted)'}}>
            <span style={{color:'var(--charcoal)',fontWeight:600}}>{mentor.name.split(' ')[0]}</span> examinera ta candidature et te répondra sous 48 h.
          </p>
        </div>

        <div style={{marginTop:48,display:'flex',flexDirection:'column',gap:36}}>
          {/* Session */}
          <Field2 label="Session souhaitée" hint="Tu peux candidater à une seule session à la fois.">
            <div style={{display:'flex',flexDirection:'column',gap:10}}>
              {klass.sessions.map(s => (
                <label key={s.id} style={{
                  padding:'18px 22px',borderRadius:14,cursor:'pointer',
                  border:'2px solid', borderColor: session === s.id ? 'var(--charcoal)' : 'var(--rule)',
                  background: session === s.id ? 'var(--warm-beige)' : '#fff',
                  display:'flex',alignItems:'center',gap:16,
                  transition:'all .2s',
                }}>
                  <input type="radio" checked={session === s.id} onChange={() => setSession(s.id)} style={{display:'none'}}/>
                  <div style={{width:20,height:20,borderRadius:'50%',border:'2px solid',borderColor: session === s.id ? 'var(--mira-red)' : 'var(--rule)',display:'flex',alignItems:'center',justifyContent:'center'}}>
                    {session === s.id && <span style={{width:10,height:10,borderRadius:'50%',background:'var(--mira-red)'}}/>}
                  </div>
                  <div style={{flex:1}}>
                    <div style={{display:'flex',alignItems:'center',gap:8,fontWeight:600,fontSize:15}}>
                      <Icon name={s.mode === 'physical' ? 'map-pin' : 'globe'} size={15}/>
                      {s.location}
                    </div>
                    <div style={{fontSize:13,color:'var(--muted)',marginTop:4}}>
                      {s.dates} · {s.format} · {s.seats - s.enrolled} places dispo
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </Field2>

          {/* Niveau */}
          <Field2 label="Ton niveau actuel">
            <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
              {[
                { id:'debutant', t:'Débutant complet' },
                { id:'quelques-bases', t:'Quelques bases' },
                { id:'inter', t:'Intermédiaire' },
                { id:'avance', t:'Avancé' },
                { id:'expert', t:'Expert (je veux peaufiner)' },
              ].map(o => (
                <button key={o.id} type="button" onClick={() => setLevel(o.id)} className="chip" style={{
                  height:36,padding:'0 16px',fontSize:13,cursor:'pointer',
                  background: level === o.id ? 'var(--charcoal)' : '#fff',
                  color: level === o.id ? '#fff' : 'var(--charcoal)',
                  border:'1px solid', borderColor: level === o.id ? 'var(--charcoal)' : 'var(--rule)',
                }}>{o.t}</button>
              ))}
            </div>
          </Field2>

          {/* Objectif */}
          <Field2 label="Ton objectif concret" hint="200–500 caractères. Sois spécifique : un projet, un timing, un montant.">
            <textarea
              value={goal} onChange={e => setGoal(e.target.value.slice(0,500))}
              placeholder="Ex : lever ma première seed de 500k en automne 2026 pour mon SaaS B2B en finance verte."
              className="input textarea"
              style={{minHeight:140}}
            />
            <div style={{display:'flex',justifyContent:'space-between',marginTop:8,fontSize:12,color:'var(--muted)'}}>
              <span>{goalValid ? '✓ ton objectif est clair' : (charCount < 50 ? `${50 - charCount} caractères restants minimum` : 'Bien.')}</span>
              <span style={{fontVariantNumeric:'tabular-nums',color: charCount > 480 ? 'var(--error)' : 'var(--muted)'}}>{charCount}/500</span>
            </div>
          </Field2>

          {/* Dispo */}
          <Field2 label="Disponibilité" hint="Coche tout ce qui marche pour toi.">
            <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
              {[
                { id:'soir', t:'Soir (18h–21h)' },
                { id:'weekend', t:'Weekend' },
                { id:'semaine', t:'Journée semaine' },
              ].map(o => (
                <label key={o.id} style={{
                  display:'inline-flex',alignItems:'center',gap:10,padding:'12px 18px',
                  borderRadius:12,border:'2px solid', borderColor: avail[o.id] ? 'var(--charcoal)' : 'var(--rule)',
                  background: avail[o.id] ? 'var(--warm-beige)' : '#fff',cursor:'pointer',
                  transition:'all .2s',fontSize:14,fontWeight:500,
                }}>
                  <span style={{
                    width:18,height:18,borderRadius:5,border:'2px solid',
                    borderColor: avail[o.id] ? 'var(--mira-red)' : 'var(--rule)',
                    background: avail[o.id] ? 'var(--mira-red)' : '#fff',
                    display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',
                  }}>
                    {avail[o.id] && <Icon name="check" size={11} strokeWidth={3}/>}
                  </span>
                  {o.t}
                  <input type="checkbox" checked={avail[o.id]} onChange={() => setAvail({...avail, [o.id]: !avail[o.id]})} style={{display:'none'}}/>
                </label>
              ))}
            </div>
          </Field2>
        </div>

        <div style={{marginTop:48,display:'flex',justifyContent:'space-between',alignItems:'center',gap:16,paddingTop:32,borderTop:'1px solid var(--rule)'}}>
          <a href={`#/classes/${klass.slug}`} className="btn btn-ghost">Annuler</a>
          <button onClick={() => setSubmitted(true)} disabled={!goalValid} className="btn btn-primary btn-lg" style={{opacity:goalValid?1:0.5}}>
            Soumettre ma candidature <Icon name="arrow-right" size={16} strokeWidth={2.2}/>
          </button>
        </div>
      </div>
    </div>
  );
}

function Field2({ label, hint, children }) {
  return (
    <div>
      <h2 style={{margin:'0 0 4px',fontSize:16,fontWeight:600,letterSpacing:'-0.01em'}}>{label}</h2>
      {hint && <p style={{margin:'0 0 14px',fontSize:13,color:'var(--muted)'}}>{hint}</p>}
      {children}
    </div>
  );
}

function ApplySuccess({ klass, mentor }) {
  return (
    <div data-screen-label="07b Apply Success" className="page-enter" style={{minHeight:'calc(100vh - 72px)',display:'flex',alignItems:'center',justifyContent:'center',padding:'64px 32px'}}>
      <div style={{maxWidth:520,textAlign:'center'}}>
        <div style={{width:80,height:80,borderRadius:'50%',background:'var(--sage-soft)',display:'inline-flex',alignItems:'center',justifyContent:'center',color:'var(--success)',marginBottom:28}}>
          <Icon name="check" size={36} strokeWidth={2.5}/>
        </div>
        <h2 style={{fontFamily:'var(--font-serif)',fontWeight:500,fontSize:36,letterSpacing:'-0.02em',margin:0,lineHeight:1.1}}>
          Candidature envoyée à <span className="serif-i" style={{color:'var(--mira-red)'}}>{mentor.name.split(' ')[0]}.</span>
        </h2>
        <p style={{fontSize:16,color:'var(--muted)',margin:'20px 0 32px',lineHeight:1.55}}>
          Tu recevras une réponse par email sous 48 h. En attendant, tu peux explorer le reste du catalogue ou bosser ton parcours.
        </p>
        <div style={{display:'flex',gap:10,justifyContent:'center'}}>
          <a href="#/me" className="btn btn-primary">Voir mon profil</a>
          <a href="#/classes" className="btn btn-ghost">Voir le catalogue</a>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { ApplyPage });
