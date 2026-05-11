// app.jsx — wires 12 Mira Learn screens into a DesignCanvas with iPhone frames.

const { useState } = React;

function PhoneFrame({ children, dark }) {
  return (
    <div style={{
      width: 390, height: 844,
      position: 'relative',
      background: dark ? '#000' : 'var(--warm-beige)',
      overflow: 'hidden',
      fontFamily: 'var(--font-sans)',
    }}>
      {/* status bar */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        height: 47, zIndex: 30,
        display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
        padding: '0 28px 6px',
        pointerEvents: 'none',
      }}>
        <span style={{ fontSize: 15, fontWeight: 700, color: dark ? '#fff' : '#1D1D1B' }}>9:41</span>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', color: dark ? '#fff' : '#1D1D1B' }}>
          <svg width="17" height="11" viewBox="0 0 17 11" fill="currentColor"><rect x="0" y="7" width="3" height="4" rx="0.5"/><rect x="4.5" y="5" width="3" height="6" rx="0.5"/><rect x="9" y="2.5" width="3" height="8.5" rx="0.5"/><rect x="13.5" y="0" width="3" height="11" rx="0.5"/></svg>
          <svg width="15" height="11" viewBox="0 0 15 11" fill="currentColor"><path d="M7.5 1C4.5 1 1.8 2.2 0 4l1.5 1.6C3 4.2 5.1 3.3 7.5 3.3s4.5.9 6 2.3L15 4C13.2 2.2 10.5 1 7.5 1z M3 6.5L4.5 8.1c.8-.8 1.9-1.3 3-1.3s2.2.5 3 1.3L12 6.5c-1.2-1.2-2.8-1.8-4.5-1.8S4.2 5.3 3 6.5zm2.5 2.5L7.5 11l2-2c-.5-.5-1.2-.8-2-.8s-1.5.3-2 .8z"/></svg>
          <svg width="25" height="11" viewBox="0 0 25 11"><rect x="0.5" y="0.5" width="21" height="10" rx="2.5" fill="none" stroke="currentColor" strokeOpacity="0.4"/><rect x="22.5" y="3.5" width="1.5" height="4" rx="0.5" fill="currentColor" opacity="0.4"/><rect x="2" y="2" width="18" height="7" rx="1.2" fill="currentColor"/></svg>
        </div>
      </div>
      <div style={{
        position: 'absolute', top: 11, left: '50%', transform: 'translateX(-50%)',
        width: 124, height: 36, borderRadius: 24, background: '#000', zIndex: 40,
      }}/>
      {children}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 50,
        height: 34, display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        paddingBottom: 8, pointerEvents: 'none',
      }}>
        <div style={{ width: 134, height: 5, borderRadius: 100, background: dark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.3)' }}/>
      </div>
    </div>
  );
}

function App() {
  const screens = [
    { id: 'splash',     label: '01 · Splash',           El: ScreenSplash },
    { id: 'login',      label: '02 · Login',            El: ScreenLogin },
    { id: 'list',       label: '03 · Programmes',       El: ScreenProgrammesList },
    { id: 'class',      label: '04 · Class detail',     El: ScreenClassDetail },
    { id: 'module',     label: '05 · Module + FAB',     El: ScreenModuleDetail },
    { id: 'newnote',    label: '06 · Note create sheet',El: ScreenNoteCreate },
    { id: 'notes',      label: '07 · Notes ✨ wow',     El: ScreenNotes },
    { id: 'notedetail', label: '08 · Note detail',      El: ScreenNoteDetail },
    { id: 'qcm',        label: '09 · QCM',              El: ScreenQCM },
    { id: 'result',     label: '10 · QCM résultat',     El: ScreenQCMResult },
    { id: 'community',  label: '11 · Communauté',       El: ScreenCommunity },
    { id: 'profile',    label: '12 · Profil',           El: ScreenProfile },
  ];

  return (
    <DesignCanvas header={<Header/>}>
      <DCSection
        id="story"
        title="Mira Learn · Mobile"
        subtitle="12 écrans Flutter · viewport 390×844 · persona Anna Lopez · wow feature : Notes regroupées par concept"
      >
        {screens.map(s => (
          <DCArtboard key={s.id} id={s.id} label={s.label} width={390} height={844}>
            <PhoneFrame><s.El/></PhoneFrame>
          </DCArtboard>
        ))}
      </DCSection>

      <DCSection
        id="handoff"
        title="Handoff Flutter — Groupe D"
        subtitle="Animations, composants et user flow"
      >
        <DCArtboard id="anim" label="Animations & transitions" width={560} height={844}>
          <HandoffAnimations/>
        </DCArtboard>
        <DCArtboard id="components" label="Composants Flutter à créer" width={560} height={844}>
          <HandoffComponents/>
        </DCArtboard>
        <DCArtboard id="flow" label="User flow (5 min · Anna)" width={560} height={844}>
          <HandoffFlow/>
        </DCArtboard>
      </DCSection>
    </DesignCanvas>
  );
}

function Header() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{
        fontFamily: 'var(--font-serif)',
        fontSize: 22, fontWeight: 700, color: 'var(--mira-red)', letterSpacing: '-0.01em',
      }}>
        Mira <span style={{ color: 'var(--charcoal)', fontStyle: 'italic', fontWeight: 500 }}>Learn</span>
      </div>
      <div style={{ fontSize: 12, color: 'rgba(60,50,40,0.7)' }}>
        Mobile companion · Groupe D · Flutter reference mockups
      </div>
    </div>
  );
}

function HandoffAnimations() {
  const items = [
    { s: '01 Splash',         t: 'Logo fade-in 400 ms + spinner persistant. Crossfade vers login (300 ms).' },
    { s: '03 → 04 → 05',      t: 'Push horizontal (Cupertino slide), 320 ms easeOutExpo.' },
    { s: '05 → 06 Sheet',     t: 'Bottom sheet slide-up + drag-to-dismiss. Backdrop fade 200 ms. Spring 380 ms.' },
    { s: '06 Note create',    t: 'Suggestions chips débouncées 800 ms · apparition fade+scale 0.96→1, stagger 60 ms.' },
    { s: '07 Notes · concept',t: 'WOW : skeleton 600 ms puis notes se regroupent (FLIP animation, 500 ms). Titres serif fade-in stagger.' },
    { s: '07 Notes · toggle', t: 'Segmented control : indicator slide horizontal 220 ms, fade contenu.' },
    { s: '08 Note detail',    t: 'Auto-save toast slide-down 240 ms, dismiss 2 s. Caret blink natif.' },
    { s: '09 QCM',            t: 'PageView swipe entre questions, progress bar tween 250 ms. Selection : ring 0→1 + scale 0.98→1.' },
    { s: '10 Résultat',       t: 'Émoji 🎉 spring (scale 0→1.1→1), titre fade-up 200 ms après. Skill card pulse vert 600 ms.' },
    { s: '11 Carte',          t: 'Dots sonar pulse 1.8 s loop. Tap dot → city sheet slide-up 280 ms.' },
    { s: '11 Feed',           t: 'Items entry slide-up stagger 80 ms à chaque scroll.' },
    { s: '12 Profil',         t: 'Compteur sessions tween (0 → 15) sur mount. Bottom nav switch fade 180 ms.' },
  ];
  return (
    <div style={{ background: 'var(--warm-beige)', height: '100%', padding: 28, overflow: 'auto' }}>
      <div className="eyebrow" style={{ color: 'var(--muted)' }}>Motion specs</div>
      <h2 style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em', margin: '6px 0 4px' }}>
        Animations <span className="serif-italic" style={{ color: 'var(--mira-red)' }}>Flutter</span>
      </h2>
      <p style={{ fontSize: 13, color: 'var(--muted)', margin: '0 0 22px' }}>
        Courbe par défaut : <code style={{ background: '#fff', padding: '1px 6px', borderRadius: 4 }}>Curves.easeOutExpo</code> · durées 180–600 ms · pas de bounce.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {items.map((it, i) => (
          <div key={i} className="card" style={{ padding: 14 }}>
            <div className="eyebrow" style={{ color: 'var(--mira-red)' }}>{it.s}</div>
            <p style={{ fontSize: 13, color: 'var(--charcoal)', margin: '4px 0 0', lineHeight: 1.5 }}>{it.t}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function HandoffComponents() {
  const comps = [
    { n: 'MiraAppBar',           u: 'Partout',             p: 'title, onBack?, trailing?' },
    { n: 'BottomNavBar',         u: 'Tabs 3-4-5-7-8-11-12',p: 'activeTab, onChange (programmes|notes|community|profile)' },
    { n: 'WarmAvatar',           u: 'Partout',             p: 'initials, size, variant (red|gold)' },
    { n: 'ProgramListCard',      u: 'Écran 03',            p: 'avatar, title, mentor, progress?, price?' },
    { n: 'ModuleListItem',       u: 'Écran 04',            p: 'index, title, progress, status, qcm, notes' },
    { n: 'ProgressRing',         u: '04/12',               p: 'value, size, color, child' },
    { n: 'SkillChip',            u: '04/07/12',            p: 'label, primary?, validated?' },
    { n: 'FabButton',            u: 'Écran 05 (et 07)',    p: 'icon, onTap' },
    { n: 'NoteCreateSheet',      u: 'Écran 06',            p: 'moduleId, onSave (text, concepts[])' },
    { n: 'ConceptSuggestChip',   u: '06',                  p: 'label, attached, onToggle (debounce 800ms upstream)' },
    { n: 'NotesViewToggle',      u: '07',                  p: 'mode (recent|concept|module), onChange' },
    { n: 'ConceptSerifHeader',   u: '07',                  p: 'title (Playfair 24), count, muted?' },
    { n: 'NoteCard',             u: '07/08',               p: 'body, meta, tags[]' },
    { n: 'NoteDetailEditor',     u: '08',                  p: 'markdown, autoSave (debounce 1.5s)' },
    { n: 'QuizQuestionWidget',   u: '09',                  p: 'question, options[], selected, total, current' },
    { n: 'QuizOptionCard',       u: '09',                  p: 'label, selected, correct? (post-submit)' },
    { n: 'ResultCelebration',    u: '10',                  p: 'score, max, skillValidated' },
    { n: 'CommunityToggle',      u: '11',                  p: 'mode (map|feed), onChange' },
    { n: 'CommunityMap',         u: '11 (map)',            p: 'sessions[] {city, lat, lng, n}, onTapCity' },
    { n: 'CitySheet',            u: '11 (map tap)',        p: 'city, sessions[]' },
    { n: 'FeedItem',             u: '11 (feed)',           p: 'kind (skill|class|session|note), text, loc, time' },
    { n: 'SettingRow',           u: '12',                  p: 'label, value?, onTap' },
    { n: 'MiraToast',            u: 'Global',              p: 'message, icon?, duration (3 s)' },
  ];
  return (
    <div style={{ background: 'var(--warm-beige)', height: '100%', padding: 28, overflow: 'auto' }}>
      <div className="eyebrow" style={{ color: 'var(--muted)' }}>Atoms & molecules</div>
      <h2 style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em', margin: '6px 0 4px' }}>
        Composants <span className="serif-italic" style={{ color: 'var(--mira-red)' }}>Flutter</span>
      </h2>
      <p style={{ fontSize: 13, color: 'var(--muted)', margin: '0 0 22px' }}>
        23 composants à créer · radius 16 (card) · 12 (button/input) · 999 (chip).
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {comps.map((c, i) => (
          <div key={i} className="card" style={{ padding: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
              <code style={{ fontSize: 14, fontWeight: 700, color: 'var(--mira-red)' }}>{c.n}</code>
              <span style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 500 }}>{c.u}</span>
            </div>
            <code style={{ fontSize: 11, color: 'var(--muted)' }}>{c.p}</code>
          </div>
        ))}
      </div>
    </div>
  );
}

function HandoffFlow() {
  const steps = [
    { n: 1,  t: 'App open',          d: 'Splash → login auto-fill' },
    { n: 2,  t: 'Tab Programmes',    d: '"Pitcher pour lever 500 k €" visible (50 %)' },
    { n: 3,  t: 'Tap class',         d: 'Voit Antoine + 2 modules' },
    { n: 4,  t: 'Tap Module 1',      d: 'Description + matériel + FAB +Note' },
    { n: 5,  t: 'FAB +Note',         d: 'Bottom sheet, tape "Le narratif…"' },
    { n: 6,  t: 'Suggestion IA',     d: 'Tap [Pitch] · Enregistrer · toast "Note enregistrée"' },
    { n: 7,  t: 'Lancer QCM',        d: '5 questions plein écran' },
    { n: 8,  t: 'Résultat 🎉',       d: '4/5 · skill Pitch investor validée' },
    { n: 9,  t: 'Tab Notes ✨',      d: 'Mode "Par concept" · regroupement IA — WOW' },
    { n: 10, t: 'Tab Communauté',    d: 'Feed : "Une nomade vient de valider Pitch investor · Portugal" (= elle)' },
    { n: 11, t: 'Tab Profil',        d: '✓ Pitch investor validée à l\'instant' },
  ];
  return (
    <div style={{ background: 'var(--warm-beige)', height: '100%', padding: 28, overflow: 'auto' }}>
      <div className="eyebrow" style={{ color: 'var(--muted)' }}>Demo storytelling · J3 · 5 min</div>
      <h2 style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em', margin: '6px 0 4px' }}>
        Anna <span className="serif-italic" style={{ color: 'var(--mira-red)' }}>Lopez</span>
      </h2>
      <p style={{ fontSize: 13, color: 'var(--muted)', margin: '0 0 22px' }}>
        Designer nomade à Lisbonne · skill cible <b>Pitch investor</b> · 3 notes prises avant la démo.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {steps.map(s => (
          <div key={s.n} style={{
            display: 'flex', gap: 14, alignItems: 'flex-start',
            background: 'var(--card-bg)', borderRadius: 16, border: '1px solid var(--rule)',
            padding: '12px 14px',
          }}>
            <div style={{
              width: 28, height: 28, borderRadius: 999, flexShrink: 0,
              background: s.n === 9 ? '#16A34A' : 'var(--mira-red)', color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, fontSize: 13,
            }}>{s.n}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--charcoal)' }}>{s.t}</div>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{s.d}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{
        marginTop: 18, padding: 14, borderRadius: 16,
        background: 'rgba(230,51,42,0.06)', border: '1px solid rgba(230,51,42,0.15)',
      }}>
        <div className="eyebrow" style={{ color: 'var(--mira-red)' }}>Empty states</div>
        <ul style={{ margin: '8px 0 0', padding: 0, listStyle: 'none', fontSize: 13, color: 'var(--charcoal)', lineHeight: 1.6 }}>
          <li>📝 <b>Notes vides</b> : « Prends ta première note pendant un module — Mira les regroupera par concept pour toi. »</li>
          <li>🏆 <b>Skills vides</b> : « Passe ton premier QCM pour valider ta skill. »</li>
          <li>🌍 <b>Feed vide</b> : « Pas encore d'activité. Reviens dans quelques heures. »</li>
        </ul>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
