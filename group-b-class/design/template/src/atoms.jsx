// Reusable atoms

const Avatar = ({ name = '', size = 'sm', variant }) => {
  const initials = name.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase();
  return <div className={`avatar ${size} ${variant || ''}`}>{initials}</div>;
};

const StatusBadge = ({ status, children }) => (
  <span className={`status-badge ${status}`}>{children || status.replace('_', ' ')}</span>
);

const Chip = ({ children, primary, removable, onRemove }) => (
  <span className={`chip ${primary ? 'primary' : ''} ${removable ? 'removable' : ''}`}>
    {children}
    {removable && (
      <span className="chip-x" onClick={onRemove}><I.X size={11}/></span>
    )}
  </span>
);

const Tab = ({ active, onClick, children, count }) => (
  <button className={`tab ${active ? 'is-active' : ''}`} onClick={onClick}>
    {children}
    {count != null && <span className="count">({count})</span>}
  </button>
);

const FilterTab = ({ active, onClick, label, count }) => (
  <button className={`filter-tab ${active ? 'is-active' : ''}`} onClick={onClick}>
    {label}{count != null && <span className="count">({count})</span>}
  </button>
);

const Segmented = ({ options, value, onChange }) => (
  <div className="segmented">
    {options.map(o => (
      <button key={o.value}
        className={`seg ${value === o.value ? 'is-active' : ''}`}
        onClick={() => onChange(o.value)}>
        {o.icon}{o.label}
      </button>
    ))}
  </div>
);

const Btn = ({ variant = 'secondary', size, icon, iconRight, children, onClick, type, disabled, style }) => (
  <button
    type={type || 'button'}
    disabled={disabled}
    onClick={onClick}
    className={`btn btn-${variant} ${size ? size : ''}`}
    style={{ opacity: disabled ? 0.4 : 1, pointerEvents: disabled ? 'none' : 'auto', ...style }}
  >
    {icon}
    {children}
    {iconRight}
  </button>
);

const Field = ({ label, hint, children }) => (
  <div className="field">
    {label && <label className="label">{label}{hint && <span className="label-hint">{hint}</span>}</label>}
    {children}
  </div>
);

const Card = ({ title, subtitle, children, action, padding }) => (
  <section className="card" style={{ padding: padding === false ? 0 : undefined }}>
    {(title || action) && (
      <div className="row between" style={{ marginBottom: subtitle ? 4 : 14 }}>
        {title && <h3 className="card-title">{title}</h3>}
        {action}
      </div>
    )}
    {subtitle && <div className="card-subtitle">{subtitle}</div>}
    {children}
  </section>
);

const Toast = ({ children, onClose }) => (
  <div className="toast">
    <I.CheckCircle size={16} style={{color: 'var(--success)'}}/>
    <span>{children}</span>
    <button className="btn btn-ghost-muted icon sm" onClick={onClose}><I.X size={14}/></button>
  </div>
);

const AutosaveToast = ({ seconds = 2 }) => (
  <div className="autosave-toast">
    <I.Check size={11}/> Modifications enregistrées il y a {seconds} s
  </div>
);

const Drawer = ({ open, onClose, children, wide }) => {
  if (!open) return null;
  return (
    <>
      <div className="scrim" onClick={onClose}/>
      <aside className={`drawer ${wide ? 'wide' : ''}`}>{children}</aside>
    </>
  );
};

const Modal = ({ open, onClose, children }) => {
  if (!open) return null;
  return (
    <>
      <div className="scrim" onClick={onClose}/>
      <div className="modal">{children}</div>
    </>
  );
};

const Callout = ({ icon, children, action, variant = 'gold' }) => (
  <div className={`callout ${variant}`}>
    <div className="callout-icon">{icon}</div>
    <div className="callout-body">{children}</div>
    {action}
  </div>
);

const LinkArrow = ({ children, onClick }) => (
  <a className="link-arrow" onClick={onClick}>
    {children} <I.ArrowRight size={14}/>
  </a>
);

Object.assign(window, {
  Avatar, StatusBadge, Chip, Tab, FilterTab, Segmented, Btn, Field, Card,
  Toast, AutosaveToast, Drawer, Modal, Callout, LinkArrow
});
