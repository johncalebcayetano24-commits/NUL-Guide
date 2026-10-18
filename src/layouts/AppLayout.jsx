import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Avatar, Brand, Icon, Modal } from '../components/UI';
import { useApp } from '../state/AppContext';

const studentNav = [['home', 'Home', 'home'], ['find', 'Find a Service', 'sparkle'], ['offices', 'Office Directory', 'pin'], ['concerns', 'My Concerns', 'list'], ['notifications', 'Notifications', 'bell'], ['profile', 'Profile', 'user']];
const staffNav = [['dashboard', 'Dashboard', 'dash'], ['concerns', 'Concerns', 'inbox'], ['offices', 'Offices', 'building'], ['students', 'Students', 'users'], ['notifications', 'Notifications', 'bell'], ['profile', 'Profile', 'user']];

function Sidebar({ staff, mobile = false, onNavigate }) {
  const { data, session, requestLogout } = useApp();
  const location = useLocation();
  const role = staff ? 'staff' : 'student';
  const unread = data.notifications.filter(n => n.role === role && !n.read).length;
  const name = staff ? 'Maria Santos' : session.guest ? 'Guest' : data.profile.name;
  const navLink = ([path, label, icon]) => <NavLink onClick={onNavigate} key={path} className={({ isActive }) => `sidebar-link ${isActive || (path === 'find' && location.pathname === '/student/recommendation') ? 'active' : ''}`} to={`/${role}/${path}`}><Icon name={icon} /><span>{label}</span>{path === 'notifications' && unread > 0 && <span className="unread-count">{unread}</span>}</NavLink>;
  return <aside className={`sidebar ${mobile ? 'sidebar-mobile' : ''}`} aria-label={`${staff ? 'Staff' : 'Student'} navigation`}>
    <Link to={`/${role}/${staff ? 'dashboard' : 'home'}`} className="brand-link" onClick={onNavigate}><Brand staff={staff} /></Link>
    <nav className="sidebar-nav" aria-label="Main navigation"><p className="nav-label">{staff ? 'STAFF' : 'STUDENT'}</p>{(staff ? staffNav : studentNav).map(navLink)}</nav>
    {!staff && <nav className="sidebar-nav quick-nav" aria-label="Quick links"><p className="nav-label">QUICK LINKS</p>{[['submit', 'Submit a Concern', 'pencil'], ['directions', 'Directions & Contacts', 'compass']].map(navLink)}</nav>}
    <div className="sidebar-spacer" />
    {!staff && <Link onClick={onNavigate} className="sidebar-help" to="/student/help">Help Center</Link>}
    <div className="sidebar-user"><Link onClick={onNavigate} to={`/${role}/profile`} className="sidebar-user-profile"><Avatar name={name} /><span><strong>{name}</strong><small>{staff ? 'IT Services Staff' : session.guest ? 'Browsing as a guest' : 'BSIT · 2nd Year'}</small></span></Link><button type="button" className="icon-button" onClick={() => { onNavigate?.(); requestLogout(); }} aria-label="Log out"><Icon name="logout" /></button></div>
  </aside>;
}

export default function AppLayout({ staff = false }) {
  const { data, session } = useApp();
  const [drawer, setDrawer] = useState(false);
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const role = staff ? 'staff' : 'student';
  const unread = data.notifications.some(n => n.role === role && !n.read);
  useEffect(() => setDrawer(false), [location.pathname]);
  const search = event => { event.preventDefault(); if (query.trim()) { navigate(`/${role}/${staff ? 'concerns' : 'offices'}?q=${encodeURIComponent(query.trim())}`); setQuery(''); } };
  return <div className={`app-shell ${staff ? 'staff-shell' : 'student-shell'}`}>
    <a href="#main-content" className="skip-link" onClick={event => { event.preventDefault(); const main = document.getElementById('main-content'); main?.focus(); main?.scrollIntoView({ block: 'start' }); }}>Skip to main content</a><Sidebar staff={staff} />
    <div className="app-content"><header className="topbar"><button className="icon-button mobile-menu" type="button" aria-label="Open navigation menu" aria-expanded={drawer} onClick={() => setDrawer(true)}><Icon name="menu" /></button><form className="topbar-search" role="search" onSubmit={search}><Icon name="search" size={18} /><input type="search" value={query} onChange={event => setQuery(event.target.value)} aria-label={staff ? 'Search reference numbers or students' : 'Search services and offices'} placeholder={staff ? 'Search reference numbers or students…' : 'Search services, offices, and more…'} /><button type="submit" className="sr-only">Search</button></form><div className="topbar-actions">{staff && <span className="topbar-staff">STAFF</span>}<Link className="topbar-bell icon-button" to={`/${role}/notifications`} aria-label="Open notifications"><Icon name="bell" />{unread && <span className="notification-dot" />}</Link><Link to={`/${role}/profile`} aria-label="Open profile"><Avatar name={staff ? 'Maria Santos' : session.guest ? 'Guest' : data.profile.name} /></Link></div></header><main id="main-content" className="main-content" tabIndex={-1}><Outlet /></main></div>
    {drawer && <Modal title="Navigation" className="navigation-dialog" onClose={() => setDrawer(false)}><Sidebar staff={staff} mobile onNavigate={() => setDrawer(false)} /></Modal>}
  </div>;
}
