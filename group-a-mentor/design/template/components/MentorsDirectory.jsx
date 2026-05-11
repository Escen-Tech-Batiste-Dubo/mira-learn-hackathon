// Screen 1: /mentors — annuaire public
const { useState, useMemo } = React;

window.MentorsDirectory = function MentorsDirectory({ go }) {
  const [cat, setCat] = useState("Tout");
  const [sort, setSort] = useState("rating");

  const categories = ["Tout", "Business", "Design", "Tech", "Soft", "Lifestyle"];

  const list = useMemo(() => {
    let arr = window.MENTORS.slice();
    if (cat !== "Tout") arr = arr.filter((m) => m.category === cat);
    if (sort === "rating") arr.sort((a, b) => b.rating - a.rating);
    if (sort === "classes") arr.sort((a, b) => b.classes - a.classes);
    if (sort === "alpha") arr.sort((a, b) => a.name.localeCompare(b.name));
    return arr;
  }, [cat, sort]);

  return (
    <div>
      <window.PublicNav go={go} current="mentors" />

      {/* Hero */}
      <section style={{ padding: "80px 0 56px" }}>
        <div className="shell-wide">
          <div style={{ maxWidth: 820 }}>
            <div className="eyebrow" style={{ marginBottom: 18 }}>Mira Mentors · Rejoins les {window.MENTORS.length} mentors validés</div>
            <h1 style={{
              fontFamily: "var(--font-serif)",
              fontWeight: 500,
              fontSize: "clamp(40px, 5.5vw, 64px)",
              lineHeight: 1.05,
              letterSpacing: "-0.015em",
              margin: 0,
              color: "var(--charcoal)",
            }}>
              Rejoins la communauté des Mira Mentors et <span style={{ fontStyle: "italic" }}>finance tes voyages grâce à ton expérience.</span>
            </h1>
            <p style={{
              marginTop: 22,
              fontSize: 18,
              color: "var(--muted)",
              maxWidth: 620,
              lineHeight: 1.55,
            }}>
              Transmets ce que tu sais faire à d'autres nomades, en petit groupe, depuis là où tu es. Mira AI t'aide à structurer ta première masterclass en quelques minutes.
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 32, flexWrap: "wrap" }}>
              <button onClick={() => go("apply")} className="btn btn-primary">
                Candidater comme mentor <window.Icon name="arrow" size={15} stroke={2} />
              </button>
              <a href="#mentors-list" style={{ fontSize: 14, fontWeight: 500, color: "var(--charcoal)", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6 }}>
                Découvrir les mentors actuels <window.Icon name="arrow" size={13} stroke={1.8} />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Filters */}
      <section>
        <div className="shell-wide" style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap", paddingBottom: 28 }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setCat(c)}
                className={"chip chip-filter" + (cat === c ? " active" : "")}
                style={{ height: 34, padding: "0 14px", fontSize: 13 }}
              >
                {c}
              </button>
            ))}
          </div>
          <div style={{ marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: 10, color: "var(--muted)" }}>
            <window.Icon name="sortDown" size={16} />
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="select"
              style={{ height: 36, padding: "0 36px 0 12px", width: "auto", fontSize: 13, fontWeight: 500, color: "var(--charcoal)" }}
            >
              <option value="rating">Rating ↓</option>
              <option value="classes">Classes ↓</option>
              <option value="alpha">Alphabétique</option>
            </select>
          </div>
        </div>
      </section>

      {/* Grid */}
      <section id="mentors-list" style={{ paddingBottom: 120 }}>
        <div className="shell-wide" style={{ marginBottom: 24 }}>
          <div className="eyebrow">Ils sont déjà mentors</div>
        </div>
        <div className="shell-wide" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
          {list.map((m) => (
            <button
              key={m.slug}
              onClick={() => go("mentor:" + m.slug)}
              className="card card-link"
              style={{ textAlign: "left", padding: 24, font: "inherit", cursor: "pointer", display: "flex", flexDirection: "column", gap: 16 }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <window.Avatar initials={m.initials} size={56} />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: 16, fontWeight: 600, letterSpacing: "-0.01em" }}>{m.name}</div>
                  <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {m.headline}
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <window.Stars rating={m.rating} count={m.reviews} classes={m.classes} />
              </div>

              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, minHeight: 26 }}>
                {m.skills.map((s, i) => (
                  <span key={i} className={"chip" + (s.primary ? " chip-primary" : "")}>{s.label}</span>
                ))}
              </div>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 4, paddingTop: 16, borderTop: "1px solid var(--rule)" }}>
                <span style={{ fontSize: 12.5, color: "var(--muted)", display: "inline-flex", alignItems: "center", gap: 6 }}>
                  <window.Icon name="pin" size={13} stroke={1.8} /> {m.location}
                </span>
                <span style={{ fontSize: 13, color: "var(--mira-red)", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 6 }}>
                  Voir le profil <window.Icon name="arrow" size={14} stroke={2} />
                </span>
              </div>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
};
