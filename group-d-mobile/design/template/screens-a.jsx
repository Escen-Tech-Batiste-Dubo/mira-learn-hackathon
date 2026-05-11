// screens-a.jsx — Splash, Login, Programmes list, Programmes class detail

// 1. SPLASH ──────────────────────────────────────────────────────────────────
function ScreenSplash() {
  return (
    <div className="screen" style={{ paddingTop: 47 }}>
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 4,
      }}>
        <div className="serif" style={{
          fontSize: 64, color: 'var(--mira-red)', lineHeight: 1, letterSpacing: '-0.03em',
        }}>Mira</div>
        <div style={{
          fontSize: 16, fontWeight: 500, color: 'var(--muted)',
          letterSpacing: '0.32em', textTransform: 'lowercase',
          marginTop: 6,
        }}>l e a r n</div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', paddingBottom: 80 }}>
        <div className="spinner"/>
      </div>
    </div>
  );
}

// 2. LOGIN ───────────────────────────────────────────────────────────────────
function ScreenLogin() {
  return (
    <div className="screen" style={{ paddingTop: 47 }}>
      <div style={{ flex: 1, padding: '60px 20px 20px', display: 'flex', flexDirection: 'column' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 64 }}>
          <div className="serif" style={{
            fontSize: 42, color: 'var(--mira-red)', lineHeight: 1,
          }}>Mira</div>
          <div style={{
            fontSize: 14, fontWeight: 500, color: 'var(--muted)',
            letterSpacing: '0.28em', marginTop: 4,
          }}>l e a r n</div>
        </div>

        <h1 style={{
          fontSize: 26, fontWeight: 700, letterSpacing: '-0.02em',
          margin: '0 0 6px', lineHeight: 1.15,
        }}>Bon retour,<br/><span className="serif-italic" style={{ color: 'var(--mira-red)', fontSize: 28 }}>Anna</span></h1>
        <p style={{ fontSize: 14, color: 'var(--muted)', margin: '0 0 32px' }}>
          Connecte-toi pour reprendre ton parcours.
        </p>

        {/* Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label className="input-label">Email</label>
            <div className="input" style={{ display: 'flex', alignItems: 'center' }}>
              anna.lopez@hackathon.test
            </div>
          </div>
          <div>
            <label className="input-label">Mot de passe</label>
            <div className="input" style={{ display: 'flex', alignItems: 'center', letterSpacing: '0.2em' }}>
              ••••••••••••••
            </div>
          </div>
        </div>

        <button className="btn btn-primary btn-full" style={{ marginTop: 24 }}>
          Se connecter
        </button>

        <div style={{ flex: 1 }}/>

        <div style={{
          textAlign: 'center', fontSize: 12, color: 'var(--muted)',
          paddingBottom: 24, lineHeight: 1.5,
        }}>
          Comptes test&nbsp;: voir<br/>
          <span style={{ color: 'var(--charcoal)', fontWeight: 600 }}>contracts/test-accounts.md</span>
        </div>
      </div>
    </div>
  );
}

// 3. PROGRAMMES LIST ────────────────────────────────────────────────────────
function ScreenProgrammesList() {
  return (
    <div className="screen" style={{ paddingTop: 47 }}>
      <AppBar title="Programmes" right={<button className="appbar-icon">{I.search()}</button>}/>

      <div className="screen-scroll">
        {/* greeting card */}
        <div style={{ padding: '4px 20px 8px' }}>
          <p style={{ fontSize: 14, color: 'var(--muted)', margin: 0 }}>
            Hi, Anna <span>👋</span>
          </p>
          <h2 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.01em', margin: '4px 0 0', lineHeight: 1.2 }}>
            Reprenons ton parcours,<br/>
            <span className="serif-italic" style={{ color: 'var(--mira-red)' }}>une class à la fois.</span>
          </h2>
        </div>

        <div className="section-header" style={{ marginTop: 28 }}>
          <h3>Inscrites <span style={{ color: 'var(--muted)', fontWeight: 500 }}>(1)</span></h3>
        </div>

        {/* enrolled card */}
        <div style={{ padding: '0 20px' }}>
          <div className="card" style={{ padding: 16 }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <Avatar initials="AM" size={44}/>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  En cours
                  <span className="sonar-dot" style={{ marginLeft: 4 }}/>
                </div>
                <h4 style={{ fontSize: 16, fontWeight: 700, margin: '4px 0 2px', letterSpacing: '-0.01em', lineHeight: 1.25 }}>
                  Pitcher pour lever 500&nbsp;k&nbsp;€
                </h4>
                <p style={{ fontSize: 13, color: 'var(--muted)', margin: 0 }}>Antoine Martin</p>
              </div>
            </div>
            <div style={{ marginTop: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: 12, color: 'var(--charcoal)', fontWeight: 600 }}>Module 1/2</span>
                <span style={{ fontSize: 12, color: 'var(--mira-red)', fontWeight: 700 }}>50&nbsp;%</span>
              </div>
              <div className="progress"><i style={{ width: '50%' }}/></div>
              <div style={{ marginTop: 8, fontSize: 12, color: 'var(--muted)' }}>
                Dernière session il y a 3&nbsp;j
              </div>
            </div>
          </div>
        </div>

        {/* suggestions */}
        <div className="section-header">
          <h3>Suggestions</h3>
          <span className="eyebrow" style={{ color: 'var(--muted-soft)' }}>Pour toi</span>
        </div>
        <p style={{ fontSize: 12, color: 'var(--muted)', padding: '0 20px', margin: '-4px 0 12px' }}>
          Basées sur tes skills cibles.
        </p>

        {[
          { title: 'UI Design pour SaaS B2B', author: 'Marie Dupont', price: '60 €', chip: 'Pitch investor', i: 'MD' },
          { title: 'Construire ta narrative founder', author: 'Sami Bennani', price: '45 €', chip: 'Funding', i: 'SB' },
        ].map((s, idx) => (
          <div key={idx} style={{ padding: '0 20px 12px' }}>
            <div className="card" style={{ padding: 16 }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <Avatar initials={s.i} size={36} variant={2}/>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h4 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 2px', letterSpacing: '-0.005em' }}>{s.title}</h4>
                  <p style={{ fontSize: 12, color: 'var(--muted)', margin: 0 }}>{s.author} · {s.price}</p>
                </div>
              </div>
              <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="chip chip-skill">{s.chip}</span>
                <button style={{
                  background:'transparent', border:0, color:'var(--mira-red)',
                  fontFamily:'inherit', fontWeight:700, fontSize:13,
                  display:'flex', alignItems:'center', gap:4, cursor:'pointer',
                }}>En savoir + {I.chevR('#E6332A')}</button>
              </div>
            </div>
          </div>
        ))}

        <div style={{ height: 24 }}/>
      </div>

      <BottomNav active="programmes"/>
    </div>
  );
}

// 4. CLASS DETAIL ───────────────────────────────────────────────────────────
function ScreenClassDetail() {
  return (
    <div className="screen" style={{ paddingTop: 47 }}>
      <AppBar title="Pitcher pour lever 500 k €" back={() => {}}/>

      <div className="screen-scroll">
        {/* mentor block */}
        <div style={{ padding: '4px 20px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Avatar initials="AM" size={52}/>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Mentor</div>
              <h3 style={{ fontSize: 17, fontWeight: 700, margin: '2px 0 4px' }}>Antoine Martin</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--muted)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--charcoal)', fontWeight: 700 }}>
                  {I.star()} 4.8
                </span>
                <span>·</span>
                <span>12 classes</span>
              </div>
            </div>
          </div>

          {/* skill chips */}
          <div style={{ display: 'flex', gap: 6, marginTop: 14, flexWrap: 'wrap' }}>
            <span className="chip chip-skill-primary">{I.star('#1B4521', 12)} Pitch investor</span>
            <span className="chip chip-skill">Funding</span>
            <span className="chip chip-skill">Storytelling</span>
          </div>
        </div>

        {/* session card */}
        <div style={{ padding: '20px 20px 0' }}>
          <div className="card" style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div className="eyebrow" style={{ color: 'var(--mira-red)' }}>Session active</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 600, color: 'var(--charcoal)' }}>
              {I.pin('#1D1D1B')} Barcelone
              <span style={{ color: 'var(--muted-soft)', fontWeight: 500 }}>·</span>
              <span style={{ color: 'var(--muted)', fontWeight: 500 }}>5 – 26 juillet 2026</span>
            </div>
            <button className="btn btn-ghost" style={{ height: 36, padding: '0 10px', alignSelf: 'flex-start', color: 'var(--mira-red)', fontSize: 13 }}>
              Voir détails session →
            </button>
          </div>
        </div>

        <div className="section-header" style={{ marginTop: 26, marginBottom: 8 }}>
          <h3>Modules <span style={{ color: 'var(--muted)', fontWeight: 500 }}>2</span></h3>
        </div>

        {/* module rows */}
        <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <ModuleRow
            n={1} pct={100}
            title="Construire le narratif"
            sub="1 QCM validé"
            done
          />
          <ModuleRow
            n={2} pct={50}
            title="Design + délivery du deck"
            sub="0 QCM · en cours"
            current
          />
        </div>

        <div style={{ height: 24 }}/>
      </div>

      <BottomNav active="programmes"/>
    </div>
  );
}

function ModuleRow({ n, pct, title, sub, done, current }) {
  return (
    <div className="card" style={{ padding: 14, display: 'flex', gap: 12, alignItems: 'center' }}>
      <ProgressRing value={pct} size={36} stroke={3} color={done ? '#16A34A' : '#E6332A'}>
        {done ? <span style={{ color:'#16A34A', fontSize: 12 }}>{I.check('#16A34A', 12)}</span> : n}
      </ProgressRing>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>
          Module {n}
        </div>
        <h4 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 4px', letterSpacing: '-0.005em' }}>{title}</h4>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div className="progress" style={{ flex: 1, height: 4 }}>
            <i style={{ width: pct + '%', background: done ? '#16A34A' : '#E6332A' }}/>
          </div>
          <span style={{ fontSize: 11, fontWeight: 700, color: done ? '#16A34A' : 'var(--mira-red)' }}>{pct}%</span>
        </div>
        <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 6 }}>{sub}</div>
      </div>
      {I.chevR('#B6B0A6', 18)}
    </div>
  );
}

Object.assign(window, { ScreenSplash, ScreenLogin, ScreenProgrammesList, ScreenClassDetail });
