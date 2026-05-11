// Screen: /dashboard/sessions — Vue agrégée de toutes les sessions du mentor

const ALL_SESSIONS = [
  {
    id: 'sess-bcn',
    classId: 'pitcher-500k',
    classTitle: 'Pitcher pour lever 500k €',
    city: 'Barcelone', country: 'Espagne', flag: '🇪🇸',
    type: 'hybride',
    dateRange: '5–26 juillet 2026',
    startMonth: 7, year: 2026,
    capacity: 8, enrolled: 3, waitlist: 1,
    price: 80,
    status: 'open_enrolment',
    relTime: 'démarre dans 3 j',
  },
  {
    id: 'sess-ui-virt',
    classId: 'ui-design-saas',
    classTitle: 'UI Design pour SaaS B2B',
    city: null, country: null, flag: '🌐',
    type: 'virtuel',
    dateRange: '1er–29 septembre 2026',
    startMonth: 9, year: 2026,
    capacity: 10, enrolled: 0, waitlist: 0,
    price: 60,
    status: 'planned',
    relTime: 'démarre dans 12 sem',
  },
  {
    id: 'sess-pitch-mars',
    classId: 'pitcher-500k',
    classTitle: 'Pitcher pour lever 500k €',
    city: 'Mexico City', country: 'Mexique', flag: '🇲🇽',
    type: 'hybride',
    dateRange: '5–26 octobre 2026',
    startMonth: 10, year: 2026,
    capacity: 8, enrolled: 8, waitlist: 3,
    price: 80,
    status: 'full',
    relTime: 'démarre dans 18 sem',
  },
  {
    id: 'sess-lisbon',
    classId: 'growth-b2b',
    classTitle: 'Growth B2B en 8 semaines',
    city: 'Lisbonne', country: 'Portugal', flag: '🇵🇹',
    type: 'physique',
    dateRange: 'Mars–mai 2026',
    startMonth: 3, year: 2026,
    capacity: 8, enrolled: 5, waitlist: 0,
    price: 49,
    status: 'completed',
    relTime: 'terminée il y a 3 sem',
  },
];

const SESS_STATUS_LABELS = {
  planned: 'Planned',
  open_enrolment: 'Open enrolment',
  full: 'Full',
  in_progress: 'In progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

const Sessions = ({ navigate }) => {
  const [statusFilter, setStatusFilter] = React.useState('all');
  const [typeFilters, setTypeFilters] = React.useState(new Set());
  const [classFilter, setClassFilter] = React.useState('all');
  const [dateFrom, setDateFrom] = React.useState('');
  const [dateTo, setDateTo] = React.useState('');

  const toggleType = (t) => {
    const next = new Set(typeFilters);
    next.has(t) ? next.delete(t) : next.add(t);
    setTypeFilters(next);
  };

  const filtered = ALL_SESSIONS.filter(s => {
    if (statusFilter !== 'all' && s.status !== statusFilter) return false;
    if (typeFilters.size > 0 && !typeFilters.has(s.type)) return false;
    if (classFilter !== 'all' && s.classId !== classFilter) return false;
    return true;
  });

  const hasFilters = statusFilter !== 'all' || typeFilters.size > 0 || classFilter !== 'all' || dateFrom || dateTo;
  const reset = () => {
    setStatusFilter('all');
    setTypeFilters(new Set());
    setClassFilter('all');
    setDateFrom('');
    setDateTo('');
  };

  return (
    <main className="main" data-screen-label="Sessions (agrégé)">
      <TopBar crumbs={[{ label: 'Sessions' }]}/>
      <div className="page">
        <header className="page-header">
          <div className="page-header-row">
            <div>
              <h1 className="page-title" style={{fontSize: 28}}>Sessions</h1>
              <p className="page-subtitle">Toutes tes sessions, toutes classes confondues.</p>
            </div>
            <Btn variant="primary" size="lg" icon={<I.Plus size={16}/>}>Nouvelle session</Btn>
          </div>
        </header>

        <div className="col gap-12" style={{marginBottom: 16}}>
          <div className="row gap-8" style={{flexWrap: 'wrap', alignItems: 'center'}}>
            <div className="filter-tabs">
              <FilterTab active={statusFilter==='all'}            onClick={() => setStatusFilter('all')} label="Toutes" count={ALL_SESSIONS.length}/>
              <FilterTab active={statusFilter==='planned'}        onClick={() => setStatusFilter('planned')} label="Planned"/>
              <FilterTab active={statusFilter==='open_enrolment'} onClick={() => setStatusFilter('open_enrolment')} label="Open enrolment"/>
              <FilterTab active={statusFilter==='full'}           onClick={() => setStatusFilter('full')} label="Full"/>
              <FilterTab active={statusFilter==='in_progress'}    onClick={() => setStatusFilter('in_progress')} label="In progress"/>
              <FilterTab active={statusFilter==='completed'}      onClick={() => setStatusFilter('completed')} label="Completed"/>
              <FilterTab active={statusFilter==='cancelled'}      onClick={() => setStatusFilter('cancelled')} label="Cancelled"/>
            </div>
          </div>

          <div className="row gap-8" style={{flexWrap: 'wrap', alignItems: 'center'}}>
            <DropdownFilter
              label="Class"
              value={classFilter === 'all' ? 'Toutes les classes' : (CLASSES_DATA.find(c => c.id === classFilter)?.title || classFilter)}
              active={classFilter !== 'all'}
              options={[
                { id: 'all', label: 'Toutes les classes' },
                ...CLASSES_DATA.map(c => ({ id: c.id, label: c.title }))
              ]}
              onSelect={setClassFilter}
            />

            <div className="row gap-4">
              <span style={{fontSize: 12.5, color: 'var(--muted)', marginRight: 4}}>Type</span>
              {['physique', 'virtuel', 'hybride'].map(t => (
                <button key={t}
                  className="chip"
                  onClick={() => toggleType(t)}
                  style={{
                    cursor: 'pointer',
                    background: typeFilters.has(t) ? 'var(--charcoal)' : 'white',
                    border: `1px solid ${typeFilters.has(t) ? 'var(--charcoal)' : 'var(--rule)'}`,
                    color: typeFilters.has(t) ? 'white' : 'var(--charcoal)',
                    fontWeight: 500,
                    textTransform: 'capitalize',
                  }}>
                  {t}
                </button>
              ))}
            </div>

            <div className="row gap-6" style={{
              padding: '4px 4px 4px 10px',
              border: '1px solid var(--rule)',
              background: 'white',
              borderRadius: 10,
              alignItems: 'center',
              height: 34,
            }}>
              <I.Calendar size={13} style={{color: 'var(--muted)'}}/>
              <span style={{fontSize: 12, color: 'var(--muted)'}}>Démarre entre</span>
              <input type="text" placeholder="01/06/2026" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                style={{border: 0, width: 80, fontSize: 12.5, background: 'transparent', outline: 'none'}}/>
              <span style={{fontSize: 12, color: 'var(--muted)'}}>et</span>
              <input type="text" placeholder="31/12/2026" value={dateTo} onChange={e => setDateTo(e.target.value)}
                style={{border: 0, width: 80, fontSize: 12.5, background: 'transparent', outline: 'none'}}/>
            </div>

            {hasFilters && (
              <button className="btn btn-ghost-muted sm" onClick={reset} style={{padding: '0 8px'}}>
                <I.X size={12}/> Reset filters
              </button>
            )}

            <span style={{flex: 1}}/>
            <span style={{fontSize: 12.5, color: 'var(--muted)'}}>
              {filtered.length} session{filtered.length > 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon={<I.Calendar size={28}/>}
            title="Aucune session pour l'instant"
            subtitle={hasFilters ? "Essaie de retirer un filtre." : "Crée ta première session depuis une de tes classes."}
            cta={hasFilters
              ? <Btn variant="secondary" onClick={reset}>Reset filters</Btn>
              : <Btn variant="primary" onClick={() => navigate('/dashboard/classes')} iconRight={<I.ArrowRight size={14}/>}>Voir mes classes</Btn>
            }
          />
        ) : (
          <div className="card flat">
            {filtered.map(s => (
              <SessionListRow key={s.id} s={s} onClick={() => navigate(`/dashboard/classes/${s.classId}?tab=sessions&session=${s.id}`)}/>
            ))}
          </div>
        )}
      </div>
    </main>
  );
};

const SessionListRow = ({ s, onClick }) => {
  const isFull = s.enrolled >= s.capacity;
  const fillRatio = Math.min(s.enrolled / s.capacity, 1);
  const isCompleted = s.status === 'completed';

  return (
    <div className="hover-row" onClick={onClick} style={{
      display: 'grid',
      gridTemplateColumns: '44px 1fr auto',
      gap: 16,
      padding: '16px 20px',
      alignItems: 'center',
      borderBottom: '1px solid var(--rule)',
      cursor: 'pointer',
      opacity: isCompleted ? 0.7 : 1,
    }}>
      <div style={{
        width: 44, height: 44,
        borderRadius: 10,
        background: 'var(--warm-beige)',
        display: 'grid',
        placeItems: 'center',
        fontSize: 20,
      }}>
        {s.flag}
      </div>

      <div style={{minWidth: 0}}>
        <div className="row gap-8" style={{alignItems: 'center', flexWrap: 'wrap'}}>
          <span style={{fontSize: 15, fontWeight: 600, letterSpacing: '-0.005em'}}>
            {s.city ? `${s.city}, ${s.country}` : 'Session virtuelle'}
          </span>
          <StatusBadge status={s.status === 'open_enrolment' ? 'open_enrolment' : s.status === 'completed' ? 'archived' : s.status === 'full' ? 'accepted' : 'draft'}>
            {SESS_STATUS_LABELS[s.status]}
          </StatusBadge>
        </div>
        <div className="row gap-6" style={{
          marginTop: 4,
          fontSize: 13.5,
          color: 'var(--charcoal)',
          fontWeight: 500,
          alignItems: 'center',
        }}>
          <I.Grid size={12} style={{color: 'var(--muted)'}}/>
          {s.classTitle}
        </div>
        <div className="row gap-6" style={{
          marginTop: 4,
          fontSize: 12.5,
          color: 'var(--muted)',
          alignItems: 'center',
          flexWrap: 'wrap',
        }}>
          <span>{s.dateRange}</span>
          <span className="dot-sep" style={{width:3, height:3, borderRadius:99, background:'var(--muted-soft)'}}/>
          <span style={{textTransform: 'capitalize'}}>{s.type}</span>
          <span className="dot-sep" style={{width:3, height:3, borderRadius:99, background:'var(--muted-soft)'}}/>
          <span className="row gap-4">
            <span className="cap-bar" style={{width: 60}}>
              <span className="cap-bar-fill" style={{
                width: `${fillRatio*100}%`,
                background: isFull ? 'var(--gold)' : 'var(--mira-red)',
              }}/>
            </span>
            <span className="tabular" style={{color: 'var(--charcoal)', fontWeight: 600, fontSize: 12.5}}>{s.enrolled}/{s.capacity}</span>
            <span>inscrits</span>
          </span>
          {s.waitlist > 0 && (
            <>
              <span className="dot-sep" style={{width:3, height:3, borderRadius:99, background:'var(--muted-soft)'}}/>
              <span>{s.waitlist} waitlist</span>
            </>
          )}
          <span className="dot-sep" style={{width:3, height:3, borderRadius:99, background:'var(--muted-soft)'}}/>
          <span>{s.price} €/h</span>
          <span className="dot-sep" style={{width:3, height:3, borderRadius:99, background:'var(--muted-soft)'}}/>
          <span style={{color: isCompleted ? 'var(--muted)' : 'var(--charcoal)'}}>{s.relTime}</span>
        </div>
      </div>

      <div className="row gap-4" onClick={ev => ev.stopPropagation()}>
        <Btn variant={isCompleted ? 'ghost' : 'secondary'} size="sm" iconRight={<I.ArrowRight size={14}/>} onClick={onClick}>
          {isCompleted ? 'Voir bilan' : 'Gérer'}
        </Btn>
        <button className="btn btn-ghost-muted icon sm reveal"><I.MoreH size={14}/></button>
      </div>
    </div>
  );
};

// shared atoms (will also be used in Learners)
const DropdownFilter = ({ label, value, options, onSelect, active }) => {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef();
  React.useEffect(() => {
    const close = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);
  return (
    <div ref={ref} style={{position: 'relative'}}>
      <button
        className="row gap-6"
        onClick={() => setOpen(!open)}
        style={{
          height: 34,
          padding: '0 10px',
          background: 'white',
          border: `1px solid ${active ? 'var(--charcoal)' : 'var(--rule)'}`,
          borderRadius: 10,
          fontSize: 12.5,
          fontWeight: 500,
          color: 'var(--charcoal)',
          cursor: 'pointer',
        }}>
        <span style={{color: 'var(--muted)'}}>{label} :</span>
        <span style={{fontWeight: active ? 600 : 500}}>{value}</span>
        <I.ChevronDown size={12} style={{color: 'var(--muted)'}}/>
      </button>
      {open && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 4px)',
          left: 0,
          minWidth: 240,
          background: 'white',
          border: '1px solid var(--rule)',
          borderRadius: 10,
          boxShadow: 'var(--shadow-pop)',
          padding: 4,
          zIndex: 50,
        }}>
          {options.map(o => (
            <button key={o.id}
              onClick={() => { onSelect(o.id); setOpen(false); }}
              style={{
                width: '100%',
                textAlign: 'left',
                padding: '8px 10px',
                borderRadius: 6,
                fontSize: 13,
                background: 'transparent',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--warm-beige)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const EmptyState = ({ icon, title, subtitle, cta }) => (
  <div className="card" style={{padding: '80px 20px', textAlign: 'center'}}>
    <div style={{
      width: 56, height: 56,
      borderRadius: 14,
      background: 'var(--warm-beige)',
      display: 'grid',
      placeItems: 'center',
      color: 'var(--muted)',
      margin: '0 auto 16px',
    }}>{icon}</div>
    <div style={{fontWeight: 600, fontSize: 16, marginBottom: 6}}>{title}</div>
    <p className="page-subtitle" style={{maxWidth: 360, margin: '0 auto 20px'}}>{subtitle}</p>
    {cta}
  </div>
);

Object.assign(window, { Sessions, ALL_SESSIONS, DropdownFilter, EmptyState });
