// Screen 4: /admin/applications — backoffice list
window.AdminApplications = function AdminApplications({ go }) {
  const [tab, setTab] = React.useState("all");
  const all = window.APPLICATIONS;
  const counts = {
    all: all.length,
    submitted: all.filter((a) => a.status === "submitted").length,
    inreview: all.filter((a) => a.status === "inreview").length,
    validated: all.filter((a) => a.status === "validated").length,
    rejected: all.filter((a) => a.status === "rejected").length,
  };
  const filtered = tab === "all" ? all : all.filter((a) => a.status === tab);

  const TabBtn = ({ id, label }) => (
    <button onClick={() => setTab(id)} className={"tab" + (tab === id ? " active" : "")}>
      {label} <span className="tab-count">{counts[id]}</span>
    </button>
  );

  return (
    <div>
      <window.AdminNav go={go} />
      <div className="shell" style={{ maxWidth: 1080, paddingTop: 40, paddingBottom: 80 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 14, marginBottom: 8 }}>
          <h1 style={{
            fontFamily: "var(--font-serif)",
            fontWeight: 500,
            fontSize: 38,
            letterSpacing: "-0.015em",
            margin: 0,
          }}>
            Candidatures mentors
          </h1>
          <span style={{ fontSize: 14, color: "var(--muted)", fontWeight: 500 }}>{counts.all} au total</span>
        </div>
        <p style={{ color: "var(--muted)", fontSize: 14, margin: 0, marginBottom: 28 }}>
          Modère les nouvelles candidatures sous 48 h. L'IA pré-extrait les skills depuis les CV.
        </p>

        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18, flexWrap: "wrap" }}>
          <div className="tabs">
            <TabBtn id="all" label="Toutes" />
            <TabBtn id="submitted" label="Submitted" />
            <TabBtn id="inreview" label="In review" />
            <TabBtn id="validated" label="Validated" />
            <TabBtn id="rejected" label="Rejected" />
          </div>
          <div style={{ marginLeft: "auto", position: "relative", width: 280 }}>
            <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--muted)", pointerEvents: "none", display: "inline-flex" }}>
              <window.Icon name="search" size={15} stroke={1.8} />
            </span>
            <input className="input" placeholder="Rechercher un candidat…" style={{ paddingLeft: 36, height: 40 }} />
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="card" style={{ padding: 60, textAlign: "center" }}>
            <div style={{ fontSize: 16, fontWeight: 600 }}>Aucune candidature pour l'instant.</div>
            <div style={{ color: "var(--muted)", marginTop: 6 }}>Calme avant la tempête.</div>
          </div>
        ) : (
          <div className="card-flat" style={{ padding: 0, overflow: "hidden" }}>
            {filtered.map((a, i) => (
              <div
                key={a.id}
                onClick={() => go("app:" + a.id)}
                className="app-row"
                style={{
                  display: "grid",
                  gridTemplateColumns: "auto 1fr auto auto",
                  gap: 18,
                  alignItems: "center",
                  padding: "18px 22px",
                  borderTop: i === 0 ? "0" : "1px solid var(--rule)",
                }}
              >
                <window.Avatar initials={a.initials} size={42} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 15, fontWeight: 600 }}>{a.name}</span>
                    <span className={"status status-" + a.status}>{window.STATUS_LABEL[a.status]}</span>
                    {a.cvImported && (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11.5, color: "var(--mira-red)", fontWeight: 600, padding: "2px 8px", background: "rgba(230,51,42,0.08)", borderRadius: 9999 }}>
                        ✨ CV importé
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 13.5, color: "var(--muted)", marginTop: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {a.headline}
                  </div>
                </div>
                <span style={{ fontSize: 12.5, color: "var(--muted)", whiteSpace: "nowrap" }}>{a.when}</span>
                <span style={{ color: "var(--muted)", display: "inline-flex" }}>
                  <window.Icon name="arrow" size={16} />
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
