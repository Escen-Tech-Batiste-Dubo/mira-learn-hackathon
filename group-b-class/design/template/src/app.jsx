// App — hash-based router

const useHashRoute = () => {
  const parse = () => {
    const h = window.location.hash.slice(1) || '/dashboard';
    return h;
  };
  const [route, setRoute] = React.useState(parse());
  React.useEffect(() => {
    const onChange = () => setRoute(parse());
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  const navigate = React.useCallback((to) => {
    window.location.hash = to;
  }, []);
  return [route, navigate];
};

// Split route from query
const parseRoute = (route) => {
  const [path, qs] = route.split('?');
  const params = {};
  if (qs) {
    qs.split('&').forEach(kv => {
      const [k, v] = kv.split('=');
      params[k] = decodeURIComponent(v || '');
    });
  }
  return { path, params };
};

const App = () => {
  const [route, navigate] = useHashRoute();
  const { path, params } = parseRoute(route);

  let screen;
  if (path === '/dashboard' || path === '/') {
    screen = <Dashboard navigate={navigate}/>;
  } else if (path === '/dashboard/classes') {
    screen = <Classes navigate={navigate}/>;
  } else if (path.startsWith('/dashboard/classes/')) {
    const id = path.split('/').pop();
    const tab = params.tab || 'overview';
    const setTab = (t) => navigate(`/dashboard/classes/${id}?tab=${t}`);
    screen = <ClassEdit classId={id} tab={tab} navigate={navigate} setTab={setTab}/>;
  } else if (path.startsWith('/dashboard/quizzes/')) {
    const id = path.split('/').pop();
    screen = <QuizEditor quizId={id} navigate={navigate}/>;
  } else if (path === '/dashboard/sessions') {
    screen = <Sessions navigate={navigate}/>;
  } else if (path === '/dashboard/learners') {
    screen = <Learners navigate={navigate}/>;
  } else if (path === '/dashboard/quizzes') {
    screen = <QuizzesIndex navigate={navigate}/>;
  } else if (path === '/dashboard/profile') {
    screen = <SimplePlaceholder title="Mon profil" subtitle="Fiche publique mentor — visible dans l'annuaire." navigate={navigate}/>;
  } else {
    screen = <Dashboard navigate={navigate}/>;
  }

  return (
    <div className="app">
      <Sidebar route={path} navigate={navigate}/>
      {screen}
    </div>
  );
};

const SimplePlaceholder = ({ title, subtitle, navigate }) => (
  <main className="main">
    <TopBar crumbs={[{label: title}]}/>
    <div className="page">
      <header className="page-header">
        <h1 className="page-title" style={{fontSize: 28}}>{title}</h1>
        <p className="page-subtitle">{subtitle}</p>
      </header>
      <div className="card" style={{padding: 60, textAlign: 'center'}}>
        <I.Layers size={28} style={{color: 'var(--muted-soft)', margin: '0 auto 12px', display: 'block'}}/>
        <div style={{fontWeight: 600, marginBottom: 4}}>Vue agrégée — Groupe C</div>
        <p className="page-subtitle">Cette vue est livrée hors scope du Groupe B.</p>
      </div>
    </div>
  </main>
);

const QuizzesIndex = ({ navigate }) => (
  <main className="main">
    <TopBar crumbs={[{label: 'QCM'}]}/>
    <div className="page">
      <header className="page-header">
        <div className="page-header-row">
          <div>
            <h1 className="page-title" style={{fontSize: 28}}>QCM</h1>
            <p className="page-subtitle">Tous tes quiz, toutes classes confondues.</p>
          </div>
          <Btn variant="primary" icon={<I.Plus size={14}/>}>Nouveau QCM</Btn>
        </div>
      </header>
      <div className="card flat">
        <div className="enrolment-row hover-row" onClick={() => navigate('/dashboard/quizzes/quiz-1')} style={{cursor:'pointer'}}>
          <span style={{
            width: 40, height: 40,
            borderRadius: 10,
            background: 'var(--warm-beige)',
            display: 'grid', placeItems: 'center',
            color: 'var(--mira-red)',
          }}><I.Quiz size={18}/></span>
          <div>
            <div className="enrolment-name">Valider le narratif investor <StatusBadge status="published">Published</StatusBadge></div>
            <div className="enrolment-bio">Pitcher pour lever 500k € · Module 1 · 5 questions · passing 70 %</div>
          </div>
          <Btn variant="secondary" size="sm" iconRight={<I.ArrowRight size={14}/>}>Éditer</Btn>
        </div>
      </div>
    </div>
  </main>
);

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
