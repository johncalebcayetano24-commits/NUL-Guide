import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useApp } from '../../state/AppContext';
import { Avatar, Button, EmptyState, Field, Modal, PageHeader, SearchInput } from '../../components/UI';
import '../../styles/staff.css';

const STATUSES = ['Pending', 'In Progress', 'Resolved'];
const CATEGORIES = ['Academic', 'Admin', 'Finance', 'Health', 'Student Life', 'Tech'];
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const STATUS_FILES = { Pending: '47ed4.svg', 'In Progress': '8808d.svg', Resolved: '9daa6.svg', Active: '9daa6.svg' };

function Asset({ group = 'staff-dashboard', file, className = '' }) {
  return <img className={`staff-asset ${className}`} src={`/assets/${group}/${file}`} alt="" aria-hidden="true" />;
}

function Status({ status }) {
  return <span className={`staff-status staff-status-${status.toLowerCase().replaceAll(' ', '-')}`}>
    {STATUS_FILES[status] && <Asset group="staff-concerns" file={STATUS_FILES[status]} />}{status}
  </span>;
}

function dateLabel(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Just now' : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'Asia/Manila' });
}

function timeLabel(value) {
  const elapsed = Math.max(0, Date.now() - new Date(value).getTime());
  if (!Number.isFinite(elapsed) || elapsed < 60000) return 'Just now';
  if (elapsed < 3600000) return `${Math.floor(elapsed / 60000)} min ago`;
  if (elapsed < 86400000) return `${Math.floor(elapsed / 3600000)} hours ago`;
  if (elapsed < 172800000) return 'Yesterday';
  return `${Math.floor(elapsed / 86400000)} days ago`;
}

function getStudent(data, id) {
  return data.students.find(student => student.id === id) || { name: 'Student', maskedId: '—' };
}

function ConcernModal({ concern, onClose }) {
  const { data, session, updateConcern, notify } = useApp();
  const [form, setForm] = useState({ officeId: concern.officeId, assignedTo: concern.assignedTo || '', status: concern.status, response: concern.response || '' });
  const [error, setError] = useState('');
  const student = getStudent(data, concern.studentId);
  const set = (key, value) => setForm(current => ({ ...current, [key]: value }));
  const save = (resolve = false) => {
    if (!form.officeId) return setError('Select the office that will handle this concern.');
    if ((resolve || form.status === 'Resolved') && !form.response.trim()) return setError('Add a response explaining the resolution before resolving this concern.');
    updateConcern(concern.id, { ...form, assignedTo: form.assignedTo.trim(), response: form.response.trim(), status: resolve ? 'Resolved' : form.status });
    notify(resolve || form.status === 'Resolved' ? 'Concern resolved. The student can now leave feedback.' : 'Concern changes saved.');
    onClose();
  };
  return <Modal title={concern.id} onClose={onClose} wide className="staff-concern-modal" footer={<>
    <Button variant="secondary" className="staff-cancel" onClick={onClose}>Cancel</Button>
    <Button variant="secondary" className="staff-resolve" onClick={() => save(true)}><Asset group="staff-concern-modal" file="81b7e.svg" />Resolve concern</Button>
    <Button onClick={() => save()}>Save changes</Button>
  </>}>
    <div className="staff-concern-detail">
      <div className="staff-concern-summary"><div><h3>{concern.title}</h3><p>{student.name} · {concern.category} · Submitted {dateLabel(concern.createdAt)}</p></div><Status status={concern.status} /></div>
      <p className="staff-description">{concern.description}</p>
      <ol className="staff-progress" aria-label="Concern progress">{STATUSES.map((status, index) => <li key={status} className={index <= STATUSES.indexOf(concern.status) ? 'reached' : ''}><Asset group="staff-concern-modal" file={index <= STATUSES.indexOf(concern.status) ? 'e196b.svg' : '08ffa.svg'} /><span>{status}</span></li>)}</ol>
      <div className="form-grid staff-assignment">
        <Field label="Assigned office"><select value={form.officeId} onChange={event => set('officeId', event.target.value)}>{data.offices.map(office => <option key={office.id} value={office.id}>{office.name}</option>)}</select></Field>
        <Field label="Assigned staff"><div className="staff-assign-input"><input value={form.assignedTo} placeholder="Unassigned" onChange={event => set('assignedTo', event.target.value)} /><Button variant="secondary" onClick={() => set('assignedTo', session.name || 'Maria Santos')}>Me</Button></div></Field>
      </div>
      <fieldset className="staff-status-field"><legend>Status</legend><div className="staff-status-control">{STATUSES.map((status, index) => <button type="button" key={status} aria-pressed={form.status === status} className={form.status === status ? 'selected' : ''} onClick={() => set('status', status)}><Asset group="staff-concern-modal" file={['2e6cf.svg', form.status === status ? '8a15c.svg' : '8808d.svg', '3db96.svg'][index]} />{status}</button>)}</div></fieldset>
      <Field label="Add response to student"><textarea rows="3" value={form.response} placeholder={`Write a helpful response to ${student.name.split(' ')[0]}…`} onChange={event => set('response', event.target.value)} /></Field>
      {error && <p className="staff-form-error" role="alert">{error}</p>}
      <section className="staff-history"><h4 className="eyebrow">History</h4>{concern.history?.length ? concern.history.map((item, index) => <div className="staff-history-item" key={`${item.at}-${index}`}><strong>{item.text || `Status changed to ${item.status}.`}</strong><small>{item.by || 'NUL Guide'} · {timeLabel(item.at)} · {item.status}</small></div>) : <div className="staff-history-item"><strong>Concern submitted and matched to {data.offices.find(office => office.id === concern.officeId)?.name || 'an office'}.</strong><small>NUL Guide · {timeLabel(concern.createdAt)} · Pending</small></div>}</section>
    </div>
  </Modal>;
}

export function StaffDashboard() {
  const { data, session, updateConcern, notify } = useApp();
  const [opened, setOpened] = useState(null);
  const navigate = useNavigate();
  const counts = STATUSES.map(status => data.concerns.filter(concern => concern.status === status).length);
  const requests = data.concerns.filter(concern => concern.status === 'Pending' && !concern.assignedTo).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 2);
  const recent = [...data.concerns].sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt)).slice(0, 4);
  const quickActions = [
    { title: 'Manage Office Profile', text: 'Update hours, services, and staff info', file: '8e288.svg', tone: 'brown', action: () => navigate('/staff/offices', { state: { editOfficeId: data.offices.find(office => /IT Services/i.test(office.name))?.id } }) },
    { title: 'Manage Staff Assignments', text: 'Assign requests to available staff', file: '35a28.svg', tone: 'purple', action: () => navigate('/staff/concerns?status=Pending') },
    { title: 'Message Center', text: 'Respond to student inquiries', file: '79364.svg', tone: 'blue', action: () => navigate('/staff/concerns?status=In%20Progress') },
  ];
  return <div className="staff-page staff-dashboard">
    <div className="staff-dashboard-heading"><Avatar name={session.name || 'Maria Santos'} size={46} /><div><h1>Staff Dashboard</h1><p>{session.name || 'Maria Santos'} · IT Services Staff</p></div><span className="staff-role-label">Staff</span></div>
    <div className="staff-stat-grid">{[...STATUSES, 'Total Concerns'].map((status, index) => <Link className={`card staff-stat stat-${index}`} to={index === 3 ? '/staff/concerns' : `/staff/concerns?status=${encodeURIComponent(status)}`} key={status}><strong>{index === 3 ? data.concerns.length : counts[index]}</strong><span><Asset file={['d8cea.svg', '41421.svg', '5990b.svg', '451f0.svg'][index]} />{index === 0 ? 'Pending Concerns' : status}</span></Link>)}</div>
    <div className="staff-dashboard-columns"><div className="staff-main-column">
      <section><div className="staff-section-heading"><h2 className="eyebrow">New requests</h2><Link to="/staff/concerns">All concerns</Link></div><div className="staff-request-grid">{requests.length ? requests.map(concern => { const student = getStudent(data, concern.studentId); return <article className="card staff-request" key={concern.id}><div className="staff-request-heading"><Avatar name={student.name} size={32} /><div><h3>{concern.category}</h3><p>{student.name} · {timeLabel(concern.createdAt)}</p></div><span className="staff-new"><Asset file="73482.svg" />New</span></div><p>{concern.title}</p><div className="actions"><Button className="staff-assign-button" onClick={() => { updateConcern(concern.id, { assignedTo: session.name || 'Maria Santos', status: 'In Progress' }); notify('Concern assigned to you.'); }}>Assign to Me</Button><Button variant="secondary" onClick={() => setOpened(concern.id)}>Respond</Button></div></article>; }) : <div className="card staff-requests-empty"><EmptyState title="All caught up" description="New unassigned requests will appear here." /></div>}</div></section>
      <section><h2 className="eyebrow staff-quick-label">Quick actions</h2><div className="staff-quick-actions">{quickActions.map(action => <button className="staff-quick-action" key={action.title} onClick={action.action}><span className={`staff-action-tile ${action.tone}`}><Asset file={action.file} /></span><span><strong>{action.title}</strong><small>{action.text}</small></span><Asset file="52ab3.svg" /></button>)}</div></section>
    </div><aside className="staff-aside">
      <section className="card staff-workload"><h2 className="eyebrow">Workload</h2><div className="staff-workload-bar" aria-label={`${counts[0]} pending, ${counts[1]} in progress, ${counts[2]} resolved`}>{counts.map((count, index) => <span key={STATUSES[index]} className={`workload-${index}`} style={{ flexGrow: count }} />)}</div><div className="staff-workload-legend">{STATUSES.map((status, index) => <span key={status}><i className={`workload-${index}`} />{status} {counts[index]}</span>)}</div></section>
      <section className="card staff-activity"><h2 className="eyebrow">Recent activity</h2>{recent.length ? recent.map(concern => <button className="staff-history-item" key={concern.id} onClick={() => setOpened(concern.id)}><strong>{concern.id} · {concern.status}</strong><small>{concern.response ? `${concern.assignedTo || 'Staff'} replied` : `Submitted by ${getStudent(data, concern.studentId).name}`} · {timeLabel(concern.updatedAt || concern.createdAt)}</small></button>) : <p className="muted">No concern activity yet.</p>}</section>
    </aside></div>
    {opened && data.concerns.find(concern => concern.id === opened) && <ConcernModal key={opened} concern={data.concerns.find(concern => concern.id === opened)} onClose={() => setOpened(null)} />}
  </div>;
}

export function StaffConcerns() {
  const { data } = useApp();
  const [params, setParams] = useSearchParams();
  const [opened, setOpened] = useState(params.get('open') || params.get('concern'));
  const query = params.get('q') || '';
  const status = params.get('status') || '';
  const officeId = params.get('office') || '';
  const studentId = params.get('student') || '';
  const setFilter = (key, value) => { const next = new URLSearchParams(params); value ? next.set(key, value) : next.delete(key); setParams(next, { replace: true }); };
  useEffect(() => { if (params.get('open') || params.get('concern')) setOpened(params.get('open') || params.get('concern')); }, [params]);
  const concerns = data.concerns.filter(concern => {
    const student = getStudent(data, concern.studentId);
    return (!status || concern.status === status) && (!officeId || concern.officeId === officeId) && (!studentId || concern.studentId === studentId) && `${concern.id} ${concern.title} ${student.name} ${student.email || ''}`.toLowerCase().includes(query.trim().toLowerCase());
  });
  const closeModal = () => { setOpened(null); if (params.has('open') || params.has('concern')) { const next = new URLSearchParams(params); next.delete('open'); next.delete('concern'); setParams(next, { replace: true }); } };
  return <div className="staff-page"><PageHeader title="Concerns" subtitle="View, assign, respond to, and resolve student concerns." />
    <div className="staff-filters"><SearchInput value={query} onChange={event => setFilter('q', typeof event === 'string' ? event : event.target.value)} placeholder="Search by reference, concern, or student…" /><select aria-label="Filter concerns by status" value={status} onChange={event => setFilter('status', event.target.value)}><option value="">All statuses</option>{STATUSES.map(item => <option key={item}>{item}</option>)}</select><select aria-label="Filter concerns by office" value={officeId} onChange={event => setFilter('office', event.target.value)}><option value="">All offices</option>{data.offices.map(office => <option key={office.id} value={office.id}>{office.name}</option>)}</select></div>
    {studentId && <div className="staff-filter-notice"><span>Showing concerns for <strong>{getStudent(data, studentId).name}</strong></span><button type="button" onClick={() => setFilter('student', '')}>Show all students</button></div>}
    <div className="table-wrap staff-table-wrap"><table className="data-table staff-concern-table"><thead><tr><th>Reference number</th><th>Student concern</th><th>Assigned office</th><th>Date submitted</th><th>Status</th><th>Action</th></tr></thead><tbody>{concerns.map(concern => { const student = getStudent(data, concern.studentId); const office = data.offices.find(item => item.id === concern.officeId); return <tr key={concern.id}><td><span className="staff-reference">{concern.id}</span></td><td><strong>{concern.title}</strong><small>{student.name} · {concern.category}</small></td><td>{office?.name || 'Unassigned office'}<small>{concern.assignedTo || 'Unassigned'}</small></td><td>{dateLabel(concern.createdAt)}<small>{timeLabel(concern.createdAt)}</small></td><td><Status status={concern.status} /></td><td><Button variant="secondary" onClick={() => setOpened(concern.id)}>Open</Button></td></tr>; })}</tbody></table>{concerns.length === 0 && <EmptyState title="No matching concerns" description="Try a different search or change your filters." />}</div>
    {opened && data.concerns.find(concern => concern.id === opened) && <ConcernModal key={opened} concern={data.concerns.find(concern => concern.id === opened)} onClose={closeModal} />}
  </div>;
}

const OFFICE_ICONS = [
  [/registrar/i, '1730b.svg', 'blue'], [/IT services/i, '79887.svg', 'purple'], [/clinic/i, '8b9a9.svg', 'red'], [/student affairs/i, 'b10ab.svg', 'teal'], [/cashier/i, '4ce51.svg', 'gold'], [/guidance|counsel/i, '1dd81.svg', 'green'], [/admissions/i, '88e58.svg', 'brown'], [/library/i, 'e8cc4.svg', 'blue'],
];

function OfficeIcon({ name }) {
  const [, file, tone] = OFFICE_ICONS.find(([pattern]) => pattern.test(name)) || OFFICE_ICONS[0];
  return <span className={`staff-office-icon ${tone}`}><Asset group="staff-offices" file={file} /></span>;
}

function timeInput(hour = '8', minute = '00', period = 'AM') {
  return `${String((Number(hour) % 12) + (period.toUpperCase() === 'PM' ? 12 : 0)).padStart(2, '0')}:${minute || '00'}`;
}

function displayTime(value) {
  const [hour, minute] = value.split(':').map(Number);
  return `${hour % 12 || 12}${minute ? `:${String(minute).padStart(2, '0')}` : ''} ${hour >= 12 ? 'PM' : 'AM'}`;
}

function OfficeModal({ office, onClose }) {
  const { updateOffice, notify } = useApp();
  const [form, setForm] = useState(() => {
    const matches = [...(office.hours || '').matchAll(/(\d{1,2})(?::(\d{2}))?\s*(AM|PM)/gi)];
    return { name: '', category: 'Admin', description: '', building: '', floor: '', room: '', phone: '', email: '', ...office, status: office.status === 'Inactive' ? 'Inactive' : 'Active', services: (office.services || []).join(' · '), days: office.days || (/Mon.*Sat/i.test(office.hours || '') ? DAYS.slice(0, 6) : DAYS.slice(0, 5)), opens: matches[0] ? timeInput(matches[0][1], matches[0][2], matches[0][3]) : '08:00', closes: matches[1] ? timeInput(matches[1][1], matches[1][2], matches[1][3]) : '17:00' };
  });
  const [error, setError] = useState('');
  const set = (key, value) => setForm(current => ({ ...current, [key]: value }));
  const save = event => {
    event.preventDefault();
    if (!form.days.length) return setError('Select at least one operating day.');
    if (form.opens >= form.closes) return setError('Closing time must be later than opening time.');
    const orderedDays = DAYS.filter(day => form.days.includes(day));
    const dayText = orderedDays.length > 2 && orderedDays.every((day, index) => index === 0 || DAYS.indexOf(day) === DAYS.indexOf(orderedDays[index - 1]) + 1) ? `${orderedDays[0]}–${orderedDays.at(-1)}` : orderedDays.join(', ');
    updateOffice({ ...office, ...form, id: office.id || `office-${Date.now()}`, name: form.name.trim(), description: form.description.trim(), services: form.services.split(/[·,\n]/).map(item => item.trim()).filter(Boolean), hours: `${dayText}, ${displayTime(form.opens)}–${displayTime(form.closes)}` });
    notify(office.id ? 'Office changes saved and reflected in the student directory.' : 'Office added to the student directory.');
    onClose();
  };
  return <Modal title={office.id ? `Edit ${office.name}` : 'Add Office'} onClose={onClose} wide footer={<><Button variant="secondary" className="staff-cancel" onClick={onClose}>Cancel</Button><Button type="submit" form="office-editor">Save changes</Button></>}>
    <form id="office-editor" className="staff-office-form" onSubmit={save}>
      <div className="form-grid"><Field label="Office name"><input required value={form.name} onChange={event => set('name', event.target.value)} /></Field><Field label="Category"><select value={form.category} onChange={event => set('category', event.target.value)}>{CATEGORIES.map(category => <option key={category}>{category}</option>)}</select></Field></div>
      <Field label="Description"><input required value={form.description} onChange={event => set('description', event.target.value)} /></Field>
      <div className="staff-three-fields"><Field label="Building"><input required value={form.building} onChange={event => set('building', event.target.value)} /></Field><Field label="Floor"><input required value={form.floor} onChange={event => set('floor', event.target.value)} /></Field><Field label="Room"><input required value={form.room} onChange={event => set('room', event.target.value)} /></Field></div>
      <fieldset className="staff-days"><legend>Office hours</legend><div>{DAYS.map(day => <button key={day} type="button" aria-pressed={form.days.includes(day)} className={form.days.includes(day) ? 'selected' : ''} onClick={() => set('days', form.days.includes(day) ? form.days.filter(item => item !== day) : [...form.days, day])}>{day}</button>)}</div></fieldset>
      <div className="staff-three-fields"><Field label="Opens"><input type="time" required value={form.opens} onChange={event => set('opens', event.target.value)} /></Field><Field label="Closes"><input type="time" required value={form.closes} onChange={event => set('closes', event.target.value)} /></Field><Field label="Status"><select value={form.status} onChange={event => set('status', event.target.value)}><option>Active</option><option>Inactive</option></select></Field></div>
      <div className="form-grid"><Field label="Phone"><input required type="tel" value={form.phone} onChange={event => set('phone', event.target.value)} /></Field><Field label="Email"><input required type="email" value={form.email} onChange={event => set('email', event.target.value)} /></Field></div>
      <Field label="Services"><input required value={form.services} placeholder="Separate services with a comma or ·" onChange={event => set('services', event.target.value)} /></Field>
      {error && <p className="staff-form-error" role="alert">{error}</p>}
    </form>
  </Modal>;
}

export function StaffOffices() {
  const { data } = useApp();
  const location = useLocation();
  const [editing, setEditing] = useState(null);
  useEffect(() => { if (location.state?.editOfficeId) { const office = data.offices.find(item => item.id === location.state.editOfficeId); if (office) setEditing(office); } }, [location.key]);
  return <div className="staff-page"><PageHeader title="Offices" subtitle="Keep office information accurate for students." action={<Button onClick={() => setEditing({})}><Asset group="staff-offices" file="6cfda.svg" />Add Office</Button>} />
    <div className="table-wrap staff-table-wrap"><table className="data-table staff-offices-table"><thead><tr><th>Office</th><th>Location</th><th>Office hours</th><th>Contact</th><th>Status</th><th>Action</th></tr></thead><tbody>{data.offices.map(office => <tr key={office.id}><td><div className="staff-office-name"><OfficeIcon name={office.name} /><span><strong>{office.name}</strong><small>{office.services.length} services</small></span></div></td><td>{office.building}<small>{office.floor}, {office.room}</small></td><td>{office.hours}</td><td>{office.phone}<small>{office.email}</small></td><td><Status status={office.status === 'Inactive' ? 'Inactive' : 'Active'} /></td><td><Button variant="secondary" onClick={() => setEditing(office)}><Asset group="staff-offices" file="97aaf.svg" />Edit</Button></td></tr>)}</tbody></table>{data.offices.length === 0 && <EmptyState title="No offices yet" description="Add an office to help students find university services." />}</div>
    {editing && <OfficeModal key={editing.id || 'new'} office={editing} onClose={() => setEditing(null)} />}
  </div>;
}

export function StaffStudents() {
  const { data } = useApp();
  const navigate = useNavigate();
  const students = useMemo(() => data.students.map(student => { const concerns = data.concerns.filter(concern => concern.studentId === student.id); return { ...student, total: concerns.length, open: concerns.filter(concern => concern.status !== 'Resolved').length }; }).filter(student => student.total > 0), [data.students, data.concerns]);
  return <div className="staff-page"><PageHeader title="Students" subtitle="Students who have submitted concerns. Only details needed to handle requests are shown." />
    <div className="table-wrap staff-table-wrap"><table className="data-table staff-students-table"><thead><tr><th>Student</th><th>Student ID</th><th>Open concerns</th><th>Total</th><th>Action</th></tr></thead><tbody>{students.map(student => <tr key={student.id}><td><div className="staff-student-name"><Avatar name={student.name} size={32} /><strong>{student.name}</strong></div></td><td>{student.maskedId || '••••••'}</td><td>{student.open}</td><td>{student.total}</td><td><Button variant="secondary" onClick={() => navigate(`/staff/concerns?student=${encodeURIComponent(student.id)}`)}>View concerns</Button></td></tr>)}</tbody></table>{students.length === 0 && <EmptyState title="No student requests yet" description="Students will appear here after submitting a concern." />}</div>
  </div>;
}
