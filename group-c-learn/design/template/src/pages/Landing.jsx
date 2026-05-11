// Mira Learn — Landing (/)

function LandingPage() {
  const D = window.MiraData;
  return (
    <div data-screen-label="01 Landing" className="page-enter">
      <Hero />
      <FeaturedClasses />
      <HowItWorks />
      <Testimonials />
      <CTABand />
    </div>
  );
}

function Hero() {
  return (
    <section style={{padding:'48px 0 64px'}}>
      <div className="container" style={{display:'grid',gridTemplateColumns:'1.1fr 1fr',gap:64,alignItems:'center'}}>
        <div>
          <div className="eyebrow" style={{display:'inline-flex',alignItems:'center',gap:8,padding:'6px 12px',background:'#fff',border:'1px solid var(--rule)',borderRadius:9999,marginBottom:24}}>
            <span style={{width:7,height:7,borderRadius:'50%',background:'var(--mira-red)'}}/>
            Lancement à Lisbonne · Barcelone
          </div>
          <h1 style={{
            fontFamily:'var(--font-serif)',fontWeight:500,
            fontSize:'clamp(40px, 5.6vw, 64px)',
            lineHeight:1.02,letterSpacing:'-0.025em',margin:0,
          }}>
            Apprends en voyageant.<br/>
            <span style={{fontStyle:'italic',color:'var(--mira-red)'}}>Avec des mentors qui ont fait le chemin.</span>
          </h1>
          <p style={{fontSize:18,color:'var(--muted)',lineHeight:1.55,margin:'28px 0 36px',maxWidth:520}}>
            Mira Learn t'aide à acquérir les skills dont tu as besoin auprès de mentors validés — en présentiel à Lisbonne, Barcelone, ou en virtuel depuis n'importe où.
          </p>
          <div style={{display:'flex',gap:12,flexWrap:'wrap'}}>
            <a href="#/classes" className="btn btn-primary btn-lg">Découvrir les classes <Icon name="arrow-right" size={16} strokeWidth={2.2}/></a>
            <a href="#/classes" className="btn btn-ghost btn-lg">Devenir mentor</a>
          </div>
          <div style={{display:'flex',gap:32,marginTop:48,flexWrap:'wrap'}}>
            <Stat n="3" l="Mira Classes published" />
            <Stat n="107" l="Reviews · 4.8 ★" />
            <Stat n="6" l="Villes en 2026" />
          </div>
        </div>
        <HeroVisual />
      </div>
    </section>
  );
}

function Stat({ n, l }) {
  return (
    <div>
      <div style={{fontFamily:'var(--font-serif)',fontSize:32,fontWeight:600,letterSpacing:'-0.02em',lineHeight:1}}>{n}</div>
      <div style={{fontSize:12,color:'var(--muted)',marginTop:6,letterSpacing:0.2}}>{l}</div>
    </div>
  );
}

function HeroVisual() {
  // Layered photo composition — main hero + floating skill chip + mentor card
  return (
    <div style={{position:'relative',aspectRatio:'4/5',width:'100%'}}>
      <div style={{position:'absolute',inset:0,borderRadius:24,overflow:'hidden'}} className="img-skel">
        <img src="https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=900&h=1100&fit=crop&q=80" alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
        <div style={{position:'absolute',inset:0,background:'linear-gradient(180deg, transparent 40%, rgba(0,0,0,0.35) 100%)'}}/>
        <div style={{position:'absolute',bottom:20,left:20,right:20,color:'#fff',display:'flex',alignItems:'center',gap:10,fontSize:13}}>
          <Icon name="map-pin" size={14}/>
          <span>Selina coworking · Lisbonne, PT</span>
        </div>
      </div>
      {/* Floating mentor card */}
      <div className="card" style={{
        position:'absolute',top:'10%',right:-24,padding:14,
        display:'flex',gap:10,alignItems:'center',width:240,
        boxShadow:'0 20px 50px rgba(0,0,0,0.12)',
      }}>
        <Avatar src={window.MiraData.mentors.antoine.avatar} name="Antoine Martin" size={44}/>
        <div style={{minWidth:0,flex:1}}>
          <div style={{fontSize:13,fontWeight:600}}>Antoine Martin</div>
          <div style={{fontSize:11,color:'var(--muted)'}}>Mira Mentor · Pitch</div>
          <div style={{display:'flex',alignItems:'center',gap:4,marginTop:3}}>
            <Icon name="star" size={11} strokeWidth={0} style={{color:'var(--gold)'}}/>
            <span style={{fontSize:11,fontWeight:600}}>4.8</span>
            <span style={{fontSize:11,color:'var(--muted)'}}>· 47 reviews</span>
          </div>
        </div>
      </div>
      {/* Floating skill chip */}
      <div style={{
        position:'absolute',bottom:'18%',left:-20,
        background:'#fff',border:'1px solid var(--rule)',
        padding:'10px 14px',borderRadius:14,
        boxShadow:'0 14px 30px rgba(0,0,0,0.08)',
        display:'flex',alignItems:'center',gap:10,
      }}>
        <Icon name="sparkles" size={16} style={{color:'var(--mira-red)'}}/>
        <div>
          <div style={{fontSize:11,color:'var(--muted)'}}>Skill cible</div>
          <div style={{fontSize:13,fontWeight:600}}>Pitch investor</div>
        </div>
      </div>
    </div>
  );
}

function FeaturedClasses() {
  const D = window.MiraData;
  return (
    <section style={{padding:'80px 0'}}>
      <div className="container">
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-end',marginBottom:40,flexWrap:'wrap',gap:16}}>
          <div>
            <div className="eyebrow" style={{marginBottom:14}}>Featured</div>
            <h2 style={{fontFamily:'var(--font-serif)',fontWeight:500,fontSize:'clamp(28px,3.6vw,42px)',letterSpacing:'-0.02em',margin:0,lineHeight:1.1,maxWidth:640}}>
              Les Mira Classes qu'on lance <span className="serif-i" style={{color:'var(--mira-red)'}}>cet été</span>.
            </h2>
          </div>
          <a href="#/classes" className="arrow-link">Voir tout le catalogue <Icon name="arrow-right" size={14} strokeWidth={2}/></a>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(3, 1fr)',gap:24}}>
          {D.classes.map(c => (
            <ClassCard key={c.slug} klass={c} onClick={() => window.MiraNav.go(`/classes/${c.slug}`)} />
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    { n: '01', t: 'Définis ta skill cible', d: 'Ajoute les skills que tu veux acquérir. Mira AI les croise avec ton CV si tu veux.' },
    { n: '02', t: 'L\'IA crée ton parcours', d: 'En 15 secondes, un parcours sur mesure qui croise tes objectifs et le catalogue.' },
    { n: '03', t: 'Tu suis les classes', d: 'En présentiel à Lisbonne ou Barcelone, ou en virtuel depuis Bali, Mexico, où tu veux.' },
    { n: '04', t: 'Tu valides ta skill', d: 'QCM mobile + projet final. Tu rejoins une communauté qui a la même skill.' },
  ];
  return (
    <section style={{padding:'80px 0',background:'#fff',borderTop:'1px solid var(--rule)',borderBottom:'1px solid var(--rule)'}}>
      <div className="container">
        <div style={{maxWidth:680,marginBottom:56}}>
          <div className="eyebrow" style={{marginBottom:14}}>Comment ça marche</div>
          <h2 style={{fontFamily:'var(--font-serif)',fontWeight:500,fontSize:'clamp(28px,3.6vw,42px)',letterSpacing:'-0.02em',margin:0,lineHeight:1.1}}>
            Un parcours d'apprentissage,<br/><span className="serif-i" style={{color:'var(--mira-red)'}}>fait pour toi.</span>
          </h2>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(4, 1fr)',gap:32,position:'relative'}}>
          {/* Connector line */}
          <div style={{position:'absolute',top:18,left:'12.5%',right:'12.5%',height:1,background:'var(--rule)',zIndex:0}}/>
          {steps.map((s, i) => (
            <div key={s.n} style={{position:'relative',zIndex:1}}>
              <div style={{
                width:36,height:36,borderRadius:'50%',
                background: i === 0 ? 'var(--mira-red)' : '#fff',
                color: i === 0 ? '#fff' : 'var(--charcoal)',
                border: i === 0 ? '0' : '1px solid var(--rule)',
                display:'inline-flex',alignItems:'center',justifyContent:'center',
                fontSize:13,fontWeight:600,marginBottom:20,
              }}>{s.n}</div>
              <h3 style={{margin:0,fontSize:18,fontWeight:600,letterSpacing:'-0.01em',marginBottom:8}}>{s.t}</h3>
              <p style={{margin:0,fontSize:14,color:'var(--muted)',lineHeight:1.55}}>{s.d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Testimonials() {
  const D = window.MiraData;
  return (
    <section style={{padding:'96px 0'}}>
      <div className="container">
        <div className="eyebrow" style={{marginBottom:14}}>Ils sont passés par là</div>
        <h2 style={{fontFamily:'var(--font-serif)',fontWeight:500,fontSize:'clamp(28px,3.6vw,42px)',letterSpacing:'-0.02em',margin:0,lineHeight:1.1,marginBottom:48,maxWidth:680}}>
          Des nomades qui ont <span className="serif-i" style={{color:'var(--mira-red)'}}>fait le chemin.</span>
        </h2>
        <div style={{display:'grid',gridTemplateColumns:'repeat(3, 1fr)',gap:24}}>
          {D.testimonials.map((t, i) => (
            <figure key={i} className="card" style={{padding:32,margin:0,display:'flex',flexDirection:'column',gap:20}}>
              <Icon name="star" size={18} strokeWidth={0} style={{color:'var(--gold)'}}/>
              <blockquote style={{margin:0,fontSize:17,lineHeight:1.55,fontFamily:'var(--font-serif)',fontWeight:400,letterSpacing:'-0.01em'}}>
                « {t.quote} »
              </blockquote>
              <figcaption style={{marginTop:'auto',display:'flex',alignItems:'center',gap:12}}>
                <div style={{width:36,height:36,borderRadius:'50%',background:'var(--warm-beige)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,fontWeight:600}}>
                  {t.author[0]}
                </div>
                <div>
                  <div style={{fontSize:13,fontWeight:600}}>{t.author}</div>
                  <div style={{fontSize:12,color:'var(--muted)'}}>📍 {t.city}</div>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTABand() {
  return (
    <section style={{padding:'40px 0 96px'}}>
      <div className="container">
        <div style={{
          background:'var(--charcoal)',color:'#fff',
          borderRadius:32,padding:'72px 56px',
          display:'grid',gridTemplateColumns:'1.4fr auto',gap:48,alignItems:'center',
          position:'relative',overflow:'hidden',
        }}>
          <div>
            <h2 style={{fontFamily:'var(--font-serif)',fontWeight:500,fontSize:'clamp(28px,3.4vw,40px)',letterSpacing:'-0.02em',margin:0,lineHeight:1.1,color:'#fff'}}>
              Prêt à te générer<br/>
              <span className="serif-i" style={{color:'var(--mira-red-hover)'}}>ton parcours sur mesure ?</span>
            </h2>
            <p style={{margin:'20px 0 0',color:'#B6B0A6',fontSize:16,maxWidth:520}}>
              Définis tes skills cibles. Mira AI te propose un parcours qui croise tes objectifs et notre catalogue. ~15 secondes.
            </p>
          </div>
          <div style={{display:'flex',gap:12,alignItems:'center'}}>
            <a href="#/me/path/generate" className="btn btn-primary btn-lg"><Icon name="sparkles" size={16}/> Génère ton parcours</a>
          </div>
          {/* subtle decoration */}
          <div style={{position:'absolute',right:-80,top:-80,width:280,height:280,borderRadius:'50%',background:'radial-gradient(circle, rgba(230,51,42,0.35), transparent 70%)',pointerEvents:'none'}}/>
        </div>
      </div>
    </section>
  );
}

Object.assign(window, { LandingPage });
