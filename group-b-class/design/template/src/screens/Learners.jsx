// Screen: /dashboard/learners — Vue agrégée de tous les apprenants

const ALL_LEARNERS = [
  {
    id: 'enrol-anna-bcn',
    learnerId: 'anna',
    name: 'Anna Lopez',
    variant: 'anna',
    country: 'France',
    countryFlag: '🇫🇷',
    bio: 'Designer en transition vers SaaS',
    classId: 'pitcher-500k',
    classTitle: 'Pitcher pour lever 500k €',
    sessionLabel: 'Session Barcelone',
    status: 'applied',
    time: 'il y a 2 h',
    detail: '« Je veux passer du design à la levée. »',
    motivation: "Je veux passer du design à la levée. Après 6 ans en agence puis lead designer chez un SaaS Series A, je lance mon premier projet et j'ai besoin d'aller chercher du capital. Je sais designer, je sais pas pitcher.",
    skillsTarget: ['Pitch deck', 'Storytelling', 'Levée de fonds'],
    skillsValidated: ['Wireframing', 'Brand systems', 'Figma advanced'],
    customAnswers: [
      { q: "Pourquoi cette class maintenant ?", a: "Je commence à parler avec des fonds dans 8 sem, je veux un narratif solide avant." },
      { q: "Quel est ton projet actuel ?", a: "Plateforme B2B SaaS pour les designers freelance — TAM ~2Md€." },
    ],
  },
  {
    id: 'enrol-pierre-bcn',
    learnerId: 'pierre',
    name: 'Pierre Lambert',
    variant: 'pierre',
    country: 'Belgique',
    countryFlag: '🇧🇪',
    bio: 'Solo founder, levée seed cible Q4',
    classId: 'pitcher-500k',
    classTitle: 'Pitcher pour lever 500k €',
    sessionLabel: 'Session Barcelone',
    status: 'waitlist',
    time: 'il y a 1 j',
    detail: 'capacité atteinte',
    motivation: "Solo founder depuis 18 mois, MRR à 12k€, prêt à lever 800k€ seed.",
    skillsTarget: ['Levée de fonds', 'Term sheets', 'Q&A founder'],
    skillsValidated: ['Sales B2B', 'Growth hacking'],
    customAnswers: [],
  },
  {
    id: 'enrol-nora-bcn',
    learnerId: 'nora',
    name: 'Nora Ahmed',
    variant: 'nora',
    country: 'Maroc',
    countryFlag: '🇲🇦',
    bio: 'Product manager en reconversion',
    classId: 'pitcher-500k',
    classTitle: 'Pitcher pour lever 500k €',
    sessionLabel: 'Session Barcelone',
    status: 'accepted',
    time: 'il y a 12 j',
    detail: 'session démarre dans 7 sem',
    motivation: "PM senior chez un scaleup. Je quitte pour lancer mon SaaS B2C autour de la santé mentale.",
    skillsTarget: ['Storytelling', 'Pitch deck'],
    skillsValidated: ['Product strategy', 'User research', 'Data analytics'],
    customAnswers: [],
  },
  {
    id: 'enrol-marco-uides',
    learnerId: 'marco',
    name: 'Marco Silva',
    variant: '',
    country: 'Portugal',
    countryFlag: '🇵🇹',
    bio: 'Dev fullstack qui veut designer ses propres apps',
    classId: 'ui-design-saas',
    classTitle: 'UI Design pour SaaS B2B',
    sessionLabel: 'Session septembre',
    status: 'accepted',
    time: 'il y a 5 j',
    detail: 'session démarre dans 12 sem',
    motivation: "Je code des SaaS B2B depuis 4 ans mais mes UI sont moyennes. Je veux passer un cap design.",
    skillsTarget: ['UI Design', 'Component systems'],
    skillsValidated: ['React', 'TypeScript', 'Postgres'],
    customAnswers: [],
  },
  {
    id: 'enrol-samuel-lisbon',
    learnerId: 'samuel',
    name: 'Samuel Nguyen',
    variant: '',
    country: 'Vietnam',
    countryFlag: '🇻🇳',
    bio: 'Marketer B2B, ex-growth lead',
    classId: 'growth-b2b',
    classTitle: 'Growth B2B en 8 semaines',
    sessionLabel: 'Session Lisbonne',
    status: 'cancelled',
    time: 'il y a 1 mois',
    detail: 'annulée par l\'apprenant',
    motivation: "Empêchement personnel.",
    skillsTarget: ['Growth B2B'],
    skillsValidated: [],
    customAnswers: [],
  },
  {
    id: 'enrol-hugo-bcn',
    learnerId: 'hugo',
    name: 'Hugo Bernard',
    variant: '',
    country: 'France',
    countryFlag: '🇫🇷',
    bio: 'Indie hacker, premier round',
    classId: 'pitcher-500k',
    classTitle: 'Pitcher pour lever 500k €',
    sessionLabel: 'Session Barcelone',
    status: 'accepted',
    time: 'il y a 14 j',
    detail: 'session démarre dans 7 sem',
    motivation: "Indie depuis 2 ans, MRR 8k€, je veux passer à du capital.",
    skillsTarget: ['Pitch deck', 'Term sheets'],
    skillsValidated: ['Solo building', 'Marketing'],
    customAnswers: [],
  },
];

const Learners = ({ navigate }) => {
  const [statusFilter, setStatusFilter] = React.useState('all');
  const [classFilter, setClassFilter] = React.useState('all');
  const [sortBy, setSortBy] = React.useState('recent');
  const [drawerLearner, setDrawerLearner] = React.useState(null);

  const filtered = ALL_LEARNERS.filter(l => {
    if (statusFilter !== 'all' && l.status !== statusFilter) return false;
    if (classFilter !== 'all' && l.classId !== classFilter) return false;
    return true;
  });
  // sort placeholder: order doesn't really matter for mock; keep as-is
  if (sortBy === 'name') filtered.sort((a, b) => a.name.localeCompare(b.name));

  const hasFilters = statusFilter !== 'all' || classFilter !== 'all';
  const reset = () => {
    setStatusFilter('all');
    setClassFilter('all');
  };

  return (
    <main className="main" data-screen-label="Apprenants (agrégé)">
      <TopBar crumbs={[{ label: 'Apprenants' }]}/>
      <div className="page">
        <header className="page-header">
          <div className="page-header-row">
            <div>
              <h1 className="page-title" style={{fontSize: 28}}>Apprenants</h1>
              <p className="page-subtitle">Tous tes apprenants, toutes classes et sessions confondues.</p>
            </div>
            <div className="row gap-8">
              <Btn variant="secondary" size="sm" icon={<I.Send size={14}/>}>Inviter</Btn>
              <Btn variant="ghost" size="sm" iconRight={<I.ChevronDown size={14}/>}>Exporter CSV</Btn>
            </div>
          </div>
        </header>

        <div className="col gap-12" style={{marginBottom: 16}}>
          <div className="filter-tabs">
            <FilterTab active={statusFilter==='all'}       onClick={() => setStatusFilter('all')} label="Tous" count={ALL_LEARNERS.length}/>
            <FilterTab active={statusFilter==='applied'}   onClick={() => setStatusFilter('applied')} label="Applied"   count={ALL_LEARNERS.filter(l=>l.status==='applied').length}/>
            <FilterTab active={statusFilter==='accepted'}  onClick={() => setStatusFilter('accepted')} label="Accepted"  count={ALL_LEARNERS.filter(l=>l.status==='accepted').length}/>
            <FilterTab active={statusFilter==='waitlist'}  onClick={() => setStatusFilter('waitlist')} label="Waitlist"  count={ALL_LEARNERS.filter(l=>l.status==='waitlist').length}/>
            <FilterTab active={statusFilter==='cancelled'} onClick={() => setStatusFilter('cancelled')} label="Cancelled" count={ALL_LEARNERS.filter(l=>l.status==='cancelled').length}/>
            <FilterTab active={statusFilter==='completed'} onClick={() => setStatusFilter('completed')} label="Completed" count={0}/>
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
            <DropdownFilter
              label="Session"
              value="Toutes les sessions"
              active={false}
              options={[
                { id: 'all', label: 'Toutes les sessions' },
                ...ALL_SESSIONS.filter(s => classFilter === 'all' || s.classId === classFilter)
                  .map(s => ({ id: s.id, label: `${s.city || 'Virtuel'} · ${s.classTitle}` }))
              ]}
              onSelect={() => {}}
            />
            <span style={{fontSize: 12.5, color: 'var(--muted)', marginLeft: 8}}>Tri</span>
            <div className="row gap-4">
              <button
                className="chip"
                onClick={() => setSortBy('recent')}
                style={{
                  cursor: 'pointer',
                  background: sortBy === 'recent' ? 'var(--mira-red)' : 'white',
                  border: `1px solid ${sortBy === 'recent' ? 'var(--mira-red)' : 'var(--rule)'}`,
                  color: sortBy === 'recent' ? 'white' : 'var(--charcoal)',
                  fontWeight: 600,
                }}>Plus récent</button>
              <button
                className="chip"
                onClick={() => setSortBy('oldest')}
                style={{
                  cursor: 'pointer',
                  background: sortBy === 'oldest' ? 'var(--mira-red)' : 'white',
                  border: `1px solid ${sortBy === 'oldest' ? 'var(--mira-red)' : 'var(--rule)'}`,
                  color: sortBy === 'oldest' ? 'white' : 'var(--charcoal)',
                  fontWeight: 600,
                }}>Plus ancien</button>
              <button
                className="chip"
                onClick={() => setSortBy('name')}
                style={{
                  cursor: 'pointer',
                  background: sortBy === 'name' ? 'var(--mira-red)' : 'white',
                  border: `1px solid ${sortBy === 'name' ? 'var(--mira-red)' : 'var(--rule)'}`,
                  color: sortBy === 'name' ? 'white' : 'var(--charcoal)',
                  fontWeight: 600,
                }}>Nom A→Z</button>
            </div>
            {hasFilters && (
              <button className="btn btn-ghost-muted sm" onClick={reset} style={{padding: '0 8px'}}>
                <I.X size={12}/> Reset filters
              </button>
            )}
            <span style={{flex: 1}}/>
            <span style={{fontSize: 12.5, color: 'var(--muted)'}}>
              {filtered.length} inscription{filtered.length > 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon={<I.Users size={28}/>}
            title="Personne ne s'est encore inscrit"
            subtitle={hasFilters ? "Essaie de retirer un filtre." : "Publie ta première session pour ouvrir les inscriptions."}
            cta={hasFilters
              ? <Btn variant="secondary" onClick={reset}>Reset filters</Btn>
              : <Btn variant="primary" onClick={() => navigate('/dashboard/classes')} iconRight={<I.ArrowRight size={14}/>}>Voir mes classes</Btn>
            }
          />
        ) : (
          <div className="card flat">
            {filtered.map(l => (
              <LearnerListRow key={l.id} l={l} onClick={() => setDrawerLearner(l)}/>
            ))}
          </div>
        )}
      </div>

      <Drawer open={!!drawerLearner} onClose={() => setDrawerLearner(null)} wide>
        {drawerLearner && (
          <LearnerDrawer
            l={drawerLearner}
            otherEnrols={ALL_LEARNERS.filter(x => x.learnerId === drawerLearner.learnerId && x.id !== drawerLearner.id)}
            onClose={() => setDrawerLearner(null)}
          />
        )}
      </Drawer>
    </main>
  );
};

const LearnerListRow = ({ l, onClick }) => (
  <div className="hover-row" onClick={onClick} style={{
    display: 'grid',
    gridTemplateColumns: '44px 1fr auto',
    gap: 16,
    padding: '14px 20px',
    alignItems: 'center',
    borderBottom: '1px solid var(--rule)',
    cursor: 'pointer',
    opacity: l.status === 'cancelled' ? 0.6 : 1,
  }}>
    <Avatar name={l.name} size="lg" variant={l.variant}/>

    <div style={{minWidth: 0}}>
      <div className="row gap-8" style={{alignItems: 'center', flexWrap: 'wrap'}}>
        <span style={{fontSize: 14.5, fontWeight: 600}}>{l.name}</span>
        <span style={{fontSize: 13}}>{l.countryFlag}</span>
        <StatusBadge status={l.status}>{l.status}</StatusBadge>
      </div>
      <div className="row gap-6" style={{
        marginTop: 4,
        fontSize: 13,
        color: 'var(--charcoal)',
        fontWeight: 500,
        alignItems: 'center',
        flexWrap: 'wrap',
      }}>
        <I.Grid size={12} style={{color: 'var(--muted)'}}/>
        <span>{l.classTitle}</span>
        <span className="dot-sep" style={{width:3, height:3, borderRadius:99, background:'var(--muted-soft)'}}/>
        <span style={{color: 'var(--muted)'}}>{l.sessionLabel}</span>
      </div>
      <div className="row gap-6" style={{
        marginTop: 4,
        fontSize: 12.5,
        color: 'var(--muted)',
        alignItems: 'center',
      }}>
        <span>{l.time}</span>
        <span className="dot-sep" style={{width:3, height:3, borderRadius:99, background:'var(--muted-soft)'}}/>
        <span style={{fontStyle: l.status === 'applied' ? 'italic' : 'normal', color: l.status === 'applied' ? 'var(--charcoal)' : 'var(--muted)'}}>
          {l.detail}
        </span>
      </div>
    </div>

    <div className="row gap-8" onClick={ev => ev.stopPropagation()}>
      {l.status === 'applied' && (
        <>
          <Btn variant="ghost" size="sm">Refuser</Btn>
          <Btn variant="primary" size="sm" icon={<I.Check size={14}/>}>Accepter</Btn>
        </>
      )}
      {l.status === 'waitlist' && (
        <Btn variant="secondary" size="sm" iconRight={<I.ArrowRight size={14}/>}>Déplacer en active</Btn>
      )}
      {l.status === 'accepted' && (
        <span className="row gap-6" style={{fontSize: 13, color: 'var(--success)', fontWeight: 600}}>
          <I.Check size={14}/> Active
        </span>
      )}
      {l.status === 'cancelled' && (
        <span className="row gap-6" style={{fontSize: 12.5, color: 'var(--muted)'}}>
          <I.X size={12}/> Annulée
        </span>
      )}
      <button className="btn btn-ghost-muted icon sm reveal"><I.MoreH size={14}/></button>
    </div>
  </div>
);

const LearnerDrawer = ({ l, otherEnrols, onClose }) => (
  <>
    <div className="drawer-header" style={{padding: '24px 28px 20px'}}>
      <Avatar name={l.name} size="lg" variant={l.variant}/>
      <div className="drawer-title-block">
        <h2 className="drawer-title" style={{fontFamily: 'var(--font-sans)', fontSize: 22, fontWeight: 600}}>{l.name}</h2>
        <div className="row gap-8" style={{marginTop: 4, fontSize: 13, color: 'var(--muted)'}}>
          <span style={{fontSize: 14}}>{l.countryFlag}</span>
          <span>{l.country}</span>
          <span className="dot-sep" style={{width:3, height:3, borderRadius:99, background:'var(--muted-soft)'}}/>
          <span>{l.bio}</span>
        </div>
      </div>
      <button className="btn btn-ghost-muted icon sm" onClick={onClose}><I.X size={16}/></button>
    </div>

    <div className="drawer-body" style={{padding: '20px 28px'}}>
      <div className="col gap-16">
        {/* Current enrolment */}
        <div className="card" style={{padding: 18, background: 'var(--warm-beige)', border: '1px solid var(--rule)'}}>
          <div className="row between" style={{marginBottom: 10}}>
            <span className="eyebrow">Inscription en cours</span>
            <StatusBadge status={l.status}>{l.status}</StatusBadge>
          </div>
          <div style={{fontWeight: 600, fontSize: 14.5, marginBottom: 4}}>{l.classTitle}</div>
          <div style={{fontSize: 13, color: 'var(--muted)'}}>{l.sessionLabel} · candidature {l.time}</div>
        </div>

        {/* Other enrolments */}
        {otherEnrols.length > 0 && (
          <Card title={`Autres inscriptions (${otherEnrols.length})`} subtitle="Chez toi, sur d'autres classes ou sessions">
            <div className="col gap-8">
              {otherEnrols.map(o => (
                <div key={o.id} className="row gap-8" style={{padding: '10px 12px', borderRadius: 10, background: 'white', border: '1px solid var(--rule)'}}>
                  <div style={{flex: 1, minWidth: 0}}>
                    <div style={{fontSize: 13.5, fontWeight: 600}}>{o.classTitle}</div>
                    <div style={{fontSize: 12, color: 'var(--muted)', marginTop: 2}}>{o.sessionLabel}</div>
                  </div>
                  <StatusBadge status={o.status}>{o.status}</StatusBadge>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Motivation */}
        <Card title="Motivation">
          <div style={{fontSize: 14, lineHeight: 1.6, color: 'var(--charcoal)', fontStyle: 'italic'}}>
            « {l.motivation} »
          </div>
        </Card>

        {/* Skills */}
        <Card title="Skills" subtitle="Cibles déclarées par l'apprenant + skills validées hors de Mira">
          <div className="col gap-12">
            <div>
              <div className="eyebrow" style={{marginBottom: 6}}>Cibles ({l.skillsTarget.length})</div>
              <div className="row gap-6" style={{flexWrap: 'wrap'}}>
                {l.skillsTarget.map((s, i) => <Chip key={s} primary={i === 0}>{s}</Chip>)}
              </div>
            </div>
            {l.skillsValidated.length > 0 && (
              <div>
                <div className="eyebrow" style={{marginBottom: 6}}>Validées</div>
                <div className="row gap-6" style={{flexWrap: 'wrap'}}>
                  {l.skillsValidated.map(s => <Chip key={s}>{s}</Chip>)}
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Custom form answers */}
        {l.customAnswers.length > 0 && (
          <Card title="Réponses au form personnalisé" subtitle="Questions que tu as ajoutées à l'inscription">
            <div className="col gap-12">
              {l.customAnswers.map((qa, i) => (
                <div key={i}>
                  <div style={{fontSize: 12.5, fontWeight: 600, color: 'var(--charcoal)', marginBottom: 4}}>{qa.q}</div>
                  <div style={{fontSize: 13.5, lineHeight: 1.55, color: 'var(--charcoal)'}}>{qa.a}</div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Notes */}
        <Card title="Tes notes" subtitle="Visible uniquement par toi">
          <textarea className="textarea" rows={4} placeholder="Note rapide sur cet apprenant…"/>
        </Card>
      </div>
    </div>

    <div className="drawer-footer">
      {l.status === 'applied' && (
        <>
          <Btn variant="destructive" icon={<I.X size={14}/>}>Refuser</Btn>
          <div className="row gap-8">
            <Btn variant="secondary">Mettre en waitlist</Btn>
            <Btn variant="primary" icon={<I.Check size={14}/>}>Accepter</Btn>
          </div>
        </>
      )}
      {l.status === 'waitlist' && (
        <>
          <Btn variant="ghost-muted" icon={<I.X size={14}/>}>Retirer de la waitlist</Btn>
          <Btn variant="primary" iconRight={<I.ArrowRight size={14}/>}>Déplacer en active</Btn>
        </>
      )}
      {l.status === 'accepted' && (
        <>
          <Btn variant="destructive" icon={<I.X size={14}/>}>Annuler l'inscription</Btn>
          <Btn variant="secondary" icon={<I.Send size={14}/>}>Envoyer un message</Btn>
        </>
      )}
      {l.status === 'cancelled' && (
        <>
          <span style={{fontSize: 12.5, color: 'var(--muted)'}}>Inscription annulée — {l.time}</span>
          <Btn variant="secondary" iconRight={<I.ArrowRight size={14}/>}>Réinscrire</Btn>
        </>
      )}
    </div>
  </>
);

Object.assign(window, { Learners, ALL_LEARNERS });
