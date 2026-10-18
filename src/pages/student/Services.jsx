import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useApp } from '../../state/AppContext';
import { Button, EmptyState, Field, Modal, PageHeader, SearchInput } from '../../components/UI';
import { matchConcern } from '../../utils/matching';
import { assetPath } from '../../utils/assetPath';
import '../../styles/services.css';

const asset = (page, file) => assetPath(`/assets/services-${page}/${file}.svg`);
function Art({ page = 'detail', file, size = 20, ...props }) {
  return <img className="service-icon" src={asset(page, file)} width={size} height={size} alt="" aria-hidden="true" {...props} />;
}
const officePath = (office) => `/student/offices/${encodeURIComponent(office.id)}`;
const directionsPath = (office) => `/student/directions?office=${encodeURIComponent(office.id)}`;
const submitPath = (office, description = '') => `/student/submit?office=${encodeURIComponent(office.id)}${description ? `&description=${encodeURIComponent(description)}` : ''}`;
const categories = ['All', 'Academic', 'Admin', 'Finance', 'Health', 'Student Life', 'Tech'];
const roomOf = (office) => /^\d+[a-z]?$/i.test(String(office.room || '')) ? `Room ${office.room}` : office.room;
const locationOf = (office) => [office.building, office.floor, roomOf(office)].filter(Boolean).join(', ');
const serviceSummary = (office) => office.services.slice(0, 3).map((service) => ({
  'Student portal access': 'Portal access',
  'NU account & password reset': 'Password resets',
  'Campus Wi-Fi connection': 'Wi-Fi help',
})[service] || service).join(', ');
const clockRange = (value) => String(value).replace(/(\d{1,2})(?::(\d{2}))?\s*(AM|PM)/gi, (_, hour, minute, meridiem) => `${hour}:${minute || '00'} ${meridiem.toUpperCase()}`).replace(/\s*[–-]\s*/g, ' – ');
const phoneLink = (phone) => {
  const [number, extension] = String(phone || '').split(/\s*(?:loc\.?|ext\.?)\s*/i);
  return `tel:${number.replace(/[^+\d]/g, '')}${extension ? `;ext=${extension.replace(/\D/g, '')}` : ''}`;
};
function department(office) {
  if (office.department) return office.department;
  if (/it services/i.test(office.name)) return 'Information Technology Department';
  if (/registrar/i.test(office.name)) return 'Office of the Registrar';
  if (/cashier/i.test(office.name)) return 'Finance and Accounting Department';
  if (/guidance/i.test(office.name)) return 'Guidance and Counseling Office';
  if (/clinic/i.test(office.name)) return 'Health Services Office';
  if (/student affairs/i.test(office.name)) return 'Office of Student Affairs';
  return `${office.category} Services`;
}
function availability(office) {
  const status = String(office.status || 'Open');
  if (/clos|inactive|unavailable/i.test(status)) return { label: /inactive/i.test(status) ? 'Unavailable' : 'Closed', tone: 'closed' };
  if (/opens/i.test(status)) return { label: status, tone: 'soon' };
  return { label: 'Open now', tone: 'open' };
}
function OfficeStatus({ office }) {
  const { label, tone } = availability(office);
  return <span className={`office-availability ${tone}`}><Art page="directory" file={tone === 'open' ? '9daa6' : 'e72a8'} size={12} />{label}</span>;
}
function OfficeTile({ office, large = false }) {
  let file = { Academic: '2b019', Admin: '2b019', Finance: '107ef', Health: 'b3d43', 'Student Life': 'f6b9e', Tech: '785a8' }[office.category] || '2b019';
  if (/guidance/i.test(office.name)) file = 'e6c53';
  const isItDetail = large && /it services/i.test(office.name);
  return <span className={`office-tile category-${office.category?.toLowerCase().replace(/\s/g, '-')} ${/guidance/i.test(office.name) ? 'category-guidance' : ''} ${large ? 'large' : ''}`}><Art page={isItDetail ? 'detail' : 'directory'} file={isItDetail ? '2743b' : file} size={large ? 26 : 20} /></span>;
}
function Back({ to = '/student/offices' }) {
  return <Link className="service-back" to={to}><Art file="96561" size={16} />Back</Link>;
}
function NumberedSteps({ steps }) {
  return <ol className="service-steps">{steps.map((step, index) => <li key={step}><span>{index + 1}</span><p>{step}</p></li>)}</ol>;
}

export function FindService() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [query, setQuery] = useState(params.get('q') || '');
  const [error, setError] = useState('');
  const examples = ['Where can I get my school ID?', 'I need help with enrollment.', 'Where can I ask about my tuition?', 'I need medical assistance.'];
  const services = [
    { title: 'Concern Submission', description: 'Describe your problem or concern', path: '/student/submit', file: 'a567f', color: 'mint' },
    { title: 'Office Directory', description: 'View location, hours, and services', path: '/student/offices', file: 'fb300', color: 'lavender' },
    { title: 'Directions & Contacts', description: 'Get directions or contact the office', path: '/student/directions', file: '80834', color: 'peach' },
    { title: 'Concern Tracking', description: 'Submit and track concerns online', path: '/student/concerns', file: 'bd310', color: 'green' },
    { title: 'Announcements', description: 'News and updates from NU Laguna', path: '/student/announcements', file: 'e28aa', color: 'yellow' },
  ];
  const faqs = [
    ['How do I reset my student portal password?', 'IT Services handles portal access and password resets. Use Smart Match or open the IT Services office to find contact options.'],
    ['Where is the Registrar’s Office located?', 'The Registrar’s Office is in the Admin Building, Ground Floor. Open the Office Directory for its room and directions.'],
    ['What happens after I submit a concern?', 'You receive a reference number. Track the status, staff responses, and progress history under My Concerns.'],
    ['Can I use NUL Guide if I’m not sure which office to go to?', 'Yes. Describe your concern in Smart Match and we will compare the words with the services in the office directory.'],
  ];
  function find(event) {
    event.preventDefault();
    if (query.trim().length < 3) { setError('Please describe your concern in at least 3 characters.'); return; }
    navigate(`/student/recommendation?q=${encodeURIComponent(query.trim())}`);
  }
  return <div className="services-page">
    <PageHeader title="Find a Service" subtitle="Everything NUL Guide can help you with" />
    <div className="services-layout">
      <div className="services-main">
        <section className="service-smart-panel">
          <span className="eyebrow">Smart Match</span>
          <h2>What do you need help with?</h2>
          <p>Write it the way you’d ask a classmate. We’ll recommend the office that can help.</p>
          <form onSubmit={find} className="service-smart-form" noValidate>
            <Art page="find" file="74066" size={20} />
            <input aria-label="Describe what you need help with" placeholder="Tell us what you need help with…" value={query} onChange={(event) => { setQuery(event.target.value); setError(''); }} maxLength={1000} aria-invalid={Boolean(error)} aria-describedby={error ? 'find-service-error' : undefined} />
            <Button variant="gold" type="submit"><Art page="find" file="dd56f" size={18} />Find My Service</Button>
          </form>
          {error && <p className="service-input-error" id="find-service-error" role="alert">{error}</p>}
          <div className="service-examples"><span>Try:</span>{examples.map((example) => <button key={example} type="button" onClick={() => { setQuery(example); setError(''); }}>{example}</button>)}</div>
        </section>
        <section className="service-browse"><h2 className="eyebrow">Browse services</h2>{services.map((service) => <Link className="service-row" key={service.title} to={service.path}><span className={`service-row-tile ${service.color}`}><Art page="find" file={service.file} /></span><span className="service-row-copy"><strong>{service.title}</strong><span>{service.description}</span></span><Art page="find" file="433cc" /></Link>)}</section>
      </div>
      <aside className="services-aside">
        <section className="card service-faq"><h2 className="eyebrow">Frequently asked</h2>{faqs.map(([title, answer]) => <details key={title}><summary>{title}<Art page="find" file="607d9" size={16} /></summary><p>{answer}</p></details>)}</section>
        <section className="card"><h2 className="eyebrow">How Smart Match works</h2><NumberedSteps steps={['You describe your concern in your own words.', 'We compare it with what each office handles.', 'A score of 70 or higher shows a recommended office. Otherwise, we show a few that may help.']} /><p className="service-demo-note">Demo relevance rules, not AI confidence.</p></section>
      </aside>
    </div>
  </div>;
}

function ConcernQuote({ query, onEdit }) {
  return <section className="service-concern-quote"><div><h2 className="eyebrow">Your concern</h2><button className="service-text-button" onClick={onEdit}>Edit</button></div><blockquote>“{query || 'Describe your concern to find a service.'}”</blockquote></section>;
}
function MatchCard({ match, rank, onContact, query }) {
  const navigate = useNavigate();
  const { office, score, reasons } = match;
  return <article className="recommended-office">
    <header><span className="service-rank primary">{rank}</span><div className="recommended-title"><span className="eyebrow">Recommended office</span><h2>{office.name}</h2><p>{department(office)}</p><div className="service-score-meter" aria-hidden="true"><span style={{ width: `${score}%` }} /></div></div><span className="match-score primary">{score}% match</span></header>
    <div className="recommended-body">
      <div className="service-match-reason"><Art page="recommendation" file="288f6" size={18} /><div><strong>Why this office?</strong><p>{office.description} Your concern mentions {reasons.slice(0, 4).map((term) => `“${term}”`).join(', ')}.</p></div></div>
      <div className="service-office-facts">
        {[['Location', locationOf(office), 'b741f'], ['Office hours', office.hours, '5927d'], ['Services', serviceSummary(office), 'd16a9'], ['Contact', office.phone, '11dbc']].map(([label, value, file]) => <div key={label}><Art page="recommendation" file={file} /><div><h3 className="eyebrow">{label}</h3><p>{value}</p>{label === 'Office hours' && <OfficeStatus office={office} />}</div></div>)}
      </div>
      <div className="service-match-actions"><Button onClick={() => navigate(officePath(office))}>View Office Details</Button><Button variant="secondary" onClick={() => navigate(directionsPath(office))}><Art page="recommendation" file="37416" size={18} />Directions</Button><Button variant="secondary" onClick={() => onContact(office)}><Art page="recommendation" file="a8699" size={18} />Contact Office</Button><button className="service-text-button" onClick={() => navigate(submitPath(office, query))}><Art page="recommendation" file="801d3" size={18} />Submit a concern here</button></div>
    </div>
  </article>;
}
function AlternativeOffice({ match, rank, compact = false }) {
  const { office, score } = match;
  const navigate = useNavigate();
  return <article className={`card alternative-office ${compact ? 'compact' : ''}`}><div className="alternative-office-header"><span className="service-rank">{rank}</span><div><h3>{office.name}</h3><p>{department(office)}</p></div><span className="match-score">{score}% match</span></div><p className="alternative-description">{match.reasons.find((reason) => /^(May assist|Can help)/.test(reason)) || office.description}</p><footer>{!compact && <span>{office.building}, {office.floor} · {office.hours}</span>}<button className="service-text-button" onClick={() => navigate(officePath(office))}>View Office Details{compact && ' →'}</button></footer></article>;
}

export function Recommendation() {
  const { data } = useApp();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const query = params.get('q') || '';
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(query);
  const [editError, setEditError] = useState('');
  const [contact, setContact] = useState(null);
  const [directoryQuery, setDirectoryQuery] = useState('');
  const result = useMemo(() => {
    try {
      if (params.get('state') === 'error') throw new Error('Demo error state');
      return matchConcern(query, data.offices);
    } catch { return { state: 'error', matches: [], query }; }
  }, [query, data.offices, params]);
  const edit = () => { setDraft(query); setEditError(''); setEditing(true); };
  function saveConcern(event) {
    event.preventDefault();
    if (draft.trim().length < 3) { setEditError('Please describe your concern in at least 3 characters.'); return; }
    setParams({ q: draft.trim() }); setEditing(false);
  }
  return <div className="services-page">
    <Back to="/student/find" /><PageHeader title="Office Recommendation" />
    <div className="services-layout recommendation-layout"><div className="services-main">
      <ConcernQuote query={query} onEdit={edit} />
      {result.state === 'recommended' && <><div className="service-section-title"><h2>Here’s who can help</h2><p>Ranked by relevance to your concern</p></div><MatchCard match={result.matches[0]} rank={1} onContact={setContact} query={query} />{result.matches.length > 1 && <><h2 className="eyebrow">Other offices that may help</h2><div className="service-alternatives">{result.matches.slice(1).map((match, index) => <AlternativeOffice compact key={match.office.id} match={match} rank={index + 2} />)}</div></>}</>}
      {result.state === 'low' && <><div className="service-uncertain"><Art page="low" file="2663d" /><div><strong>We’re not completely sure.</strong><p>Here are the offices that may be able to help. Pick the one that sounds closest, or add a few more details to your concern.</p></div></div><h2 className="service-content-title">Offices that may help</h2>{result.matches.map((match, index) => <AlternativeOffice key={match.office.id} match={match} rank={index + 1} />)}<div><Button variant="secondary" onClick={() => navigate('/student/offices')}><Art page="low" file="03d4a" size={18} />Browse the full Office Directory</Button></div></>}
      {(result.state === 'none' || result.state === 'error') && <section className="card service-no-match"><span className={`service-empty-icon ${result.state === 'error' ? 'error' : ''}`}><Art page="none" file={result.state === 'error' ? 'db2bb' : 'dc92b'} size={36} /></span><h2>{result.state === 'error' ? 'Something went wrong' : 'We couldn’t find an exact match'}</h2><p>{result.state === 'error' ? 'We couldn’t process your request right now. Please try again.' : 'Try using different words or browse the Office Directory.'}</p>{result.state === 'error' ? <Button onClick={() => setParams({ q: query })}><Art page="none" file="fe429" size={18} />Try Again</Button> : <Button onClick={() => navigate('/student/offices')}>Open Office Directory</Button>}</section>}
      {result.state !== 'none' && result.state !== 'error' && <p className="service-demo-note">Match percentages are demo relevance scores from keyword and related office rules, not machine-learning confidence probabilities.</p>}
    </div><aside className="services-aside"><section className="card service-browse-manually"><div className="service-divider-label">or browse manually</div><form onSubmit={(event) => { event.preventDefault(); navigate(`/student/offices?q=${encodeURIComponent(directoryQuery)}`); }}><SearchInput value={directoryQuery} onChange={setDirectoryQuery} placeholder="Search all offices…" /><button className="service-sr-only" type="submit">Search office directory</button></form></section><section className="card"><h2 className="eyebrow">Not what you meant?</h2><p className="muted">Add details like the subject, system, or document name. Smart Match works best with specific words.</p><Button variant="secondary" onClick={edit}><Art page="recommendation" file="97aaf" size={16} />Rewrite my concern</Button></section>{result.state === 'recommended' && <section className="service-uncertain service-uncertain-aside"><div><Art page="recommendation" file="de9f1" /><strong>We’re not completely sure.</strong></div><p>When no single office is a clear match, we show a few ranked options. If there is no match, browse the Office Directory.</p></section>}</aside></div>
    {editing && <Modal title="Rewrite my concern" onClose={() => setEditing(false)} footer={<><Button variant="secondary" onClick={() => setEditing(false)}>Cancel</Button><Button form="rewrite-concern" type="submit">Find My Service</Button></>}><form id="rewrite-concern" onSubmit={saveConcern}><Field label="What do you need help with?" error={editError}><textarea autoFocus rows={5} value={draft} onChange={(event) => setDraft(event.target.value)} maxLength={1000} /></Field><p className="service-demo-note">Include specific words, such as tuition, enrollment, password, or medical.</p></form></Modal>}
    {contact && <ContactOffice office={contact} onClose={() => setContact(null)} />}
  </div>;
}

export function OfficeDirectory() {
  const { data } = useApp();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const query = params.get('q') || '';
  const category = categories.includes(params.get('category')) ? params.get('category') : 'All';
  const filtered = useMemo(() => data.offices.filter((office) => (category === 'All' || office.category === category) && [office.name, office.description, office.category, office.building, ...(office.services || [])].join(' ').toLowerCase().includes(query.trim().toLowerCase())), [data.offices, query, category]);
  function update(key, value) {
    const next = new URLSearchParams(params);
    if (value && value !== 'All') next.set(key, value); else next.delete(key);
    setParams(next, { replace: true });
  }
  return <div className="services-page"><PageHeader title="Office Directory" subtitle="Browse all NU offices and their services" /><div className="office-directory-search"><SearchInput value={query} onChange={(value) => update('q', value)} placeholder="Search offices…" /></div><div className="office-category-filters" aria-label="Filter offices by category">{categories.map((item) => <button key={item} aria-pressed={category === item} className={category === item ? 'selected' : ''} onClick={() => update('category', item)}>{item}</button>)}</div><p className="service-result-count" aria-live="polite">{data.offices.length} offices · showing {filtered.length}</p>{filtered.length ? <div className="office-directory-grid">{filtered.map((office) => <article className="card office-directory-card" key={office.id}><OfficeTile office={office} /><div className="office-directory-content"><h2>{office.name}</h2><p className="office-department">{department(office)}</p><p className="office-description">{office.description}</p><div className="office-directory-meta"><span><Art page="directory" file="28a09" size={14} />{office.building}, {office.floor}</span><span><Art page="directory" file="00b4b" size={14} />{office.hours}</span></div><div className="office-directory-phone"><Art page="directory" file="d2151" size={14} />{office.phone}</div><footer><OfficeStatus office={office} /><button className="service-soft-button" onClick={() => navigate(officePath(office))}>View Details</button></footer></div></article>)}</div> : <section className="card"><EmptyState title="No offices found" description="Try another office name, service, or category." /><Button variant="secondary" onClick={() => setParams({})}>Clear filters</Button></section>}</div>;
}

// Exported Figma map layers retain their design positions and proportions.
const detailMapLayers = [
  ['0c9c0', [47.5, 25, 37.5, 56.25]], ['ab0ea', [35, 54.69, 58, 25]], ['f5f95', [15, 3.13, 55, 84.38]],
  ['88efc', [88, 1.56, 1.5, 84.38], [-1.19, -.56]], ['dd3d4', [7.5, 7.81, 2, 6.25], [-1.66, -1.09]],
  ['7aa9e', [48.75, 47.66, 43.75, 47.66], [-1.67, -1.67]], ['32863', [43.75, 64.06, 38.75, 10.94], [-1.07, -.47]],
  ['ffc03', [66.25, 56.25, 18.75, 23.44], [-1.25, -.58]], ['ffc03', [66.25, 23.44, 18.75, 56.25], [-1.25, -.58]],
  ['14479', [26.25, 17.19, 56.25, 59.38], [-2.14, -1]], ['564bf', [15.5, 60.94, 68, 15.63], [-1.14, -.5]],
  ['2e529', [27.75, 38.91, 65, 57.66], [-3.45, -4.55]],
];
const detailMapLabels = [
  ['Admin Building', 50.5, 16.48], ['Main Building', 71.75, 27.34], ['Library Building', 71.75, 59.14], ['Tech Building', 33, 64.84, true],
  ['Student Center', 21.75, 20.23], ['Fountain', 50.75, 53.91], ['Main Gate', 91.75, 52.5], ['Back Gate', 1.75, 6.25], ['Parking', 91.5, 87.81], ['Field', 28.5, 87.5],
];
const routeMapLayers = [
  ['79bd3', [55.98, 16.38, 29.02, 64.87]], ['a5c45', [35, 54.69, 58, 25]], ['80b71', [15, 3.13, 55, 84.38]],
  ['f4afd', [87.93, 1.54, 1.57, 84.4], [-1.19, -.55]], ['06568', [7.5, 7.81, 2, 6.25], [-1.65, -1.08]],
  ['5c3e5', [59.48, 47.5, 33.02, 47.81], [-1.66, -1.65]], ['730b7', [16.09, 40.62, 68.91, 39.07], [-1.25, -.57]],
  ['730b7', [32.65, 41.2, 52.35, 38.48], [-1.25, -.57]], ['6b730', [23.79, 64.03, 58.71, 12.54], [-2.14, -.99]],
  ['e5907', [31.49, 12.86, 52.01, 63.7], [-1.13, -.49]], ['ae1e1', [82.57, 48.65, 12.93, 48.54], [-11.08, -10.98]],
  ['17a67', [54.11, 16.39, 38.64, 80.17], [-3.44, -4.49]],
];
const routeMapLabels = [
  ['Registrar Area', 62.04, 67.64], ['Main Building', 21.69, 43], ['Library Building', 38.25, 41.4], ['Tech Building', 30.79, 18.22, true],
  ['Student Center', 38.25, 68.37], ['FIELD', 61.81, 47.67], ['Main Gate', 83.27, 54.52], ['Back Gate', 1.75, 6.25], ['Parking', 55.04, 90.67],
];
function CampusMap({ compact = false, office, origin = 'Main Gate', minutes = 4 }) {
  const page = compact ? 'detail' : 'directions';
  const layers = compact ? detailMapLayers : routeMapLayers;
  const labels = compact ? detailMapLabels : routeMapLabels;
  const alternateBuilding = !/tech/i.test(office.building);
  const destinationPosition = /admin|registrar/i.test(office.building) ? [68, 61] : /student/i.test(office.building) ? [73, 38] : /library/i.test(office.building) ? [47, 39] : [49, 22];
  return <div className={`campus-map ${compact ? 'compact' : 'route'}`} role="img" aria-label={`Illustrated campus reference map. ${office.name}: ${locationOf(office)}. Sample layout, not live navigation.`}><img className="campus-map-base" src={asset(page, compact ? 'ef079' : 'e3751')} alt="" />{layers.map(([file, insets, expand], index) => <span key={`${file}-${index}`} className="campus-map-layer" style={{ inset: insets.map((value) => `${value}%`).join(' ') }}><img src={asset(page, file)} alt="" style={expand ? { top: `${expand[0]}%`, bottom: `${expand[0]}%`, left: `${expand[1]}%`, right: `${expand[1]}%`, width: `${100 - expand[1] * 2}%`, height: `${100 - expand[0] * 2}%` } : undefined} /></span>)}{labels.map(([label, top, left, white]) => <span key={label} className={`campus-map-label ${white ? 'light' : ''}`} style={{ top: `${top}%`, left: `${left}%` }}>{label}</span>)}{!compact && <><div className="campus-route-label"><strong>{origin} → {office.building}</strong><span>About {minutes} min walk</span></div>{alternateBuilding && <span className="campus-selected-destination" style={{ left: `${destinationPosition[0]}%`, top: `${destinationPosition[1]}%` }}>●<span>{office.name}</span></span>}</>}</div>;
}

async function copyValue(value, notify) {
  try { await navigator.clipboard.writeText(value); notify('Copied to clipboard.'); }
  catch { notify('Copy is unavailable in this browser. Select and copy the contact text.'); }
}
function ContactCard({ office, onContact }) {
  const { notify } = useApp();
  return <section className="card office-contact-card"><h2 className="eyebrow">Contact</h2>{[['Phone', office.phone, '11dbc'], ['Email', office.email, '07854']].map(([label, value, file]) => <div className="office-contact-row" key={label}><Art file={file} /><div><h3 className="eyebrow">{label}</h3><a href={label === 'Email' ? `mailto:${value}` : phoneLink(value)}>{value}</a></div><button className="service-text-button" onClick={() => copyValue(value, notify)}><Art file="07a59" size={16} />Copy</button></div>)}<div className="office-contact-row"><Art file="dd135" /><div><h3 className="eyebrow">Other</h3><strong>Live Chat (help desk)</strong></div><button className="service-text-button" onClick={onContact}><Art file="e2452" size={16} />Chat</button></div><div className="service-sample-note"><Art file="e405c" size={16} /><p>Sample contact details. Confirm with the office before visiting.</p></div></section>;
}

export function OfficeDetails() {
  const { data } = useApp();
  const { officeId } = useParams();
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const office = data.offices.find((item) => item.id === officeId);
  const [contactOpen, setContactOpen] = useState(Boolean(params.get('contact')));
  useEffect(() => { setContactOpen(Boolean(params.get('contact'))); }, [params]);
  if (!office) return <div className="services-page"><Back /><section className="card"><EmptyState title="Office not found" description="This office may have been removed from the directory." /><Button onClick={() => navigate('/student/offices')}>Open Office Directory</Button></section></div>;
  const hours = String(office.hours || 'Please contact the office');
  const timeInterval = hours.match(/\d{1,2}(?::\d{2})?\s*(?:AM|PM)\s*[–-]\s*\d{1,2}(?::\d{2})?\s*(?:AM|PM)/i)?.[0] || hours;
  const dailyHours = clockRange(timeInterval);
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const operatingDays = new Set((Array.isArray(office.days) ? office.days : days.slice(0, /Mon\s*[–-]\s*Sat/i.test(hours) ? 6 : 5)).map((day) => String(day).slice(0, 3).toLowerCase()));
  function closeContact() { setContactOpen(false); const next = new URLSearchParams(params); next.delete('contact'); setParams(next, { replace: true }); }
  return <div className="services-page"><Back /><header className="office-detail-header"><OfficeTile office={office} large /><div className="office-detail-heading"><h1>{office.name}</h1><p>{department(office)}</p><div><OfficeStatus office={office} /><span className="office-category-badge">{office.category}</span></div></div><div className="office-detail-actions"><Button onClick={() => navigate(directionsPath(office))}><Art file="48a1f" size={18} />Get Directions</Button><Button variant="secondary" onClick={() => setContactOpen(true)}><Art file="a8699" size={18} />Contact Office</Button><Button variant="secondary" onClick={() => navigate(submitPath(office))}><Art file="02eec" size={18} />Submit a Concern</Button></div></header><div className="services-layout"><div className="services-main"><section className="card office-about"><h2 className="eyebrow">About</h2><p>{office.description}</p></section><section className="card office-services"><h2 className="eyebrow">Services</h2><ul>{office.services.map((service) => <li key={service}><Art file="cdd94" size={16} />{service}</li>)}</ul></section><div className="office-detail-bottom"><section className="card office-location"><h2 className="eyebrow">Location</h2><dl>{[['Building', office.building], ['Floor', office.floor], ['Room', roomOf(office)]].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl></section><section className="card office-hours"><h2 className="eyebrow">Office hours</h2><dl>{days.map((day, index) => <div key={day}><dt>{day}</dt><dd>{operatingDays.has(day.slice(0, 3).toLowerCase()) ? dailyHours : 'Closed'}</dd></div>)}</dl><p className="service-sr-only">Demonstration schedule. Confirm opening hours before visiting.</p></section></div></div><aside className="services-aside"><section className="card office-map-card"><div className="office-map-heading"><h2 className="eyebrow">Location</h2><Link to={directionsPath(office)}>Walking directions</Link></div><Link to={directionsPath(office)} aria-label={`View walking directions to ${office.name}`}><CampusMap compact office={office} /></Link><p className="muted">{office.building}. {office.name} is on the {office.floor}{office.room ? `, ${roomOf(office)}` : ''}.</p></section><ContactCard office={office} onContact={() => setContactOpen(true)} /></aside></div>{contactOpen && <ContactOffice office={office} initialTab={['chat', 'email', 'call'].includes(params.get('contact')) ? params.get('contact') : 'chat'} onClose={closeContact} />}</div>;
}

export function ContactOffice({ office, onClose, initialTab = 'chat' }) {
  const navigate = useNavigate();
  const { notify } = useApp();
  const [tab, setTab] = useState(initialTab);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([{ role: 'office', text: `Hi! You’re chatting with the ${office.name}. How can we help?` }]);
  const [messageError, setMessageError] = useState('');
  const chatEnd = useRef(null);
  useEffect(() => { if (messages.length > 1) chatEnd.current?.scrollIntoView({ block: 'nearest' }); }, [messages]);
  function send(event) {
    event.preventDefault();
    if (!message.trim()) { setMessageError('Type a message before sending.'); return; }
    setMessages((previous) => [...previous, { role: 'student', text: message.trim() }, { role: 'office', text: 'Thanks for your message. This is a simulated reply. Submit a concern to save your request and receive a reference number.' }]);
    setMessage(''); setMessageError('');
  }
  return <Modal className="service-contact-dialog" title={`Contact ${office.name}`} onClose={onClose} footer={<><Button variant="secondary" onClick={onClose}>Close</Button><Button onClick={() => { onClose(); navigate(submitPath(office)); }}>Submit a concern instead</Button></>}><div className="office-contact-modal"><div className="office-contact-tabs" role="tablist" aria-label="Contact method">{[['chat', 'Live Chat', 'f033d'], ['email', 'Email', 'd05ea'], ['call', 'Call', '5e678']].map(([value, label, file], index) => <button key={value} role="tab" id={`contact-tab-${value}`} aria-selected={tab === value} aria-controls={`contact-panel-${value}`} tabIndex={tab === value ? 0 : -1} className={tab === value ? 'active' : ''} onClick={() => setTab(value)} onKeyDown={(event) => { const order = ['chat', 'email', 'call']; const next = event.key === 'ArrowRight' ? order[(index + 1) % 3] : event.key === 'ArrowLeft' ? order[(index + 2) % 3] : event.key === 'Home' ? order[0] : event.key === 'End' ? order[2] : null; if (next) { event.preventDefault(); setTab(next); document.getElementById(`contact-tab-${next}`)?.focus(); } }}><Art page="contact" file={file} size={16} />{label}</button>)}</div><div role="tabpanel" id={`contact-panel-${tab}`} aria-labelledby={`contact-tab-${tab}`}>
    {tab === 'chat' && <><div className="office-chat-messages" role="log" aria-live="polite" aria-label="Simulated office conversation">{messages.map((item, index) => <div className={`office-chat-bubble ${item.role}`} key={index}>{item.text}</div>)}<div ref={chatEnd} /></div><form className="office-chat-form" onSubmit={send}><input aria-label="Your chat message" placeholder="Type your message…" value={message} maxLength={1000} onChange={(event) => { setMessage(event.target.value); setMessageError(''); }} aria-describedby={messageError ? 'chat-message-error' : undefined} /><Button type="submit" aria-label="Send message"><Art page="contact" file="93da6" size={18} /></Button></form>{messageError && <p className="service-form-error" id="chat-message-error" role="alert">{messageError}</p>}<p className="service-demo-note">Prototype chat. Replies are simulated. Messages are not sent or saved.</p></>}
    {tab === 'email' && <div className="office-contact-method"><Art file="07854" size={28} /><h3>Email {office.name}</h3><p>{office.email}</p><div className="actions"><a className="service-link-button" href={`mailto:${office.email}?subject=${encodeURIComponent('Student service inquiry')}`}>Open email app</a><Button variant="secondary" onClick={() => copyValue(office.email, notify)}>Copy email</Button></div><p className="service-demo-note">Sample address. Confirm the official contact before sending personal information.</p></div>}
    {tab === 'call' && <div className="office-contact-method"><Art file="11dbc" size={28} /><h3>Call {office.name}</h3><p>{office.phone}</p><p className="muted">Office hours: {office.hours}</p><div className="actions"><a className="service-link-button" href={phoneLink(office.phone)}>Call the office</a><Button variant="secondary" onClick={() => copyValue(office.phone, notify)}>Copy number</Button></div><p className="service-demo-note">Sample phone number. Confirm the official contact before calling.</p></div>}
    </div></div></Modal>;
}

function routeFor(office, origin) {
  const building = office.building || 'the office building';
  const sameBuilding = origin === building;
  if (sameBuilding) return { minutes: 1, distance: 40, steps: [`Start inside ${building}.`, `Follow the building signs or ask the reception desk for ${office.name}.`, `Go to the ${office.floor}${office.room ? `, ${roomOf(office)}` : ''}.`] };
  const minutes = /tech/i.test(building) ? 4 : /admin/i.test(building) ? 3 : /student/i.test(building) ? 5 : 3;
  return { minutes, distance: minutes * 70, steps: [`${origin === 'Main Gate' || origin === 'Back Gate' ? `Enter through the ${origin}` : `Leave ${origin} through its main entrance`} and walk along the main walkway.`, /tech/i.test(building) && origin === 'Main Gate' ? 'Pass the fountain and turn right at the Tech Building path.' : `Follow the campus signs toward ${building}.`, `The ${building} entrance is ahead of you.`, `${office.name} is on the ${office.floor}${office.room ? `, ${roomOf(office)}` : ''}.`] };
}

export function Directions() {
  const { data, notify } = useApp();
  const [params, setParams] = useSearchParams();
  const defaultOffice = data.offices.find((item) => /it services/i.test(item.name)) || data.offices[0];
  const requestedOffice = data.offices.find((item) => item.id === params.get('office')) || defaultOffice;
  const [destinationId, setDestinationId] = useState(requestedOffice?.id || '');
  const [origin, setOrigin] = useState(params.get('from') || 'Main Gate');
  const [activeRoute, setActiveRoute] = useState({ officeId: requestedOffice?.id, origin: params.get('from') || 'Main Gate' });
  const [contactTab, setContactTab] = useState(null);
  useEffect(() => { if (requestedOffice) { setDestinationId(requestedOffice.id); setActiveRoute({ officeId: requestedOffice.id, origin: params.get('from') || 'Main Gate' }); } }, [params, requestedOffice?.id]);
  const selected = data.offices.find((item) => item.id === destinationId) || defaultOffice;
  const office = data.offices.find((item) => item.id === activeRoute.officeId) || selected;
  if (!office) return <div className="services-page"><PageHeader title="Directions & Contacts" /><EmptyState title="No offices available" description="Add an office from Office Management to view directions." /></div>;
  const route = routeFor(office, activeRoute.origin);
  const starts = [...new Set(['Main Gate', 'Back Gate', ...data.offices.map((item) => item.building).filter(Boolean)])];
  const changed = destinationId !== activeRoute.officeId || origin !== activeRoute.origin;
  const quickOffices = [/registrar/i, /it services/i, /clinic/i].map((pattern) => data.offices.find((item) => pattern.test(item.name))).filter(Boolean);
  function getDirections(event) {
    event.preventDefault(); setActiveRoute({ officeId: selected.id, origin }); setParams({ office: selected.id, from: origin }, { replace: true }); notify(`Walking reference updated for ${selected.name}.`);
  }
  return <div className="services-page"><Back /><PageHeader title="Directions & Contacts" subtitle="Find your way around campus or reach out directly" /><div className="services-layout"><div className="services-main"><section className="card directions-map-card"><CampusMap office={office} origin={activeRoute.origin} minutes={route.minutes} /><div className="directions-route-stats">{[[`${route.minutes} min`, 'Estimated walk', '29740'], [`${route.distance} m`, 'Approximate distance', '50215'], [office.building, `${office.floor} · ${roomOf(office)}`, '79111']].map(([value, label, file]) => <div key={label}><Art page="directions" file={file} size={22} /><div><strong>{value}</strong><span>{label}</span></div></div>)}</div></section><section><h2 className="eyebrow directions-contact-heading">Contact {office.name}</h2><div className="directions-contact-grid">{[['chat', 'Live Chat', 'Chat with a support staff now', 'f1237', 'mint'], ['email', 'Email Us', office.email, '3c25b', 'lavender'], ['call', 'Call the Office', office.phone, 'e4816', 'peach']].map(([value, title, description, file, color]) => <button className="service-row" key={value} onClick={() => setContactTab(value)}><span className={`service-row-tile ${color}`}><Art page="directions" file={file} /></span><span className="service-row-copy"><strong>{title}</strong><span>{description}</span></span><Art page="directions" file="52ab3" size={18} /></button>)}</div></section><p className="service-demo-note">Illustrative campus layout and walking estimates for this prototype. No live GPS or real-time route tracking.</p></div><aside className="services-aside"><form className="card directions-form" onSubmit={getDirections}><h2 className="eyebrow">Get walking directions</h2><Field label="Starting point"><select value={origin} onChange={(event) => setOrigin(event.target.value)}>{starts.map((start) => <option key={start}>{start}</option>)}</select></Field><Field label="Where are you headed?"><select value={destinationId} onChange={(event) => setDestinationId(event.target.value)}>{data.offices.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></Field><div className="directions-quick-offices">{quickOffices.map((item) => <button key={item.id} type="button" className={destinationId === item.id ? 'active' : ''} onClick={() => setDestinationId(item.id)}>{/it services/i.test(item.name) ? 'IT Services' : /clinic/i.test(item.name) ? 'Clinic' : item.name}</button>)}</div><dl className="directions-destination">{[['Destination', selected.name], ['Building', selected.building], ['Floor · Room', `${selected.floor} · ${roomOf(selected)}`]].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl><Button type="submit"><Art page="directions" file="e5839" size={18} />Get Directions</Button>{changed && <p className="service-demo-note" role="status">Choose Get Directions to update your walking route.</p>}</form><section className="card"><h2 className="eyebrow">Your walking route</h2><NumberedSteps steps={route.steps} /></section></aside></div>{contactTab && <ContactOffice office={office} initialTab={contactTab} onClose={() => setContactTab(null)} />}</div>;
}
