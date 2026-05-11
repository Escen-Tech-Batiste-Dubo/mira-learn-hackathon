// Mira AI — suggestions panel + Coach Mira sidebar (addon for /mentors/apply)

window.MiraAILogo = function MiraAILogo({ size = 40 }) {
  return (
    <span style={{
      width: size, height: size, borderRadius: 9999,
      background: "conic-gradient(from 215deg at 50% 50%, #EFEAE5 0%, #F4D7C4 35%, #E6332A 65%, #B12420 80%, #EFEAE5 100%)",
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.6), 0 1px 2px rgba(0,0,0,0.06)",
      flexShrink: 0,
      position: "relative",
    }}>
      <span style={{
        width: size * 0.46, height: size * 0.46, borderRadius: 9999,
        background: "radial-gradient(circle at 35% 30%, #FFFFFF 0%, #EFEAE5 50%, #E2DCD3 100%)",
      }} />
    </span>
  );
};

// ─────────────────────────────── Suggestions data
window.AI_SUGGESTIONS_EMMA = [
  {
    title: "Construire ta brand DTC en 30 jours",
    desc: "De zéro à une identité de marque cohérente : positioning, naming, design system minimaliste. Pour fondateurs solo qui lancent leur première DTC.",
    skills: [{ label: "Brand design", primary: true }, { label: "Content strategy" }],
    demand: { kind: "hot", text: "31 nomades cherchent cette skill — 1 mentor l'enseigne actuellement" },
  },
  {
    title: "Webflow pro : du landing au site converting",
    desc: "Construire un site Webflow qui convertit, sans dev. CMS, animations, SEO de base — en pratique sur ton propre projet.",
    skills: [{ label: "Webflow", primary: true }, { label: "UI Design" }],
    demand: { kind: "warm", text: "22 nomades cherchent — 4 mentors l'enseignent" },
  },
  {
    title: "Content stratégie pour solo founders",
    desc: "Définir sa ligne édito, son pipeline de contenu, ses canaux. Pour ceux qui veulent vendre via le contenu sans devenir créateur full-time.",
    skills: [{ label: "Content strategy", primary: true }, { label: "Brand design" }],
    demand: { kind: "emerging", text: "Sujet émergent — 12 nomades, 0 mentor" },
  },
];

const DEMAND_STYLE = {
  hot:      { icon: "🔥", color: "var(--mira-red)", weight: 700, prefix: "Très demandé" },
  warm:     { icon: "👥", color: "var(--gold)",     weight: 600, prefix: "Demandé" },
  emerging: { icon: "🌱", color: "var(--muted)",    weight: 500, prefix: "Émergent" },
};

window.MiraAISuggestions = function MiraAISuggestions({ skillCount }) {
  const ready = skillCount >= 3;
  const [loading, setLoading] = React.useState(true);
  const [items, setItems] = React.useState(window.AI_SUGGESTIONS_EMMA);
  const [statuses, setStatuses] = React.useState(["pending", "pending", "pending"]); // pending|adopted|rejected|editing

  React.useEffect(() => {
    if (!ready) return;
    setLoading(true);
    const t = setTimeout(() => setLoading(false), 1800);
    return () => clearTimeout(t);
  }, [ready]);

  const regenerate = () => {
    setLoading(true);
    setStatuses(["pending", "pending", "pending"]);
    setTimeout(() => setLoading(false), 1800);
  };

  const setStatus = (i, s) => setStatuses((arr) => arr.map((x, j) => (j === i ? s : x)));

  // Panel header
  const header = (
    <div style={{ display: "flex", gap: 14, alignItems: "flex-start", marginBottom: 22 }}>
      <window.MiraAILogo size={44} />
      <div style={{ flex: 1 }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
          <span style={{ fontSize: 11.5, fontWeight: 700, color: "var(--mira-red)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Mira AI</span>
          <span style={{ width: 3, height: 3, borderRadius: 99, background: "var(--muted-soft)" }} />
          <span style={{ fontSize: 12, color: "var(--muted)" }}>OpenRouter · confidentiel</span>
        </div>
        <h3 style={{ margin: 0, fontFamily: "var(--font-serif)", fontWeight: 500, fontSize: 24, letterSpacing: "-0.01em", lineHeight: 1.2 }}>
          Mira AI t'a préparé 3 classes <span style={{ fontStyle: "italic" }}>que tu pourrais animer.</span>
        </h3>
        <p style={{ margin: "6px 0 0", fontSize: 14, color: "var(--muted)", maxWidth: 560 }}>
          On a croisé tes skills avec ce que nos apprenants cherchent. Adopte, modifie, ou demande-nous d'autres idées.
        </p>
      </div>
    </div>
  );

  // Not-yet-ready state (waiting for skills)
  if (!ready) {
    return (
      <section className="card" style={{ padding: 24, background: "linear-gradient(180deg, #FFFFFF 0%, #FBF8F4 100%)" }}>
        {header}
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "16px 18px", borderRadius: 12, background: "var(--warm-beige)", border: "1px dashed var(--muted-soft)", color: "var(--charcoal)", fontSize: 13.5 }}>
          <window.Icon name="info" size={16} color="var(--muted)" />
          Ajoute au moins 3 skills ci-dessus pour que Mira AI te propose des classes adaptées.
        </div>
      </section>
    );
  }

  const Skeleton = () => (
    <div style={{ display: "grid", gap: 14 }}>
      {[0, 1, 2].map((i) => (
        <div key={i} className="ai-skeleton" style={{
          padding: 22,
          border: "1px solid var(--rule)",
          borderRadius: 14,
          background: "var(--card-bg)",
        }}>
          <div className="sk-line" style={{ width: "62%", height: 18, borderRadius: 6 }} />
          <div className="sk-line" style={{ width: "92%", height: 11, marginTop: 14, borderRadius: 6 }} />
          <div className="sk-line" style={{ width: "78%", height: 11, marginTop: 8, borderRadius: 6 }} />
          <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
            <div className="sk-line" style={{ width: 90, height: 24, borderRadius: 9999 }} />
            <div className="sk-line" style={{ width: 70, height: 24, borderRadius: 9999 }} />
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <section className="card" style={{ padding: 24, background: "linear-gradient(180deg, #FFFFFF 0%, #FBF8F4 100%)" }}>
      {header}

      {loading ? <Skeleton /> : (
        <div style={{ display: "grid", gap: 14 }}>
          {items.map((it, i) => {
            const st = statuses[i];
            const d = DEMAND_STYLE[it.demand.kind];
            const adopted = st === "adopted";
            const rejected = st === "rejected";
            return (
              <article
                key={i}
                style={{
                  border: "1px solid " + (adopted ? "rgba(22,163,74,0.4)" : rejected ? "var(--rule)" : "var(--rule)"),
                  borderRadius: 14,
                  background: adopted ? "rgba(22,163,74,0.04)" : "var(--card-bg)",
                  padding: 20,
                  opacity: rejected ? 0.55 : 1,
                  transition: "opacity 200ms ease, border-color 200ms ease, background 200ms ease",
                }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                  <h4 style={{ margin: 0, fontFamily: "var(--font-serif)", fontWeight: 500, fontSize: 20, letterSpacing: "-0.005em", lineHeight: 1.25, flex: 1 }}>
                    {it.title}
                  </h4>
                  <span style={{ fontSize: 11.5, fontWeight: 600, color: d.color, padding: "3px 9px", borderRadius: 9999, background: it.demand.kind === "hot" ? "rgba(230,51,42,0.08)" : it.demand.kind === "warm" ? "rgba(212,168,83,0.12)" : "var(--warm-beige)", textTransform: "uppercase", letterSpacing: "0.04em", whiteSpace: "nowrap" }}>
                    {d.prefix}
                  </span>
                </div>

                <p style={{ margin: "10px 0 14px", fontSize: 14.5, color: "var(--charcoal)", lineHeight: 1.55 }}>
                  {it.desc}
                </p>

                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
                  {it.skills.map((s, j) => (
                    <span key={j} className={"chip" + (s.primary ? " chip-primary" : "")} style={{ fontSize: 12 }}>
                      {s.primary && <span style={{ fontSize: 10 }}>★</span>}
                      {s.label}
                    </span>
                  ))}
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", borderRadius: 10, background: "var(--warm-beige)", marginBottom: 16 }}>
                  <span style={{ fontSize: 15 }}>{d.icon}</span>
                  <span style={{ fontSize: 13, color: d.color, fontWeight: d.weight }}>
                    {it.demand.text}
                  </span>
                </div>

                {adopted ? (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "10px 12px", borderRadius: 10, background: "rgba(22,163,74,0.08)", border: "1px solid rgba(22,163,74,0.25)" }}>
                    <span style={{ fontSize: 13, color: "var(--success)", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 8 }}>
                      <window.Icon name="check" size={15} stroke={2.4} />
                      Suggestion adoptée · brouillon Mira Class créé
                    </span>
                    <button onClick={() => setStatus(i, "pending")} className="btn btn-ghost btn-sm" style={{ height: 30, padding: "0 10px", fontSize: 12 }}>
                      Annuler
                    </button>
                  </div>
                ) : rejected ? (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                    <span style={{ fontSize: 13, color: "var(--muted)" }}>Rejetée — Mira AI en gardera note.</span>
                    <button onClick={() => setStatus(i, "pending")} className="btn btn-ghost btn-sm" style={{ height: 30, padding: "0 10px", fontSize: 12 }}>
                      Revenir
                    </button>
                  </div>
                ) : (
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <button onClick={() => setStatus(i, "adopted")} className="btn btn-primary btn-sm">
                      <window.Icon name="check" size={14} stroke={2.4} /> Adopter cette suggestion
                    </button>
                    <button className="btn btn-secondary btn-sm">
                      ✎ Modifier
                    </button>
                    <button onClick={() => setStatus(i, "rejected")} className="btn btn-ghost btn-sm" style={{ color: "var(--muted)" }}>
                      <window.Icon name="x" size={14} stroke={2} /> Pas pour moi
                    </button>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}

      <div style={{ marginTop: 20, paddingTop: 18, borderTop: "1px solid var(--rule)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, flexWrap: "wrap" }}>
        <span style={{ fontSize: 12, color: "var(--muted)", maxWidth: 440 }}>
          Mira AI utilise OpenRouter. Ces suggestions sont confidentielles tant que tu n'as pas adopté.
        </span>
        <button onClick={regenerate} disabled={loading} className="btn btn-ghost btn-sm" style={{ opacity: loading ? 0.5 : 1 }}>
          <window.Icon name="refresh" size={14} stroke={1.8} /> Regénérer 3 nouvelles suggestions
        </button>
      </div>
    </section>
  );
};

// ─────────────────────────────── Coach Mira sidebar
const COACH_TIPS = {
  identity: { eyebrow: "Conseil identité", body: "Choisis un slug court et lisible — c'est l'URL que tu partageras pour te présenter. Pas de chiffres si possible." },
  expertise: { eyebrow: "Pendant ta bio", body: "Vise 150–200 caractères pour ta bio courte. Une phrase = ce que tu fais bien · ce que tu veux transmettre. Ex. \"Ex-VC, j'aide les fondateurs à pitcher pour leur première levée.\"" },
  experience: { eyebrow: "Pendant ton parcours", body: "Mets ton plus gros résultat chiffré en haut. 200 k€ ARR, 50 M€ closed, 10 ans d'XP — tout ce qui ancre." },
  cv: { eyebrow: "À propos du CV", body: "Un PDF propre suffit. L'IA extraira tes skills — tu pourras les corriger juste après." },
  motivation: { eyebrow: "Pendant ta motivation", body: "Ton \"pourquoi\" compte plus que ton CV. Pourquoi maintenant ? Qu'est-ce qui te ferait aimer accompagner d'autres nomades ?" },
  submit: { eyebrow: "Avant de soumettre", body: "Ta candidature est solide. Tu peux la soumettre — un admin te répond sous 48 h." },
};

window.CoachMira = function CoachMira({ section, onClose }) {
  const tip = COACH_TIPS[section] || COACH_TIPS.identity;
  const [q, setQ] = React.useState("");
  // Re-mount inner block on section change to trigger fade animation
  return (
    <aside style={{ width: 320, flexShrink: 0 }}>
      <div style={{ position: "sticky", top: 88, display: "flex", flexDirection: "column", gap: 14 }}>
        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <window.MiraAILogo size={44} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 600 }}>Mira</div>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                <span style={{ fontSize: 10.5, fontWeight: 700, color: "var(--mira-red)", textTransform: "uppercase", letterSpacing: "0.08em", padding: "2px 7px", background: "rgba(230,51,42,0.08)", borderRadius: 9999 }}>AI Coach</span>
                <span style={{ fontSize: 12, color: "var(--muted)", display: "inline-flex", alignItems: "center", gap: 4 }}>
                  <span style={{ width: 6, height: 6, borderRadius: 99, background: "var(--success)" }} /> en ligne
                </span>
              </div>
            </div>
            {onClose && (
              <button onClick={onClose} title="Masquer le coach" style={{ background: "transparent", border: 0, color: "var(--muted)", cursor: "pointer", padding: 4, display: "inline-flex" }}>
                <window.Icon name="x" size={16} />
              </button>
            )}
          </div>

          <div key={section} className="coach-tip" style={{ marginTop: 18, padding: "14px 16px", borderRadius: 12, background: "var(--warm-beige)" }}>
            <div className="eyebrow" style={{ marginBottom: 6, color: "var(--mira-red)" }}>{tip.eyebrow}</div>
            <p style={{ margin: 0, fontSize: 14, color: "var(--charcoal)", lineHeight: 1.55 }}>
              {tip.body}
            </p>
          </div>

          <div style={{ marginTop: 14 }}>
            <div style={{ position: "relative" }}>
              <input
                className="input"
                placeholder="Demande-moi quelque chose…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                style={{ paddingRight: 44, height: 42 }}
              />
              <button
                style={{
                  position: "absolute", right: 6, top: "50%", transform: "translateY(-50%)",
                  width: 32, height: 32, borderRadius: 8, border: 0,
                  background: q.trim() ? "var(--mira-red)" : "var(--warm-beige)",
                  color: q.trim() ? "#fff" : "var(--muted)", cursor: q.trim() ? "pointer" : "default",
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                  transition: "background 150ms ease",
                }}
                disabled={!q.trim()}
                title="Envoyer à Mira"
              >
                <window.Icon name="arrow" size={14} stroke={2.4} />
              </button>
            </div>
            <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 8, lineHeight: 1.5 }}>
              Mira répond en quelques secondes via OpenRouter. Tes échanges restent privés.
            </div>
          </div>
        </div>

        <div style={{ fontSize: 11.5, color: "var(--muted)", textAlign: "center", padding: "0 8px", lineHeight: 1.55 }}>
          Le coach est optionnel — tu peux soumettre ta candidature sans interagir avec lui.
        </div>
      </div>
    </aside>
  );
};
