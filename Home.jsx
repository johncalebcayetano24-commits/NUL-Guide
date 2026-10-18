import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Badge, Button, Icon } from '../../components/UI';
import { useApp } from '../../state/AppContext';
import assets from '../../data/design-assets.json';
import '../../styles/home.css';

const shortcuts = [
  ['Find a Service', 'Get matched with the right office', '/student/find', 'imgIconSparkle1', 'purple'],
  ['Submit a Concern', 'Describe your problem or concern', '/student/submit', 'imgIconPencil1', 'mint'],
  ['Office Directory', 'Location, hours, and services', '/student/offices', 'imgIconPin1', 'lavender'],
  ['Directions & Contacts', 'Walk there or reach out', '/student/directions', 'imgIconCompass1', 'peach'],
  ['Track My Concern', 'Pending, In Progress, Resolved', '/student/concerns', 'imgIconChecksq', 'green'],
  ['Staff/Admin Panel', 'Manage requests and statuses', '/login?role=staff', 'imgIconShield', 'sand'],
];
const examples = ['Where can I get my school ID?', 'I need help with enrollment.', 'Where can I ask about my tuition?', 'I need medical assistance.', 'I forgot my NU account password.'];
const statuses = ['Pending', 'In Progress', 'Resolved'];
function date(value) { return new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'Asia/Manila' }); }

function ConcernPreview({ concern, office }) {
  const index = statuses.indexOf(concern.status);
  return <Link to={`/student/concerns/${concern.id}`} className="card home-concern"><header><code>{concern.id}</code><Badge status={concern.status} /></header><p className="home-concern-category">{concern.category} · {office?.name || 'Office'}</p><h3>{concern.title}</h3><div className="home-progress" aria-label={concern.status}>{statuses.map((status, i) => <div className={`${i <= index ? 'reached' : ''} ${i === index ? 'current' : ''}`} key={status}><span className="home-progress-dot" /><small>{status}</small></div>)}</div><footer><span>Submitted {date(concern.createdAt)}</span><span>Updated {date(concern.updatedAt)}</span></footer></Link>;
}

export default function Home() {
  const { data, session } = useApp();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');
  const notifications = data.notifications.filter(n => n.role === 'student').slice(0, 3);
  const concerns = data.concerns.filter(c => c.studentId === 'student-juan').sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 2);
  const submit = event => { event.preventDefault(); if (!query.trim()) return setError('Tell us what you need help with first.'); navigate(`/student/recommendation?q=${encodeURIComponent(query.trim())}`); };
  return <div className="home-grid"><div className="home-main"><section className="home-hero"><div className="home-campus-sketch"><img src={assets['student-home'].imgCampusSketch} alt="" /></div><p className="home-greeting">Good day, NUbie!</p><h1>How can we help you <span>today?</span></h1><p className="home-hero-description">Tell us what you need help with in your own words. Smart Match will point you to the right NU Laguna office.</p><form className="home-match-form" onSubmit={submit}><Icon name="sparkle" size={20} /><input aria-label="Describe what you need help with" placeholder="Tell us what you need help with…" value={query} onChange={event => { setQuery(event.target.value); setError(''); }} maxLength={1000} /><Button variant="gold" type="submit"><img src={assets['student-home'].imgIconSearch1} alt="" width={16} height={16} />Find My Service</Button></form>{error && <p className="home-match-error" role="alert">{error}</p>}<div className="home-examples"><span>Try:</span>{examples.map(example => <button key={example} type="button" onClick={() => navigate(`/student/recommendation?q=${encodeURIComponent(example)}`)}>{example}</button>)}</div></section>
    <section className="home-quick-section"><h2 className="eyebrow">Quick Access</h2><div className="home-shortcuts">{shortcuts.map(([title, description, path, image, color]) => <Link className="card home-shortcut" key={title} to={path}><div className="home-shortcut-top"><span className={`home-shortcut-icon ${color}`}><img src={assets['student-home'][image]} alt="" width={20} height={20} /></span><Icon name="chev" size={18} /></div><h3>{title}</h3><p>{description}</p></Link>)}</div></section>
    <section><div className="home-section-heading"><h2 className="eyebrow">Recent Concerns</h2><Link to="/student/concerns">View all</Link></div>{session.guest ? <div className="card home-guest-concerns"><p>Sign in to submit concerns and follow office responses.</p><Link className="btn btn-secondary" to="/login">Sign in</Link></div> : <div className="home-concerns">{concerns.map(concern => <ConcernPreview key={concern.id} concern={concern} office={data.offices.find(o => o.id === concern.officeId)} />)}</div>}</section>
  </div><aside className="home-aside"><section className="card home-notifications"><div className="home-section-heading"><h2>Notifications</h2><Link to="/student/notifications">View all</Link></div>{notifications.map(notification => <Link to={notification.concernId ? `/student/concerns/${notification.concernId}` : notification.officeId ? `/student/offices/${notification.officeId}` : '/student/announcements'} className="home-notification" key={notification.id}><h3>{notification.title}{!notification.read && <i />}</h3><p>{notification.message}</p><small>{date(notification.at)}</small></Link>)}</section>
    <section className="card home-hours"><header><h2>Office hours today</h2><span>Sample schedule</span></header>{['registrar', 'it', 'clinic', 'guidance', 'cashier'].map(id => data.offices.find(o => o.id === id)).filter(Boolean).map(office => <Link to={`/student/offices/${office.id}`} key={office.id}><span>{office.name}</span><strong className={/inactive|closed|opens/i.test(office.status) ? 'hours-soon' : ''}>{office.status === 'Active' ? 'Open' : office.status}</strong></Link>)}</section>
    <Link className="home-announcement" to="/student/announcements"><Icon name="mega" /><span><strong>Announcement</strong><small>Stay updated with the latest news and announcements from NU.</small></span><Icon name="chev" size={18} /></Link>
  </aside></div>;
}
