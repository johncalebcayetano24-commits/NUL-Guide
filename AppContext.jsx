import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { createSeedData, STUDENT_ID } from '../data/seed';
import { appendConcernUpdate, nextReference } from '../utils/domain';

export const DATA_KEY = 'nul-guide-data-v1';
const SESSION_KEY = 'nul-guide-session-v1';
const AppContext = createContext(null);

function readData() {
  try {
    const saved = JSON.parse(localStorage.getItem(DATA_KEY));
    if (saved?.version === 1 && ['offices', 'concerns', 'students', 'notifications', 'announcements'].every(key => Array.isArray(saved[key])) && saved.profile) return saved;
  } catch { /* An unavailable or malformed store falls back to valid sample data. */ }
  return createSeedData();
}
function readSession() {
  try {
    const saved = JSON.parse(sessionStorage.getItem(SESSION_KEY) || localStorage.getItem(SESSION_KEY));
    return ['student', 'staff'].includes(saved?.role) ? saved : null;
  } catch { return null; }
}

export function AppProvider({ children }) {
  const [data, setData] = useState(readData);
  const dataRef = useRef(data);
  const [session, setSession] = useState(readSession);
  const [toast, setToast] = useState('');
  const [logoutRequested, setLogoutRequested] = useState(false);
  const storageWarning = useRef(false);
  const notify = useCallback(message => setToast(message), []);

  const commit = useCallback(updater => {
    const next = updater(dataRef.current);
    dataRef.current = next;
    setData(next);
    try { localStorage.setItem(DATA_KEY, JSON.stringify(next)); }
    catch {
      if (!storageWarning.current) {
        storageWarning.current = true;
        setToast('Browser storage is unavailable. Changes will last for this open session only.');
      }
    }
    return next;
  }, []);

  useEffect(() => {
    function sync(event) { if (event.key === DATA_KEY) { const next = readData(); dataRef.current = next; setData(next); } }
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(''), 5500);
    return () => clearTimeout(timer);
  }, [toast]);

  const login = useCallback((role, keep = false, guest = false) => {
    const next = { role, guest, name: role === 'staff' ? 'Maria Santos' : guest ? 'Guest' : dataRef.current.profile.name };
    try {
      sessionStorage.removeItem(SESSION_KEY); localStorage.removeItem(SESSION_KEY);
      // Each tab keeps its own role while the optional local copy survives a browser restart.
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(next));
      if (keep) localStorage.setItem(SESSION_KEY, JSON.stringify(next));
    } catch { /* Session remains available in memory. */ }
    setSession(next);
    return next;
  }, []);
  const logout = useCallback(() => {
    try { sessionStorage.removeItem(SESSION_KEY); localStorage.removeItem(SESSION_KEY); } catch {}
    setSession(null); setLogoutRequested(false);
  }, []);

  const createConcern = useCallback(payload => {
    if (!session || session.role !== 'student' || session.guest) throw new Error('Sign in with the student demo account to submit a concern.');
    if (!payload.title?.trim() || !payload.description?.trim() || !payload.category || !dataRef.current.offices.some(o => o.id === payload.officeId)) throw new Error('Complete the required concern fields and select an office.');
    const at = new Date().toISOString();
    const record = { ...payload, id: nextReference(dataRef.current.concerns), studentId: STUDENT_ID, title: payload.title.trim(), description: payload.description.trim(), status: 'Pending', assignedTo: '', response: '', createdAt: at, updatedAt: at, feedback: null, history: [{ status: 'Pending', text: 'Concern submitted and sent to the assigned office.', at, by: dataRef.current.profile.name }] };
    commit(current => ({ ...current, concerns: [record, ...current.concerns], notifications: [{ id: crypto.randomUUID(), role: 'staff', title: 'New concern', message: `${current.profile.name} submitted ${record.id}: ${record.title}`, at, read: false, concernId: record.id }, ...current.notifications] }));
    return record;
  }, [commit, session]);

  const updateConcern = useCallback((id, changes) => {
    const old = dataRef.current.concerns.find(c => c.id === id);
    if (!old) throw new Error('This concern could not be found.');
    const at = new Date().toISOString();
    const updated = appendConcernUpdate(old, changes, at);
    commit(current => ({ ...current, concerns: current.concerns.map(c => c.id === id ? updated : c), notifications: old.studentId === STUDENT_ID && current.profile.concernUpdates !== false ? [{ id: crypto.randomUUID(), role: 'student', title: changes.status === 'Resolved' ? 'Concern Resolved' : changes.response && changes.response !== old.response ? 'New Staff Response' : 'Concern Updated', message: `${id}: ${changes.status || updated.status}${changes.response && changes.response !== old.response ? ' — ' + changes.response : ''}`, at, read: false, concernId: id }, ...current.notifications] : current.notifications }));
    return updated;
  }, [commit]);

  const updateOffice = useCallback(office => {
    const record = { ...office, id: office.id || `office-${crypto.randomUUID()}`, sampleContact: true };
    commit(current => ({ ...current, offices: current.offices.some(o => o.id === record.id) ? current.offices.map(o => o.id === record.id ? { ...o, ...record } : o) : [...current.offices, record] }));
    return record;
  }, [commit]);
  const markNotification = useCallback(id => commit(current => ({ ...current, notifications: current.notifications.map(n => n.id === id ? { ...n, read: true } : n) })), [commit]);
  const markAllNotifications = useCallback(role => commit(current => ({ ...current, notifications: current.notifications.map(n => n.role === role ? { ...n, read: true } : n) })), [commit]);
  const updateProfile = useCallback(updates => {
    commit(current => ({ ...current, profile: { ...current.profile, ...updates }, students: current.students.map(s => s.id === STUDENT_ID ? { ...s, name: updates.name || s.name } : s) }));
  }, [commit]);
  const submitFeedback = useCallback((id, feedback) => {
    const record = dataRef.current.concerns.find(c => c.id === id);
    if (!record || record.status !== 'Resolved' || record.studentId !== STUDENT_ID || record.feedback || !Number.isInteger(feedback.rating) || feedback.rating < 1 || feedback.rating > 5) throw new Error('Choose a rating from 1 to 5 for a resolved concern that has no feedback yet.');
    commit(current => ({ ...current, concerns: current.concerns.map(c => c.id === id ? { ...c, feedback: { ...feedback, at: new Date().toISOString() } } : c) }));
  }, [commit]);
  const resetData = useCallback(() => { commit(() => createSeedData()); notify('Default sample data restored.'); }, [commit, notify]);

  return <AppContext.Provider value={{ data, session, login, logout, createConcern, updateConcern, updateOffice, markNotification, markAllNotifications, updateProfile, submitFeedback, resetData, notify, logoutRequested, requestLogout: () => setLogoutRequested(true), cancelLogout: () => setLogoutRequested(false) }}>
    {children}
    {toast && <div className="toast" role="status"><span>{toast}</span><button type="button" aria-label="Dismiss notification" onClick={() => setToast('')}>×</button></div>}
  </AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used inside AppProvider.');
  return context;
}
