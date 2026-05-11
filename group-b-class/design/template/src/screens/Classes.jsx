// Screen 2: /dashboard/classes — Liste des classes

const CLASSES_DATA = [
  {
    id: 'pitcher-500k',
    title: 'Pitcher pour lever 500k €',
    status: 'published',
    meta: '6 sem · live hybride · 80 €/h · 2 modules · 1 session',
    body: '3 apprenants inscrits · 1 en waitlist',
    cta: 'Éditer',
  },
  {
    id: 'ui-design-saas',
    title: 'UI Design pour SaaS B2B',
    status: 'draft',
    meta: 'Pas encore configurée — 0 module · 0 session',
    body: null,
    cta: 'Continuer la configuration',
  },
  {
    id: 'growth-b2b',
    title: 'Growth B2B en 8 semaines',
    status: 'in_review',
    meta: 'Soumise il y a 2 j à l\'admin · 8 modules · 2 sessions',
    body: 'En cours de relecture par Marc T. (admin)',
    cta: 'Voir',
  }
];

const STATUS_LABELS = {
  draft: 'Draft',
  in_review: 'In review',
  published: 'Published',
  archived: 'Archived',
};

const Classes = ({ navigate }) => {
  const [filter, setFilter] = React.useState('all');
  const counts = {
    all: CLASSES_DATA.length,
    draft: CLASSES_DATA.filter(c => c.status === 'draft').length,
    in_review: CLASSES_DATA.filter(c => c.status === 'in_review').length,
    published: CLASSES_DATA.filter(c => c.status === 'published').length,
    archived: 0,
  };
  const filtered = filter === 'all' ? CLASSES_DATA : CLASSES_DATA.filter(c => c.status === filter);
  return (
    <main className="main" data-screen-label="02 Classes">
      <TopBar crumbs={[
        { label: "Vue d'ensemble", onClick: () => navigate('/dashboard') },
        { label: 'Mes classes' }
      ]}/>
      <div className="page">
        <header className="page-header">
          <div className="page-header-row">
            <div>
              <h1 className="page-title" style={{fontSize: 28}}>Mes classes</h1>
              <p className="page-subtitle">Crée, structure et publie tes Mira Classes.</p>
            </div>
            <Btn variant="primary" size="lg" icon={<I.Plus size={16}/>}>Créer une class</Btn>
          </div>
        </header>

        <div className="row between" style={{marginBottom: 16}}>
          <div className="filter-tabs">
            <FilterTab active={filter==='all'} onClick={() => setFilter('all')} label="Tous" count={counts.all}/>
            <FilterTab active={filter==='draft'} onClick={() => setFilter('draft')} label="Draft" count={counts.draft}/>
            <FilterTab active={filter==='in_review'} onClick={() => setFilter('in_review')} label="In review" count={counts.in_review}/>
            <FilterTab active={filter==='published'} onClick={() => setFilter('published')} label="Published" count={counts.published}/>
            <FilterTab active={filter==='archived'} onClick={() => setFilter('archived')} label="Archived" count={counts.archived}/>
          </div>
          <div className="row gap-8">
            <Btn variant="ghost" size="sm" icon={<I.Filter size={14}/>}>Filtrer</Btn>
            <Btn variant="ghost" size="sm" iconRight={<I.ChevronDown size={14}/>}>Tri : récent</Btn>
          </div>
        </div>

        <div className="col gap-8">
          {filtered.map(c => (
            <ClassRow key={c.id} c={c} onClick={() => navigate(`/dashboard/classes/${c.id}`)}/>
          ))}
          {filtered.length === 0 && (
            <div className="card" style={{textAlign: 'center', padding: '60px 20px'}}>
              <I.Archive size={32} style={{color: 'var(--muted-soft)', margin: '0 auto 12px'}}/>
              <div style={{fontWeight: 600, marginBottom: 4}}>Aucune class dans cet état.</div>
              <p className="page-subtitle" style={{margin: 0}}>Crée ta première class pour commencer.</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
};

const ClassRow = ({ c, onClick }) => (
  <div className="class-row hover-row" onClick={onClick}>
    <div>
      <div className="row gap-8" style={{alignItems: 'center'}}>
        <h3 className="class-row-title">{c.title}</h3>
        <StatusBadge status={c.status}>{STATUS_LABELS[c.status]}</StatusBadge>
        {c.status === 'published' && (
          <span className="row gap-4" style={{fontSize: 12, color: 'var(--muted)', marginLeft: 4}}>
            <I.Star size={12} style={{color: 'var(--gold)'}}/>
            Flagship
          </span>
        )}
      </div>
      <div className="class-row-meta">
        <span>{c.meta}</span>
      </div>
      {c.body && (
        <div className="class-row-meta" style={{ marginTop: 6, color: 'var(--charcoal)' }}>
          {c.body}
        </div>
      )}
    </div>
    <div className="row gap-8">
      <button className="btn btn-ghost-muted icon sm reveal" title="Plus">
        <I.MoreH size={16}/>
      </button>
      <Btn variant={c.status === 'draft' ? 'primary' : 'secondary'} size="sm" iconRight={<I.ArrowRight size={14}/>}>
        {c.cta}
      </Btn>
    </div>
  </div>
);

window.Classes = Classes;
window.CLASSES_DATA = CLASSES_DATA;
