// Step 8 — Candidate-side application status (post-submit)
window.MyApplication = function MyApplication({ go }) {
  const status = "submitted"; // submitted | inreview | validated | rejected
  const isEditable = status === "submitted"; // editable as long as not in review
  const submittedAt = "Aujourd'hui, 14:32";

  const STAGES = [
    { id: "submitted", label: "Candidature soumise", desc: "On a bien reçu — merci !" },
    { id: "inreview", label: "En examen", desc: "Un admin va relire ton dossier" },
    { id: "validated", label: "Validée", desc: "Ton profil est publié" },
  ];
  const currentIdx = STAGES.findIndex((s) => s.id === status);

  const Stat = ({ label, value, note }) => (
    <div style={{ padding: "16px 18px", background: "var(--warm-beige)", borderRadius: 12 }}>
      <div style={{ fontSize: 12, color: "var(--muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</div>
      <div style={{ fontSize: 22, fontFamily: "var(--font-serif)", fontWeight: 500, marginTop: 4, letterSpacing: "-0.01em" }}>{value}</div>
      {note && <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>{note}</div>}
    </div>
  );

  const Row = ({ label, value, editable, locked }) => (
    <div style={{ display: "grid", gridTemplateColumns: "180px 1fr auto", gap: 16, alignItems: "center", padding: "14px 0", borderBottom: "1px solid var(--rule)" }}>
      <span style={{ fontSize: 12.5, color: "var(--muted)", fontWeight: 500 }}>{label}</span>
      <span style={{ fontSize: 14, color: "var(--charcoal)" }}>{value}</span>
      {locked ? (
        <span style={{ fontSize: 11.5, color: "var(--muted)", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 4 }}>
          🔒 Verrouillé
        </span>
      ) : editable && isEditable ? (
        <button className="btn btn-ghost btn-sm" style={{ height: 28, padding: "0 10px", fontSize: 12 }}>Éditer</button>
      ) : null}
    </div>
  );

  return (
    <div>
      <window.PublicNav go={go} current="mentors" />
      <div className="shell" style={{ maxWidth: 920, paddingTop: 40, paddingBottom: 80 }}>
        {/* Success banner */}
        <div style={{
          padding: "22px 26px", borderRadius: 16,
          background: "linear-gradient(135deg, rgba(22,163,74,0.06) 0%, rgba(214,227,208,0.4) 100%)",
          border: "1px solid rgba(22,163,74,0.2)",
          display: "flex", alignItems: "center", gap: 18, marginBottom: 28,
        }}>
          <span style={{ width: 44, height: 44, borderRadius: 9999, background: "var(--success)", color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
            <window.Icon name="check" size={20} stroke={2.6} />
          </span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 18, fontFamily: "var(--font-serif)", fontWeight: 500 }}>
              Candidature reçue. <span style={{ fontStyle: "italic" }}>On revient vers toi sous 48 h.</span>
            </div>
            <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 4 }}>
              Soumise {submittedAt}. Tu seras notifié·e par e-mail à chaque changement de statut.
            </div>
          </div>
        </div>

        <h1 style={{ fontFamily: "var(--font-serif)", fontWeight: 500, fontSize: 36, letterSpacing: "-0.015em", margin: "0 0 8px" }}>
          Ma candidature
        </h1>
        <p style={{ color: "var(--muted)", fontSize: 14, margin: "0 0 32px" }}>
          Suis l'avancement et édite ton dossier tant qu'il n'est pas en examen.
        </p>

        {/* Progress track */}
        <div className="eyebrow" style={{ marginBottom: 12 }}>Avancement</div>
        <div className="status-track" style={{ gap: 10, marginBottom: 32 }}>
          {STAGES.map((s, i) => {
            const done = i < currentIdx;
            const active = i === currentIdx;
            return (
              <div key={s.id} className={"status-track-step" + (done ? " done" : active ? " active" : "")}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{
                    width: 22, height: 22, borderRadius: 9999,
                    background: done ? "var(--success)" : active ? "var(--mira-red)" : "transparent",
                    border: done || active ? "none" : "1.5px solid var(--muted-soft)",
                    color: "#fff", fontSize: 11, fontWeight: 700,
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                  }}>
                    {done ? <window.Icon name="check" size={12} stroke={3} /> : i + 1}
                  </span>
                  <span style={{ fontWeight: 600, fontSize: 13.5 }}>{s.label}</span>
                </div>
                <div style={{ fontSize: 12, color: "var(--muted)", paddingLeft: 30 }}>{s.desc}</div>
              </div>
            );
          })}
        </div>

        {/* Editable summary */}
        <div className="card" style={{ padding: 28 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
            <h3 style={{ margin: 0, fontSize: 19, fontWeight: 600 }}>Ton dossier</h3>
            <span style={{ fontSize: 12.5, color: isEditable ? "var(--charcoal)" : "var(--muted)", fontWeight: 500, display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 12px", background: isEditable ? "rgba(22,163,74,0.08)" : "var(--warm-beige)", borderRadius: 9999 }}>
              {isEditable ? "✎ Éditable" : "🔒 Verrouillé · en examen"}
            </span>
          </div>

          <div className="eyebrow" style={{ marginTop: 12, marginBottom: 4 }}>Identité <span style={{ color: "var(--muted)", textTransform: "none", letterSpacing: 0, fontWeight: 400 }}>· non modifiable</span></div>
          <Row label="Nom" value="Emma Rossi" locked />
          <Row label="Nomade depuis" value="3 – 5 ans" locked />

          <div className="eyebrow" style={{ marginTop: 22, marginBottom: 4 }}>Profil</div>
          <Row label="Bio courte" value="Designer brand pour DTC. Ex-Stripe, founder Brand Studio (200 k€ ARR)." editable />
          <Row label="Skills" value="★ Brand design · Content strategy · Webflow · DTC" editable />
          <Row label="Expériences" value="3 entrées" editable />

          <div className="eyebrow" style={{ marginTop: 22, marginBottom: 4 }}>Masterclass proposée</div>
          <Row label="Titre" value="Construire ta brand DTC en 30 jours" editable />
          <Row label="Format" value="20 h · Hybride (live + async)" editable />
          <Row label="Prix par apprenant" value="1 200 € · 25 % retenus par Mira" editable />
        </div>

        {/* What's next */}
        <div style={{ marginTop: 32, padding: "22px 26px", background: "var(--card-bg)", border: "1px solid var(--rule)", borderRadius: 16 }}>
          <div className="eyebrow" style={{ marginBottom: 10 }}>La suite</div>
          <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 12 }}>
            <li style={{ display: "flex", gap: 12, fontSize: 14, color: "var(--charcoal)", lineHeight: 1.55 }}>
              <span style={{ color: "var(--mira-red)", fontWeight: 700, minWidth: 18 }}>1.</span>
              <span>Un·e admin Mira relit ton dossier <strong>sous 48 h</strong> en moyenne.</span>
            </li>
            <li style={{ display: "flex", gap: 12, fontSize: 14, color: "var(--charcoal)", lineHeight: 1.55 }}>
              <span style={{ color: "var(--mira-red)", fontWeight: 700, minWidth: 18 }}>2.</span>
              <span>On peut t'envoyer un message pour clarifier un point. Tu seras notifié·e par mail.</span>
            </li>
            <li style={{ display: "flex", gap: 12, fontSize: 14, color: "var(--charcoal)", lineHeight: 1.55 }}>
              <span style={{ color: "var(--mira-red)", fontWeight: 700, minWidth: 18 }}>3.</span>
              <span>Si validé·e, ton profil et ta première Mira Class seront publiés sur l'annuaire.</span>
            </li>
          </ul>
        </div>

        <div style={{ marginTop: 24, display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button onClick={() => go("mentors")} className="btn btn-ghost">Voir l'annuaire</button>
          {isEditable && (
            <button onClick={() => go("apply")} className="btn btn-secondary">
              <window.Icon name="refresh" size={14} stroke={1.8} /> Reprendre l'édition
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
