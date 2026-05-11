// screens-b.jsx — Module detail, QCM, QCM result

// 5. MODULE DETAIL ──────────────────────────────────────────────────────────
function ScreenModuleDetail() {
  return (
    <div className="screen" style={{ paddingTop: 47 }}>
      <AppBar title="Module 1" back={() => {}}/>
      <div className="screen-scroll">
        <div style={{ padding: '4px 20px 0' }}>
          <div className="eyebrow" style={{ color: 'var(--muted)' }}>Module 1 / 2</div>
          <h2 style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.015em', margin: '6px 0 12px', lineHeight: 1.15 }}>
            Narratif <span className="serif-italic" style={{ color: 'var(--mira-red)' }}>investor</span>
          </h2>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <span className="chip"><span style={{ color: 'var(--muted)' }}>⏱</span> 3 h</span>
            <span className="chip">Théorie</span>
            <span className="chip" style={{ background: 'var(--sage-soft)', color: '#1B4521', borderColor: 'rgba(0,0,0,0.05)' }}>Published</span>
          </div>
        </div>

        <div className="section-header"><h3>Description</h3></div>
        <div style={{ padding: '0 20px', fontSize: 14, color: 'var(--charcoal)', lineHeight: 1.6 }}>
          <p style={{ margin: '0 0 10px' }}>
            Un bon pitch démarre par un <b>problème</b>, jamais par la solution.
            Tu apprends ici la structure narrative qui ouvre 80&nbsp;% des deals
            en seed et series A.
          </p>
          <p style={{ margin: '0 0 10px', color: 'var(--muted)' }}>
            On déconstruit 4 decks réels (Notion, Figma, Airbnb, Doctolib)
            et tu repars avec un template adapté à ton projet.
          </p>
        </div>

        <div className="section-header"><h3>Matériel</h3></div>
        <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <MaterialRow icon={I.fileText('#888')} title="Deck template" meta=".pdf · 1.2 MB" cta="Télécharger" iconCta={I.download('#1D1D1B', 14)}/>
          <MaterialRow icon={I.play('#888')} title="Vidéo intro" meta="12 min" cta="Lire" iconCta={null}/>
          <MaterialRow icon={I.bookOpen('#888', 22)} title="Lecture : 5 narratifs" meta="8 min lecture" cta="Lire" iconCta={null}/>
        </div>

        <div className="section-header"><h3>QCM</h3></div>
        <div style={{ padding: '0 20px 20px' }}>
          <div className="card" style={{ padding: 18, position: 'relative', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: 'rgba(230,51,42,0.1)', color: 'var(--mira-red)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>{I.trophy('#E6332A', 22)}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h4 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 4px' }}>Valide ta skill</h4>
                <p style={{ fontSize: 13, color: 'var(--muted)', margin: 0, lineHeight: 1.5 }}>
                  5 questions. 4 bonnes réponses pour valider
                  <b style={{ color: 'var(--charcoal)' }}> Pitch investor</b>.
                </p>
              </div>
            </div>
            <button className="btn btn-primary btn-full" style={{ marginTop: 14 }}>
              Lancer le QCM {I.arrowR('#fff')}
            </button>
          </div>
        </div>
      </div>

      {/* FAB */}
      <button style={{
        position: 'absolute', bottom: 96, right: 18, zIndex: 20,
        width: 56, height: 56, borderRadius: 999, border: 0,
        background: 'var(--mira-red)', color: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 10px 24px rgba(230,51,42,0.35)',
        fontFamily: 'inherit', fontSize: 13, fontWeight: 700,
        cursor: 'pointer', gap: 4,
      }}>
        {I.plus('#fff', 22)}
      </button>

      <BottomNav active="programmes"/>
    </div>
  );
}

function MaterialRow({ icon, title, meta, cta, iconCta }) {
  return (
    <div className="card" style={{ padding: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{
        width: 40, height: 40, borderRadius: 10,
        background: 'var(--warm-beige)', border: '1px solid var(--rule)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>{icon}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 700, lineHeight: 1.3 }}>{title}</div>
        <div style={{ fontSize: 12, color: 'var(--muted)' }}>{meta}</div>
      </div>
      <button className="btn btn-secondary" style={{ height: 36, padding: '0 12px', fontSize: 13, fontWeight: 600 }}>
        {iconCta}{cta}
      </button>
    </div>
  );
}

// 6. QCM QUESTION ───────────────────────────────────────────────────────────
function ScreenQCM() {
  const opts = [
    { l: 'Solution → Problème → Traction', s: false },
    { l: 'Problème → Solution → Traction', s: true },
    { l: 'Traction → Problème → Solution', s: false },
    { l: 'Pitch → Problème → Traction', s: false },
  ];
  return (
    <div className="screen" style={{ paddingTop: 47 }}>
      {/* header — épuré */}
      <div style={{ padding: '14px 20px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
        <button className="appbar-back" style={{ margin: 0 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1D1D1B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
        </button>
        <div style={{ flex: 1 }}>
          <div className="progress" style={{ height: 6 }}>
            <i style={{ width: '20%' }}/>
          </div>
        </div>
        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--charcoal)', letterSpacing: 0 }}>1 / 5</span>
      </div>

      <div className="screen-scroll" style={{ paddingBottom: 100 }}>
        <div style={{ padding: '24px 20px 0' }}>
          <div className="eyebrow" style={{ color: 'var(--mira-red)', marginBottom: 10 }}>Question 1</div>
          <h2 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.015em', lineHeight: 1.25, margin: 0 }}>
            Quel est le bon ordre dans un <span className="serif-italic" style={{ color: 'var(--mira-red)' }}>pitch</span> ?
          </h2>
          <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 8 }}>Une seule réponse.</p>
        </div>

        <div style={{ padding: '24px 20px 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {opts.map((o, i) => (
            <div key={i} className="card" style={{
              padding: '14px 16px',
              display: 'flex', alignItems: 'center', gap: 12,
              borderColor: o.s ? 'var(--mira-red)' : 'var(--rule)',
              borderWidth: o.s ? 2 : 1,
              boxShadow: o.s ? '0 0 0 4px rgba(230,51,42,0.08)' : 'none',
              padding: o.s ? '13px 15px' : '14px 16px',
            }}>
              <div style={{
                width: 22, height: 22, borderRadius: 999,
                border: '2px solid ' + (o.s ? '#E6332A' : '#B6B0A6'),
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                {o.s && <div style={{ width: 10, height: 10, borderRadius: 999, background: '#E6332A' }}/>}
              </div>
              <span style={{ fontSize: 15, fontWeight: o.s ? 700 : 500, color: 'var(--charcoal)' }}>{o.l}</span>
            </div>
          ))}
        </div>
      </div>

      {/* bottom fixed */}
      <div style={{
        position: 'absolute', bottom: 34, left: 0, right: 0,
        padding: '12px 20px 0', background: 'var(--warm-beige)',
        borderTop: '1px solid rgba(0,0,0,0.04)',
      }}>
        <button className="btn btn-primary btn-full">
          Suivant {I.arrowR('#fff')}
        </button>
      </div>
    </div>
  );
}

// 7. QCM RESULT ─────────────────────────────────────────────────────────────
function ScreenQCMResult() {
  return (
    <div className="screen" style={{ paddingTop: 47 }}>
      <div style={{ flex: 1, padding: '40px 24px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
        <div style={{ fontSize: 72, lineHeight: 1, marginBottom: 24 }}>🎉</div>

        <h1 className="serif" style={{
          fontSize: 36, color: 'var(--charcoal)', lineHeight: 1.05,
          margin: '0 0 8px', letterSpacing: '-0.02em',
        }}>Bravo, <span style={{ color: 'var(--mira-red)', fontStyle: 'italic', fontWeight: 700 }}>Anna !</span></h1>
        <p style={{ fontSize: 17, color: 'var(--charcoal)', fontWeight: 500, margin: 0 }}>
          Tu as eu <b>4 / 5</b> <span style={{ color: 'var(--muted)' }}>(80&nbsp;%)</span>
        </p>

        <div style={{ height: 1, width: '70%', background: 'var(--rule)', margin: '32px 0' }}/>

        <div className="sage-card" style={{
          width: '100%', padding: 24,
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
        }}>
          <div style={{
            width: 56, height: 56, borderRadius: 999,
            background: '#16A34A',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>{I.check('#fff', 28)}</div>
          <div className="eyebrow" style={{ color: '#1B4521' }}>Skill validée</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#1B4521', letterSpacing: '-0.01em' }}>
            Pitch investor
          </div>
          <div style={{ fontSize: 12, color: '#4B6B45' }}>Ajoutée à ton profil</div>
        </div>

        <div style={{ flex: 1 }}/>

        <button className="btn btn-primary btn-full" style={{ marginBottom: 10 }}>
          Retour au module
        </button>
        <button className="btn btn-ghost btn-full" style={{ color: 'var(--charcoal)' }}>
          Voir mes skills validées →
        </button>
      </div>
    </div>
  );
}

Object.assign(window, { ScreenModuleDetail, ScreenQCM, ScreenQCMResult });
