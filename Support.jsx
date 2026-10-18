import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useApp } from '../../state/AppContext';
import { Badge, Button, EmptyState, Field, Modal, PageHeader, SearchInput } from '../../components/UI';
import { ContactOffice } from './Services';
import { validateAttachment } from '../../utils/domain';
import '../../styles/support.css';

const STUDENT_ID = 'student-juan';
const STATUSES = ['Pending', 'In Progress', 'Resolved'];
const referenceOf = concern => concern.reference || concern.id;
const phoneHref = value => {
  const [number, extension] = String(value || '').split(/\s*(?:loc\.?|ext\.?)\s*/i);
  return `tel:${number.replace(/[^+\d]/g, '')}${extension ? `;ext=${extension.replace(/\D/g, '')}` : ''}`;
};
const CATEGORIES = [
  ['IT/Technical Support', 'Portal access, systems, devices'],
  ['Academic & Enrollment', 'Registration, grades, subjects'],
  ['Student Services & Health', 'Clinic, counseling, welfare'],
  ['Finance & Payments', 'Tuition, balances, receipts'],
  ['Something else', 'Not sure where it fits'],
];
const FAQS = [
  ['How do I reset my student password?', 'Use Forgot password on the sign-in screen. For this local demo, the modal shows the next steps. If your university account still needs help, contact the IT Services Office.'],
  ["Where is the Registrar’s office located?", 'Open the Office Directory and choose Registrar’s Office to see its building, floor, room, and office hours. Directions & Contacts provides the campus walking guide.'],
  ['What happens after I submit a concern?', 'Your concern receives a unique reference number and a Pending status. The assigned office can review it, respond, and move it to In Progress or Resolved. You can follow every update in My Concerns.'],
  ['How long before an office responds?', 'Response times depend on the office and the concern. Check the office hours and your concern history. This demonstration does not send requests to a real university office.'],
  ["Can I use NUL Guide if I’m not sure which office to go to?", 'Yes. Open Find a Service and describe what you need. Smart Match uses a local keyword matching system to recommend an office. You can also browse every office manually.'],
];

function Asset({ page, file, className = '' }) {
  return <img className={`support-asset ${className}`} src={`/assets/${page.startsWith('staff-') ? page : `support-${page}`}/${file}.svg`} alt="" aria-hidden="true" />;
}
function date(value, short = false) {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? (value || 'Just now') : parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric', ...(short ? {} : { year: 'numeric' }), timeZone: 'Asia/Manila' });
}
function timeAgo(value) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value || 'Just now';
  const minutes = Math.max(0, Math.floor((Date.now() - parsed.getTime()) / 60000));
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)} ${minutes < 120 ? 'hour' : 'hours'} ago`;
  if (minutes < 2880) return 'Yesterday';
  return `${Math.floor(minutes / 1440)} days ago`;
}
function categoryFor(office) {
  const text = `${office?.name} ${office?.category}`.toLowerCase();
  if (/it services|technical|tech/.test(text)) return CATEGORIES[0][0];
  if (/registrar|admission|academic|library/.test(text)) return CATEGORIES[1][0];
  if (/clinic|health|student|guidance|counsel/.test(text)) return CATEGORIES[2][0];
  if (/cashier|finance|payment/.test(text)) return CATEGORIES[3][0];
  return CATEGORIES[4][0];
}
function Back({ to = '/student', children = 'Back', page = 'submission', file = '96561' }) {
  return <Link className="support-back" to={to}><Asset page={page} file={file} />{children}</Link>;
}
function SignInPrompt() {
  return <div className="card support-sign-in"><div className="support-empty-icon"><Asset page="tracking" file="a7d0e" /></div><h2>Sign in to manage your concerns</h2><p className="muted">Use your student demo account to submit a concern and track office responses.</p><Link className="button btn btn-primary support-link-button" to="/login">Sign in</Link></div>;
}
function KeyValues({ rows }) {
  return <dl className="support-kv">{rows.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value || '—'}</dd></div>)}</dl>;
}
function Progress({ concern, detailed = false }) {
  const active = Math.max(0, STATUSES.indexOf(concern.status));
  return <div className={`concern-progress status-${active} ${detailed ? 'progress-detailed' : ''}`} aria-label={`Concern status: ${concern.status}`}>
    <div className="concern-progress-track">{STATUSES.map((status, i) => <div className="progress-step" key={status}>
      <Asset page="tracking" file={active === 2 ? '48f5a' : i < active ? 'e6458' : i === active ? 'e196b' : '08ffa'} />
      <span className={i <= active ? 'reached' : ''}>{status}</span>
      {detailed && <small>{concern.history?.find(h => h.status === status) ? date(concern.history.find(h => h.status === status).at) : 'Awaiting update'}</small>}
    </div>)}</div>
  </div>;
}

export function SubmitConcern() {
  const { data, session, createConcern, notify } = useApp();
  const [params] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const initialOffice = data.offices.find(o => o.id === params.get('office')) || data.offices.find(o => /IT Services/i.test(o.name)) || data.offices[0];
  const [category, setCategory] = useState(categoryFor(initialOffice));
  const [officeId, setOfficeId] = useState(initialOffice?.id || '');
  const [title, setTitle] = useState(location.state?.title || '');
  const [description, setDescription] = useState((location.state?.description || params.get('description') || '').slice(0, 1000));
  const [contactPreference, setContactPreference] = useState('In-app');
  const [attachment, setAttachment] = useState(null);
  const attachmentInput = useRef(null);
  const [errors, setErrors] = useState({});
  const [faq, setFaq] = useState(null);
  const office = data.offices.find(o => o.id === officeId);
  const clearAttachment = () => {
    setAttachment(null);
    setErrors(current => ({ ...current, attachment: '' }));
    if (attachmentInput.current) attachmentInput.current.value = '';
  };
  const chooseCategory = value => {
    setCategory(value);
    const match = data.offices.find(o => categoryFor(o) === value);
    if (match) setOfficeId(match.id);
  };
  const attachFile = event => {
    const file = event.target.files?.[0];
    if (!file) return;
    const attachmentError = validateAttachment(file);
    if (attachmentError) {
      setErrors(current => ({ ...current, attachment: attachmentError }));
      event.target.value = '';
      setAttachment(null);
      return;
    }
    setAttachment({ name: file.name, type: file.type, size: file.size });
    setErrors(current => ({ ...current, attachment: '' }));
  };
  const submit = event => {
    event.preventDefault();
    const next = {};
    if (!category) next.category = 'Choose a category.';
    if (!officeId || !office) next.officeId = 'Choose the office that should receive your concern.';
    if (title.trim().length < 5) next.title = 'Enter a concern title with at least 5 characters.';
    if (description.trim().length < 15) next.description = 'Please describe your concern in at least 15 characters.';
    if (errors.attachment) next.attachment = errors.attachment;
    setErrors(next);
    if (Object.keys(next).length) {
      notify('Please check the highlighted fields.');
      const form = event.currentTarget;
      requestAnimationFrame(() => form.querySelector('[aria-invalid="true"]')?.focus());
      return;
    }
    const concern = createConcern({ studentId: STUDENT_ID, category, officeId, title: title.trim(), description: description.trim(), contactPreference, attachment });
    navigate(`/student/success/${concern.id}`, { replace: true });
  };
  return <div className="support-page"><Back /><PageHeader title="Concern Submission" subtitle="Tell us what’s wrong and we’ll route it to the right office." />
    {session.guest ? <SignInPrompt /> : <div className="support-columns"><form className="concern-form" onSubmit={submit} noValidate>
      <fieldset className="support-categories"><legend className="eyebrow">Select category</legend><div className="category-options">{CATEGORIES.map(([label, hint]) => <label key={label} className={`category-option ${category === label ? 'selected' : ''}`}><input type="radio" name="category" value={label} checked={category === label} onChange={() => chooseCategory(label)} /><span className="category-radio"><Asset page="submission" file={category === label ? '681f5' : '4b4e3'} /></span><span><strong>{label}</strong><small>{hint}</small></span></label>)}</div></fieldset>
      <div className="form-grid"><Field label="Selected office" error={errors.officeId}><select value={officeId} onChange={e => { setOfficeId(e.target.value); setCategory(categoryFor(data.offices.find(o => o.id === e.target.value))); }} aria-invalid={!!errors.officeId}>{data.offices.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}</select></Field><Field label="Concern title" error={errors.title}><input value={title} onChange={e => setTitle(e.target.value)} placeholder="Can’t log in to the student portal" maxLength={120} aria-invalid={!!errors.title} /></Field></div>
      <div className="concern-description"><div className="support-field-heading"><label className="eyebrow" htmlFor="concern-description">Describe your concern</label><small className="muted">{description.length}/1000</small></div><textarea id="concern-description" value={description} maxLength={1000} onChange={e => setDescription(e.target.value)} placeholder="Tell us what happened and how the office can help." aria-invalid={!!errors.description} aria-describedby={errors.description ? 'description-error' : undefined} />{errors.description && <p className="support-error" id="description-error">{errors.description}</p>}{office && description.length > 14 && <div className="concern-match"><Asset page="submission" file="7e579" /><span>Selected office:</span><strong>{office.name}</strong><small>Local demo routing</small></div>}</div>
      <div className="form-grid"><div className="attachment-field"><span className="eyebrow">Attach supporting document (optional)</span><label className="attachment-control"><Asset page="submission" file="07e3a" /><span>{attachment ? attachment.name : 'Attach a file'}</span><input ref={attachmentInput} type="file" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" onChange={attachFile} aria-label="Attach a supporting document" aria-invalid={!!errors.attachment} aria-describedby={errors.attachment ? 'attachment-error' : undefined} /></label><small className="muted">PDF, JPG, or PNG up to 10 MB.</small>{attachment && <div className="attachment-note"><span>File name and size are saved locally; file contents are not uploaded.</span><button type="button" onClick={clearAttachment}>Remove</button></div>}{errors.attachment && <div className="attachment-note"><p className="support-error" id="attachment-error" role="alert">{errors.attachment}</p><button type="button" onClick={clearAttachment}>Continue without a file</button></div>}</div>
      <fieldset className="contact-preferences"><legend className="eyebrow">How should the office contact you?</legend><div>{['In-app', 'Email', 'SMS / Call'].map(value => <label className={contactPreference === value ? 'selected' : ''} key={value}><input type="radio" name="contact-preference" checked={contactPreference === value} onChange={() => setContactPreference(value)} /><span className="contact-radio"><Asset page="submission" file={contactPreference === value ? '6b5f8' : 'd060b'} /></span>{value}</label>)}</div></fieldset></div>
      <Button type="submit" className="concern-submit">Submit Concern</Button>
    </form><aside className="support-aside"><section className="card"><p className="eyebrow">This concern goes to</p>{office ? <div className="office-summary"><span className="support-icon-tile purple"><Asset page="submission" file="785a8" /></span><div><strong>{office.name}</strong><p>{office.building}, {office.floor}</p><p>{office.hours}</p></div></div> : <p className="muted">Choose an office to get started.</p>}</section><section className="card"><p className="eyebrow">Related FAQs</p>{['How do I reset my student portal password?', 'What do I do if I still can’t log in after resetting?', 'What happens after I submit a concern?'].map((question, i) => <button className="support-faq-link" type="button" key={question} onClick={() => setFaq(i)}>{question}<Asset page="submission" file="607d9" /></button>)}</section></aside></div>}
    {faq !== null && <Modal title={['How do I reset my student portal password?', 'Still unable to sign in?', FAQS[2][0]][faq]} onClose={() => setFaq(null)}><p>{faq === 1 ? 'Contact the IT Services Office or submit a concern with the error message. Include the steps you have already tried, but never include your password.' : FAQS[faq === 2 ? 2 : 0][1]}</p></Modal>}
  </div>;
}

export function MyConcerns() {
  const { data, session } = useApp();
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('All');
  const concerns = data.concerns.filter(c => c.studentId === STUDENT_ID);
  const filtered = concerns.filter(c => (status === 'All' || c.status === status) && `${referenceOf(c)} ${c.title}`.toLowerCase().includes(query.toLowerCase()));
  return <div className="support-page"><PageHeader title="Track My Concerns" subtitle="View the status of concerns you’ve submitted" action={<Link className="button btn btn-primary support-link-button" to="/student/submit"><Asset page="tracking" file="6cfda" />New concern</Link>} />{session.guest ? <SignInPrompt /> : <><div className="support-search"><SearchInput value={query} onChange={setQuery} placeholder="Enter reference number..." /></div><div className="support-filter-pills" aria-label="Filter concerns by status">{['All', ...STATUSES].map(value => <button className={status === value ? 'active' : ''} aria-pressed={status === value} key={value} onClick={() => setStatus(value)}>{value}<span>{value === 'All' ? concerns.length : concerns.filter(c => c.status === value).length}</span></button>)}</div>
      {filtered.length ? <div className="concerns-grid">{filtered.map(concern => { const office = data.offices.find(o => o.id === concern.officeId); return <Link className="card concern-card" key={concern.id} to={`/student/concerns/${concern.id}`}><div className="concern-card-heading"><strong className="concern-reference">{referenceOf(concern)}</strong><Badge status={concern.status} /></div><p className="concern-category">{concern.category} · {office?.name || 'Office unavailable'}</p><h3>{concern.title}</h3><Progress concern={concern} /><div className="concern-card-dates"><span>Submitted {date(concern.createdAt)}</span><span>Updated {timeAgo(concern.updatedAt)}</span>{concern.status === 'Resolved' && !concern.feedback && <span className="rate-resolution"><Asset page="tracking" file="b8be8" />Rate this resolution</span>}{concern.feedback && <span className="feedback-received">Feedback submitted</span>}</div></Link>; })}</div> : <div className="card support-empty"><div className="support-empty-icon"><Asset page="tracking" file="a7d0e" /></div><EmptyState title={query || status !== 'All' ? 'No matching concerns' : 'No concerns yet'} description={query || status !== 'All' ? 'Try another reference number or choose a different status.' : 'You haven’t submitted any concerns. Start by telling us what you need help with.'} />{query || status !== 'All' ? <Button variant="secondary" onClick={() => { setStatus('All'); setQuery(''); }}>Clear filters</Button> : <Link className="button btn btn-primary support-link-button" to="/student/find">Find a Service</Link>}</div>}</>}
  </div>;
}

export function ConcernDetails() {
  const { concernId } = useParams();
  const { data, session, submitFeedback, notify } = useApp();
  const concern = data.concerns.find(c => (c.id === concernId || referenceOf(c) === concernId) && c.studentId === STUDENT_ID);
  const [rating, setRating] = useState(concern?.feedback?.rating || 0);
  const [comment, setComment] = useState(concern?.feedback?.comment || '');
  const [ratingError, setRatingError] = useState('');
  const [contact, setContact] = useState(false);
  useEffect(() => {
    setRating(concern?.feedback?.rating || 0);
    setComment(concern?.feedback?.comment || '');
    setRatingError('');
    setContact(false);
  }, [concernId]);
  if (session.guest) return <SignInPrompt />;
  if (!concern) return <div className="support-page"><Back to="/student/concerns">My Concerns</Back><EmptyState title="Concern not found" description="This reference is unavailable. Open My Concerns to view your requests." /></div>;
  const office = data.offices.find(o => o.id === concern.officeId);
  const feedback = event => {
    event.preventDefault();
    if (!rating) { setRatingError('Choose a rating from 1 to 5 stars.'); return; }
    submitFeedback(concern.id, { rating, comment: comment.trim() });
    setRatingError('');
    notify('Thank you. Your feedback has been saved.');
  };
  return <div className="support-page"><Back to="/student/concerns">My Concerns</Back><p className="eyebrow concern-detail-reference">{referenceOf(concern)}</p><div className="concern-detail-heading"><h1>{concern.title}</h1><Badge status={concern.status} /></div><div className="support-columns"><div className="support-detail-main"><section className="card"><div className="support-field-heading"><h2>Progress</h2><small className="muted">Submitted {date(concern.createdAt)}</small></div><Progress concern={concern} detailed /></section>
    <section className={`card concern-response ${concern.status === 'Resolved' ? 'resolved' : ''}`}><div className="support-field-heading"><h2>{concern.status === 'Resolved' && <Asset page="details" file="58101" />}{concern.response ? concern.status : 'Your concern'}</h2><small className="muted">{date(concern.updatedAt)}</small></div><p>{concern.response || concern.description}</p><small className="muted">{concern.response ? `Handled by ${office?.name || 'the assigned office'}` : 'Your concern has been sent to the assigned office. Check back here for updates.'}</small></section>
    {concern.status === 'Resolved' && <section className="card concern-feedback"><h2>{concern.feedback ? 'Thank you for your feedback' : 'Rate this resolution'}</h2><p className="muted">{concern.feedback ? `You rated this resolution ${concern.feedback.rating} out of 5 stars.` : 'How well did the office handle your concern?'}</p><form onSubmit={feedback}><div className="feedback-stars" role="group" aria-label="Resolution rating">{[1, 2, 3, 4, 5].map(value => <button key={value} type="button" disabled={!!concern.feedback} aria-label={`${value} ${value === 1 ? 'star' : 'stars'}`} aria-pressed={rating >= value} onClick={() => { setRating(value); setRatingError(''); }}><Asset page="details" file={value <= rating ? 'd78b9' : '5e012'} /></button>)}</div>{ratingError && <p className="support-error" role="alert">{ratingError}</p>}<Field label="Feedback (optional)"><textarea value={comment} onChange={e => setComment(e.target.value)} placeholder="What went well? What could be better?" maxLength={1000} readOnly={!!concern.feedback} /></Field>{!concern.feedback && <Button type="submit">Submit feedback</Button>}</form></section>}
    </div><aside className="support-aside"><section className="card"><p className="eyebrow">Details</p><KeyValues rows={[["Office assigned", office && <Link to={`/student/offices/${office.id}`}>{office.name}</Link>], ['Category', concern.category], ['Date submitted', date(concern.createdAt)], ['Last update', timeAgo(concern.updatedAt)], ['Contact via', concern.contactPreference || 'In-app'], ['Attachment', concern.attachment?.name || 'No attachment']]} /></section><section className="card"><p className="eyebrow">Need to follow up?</p><Button variant="secondary" onClick={() => setContact(true)} disabled={!office}><Asset page="details" file="f033d" />Contact Office</Button><Link className="support-directions" to={`/student/directions?office=${office?.id || ''}`}><Asset page="details" file="6fbe9" />Get Directions</Link></section><section className="card"><p className="eyebrow">Updates</p><ol className="concern-history">{[...(concern.history || [])].reverse().map((item, index) => <li key={`${item.at}-${index}`}><strong>{item.text}</strong><small>{item.by || 'NUL Guide'} · {date(item.at, true)} · {item.status}</small></li>)}</ol></section></aside></div>{contact && office && <ContactOffice office={office} onClose={() => setContact(false)} />}</div>;
}

export function SubmissionSuccess() {
  const { concernId } = useParams();
  const { data, notify, session } = useApp();
  const concern = data.concerns.find(c => c.id === concernId && c.studentId === STUDENT_ID);
  if (session.guest) return <SignInPrompt />;
  if (!concern) return <div className="support-page"><EmptyState title="Concern not found" description="Open My Concerns to view your submitted requests." /><Link to="/student/concerns">My Concerns</Link></div>;
  const copy = async () => {
    try { await navigator.clipboard.writeText(referenceOf(concern)); notify('Reference number copied.'); }
    catch { notify(`Your reference number is ${referenceOf(concern)}`); }
  };
  return <div className="support-success-wrap"><section className="card support-success"><div className="success-check"><Asset page="success" file="8eccb" /></div><h1>Concern Submitted Successfully</h1><div className="success-reference"><span className="eyebrow">Reference number</span><strong>{referenceOf(concern)}</strong></div><button className="support-copy" onClick={copy}><Asset page="success" file="d212a" />Copy reference number</button><p className="muted">Your concern has been submitted. You can use this reference number to track its progress.</p><KeyValues rows={[["Office", data.offices.find(o => o.id === concern.officeId)?.name], ['Status', <Badge status={concern.status} />], ['Submitted', date(concern.createdAt)]]} /><div className="support-success-actions"><Link className="button btn btn-primary support-link-button" to={`/student/concerns/${concern.id}`}>Track My Concern</Link><Link className="button btn btn-secondary support-link-button" to="/student">Back to Home</Link></div></section></div>;
}

function notificationVisual(item, staff) {
  if (staff) return ['staff-notifications', '85262', 'purple', 'NEW CONCERN'];
  if (/match/i.test(item.title)) return ['notifications', '74066', 'purple', 'SMART MATCH'];
  if (/announcement/i.test(item.title)) return ['notifications', 'ab6f8', 'orange', 'ANNOUNCEMENT'];
  if (/hours/i.test(item.title)) return ['notifications', 'd9474', 'gold', 'OFFICE HOURS'];
  if (/resolved/i.test(item.title)) return ['notifications', '58101', 'green', 'RESOLVED'];
  return ['notifications', '558c4', 'navy', 'CONCERN UPDATE'];
}
export function Notifications({ staff = false }) {
  const { data, session, markNotification, markAllNotifications } = useApp();
  const navigate = useNavigate();
  const [unreadOnly, setUnreadOnly] = useState(false);
  const role = staff ? 'staff' : 'student';
  const all = data.notifications.filter(n => n.role === role);
  const unread = all.filter(n => !n.read).length;
  const filtered = all.filter(n => !unreadOnly || !n.read);
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' });
  const isToday = n => { const parsed = new Date(n.at); return !Number.isNaN(parsed.getTime()) && parsed.toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' }) === today; };
  const groups = [['Today', filtered.filter(isToday)], ['Earlier', filtered.filter(n => !isToday(n))]];
  const open = item => {
    markNotification(item.id);
    if (item.concernId) navigate(staff ? `/staff/concerns?open=${encodeURIComponent(item.concernId)}` : `/student/concerns/${encodeURIComponent(item.concernId)}`);
    else if (item.officeId) navigate(`/student/offices/${encodeURIComponent(item.officeId)}`);
    else if (/announcement/i.test(item.title)) navigate('/student/announcements');
    else if (/hours/i.test(item.title)) navigate('/student/offices');
  };
  return <div className="support-page"><PageHeader title="Notifications" action={<button className="support-text-button" disabled={!unread} onClick={() => markAllNotifications(role)}>Mark all read</button>} />{session.guest ? <SignInPrompt /> : <><div className="support-filter-pills"><button className={!unreadOnly ? 'active' : ''} aria-pressed={!unreadOnly} onClick={() => setUnreadOnly(false)}>All</button><button className={unreadOnly ? 'active' : ''} aria-pressed={unreadOnly} onClick={() => setUnreadOnly(true)}>Unread <span>{unread}</span></button></div><div className="notifications-list">{groups.map(([heading, records]) => records.length > 0 && <section key={heading}><h2 className="eyebrow">{heading}</h2>{records.map(item => { const [page, file, color, category] = notificationVisual(item, staff); return <button className={`notification-card ${!item.read ? 'unread' : ''}`} key={item.id} onClick={() => open(item)}><span className={`support-icon-tile ${color}`}><Asset page={page} file={file} /></span><span className="notification-content"><strong>{item.title}{!item.read && <Asset page="notifications" file="fc690" />}</strong><span>{item.message}</span><small>{category}<span>·</span>{timeAgo(item.at)}</small></span></button>; })}</section>)}{!filtered.length && <div className="card support-empty"><EmptyState title={unreadOnly ? 'You’re all caught up' : 'No notifications yet'} description={unreadOnly ? 'There are no unread notifications.' : 'Updates about your concerns will appear here.'} />{unreadOnly && <Button variant="secondary" onClick={() => setUnreadOnly(false)}>View all notifications</Button>}</div>}</div></>}</div>;
}

export function Announcements() {
  const { data } = useApp();
  return <div className="support-page"><Back page="announcements" /><PageHeader title="Announcements" subtitle="News and updates from NU Laguna" /><div className="announcements-list">{data.announcements.length ? <>{data.announcements.map(item => <article className="card announcement-card" key={item.id}><div className="announcement-heading"><span className="support-icon-tile orange"><Asset page="announcements" file="7041c" /></span><h2>{item.title}</h2><small className="muted">{timeAgo(item.at)}</small></div><p>{item.message}</p></article>)}<div className="announcement-sample"><Asset page="announcements" file="e405c" />Sample announcements for this prototype.</div></> : <div className="card support-empty"><div className="support-empty-icon"><Asset page="announcements" file="1179d" /></div><EmptyState title="No announcements yet" description="You’re all caught up. We’ll let you know when NU shares something new." /></div>}</div></div>;
}

function Toggle({ title, description, value, onChange }) {
  return <label className="support-toggle-row"><span><strong>{title}</strong><small>{description}</small></span><input type="checkbox" checked={!!value} onChange={e => onChange(e.target.checked)} /><span className="support-toggle" aria-hidden="true"><Asset page="profile" file={value ? '418a9' : '68c39'} /></span></label>;
}
function ResetData({ compact = false }) {
  const { resetData, notify } = useApp();
  const [confirm, setConfirm] = useState(false);
  return <><button className={`support-reset ${compact ? 'compact' : ''}`} onClick={() => setConfirm(true)}>Restore sample data</button>{confirm && <Modal title="Restore sample data?" onClose={() => setConfirm(false)} footer={<><Button variant="secondary" onClick={() => setConfirm(false)}>Cancel</Button><Button variant="danger" onClick={() => { resetData(); setConfirm(false); notify('Default sample data restored.'); }}>Restore sample data</Button></>}><p>This clears locally saved concerns, feedback, office changes, and preferences, and restores the original demonstration records.</p></Modal>}</>;
}
export function Profile({ staff = false }) {
  const { data, session, updateProfile, requestLogout } = useApp();
  const [language, setLanguage] = useState(false);
  const [contact, setContact] = useState(false);
  const profile = data.profile;
  const office = data.offices.find(o => /IT Services/i.test(o.name)) || data.offices[0];
  const staffName = 'Maria Santos';
  const name = staff ? staffName : profile.name;
  const email = staff ? 'maria.santos@nu-laguna.edu.ph' : profile.email;
  const initials = name === 'Juan Dela Cruz' ? 'JD' : name?.split(' ').filter(Boolean).map(s => s[0]).filter((_, i, a) => i === 0 || i === a.length - 1).join('') || 'JD';
  if (session.guest) return <SignInPrompt />;
  const identity = <section className="card profile-identity"><div className="profile-avatar">{initials}</div><h1>{name}</h1><p className="muted">{email}</p><span>{staff ? 'IT Services Staff' : `${profile.course} · ${profile.year}`}</span></section>;
  const account = <section className="card profile-account"><div className="support-field-heading"><p className="eyebrow">Account information</p>{!staff && <small className="muted">Managed by the Registrar</small>}</div><KeyValues rows={staff ? [['Role', 'Staff'], ['Office', office?.name || 'IT Services Office'], ['Email', email], ['Permissions', 'View, assign, respond, resolve, manage offices']] : [['Student ID', profile.studentId], ['Program', profile.course], ['Year level', profile.year], ['Email', email], ['Campus', 'NU Laguna']]} /></section>;
  const logout = <button className="profile-logout" onClick={requestLogout}><Asset page={staff ? 'staff-profile' : 'profile'} file="f6012" />Log Out</button>;
  if (staff) return <div className="staff-profile"><div className="profile-main">{identity}{account}{logout}<ResetData compact /></div></div>;
  return <div className="support-page profile-layout"><div className="profile-main">{identity}{account}<section className="card profile-preferences"><p className="eyebrow">Notification preferences</p><Toggle title="Concern status updates" description="When a concern moves to In Progress or Resolved" value={profile.concernUpdates !== false} onChange={value => updateProfile({ concernUpdates: value })} /><Toggle title="Smart Match results" description="When we recommend an office for your concern" value={profile.smartMatchUpdates !== false} onChange={value => updateProfile({ smartMatchUpdates: value })} /><Toggle title="Announcements" description="News and schedule changes from NU Laguna" value={profile.announcementUpdates !== false} onChange={value => updateProfile({ announcementUpdates: value })} /><Toggle title="Email copies" description="Also send updates to your student email" value={profile.emailUpdates} onChange={value => updateProfile({ emailUpdates: value })} /><p className="profile-demo-note">Email copies are a local demo preference. No email is sent.</p></section><ResetData compact /></div><aside className="support-aside"><section className="card"><p className="eyebrow">Preferences</p><button className="profile-action" onClick={() => setLanguage(true)}><span className="support-icon-tile navy"><Asset page="profile" file="897bf" /></span><span><strong>Language</strong><small>English · Filipino coming soon</small></span><Asset page="profile" file="52ab3" /></button></section><section className="card"><p className="eyebrow">Help</p><Link className="profile-action" to="/student/help"><span className="support-icon-tile green"><Asset page="profile" file="56784" /></span><span><strong>Help center & FAQs</strong><small>Common questions about NUL Guide</small></span><Asset page="profile" file="52ab3" /></Link><button className="profile-action" onClick={() => setContact(true)}><span className="support-icon-tile purple"><Asset page="profile" file="2d9ff" /></span><span><strong>Contact NUL Guide support</strong><small>Handled by IT Services</small></span><Asset page="profile" file="52ab3" /></button></section>{logout}</aside>{language && <Modal title="Language" onClose={() => setLanguage(false)}><p>English is currently selected. Filipino will be available in a future version.</p></Modal>}{contact && office && <ContactOffice office={office} onClose={() => setContact(false)} />}</div>;
}

export function HelpCenter() {
  const { data } = useApp();
  const [query, setQuery] = useState('');
  const [faq, setFaq] = useState(null);
  const [contact, setContact] = useState(false);
  const office = data.offices.find(o => /IT Services/i.test(o.name)) || data.offices[0];
  const filtered = useMemo(() => FAQS.map((item, index) => ({ item, index })).filter(({ item }) => item.join(' ').toLowerCase().includes(query.toLowerCase())), [query]);
  return <div className="support-page help-page"><Back to="/student/profile" page="help" file="41784">Profile</Back><PageHeader title="Help Center" subtitle="How can we help you today? Get support, find offices, or check on a concern you’ve submitted." /><SearchInput value={query} onChange={setQuery} placeholder="Search help topics..." /><div className="help-top-actions"><Link className="help-action green" to="/student/submit"><span className="support-icon-tile solid-green"><Asset page="help" file="0c31b" /></span><span><strong>Submit a Concern</strong><small>Describe your problem or issue</small></span><Asset page="help" file="683d6" /></Link><Link className="help-action purple" to="/student/find"><span className="support-icon-tile solid-purple"><Asset page="help" file="90869" /></span><span><strong>Get Office Recommendation</strong><small>Let us match you with the right office</small></span><Asset page="help" file="683d6" /></Link></div><p className="eyebrow">Browse by category</p><div className="help-categories">{[['Office Directory', 'Find any office on campus', '/student/offices', 'ba402', 'navy'], ['Directions & Contacts', 'Get there or reach out', '/student/directions', '8fdfc', 'gold'], ['Track a Concern', 'Check your concern status', '/student/concerns', '6e5fa', 'green']].map(([title, description, to, icon, color]) => <Link className="card help-action" to={to} key={title}><span className={`support-icon-tile ${color}`}><Asset page="help" file={icon} /></span><span><strong>{title}</strong><small>{description}</small></span></Link>)}</div><div className="help-bottom"><section className="card help-faqs"><p className="eyebrow">Frequently asked</p>{filtered.length ? filtered.map(({ item: [question, answer], index }) => <div className="help-faq" key={question}><button aria-expanded={faq === index} onClick={() => setFaq(faq === index ? null : index)}>{question}<Asset page="help" file="ace18" /></button>{faq === index && <p>{answer}</p>}</div>) : <p className="muted help-no-results">No help topics match your search. Try “password”, “office”, or “concern”.</p>}</section><section className="card help-contact"><p className="eyebrow">Still need help?</p><button className="help-contact-action" onClick={() => setContact(true)}><span><Asset page="help" file="15274" /></span><span><strong>Live Chat</strong><small>Chat with a support staff now</small></span></button><a className="help-contact-action" href={`mailto:${office?.email || 'guide.support@nu-laguna.edu.ph'}`}><span><Asset page="help" file="27d95" /></span><span><strong>Email Us</strong><small>{office?.email || 'guide.support@nu-laguna.edu.ph'}</small></span></a><a className="help-contact-action" href={phoneHref(office?.phone || '(049) 123-4567')}><span><Asset page="help" file="4a48b" /></span><span><strong>Call the Office</strong><small>{office?.phone || '(049) 123-4567'} · {office?.building || 'Admin Bldg'}</small></span></a><small className="help-demo-note">Contact details and chat are demonstration samples.</small></section></div><div className="help-reset-note"><span>Local demonstration data is saved in this browser.</span><ResetData compact /></div>{contact && office && <ContactOffice office={office} onClose={() => setContact(false)} />}</div>;
}
