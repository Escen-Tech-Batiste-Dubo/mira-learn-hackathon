// Mira Learn — Path (/me/path)
// Vertical timeline with états: in_progress, locked, completed

function PathPage() {
  const D = window.MiraData;
  const klassPitch = D.classBySlug('pitch');
  const klassGrowth = D.classBySlug('growth');

  // Anna's path:
  // étape 1 in_progress — Pitch investor → class pitch (applied)
  // étape 2 locked — Funding strategy → same class covers it
  // (optional étape 3 completed mockup for the "tweaks: show completed state" case — handled via tweaks file)
  const steps = [
    {
      idx: 1, state: 'in_progress',
      skill: 'Pitch investor',
      class: klassPitch,
      note: 'Class flagship d\'Antoine pour valider la skill pitch. Tu as déjà postulé (en attente de réponse depuis 2 j).',
      applied: true,
    },
    {
      idx: 2, state: 'locked',
      skill: 'Funding strategy',
      class: klassPitch,
      note: 'La même class couvre aussi funding strategy. Étape débloquée quand l\'étape 1 est validée (QCM mobile + projet final).',
    },
  ];

  return (
    <div data-screen-label="06 Path" className="page-enter">
      <div className="container" style={{padding:'40px 0 96px',display:'flex',gap:48}}>
        <AuthSidebar current="/me/path"/>
        <div style={{flex:1,minWidth:0,maxWidth:820}}>
          {/* Header */}
          <header style={{display:'flex',justifyContent:'space-between',alignItems:'flex-end',marginBottom:48,gap:24,flexWrap:'wrap'}}>
            <div>
              <div className="eyebrow" style={{marginBottom:10,display:'inline-flex',alignItems:'center',gap:6,color:'var(--mira-red)'}}>
                <Icon name="sparkles" size={13}/> Généré par Mira AI
              </div>
              <h1 style={{fontFamily:'var(--font-serif)',fontWeight:500,fontSize:'clamp(32px,4.4vw,44px)',letterSpacing:'-0.02em',margin:0,lineHeight:1.05}}>
                Mon parcours.
              </h1>
              <p style={{margin:'14px 0 0',color:'var(--muted)',fontSize:16}}>
                Pitch + Funding · estimé 6 mois · ~80 € total
              </p>
            </div>
            <button className="btn btn-ghost btn-sm">
              <Icon name="refresh" size={14} strokeWidth={2}/> Régénérer
            </button>
          </header>

          {/* Progress bar */}
          <div className="card" style={{padding:'18px 22px',marginBottom:48,display:'flex',alignItems:'center',gap:16}}>
            <div style={{flex:1}}>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:12,color:'var(--muted)',marginBottom:8}}>
                <span>Progression</span>
                <span><span style={{fontWeight:600,color:'var(--charcoal)'}}>0</span> / 2 étapes validées</span>
              </div>
              <div style={{height:8,background:'var(--rule)',borderRadius:9999,overflow:'hidden'}}>
                <div style={{width:'15%',height:'100%',background:'linear-gradient(90deg, var(--mira-red), #FF8A82)',borderRadius:9999}}/>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div style={{position:'relative',paddingLeft:0}}>
            {steps.map((s, i) => (
              <PathStep key={s.idx} step={s} isLast={i === steps.length - 1} />
            ))}
          </div>

          {/* Footer */}
          <div style={{
            marginTop:48,padding:'18px 24px',background:'#fff',border:'1px solid var(--rule)',borderRadius:14,
            display:'flex',alignItems:'center',gap:12,color:'var(--muted)',fontSize:13,
          }}>
            <Icon name="sparkles" size={16} style={{color:'var(--mira-red)'}}/>
            Cette recommandation est issue de Mira AI · dernière mise à jour il y a 2 j.
            <button className="btn btn-text btn-sm" style={{marginLeft:'auto'}}>Donner du feedback</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function PathStep({ step, isLast }) {
  const D = window.MiraData;
  const k = step.class;
  const mentor = D.mentors[k.mentor];

  const isLocked = step.state === 'locked';
  const isDone = step.state === 'completed';
  const isActive = step.state === 'in_progress';

  const dotColor = isActive ? 'var(--mira-red)' : isDone ? 'var(--success)' : 'var(--muted-soft)';
  const dotRing = isActive ? 'var(--sage-soft)' : isDone ? 'rgba(22,163,74,0.18)' : 'transparent';
  const titleColor = isLocked ? 'var(--muted)' : 'var(--charcoal)';

  return (
    <div style={{position:'relative',paddingLeft:56,paddingBottom:isLast?0:48}}>
      {/* Vertical line */}
      {!isLast && <div style={{position:'absolute',left:23,top:48,bottom:0,width:2,background:'var(--rule)'}}/>}
      {/* Dot */}
      <div style={{
        position:'absolute',left:8,top:6,
        width:32,height:32,borderRadius:'50%',background:'#fff',
        border:`2px solid ${dotColor}`,
        boxShadow: isActive ? `0 0 0 6px ${dotRing}` : 'none',
        display:'flex',alignItems:'center',justifyContent:'center',
      }}>
        {isDone ? <Icon name="check" size={14} strokeWidth={3} style={{color:dotColor}}/> :
         isLocked ? <Icon name="lock" size={12} strokeWidth={2} style={{color:dotColor}}/> :
         <span style={{width:10,height:10,borderRadius:'50%',background:dotColor}}/>}
      </div>

      <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:12,flexWrap:'wrap'}}>
        <span className="eyebrow" style={{color:isLocked?'var(--muted)':'var(--charcoal)'}}>
          Étape {step.idx}
        </span>
        {isActive && <span className="chip chip-skill">En cours</span>}
        {isLocked && <span className="chip chip-outline" style={{color:'var(--muted)'}}><Icon name="lock" size={11} strokeWidth={2}/> Verrouillée</span>}
        {isDone && <span className="chip chip-success">Validée</span>}
      </div>

      <h3 style={{margin:'0 0 4px',fontSize:24,fontWeight:600,letterSpacing:'-0.02em',color:titleColor,fontFamily:'var(--font-serif)'}}>
        Maîtriser : {step.skill}
      </h3>

      <p style={{margin:'8px 0 18px',fontSize:14,color:'var(--muted)',lineHeight:1.55,maxWidth:560}}>
        « {step.note} »
      </p>

      {/* Class card */}
      <div style={{
        background: isLocked ? 'transparent' : '#fff',
        border:'1px solid var(--rule)',
        borderRadius:16, overflow:'hidden',
        display:'grid',gridTemplateColumns:'auto 1fr auto',gap:18,padding:16,alignItems:'center',
        opacity: isLocked ? 0.55 : 1,
        maxWidth:640,
      }}>
        <div style={{width:96,height:64,borderRadius:10,overflow:'hidden',flexShrink:0,filter:isLocked?'grayscale(0.5)':'none'}} className="img-skel">
          <img src={k.photo} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
        </div>
        <div style={{minWidth:0}}>
          <div style={{fontSize:15,fontWeight:600,letterSpacing:'-0.01em',marginBottom:4}}>{k.title}</div>
          <div style={{display:'flex',alignItems:'center',gap:10,fontSize:12,color:'var(--muted)',flexWrap:'wrap'}}>
            <MentorMini mentor={mentor} size={20}/>
            <span style={{opacity:0.4}}>·</span>
            <span style={{fontWeight:600,color:isLocked?'var(--muted)':'var(--mira-red)'}}>{k.price} €</span>
            {step.applied && (<><span style={{opacity:0.4}}>·</span><span className="chip chip-gold" style={{height:22,padding:'0 8px',fontSize:11}}>Candidaté</span></>)}
          </div>
        </div>
        <a href={`#/classes/${k.slug}`} className="btn btn-sm" style={{
          background: isLocked ? 'var(--rule)' : 'var(--charcoal)',
          color: isLocked ? 'var(--muted)' : '#fff',
          pointerEvents: isLocked ? 'none' : 'auto',
        }}>
          {isLocked ? 'Verrouillée' : 'Voir cette class'} {!isLocked && <Icon name="arrow-right" size={13} strokeWidth={2.2}/>}
        </a>
      </div>
    </div>
  );
}

Object.assign(window, { PathPage });
