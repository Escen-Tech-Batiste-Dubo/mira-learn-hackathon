// Multi-step apply wizard — 7 steps + step 8 = status screen (separate route)

const { useState, useMemo, useEffect } = React;

// ──────────── Step shell + progress
function WizardProgress({ step, total, labels }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0" }}>
      {labels.map((lbl, i) => {
        const n = i + 1;
        const done = n < step;
        const active = n === step;
        return (
          <React.Fragment key={i}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0, flex: active ? "0 0 auto" : "0 0 auto" }}>
              <span style={{
                width: 26, height: 26, borderRadius: 9999,
                background: done ? "var(--mira-red)" : active ? "var(--charcoal)" : "transparent",
                border: done || active ? "none" : "1.5px solid var(--muted-soft)",
                color: done || active ? "#fff" : "var(--muted)",
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                fontSize: 12, fontWeight: 700,
                transition: "all 200ms ease",
                flexShrink: 0,
              }}>
                {done ? <window.Icon name="check" size={13} stroke={2.6} /> : n}
              </span>
              <span style={{
                fontSize: 12.5, fontWeight: active ? 600 : 500,
                color: active ? "var(--charcoal)" : done ? "var(--charcoal)" : "var(--muted)",
                whiteSpace: "nowrap",
                display: active ? "inline" : "none",
              }}>
                {lbl}
              </span>
              <span style={{ display: !active ? "inline" : "none", fontSize: 12.5, color: done ? "var(--charcoal)" : "var(--muted)", whiteSpace: "nowrap" }}>
                <span style={{ display: "none" }}>{lbl}</span>
              </span>
            </div>
            {i < labels.length - 1 && (
              <span style={{ flex: 1, height: 2, background: n < step ? "var(--mira-red)" : "var(--rule)", borderRadius: 2, transition: "background 250ms ease", minWidth: 16 }} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

function StepFrame({ eyebrow, title, subtitle, children }) {
  return (
    <div className="step-frame">
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <div className="eyebrow" style={{ color: "var(--mira-red)", marginBottom: 10 }}>{eyebrow}</div>
        <h2 style={{ fontFamily: "var(--font-serif)", fontWeight: 500, fontSize: 38, letterSpacing: "-0.015em", lineHeight: 1.1, margin: 0 }}>
          {title}
        </h2>
        {subtitle && <p style={{ margin: "12px 0 0", fontSize: 16, color: "var(--muted)", maxWidth: 560, lineHeight: 1.55 }}>{subtitle}</p>}
        <div style={{ marginTop: 32 }}>{children}</div>
      </div>
    </div>
  );
}

function WizardActions({ onBack, onNext, nextLabel = "Continuer", nextDisabled = false, hint }) {
  return (
    <div style={{ maxWidth: 720, margin: "40px auto 0", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
      <div>
        {onBack && (
          <button onClick={onBack} className="btn btn-ghost">
            <window.Icon name="arrowLeft" size={15} stroke={2} /> Retour
          </button>
        )}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        {hint && <span style={{ fontSize: 12.5, color: "var(--muted)" }}>{hint}</span>}
        <button onClick={onNext} disabled={nextDisabled} className="btn btn-primary" style={{ opacity: nextDisabled ? 0.45 : 1, cursor: nextDisabled ? "not-allowed" : "pointer" }}>
          {nextLabel} <window.Icon name="arrow" size={15} stroke={2} />
        </button>
      </div>
    </div>
  );
}

// ──────────── STEP 1 — Identity
function Step1({ data, set, onNext }) {
  const d = data.identity;
  const ok = d.firstName.trim() && d.lastName.trim() && d.nomadSince && d.priorClasses;
  return (
    <StepFrame
      eyebrow="Étape 1 · Identité"
      title={<>Commençons par <span style={{ fontStyle: "italic" }}>te connaître.</span></>}
      subtitle="On ne te demande que l'essentiel. Le reste arrive après."
    >
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
        <div>
          <label className="label">Prénom</label>
          <input className="input" placeholder="Emma" value={d.firstName} onChange={(e) => set({ identity: { ...d, firstName: e.target.value } })} />
        </div>
        <div>
          <label className="label">Nom</label>
          <input className="input" placeholder="Rossi" value={d.lastName} onChange={(e) => set({ identity: { ...d, lastName: e.target.value } })} />
        </div>
        <div style={{ gridColumn: "1 / -1" }}>
          <label className="label">Depuis combien de temps es-tu nomade ?</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {["Moins d'un an", "1 – 2 ans", "3 – 5 ans", "Plus de 5 ans", "Pas encore — je prépare le saut"].map((opt) => (
              <button
                key={opt}
                onClick={() => set({ identity: { ...d, nomadSince: opt } })}
                className={"chip chip-filter" + (d.nomadSince === opt ? " active" : "")}
                style={{ height: 38, padding: "0 16px", fontSize: 13.5 }}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
        <div style={{ gridColumn: "1 / -1" }}>
          <label className="label">As-tu déjà animé des masterclasses ?</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {[
              { v: "regular", l: "Oui, régulièrement" },
              { v: "few", l: "Quelques-unes" },
              { v: "informal", l: "Du mentoring informel" },
              { v: "never", l: "Jamais — ce serait une première" },
            ].map((opt) => (
              <button
                key={opt.v}
                onClick={() => set({ identity: { ...d, priorClasses: opt.v } })}
                className={"chip chip-filter" + (d.priorClasses === opt.v ? " active" : "")}
                style={{ height: 38, padding: "0 16px", fontSize: 13.5 }}
              >
                {opt.l}
              </button>
            ))}
          </div>
          {d.priorClasses === "never" && (
            <div style={{ marginTop: 10, padding: "10px 14px", background: "rgba(230,51,42,0.05)", borderRadius: 10, fontSize: 13, color: "var(--charcoal)" }}>
              Pas un souci — on t'accompagne pour ta première. La majorité de nos mentors n'avaient jamais enseigné avant Mira.
            </div>
          )}
        </div>
      </div>
      <WizardActions onNext={onNext} nextDisabled={!ok} />
    </StepFrame>
  );
}

// ──────────── STEP 2 — Import method
function Step2({ data, set, onNext, onBack }) {
  const choice = data.importMethod;
  const choose = (v) => set({ importMethod: v });

  const OptionCard = ({ id, icon, title, desc, recommended, children }) => (
    <button
      onClick={() => choose(id)}
      className="card-link"
      style={{
        textAlign: "left", padding: 22, background: "var(--card-bg)",
        border: "1.5px solid " + (choice === id ? "var(--mira-red)" : "var(--rule)"),
        borderRadius: 16, font: "inherit", cursor: "pointer",
        display: "flex", flexDirection: "column", gap: 14, position: "relative",
        transition: "border-color 180ms ease",
      }}
    >
      {recommended && (
        <span style={{ position: "absolute", top: 14, right: 14, fontSize: 10.5, fontWeight: 700, color: "var(--mira-red)", background: "rgba(230,51,42,0.1)", padding: "3px 9px", borderRadius: 9999, textTransform: "uppercase", letterSpacing: "0.06em" }}>
          Recommandé
        </span>
      )}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ width: 40, height: 40, borderRadius: 10, background: "var(--warm-beige)", display: "inline-flex", alignItems: "center", justifyContent: "center", color: "var(--mira-red)" }}>
          {icon}
        </span>
        <span style={{ fontSize: 16, fontWeight: 600 }}>{title}</span>
      </div>
      <p style={{ margin: 0, fontSize: 13.5, color: "var(--muted)", lineHeight: 1.55 }}>{desc}</p>
      {children}
    </button>
  );

  return (
    <StepFrame
      eyebrow="Étape 2 · Import"
      title={<>Comment tu veux <span style={{ fontStyle: "italic" }}>raconter ton parcours ?</span></>}
      subtitle="On peut analyser ton CV ou ton LinkedIn pour te faire gagner du temps. Tu pourras tout corriger après."
    >
      <div style={{ display: "grid", gap: 14 }}>
        <OptionCard
          id="linkedin"
          recommended
          icon={<window.Icon name="linkedin" size={20} stroke={1.8} />}
          title="Importer depuis LinkedIn"
          desc="On lit ton profil public, on en extrait tes expériences et skills. ~10 secondes."
        >
          {choice === "linkedin" && (
            <input className="input" placeholder="linkedin.com/in/emma-rossi" onClick={(e) => e.stopPropagation()} style={{ marginTop: 4 }} />
          )}
        </OptionCard>
        <OptionCard
          id="cv"
          icon={<window.Icon name="upload" size={20} stroke={1.8} />}
          title="Déposer mon CV (PDF)"
          desc="L'IA ingère ton CV et préremplit tes expériences, tes skills et un brouillon de bio."
        >
          {choice === "cv" && (
            <div onClick={(e) => e.stopPropagation()} style={{ padding: "16px 14px", border: "1.5px dashed var(--muted-soft)", borderRadius: 12, background: "var(--warm-beige)", textAlign: "center", fontSize: 13, color: "var(--muted)" }}>
              📎 Clique pour déposer ton PDF (max 5 Mo)
            </div>
          )}
        </OptionCard>
        <OptionCard
          id="manual"
          icon={<window.Icon name="file" size={20} stroke={1.8} />}
          title="Saisir manuellement"
          desc="Tu remplis toi-même chaque champ. Plus long mais total contrôle."
        />
      </div>
      <WizardActions onBack={onBack} onNext={onNext} nextDisabled={!choice} />
    </StepFrame>
  );
}

// ──────────── STEP 3.1 — Ingestion animation
function Step3Ingest({ data, onDone, onBack }) {
  const isLinkedIn = data.importMethod === "linkedin";
  const steps = [
    { l: "Extraction de tes expériences", t: 900 },
    { l: "Détection de tes skills", t: 1900 },
    { l: "Rédaction d'un brouillon de bio", t: 2900 },
  ];
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timers = steps.map((s, i) => setTimeout(() => setProgress(i + 1), s.t));
    const done = setTimeout(onDone, 3500);
    return () => { timers.forEach(clearTimeout); clearTimeout(done); };
  }, []);

  return (
    <StepFrame
      eyebrow="Étape 3 · Analyse"
      title={<>Mira analyse <span style={{ fontStyle: "italic" }}>ton parcours.</span></>}
      subtitle={"On lit " + (isLinkedIn ? "ton profil LinkedIn" : "ton CV") + " et on prépare ton dossier. Tu pourras tout ajuster ensuite."}
    >
      <div className="card" style={{ padding: 28, display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 6 }}>
          <window.MiraAILogo size={44} />
          <div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>Mira AI</div>
            <div style={{ fontSize: 12.5, color: "var(--muted)" }}>Confidentialité garantie · OpenRouter</div>
          </div>
        </div>
        {steps.map((s, i) => {
          const done = i < progress;
          const active = i === progress;
          return (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, opacity: i > progress ? 0.35 : 1, transition: "opacity 250ms ease" }}>
              <span style={{
                width: 22, height: 22, borderRadius: 9999,
                background: done ? "var(--success)" : active ? "transparent" : "transparent",
                border: done ? "none" : "1.5px solid " + (active ? "var(--mira-red)" : "var(--muted-soft)"),
                color: "#fff",
                display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 11,
                position: "relative",
                flexShrink: 0,
              }}>
                {done && <window.Icon name="check" size={12} stroke={3} />}
                {active && <span className="spinner-dot" />}
              </span>
              <span style={{ fontSize: 14, fontWeight: active ? 600 : 500, color: done ? "var(--charcoal)" : "var(--charcoal)" }}>
                {s.l}{active && "…"}
              </span>
            </div>
          );
        })}
      </div>
      <div style={{ marginTop: 18, textAlign: "center", fontSize: 12.5, color: "var(--muted)" }}>
        Cette étape dure environ 3 secondes.
      </div>
    </StepFrame>
  );
}

// ──────────── STEP 3.2 — Profile fields (prefilled if ingested)
const PREFILL = {
  shortBio: "Designer brand pour DTC. Ex-Stripe, founder Brand Studio (200 k€ ARR).",
  longBio: "10 ans en design de marque côté DTC. Après Stripe et BETC, j'ai monté Brand Studio — une agence à 4 personnes qui aide des nomades à construire une marque qui se vend sans pub.\n\nMon approche : visual identity claire, brand voice tenue, premier site qui convertit. Pas de fluff.",
  transmit: "Comment construire une marque DTC sans agence et sans pub, en 6 semaines. De positioning à site live.",
  why: "J'ai été nomade 4 ans avant d'avoir un revenu stable. Personne ne m'a dit qu'on pouvait construire une marque depuis un café à Canggu. Je veux raccourcir ce chemin pour d'autres.",
  skills: [
    { label: "Brand design", primary: true },
    { label: "Content strategy" },
    { label: "Webflow" },
    { label: "DTC" },
  ],
  experience: [
    { range: "2022 — 2025", role: "Founder", company: "Brand Studio", city: "Lisbonne" },
    { range: "2019 — 2022", role: "Brand Designer", company: "Stripe", city: "Dublin" },
    { range: "2016 — 2019", role: "Designer", company: "BETC", city: "Paris" },
  ],
};

function Step3Profile({ data, set, onNext, onBack }) {
  const p = data.profile;
  const ok = p.shortBio.trim().length > 20 && p.skills.length >= 3 && p.transmit.trim();
  const [newSkill, setNewSkill] = useState("");
  const addSkill = () => {
    if (!newSkill.trim()) return;
    set({ profile: { ...p, skills: [...p.skills, { label: newSkill.trim() }] } });
    setNewSkill("");
  };

  return (
    <StepFrame
      eyebrow="Étape 3 · Profil"
      title={<>Ton parcours, <span style={{ fontStyle: "italic" }}>ta voix.</span></>}
      subtitle={data.ingested ? "On a pré-rempli avec ce qu'on a trouvé. Corrige et précise comme tu le sens." : "Quelques minutes pour poser ce que tu enseignes et pourquoi."}
    >
      {data.ingested && (
        <div style={{ marginBottom: 20, padding: "12px 16px", background: "rgba(22,163,74,0.06)", borderRadius: 12, fontSize: 13, color: "var(--success)", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 10 }}>
          <window.Icon name="check" size={14} stroke={2.4} /> Pré-rempli par Mira AI · vérifie et ajuste
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 26 }}>
        <div>
          <label className="label">Bio courte <span style={{ color: "var(--muted)", fontWeight: 400 }}>· 255 caractères max</span></label>
          <textarea
            className="textarea"
            maxLength={255}
            value={p.shortBio}
            onChange={(e) => set({ profile: { ...p, shortBio: e.target.value } })}
            style={{ minHeight: 72 }}
          />
          <div className="help" style={{ display: "flex", justifyContent: "space-between" }}>
            <span>Affichée sur ta card dans l'annuaire.</span>
            <span>{p.shortBio.length} / 255</span>
          </div>
        </div>

        <div>
          <label className="label">Bio longue</label>
          <textarea
            className="textarea"
            value={p.longBio}
            onChange={(e) => set({ profile: { ...p, longBio: e.target.value } })}
            style={{ minHeight: 140 }}
          />
          <div className="help">Affichée dans la section "À propos" de ta fiche.</div>
        </div>

        <div>
          <label className="label">Skills <span style={{ color: "var(--muted)", fontWeight: 400 }}>· 3 minimum, 1 principale (★)</span></label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
            {p.skills.map((s, i) => (
              <span key={i} className={"chip" + (s.primary ? " chip-primary" : "")} style={{ paddingRight: 6 }}>
                <button
                  onClick={() => set({ profile: { ...p, skills: p.skills.map((x, j) => ({ ...x, primary: j === i })) } })}
                  style={{ background: "transparent", border: 0, font: "inherit", color: "inherit", display: "inline-flex", alignItems: "center", gap: 4, cursor: "pointer", padding: 0 }}
                >
                  {s.primary && <span style={{ fontSize: 11 }}>★</span>}
                  {s.label}
                </button>
                <button
                  onClick={() => set({ profile: { ...p, skills: p.skills.filter((_, j) => j !== i) } })}
                  style={{ marginLeft: 6, background: "transparent", border: 0, color: "inherit", opacity: 0.5, cursor: "pointer", padding: 0, display: "inline-flex" }}
                >
                  <window.Icon name="x" size={12} stroke={2.2} />
                </button>
              </span>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <input className="input" placeholder="Ajouter une skill (entrée)" value={newSkill} onChange={(e) => setNewSkill(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())} />
            <button onClick={addSkill} className="btn btn-secondary">Ajouter</button>
          </div>
        </div>

        <div>
          <label className="label">Expériences</label>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {p.experience.map((e, i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "180px 1fr 1fr 40px", gap: 8, alignItems: "center" }}>
                <input className="input" value={e.range} onChange={(ev) => {
                  const arr = [...p.experience]; arr[i] = { ...e, range: ev.target.value };
                  set({ profile: { ...p, experience: arr } });
                }} />
                <input className="input" value={e.role} onChange={(ev) => {
                  const arr = [...p.experience]; arr[i] = { ...e, role: ev.target.value };
                  set({ profile: { ...p, experience: arr } });
                }} />
                <input className="input" value={e.company + (e.city ? " · " + e.city : "")} onChange={(ev) => {
                  const arr = [...p.experience]; arr[i] = { ...e, company: ev.target.value, city: "" };
                  set({ profile: { ...p, experience: arr } });
                }} />
                <button
                  onClick={() => set({ profile: { ...p, experience: p.experience.filter((_, j) => j !== i) } })}
                  title="Supprimer"
                  style={{ width: 40, height: 44, background: "transparent", border: "1px solid var(--rule)", borderRadius: 12, cursor: "pointer", color: "var(--muted)" }}
                >
                  <window.Icon name="minus" size={16} />
                </button>
              </div>
            ))}
            <button
              onClick={() => set({ profile: { ...p, experience: [...p.experience, { range: "", role: "", company: "", city: "" }] } })}
              className="btn btn-secondary btn-sm"
              style={{ alignSelf: "start" }}
            >
              <window.Icon name="plus" size={14} stroke={2} /> Ajouter une ligne
            </button>
          </div>
        </div>

        <div>
          <label className="label">Ce que tu aimerais transmettre</label>
          <textarea
            className="textarea"
            value={p.transmit}
            onChange={(e) => set({ profile: { ...p, transmit: e.target.value } })}
            placeholder="Le savoir-faire concret que tu veux partager avec tes apprenants."
            style={{ minHeight: 90 }}
          />
        </div>

        <div>
          <label className="label">Pourquoi maintenant ?</label>
          <textarea
            className="textarea"
            value={p.why}
            onChange={(e) => set({ profile: { ...p, why: e.target.value } })}
            placeholder="Ton 'pourquoi' compte plus que ton CV."
            style={{ minHeight: 90 }}
          />
        </div>
      </div>

      <WizardActions onBack={onBack} onNext={onNext} nextDisabled={!ok} hint={!ok ? "Bio courte + 3 skills + transmission requis" : null} />
    </StepFrame>
  );
}

// ──────────── STEP 4 — Class topic suggestions
const AI_TOPICS = [
  {
    title: "Construire ta brand DTC en 30 jours",
    desc: "De zéro à une identité de marque cohérente : positioning, naming, design system minimaliste. Pour fondateurs solo qui lancent leur première DTC.",
    skills: ["Brand design", "Content strategy"],
    demand: "hot",
    demandText: "31 nomades cherchent · 1 mentor enseigne",
  },
  {
    title: "Webflow pro : du landing au site converting",
    desc: "Construire un site Webflow qui convertit, sans dev. CMS, animations, SEO de base — en pratique sur ton propre projet.",
    skills: ["Webflow", "UI Design"],
    demand: "warm",
    demandText: "22 nomades cherchent · 4 mentors enseignent",
  },
  {
    title: "Content stratégie pour solo founders",
    desc: "Définir sa ligne édito, son pipeline de contenu, ses canaux. Pour ceux qui veulent vendre via le contenu sans devenir créateur full-time.",
    skills: ["Content strategy", "Brand design"],
    demand: "emerging",
    demandText: "Émergent · 12 nomades, 0 mentor",
  },
];
const DEMAND_META = {
  hot:      { icon: "🔥", color: "var(--mira-red)", label: "Très demandé" },
  warm:     { icon: "👥", color: "var(--gold)",     label: "Demandé" },
  emerging: { icon: "🌱", color: "var(--muted)",    label: "Émergent" },
};

function Step4Topic({ data, set, onNext, onBack }) {
  const sel = data.classTopic;
  const [mode, setMode] = useState(sel.source || "ai"); // ai | manual
  const [loading, setLoading] = useState(true);
  const [custom, setCustom] = useState({ title: sel.source === "manual" ? sel.title : "", desc: sel.source === "manual" ? sel.desc : "" });

  useEffect(() => { const t = setTimeout(() => setLoading(false), 1400); return () => clearTimeout(t); }, []);

  const pickAI = (i) => {
    set({ classTopic: { source: "ai", index: i, title: AI_TOPICS[i].title, desc: AI_TOPICS[i].desc, skills: AI_TOPICS[i].skills } });
  };
  const useCustom = () => {
    set({ classTopic: { source: "manual", title: custom.title, desc: custom.desc, skills: [] } });
  };

  const ok = sel.title && (sel.desc || sel.source === "ai");

  return (
    <StepFrame
      eyebrow="Étape 4 · Ta masterclass"
      title={<>Mira AI te propose <span style={{ fontStyle: "italic" }}>3 sujets de classes.</span></>}
      subtitle="On a croisé tes skills avec ce que nos apprenants cherchent. Adopte une, modifie-la, ou propose la tienne."
    >
      <div style={{ display: "inline-flex", gap: 4, padding: 4, background: "var(--card-bg)", border: "1px solid var(--rule)", borderRadius: 12, marginBottom: 20 }}>
        <button onClick={() => setMode("ai")} className={"tab" + (mode === "ai" ? " active" : "")} style={{ padding: "8px 16px" }}>
          ✨ Suggestions Mira AI
        </button>
        <button onClick={() => setMode("manual")} className={"tab" + (mode === "manual" ? " active" : "")} style={{ padding: "8px 16px" }}>
          ✎ Proposer la mienne
        </button>
      </div>

      {mode === "ai" && (
        <div style={{ display: "grid", gap: 14 }}>
          {loading ? (
            [0, 1, 2].map((i) => (
              <div key={i} style={{ padding: 22, border: "1px solid var(--rule)", borderRadius: 14, background: "var(--card-bg)" }}>
                <div className="sk-line" style={{ width: "62%", height: 20, borderRadius: 6 }} />
                <div className="sk-line" style={{ width: "92%", height: 11, marginTop: 14, borderRadius: 6 }} />
                <div className="sk-line" style={{ width: "78%", height: 11, marginTop: 8, borderRadius: 6 }} />
              </div>
            ))
          ) : (
            AI_TOPICS.map((t, i) => {
              const d = DEMAND_META[t.demand];
              const picked = sel.source === "ai" && sel.index === i;
              return (
                <article
                  key={i}
                  onClick={() => pickAI(i)}
                  style={{
                    border: "1.5px solid " + (picked ? "var(--mira-red)" : "var(--rule)"),
                    background: picked ? "rgba(230,51,42,0.03)" : "var(--card-bg)",
                    borderRadius: 14, padding: 20, cursor: "pointer",
                    transition: "border-color 180ms ease, background 180ms ease",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                    <h4 style={{ margin: 0, fontFamily: "var(--font-serif)", fontWeight: 500, fontSize: 20, letterSpacing: "-0.005em", lineHeight: 1.25, flex: 1 }}>
                      {t.title}
                    </h4>
                    <span style={{ fontSize: 11.5, fontWeight: 600, color: d.color, padding: "3px 9px", borderRadius: 9999, background: t.demand === "hot" ? "rgba(230,51,42,0.08)" : t.demand === "warm" ? "rgba(212,168,83,0.12)" : "var(--warm-beige)", textTransform: "uppercase", letterSpacing: "0.04em", whiteSpace: "nowrap" }}>
                      {d.label}
                    </span>
                  </div>
                  <p style={{ margin: "10px 0 12px", fontSize: 14, color: "var(--charcoal)", lineHeight: 1.55 }}>{t.desc}</p>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {t.skills.map((s, j) => <span key={j} className={"chip" + (j === 0 ? " chip-primary" : "")} style={{ fontSize: 12 }}>{s}</span>)}
                    </div>
                    <span style={{ fontSize: 12.5, color: d.color, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 6 }}>
                      {d.icon} {t.demandText}
                    </span>
                  </div>
                  {picked && (
                    <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid var(--rule)", fontSize: 13, color: "var(--mira-red)", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 8 }}>
                      <window.Icon name="check" size={14} stroke={2.4} /> Sélectionnée · clique sur Continuer
                    </div>
                  )}
                </article>
              );
            })
          )}
        </div>
      )}

      {mode === "manual" && (
        <div className="card" style={{ padding: 22, display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label className="label">Titre de ta masterclass</label>
            <input
              className="input"
              placeholder="Ex. Pitcher pour lever 500 k€"
              value={custom.title}
              onChange={(e) => { const n = { ...custom, title: e.target.value }; setCustom(n); set({ classTopic: { source: "manual", title: n.title, desc: n.desc, skills: [] } }); }}
            />
          </div>
          <div>
            <label className="label">Description courte <span style={{ color: "var(--muted)", fontWeight: 400 }}>· max 300 caractères</span></label>
            <textarea
              className="textarea"
              maxLength={300}
              placeholder="Pour qui ? Quoi de concret à la fin ?"
              value={custom.desc}
              onChange={(e) => { const n = { ...custom, desc: e.target.value }; setCustom(n); set({ classTopic: { source: "manual", title: n.title, desc: n.desc, skills: [] } }); }}
              style={{ minHeight: 90 }}
            />
          </div>
        </div>
      )}

      <WizardActions onBack={onBack} onNext={onNext} nextDisabled={!ok} />
    </StepFrame>
  );
}

// ──────────── STEP 5 — Format
const MODES = [
  { v: "live",   l: "Live",   h: "Sessions synchrones en groupe" },
  { v: "async",  l: "Async",  h: "Vidéos + feedback différé" },
  { v: "hybrid", l: "Hybride", h: "Live + async combinés" },
];

function Step5Format({ data, set, onNext, onBack }) {
  const f = data.format;
  const ok = f.totalHours > 0 && f.mode;

  return (
    <StepFrame
      eyebrow="Étape 5 · Format"
      title={<>Comment veux-tu <span style={{ fontStyle: "italic" }}>la donner ?</span></>}
      subtitle="Durée totale et format de livraison. On s'adapte à ton mode de vie nomade."
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
        <div>
          <label className="label" style={{ marginBottom: 10 }}>Durée totale <span style={{ color: "var(--muted)", fontWeight: 400 }}>· en heures, contenu inclus</span></label>
          <div className="card" style={{ padding: 22 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
              <div style={{ flex: 1 }}>
                <input
                  type="range"
                  min="4" max="60" step="1"
                  value={f.totalHours || 16}
                  onChange={(e) => set({ format: { ...f, totalHours: +e.target.value } })}
                  style={{ width: "100%", accentColor: "var(--mira-red)" }}
                />
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, color: "var(--muted)", marginTop: 6, fontWeight: 500 }}>
                  <span>4 h</span>
                  <span>20 h</span>
                  <span>40 h</span>
                  <span>60 h</span>
                </div>
              </div>
              <div style={{ minWidth: 110, textAlign: "right" }}>
                <div style={{ fontSize: 36, fontFamily: "var(--font-serif)", fontWeight: 500, letterSpacing: "-0.01em", lineHeight: 1, color: "var(--charcoal)" }}>
                  {f.totalHours || 16}<span style={{ fontSize: 18, color: "var(--muted)", marginLeft: 4 }}>h</span>
                </div>
                <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 6 }}>
                  {(f.totalHours || 16) <= 10 ? "Format court" : (f.totalHours || 16) <= 24 ? "Format moyen" : "Format long"}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div>
          <label className="label" style={{ marginBottom: 10 }}>Format</label>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
            {MODES.map((m) => (
              <button
                key={m.v}
                onClick={() => set({ format: { ...f, mode: m.v } })}
                style={{
                  textAlign: "left", padding: "16px 18px", borderRadius: 12,
                  border: "1.5px solid " + (f.mode === m.v ? "var(--mira-red)" : "var(--rule)"),
                  background: f.mode === m.v ? "rgba(230,51,42,0.04)" : "var(--card-bg)",
                  cursor: "pointer", font: "inherit",
                }}
              >
                <div style={{ fontSize: 15, fontWeight: 600 }}>{m.l}</div>
                <div style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 4, lineHeight: 1.5 }}>{m.h}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <WizardActions onBack={onBack} onNext={onNext} nextDisabled={!ok} />
    </StepFrame>
  );
}

// ──────────── STEP 6 — Pricing simulation
function Step6Pricing({ data, set, onNext, onBack }) {
  const totalHours = data.format.totalHours || 16;
  const collectiveRate = 60;
  const individualRate = 120;
  const [pricing, setPricing] = useState(data.pricing && data.pricing.collectiveHours ? data.pricing : { collectiveHours: totalHours, individualHours: 2, capacity: 6 });

  useEffect(() => { set({ pricing }); }, [pricing]);

  const grossPerLearner = pricing.collectiveHours * collectiveRate + pricing.individualHours * individualRate;
  const totalGross = grossPerLearner * pricing.capacity;
  const platformFee = Math.round(totalGross * 0.25);
  const netForMentor = totalGross - platformFee;

  const fmt = (n) => n.toLocaleString("fr-FR") + " €";

  return (
    <StepFrame
      eyebrow="Étape 6 · Simulation"
      title={<>Voici <span style={{ fontStyle: "italic" }}>ce que ça peut rapporter.</span></>}
      subtitle="Estimation indicative basée sur ton format et nos prix recommandés par heure. Tu pourras ajuster avant publication."
    >
      <div className="card" style={{ padding: 28 }}>
        <div className="eyebrow" style={{ marginBottom: 14 }}>Paramètres</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 24 }}>
          <div>
            <label className="label">Heures collectives</label>
            <input
              type="number" min="0" max="100"
              className="input"
              value={pricing.collectiveHours}
              onChange={(e) => setPricing({ ...pricing, collectiveHours: +e.target.value || 0 })}
            />
            <div className="help">{collectiveRate} €/h recommandé</div>
          </div>
          <div>
            <label className="label">Heures individuelles</label>
            <input
              type="number" min="0" max="20"
              className="input"
              value={pricing.individualHours}
              onChange={(e) => setPricing({ ...pricing, individualHours: +e.target.value || 0 })}
            />
            <div className="help">{individualRate} €/h recommandé</div>
          </div>
          <div>
            <label className="label">Apprenants max</label>
            <input
              type="number" min="1" max="20"
              className="input"
              value={pricing.capacity}
              onChange={(e) => setPricing({ ...pricing, capacity: Math.max(1, +e.target.value || 1) })}
            />
            <div className="help">5 à 8 recommandés</div>
          </div>
        </div>

        <div style={{ paddingTop: 22, borderTop: "1px solid var(--rule)" }}>
          <div className="eyebrow" style={{ marginBottom: 14 }}>Simulation</div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div style={{ padding: "18px 20px", background: "var(--warm-beige)", borderRadius: 12 }}>
              <div style={{ fontSize: 12.5, color: "var(--muted)", fontWeight: 600 }}>Prix par apprenant</div>
              <div style={{ fontSize: 28, fontFamily: "var(--font-serif)", fontWeight: 500, marginTop: 6, letterSpacing: "-0.01em" }}>
                {fmt(grossPerLearner)}
              </div>
              <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>
                {pricing.collectiveHours} h collectif + {pricing.individualHours} h individuel
              </div>
            </div>
            <div style={{ padding: "18px 20px", background: "var(--warm-beige)", borderRadius: 12 }}>
              <div style={{ fontSize: 12.5, color: "var(--muted)", fontWeight: 600 }}>Recette brute (classe pleine)</div>
              <div style={{ fontSize: 28, fontFamily: "var(--font-serif)", fontWeight: 500, marginTop: 6, letterSpacing: "-0.01em" }}>
                {fmt(totalGross)}
              </div>
              <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>
                {pricing.capacity} apprenants × {fmt(grossPerLearner)}
              </div>
            </div>
          </div>

          <div style={{ marginTop: 18, padding: "18px 20px", borderRadius: 12, background: "rgba(230,51,42,0.04)", border: "1px solid rgba(230,51,42,0.15)", display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 18, alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 12.5, color: "var(--muted)", fontWeight: 600 }}>Mira retient</div>
              <div style={{ fontSize: 22, fontFamily: "var(--font-serif)", fontWeight: 500, marginTop: 4, color: "var(--muted)" }}>
                − {fmt(platformFee)}
              </div>
              <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 2 }}>25 % · organisation + promotion</div>
            </div>
            <div style={{ width: 1, height: 50, background: "rgba(230,51,42,0.2)" }} />
            <div>
              <div style={{ fontSize: 12.5, color: "var(--mira-red)", fontWeight: 700 }}>Pour toi (net)</div>
              <div style={{ fontSize: 32, fontFamily: "var(--font-serif)", fontWeight: 600, marginTop: 4, color: "var(--mira-red)", letterSpacing: "-0.01em" }}>
                {fmt(netForMentor)}
              </div>
              <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 2 }}>par session complète</div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 14, padding: "10px 14px", fontSize: 12.5, color: "var(--muted)", lineHeight: 1.55 }}>
        💡 Tu pourras donner cette masterclass plusieurs fois par an. Nos mentors les plus actifs en programment 4 à 6 sessions / an.
      </div>

      <WizardActions onBack={onBack} onNext={onNext} nextLabel="Continuer vers la soumission" />
    </StepFrame>
  );
}

// ──────────── STEP 7 — Review + accept + submit
function Step7Submit({ data, onSubmit, onBack }) {
  const [accept, setAccept] = useState(false);
  const [accept2, setAccept2] = useState(false);

  const Row = ({ label, value }) => (
    <div style={{ display: "grid", gridTemplateColumns: "180px 1fr", gap: 16, padding: "10px 0", borderBottom: "1px solid var(--rule)", fontSize: 13.5 }}>
      <span style={{ color: "var(--muted)", fontWeight: 500 }}>{label}</span>
      <span style={{ color: "var(--charcoal)", fontWeight: 500 }}>{value}</span>
    </div>
  );

  const dur = data.format.totalHours;
  const mod = MODES.find((m) => m.v === data.format.mode);

  return (
    <StepFrame
      eyebrow="Étape 7 · Récapitulatif"
      title={<>Une dernière relecture <span style={{ fontStyle: "italic" }}>avant de soumettre.</span></>}
      subtitle="Tu pourras éditer ces infos tant que l'équipe Mira n'a pas commencé l'examen."
    >
      <div className="card" style={{ padding: 26 }}>
        <div className="eyebrow" style={{ marginBottom: 8 }}>Profil</div>
        <Row label="Nom" value={data.identity.firstName + " " + data.identity.lastName} />
        <Row label="Bio courte" value={data.profile.shortBio} />
        <Row label="Skills" value={data.profile.skills.map((s) => s.label).join(" · ")} />

        <div className="eyebrow" style={{ marginTop: 24, marginBottom: 8 }}>Masterclass proposée</div>
        <Row label="Titre" value={data.classTopic.title || "—"} />
        <Row label="Durée totale" value={dur ? dur + " heures" : "—"} />
        <Row label="Format" value={mod ? mod.l + " · " + mod.h : "—"} />
        <Row label="Prix par apprenant" value={(data.pricing.collectiveHours * 60 + data.pricing.individualHours * 120) + " €"} />
      </div>

      <div style={{ marginTop: 22, display: "flex", flexDirection: "column", gap: 12 }}>
        <label style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "14px 18px", background: "var(--card-bg)", border: "1px solid var(--rule)", borderRadius: 12, cursor: "pointer" }}>
          <input type="checkbox" checked={accept} onChange={(e) => setAccept(e.target.checked)} style={{ marginTop: 3, accentColor: "var(--mira-red)", width: 18, height: 18 }} />
          <span style={{ fontSize: 13.5, lineHeight: 1.55 }}>
            J'accepte les <a href="#" style={{ color: "var(--mira-red)", textDecoration: "underline" }}>conditions mentor Mira</a> et le partage 75 / 25 sur les revenus de la masterclass.
          </span>
        </label>
        <label style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "14px 18px", background: "var(--card-bg)", border: "1px solid var(--rule)", borderRadius: 12, cursor: "pointer" }}>
          <input type="checkbox" checked={accept2} onChange={(e) => setAccept2(e.target.checked)} style={{ marginTop: 3, accentColor: "var(--mira-red)", width: 18, height: 18 }} />
          <span style={{ fontSize: 13.5, lineHeight: 1.55 }}>
            Je certifie que les informations ci-dessus sont exactes et que mon expertise est réelle.
          </span>
        </label>
      </div>

      <WizardActions onBack={onBack} onNext={onSubmit} nextLabel="Soumettre ma candidature" nextDisabled={!(accept && accept2)} />
    </StepFrame>
  );
}

// ──────────── Container
window.MentorsApply = function MentorsApply({ go }) {
  const [step, setStep] = useState(1);
  const [data, setData] = useState({
    identity: { firstName: "", lastName: "", nomadSince: "", priorClasses: "" },
    importMethod: null,
    ingested: false,
    profile: { shortBio: "", longBio: "", skills: [], experience: [], transmit: "", why: "" },
    classTopic: { source: null, title: "", desc: "", skills: [], index: null },
    format: { totalHours: 16, mode: "" },
    pricing: { collectiveHours: 16, individualHours: 2, capacity: 6 },
  });
  const set = (patch) => setData((d) => ({ ...d, ...patch }));

  const labels = ["Identité", "Import", "Profil", "Masterclass", "Format", "Simulation", "Soumission"];

  const next = () => { setStep((s) => Math.min(8, s + 1)); window.scrollTo(0, 0); };
  const back = () => { setStep((s) => Math.max(1, s - 1)); window.scrollTo(0, 0); };

  const goToStep3 = () => {
    if (data.importMethod === "manual") {
      set({ ingested: false });
      setStep(4 - 1); // skip 3.1 ingest, go straight to 3.2 (which is step internal number 3)
      setTimeout(() => window.scrollTo(0, 0), 0);
    } else {
      set({ ingested: false });
      setStep(3); // step 3 = ingest
      window.scrollTo(0, 0);
    }
  };

  const submit = () => {
    // Update the global APPLICATIONS entry for Emma so it reflects in admin
    try {
      const app = window.APPLICATIONS.find((a) => a.id === "emma-rossi");
      if (app) {
        app.status = "submitted";
        app.when = "à l'instant";
      }
    } catch (_) {}
    go("my-application");
  };

  // step routing: 1, 2, 3 ingest, 4 profile, 5 topic, 6 format, 7 pricing, 8 submit
  // user-facing wizard has 7 labels — step 3 (ingest) is collapsed visually into "Profil"
  let visualStep = step;
  if (step >= 4) visualStep = step - 1; // ingest step doesn't get its own label
  if (step === 3) visualStep = 3;

  return (
    <div>
      <window.PublicNav go={go} current="apply" />
      <div className="shell" style={{ maxWidth: 960, paddingTop: 36, paddingBottom: 80 }}>
        <button
          onClick={() => go("mentors")}
          style={{ background: "transparent", border: 0, font: "inherit", color: "var(--muted)", fontSize: 13, fontWeight: 500, display: "inline-flex", alignItems: "center", gap: 8, padding: 0, marginBottom: 20 }}
        >
          <window.Icon name="arrowLeft" size={14} stroke={1.8} /> Quitter
        </button>
        <WizardProgress step={visualStep} total={7} labels={labels} />
        <div style={{ marginTop: 32 }}>
          {step === 1 && <Step1 data={data} set={set} onNext={next} />}
          {step === 2 && <Step2 data={data} set={set} onNext={() => {
            if (data.importMethod === "manual") {
              setData((d) => ({ ...d, ingested: false, profile: { ...d.profile, skills: d.profile.skills.length ? d.profile.skills : [] } }));
              setStep(4); // skip ingest
            } else {
              setStep(3); // ingest screen
            }
            window.scrollTo(0, 0);
          }} onBack={back} />}
          {step === 3 && <Step3Ingest data={data} onDone={() => { setData((d) => ({ ...d, ingested: true, profile: { ...d.profile, ...PREFILL } })); setStep(4); window.scrollTo(0, 0); }} onBack={back} />}
          {step === 4 && <Step3Profile data={data} set={set} onNext={() => { setStep(5); window.scrollTo(0, 0); }} onBack={() => { setStep(data.importMethod === "manual" ? 2 : 3); window.scrollTo(0, 0); }} />}
          {step === 5 && <Step4Topic data={data} set={set} onNext={next} onBack={back} />}
          {step === 6 && <Step5Format data={data} set={set} onNext={next} onBack={back} />}
          {step === 7 && <Step6Pricing data={data} set={set} onNext={next} onBack={back} />}
          {step === 8 && <Step7Submit data={data} onSubmit={submit} onBack={back} />}
        </div>
      </div>
    </div>
  );
};
