// screens-c.jsx — Note create sheet, Tab Notes (3 modes), Note detail edit

// 6. NOTE CREATE — bottom sheet over module screen ──────────────────────────
function ScreenNoteCreate() {
  return (
    <div className="screen" style={{ paddingTop: 47 }}>
      {/* dimmed module behind */}
      <div style={{
        position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)',
        zIndex: 5,
      }}/>
      {/* faded module ghost top */}
      <div style={{ padding: '14px 20px 0', opacity: 0.5, filter: 'blur(2px)', pointerEvents: 'none' }}>
        <div style={{ height: 36 }}/>
        <div className="eyebrow">Module 1 / 2</div>
        <h2 style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.015em', margin: '6px 0 12px' }}>
          Narratif investor
        </h2>
        <div style={{ height: 80, background: '#fff', borderRadius: 16, border: '1px solid var(--rule)' }}/>
      </div>

      {/* bottom sheet */}
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 0,
        zIndex: 10,
        background: 'var(--warm-beige)',
        borderTopLeftRadius: 24, borderTopRightRadius: 24,
        height: 600,
        padding: '8px 20px 24px',
        boxShadow: '0 -20px 60px rgba(0,0,0,0.18)',
        display: 'flex', flexDirection: 'column',
      }}>
        {/* drag handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '6px 0 14px' }}>
          <div style={{ width: 40, height: 4, borderRadius: 999, background: 'rgba(0,0,0,0.18)' }}/>
        </div>

        {/* header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 8,
            background: 'rgba(230,51,42,0.1)', color: 'var(--mira-red)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>
          </div>
          <div style={{ flex: 1 }}>
            <div className="eyebrow" style={{ color: 'var(--muted)' }}>Note</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--charcoal)' }}>
              Module 1 · Narratif investor
            </div>
          </div>
        </div>

        <div style={{ height: 1, background: 'var(--rule)', margin: '16px 0' }}/>

        {/* textarea */}
        <div style={{
          background: 'var(--card-bg)', borderRadius: 16,
          border: '1px solid var(--rule)',
          padding: '14px 16px',
          minHeight: 180,
          fontSize: 15, lineHeight: 1.6, color: 'var(--charcoal)',
          fontWeight: 500,
        }}>
          Le narratif doit commencer par le problème, pas la solution.
          <span style={{
            display: 'inline-block', width: 1.5, height: 18, background: 'var(--mira-red)',
            verticalAlign: 'middle', marginLeft: 1,
            animation: 'caret 1s steps(2) infinite',
          }}/>
          <style>{`@keyframes caret { 50% { opacity: 0 } }`}</style>
        </div>

        {/* suggestions */}
        <div style={{ marginTop: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <span style={{ color: 'var(--mira-red)' }}>{I.sparkles(true, '#E6332A')}</span>
            <span className="eyebrow" style={{ color: 'var(--muted)' }}>Suggestions Mira AI</span>
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <SuggestChip label="Pitch" attached/>
            <SuggestChip label="Storytelling"/>
            <SuggestChip label="Funding"/>
            <button style={{
              background: 'transparent', border: '1px dashed var(--muted-soft)',
              borderRadius: 999, padding: '6px 12px',
              fontFamily: 'inherit', fontSize: 12, color: 'var(--muted)',
              display: 'inline-flex', alignItems: 'center', gap: 4, cursor: 'pointer',
            }}>{I.plus('#888', 12)} Custom</button>
          </div>
        </div>

        <div style={{ flex: 1 }}/>

        {/* actions */}
        <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
          <button className="btn btn-secondary" style={{ flex: 1 }}>Annuler</button>
          <button className="btn btn-primary" style={{ flex: 2 }}>Enregistrer</button>
        </div>
      </div>
    </div>
  );
}

function SuggestChip({ label, attached }) {
  return (
    <span className={'chip ' + (attached ? 'chip-skill-primary' : '')} style={{
      background: attached ? 'var(--sage-soft)' : '#fff',
      borderColor: attached ? 'rgba(0,0,0,0.05)' : 'var(--rule)',
      color: attached ? '#1B4521' : 'var(--charcoal)',
    }}>
      {attached && <span style={{ color: '#16A34A' }}>{I.check('#16A34A', 11)}</span>}
      {!attached && <span style={{ color: 'var(--mira-red)' }}>+</span>}
      {label}
    </span>
  );
}

// 7. TAB NOTES — wow feature (par concept) ──────────────────────────────────
function ScreenNotes() {
  const [mode, setMode] = React.useState('concept');
  return (
    <div className="screen" style={{ paddingTop: 47 }}>
      <AppBar title="Notes" right={
        <button className="btn btn-primary" style={{ height: 36, padding: '0 14px', fontSize: 13 }}>
          {I.plus('#fff', 16)} Note
        </button>
      }/>

      {/* segmented control */}
      <div style={{ padding: '0 20px 4px' }}>
        <div style={{
          display: 'flex', background: 'rgba(0,0,0,0.05)',
          borderRadius: 12, padding: 3,
        }}>
          {[
            { id: 'recent', label: 'Récentes' },
            { id: 'concept', label: 'Par concept' },
            { id: 'module', label: 'Par module' },
          ].map(t => (
            <button key={t.id} onClick={() => setMode(t.id)} style={{
              flex: 1, height: 34, border: 0, borderRadius: 9,
              background: mode === t.id ? '#fff' : 'transparent',
              color: mode === t.id ? 'var(--charcoal)' : 'var(--muted)',
              fontFamily: 'inherit', fontSize: 12, fontWeight: 700,
              boxShadow: mode === t.id ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              letterSpacing: '-0.005em', cursor: 'pointer',
            }}>{t.label}</button>
          ))}
        </div>
      </div>

      <div className="screen-scroll">
        {mode === 'concept' && <NotesByConcept/>}
        {mode === 'recent' && <NotesRecent/>}
        {mode === 'module' && <NotesByModule/>}
        <div style={{ height: 24 }}/>
      </div>

      <BottomNav active="notes"/>
    </div>
  );
}

function NotesByConcept() {
  return (
    <div>
      {/* AI banner */}
      <div style={{ padding: '14px 20px 0' }}>
        <div style={{
          background: 'rgba(230,51,42,0.06)', border: '1px solid rgba(230,51,42,0.15)',
          borderRadius: 14, padding: 14,
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <span style={{ color: 'var(--mira-red)' }}>{I.sparkles(true, '#E6332A')}</span>
            <div style={{ flex: 1, fontSize: 13, color: 'var(--charcoal)', lineHeight: 1.5 }}>
              Tes notes ont été regroupées par concept par <b>Mira AI</b>.
              <div style={{ color: 'var(--muted)', fontSize: 12, marginTop: 2 }}>Dernière analyse il y a 2 h.</div>
            </div>
          </div>
          <button style={{
            marginTop: 10, background: '#fff', border: '1px solid var(--rule)',
            borderRadius: 10, height: 32, padding: '0 12px',
            fontFamily: 'inherit', fontSize: 12, fontWeight: 700, color: 'var(--charcoal)',
            display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer',
          }}>↻ Réorganiser maintenant</button>
        </div>
      </div>

      {/* Concept: Pitch */}
      <ConceptSerifHeader title="Pitch" count={3}/>
      <div style={{ padding: '0 20px' }}>
        <div className="card" style={{ overflow: 'hidden' }}>
          <NoteRow body="Le narratif doit commencer par le problème, pas la solution. L'investisseur achète une vision avant un produit." meta="Module 1 · il y a 2 j"/>
          <Divider/>
          <NoteRow body="Slide 3 = traction. Sans traction, ne pas pitcher des investisseurs — pitcher des amis." meta="Module 1 · hier"/>
          <Divider/>
          <NoteRow body="Toujours ouvrir avec une anecdote concrète. Pas de stats avant la slide 5." meta="Module 1 · il y a 30 min"/>
        </div>
      </div>

      {/* Concept: Funding */}
      <ConceptSerifHeader title="Funding" count={1}/>
      <div style={{ padding: '0 20px' }}>
        <div className="card">
          <NoteRow body="Lever 500 k → 18-24 mois de runway minimum. Sinon on repitch dans 6 mois en panique." meta="Module 2 · il y a 4 j"/>
        </div>
      </div>

      {/* Non classées */}
      <ConceptSerifHeader title="Non classées" count={2} muted/>
      <p style={{ padding: '0 20px', fontSize: 12, color: 'var(--muted)', margin: '-4px 0 8px' }}>
        Trop courtes ou trop génériques pour être groupées.
      </p>
      <div style={{ padding: '0 20px' }}>
        <div className="card" style={{ overflow: 'hidden' }}>
          <NoteRow body="Penser à demander à Antoine pour le template." meta="Module 1 · hier"/>
          <Divider/>
          <NoteRow body="Acheter café avant la prochaine session." meta="il y a 5 j"/>
        </div>
      </div>
    </div>
  );
}

function NotesRecent() {
  return (
    <div>
      <ConceptSerifHeader title="Aujourd'hui" count={2} sans/>
      <div style={{ padding: '0 20px' }}>
        <div className="card" style={{ overflow: 'hidden' }}>
          <NoteRow body="Le narratif doit commencer par le problème, pas la solution." meta={<><Tag>Pitch</Tag> · Module 1 · il y a 30 min</>}/>
          <Divider/>
          <NoteRow body="Penser à demander à Antoine pour le template." meta="Module 1 · il y a 2 h"/>
        </div>
      </div>
      <ConceptSerifHeader title="Hier" count={2} sans/>
      <div style={{ padding: '0 20px' }}>
        <div className="card" style={{ overflow: 'hidden' }}>
          <NoteRow body="Slide 3 = traction. Sans traction, ne pas pitcher des investisseurs." meta={<><Tag>Pitch</Tag> · Module 1 · hier</>}/>
        </div>
      </div>
      <ConceptSerifHeader title="Cette semaine" count={2} sans/>
      <div style={{ padding: '0 20px' }}>
        <div className="card" style={{ overflow: 'hidden' }}>
          <NoteRow body="Lever 500k → 18-24 mois de runway minimum." meta={<><Tag>Funding</Tag> · Module 2 · il y a 4 j</>}/>
          <Divider/>
          <NoteRow body="Acheter café avant la prochaine session." meta="il y a 5 j"/>
        </div>
      </div>
    </div>
  );
}

function NotesByModule() {
  return (
    <div>
      <ConceptSerifHeader title="Module 1 · Narratif" count={4} sans/>
      <div style={{ padding: '0 20px' }}>
        <div className="card" style={{ overflow: 'hidden' }}>
          <NoteRow body="Le narratif doit commencer par le problème." meta={<><Tag>Pitch</Tag> · il y a 30 min</>}/>
          <Divider/>
          <NoteRow body="Slide 3 = traction." meta={<><Tag>Pitch</Tag> · hier</>}/>
          <Divider/>
          <NoteRow body="Toujours ouvrir avec une anecdote concrète." meta={<><Tag>Pitch</Tag> · il y a 2 j</>}/>
          <Divider/>
          <NoteRow body="Penser à demander à Antoine pour le template." meta="hier"/>
        </div>
      </div>
      <ConceptSerifHeader title="Module 2 · Design deck" count={1} sans/>
      <div style={{ padding: '0 20px' }}>
        <div className="card">
          <NoteRow body="Lever 500k → 18-24 mois de runway minimum." meta={<><Tag>Funding</Tag> · il y a 4 j</>}/>
        </div>
      </div>
    </div>
  );
}

function ConceptSerifHeader({ title, count, muted, sans }) {
  return (
    <div style={{ padding: '24px 20px 8px', display: 'flex', alignItems: 'baseline', gap: 10 }}>
      <h3 style={{
        fontFamily: sans ? 'var(--font-sans)' : 'var(--font-serif)',
        fontWeight: sans ? 700 : 700,
        fontSize: sans ? 15 : 24,
        letterSpacing: sans ? '-0.005em' : '-0.02em',
        color: muted ? 'var(--muted)' : 'var(--charcoal)',
        margin: 0, lineHeight: 1.1,
      }}>{title}</h3>
      <span style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 500 }}>
        {count} note{count > 1 ? 's' : ''}
      </span>
    </div>
  );
}
function NoteRow({ body, meta }) {
  return (
    <div style={{ padding: '14px 16px' }}>
      <p style={{ fontSize: 14, color: 'var(--charcoal)', margin: 0, lineHeight: 1.5 }}>{body}</p>
      <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 8, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>{meta}</div>
    </div>
  );
}
function Divider() {
  return <div style={{ height: 1, background: 'var(--rule)' }}/>;
}
function Tag({ children }) {
  return (
    <span style={{
      background: 'var(--sage-soft)', color: '#1B4521',
      padding: '1px 7px', borderRadius: 999, fontSize: 11, fontWeight: 700,
    }}>{children}</span>
  );
}

// 8. NOTE DETAIL (édition) ──────────────────────────────────────────────────
function ScreenNoteDetail() {
  return (
    <div className="screen" style={{ paddingTop: 47 }}>
      <AppBar title="Notes" back={() => {}} right={
        <button className="appbar-icon" style={{ color: 'var(--error)' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M6 6l1 14a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-14"/></svg>
        </button>
      }/>

      <div className="screen-scroll" style={{ padding: '4px 20px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--muted)', fontWeight: 600 }}>
          <span className="sonar-dot" style={{ width: 6, height: 6 }}/>
          <span style={{ textTransform: 'uppercase', letterSpacing: '0.08em' }}>Sauvegardée à l'instant</span>
        </div>

        {/* editable area */}
        <div style={{ marginTop: 12, fontSize: 16, lineHeight: 1.6, color: 'var(--charcoal)' }}>
          <p style={{ margin: '0 0 12px', fontWeight: 700, fontSize: 18 }}>
            Pitch — ordre des slides
          </p>
          <p style={{ margin: '0 0 12px' }}>
            Le narratif doit commencer par le <b>problème</b>, pas la solution.
            L'investisseur achète une vision avant un produit.
          </p>
          <p style={{ margin: '0 0 12px' }}>
            Ordre type :
          </p>
          <ul style={{ margin: '0 0 12px 0', paddingLeft: 20, color: 'var(--charcoal)' }}>
            <li>Slide 1 : <span style={{ color: 'var(--mira-red)', fontWeight: 600 }}>Anecdote</span> (pas de stats)</li>
            <li>Slide 2 : Problème</li>
            <li>Slide 3 : <span style={{ color: 'var(--mira-red)', fontWeight: 600 }}>Traction</span></li>
            <li>Slide 4 : Solution</li>
            <li>Slide 5 : Marché</li>
          </ul>
          <p style={{ margin: 0, color: 'var(--muted)' }}>
            <i>Sans traction, ne pas pitcher des investisseurs — pitcher des amis.</i>
          </p>
        </div>
      </div>

      {/* concepts footer */}
      <div style={{ padding: '14px 20px 12px', background: 'var(--warm-beige)', borderTop: '1px solid var(--rule)' }}>
        <div className="eyebrow" style={{ color: 'var(--muted)', marginBottom: 8 }}>Concepts</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
          <span className="chip chip-skill-primary">Pitch</span>
          <span className="chip">Storytelling</span>
          <button style={{
            background: 'transparent', border: '1px dashed var(--muted-soft)',
            borderRadius: 999, padding: '5px 12px',
            fontFamily: 'inherit', fontSize: 12, color: 'var(--muted)',
            display: 'inline-flex', alignItems: 'center', gap: 4, cursor: 'pointer',
          }}>{I.plus('#888', 12)} Concept</button>
        </div>
        <div style={{
          marginTop: 12, padding: '10px 12px',
          background: 'var(--card-bg)', border: '1px solid var(--rule)',
          borderRadius: 12, display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: 'rgba(230,51,42,0.08)', color: 'var(--mira-red)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>{I.bookOpen('#E6332A', 18)}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="caption" style={{ fontSize: 11, color: 'var(--muted)' }}>Liée au module</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--charcoal)' }}>Module 1 · Narratif investor</div>
          </div>
          {I.chevR('#B6B0A6', 16)}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, {
  ScreenNoteCreate, ScreenNotes, ScreenNoteDetail,
});
