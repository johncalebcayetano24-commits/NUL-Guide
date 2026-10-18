export function nextReference(concerns, date = new Date()) {
  const year = new Intl.DateTimeFormat('en', { year: 'numeric', timeZone: 'Asia/Manila' }).format(date);
  const prefix = `NUL-${year}-`;
  const greatest = concerns.reduce((max, concern) => concern.id.startsWith(prefix) ? Math.max(max, Number(concern.id.slice(prefix.length)) || 0) : max, 0);
  return `${prefix}${String(greatest + 1).padStart(5, '0')}`;
}

export function appendConcernUpdate(concern, changes, at = new Date().toISOString()) {
  const events = [];
  const status = changes.status || concern.status;
  if (changes.assignedTo !== undefined && changes.assignedTo !== concern.assignedTo) events.push({ status, text: changes.assignedTo ? `Assigned to ${changes.assignedTo}.` : 'Staff assignment cleared.', at, by: 'Maria Santos' });
  if (changes.officeId && changes.officeId !== concern.officeId) events.push({ status, text: 'Concern transferred to the selected office.', at, by: 'Maria Santos' });
  if (changes.status && changes.status !== concern.status) events.push({ status, text: `Status changed to ${status}.`, at, by: 'Maria Santos' });
  if (changes.response !== undefined && changes.response.trim() && changes.response !== concern.response) events.push({ status, text: changes.response.trim(), at, by: 'Maria Santos', type: 'response' });
  return { ...concern, ...changes, updatedAt: at, history: [...concern.history, ...events] };
}

export function validateAttachment(file) {
  if (!file) return '';
  if (!/\.(pdf|jpe?g|png)$/i.test(file.name) || (file.type && !['application/pdf', 'image/jpeg', 'image/png'].includes(file.type))) return 'Choose a PDF, JPG, or PNG file.';
  if (file.size > 10 * 1024 * 1024) return 'The attachment must be 10 MB or smaller.';
  return '';
}
