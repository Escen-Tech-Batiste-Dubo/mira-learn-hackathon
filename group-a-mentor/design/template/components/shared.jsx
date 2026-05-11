// Shared atoms: Avatar, Stars, Logo, Nav, Footer (admin/marketing)
const AVATAR_GRADIENTS = {
  AM: ["#E6332A", "#B12420"],
  MD: ["#D4A853", "#9A7A36"],
  DC: ["#1D1D1B", "#4A4A45"],
  SB: ["#63B1BB", "#3F7F87"],
  LG: ["#95C11F", "#658212"],
  ER: ["#E6332A", "#FF7A4D"],
  NK: ["#1D1D1B", "#6B7280"],
  CD: ["#D4A853", "#E6332A"],
  PW: ["#888888", "#4A4A45"],
};

function gradFor(initials) {
  return AVATAR_GRADIENTS[initials] || ["#888", "#444"];
}

window.Avatar = function Avatar({ initials, size = 44, ring = false }) {
  const [a, b] = gradFor(initials);
  const fs = Math.round(size * 0.38);
  return (
    <span
      className="avatar"
      style={{
        width: size,
        height: size,
        fontSize: fs,
        background: `linear-gradient(135deg, ${a} 0%, ${b} 100%)`,
        boxShadow: ring ? "0 0 0 4px #fff, 0 0 0 5px var(--rule)" : "none",
      }}
    >
      {initials}
    </span>
  );
};

window.Stars = function Stars({ rating, count, classes }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 10, fontSize: 13, color: "var(--charcoal)" }}>
      <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="var(--gold)" stroke="none" aria-hidden>
          <path d="M12 17.3l-6.18 3.7 1.64-7.03L2 9.24l7.19-.62L12 2l2.81 6.62L22 9.24l-5.46 4.73L18.18 21z"/>
        </svg>
        <span style={{ fontWeight: 600 }}>{rating.toFixed(1)}</span>
        <span style={{ color: "var(--muted)", fontWeight: 500 }}>({count})</span>
      </span>
      {classes != null && (
        <>
          <span style={{ width: 3, height: 3, borderRadius: 99, background: "var(--muted-soft)" }} />
          <span style={{ color: "var(--muted)" }}>{classes} classes</span>
        </>
      )}
    </span>
  );
};

window.MiraLearnLogo = function MiraLearnLogo({ admin = false }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
      <span
        style={{
          width: 28,
          height: 28,
          background: "var(--mira-red)",
          borderRadius: 8,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#fff",
          fontWeight: 700,
          fontSize: 14,
          letterSpacing: "-0.02em",
        }}
      >
        M
      </span>
      <span style={{ display: "inline-flex", alignItems: "baseline", gap: 6, fontSize: 15, fontWeight: 600 }}>
        Mira{" "}
        <span style={{ letterSpacing: "0.16em", fontSize: 12, color: "var(--mira-red)", fontWeight: 700 }}>
          LEARN
        </span>
        {admin && (
          <span style={{ color: "var(--muted)", fontWeight: 500, fontSize: 13, letterSpacing: 0 }}>
            · admin
          </span>
        )}
      </span>
    </span>
  );
};

window.PublicNav = function PublicNav({ go, current }) {
  const NavLink = ({ to, label }) => (
    <button
      onClick={() => go(to)}
      style={{
        background: "transparent",
        border: 0,
        font: "inherit",
        fontSize: 14,
        fontWeight: 500,
        color: current === to ? "var(--charcoal)" : "var(--muted)",
        padding: "8px 0",
        position: "relative",
      }}
    >
      {label}
      {current === to && (
        <span
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            height: 2,
            background: "var(--mira-red)",
            borderRadius: 2,
          }}
        />
      )}
    </button>
  );
  return (
    <div style={{ position: "sticky", top: 0, zIndex: 40, background: "rgba(239,234,229,0.85)", backdropFilter: "blur(10px)", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
      <div className="shell-wide" style={{ display: "flex", alignItems: "center", height: 64, gap: 36 }}>
        <window.MiraLearnLogo />
        <div style={{ display: "flex", gap: 26, marginLeft: 24 }}>
          <NavLink to="mentors" label="Mentors" />
          <NavLink to="catalogue" label="Catalogue" />
        </div>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 14 }}>
          <button
            onClick={() => go("apply")}
            className="btn btn-primary"
          >
            Devenir mentor
          </button>
        </div>
      </div>
    </div>
  );
};

window.AdminNav = function AdminNav({ go }) {
  return (
    <div style={{ background: "var(--card-bg)", borderBottom: "1px solid var(--rule)" }}>
      <div className="shell-wide" style={{ display: "flex", alignItems: "center", height: 56, gap: 24 }}>
        <window.MiraLearnLogo admin />
        <div style={{ marginLeft: 18, display: "flex", gap: 6 }}>
          <span style={{ fontSize: 13, color: "var(--charcoal)", fontWeight: 600, padding: "6px 12px", background: "var(--warm-beige)", borderRadius: 8 }}>
            Candidatures
          </span>
          <span style={{ fontSize: 13, color: "var(--muted)", padding: "6px 12px" }}>Mentors</span>
          <span style={{ fontSize: 13, color: "var(--muted)", padding: "6px 12px" }}>Classes</span>
          <span style={{ fontSize: 13, color: "var(--muted)", padding: "6px 12px" }}>Apprenants</span>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={() => go("mentors")} style={{ background: "transparent", border: 0, color: "var(--muted)", fontSize: 13, fontWeight: 500 }}>
            ↗ Voir le site public
          </button>
          <window.Avatar initials="JR" size={32} />
        </div>
      </div>
    </div>
  );
};

window.Icon = function Icon({ name, size = 16, stroke = 1.6, color = "currentColor" }) {
  const paths = {
    arrow: <path d="M5 12h14M13 5l7 7-7 7" />,
    arrowLeft: <path d="M19 12H5M12 19l-7-7 7-7" />,
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></>,
    chevronDown: <path d="m6 9 6 6 6-6" />,
    chevronUp: <path d="m6 15 6-6 6 6" />,
    plus: <path d="M12 5v14M5 12h14" />,
    minus: <path d="M5 12h14" />,
    upload: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="M17 8l-5-5-5 5" /><path d="M12 3v12" /></>,
    file: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /></>,
    linkedin: <><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 1 0-4 0v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></>,
    external: <><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><path d="M15 3h6v6"/><path d="M10 14 21 3"/></>,
    sparkle: <><path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8"/></>,
    pin: <><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/></>,
    check: <path d="M20 6 9 17l-5-5" />,
    x: <path d="M18 6 6 18M6 6l12 12" />,
    refresh: <><path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><path d="M21 3v5h-5"/></>,
    paperclip: <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>,
    info: <><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></>,
    quote: <><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.75-2-2-2H4c-1 0-2 1-2 2v8c0 1 1 2 2 2h3"/><path d="M15 21c3 0 7-1 7-8V5c0-1.25-.75-2-2-2h-4c-1 0-2 1-2 2v8c0 1 1 2 2 2h3"/></>,
    filter: <path d="M3 6h18M6 12h12M10 18h4"/>,
    sortDown: <><path d="M3 6h13"/><path d="M3 12h9"/><path d="M3 18h5"/><path d="m18 9 3 3-3 3"/><path d="M21 12H10"/></>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {paths[name]}
    </svg>
  );
};
