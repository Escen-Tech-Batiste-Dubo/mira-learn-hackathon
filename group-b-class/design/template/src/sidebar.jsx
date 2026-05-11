// Sidebar — persistent navigation

const Sidebar = ({ route, navigate }) => {
  const isActive = (path) => route === path || route.startsWith(path + '/') || route.startsWith(path + '?');
  const items = [
    { path: '/dashboard',            label: "Vue d'ensemble", icon: <I.Home size={16}/>, kbd: 'G H' },
    { path: '/dashboard/classes',    label: "Mes classes",    icon: <I.Grid size={16}/>, count: 3 },
    { path: '/dashboard/sessions',   label: "Sessions",       icon: <I.Calendar size={16}/>, count: 4 },
    { path: '/dashboard/learners',   label: "Apprenants",     icon: <I.Users size={16}/>, count: 6 },
    { path: '/dashboard/quizzes',    label: "QCM",            icon: <I.Quiz size={16}/>, count: 5 },
  ];
  return (
    <aside className="sidebar" data-screen-label="Sidebar">
      <div className="sb-brand">
        <div className="sb-brand-logo" aria-hidden="true">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <rect x="2" y="2" width="20" height="20" rx="6" fill="#1D1D1B"/>
            <path d="M6 17V8.5l3 4.2L12 8.5V17M14 8.5h4l-2 3 2.2 5.5h-4.4z" stroke="#fff" strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round"/>
          </svg>
        </div>
        <span className="sb-brand-wordmark">Mira</span>
        <span className="sb-brand-tag">LEARN</span>
      </div>

      <nav className="sb-section">
        {items.map(it => (
          <a key={it.path}
            className={`sb-item ${isActive(it.path) ? 'is-active' : ''}`}
            onClick={() => navigate(it.path)}>
            <span className="sb-icon">{it.icon}</span>
            <span>{it.label}</span>
            {it.count != null && <span className="sb-count">{it.count}</span>}
          </a>
        ))}
      </nav>

      <nav className="sb-section">
        <a className={`sb-item ${route === '/dashboard/profile' ? 'is-active' : ''}`}
          onClick={() => navigate('/dashboard/profile')}>
          <span className="sb-icon"><I.Settings size={16}/></span>
          <span>Mon profil</span>
        </a>
        <a className="sb-item">
          <span className="sb-icon"><I.Quiz size={16}/></span>
          <span>Aide</span>
        </a>
      </nav>

      <div className="sb-footer">
        <div className="sb-user">
          <Avatar name="Antoine Martin" size="md"/>
          <div style={{flex: 1, minWidth: 0}}>
            <div className="sb-user-name text-ellipsis">Antoine Martin</div>
            <div className="sb-user-role">Mira Mentor</div>
          </div>
          <I.ChevronUp size={14} style={{color: 'var(--muted)'}}/>
        </div>
      </div>
    </aside>
  );
};

const TopBar = ({ crumbs, right }) => (
  <div className="topbar">
    <div className="crumb">
      {crumbs.map((c, i) => (
        <React.Fragment key={i}>
          {i > 0 && <span className="sep"><I.ChevronRight size={12}/></span>}
          {c.onClick && i < crumbs.length - 1
            ? <a onClick={c.onClick} style={{cursor:'pointer'}}>{c.label}</a>
            : <span className={i === crumbs.length - 1 ? 'current' : ''}>{c.label}</span>}
        </React.Fragment>
      ))}
    </div>
    {right}
    <button className="search">
      <I.Search size={14}/>
      <span>Rechercher…</span>
      <kbd>⌘K</kbd>
    </button>
    <button className="btn btn-ghost icon sm" title="Notifications">
      <I.Bell size={16}/>
    </button>
  </div>
);

Object.assign(window, { Sidebar, TopBar });
