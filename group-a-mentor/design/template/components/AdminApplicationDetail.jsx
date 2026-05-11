// Screen 5: /admin/applications/{id} — decision view
window.AdminApplicationDetail = function AdminApplicationDetail({ go }) {
  const a = window.APPLICATIONS[0]; // Emma Rossi
  const [comment, setComment] = React.useState("");
  return (
    <div>
      <window.AdminNav go={go} />
      <div className="shell" style={{ maxWidth: 880, paddingTop: 32, paddingBottom: 60 }}>
        <button
          onClick={() => go("applications")}
          style={{ background: "transparent", border: 0, font: "inherit", color: "var(--muted)", fontSize: 13, fontWeight: 500, display: "inline-flex", alignItems: "center", gap: 8, padding: 0, marginBottom: 24 }}
        >
          <window.Icon name="arrowLeft" size={14} stroke={1.8} /> Toutes les candidatures
        </button>

        {/* HEADER */}
        <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 36 }}>
          <window.Avatar initials={a.initials} size={72} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 style={{ fontFamily: "var(--font-serif)", fontWeight: 500, fontSize: 36, letterSpacing: "-0.015em", margin: 0, lineHeight: 1.1 }}>
              {a.name}
            </h1>
            <div style={{ fontSize: 16, color: "var(--charcoal)", marginTop: 6 }}>{a.headline}</div>
            <div style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 6 }}>Candidature reçue {a.when}</div>
          </div>
          <span className={"status status-" + a.status} style={{ fontSize: 12.5, padding: "5px 12px" }}>
            {window.STATUS_LABEL[a.status]}
          </span>
        </div>

        {/* SECTIONS */}
        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
          <div>
            <div className="eyebrow" style={{ marginBottom: 10 }}>Bio longue</div>
            <p style={{ fontSize: 15.5, color: "var(--charcoal)", lineHeight: 1.7, margin: 0, maxWidth: 760 }}>
              {a.bio}
            </p>
          </div>

          <div>
            <div className="eyebrow" style={{ marginBottom: 10 }}>Skills proposées</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {a.skillsProposed.map((s, i) => (
                <span key={i} className={"chip" + (s.primary ? " chip-primary" : "")}>
                  {s.primary && <span style={{ fontSize: 11 }}>★</span>}
                  {s.label}
                </span>
              ))}
            </div>
          </div>

          {a.masterclass && (
            <div>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 10, gap: 12, flexWrap: "wrap" }}>
                <div className="eyebrow" style={{ margin: 0 }}>Masterclass proposée <span style={{ color: "var(--muted)", fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>· à titre indicatif</span></div>
                {a.masterclass.origin === "ai-suggested" && (
                  <span style={{ fontSize: 11, fontWeight: 600, color: "var(--mira-red)", textTransform: "uppercase", letterSpacing: "0.06em" }}>✨ Suggérée par Mira AI</span>
                )}
              </div>
              <div className="card-flat" style={{ padding: 22, maxWidth: 760 }}>
                <h4 style={{ margin: 0, fontFamily: "var(--font-serif)", fontWeight: 500, fontSize: 22, letterSpacing: "-0.005em", lineHeight: 1.25 }}>
                  {a.masterclass.title}
                </h4>
                <p style={{ margin: "10px 0 14px", fontSize: 14.5, color: "var(--charcoal)", lineHeight: 1.55 }}>
                  {a.masterclass.description}
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 18 }}>
                  {a.masterclass.skills.map((s, i) => (
                    <span key={i} className={"chip" + (s.primary ? " chip-primary" : "")} style={{ fontSize: 12 }}>
                      {s.primary && <span style={{ fontSize: 10 }}>★</span>}
                      {s.label}
                    </span>
                  ))}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 14, paddingTop: 16, borderTop: "1px solid var(--rule)" }}>
                  {[
                    ["Durée", a.masterclass.params.duration],
                    ["Sessions", a.masterclass.params.sessions],
                    ["Format", a.masterclass.params.format],
                    ["Cohorte", a.masterclass.params.cohort],
                    ["Prix", a.masterclass.params.price],
                    ["Villes", a.masterclass.params.cities.join(" · ")],
                  ].map(([k, v]) => (
                    <div key={k}>
                      <div style={{ fontSize: 11, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>{k}</div>
                      <div style={{ fontSize: 14, fontWeight: 500, color: "var(--charcoal)" }}>{v}</div>
                    </div>
                  ))}
                </div>
                {a.masterclass.demand && (
                  <div style={{ marginTop: 16, padding: "10px 12px", borderRadius: 10, background: "rgba(230,51,42,0.06)", fontSize: 12.5, color: "var(--mira-red)", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 8 }}>
                    🔥 {a.masterclass.demand.text}
                  </div>
                )}
              </div>
            </div>
          )}

          <div>
            <div className="eyebrow" style={{ marginBottom: 14 }}>Parcours</div>
            <div style={{ position: "relative", paddingLeft: 22 }}>
              <span style={{ position: "absolute", left: 5, top: 6, bottom: 6, width: 1, background: "var(--rule)" }} />
              {a.experience.map((e, i) => (
                <div key={i} style={{ position: "relative", paddingBottom: i === a.experience.length - 1 ? 0 : 18 }}>
                  <span style={{ position: "absolute", left: -22, top: 7, width: 11, height: 11, borderRadius: 99, background: "var(--card-bg)", border: "2px solid var(--mira-red)" }} />
                  <div style={{ fontSize: 12, color: "var(--muted)", fontWeight: 600 }}>{e.range}</div>
                  <div style={{ fontSize: 15, fontWeight: 600, marginTop: 2 }}>{e.role} · {e.company}</div>
                  <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 2 }}>{e.city}</div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="eyebrow" style={{ marginBottom: 10 }}>Motivation</div>
            <blockquote style={{
              margin: 0,
              padding: "14px 20px",
              borderLeft: "3px solid var(--mira-red)",
              background: "rgba(230,51,42,0.04)",
              borderRadius: "0 12px 12px 0",
              fontStyle: "italic",
              fontFamily: "var(--font-serif)",
              fontSize: 17,
              lineHeight: 1.55,
              color: "var(--charcoal)",
              maxWidth: 760,
            }}>
              "{a.motivation}"
            </blockquote>
          </div>

          <div>
            <div className="eyebrow" style={{ marginBottom: 10 }}>Pièces jointes</div>
            <div className="card-flat" style={{ padding: 16, display: "flex", alignItems: "center", gap: 14, maxWidth: 500 }}>
              <span style={{ width: 40, height: 40, borderRadius: 10, background: "var(--warm-beige)", display: "inline-flex", alignItems: "center", justifyContent: "center", color: "var(--mira-red)" }}>
                <window.Icon name="file" size={18} stroke={1.8} />
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{a.cv.name}</div>
                <div style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 2, display: "inline-flex", alignItems: "center", gap: 6 }}>
                  {a.cv.size} {a.cv.aiExtracted && <>· <span style={{ color: "var(--mira-red)", fontWeight: 600 }}>✨ Skills extraites par IA</span></>}
                </div>
              </div>
              <button className="btn btn-secondary btn-sm">Ouvrir</button>
            </div>
          </div>
        </div>

        {/* DECISION BLOCK */}
        <div className="card" style={{ marginTop: 40, padding: 24, background: "var(--card-bg)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <span style={{ width: 28, height: 28, borderRadius: 8, background: "var(--warm-beige)", color: "var(--charcoal)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontWeight: 600 }}>
              <window.Icon name="check" size={14} stroke={2.5} />
            </span>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>Décision</h3>
          </div>
          <label className="label">Commentaire privé <span style={{ color: "var(--muted)", fontWeight: 400 }}>· visible uniquement par l'équipe Mira</span></label>
          <textarea
            className="textarea"
            placeholder="Ex. Très bon angle DTC. Vérifier ses references chez Stripe avant validation."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            style={{ minHeight: 90 }}
          />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 18, gap: 10, flexWrap: "wrap" }}>
            <button className="btn btn-destructive">
              <window.Icon name="x" size={15} stroke={2.2} /> Refuser
            </button>
            <div style={{ display: "flex", gap: 10, marginLeft: "auto" }}>
              <button className="btn btn-secondary">
                <window.Icon name="refresh" size={15} stroke={1.8} /> Mettre en examen
              </button>
              <button className="btn btn-primary">
                <window.Icon name="check" size={15} stroke={2.4} /> Valider {a.name.split(" ")[0]} comme mentor
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
