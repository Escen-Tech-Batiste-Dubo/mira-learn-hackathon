// Screen 1: /dashboard

const Spark = ({ points, color }) => {
  const w = 80, h = 28;
  const max = Math.max(...points);
  const min = Math.min(...points);
  const dx = w / (points.length - 1);
  const d = points.map((p, i) => {
    const x = i * dx;
    const y = h - ((p - min) / (max - min || 1)) * h;
    return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
  }).join(' ');
  const last = points.length - 1;
  const lastX = last * dx;
  const lastY = h - ((points[last] - min) / (max - min || 1)) * h;
  return (
    <svg className="spark" width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <path d={d} stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx={lastX} cy={lastY} r="2.5" fill={color}/>
    </svg>
  );
};

const StatCard = ({ label, value, sub, spark, sparkColor, trend }) => (
  <div className="card" style={{ padding: '18px 20px' }}>
    <div className="row between" style={{alignItems: 'flex-start'}}>
      <div className="metric-label">{label}</div>
      {trend && <span className="metric-trend">{trend}</span>}
    </div>
    <div className="row between" style={{ marginTop: 14, alignItems: 'flex-end' }}>
      <div className="metric-value">{value}</div>
      {spark && <Spark points={spark} color={sparkColor || 'var(--mira-red)'}/>}
    </div>
    <div className="metric-sub">{sub}</div>
  </div>
);

const Dashboard = ({ navigate }) => (
  <main className="main" data-screen-label="01 Dashboard">
    <TopBar crumbs={[{label: "Vue d'ensemble"}]} />
    <div className="page">
      <header className="page-header">
        <h1 className="page-title serif">
          Bonjour Antoine <span className="wave">👋</span>
        </h1>
        <p className="page-subtitle">Voici où en sont tes classes et tes apprenants.</p>
      </header>

      <div className="col gap-24">
        {/* Stats */}
        <div style={{display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16}}>
          <StatCard label="Classes" value="3" sub="1 published · 1 in review · 1 draft"
            spark={[2, 2, 3, 3, 3]} sparkColor="var(--charcoal)"/>
          <StatCard label="Sessions" value="2" sub="1 open enrolment · 1 confirmed"
            spark={[0, 1, 1, 2, 2]} sparkColor="var(--success)"/>
          <StatCard label="Apprenants" value="18" sub="3 actifs sur Pitcher 500k €" trend="+2 cette sem."
            spark={[12, 14, 14, 16, 18]} sparkColor="var(--mira-red)"/>
          <StatCard label="QCM" value="5" sub="5 publiés · 0 brouillon"
            spark={[3, 4, 4, 5, 5]} sparkColor="var(--gold)"/>
        </div>

        {/* À traiter */}
        <Card title="À traiter" subtitle="2 actions attendent ta validation" padding>
          <div className="col gap-8">
            <Callout
              icon={<I.Warning size={14}/>}
              action={<LinkArrow onClick={() => navigate('/dashboard/classes/pitcher-500k?tab=enrolments')}>Voir</LinkArrow>}
            >
              <b>3 nouvelles candidatures</b> sur <span style={{fontWeight:500}}>Pitcher pour lever 500k €</span> · session Barcelone
            </Callout>
            <Callout
              icon={<I.Clock size={14}/>}
              action={<LinkArrow onClick={() => navigate('/dashboard/classes/pitcher-500k?tab=sessions')}>Voir</LinkArrow>}
            >
              <b>1 session démarre dans 3 jours</b> à Barcelone · 3/8 apprenants confirmés
            </Callout>
          </div>
        </Card>

        {/* Activity grid */}
        <div style={{display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 16}}>
          <Card title="Activité récente" action={<a className="btn btn-ghost-muted sm">Tout voir</a>}>
            <div className="timeline">
              <TimelineRow color="gold" time="il y a 2 h"
                text={<><b>Anna Lopez</b> s'est inscrite à <b>Pitcher pour lever 500k €</b></>}/>
              <TimelineRow time="il y a 1 j"
                text={<><b>Pierre Lambert</b> est passé en waitlist (Pitcher pour lever 500k €)</>}/>
              <TimelineRow color="success" time="il y a 3 j"
                text={<>Tu as publié le module 2 de <b>Pitcher pour lever 500k €</b></>}/>
              <TimelineRow time="il y a 5 j"
                text={<>Marie Dupont a publié sa class <b>UI Design pour SaaS B2B</b></>}/>
              <TimelineRow time="il y a 8 j" color="red"
                text={<>Tu as soumis <b>Growth B2B en 8 semaines</b> à l'admin pour validation</>}/>
            </div>
          </Card>

          <Card title="Prochaine session" subtitle="Démarre dans 3 jours">
            <div className="col gap-12">
              <div className="row gap-8" style={{alignItems:'baseline'}}>
                <I.MapPin size={16} style={{color:'var(--mira-red)'}}/>
                <span style={{fontSize: 16, fontWeight: 600, letterSpacing: '-0.01em'}}>Barcelone, Espagne</span>
              </div>
              <div style={{fontSize: 13, color: 'var(--muted)'}}>
                Pitcher pour lever 500k € · 5–26 juillet 2026 · type hybride
              </div>
              <div className="divider"/>
              <div className="col gap-6">
                <div className="row between">
                  <span style={{fontSize:13, color:'var(--muted)'}}>Apprenants confirmés</span>
                  <span style={{fontSize:13, fontWeight:600}}>3 / 8</span>
                </div>
                <div className="cap-bar" style={{width: '100%'}}><div className="cap-bar-fill" style={{width: '37%'}}/></div>
                <div className="row between" style={{marginTop:4}}>
                  <span style={{fontSize:13, color:'var(--muted)'}}>Waitlist</span>
                  <span style={{fontSize:13, fontWeight:600}}>1</span>
                </div>
              </div>
              <Btn variant="secondary" size="sm" onClick={() => navigate('/dashboard/classes/pitcher-500k?tab=sessions')} iconRight={<I.ArrowRight size={14}/>}>
                Gérer la session
              </Btn>
            </div>
          </Card>
        </div>
      </div>
    </div>
  </main>
);

const TimelineRow = ({ text, time, color }) => (
  <div className="tl-row">
    <div className="tl-dot-col">
      <span className={`tl-dot ${color || ''}`}></span>
      <span className="tl-line"></span>
    </div>
    <div className="tl-text">{text}</div>
    <div className="tl-time">{time}</div>
  </div>
);

window.Dashboard = Dashboard;
