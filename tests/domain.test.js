import test from 'node:test';
import assert from 'node:assert/strict';
import { appendConcernUpdate, nextReference, validateAttachment } from '../src/utils/domain.js';

const OCTOBER_2026 = new Date('2026-10-18T04:00:00Z');
const LIMIT = 10 * 1024 * 1024;

test('references use the greatest sequence in the current year, regardless of array order', () => {
  const concerns = [
    { id: 'NUL-2026-00004' },
    { id: 'NUL-2025-99999' },
    { id: 'NUL-2026-00124' },
    { id: 'NUL-2026-invalid' },
    { id: 'NUL-2026-00019' },
  ];
  assert.equal(nextReference(concerns, OCTOBER_2026), 'NUL-2026-00125');
  assert.equal(nextReference([], OCTOBER_2026), 'NUL-2026-00001');
});

test('sequential submissions generate unique references while preserving existing records', () => {
  const concerns = [{ id: 'NUL-2026-00124' }];
  const generated = [];
  for (let index = 0; index < 30; index += 1) {
    const id = nextReference(concerns, OCTOBER_2026);
    assert.equal(concerns.some(concern => concern.id === id), false);
    generated.push(id);
    concerns.unshift({ id });
  }
  assert.equal(new Set(generated).size, 30);
  assert.equal(generated[0], 'NUL-2026-00125');
  assert.equal(generated.at(-1), 'NUL-2026-00154');
});

test('reference years change at midnight in Manila and begin a fresh sequence', () => {
  const records = [{ id: 'NUL-2026-00999' }];
  assert.equal(nextReference(records, new Date('2026-12-31T15:59:59.999Z')), 'NUL-2026-01000');
  assert.equal(nextReference(records, new Date('2026-12-31T16:00:00.000Z')), 'NUL-2027-00001');
});

function pendingConcern() {
  return {
    id: 'NUL-2026-00125', studentId: 'student-juan', title: 'Cannot access portal',
    officeId: 'it', assignedTo: '', status: 'Pending', response: '',
    createdAt: '2026-10-18T03:00:00Z', updatedAt: '2026-10-18T03:00:00Z',
    attachment: { name: 'screenshot.png', size: 400 }, feedback: null,
    history: [{ status: 'Pending', text: 'Concern submitted.', at: '2026-10-18T03:00:00Z', by: 'Juan Dela Cruz' }],
  };
}

test('staff assignment, status, and response append history without mutating the original concern', () => {
  const original = pendingConcern();
  const before = structuredClone(original);
  const at = '2026-10-18T04:00:00Z';
  const updated = appendConcernUpdate(original, { assignedTo: 'Maria Santos', status: 'In Progress', response: 'Please try your account again.' }, at);
  assert.deepEqual(original, before);
  assert.notEqual(updated, original);
  assert.notEqual(updated.history, original.history);
  assert.equal(updated.id, original.id);
  assert.equal(updated.studentId, original.studentId);
  assert.equal(updated.createdAt, original.createdAt);
  assert.deepEqual(updated.attachment, original.attachment);
  assert.equal(updated.assignedTo, 'Maria Santos');
  assert.equal(updated.status, 'In Progress');
  assert.equal(updated.response, 'Please try your account again.');
  assert.equal(updated.updatedAt, at);
  assert.deepEqual(updated.history[0], original.history[0]);
  assert.equal(updated.history.length, 4);
  assert.ok(updated.history.slice(1).every(event => event.at === at && event.status === 'In Progress'));
  assert.ok(updated.history.some(event => /Assigned to Maria Santos/.test(event.text)));
  assert.ok(updated.history.some(event => event.text === 'Status changed to In Progress.'));
  assert.ok(updated.history.some(event => event.type === 'response' && event.text === updated.response));
});

test('resolving retains the earlier timeline and records the resolution and response', () => {
  const started = appendConcernUpdate(pendingConcern(), { assignedTo: 'Maria Santos', status: 'In Progress' }, '2026-10-18T04:00:00Z');
  const resolved = appendConcernUpdate(started, { status: 'Resolved', response: 'Your portal access is restored.' }, '2026-10-18T05:00:00Z');
  assert.equal(resolved.status, 'Resolved');
  assert.equal(resolved.assignedTo, 'Maria Santos');
  assert.deepEqual(resolved.history.slice(0, started.history.length), started.history);
  assert.equal(resolved.history.length, started.history.length + 2);
  assert.equal(resolved.history.at(-1).type, 'response');
  assert.equal(resolved.history.at(-1).status, 'Resolved');
});

test('office transfer and clearing an assignment remain auditable without changing the current status', () => {
  const started = { ...pendingConcern(), assignedTo: 'Maria Santos', status: 'In Progress' };
  const transferred = appendConcernUpdate(started, { officeId: 'registrar', assignedTo: '' }, '2026-10-18T04:30:00Z');
  assert.equal(transferred.officeId, 'registrar');
  assert.equal(transferred.assignedTo, '');
  assert.equal(transferred.status, 'In Progress');
  assert.ok(transferred.history.some(event => event.text === 'Staff assignment cleared.'));
  assert.ok(transferred.history.some(event => event.text === 'Concern transferred to the selected office.'));
});

test('saving unchanged fields does not duplicate timeline events', () => {
  const original = { ...pendingConcern(), response: 'We are checking this request.' };
  const saved = appendConcernUpdate(original, { status: original.status, assignedTo: original.assignedTo, officeId: original.officeId, response: original.response }, '2026-10-18T05:00:00Z');
  assert.deepEqual(saved.history, original.history);
  assert.equal(saved.updatedAt, '2026-10-18T05:00:00Z');
});

test('attachments accept the supported formats, uppercase extensions, and optional selection', () => {
  assert.equal(validateAttachment(null), '');
  for (const file of [
    { name: 'document.pdf', type: 'application/pdf', size: 1000 },
    { name: 'photo.jpg', type: 'image/jpeg', size: 1000 },
    { name: 'photo.JPEG', type: 'image/jpeg', size: 1000 },
    { name: 'screenshot.PNG', type: 'image/png', size: 1000 },
    { name: 'document.pdf', type: '', size: 1000 },
  ]) assert.equal(validateAttachment(file), '', file.name);
});

test('attachment size boundary permits exactly 10 MB and rejects one byte more', () => {
  assert.equal(validateAttachment({ name: 'document.pdf', type: 'application/pdf', size: LIMIT }), '');
  assert.match(validateAttachment({ name: 'document.pdf', type: 'application/pdf', size: LIMIT + 1 }), /10 MB/);
});

test('attachments reject unsupported extensions and inconsistent MIME types', () => {
  for (const file of [
    { name: 'program.exe', type: 'application/octet-stream', size: 10 },
    { name: 'photo.gif', type: 'image/gif', size: 10 },
    { name: 'disguised.pdf', type: 'text/html', size: 10 },
    { name: 'photo.png.exe', type: 'image/png', size: 10 },
  ]) assert.match(validateAttachment(file), /PDF, JPG, or PNG/, file.name);
});
