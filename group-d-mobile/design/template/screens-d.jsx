// screens-d.jsx — Communauté (Carte + Feed), Profile updated

// 11. COMMUNAUTÉ ────────────────────────────────────────────────────────────
function ScreenCommunity() {
  const [mode, setMode] = React.useState('map');
  return (
    <div className="screen" style={{ paddingTop: 47 }}>
      <AppBar title="Communauté"/>
      {/* segmented */}
      <div style={{ padding: '0 20px 8px' }}>
        <div style={{
          display: 'flex', background: 'rgba(0,0,0,0.05)',
          borderRadius: 12, padding: 3,
        }}>
          {[
            { id: 'map', label: 'Carte' },
            { id: 'feed', label: 'Feed' },
          ].map(t => (
            <button key={t.id} onClick={() => setMode(t.id)} style={{
              flex: 1, height: 34, border: 0, borderRadius: 9,
              background: mode === t.id ? '#fff' : 'transparent',
              color: mode === t.id ? 'var(--charcoal)' : 'var(--muted)',
              fontFamily: 'inherit', fontSize: 12, fontWeight: 700,
              boxShadow: mode === t.id ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              cursor: 'pointer',
            }}>{t.label}</button>
          ))}
        </div>
      </div>

      <div className="screen-scroll">
        {mode === 'map' ? <CommunityMapView/> : <CommunityFeedView/>}
      </div>

      <BottomNav active="community"/>
    </div>
  );
}

function CommunityMapView() {
  return (
    <div>
      {/* counter */}
      <div style={{ padding: '8px 20px 12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="sonar-dot"/>
          <div>
            <div style={{ fontSize: 17, fontWeight: 700, letterSpacing: '-0.01em' }}>
              15 sessions actives
            </div>
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>Dans le monde, en ce moment.</div>
          </div>
        </div>
      </div>

      {/* map */}
      <div style={{ padding: '0 20px' }}>
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <BigMap/>
        </div>
      </div>

      {/* selected city sheet (Lisbonne) */}
      <div style={{ padding: '16px 20px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          {I.pin('#1D1D1B', 16)}
          <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>Lisbonne, PT</h3>
          <span style={{ fontSize: 12, color: 'var(--muted)' }}>· 4 sessions</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <CityRow title="Pitcher pour lever 500 k €" mentor="Antoine Martin" dates="5–26 juil." spots="2 places" hot/>
          <CityRow title="UI Design pour SaaS B2B" mentor="Marie Dupont" dates="12–30 août" spots="5 places"/>
        </div>
      </div>
      <div style={{ height: 24 }}/>
    </div>
  );
}

function CityRow({ title, mentor, dates, spots, hot }) {
  return (
    <div className="card" style={{ padding: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
      <Avatar initials={mentor.split(' ').map(x => x[0]).join('').slice(0,2)} size={36} variant={hot ? 1 : 2}/>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 700, lineHeight: 1.3 }}>{title}</div>
        <div style={{ fontSize: 12, color: 'var(--muted)' }}>
          {mentor} · {dates} · <b style={{ color: hot ? 'var(--mira-red)' : 'var(--charcoal)' }}>{spots}</b>
        </div>
      </div>
      {I.chevR('#B6B0A6', 16)}
    </div>
  );
}

function BigMap() {
  const cities = [
    { name: 'Lisbonne',   x: 41, y: 50, n: 4, sel: true },
    { name: 'Barcelone',  x: 47, y: 47, n: 3 },
    { name: 'Berlin',     x: 52, y: 35, n: 2 },
    { name: 'Bali',       x: 85, y: 65, n: 4 },
    { name: 'Lima',       x: 22, y: 65, n: 1 },
    { name: 'CDMX',       x: 18, y: 53, n: 1 },
  ];
  return (
    <div style={{
      position: 'relative', height: 280, width: '100%',
      background: 'linear-gradient(180deg, #EFEAE5 0%, #E2DCD3 100%)',
    }}>
      <svg viewBox="0 0 100 60" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.45 }}>
        <path d="M5,28 Q12,16 24,18 Q36,16 44,22 L50,28 L54,26 Q62,16 72,20 L80,28 L74,38 L60,42 Q50,46 40,42 L28,40 L18,36 Z" fill="#1D1D1B"/>
        <path d="M78,38 Q86,32 92,40 T96,52 Q92,56 84,54 T76,46 Z" fill="#1D1D1B"/>
        <path d="M18,46 Q24,42 30,46 T36,52 Q30,56 24,54 Z" fill="#1D1D1B"/>
        <path d="M15,48 Q20,52 22,58 L24,62 L18,60 Q12,56 14,52 Z" fill="#1D1D1B"/>
      </svg>
      {cities.map((c, i) => (
        <div key={i} style={{
          position: 'absolute', left: c.x + '%', top: c.y + '%',
          transform: 'translate(-50%, -50%)',
        }}>
          <div style={{ position: 'relative' }}>
            <span className="sonar-dot" style={c.sel ? { width: 12, height: 12 } : c.n > 2 ? { width: 9, height: 9 } : {}}/>
          </div>
          <div style={{
            position: 'absolute', top: 12, left: 12,
            fontSize: 10, fontWeight: 700, color: 'var(--charcoal)',
            background: c.sel ? 'var(--mira-red)' : 'rgba(255,255,255,0.9)',
            padding: '2px 7px', borderRadius: 6,
            whiteSpace: 'nowrap',
            color: c.sel ? '#fff' : 'var(--charcoal)',
            boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
          }}>{c.name} · {c.n}</div>
        </div>
      ))}
    </div>
  );
}

function CommunityFeedView() {
  const items = [
    { kind: 'skill_validated', icon: '🎯', color: '#16A34A', text: <>Une nomade vient de valider la skill <b>Pitch investor</b></>, loc: 'Portugal', time: 'il y a 6 h' },
    { kind: 'class_completed', icon: '✓',   color: '#D4A853', text: <>Un nomad vient de terminer <b>UI Design pour SaaS B2B</b></>, loc: 'Brésil', time: 'il y a 12 h' },
    { kind: 'session_started', icon: '🚀', color: '#E6332A', text: <>Session démarre à <b>Barcelone</b> : <i>Pitcher pour lever 500 k €</i></>, loc: 'Espagne', time: 'il y a 2 h' },
    { kind: 'skill_validated', icon: '🎯', color: '#16A34A', text: <>Une nomade vient de valider la skill <b>Funding strategy</b></>, loc: 'Bali', time: 'il y a 1 j' },
    { kind: 'note_published', icon: '📝',  color: '#888',    text: <>Un nomad a partagé 4 notes sur <b>Storytelling</b></>, loc: 'Berlin', time: 'il y a 1 j' },
    { kind: 'class_completed', icon: '✓',   color: '#D4A853', text: <>Une nomade vient de terminer <b>Building in public</b></>, loc: 'Lima', time: 'il y a 2 j' },
  ];
  return (
    <div style={{ padding: '8px 20px 20px' }}>
      <p style={{ fontSize: 12, color: 'var(--muted)', margin: '0 0 12px' }}>
        Activité <b>anonymisée</b> de la communauté Mira.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {items.map((it, i) => (
          <div key={i} className="card" style={{ padding: 12, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <div style={{
              width: 36, height: 36, borderRadius: 999,
              background: it.color + '1f',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16, flexShrink: 0,
            }}>{it.icon}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, color: 'var(--charcoal)', lineHeight: 1.5 }}>{it.text}</div>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                {I.pin('#888', 10)} {it.loc} · {it.time}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// 12. PROFILE (updated) ─────────────────────────────────────────────────────
function ScreenProfile() {
  return (
    <div className="screen" style={{ paddingTop: 47 }}>
      <AppBar title="Profil"/>

      <div className="screen-scroll">
        {/* header */}
        <div style={{ padding: '8px 20px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <Avatar initials="AL" size={88}/>
          <h2 style={{ fontSize: 22, fontWeight: 700, margin: '8px 0 0', letterSpacing: '-0.01em' }}>Anna Lopez</h2>
          <p style={{ fontSize: 13, color: 'var(--muted)', margin: 0 }}>
            Designer <span style={{ color: 'var(--mira-red)' }}>↗</span> SaaS
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
            {I.pin('#888', 12)} Lisbonne, PT
          </div>
        </div>

        {/* skills validated */}
        <div className="section-header" style={{ marginTop: 24 }}>
          <h3>Skills validées</h3>
          <span className="caption">1</span>
        </div>
        <div style={{ padding: '0 20px' }}>
          <div className="sage-card" style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 999, background: '#16A34A',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>{I.check('#fff', 18)}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#1B4521' }}>Pitch investor</div>
              <div style={{ fontSize: 11, color: '#4B6B45', fontWeight: 500 }}>Validée à l'instant · QCM 4/5</div>
            </div>
            {I.star('#D4A853', 18)}
          </div>
        </div>

        {/* en cours */}
        <div className="section-header" style={{ marginTop: 20 }}>
          <h3>En cours</h3>
          <span className="caption">1</span>
        </div>
        <div style={{ padding: '0 20px' }}>
          <div className="card" style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <ProgressRing value={30} size={36} stroke={3} color="#888888"/>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--charcoal)' }}>Funding strategy</div>
              <div style={{ fontSize: 11, color: 'var(--muted)' }}>30 % · 1 module restant</div>
            </div>
          </div>
        </div>

        {/* settings */}
        <div className="section-header" style={{ marginTop: 24 }}>
          <h3>Paramètres</h3>
        </div>
        <div style={{ padding: '0 20px' }}>
          <div className="card" style={{ overflow: 'hidden' }}>
            <SettingRow label="Visibilité communauté" value="Public"/>
            <Divider/>
            <SettingRow label="Notifications" value="Activées"/>
            <Divider/>
            <SettingRow label="Langue" value="Français"/>
            <Divider/>
            <SettingRow label="Aide & FAQ" value=""/>
          </div>
        </div>

        {/* footer links */}
        <div style={{ padding: '24px 20px 12px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <button className="btn btn-ghost" style={{ height: 40, fontSize: 13, color: 'var(--mira-red)' }}>
            Mon parcours web {I.arrowR('#E6332A', 16)}
          </button>
          <button className="btn btn-destructive-ghost" style={{ height: 40, fontSize: 13 }}>Déconnexion</button>
        </div>
      </div>

      <BottomNav active="profile"/>
    </div>
  );
}

function SettingRow({ label, value }) {
  return (
    <div style={{ height: 48, padding: '0 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ flex: 1, fontSize: 14, fontWeight: 600, color: 'var(--charcoal)' }}>{label}</div>
      {value && <div style={{ fontSize: 13, color: 'var(--muted)' }}>{value}</div>}
      {I.chevR('#B6B0A6', 16)}
    </div>
  );
}

Object.assign(window, { ScreenCommunity, ScreenProfile });
