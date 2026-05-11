// Mira Learn — atoms & shared components
// Avatar, SkillChip, MentorMini, ClassCard, SessionCard, Header, Sidebar, Icon, etc.

const { useState, useEffect, useRef, useMemo } = React;

// --- Icon (inline SVG, Solar/Lucide-style 1.5px stroke) ---
function Icon({ name, size = 18, strokeWidth = 1.6, ...rest }) {
  const props = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth, strokeLinecap: 'round', strokeLinejoin: 'round', ...rest };
  switch (name) {
    case 'arrow-right': return <svg {...props}><path d="M5 12h14M13 5l7 7-7 7"/></svg>;
    case 'arrow-left': return <svg {...props}><path d="M19 12H5M11 5l-7 7 7 7"/></svg>;
    case 'check': return <svg {...props}><path d="M20 6 9 17l-5-5"/></svg>;
    case 'check-circle': return <svg {...props}><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>;
    case 'lock': return <svg {...props}><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>;
    case 'sparkles': return <svg {...props}><path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8"/></svg>;
    case 'star': return <svg {...props} fill="currentColor" stroke="none"><path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.9L12 17.8 5.8 21l1.2-6.9-5-4.9 6.9-1L12 2z"/></svg>;
    case 'star-line': return <svg {...props}><path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.9L12 17.8 5.8 21l1.2-6.9-5-4.9 6.9-1L12 2z"/></svg>;
    case 'map-pin': return <svg {...props}><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/></svg>;
    case 'globe': return <svg {...props}><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20"/></svg>;
    case 'calendar': return <svg {...props}><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>;
    case 'users': return <svg {...props}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
    case 'clock': return <svg {...props}><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>;
    case 'plus': return <svg {...props}><path d="M12 5v14M5 12h14"/></svg>;
    case 'x': return <svg {...props}><path d="M18 6 6 18M6 6l12 12"/></svg>;
    case 'upload': return <svg {...props}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>;
    case 'menu': return <svg {...props}><path d="M3 6h18M3 12h18M3 18h18"/></svg>;
    case 'play': return <svg {...props} fill="currentColor" stroke="none"><path d="M8 5v14l11-7z"/></svg>;
    case 'refresh': return <svg {...props}><path d="M21 12a9 9 0 1 1-3-6.7L21 8M21 3v5h-5"/></svg>;
    case 'pencil': return <svg {...props}><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>;
    case 'eye': return <svg {...props}><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>;
    case 'briefcase': return <svg {...props}><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>;
    case 'graduation': return <svg {...props}><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 1 3 2 6 2s6-1 6-2v-5"/></svg>;
    case 'compass': return <svg {...props}><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" fill="currentColor" stroke="none"/></svg>;
    default: return null;
  }
}

// --- Avatar ---
function Avatar({ src, name, size = 40, ring = false }) {
  const initials = (name || '?').split(' ').map(s => s[0]).join('').slice(0,2).toUpperCase();
  const style = {
    width: size, height: size, borderRadius: '50%',
    background: 'linear-gradient(135deg, #F0B5A6 0%, #E6332A 100%)',
    color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    fontWeight: 600, fontSize: size * 0.36, flexShrink: 0,
    overflow: 'hidden', position: 'relative',
    boxShadow: ring ? '0 0 0 3px #fff, 0 0 0 4px var(--mira-red)' : 'none',
  };
  return (
    <div style={style}>
      {src ? <img src={src} alt={name} style={{width:'100%',height:'100%',objectFit:'cover'}} /> : initials}
    </div>
  );
}

// --- SkillChip ---
function SkillChip({ children, primary, validated, removable, onRemove, onClick, locked }) {
  let cls = 'chip';
  if (primary) cls = 'chip chip-skill';
  else if (validated) cls = 'chip chip-success';
  else if (locked) cls = 'chip chip-outline';
  return (
    <span className={cls} onClick={onClick} style={{cursor: onClick ? 'pointer' : 'default'}}>
      {validated && <Icon name="check" size={12} strokeWidth={2.5} />}
      {children}
      {removable && (
        <button onClick={(e) => { e.stopPropagation(); onRemove && onRemove(); }} style={{background:'none',border:0,padding:0,marginLeft:2,color:'inherit',opacity:0.7,display:'inline-flex'}}>
          <Icon name="x" size={12} strokeWidth={2.5} />
        </button>
      )}
    </span>
  );
}

// --- StarRating ---
function StarRating({ value, reviews, size = 13 }) {
  return (
    <span style={{display:'inline-flex',alignItems:'center',gap:4,fontSize:13,color:'var(--charcoal)'}}>
      <Icon name="star" size={size} strokeWidth={0} style={{color:'var(--gold)'}} />
      <span style={{fontWeight:600}}>{value.toFixed(1)}</span>
      {reviews != null && <span style={{color:'var(--muted)'}}>({reviews})</span>}
    </span>
  );
}

// --- MentorMini ---
function MentorMini({ mentor, size = 28 }) {
  return (
    <span style={{display:'inline-flex',alignItems:'center',gap:8,fontSize:13}}>
      <Avatar src={mentor.avatar} name={mentor.name} size={size} />
      <span style={{fontWeight:500,color:'var(--charcoal)'}}>{mentor.name}</span>
    </span>
  );
}

// --- ClassCard ---
function ClassCard({ klass, onClick, compact }) {
  const D = window.MiraData;
  const mentor = D.mentors[klass.mentor];
  const cardStyle = {
    background: 'var(--card-bg)',
    border: '1px solid var(--rule)',
    borderRadius: 20,
    overflow: 'hidden',
    cursor: 'pointer',
    transition: 'all .35s cubic-bezier(0.16,1,0.3,1)',
    display: 'flex', flexDirection: 'column',
  };
  return (
    <article
      className="mira-class-card"
      style={cardStyle}
      onClick={onClick}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 24px 48px rgba(0,0,0,0.08)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
    >
      <div style={{position:'relative',width:'100%',aspectRatio:'16/9',overflow:'hidden'}} className="img-skel">
        <img src={klass.photo} alt={klass.title} style={{width:'100%',height:'100%',objectFit:'cover',transition:'transform .8s cubic-bezier(0.16,1,0.3,1)'}} />
        <div style={{position:'absolute',top:14,left:14,display:'flex',gap:6}}>
          <span style={{background:'rgba(255,255,255,0.92)',backdropFilter:'blur(8px)',padding:'5px 10px',borderRadius:9999,fontSize:11,fontWeight:600,letterSpacing:0.2}}>
            {klass.format}
          </span>
        </div>
      </div>
      <div style={{padding: compact ? 18 : 22, display:'flex', flexDirection:'column', gap:12, flex:1}}>
        <div>
          <h3 style={{margin:0,fontSize:18,fontWeight:600,lineHeight:1.3,letterSpacing:'-0.01em'}}>{klass.title}</h3>
          {!compact && <p style={{margin:'6px 0 0',fontSize:13,color:'var(--muted)',lineHeight:1.5}}>{klass.subtitle}</p>}
        </div>
        <div style={{display:'flex',alignItems:'center',gap:10,fontSize:13,color:'var(--muted)'}}>
          <MentorMini mentor={mentor} size={24} />
          <span style={{opacity:0.4}}>·</span>
          <StarRating value={klass.rating} reviews={klass.reviews} />
        </div>
        <div style={{display:'flex',alignItems:'center',gap:8,fontSize:12,color:'var(--muted)',flexWrap:'wrap'}}>
          <span style={{display:'inline-flex',alignItems:'center',gap:4}}><Icon name="clock" size={13} /> {klass.duration}</span>
          <span style={{opacity:0.4}}>·</span>
          <span style={{display:'inline-flex',alignItems:'center',gap:4}}><Icon name="users" size={13} /> max {klass.cohortSize}</span>
        </div>
        <div className="chip-row">
          {klass.skills.slice(0,3).map(s => <SkillChip key={s}>{D.skillLabel(s)}</SkillChip>)}
        </div>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginTop:'auto',paddingTop:8}}>
          <div style={{fontSize:22,fontWeight:600,color:'var(--mira-red)',fontFamily:'var(--font-serif)'}}>{klass.price} €</div>
          <span className="arrow-link" style={{color:'var(--charcoal)'}}>
            Découvrir <Icon name="arrow-right" size={14} strokeWidth={2} />
          </span>
        </div>
      </div>
    </article>
  );
}

// --- SessionCard ---
function SessionCard({ session, onApply, classSlug }) {
  const seatsLeft = session.seats - session.enrolled;
  const Icn = session.mode === 'physical' ? 'map-pin' : 'globe';
  return (
    <div className="card" style={{padding:24,display:'flex',flexDirection:'column',gap:14}}>
      <div style={{display:'flex',alignItems:'flex-start',gap:14}}>
        <div style={{width:44,height:44,borderRadius:12,background:'var(--warm-beige)',display:'inline-flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
          <Icon name={Icn} size={20} />
        </div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:16,fontWeight:600,letterSpacing:'-0.01em'}}>{session.location}</div>
          <div style={{fontSize:13,color:'var(--muted)',marginTop:4}}>{session.dates}</div>
        </div>
      </div>
      <div style={{display:'flex',gap:14,fontSize:12,color:'var(--muted)',flexWrap:'wrap'}}>
        <span style={{display:'inline-flex',alignItems:'center',gap:4}}><Icon name="users" size={13} /> {seatsLeft} places dispo · {session.enrolled} inscrits</span>
        {session.waitlist > 0 && (<><span style={{opacity:0.4}}>·</span><span>{session.waitlist} en liste d'attente</span></>)}
      </div>
      <div style={{display:'flex',justifyContent:'flex-end'}}>
        <button className="btn btn-primary btn-sm" onClick={() => window.MiraNav.go(`/classes/${classSlug}/apply?s=${session.id}`)}>
          Postuler <Icon name="arrow-right" size={14} strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}

// --- Header (public + auth) ---
function Header({ mode = 'public' }) {
  const D = window.MiraData;
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const nav = (href, label) => (
    <a href={`#${href}`} style={{fontSize:14,fontWeight:500,color:'var(--charcoal)',padding:'8px 0',position:'relative'}}
       onMouseEnter={e=>e.currentTarget.style.color='var(--mira-red)'}
       onMouseLeave={e=>e.currentTarget.style.color='var(--charcoal)'}
    >{label}</a>
  );

  return (
    <header style={{
      position:'sticky', top:0, zIndex:50,
      background: scrolled ? 'rgba(239,234,229,0.85)' : 'transparent',
      backdropFilter: scrolled ? 'blur(14px)' : 'none',
      borderBottom: scrolled ? '1px solid rgba(0,0,0,0.06)' : '1px solid transparent',
      transition: 'all .3s',
    }}>
      <div className="container" style={{display:'flex',alignItems:'center',height:72,gap:32}}>
        <a href="#/" style={{display:'flex',alignItems:'center',gap:10}}>
          <img src="assets/hmira.svg" alt="" style={{height:24}} />
          <span style={{fontWeight:700,fontSize:17,letterSpacing:'-0.02em'}}>Mira <span className="serif-i" style={{color:'var(--mira-red)'}}>Learn</span></span>
        </a>
        <nav style={{display:'flex',gap:28,marginLeft:8}}>
          {nav('/classes', 'Catalogue')}
          {nav('/classes', 'Mentors')}
          {nav('/community', 'Communauté')}
        </nav>
        <div style={{marginLeft:'auto',display:'flex',gap:10,alignItems:'center'}}>
          {mode === 'public' ? (
            <>
              <a href="#/me" className="btn btn-ghost btn-sm" style={{borderColor:'transparent'}}>Se connecter</a>
              <a href="#/classes" className="btn btn-primary btn-sm">Découvrir les classes</a>
            </>
          ) : (
            <>
              <a href="#/me/path" className="btn btn-ghost btn-sm" style={{borderColor:'transparent'}}><Icon name="sparkles" size={14} /> Mon parcours</a>
              <a href="#/me" style={{display:'flex',alignItems:'center',gap:8}}>
                <Avatar src={D.anna.avatar} name={D.anna.name} size={36} />
              </a>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

// --- AuthSidebar (for /me/*) ---
function AuthSidebar({ current }) {
  const items = [
    { href: '/me', label: 'Mon profil', icon: 'eye' },
    { href: '/me/path', label: 'Mon parcours', icon: 'compass' },
    { href: '/me/enrolments', label: 'Mes inscriptions', icon: 'briefcase' },
    { href: '/me/settings', label: 'Paramètres', icon: 'pencil' },
  ];
  return (
    <aside style={{width:200,flexShrink:0,position:'sticky',top:96,alignSelf:'flex-start'}}>
      <nav style={{display:'flex',flexDirection:'column',gap:2}}>
        {items.map(it => {
          const active = current === it.href || (it.href === '/me/path' && current.startsWith('/me/path'));
          return (
            <a key={it.href} href={`#${it.href}`} style={{
              display:'flex',alignItems:'center',gap:10,
              padding:'10px 14px',borderRadius:10,fontSize:14,fontWeight:500,
              color: active ? 'var(--charcoal)' : 'var(--muted)',
              background: active ? '#fff' : 'transparent',
              border: active ? '1px solid var(--rule)' : '1px solid transparent',
              transition:'all .2s',
            }}
            onMouseEnter={e=>{if(!active){e.currentTarget.style.color='var(--charcoal)';}}}
            onMouseLeave={e=>{if(!active){e.currentTarget.style.color='var(--muted)';}}}
            >
              <Icon name={it.icon} size={16} />
              {it.label}
            </a>
          );
        })}
      </nav>
    </aside>
  );
}

// --- Footer (public) ---
function Footer() {
  return (
    <footer style={{background:'var(--charcoal)',color:'#E3DDD7',marginTop:120}}>
      <div className="container" style={{padding:'72px 32px 36px',display:'grid',gridTemplateColumns:'2fr 1fr 1fr 1fr',gap:48}}>
        <div>
          <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:16}}>
            <img src="assets/hmira.svg" alt="" style={{height:24,filter:'invert(1)'}} />
            <span style={{fontWeight:700,fontSize:17,letterSpacing:'-0.02em'}}>Mira <span className="serif-i" style={{color:'#fff'}}>Learn</span></span>
          </div>
          <p style={{color:'#B6B0A6',maxWidth:320,margin:0,fontSize:14,lineHeight:1.6}}>
            Apprends auprès de mentors qui ont fait le chemin. <span className="serif-i" style={{color:'#E6332A'}}>Pour digital nomades.</span>
          </p>
        </div>
        {[
          { title: 'Produit', links: ['Catalogue', 'Mentors', 'Communauté', 'Devenir mentor'] },
          { title: 'Hello Mira', links: ['À propos', 'Mira Trips', 'Mira Pass', 'Mira Class'] },
          { title: 'Légal', links: ['Mentions', 'Confidentialité', 'CGU', 'Contact'] },
        ].map(col => (
          <div key={col.title}>
            <div className="eyebrow" style={{color:'#B6B0A6',marginBottom:14}}>{col.title}</div>
            <div style={{display:'flex',flexDirection:'column',gap:10}}>
              {col.links.map(l => <a key={l} href="#" style={{color:'#E3DDD7',fontSize:14,opacity:0.85}}>{l}</a>)}
            </div>
          </div>
        ))}
      </div>
      <div className="container" style={{padding:'28px 32px',borderTop:'1px solid rgba(255,255,255,0.08)',display:'flex',justifyContent:'space-between',color:'#B6B0A6',fontSize:13}}>
        <span>© 2026 Hello Mira · Built for nomads, by travelers.</span>
        <span>EN · FR · ES</span>
      </div>
    </footer>
  );
}

Object.assign(window, {
  Icon, Avatar, SkillChip, StarRating, MentorMini, ClassCard, SessionCard,
  Header, AuthSidebar, Footer,
});
