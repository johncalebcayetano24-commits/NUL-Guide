import { Children, cloneElement, isValidElement, useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import assets from '../data/design-assets.json';

const iconNames = { home: 'Home', sparkle: 'Sparkle', pin: 'Pin', list: 'List', bell: 'Bell', user: 'User', pencil: 'Pencil', compass: 'Compass', logout: 'Logout', search: 'Search', chev: 'Chev', checksq: 'Checksq', shield: 'Shield', clock: 'Clock', refresh: 'Refresh', mega: 'Mega', dash: 'Dash', inbox: 'Inbox', building: 'Building', users: 'Users', chat: 'Chat' };
export function Icon({ name, size = 20, className = '' }) {
  const variable = `imgIcon${iconNames[name] || name?.[0]?.toUpperCase() + name?.slice(1)}`;
  const src = assets['student-home']?.[variable] || assets['staff-dashboard']?.[variable];
  return src ? <img className={`icon ${className}`} src={src} width={size} height={size} alt="" aria-hidden="true" /> : <span className={`icon-fallback ${className}`} aria-hidden="true">{({ menu: '☰', x: '×', eye: '◉', info: 'ⓘ', arrow: '→', check: '✓' })[name] || '›'}</span>;
}

export function Button({ variant = 'primary', className = '', type = 'button', children, ...props }) {
  return <button type={type} className={`btn btn-${variant} ${className}`} {...props}>{children}</button>;
}
export function Badge({ status, children }) {
  return <span className={`badge badge-${String(status || children || '').toLowerCase().replaceAll(' ', '-')}`}>{status === 'Pending' && <Icon name="clock" size={12} />}{status === 'In Progress' && <Icon name="refresh" size={12} />}{status === 'Resolved' && <span aria-hidden="true">✓</span>}{children || status}</span>;
}
export function Avatar({ name = '', size = 38 }) {
  const initials = name === 'Maria Santos' ? 'MS' : name === 'Juan Dela Cruz' ? 'JD' : name.split(' ').filter(Boolean).map(x => x[0]).slice(0, 2).join('').toUpperCase() || 'G';
  return <span className="avatar" style={{ width: size, height: size, fontSize: size >= 60 ? 30 : 14 }} aria-label={name}>{initials}</span>;
}
export function PageHeader({ title, subtitle, action, children }) {
  return <div className="page-header"><div><h1>{title}</h1>{subtitle && <p className="muted">{subtitle}</p>}</div>{action || children}</div>;
}
export function Field({ label, error, children, className = '', hint }) {
  const id = useId();
  let firstId;
  let controlIndex = 0;
  const associate = nodes => Children.map(nodes, child => {
    if (!isValidElement(child)) return child;
    if (['input', 'select', 'textarea'].includes(child.type)) {
      const controlId = child.props.id || `${id}-control-${controlIndex++}`;
      firstId ||= controlId;
      return cloneElement(child, { id: controlId, 'aria-labelledby': child.props['aria-label'] ? undefined : id, 'aria-invalid': error ? true : child.props['aria-invalid'], 'aria-describedby': error ? `${id}-error` : child.props['aria-describedby'] });
    }
    return child.props.children ? cloneElement(child, {}, associate(child.props.children)) : child;
  });
  const fields = associate(children);
  return <div className={`field ${className}`}><label className="field-label" id={id} htmlFor={firstId}>{label}</label>{fields}{hint && <small className="muted">{hint}</small>}{error && <p className="field-error" id={`${id}-error`} role="alert">{error}</p>}</div>;
}
export function SearchInput({ value = '', onChange, placeholder = 'Search…', label, ...props }) {
  return <div className="search-input"><Icon name="search" size={18} /><input type="search" aria-label={label || placeholder} placeholder={placeholder} value={value} onChange={event => onChange(event.target.value)} {...props} /></div>;
}
export function EmptyState({ title = 'No results found', description, children }) {
  return <div className="empty-state"><Icon name="search" size={28} /><h2>{title}</h2>{description && <p className="muted">{description}</p>}{children}</div>;
}

export function Modal({ title, onClose, children, footer, wide = false, className = '' }) {
  const dialogRef = useRef(null);
  const titleId = useId();
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  useEffect(() => {
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const dialog = dialogRef.current;
    const focusables = () => [...dialog.querySelectorAll('button, a[href], input, select, textarea, [tabindex="0"]')].filter(element => !element.disabled && element.getClientRects().length);
    (focusables().find(element => element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') || focusables()[0] || dialog).focus();
    const keydown = event => {
      if (event.key === 'Escape') { event.preventDefault(); onCloseRef.current(); }
      if (event.key === 'Tab') {
        const elements = focusables();
        if (!elements.length) { event.preventDefault(); dialog.focus(); return; }
        if (event.shiftKey && document.activeElement === elements[0]) { event.preventDefault(); elements.at(-1).focus(); }
        else if (!event.shiftKey && document.activeElement === elements.at(-1)) { event.preventDefault(); elements[0].focus(); }
      }
    };
    document.addEventListener('keydown', keydown);
    return () => { document.body.style.overflow = previousOverflow; document.removeEventListener('keydown', keydown); if (previousFocus?.isConnected) previousFocus.focus(); };
  }, []);
  return createPortal(<div className="modal-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
    <section className={`modal ${wide ? 'modal-wide' : ''} ${className}`} role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1} ref={dialogRef}>
      <header className="modal-header"><h2 id={titleId}>{title}</h2><button type="button" className="icon-button modal-close" onClick={onClose} aria-label="Close dialog">×</button></header>
      <div className="modal-body">{children}</div>
      {footer && <footer className="modal-footer">{footer}</footer>}
    </section>
  </div>, document.body);
}

export function Brand({ staff = false, light = false }) {
  const page = staff ? 'staff-dashboard' : light ? 'student-login' : 'student-home';
  const files = assets[page];
  return <div className={`brand ${staff ? 'brand-staff' : ''} ${light ? 'brand-light' : ''}`} aria-label="NUL Guide">
    <div className="brand-shield" aria-hidden="true"><img className="shield-layer shield-layer-0" src={files.imgVector} alt="" /><img className="shield-layer shield-layer-1" src={files.imgVector1} alt="" /><img className="shield-layer shield-layer-2" src={files.imgVector2} alt="" /><strong className="shield-monogram">NUL</strong><small className="shield-guide">GUIDE</small></div>
    <div className="brand-copy"><div className="brand-wordmark"><span>NUL <b>Guide</b></span><img src={files.imgLogoCap} alt="" aria-hidden="true" /></div>{!light && <p>{staff ? 'Staff/Admin Panel' : 'NU Student Service Finder & Assistance Platform'}</p>}</div>
  </div>;
}
