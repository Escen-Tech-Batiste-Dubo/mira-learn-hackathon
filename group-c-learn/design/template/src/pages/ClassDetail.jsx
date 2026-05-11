// Mira Learn — Class Detail (/classes/{slug})

function ClassDetailPage({ params }) {
  const D = window.MiraData;
  const klass = D.classBySlug(params.slug);
  if (!klass) return <div className="container" style={{padding:80}}>Class introuvable.</div>;
  const mentor = D.mentors[klass.mentor];

  return (
    <div data-screen-label="03 Class Detail" className="page-enter">
      {/* Breadcrumb */}
      <div style={{padding:'20px 0 8px'}}>
        <div className="container">
          <a href="#/classes" className="arrow-link" style={{fontSize:13,color:'var(--muted)'}}>
            <Icon name="arrow-left" size={13} strokeWidth={2} /> Catalogue
          </a>
        </div>
      </div>

      {/* Hero */}
      <section style={{padding:'24px 0 56px'}}>
        <div className="container" style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:48,alignItems:'center'}}>
          <div style={{position:'relative',aspectRatio:'4/3',borderRadius:24,overflow:'hidden'}} className="img-skel">
            <img src={klass.photo} alt={klass.title} style={{width:'100%',height:'100%',objectFit:'cover'}} />
            <div style={{position:'absolute',top:18,left:18,display:'flex',gap:8}}>
              <span style={{background:'rgba(255,255,255,0.92)',backdropFilter:'blur(8px)',padding:'6px 12px',borderRadius:9999,fontSize:12,fontWeight:600}}>{klass.format}</span>
              <span style={{background:'rgba(255,255,255,0.92)',backdropFilter:'blur(8px)',padding:'6px 12px',borderRadius:9999,fontSize:12,fontWeight:600,display:'inline-flex',alignItems:'center',gap:4}}>
                <Icon name="clock" size={12} strokeWidth={2}/> {klass.duration}
              </span>
            </div>
          </div>
          <div>
            <div className="chip-row" style={{marginBottom:20}}>
              {klass.skills.map(s => <SkillChip key={s} primary={s===klass.primarySkill}>{D.skillLabel(s)}</SkillChip>)}
            </div>
            <h1 style={{fontFamily:'var(--font-serif)',fontWeight:500,fontSize:'clamp(30px,4vw,46px)',letterSpacing:'-0.02em',margin:0,lineHeight:1.05}}>
              {klass.title}
            </h1>
            <p style={{fontSize:17,color:'var(--muted)',margin:'18px 0 28px',lineHeight:1.55}}>{klass.subtitle}</p>
            <div style={{display:'flex',alignItems:'center',gap:24,padding:'20px 0',borderTop:'1px solid var(--rule)',borderBottom:'1px solid var(--rule)',marginBottom:24}}>
              <div>
                <div style={{fontSize:12,color:'var(--muted)',marginBottom:4}}>À partir de</div>
                <div style={{fontFamily:'var(--font-serif)',fontSize:36,fontWeight:600,color:'var(--mira-red)',lineHeight:1,letterSpacing:'-0.02em'}}>{klass.price} €</div>
              </div>
              <div style={{height:32,width:1,background:'var(--rule)'}}/>
              <div>
                <StarRating value={klass.rating} reviews={klass.reviews} size={14}/>
                <div style={{fontSize:12,color:'var(--muted)',marginTop:2}}>par cohorte de {klass.cohortSize}</div>
              </div>
            </div>
            <div style={{display:'flex',gap:10}}>
              <a href={`#/classes/${klass.slug}/apply`} className="btn btn-primary btn-lg">Postuler à une session <Icon name="arrow-right" size={16} strokeWidth={2.2}/></a>
              <button className="btn btn-ghost btn-lg">Sauvegarder</button>
            </div>
          </div>
        </div>
      </section>

      {/* Mentor */}
      <section style={{padding:'24px 0'}}>
        <div className="container">
          <div className="eyebrow" style={{marginBottom:14}}>Le mentor</div>
          <div className="card" style={{padding:28,display:'grid',gridTemplateColumns:'auto 1fr auto',gap:24,alignItems:'center'}}>
            <Avatar src={mentor.avatar} name={mentor.name} size={84}/>
            <div>
              <h3 style={{margin:0,fontSize:22,fontWeight:600,letterSpacing:'-0.01em'}}>{mentor.name}</h3>
              <p style={{margin:'6px 0 12px',color:'var(--muted)',fontSize:14}}>{mentor.headline}</p>
              <div style={{display:'flex',gap:14,fontSize:13,color:'var(--muted)',alignItems:'center'}}>
                <StarRating value={mentor.rating} reviews={mentor.reviews}/>
                <span style={{opacity:0.4}}>·</span>
                <span><Icon name="graduation" size={13}/> {mentor.classes} Mira Classes</span>
              </div>
            </div>
            <a href={`#/classes?mentor=${mentor.id}`} className="arrow-link">Voir tous ses cours <Icon name="arrow-right" size={14} strokeWidth={2}/></a>
          </div>
        </div>
      </section>

      {/* About */}
      <section style={{padding:'56px 0'}}>
        <div className="container" style={{display:'grid',gridTemplateColumns:'200px 1fr',gap:48}}>
          <div className="eyebrow">À propos</div>
          <div style={{maxWidth:680,fontSize:16,lineHeight:1.7,color:'var(--charcoal)'}}>
            {klass.description.split('\n\n').map((p, i) => (
              <p key={i} style={{margin: i === 0 ? '0 0 18px' : 0,color:'var(--charcoal)'}}>{p}</p>
            ))}
          </div>
        </div>
      </section>

      {/* Modules — vertical timeline */}
      <section style={{padding:'24px 0',borderTop:'1px solid var(--rule)'}}>
        <div className="container" style={{display:'grid',gridTemplateColumns:'200px 1fr',gap:48,paddingTop:56}}>
          <div>
            <div className="eyebrow">Modules</div>
            <div style={{fontSize:13,color:'var(--muted)',marginTop:8}}>
              {klass.modules.length} modules · {klass.modules.reduce((a,m)=>a+parseInt(m.dur),0)} h au total
            </div>
          </div>
          <div style={{position:'relative'}}>
            <div style={{position:'absolute',left:13,top:8,bottom:8,width:2,background:'var(--rule)'}}/>
            {klass.modules.map((m, i) => (
              <div key={m.n} style={{display:'grid',gridTemplateColumns:'28px 1fr',gap:18,marginBottom:i===klass.modules.length-1?0:28,position:'relative'}}>
                <div style={{
                  width:28,height:28,borderRadius:'50%',
                  background:'#fff',border:'2px solid var(--charcoal)',
                  display:'inline-flex',alignItems:'center',justifyContent:'center',
                  fontSize:12,fontWeight:600,zIndex:1,
                }}>{m.n}</div>
                <div className="card" style={{padding:'18px 22px'}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline',marginBottom:6,gap:12}}>
                    <h4 style={{margin:0,fontSize:16,fontWeight:600}}>{m.title}</h4>
                    <span style={{fontSize:13,color:'var(--muted)',whiteSpace:'nowrap'}}>{m.dur}</span>
                  </div>
                  <p style={{margin:0,fontSize:13,color:'var(--muted)'}}>{m.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Sessions */}
      <section style={{padding:'56px 0 96px',borderTop:'1px solid var(--rule)',marginTop:56}}>
        <div className="container">
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-end',marginBottom:32,flexWrap:'wrap',gap:16}}>
            <div>
              <div className="eyebrow" style={{marginBottom:10}}>Sessions disponibles</div>
              <h2 style={{fontFamily:'var(--font-serif)',fontWeight:500,fontSize:32,letterSpacing:'-0.02em',margin:0,lineHeight:1.1}}>
                Choisis ta <span className="serif-i" style={{color:'var(--mira-red)'}}>cohorte.</span>
              </h2>
            </div>
            <div style={{fontSize:13,color:'var(--muted)',maxWidth:340}}>
              Les places sont limitées (max {klass.cohortSize} par cohorte). {mentor.name.split(' ')[0]} examine chaque candidature.
            </div>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(360px, 1fr))',gap:20}}>
            {klass.sessions.map(s => <SessionCard key={s.id} session={s} classSlug={klass.slug}/>)}
          </div>
        </div>
      </section>
    </div>
  );
}

Object.assign(window, { ClassDetailPage });
