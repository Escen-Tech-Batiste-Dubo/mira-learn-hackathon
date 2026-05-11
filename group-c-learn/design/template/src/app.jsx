// Mira Learn — App shell, router, tweaks

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "personaState": "mid-journey",
  "pathStyle": "vertical",
  "accentIntensity": "balanced"
}/*EDITMODE-END*/;

// --- Router (hash-based) ---
function parseHash() {
  const raw = window.location.hash.slice(1) || '/';
  const [path, qs] = raw.split('?');
  const query = {};
  if (qs) qs.split('&').forEach(p => { const [k,v] = p.split('='); query[k] = decodeURIComponent(v || ''); });
  return { path, query };
}

function useRoute() {
  const [route, setRoute] = useState(parseHash());
  useEffect(() => {
    const onChange = () => {
      setRoute(parseHash());
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return route;
}

window.MiraNav = {
  go: (path) => { window.location.hash = path; },
};

function matchRoute(path) {
  // Order matters
  if (path === '/' || path === '') return { page: 'landing' };
  if (path === '/classes') return { page: 'catalogue' };
  if (path === '/community') return { page: 'community' };
  if (path === '/me') return { page: 'me' };
  if (path === '/me/path') return { page: 'path' };
  if (path === '/me/path/generate') return { page: 'pathgen' };
  if (path === '/me/enrolments') return { page: 'me' }; // alias
  if (path === '/me/settings') return { page: 'me' };  // alias
  let m;
  if ((m = path.match(/^\/classes\/([^/]+)\/apply$/))) return { page: 'apply', params: { slug: m[1] } };
  if ((m = path.match(/^\/classes\/([^/]+)$/))) return { page: 'classDetail', params: { slug: m[1] } };
  return { page: 'notfound' };
}

// --- Top-level App ---
function App() {
  const { path, query } = useRoute();
  const route = matchRoute(path);
  const [t, setTweak] = window.useTweaks ? window.useTweaks(TWEAK_DEFAULTS) : [TWEAK_DEFAULTS, () => {}];

  // Auth pages need different header mode
  const isAuthArea = path.startsWith('/me');
  const hideHeader = route.page === 'pathgen' && false; // keep header even during generate

  let content;
  switch (route.page) {
    case 'landing': content = <LandingPage />; break;
    case 'catalogue': content = <CataloguePage />; break;
    case 'classDetail': content = <ClassDetailPage params={route.params} />; break;
    case 'apply': content = <ApplyPage params={route.params} query={query} />; break;
    case 'me': content = <MePage personaState={t.personaState} />; break;
    case 'pathgen': content = <PathGeneratePage />; break;
    case 'path': content = <PathPage />; break;
    case 'community': content = <CommunityPage />; break;
    default: content = (
      <div className="container" style={{padding:120,textAlign:'center'}}>
        <h1 className="serif" style={{fontSize:48,margin:0}}>Page introuvable.</h1>
        <a href="#/" className="btn btn-primary" style={{marginTop:24}}>Retour à l'accueil</a>
      </div>
    );
  }

  // Accent intensity tweak
  useEffect(() => {
    const root = document.documentElement;
    if (t.accentIntensity === 'subtle') root.style.setProperty('--mira-red', '#D63A33');
    else if (t.accentIntensity === 'bold') root.style.setProperty('--mira-red', '#E6332A');
    else root.style.setProperty('--mira-red', '#E6332A');
  }, [t.accentIntensity]);

  return (
    <>
      {!hideHeader && <Header mode={isAuthArea ? 'auth' : 'public'} />}
      <main key={path}>{content}</main>
      {!isAuthArea && route.page !== 'apply' && route.page !== 'pathgen' && <Footer />}
      <Tweaks t={t} setTweak={setTweak} />
    </>
  );
}

// --- Tweaks panel ---
function Tweaks({ t, setTweak }) {
  if (!window.TweaksPanel) return null;
  return (
    <window.TweaksPanel title="Tweaks">
      <window.TweakSection title="Persona state (Anna)">
        <window.TweakRadio
          value={t.personaState}
          onChange={v => setTweak('personaState', v)}
          options={[
            { value: 'empty', label: 'Vide' },
            { value: 'declared', label: 'Skills définies' },
            { value: 'mid-journey', label: 'En cours' },
          ]}
        />
      </window.TweakSection>
      <window.TweakSection title="Intensité de l'accent rouge">
        <window.TweakRadio
          value={t.accentIntensity}
          onChange={v => setTweak('accentIntensity', v)}
          options={[
            { value: 'subtle', label: 'Sobre' },
            { value: 'balanced', label: 'Équilibré' },
            { value: 'bold', label: 'Affirmé' },
          ]}
        />
      </window.TweakSection>
      <window.TweakSection title="Raccourcis">
        <div style={{display:'flex',flexDirection:'column',gap:6}}>
          {[
            ['/', '01 · Landing'],
            ['/classes', '02 · Catalogue'],
            ['/classes/pitch', '03 · Class detail'],
            ['/me', '04 · Profile'],
            ['/me/path/generate', '05 · Path generate'],
            ['/me/path', '06 · Path'],
            ['/classes/pitch/apply', '07 · Apply'],
            ['/community', '08 · Community'],
          ].map(([href, label]) => (
            <a key={href} href={`#${href}`} style={{
              padding:'8px 12px',borderRadius:8,fontSize:13,
              color:'var(--charcoal)',background:'#F5F2EE',
              textDecoration:'none',transition:'all .15s',
            }}
            onMouseEnter={e=>e.currentTarget.style.background='var(--warm-beige)'}
            onMouseLeave={e=>e.currentTarget.style.background='#F5F2EE'}
            >{label}</a>
          ))}
        </div>
      </window.TweakSection>
    </window.TweaksPanel>
  );
}

// Mount
ReactDOM.createRoot(document.getElementById('root')).render(<App />);
