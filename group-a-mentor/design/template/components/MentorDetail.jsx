// Screen 2: /mentors/{slug} — fiche détail
window.MentorDetail = function MentorDetail({ go }) {
  const m = window.ANTOINE;
  return (
    <div>
      <window.PublicNav go={go} current="mentors" />

      {/* Breadcrumb */}
      <div className="shell-wide" style={{ paddingTop: 28 }}>
        <button
          onClick={() => go("mentors")}
          style={{ background: "transparent", border: 0, font: "inherit", color: "var(--muted)", fontSize: 13, fontWeight: 500, display: "inline-flex", alignItems: "center", gap: 8, padding: 0 }}
        >
          <window.Icon name="arrowLeft" size={14} stroke={1.8} /> Retour à l'annuaire
        </button>
      </div>

      {/* Hero */}
      <section style={{ paddingTop: 32, paddingBottom: 56 }}>
        <div className="shell-wide" style={{ display: "grid", gridTemplateColumns: "auto 1fr auto", gap: 32, alignItems: "center" }}>
          <window.Avatar initials={m.initials} size={120} ring />
          <div>
            <div className="eyebrow" style={{ color: "var(--mira-red)", marginBottom: 10 }}>Mira Mentor · Business</div>
            <h1 style={{
              fontFamily: "var(--font-serif)",
              fontWeight: 500,
              fontSize: 52,
              lineHeight: 1.05,
              letterSpacing: "-0.015em",
              margin: 0,
            }}>
              {m.name}
            </h1>
            <div style={{ marginTop: 10, fontSize: 18, color: "var(--charcoal)" }}>{m.headline}</div>
            <div style={{ marginTop: 14, display: "inline-flex", alignItems: "center", gap: 16 }}>
              <window.Stars rating={m.rating} count={m.reviews} classes={m.classes} />
              <span style={{ width: 3, height: 3, borderRadius: 99, background: "var(--muted-soft)" }} />
              <span style={{ fontSize: 13, color: "var(--muted)", display: "inline-flex", alignItems: "center", gap: 6 }}>
                <window.Icon name="pin" size={13} stroke={1.8} /> {m.location}
              </span>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, alignSelf: "stretch", justifyContent: "center" }}>
            <a href="#" className="btn btn-secondary btn-sm" style={{ width: 200 }}>
              <window.Icon name="linkedin" size={15} /> LinkedIn
            </a>
            <a href="#" className="btn btn-secondary btn-sm" style={{ width: 200 }}>
              <window.Icon name="external" size={15} /> antoine-martin.fr
            </a>
          </div>
        </div>
      </section>

      {/* 2-col body */}
      <section style={{ paddingBottom: 120 }}>
        <div className="shell-wide" style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 40, alignItems: "start" }}>
          {/* LEFT */}
          <div style={{ display: "flex", flexDirection: "column", gap: 40 }}>
            <div>
              <h3 className="serif" style={{ fontSize: 24, fontWeight: 500, margin: "0 0 16px", fontFamily: "var(--font-serif)" }}>À propos</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 14, color: "var(--charcoal)", fontSize: 15.5, lineHeight: 1.7 }}>
                {m.bio.map((p, i) => <p key={i} style={{ margin: 0 }}>{p}</p>)}
              </div>
            </div>

            <div>
              <h3 className="serif" style={{ fontSize: 24, fontWeight: 500, margin: "0 0 16px", fontFamily: "var(--font-serif)" }}>Skills enseignées</h3>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {m.skills.map((s, i) => (
                  <span key={i} className={"chip" + (s.primary ? " chip-primary" : "")} style={{ padding: "7px 14px", fontSize: 13.5 }}>{s.label}</span>
                ))}
                <span className="chip" style={{ padding: "7px 14px", fontSize: 13.5 }}>Storytelling deck</span>
                <span className="chip" style={{ padding: "7px 14px", fontSize: 13.5 }}>Q&A investor</span>
              </div>
            </div>

            <div>
              <h3 className="serif" style={{ fontSize: 24, fontWeight: 500, margin: "0 0 20px", fontFamily: "var(--font-serif)" }}>Parcours</h3>
              <div style={{ position: "relative", paddingLeft: 22 }}>
                <span style={{ position: "absolute", left: 5, top: 6, bottom: 6, width: 1, background: "var(--rule)" }} />
                {m.experience.map((e, i) => (
                  <div key={i} style={{ position: "relative", paddingBottom: i === m.experience.length - 1 ? 0 : 22 }}>
                    <span style={{ position: "absolute", left: -22, top: 7, width: 11, height: 11, borderRadius: 99, background: "var(--card-bg)", border: "2px solid var(--mira-red)" }} />
                    <div style={{ fontSize: 12, color: "var(--muted)", fontWeight: 600, letterSpacing: "0.02em" }}>{e.range}</div>
                    <div style={{ fontSize: 15.5, fontWeight: 600, marginTop: 2 }}>{e.role} · {e.company}</div>
                    <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 2 }}>{e.city}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT — class card sticky */}
          <div style={{ position: "sticky", top: 88 }}>
            <div className="eyebrow" style={{ marginBottom: 12 }}>Classes proposées</div>
            {m.classOffers.map((c, i) => (
              <div key={i} className="card" style={{ padding: 24 }}>
                <h4 style={{ margin: 0, fontSize: 19, fontWeight: 600, letterSpacing: "-0.01em", lineHeight: 1.25 }}>{c.title}</h4>
                <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, fontSize: 13 }}>
                  <div>
                    <div style={{ color: "var(--muted)", fontSize: 11.5, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600, marginBottom: 4 }}>Prix</div>
                    <div style={{ fontWeight: 600, fontSize: 15 }}>{c.price}</div>
                  </div>
                  <div>
                    <div style={{ color: "var(--muted)", fontSize: 11.5, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600, marginBottom: 4 }}>Format</div>
                    <div style={{ fontWeight: 600, fontSize: 15 }}>{c.format}</div>
                  </div>
                  <div>
                    <div style={{ color: "var(--muted)", fontSize: 11.5, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600, marginBottom: 4 }}>Capacité</div>
                    <div style={{ fontWeight: 600, fontSize: 15 }}>{c.capacity}</div>
                  </div>
                  <div>
                    <div style={{ color: "var(--muted)", fontSize: 11.5, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600, marginBottom: 4 }}>Sessions</div>
                    <div style={{ fontWeight: 600, fontSize: 15 }}>{c.modules}</div>
                  </div>
                </div>
                <div style={{ marginTop: 18, padding: "10px 12px", background: "var(--warm-beige)", borderRadius: 10, fontSize: 12.5, color: "var(--charcoal)", display: "inline-flex", alignItems: "center", gap: 8 }}>
                  <span style={{ width: 7, height: 7, borderRadius: 99, background: "var(--success)" }} />
                  {c.next}
                </div>
                <button className="btn btn-primary" style={{ width: "100%", marginTop: 18 }}>
                  Découvrir <window.Icon name="arrow" size={15} stroke={2} />
                </button>
              </div>
            ))}
            <div style={{ marginTop: 14, fontSize: 12, color: "var(--muted)", textAlign: "center", lineHeight: 1.5 }}>
              Paiement sécurisé. Annulation gratuite jusqu'à 7 jours avant.
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
