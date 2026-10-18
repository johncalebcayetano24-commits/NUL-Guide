import test from 'node:test';
import assert from 'node:assert/strict';
import { createSeedData } from '../src/data/seed.js';
import { matchConcern } from '../src/utils/matching.js';

const offices = createSeedData().offices;

test('the core student service examples recommend the relevant office', async t => {
  const examples = [
    ['I forgot my student portal password and cannot log in.', 'it'],
    ['I need help with enrollment and subject loading.', 'registrar'],
    ['My tuition payment has not been reflected in my balance.', 'cashier'],
    ['I have a fever and need a medical consultation.', 'clinic'],
    ['I need counseling because I have been feeling stressed.', 'guidance'],
    ['How can I join a student organization or club?', 'student-affairs'],
    ['I want to apply for admission as a new student.', 'admissions'],
    ['Where can I borrow books from the library?', 'library'],
  ];
  for (const [query, expectedId] of examples) await t.test(expectedId, () => {
    const result = matchConcern(query, offices);
    assert.equal(result.state, 'recommended');
    assert.equal(result.matches[0].office.id, expectedId);
    assert.ok(result.matches[0].score >= 70);
    assert.ok(result.matches[0].reasons.length > 0);
  });
});

test('matching normalizes case, punctuation, apostrophes, and Wi-Fi spelling', () => {
  const result = matchConcern('  I CAN’T LOG IN—my WI-FI connection fails!  ', offices);
  assert.equal(result.state, 'recommended');
  assert.equal(result.matches[0].office.id, 'it');
  assert.equal(result.query, 'I CAN’T LOG IN—my WI-FI connection fails!');
});

test('an explicit office name produces a strong direct recommendation', () => {
  const result = matchConcern('Please send this request to the IT Services Office.', offices);
  assert.equal(result.state, 'recommended');
  assert.equal(result.matches[0].office.id, 'it');
  assert.equal(result.matches[0].score, 98);
  assert.ok(result.matches[0].reasons.includes('IT Services Office'));
});

test('a request spanning subject and payment categories asks for clarification', () => {
  const result = matchConcern('I have a subject payment question.', offices);
  assert.equal(result.state, 'low');
  assert.ok(result.matches.length >= 2);
  assert.ok(result.matches.some(match => match.office.id === 'registrar'));
  assert.ok(result.matches.some(match => match.office.id === 'cashier'));
  assert.ok(result.matches[0].score < 70);
});

test('weak signals produce a low relevance result rather than a confident recommendation', () => {
  const result = matchConcern('I need some personal advice.', offices);
  assert.equal(result.state, 'low');
  assert.equal(result.matches[0].office.id, 'guidance');
  assert.ok(result.matches[0].score < 70);
});

test('unrelated text, blanks, unavailable offices, and invalid office lists return no match', () => {
  for (const query of ['', '   ', null, 'Where can I park a bicycle?']) {
    const result = matchConcern(query, offices);
    assert.equal(result.state, 'none');
    assert.deepEqual(result.matches, []);
  }
  assert.equal(matchConcern('Reset my password', []).state, 'none');
  assert.equal(matchConcern('Reset my password', null).state, 'none');
});

test('word boundaries prevent unrelated substrings from triggering payment rules', () => {
  const result = matchConcern('I enjoy painting and playing in the playground.', offices);
  assert.equal(result.state, 'none');
});

test('staff-maintained keywords and service phrases participate in matching', () => {
  const editedOffices = [
    { id: 'custom', name: 'Campus Support Desk', category: 'Admin', services: ['Locker replacement'], keywords: ['locker'] },
  ];
  assert.equal(matchConcern('My locker is broken.', editedOffices).matches[0].office.id, 'custom');
  const serviceMatch = matchConcern('I need a locker replacement.', editedOffices);
  assert.equal(serviceMatch.state, 'recommended');
  assert.equal(serviceMatch.matches[0].score, 90);
  assert.ok(serviceMatch.matches[0].reasons.includes('Locker replacement'));
});

test('results are deterministic, limited to three alternatives, and do not mutate directory records', () => {
  const original = structuredClone(offices);
  const query = 'I need password, enrollment, payment, medical, and library assistance.';
  const first = matchConcern(query, offices);
  assert.deepEqual(matchConcern(query, offices), first);
  assert.deepEqual(offices, original);
  assert.ok(first.matches.length > 0 && first.matches.length <= 3);
  for (let index = 0; index < first.matches.length; index += 1) {
    assert.ok(first.matches[index].score > 0 && first.matches[index].score <= 98);
    if (index) assert.ok(first.matches[index - 1].score >= first.matches[index].score);
  }
});
