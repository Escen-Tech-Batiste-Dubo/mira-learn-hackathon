// Screen 3-6: /dashboard/classes/{id} — Tabs: Overview, Modules, Sessions, Enrolments

const SAMPLE_CLASS = {
  id: 'pitcher-500k',
  title: 'Pitcher pour lever 500k €',
  status: 'published',
  description: "Apprends à construire un pitch deck investor-ready en 6 semaines, depuis le narratif jusqu'à la délivrance live. Hybride entre théorie et practice : tu pitcheras à des founders qui ont déjà levé.",
  format: 'hybride',
  rythme: 'biweekly',
  hours_collective: 18,
  hours_individual: 6,
  price_collective: 80,
  price_individual: 140,
  skills_primary: 'Pitch & storytelling',
  skills: ['Narratif investor', 'Slide design', 'Délivery', 'Q&A founder', 'Term sheets'],
  created: 'il y a 14 jours',
  enrolled: 3,
  waitlist: 1,
};

const MODULES = [
  { n: 1, title: 'Construire le narratif investor',
    desc: 'Définir le problème, la vision, la traction. Travailler la promesse en une phrase.',
    hours: 3, type: 'théorie', status: 'published', quizzes: 1, resources: 4 },
  { n: 2, title: 'Design + délivery du deck',
    desc: 'Mettre en page chaque slide, travailler le rythme, gérer la Q&A live avec un fund.',
    hours: 4, type: 'practice', status: 'published', quizzes: 0, resources: 2 },
];

const SESSIONS = [
  {
    id: 's1', city: 'Barcelone', country: 'Espagne', flag: '🇪🇸',
    type: 'hybride', start: '5', end: '26 juillet 2026',
    capacity: 8, enrolled: 3, waitlist: 1, status: 'open_enrolment',
    venue: 'Coliving El Born · Carrer del Comerç 12',
    provider: 'Zoom (sessions à distance)',
  }
];

const ENROLMENTS = [
  { id: 'e1', name: 'Anna Lopez',     bio: 'Designer en transition vers SaaS',     quote: 'Je veux passer du design à la levée.', status: 'applied',  time: 'il y a 2 h',  variant: 'anna'  },
  { id: 'e2', name: 'Pierre Lambert', bio: 'Solo founder, levée seed cible Q4',    quote: null,                                       status: 'waitlist', time: 'il y a 1 j',  variant: 'pierre'},
  { id: 'e3', name: 'Nora Ahmed',     bio: 'Product manager en reconversion',      quote: null,                                       status: 'accepted', time: 'il y a 12 j', variant: 'nora'  },
  { id: 'e4', name: 'Hugo Bernard',   bio: 'Indie hacker, premier round',          quote: null,                                       status: 'accepted', time: 'il y a 14 j', variant: ''      },
];

const ClassEdit = ({ classId, tab, navigate, setTab }) => {
  const c = SAMPLE_CLASS;
  return (
    <main className="main" data-screen-label={`03–06 Class · ${tab}`}>
      <TopBar
        crumbs={[
          { label: "Mes classes", onClick: () => navigate('/dashboard/classes') },
          { label: c.title }
        ]}
      />
      <div className="page">
        <header className="page-header">
          <div className="page-header-row">
            <div>
              <div className="row gap-8" style={{ alignItems: 'center', marginBottom: 6 }}>
                <button className="btn btn-ghost-muted sm" onClick={() => navigate('/dashboard/classes')} style={{padding: '0 6px'}}>
                  <I.ArrowLeft size={14}/> Mes classes
                </button>
              </div>
              <div className="row gap-12" style={{alignItems: 'center'}}>
                <h1 className="page-title" style={{fontSize: 28}}>{c.title}</h1>
                <StatusBadge status={c.status}>{STATUS_LABELS[c.status]}</StatusBadge>
              </div>
              <p className="page-subtitle">Créée {c.created} · {c.enrolled} apprenants inscrits · {c.waitlist} waitlist</p>
            </div>
            <div className="row gap-8">
              <Btn variant="ghost" size="sm" icon={<I.Eye size={14}/>}>Aperçu apprenant</Btn>
              <Btn variant="secondary" size="sm" icon={<I.Send size={14}/>}>Partager le lien</Btn>
              <Btn variant="ghost" icon={<I.MoreH size={16}/>} size="sm" style={{padding: '0 8px'}}/>
            </div>
          </div>
        </header>

        <div className="tabs">
          <Tab active={tab === 'overview'}  onClick={() => setTab('overview')}>Vue d'ensemble</Tab>
          <Tab active={tab === 'modules'}   onClick={() => setTab('modules')}   count={MODULES.length}>Modules</Tab>
          <Tab active={tab === 'sessions'}  onClick={() => setTab('sessions')}  count={SESSIONS.length}>Sessions</Tab>
          <Tab active={tab === 'enrolments'} onClick={() => setTab('enrolments')} count={`${ENROLMENTS.filter(e=>e.status!=='waitlist').length} + ${ENROLMENTS.filter(e=>e.status==='waitlist').length} wait`}>Apprenants</Tab>
        </div>

        {tab === 'overview' && <OverviewTab c={c}/>}
        {tab === 'modules' && <ModulesTab navigate={navigate} classId={classId}/>}
        {tab === 'sessions' && <SessionsTab/>}
        {tab === 'enrolments' && <EnrolmentsTab/>}
      </div>
      <AutosaveToast/>
    </main>
  );
};

// ---- TAB 1: Overview / Edit details ----
const OverviewTab = ({ c }) => {
  const [title, setTitle] = React.useState(c.title);
  const [desc, setDesc] = React.useState(c.description);
  const [format, setFormat] = React.useState(c.format);
  const [rythme, setRythme] = React.useState(c.rythme);
  const [hoursColl, setHoursColl] = React.useState(c.hours_collective);
  const [hoursInd, setHoursInd] = React.useState(c.hours_individual);
  const [priceColl, setPriceColl] = React.useState(c.price_collective);
  const [priceInd, setPriceInd] = React.useState(c.price_individual);

  const revenueColl = priceColl * hoursColl * c.enrolled;
  const revenueInd = priceInd * hoursInd * c.enrolled;
  const brut = revenueColl + revenueInd;
  const fees = Math.round(brut * 0.25);
  const net = brut - fees;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 16, alignItems: 'flex-start' }}>
      <div className="col gap-16">
        <Card title="Détails de la class" subtitle="Édition inline · sauvegarde auto">
          <Field label="Titre">
            <input className="input" value={title} onChange={e => setTitle(e.target.value)}/>
          </Field>
          <Field label="Description" hint="markdown supporté">
            <textarea className="textarea" rows={4} value={desc} onChange={e => setDesc(e.target.value)}/>
          </Field>
          <div className="field-row cols-2">
            <Field label="Format envisagé">
              <Segmented
                value={format}
                onChange={setFormat}
                options={[
                  { value: 'physique', label: 'Physique' },
                  { value: 'virtuel', label: 'Virtuel' },
                  { value: 'hybride', label: 'Hybride' },
                ]}
              />
            </Field>
            <Field label="Rythme">
              <Segmented
                value={rythme}
                onChange={setRythme}
                options={[
                  { value: 'weekly',    label: 'Hebdo' },
                  { value: 'biweekly',  label: 'Bi-mensuel' },
                  { value: 'monthly_workshop', label: 'Mensuel' },
                  { value: 'intensive_weekend', label: 'WE intensif' },
                  { value: 'async',     label: 'Async' },
                ]}
              />
            </Field>
          </div>

          <Field label="Skills enseignées" hint="1 primaire en sage · clique pour ajouter">
            <div className="row gap-6" style={{flexWrap: 'wrap'}}>
              <Chip primary removable>{c.skills_primary}</Chip>
              {c.skills.map(s => <Chip key={s} removable>{s}</Chip>)}
              <button className="chip" style={{borderStyle:'dashed', background: 'transparent', border: '1px dashed var(--rule-strong)', color: 'var(--muted)'}}>
                <I.Plus size={11}/> Ajouter
              </button>
            </div>
          </Field>

          <div className="field-row cols-2">
            <Field label="Heures collectives" hint="par cohorte">
              <input type="number" className="input" value={hoursColl} onChange={e => setHoursColl(+e.target.value)}/>
            </Field>
            <Field label="Heures individuelles" hint="par apprenant">
              <input type="number" className="input" value={hoursInd} onChange={e => setHoursInd(+e.target.value)}/>
            </Field>
          </div>
        </Card>

        <Card title="Pricing" subtitle="Tarifs en € HT · simulation revenu live">
          <div className="field-row cols-2">
            <Field label="Tarif heure collective">
              <div className="input input-prefix-wrap">
                <span className="input-prefix">€</span>
                <input className="input-bare" type="number" value={priceColl} onChange={e => setPriceColl(+e.target.value)}/>
                <span style={{padding: '0 12px', color: 'var(--muted)', fontSize: 12}}>/ h</span>
              </div>
            </Field>
            <Field label="Tarif heure individuelle">
              <div className="input input-prefix-wrap">
                <span className="input-prefix">€</span>
                <input className="input-bare" type="number" value={priceInd} onChange={e => setPriceInd(+e.target.value)}/>
                <span style={{padding: '0 12px', color: 'var(--muted)', fontSize: 12}}>/ h</span>
              </div>
            </Field>
          </div>

          <div className="card" style={{ background: 'var(--sage-soft)', border: '1px solid rgba(45, 90, 42, 0.15)', padding: '16px 18px', marginTop: 8 }}>
            <div className="eyebrow" style={{color: '#2D5A2A'}}>Simulation revenu — {c.enrolled} apprenants</div>
            <div className="col gap-6" style={{marginTop: 10}}>
              <RevenueLine label={`Collectif · ${hoursColl} h × ${priceColl} € × ${c.enrolled}`} value={revenueColl}/>
              <RevenueLine label={`Individuel · ${hoursInd} h × ${priceInd} € × ${c.enrolled}`} value={revenueInd}/>
              <div style={{height: 1, background: 'rgba(45,90,42,0.15)', margin: '4px 0'}}/>
              <RevenueLine label="Revenu brut" value={brut} bold/>
              <RevenueLine label="Frais plateforme (25 %)" value={-fees} muted/>
              <RevenueLine label="Net mentor" value={net} large/>
            </div>
          </div>
        </Card>
      </div>

      <div className="col gap-16">
        <Card title="Statut" subtitle="Cycle de validation admin">
          <div className="col gap-12">
            <div className="row gap-8">
              <StatusBadge status="published">Published</StatusBadge>
              <span style={{fontSize: 12.5, color: 'var(--muted)'}}>visible au catalogue</span>
            </div>
            <div className="col gap-6">
              <div className="row gap-8" style={{fontSize: 12.5}}>
                <span className="tl-dot success" style={{outline: 'none'}}></span>
                <span style={{color:'var(--muted)'}}>Validée par admin · il y a 12 j</span>
              </div>
              <div className="row gap-8" style={{fontSize: 12.5}}>
                <span className="tl-dot" style={{outline: 'none', background: 'var(--muted-soft)'}}></span>
                <span style={{color:'var(--muted)'}}>Soumise il y a 14 j</span>
              </div>
            </div>
          </div>
        </Card>

        <Card title="Actions">
          <div className="col gap-8">
            <Btn variant="secondary" icon={<I.Pause size={14}/>}>Mettre en pause</Btn>
            <Btn variant="secondary" icon={<I.Eye size={14}/>}>Voir la fiche publique</Btn>
            <div className="divider" style={{margin: '4px 0'}}/>
            <Btn variant="destructive" icon={<I.Archive size={14}/>}>Archiver la class</Btn>
          </div>
        </Card>

        <Card title="Raccourcis" padding>
          <div className="col gap-4">
            <KbdShortcut label="Sauvegarder" keys={['⌘', 'S']}/>
            <KbdShortcut label="Aperçu apprenant" keys={['⌘', 'P']}/>
            <KbdShortcut label="Nouveau module" keys={['M']}/>
            <KbdShortcut label="Nouvelle session" keys={['S']}/>
          </div>
        </Card>
      </div>
    </div>
  );
};

const RevenueLine = ({ label, value, bold, muted, large }) => (
  <div className="row between">
    <span style={{fontSize: 13, color: muted ? 'var(--muted)' : '#2D5A2A', fontWeight: bold || large ? 600 : 500}}>{label}</span>
    <span className="tabular" style={{
      fontSize: large ? 18 : 13.5,
      fontWeight: bold || large ? 700 : 500,
      color: muted ? 'var(--muted)' : '#1a3d18',
      letterSpacing: '-0.01em'
    }}>
      {value < 0 ? '−' : ''}{Math.abs(value).toLocaleString('fr-FR')} €
    </span>
  </div>
);

const KbdShortcut = ({ label, keys }) => (
  <div className="row between" style={{padding: '4px 0', fontSize: 12.5}}>
    <span style={{color: 'var(--muted)'}}>{label}</span>
    <span className="row gap-4">
      {keys.map((k, i) => <kbd key={i} className="kbd-hint">{k}</kbd>)}
    </span>
  </div>
);

// ---- TAB 2: Modules (drag/drop) ----
const ModulesTab = ({ navigate, classId }) => {
  const [open, setOpen] = React.useState(null);
  return (
    <div className="col gap-16" style={{maxWidth: 900}}>
      <Card title="Modules de la class" subtitle="Glisse les modules pour réordonner · clique pour éditer en place" padding>
        <div>
          {MODULES.map(m => (
            <ModuleRow key={m.n} m={m} open={open === m.n}
              onOpen={() => setOpen(open === m.n ? null : m.n)}
              onOpenQuiz={() => navigate(`/dashboard/quizzes/quiz-${m.n}`)}/>
          ))}
          <div style={{ padding: 16, borderTop: '1px solid var(--rule)' }}>
            <Btn variant="secondary" icon={<I.Plus size={14}/>}>Nouveau module</Btn>
            <span style={{fontSize:12, color:'var(--muted)', marginLeft: 12}}>ou appuie sur <kbd className="kbd-hint">M</kbd></span>
          </div>
        </div>
      </Card>

      <Card title="Matériel partagé" subtitle="Ressources accessibles aux apprenants de toutes les sessions">
        <div className="col gap-8">
          <ResourceRow icon={<I.File size={14}/>} name="Template deck investor.pdf" meta="2.4 MB · ajouté il y a 7 j"/>
          <ResourceRow icon={<I.File size={14}/>} name="Checklist due diligence.md" meta="ajouté il y a 14 j"/>
          <Btn variant="ghost" size="sm" icon={<I.Plus size={14}/>}>Ajouter un fichier</Btn>
        </div>
      </Card>
    </div>
  );
};

const ModuleRow = ({ m, open, onOpen, onOpenQuiz }) => (
  <div className={`hover-row ${open ? 'is-open' : ''}`} style={{borderBottom: '1px solid var(--rule)'}}>
    <div className="module-row" onClick={onOpen} style={{cursor: 'pointer'}}>
      <span className="drag-handle" onClick={e => e.stopPropagation()}><I.Drag size={16}/></span>
      <div style={{minWidth: 0}}>
        <div className="row gap-8" style={{alignItems: 'baseline'}}>
          <span className="module-num">{m.n}</span>
          <span className="module-title">{m.title}</span>
        </div>
        <div className="module-meta">
          <span>{m.hours} h</span>
          <span className="dot-sep"/>
          <span>{m.type}</span>
          <span className="dot-sep"/>
          <StatusBadge status={m.status}>{STATUS_LABELS[m.status]}</StatusBadge>
          <span className="dot-sep"/>
          <span>{m.quizzes} quiz · {m.resources} ressources</span>
        </div>
      </div>
      <div className="row gap-4 reveal" onClick={e => e.stopPropagation()}>
        <Btn variant="ghost" size="sm" onClick={onOpenQuiz} icon={<I.Quiz size={14}/>}>Quiz</Btn>
        <Btn variant="ghost" size="sm" icon={<I.File size={14}/>}>Matériel</Btn>
        <button className="btn btn-ghost-muted icon sm"><I.MoreH size={14}/></button>
      </div>
    </div>
    {open && (
      <div style={{ background: 'rgba(0,0,0,0.012)', padding: '18px 60px 22px', borderTop: '1px solid var(--rule)' }}>
        <div className="col gap-16">
          <Field label="Description"><textarea className="textarea" rows={3} defaultValue={m.desc}/></Field>
          <div className="field-row cols-3" style={{marginBottom: 0}}>
            <Field label="Durée">
              <div className="input input-prefix-wrap">
                <input className="input-bare" type="number" defaultValue={m.hours}/>
                <span style={{padding: '0 12px', color: 'var(--muted)', fontSize: 12}}>heures</span>
              </div>
            </Field>
            <Field label="Type">
              <Segmented
                value={m.type}
                onChange={() => {}}
                options={[
                  { value: 'théorie', label: 'Théorie' },
                  { value: 'practice', label: 'Practice' },
                ]}
              />
            </Field>
            <Field label="Statut">
              <Segmented
                value={m.status}
                onChange={() => {}}
                options={[
                  { value: 'draft', label: 'Draft' },
                  { value: 'published', label: 'Publié' },
                ]}
              />
            </Field>
          </div>
        </div>
      </div>
    )}
  </div>
);

const ResourceRow = ({ icon, name, meta }) => (
  <div className="row gap-12 hover-row" style={{padding: '10px 12px', borderRadius: 10, border: '1px solid var(--rule)', background: 'white'}}>
    <span style={{color: 'var(--muted)'}}>{icon}</span>
    <div style={{flex: 1}}>
      <div style={{fontSize: 13.5, fontWeight: 500}}>{name}</div>
      <div style={{fontSize: 12, color: 'var(--muted)', marginTop: 2}}>{meta}</div>
    </div>
    <button className="btn btn-ghost-muted icon sm reveal"><I.MoreH size={14}/></button>
  </div>
);

// ---- TAB 3: Sessions ----
const SessionsTab = () => {
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  return (
    <div className="col gap-16" style={{maxWidth: 980}}>
      <div className="row between">
        <p className="page-subtitle" style={{margin: 0}}>Une class peut tourner sur plusieurs villes & dates. Crée une session par cohorte.</p>
        <Btn variant="primary" icon={<I.Plus size={14}/>} onClick={() => setDrawerOpen(true)}>Nouvelle session</Btn>
      </div>

      <div className="col gap-12">
        {SESSIONS.map(s => <SessionCard key={s.id} s={s}/>)}
      </div>

      <NewSessionDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)}/>
    </div>
  );
};

const SessionCard = ({ s }) => (
  <div className="session-card">
    <div>
      <div className="session-card-loc">
        <I.MapPin size={16} style={{color: 'var(--mira-red)'}}/>
        {s.city}, {s.country} <span style={{fontSize: 18}}>{s.flag}</span>
      </div>
      <div className="session-card-dates">
        {s.start}–{s.end} · type {s.type} · {s.venue}
      </div>
      <div className="row gap-12" style={{marginTop: 14, alignItems: 'center'}}>
        <span style={{fontSize: 13, color: 'var(--muted)'}}>Capacité</span>
        <span className="cap-bar" style={{width: 140}}>
          <span className="cap-bar-fill" style={{width: `${(s.enrolled/s.capacity)*100}%`}}/>
        </span>
        <span className="tabular" style={{fontSize: 13.5, fontWeight: 600}}>{s.enrolled} / {s.capacity}</span>
        <span style={{fontSize: 12, color: 'var(--muted)'}}>· {s.waitlist} en waitlist</span>
        <span style={{flex: 1}}/>
        <StatusBadge status={s.status}>open enrolment</StatusBadge>
      </div>
    </div>
    <div className="col gap-8" style={{alignItems: 'flex-end'}}>
      <Btn variant="secondary" size="sm" icon={<I.Edit size={14}/>}>Éditer</Btn>
      <Btn variant="ghost" size="sm" icon={<I.Users size={14}/>}>Gérer apprenants</Btn>
      <button className="btn btn-ghost-muted icon sm"><I.MoreH size={14}/></button>
    </div>
  </div>
);

const NewSessionDrawer = ({ open, onClose }) => {
  const [type, setType] = React.useState('hybride');
  return (
    <Drawer open={open} onClose={onClose}>
      <div className="drawer-header">
        <div className="drawer-title-block">
          <h2 className="drawer-title">Nouvelle session</h2>
          <p className="drawer-subtitle">Cohorte concrète : dates, lieu, capacité.</p>
        </div>
        <button className="btn btn-ghost-muted icon sm" onClick={onClose}><I.X size={16}/></button>
      </div>
      <div className="drawer-body">
        <Field label="Type">
          <Segmented value={type} onChange={setType}
            options={[
              { value: 'physique', label: 'Physique', icon: <I.MapPin size={12}/> },
              { value: 'virtuel', label: 'Virtuel', icon: <I.Video size={12}/> },
              { value: 'hybride', label: 'Hybride', icon: <I.Globe size={12}/> },
            ]}/>
        </Field>

        <div className="field-row cols-2">
          <Field label="Ville"><input className="input" defaultValue="Barcelone"/></Field>
          <Field label="Pays"><input className="input" defaultValue="Espagne"/></Field>
        </div>
        {type !== 'virtuel' && (
          <Field label="Adresse" hint="lieu physique de la session">
            <input className="input" defaultValue="Coliving El Born · Carrer del Comerç 12"/>
          </Field>
        )}
        {type !== 'physique' && (
          <Field label="Provider visio">
            <select className="input" defaultValue="zoom">
              <option value="zoom">Zoom</option>
              <option value="meet">Google Meet</option>
              <option value="livekit">LiveKit (Mira native)</option>
            </select>
          </Field>
        )}

        <div className="field-row cols-2">
          <Field label="Démarre le">
            <div className="input input-prefix-wrap">
              <span className="input-prefix"><I.Calendar size={14}/></span>
              <input className="input-bare" defaultValue="05/07/2026"/>
            </div>
          </Field>
          <Field label="Termine le">
            <div className="input input-prefix-wrap">
              <span className="input-prefix"><I.Calendar size={14}/></span>
              <input className="input-bare" defaultValue="26/07/2026"/>
            </div>
          </Field>
        </div>
        <Field label="Deadline candidatures">
          <div className="input input-prefix-wrap">
            <span className="input-prefix"><I.Clock size={14}/></span>
            <input className="input-bare" defaultValue="25/06/2026"/>
          </div>
        </Field>

        <div className="field-row cols-2">
          <Field label="Capacité max" hint="1–50">
            <input className="input" type="number" defaultValue="8" min="1" max="50"/>
          </Field>
          <Field label="Waitlist max">
            <input className="input" type="number" defaultValue="4"/>
          </Field>
        </div>

        <Field label="Prix participation" hint="payé par chaque apprenant en plus des heures">
          <div className="input input-prefix-wrap">
            <span className="input-prefix">€</span>
            <input className="input-bare" type="number" defaultValue="450"/>
          </div>
        </Field>
      </div>
      <div className="drawer-footer">
        <Btn variant="ghost" onClick={onClose}>Annuler</Btn>
        <div className="row gap-8">
          <Btn variant="secondary">Enregistrer brouillon</Btn>
          <Btn variant="primary">Créer la session</Btn>
        </div>
      </div>
    </Drawer>
  );
};

// ---- TAB 4: Enrolments ----
const EnrolmentsTab = () => {
  const [filter, setFilter] = React.useState('all');
  const [open, setOpen] = React.useState(null);
  const counts = {
    all: ENROLMENTS.length,
    applied: ENROLMENTS.filter(e => e.status === 'applied').length,
    accepted: ENROLMENTS.filter(e => e.status === 'accepted').length,
    waitlist: ENROLMENTS.filter(e => e.status === 'waitlist').length,
    cancelled: 0,
  };
  const filtered = filter === 'all' ? ENROLMENTS : ENROLMENTS.filter(e => e.status === filter);
  return (
    <div className="col gap-16" style={{maxWidth: 980}}>
      <div className="row between">
        <div className="filter-tabs">
          <FilterTab active={filter==='all'} onClick={() => setFilter('all')} label="Tous" count={counts.all}/>
          <FilterTab active={filter==='applied'} onClick={() => setFilter('applied')} label="Applied" count={counts.applied}/>
          <FilterTab active={filter==='accepted'} onClick={() => setFilter('accepted')} label="Accepted" count={counts.accepted}/>
          <FilterTab active={filter==='waitlist'} onClick={() => setFilter('waitlist')} label="Waitlist" count={counts.waitlist}/>
          <FilterTab active={filter==='cancelled'} onClick={() => setFilter('cancelled')} label="Cancelled" count={counts.cancelled}/>
        </div>
        <div className="row gap-8">
          <Btn variant="ghost" size="sm" icon={<I.Send size={14}/>}>Inviter</Btn>
          <Btn variant="ghost" size="sm" iconRight={<I.ChevronDown size={14}/>}>Exporter</Btn>
        </div>
      </div>

      <div className="card flat">
        {filtered.map((e, i) => (
          <EnrolmentRow key={e.id} e={e} onClick={() => setOpen(e)}/>
        ))}
        {filtered.length === 0 && (
          <div style={{padding: 60, textAlign: 'center'}}>
            <p className="page-subtitle">Aucune candidature dans cet état.</p>
          </div>
        )}
      </div>

      <Drawer open={!!open} onClose={() => setOpen(null)}>
        {open && <EnrolmentDrawer e={open} onClose={() => setOpen(null)}/>}
      </Drawer>
    </div>
  );
};

const EnrolmentRow = ({ e, onClick }) => (
  <div className="enrolment-row hover-row" onClick={onClick} style={{cursor:'pointer'}}>
    <Avatar name={e.name} size="lg" variant={e.variant}/>
    <div style={{minWidth: 0}}>
      <div className="enrolment-name">
        {e.name}
        <StatusBadge status={e.status}>{e.status}</StatusBadge>
        <span style={{fontSize: 12, color: 'var(--muted)', fontWeight: 500}}>· {e.time}</span>
      </div>
      <div className="enrolment-bio">{e.bio}</div>
      {e.quote && <div className="enrolment-quote">« {e.quote} »</div>}
    </div>
    <div className="row gap-8" onClick={ev => ev.stopPropagation()}>
      {e.status === 'applied' && (
        <>
          <Btn variant="ghost" size="sm">Refuser</Btn>
          <Btn variant="primary" size="sm" icon={<I.Check size={14}/>}>Accepter</Btn>
        </>
      )}
      {e.status === 'waitlist' && (
        <Btn variant="secondary" size="sm" iconRight={<I.ArrowRight size={14}/>}>Déplacer en active</Btn>
      )}
      {e.status === 'accepted' && (
        <span className="row gap-6" style={{fontSize: 13, color: 'var(--success)', fontWeight: 600}}>
          <I.Check size={14}/> Active
        </span>
      )}
      <button className="btn btn-ghost-muted icon sm reveal"><I.MoreH size={14}/></button>
    </div>
  </div>
);

const EnrolmentDrawer = ({ e, onClose }) => (
  <>
    <div className="drawer-header">
      <Avatar name={e.name} size="lg" variant={e.variant}/>
      <div className="drawer-title-block">
        <h2 className="drawer-title" style={{fontFamily: 'var(--font-sans)', fontSize: 20, fontWeight: 600}}>{e.name}</h2>
        <p className="drawer-subtitle">{e.bio}</p>
      </div>
      <button className="btn btn-ghost-muted icon sm" onClick={onClose}><I.X size={16}/></button>
    </div>
    <div className="drawer-body">
      <div className="row gap-8" style={{marginBottom: 16}}>
        <StatusBadge status={e.status}>{e.status}</StatusBadge>
        <span style={{fontSize: 12.5, color: 'var(--muted)'}}>candidature {e.time}</span>
      </div>

      <Card title="Skills ciblées par l'apprenant" subtitle="Sélection lors de l'inscription">
        <div className="row gap-6" style={{flexWrap:'wrap'}}>
          <Chip primary>Levée de fonds</Chip>
          <Chip>Pitch deck</Chip>
          <Chip>Storytelling</Chip>
        </div>
      </Card>

      <div style={{height: 16}}/>

      {e.quote && (
        <Card title="Motivation">
          <div style={{fontSize: 14, lineHeight: 1.6, color: 'var(--charcoal)', fontStyle: 'italic'}}>
            « {e.quote} »
          </div>
        </Card>
      )}

      <div style={{height: 16}}/>

      <Card title="Tes notes" subtitle="Visible uniquement par toi">
        <textarea className="textarea" rows={4} placeholder="Note rapide sur cet apprenant…"/>
      </Card>
    </div>
    <div className="drawer-footer">
      <Btn variant="destructive" icon={<I.X size={14}/>}>Refuser</Btn>
      <div className="row gap-8">
        <Btn variant="secondary">Mettre en waitlist</Btn>
        <Btn variant="primary" icon={<I.Check size={14}/>}>Accepter</Btn>
      </div>
    </div>
  </>
);

window.ClassEdit = ClassEdit;
