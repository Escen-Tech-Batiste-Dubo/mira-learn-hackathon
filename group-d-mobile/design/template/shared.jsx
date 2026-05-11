// shared.jsx — common atoms used across all Mira Learn screens.
// Exports: Icon, AppBar, BottomNav, ProgressRing, Avatar, Chip, Card

// ─── Icons (Lucide outlined, 24px stroke 1.75) ──────────────────────────────
const I = {
  // bottom-nav icons
  programmes: (filled, c) => filled
    ? <svg width="24" height="24" viewBox="0 0 24 24" fill={c} stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5z"/></svg>
    : <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>,
  notebook: (filled, c) => filled
    ? <svg width="24" height="24" viewBox="0 0 24 24" fill={c} stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 3h12a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"/><path d="M4 7h2M4 12h2M4 17h2" stroke="#fff" strokeWidth="1.5"/></svg>
    : <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M6 3h12a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"/><path d="M4 7h2M4 12h2M4 17h2"/></svg>,
  globeNav: (filled, c) => filled
    ? <svg width="24" height="24" viewBox="0 0 24 24" fill={c} stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path stroke="#fff" strokeWidth="1.5" d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></svg>
    : <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></svg>,
  library: (filled, c) => filled
    ? <svg width="24" height="24" viewBox="0 0 24 24" fill={c} stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="6" height="16" rx="1"/><rect x="11" y="4" width="6" height="16" rx="1"/><path d="M19 4l2 16-1 .5"/></svg>
    : <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2zM22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>,
  sparkles: (filled, c) => filled
    ? <svg width="24" height="24" viewBox="0 0 24 24" fill={c} stroke={c} strokeWidth="1.5" strokeLinejoin="round"><path d="M12 3l2 5 5 2-5 2-2 5-2-5-5-2 5-2z"/><path d="M19 14l1 2.5 2.5 1-2.5 1L19 21l-1-2.5L15.5 17.5l2.5-1z"/></svg>
    : <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l2 5 5 2-5 2-2 5-2-5-5-2 5-2z"/><path d="M19 14l1 2.5 2.5 1-2.5 1L19 21l-1-2.5L15.5 17.5l2.5-1z"/></svg>,
  user: (filled, c) => filled
    ? <svg width="24" height="24" viewBox="0 0 24 24" fill={c} stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>
    : <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>,
  // misc
  back: (c='#1D1D1B') => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>,
  search: (c='#1D1D1B') => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>,
  plus: (c='#fff', sz=18) => <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>,
  chevR: (c='#888', sz=16) => <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6"/></svg>,
  check: (c='#fff', sz=14) => <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>,
  star: (c='#D4A853', sz=14) => <svg width={sz} height={sz} viewBox="0 0 24 24" fill={c} stroke={c} strokeWidth="1.5" strokeLinejoin="round"><path d="M12 2l3 7 7 .5-5.5 4.7 1.8 7.1L12 17.5 5.7 21.3 7.5 14.2 2 9.5 9 9z"/></svg>,
  pin: (c='#888', sz=14) => <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s-7-7.5-7-13a7 7 0 0 1 14 0c0 5.5-7 13-7 13z"/><circle cx="12" cy="9" r="2.5"/></svg>,
  arrowR: (c='#1D1D1B', sz=18) => <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>,
  fileText: (c='#888') => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M9 13h6M9 17h4"/></svg>,
  play: (c='#888') => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><rect x="2.5" y="4" width="19" height="16" rx="3"/><path d="M10 9l5 3-5 3z" fill={c}/></svg>,
  download: (c='#1D1D1B', sz=16) => <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v12m0 0l-5-5m5 5l5-5M4 21h16"/></svg>,
  send: (c='#fff', sz=18) => <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l14-7-4 16-4-6-6-3z"/></svg>,
  trophy: (c='#D4A853', sz=18) => <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M6 4h12v4a6 6 0 0 1-12 0zM6 6H3a2 2 0 0 0 0 4h3M18 6h3a2 2 0 0 1 0 4h-3M9 20h6M12 14v6"/></svg>,
  globe: (c='#1D1D1B', sz=18) => <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></svg>,
  bookOpen: (c='#888', sz=18) => <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M2 4h6a4 4 0 0 1 4 4v12a3 3 0 0 0-3-3H2zM22 4h-6a4 4 0 0 0-4 4v12a3 3 0 0 1 3-3h7z"/></svg>,
};

// ─── AppBar ─────────────────────────────────────────────────────────────────
function AppBar({ title, back, right }) {
  return (
    <div className="appbar">
      {back && (
        <button className="appbar-back" onClick={back}>{I.back()}</button>
      )}
      <div className="appbar-title">{title}</div>
      {right}
    </div>
  );
}

// ─── BottomNav ──────────────────────────────────────────────────────────────
function BottomNav({ active = 'programmes', onChange }) {
  const tabs = [
    { id: 'programmes', label: 'Programmes', render: I.programmes },
    { id: 'notes',      label: 'Notes',      render: I.notebook },
    { id: 'community',  label: 'Communauté', render: I.globeNav },
    { id: 'profile',    label: 'Profil',     render: I.user },
  ];
  return (
    <div className="bottom-nav">
      {tabs.map(t => {
        const isActive = t.id === active;
        const color = isActive ? '#E6332A' : '#888888';
        return (
          <button
            key={t.id}
            className={'bn-tab' + (isActive ? ' active' : '')}
            onClick={() => onChange && onChange(t.id)}
          >
            <span className="bn-icon" style={{ color }}>{t.render(isActive, color)}</span>
            <span className="bn-label">{t.label}</span>
          </button>
        );
      })}
    </div>
  );
}

// ─── ProgressRing ───────────────────────────────────────────────────────────
function ProgressRing({ value = 0, size = 28, stroke = 3, color = '#E6332A', track = 'rgba(0,0,0,0.08)', children }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const off = c * (1 - value / 100);
  return (
    <div className="ring-wrap" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={track} strokeWidth={stroke}/>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
                strokeDasharray={c} strokeDashoffset={off} strokeLinecap="round"/>
      </svg>
      {children && (
        <div style={{
          position:'absolute', inset:0, display:'flex',
          alignItems:'center', justifyContent:'center',
          fontSize: 10, fontWeight: 700, color: '#1D1D1B',
        }}>{children}</div>
      )}
    </div>
  );
}

// ─── Avatar (warm gradient, initials) ───────────────────────────────────────
function Avatar({ initials, size = 40, variant = 1 }) {
  const cls = 'avatar-warm' + (variant === 2 ? ' avatar-warm-2' : '');
  return (
    <div className={cls} style={{
      width: size, height: size,
      fontSize: size * 0.36,
    }}>{initials}</div>
  );
}

Object.assign(window, { I, AppBar, BottomNav, ProgressRing, Avatar });
