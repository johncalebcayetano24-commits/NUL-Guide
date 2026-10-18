// Demo relevance rules. Scores measure keyword agreement, not AI confidence.
const normalize = (value) => String(value || '').toLowerCase().normalize('NFKD').replace(/[’']/g, '').replace(/[^a-z0-9]+/g, ' ').trim();

const rules = [
  { name: /it services|information technology/, strong: ['student portal', 'password', 'reset password', 'log in', 'login', 'wifi', 'wi fi', 'internet', 'nu account', 'email account', 'computer', 'learning management', 'microsoft', 'teams', 'lms', 'technical'], weak: ['portal', 'account', 'access', 'system', 'online'] },
  { name: /registrar/, strong: ['enrollment', 'enrolment', 'enroll', 'enrol', 'transcript', 'academic record', 'grades', 'grade', 'subject loading', 'drop subject', 'add subject', 'school record', 'certificate of registration', 'diploma', 'registration', 'schedule'], weak: ['subject', 'course', 'record', 'document', 'student id'] },
  { name: /cashier|finance|accounting/, strong: ['tuition', 'payment', 'pay', 'balance', 'receipt', 'refund', 'scholarship payment', 'assessment', 'financial', 'fees', 'fee'], weak: ['money', 'cost', 'bill', 'payment question'] },
  { name: /clinic|health/, strong: ['medical', 'sick', 'fever', 'injury', 'injured', 'headache', 'health', 'first aid', 'medicine', 'nurse', 'doctor', 'medical clearance', 'pain', 'dizzy', 'clinic'], weak: ['unwell', 'assistance'] },
  { name: /guidance|counsel/, strong: ['counseling', 'counselling', 'mental health', 'anxiety', 'stressed', 'stress', 'wellness', 'career guidance', 'emotional', 'depression', 'counselor'], weak: ['advice', 'support', 'personal', 'career'] },
  { name: /student affairs/, strong: ['school id', 'lost id', 'student organization', 'student activity', 'student activities', 'club', 'event', 'discipline', 'student conduct', 'student council', 'id card', 'school uniform'], weak: ['organization', 'activity', 'student life', 'student concern'] },
  { name: /admission/, strong: ['admission', 'application', 'apply', 'entrance exam', 'freshman', 'new student', 'transfer student', 'applicant'], weak: ['requirements', 'scholarship'] },
  { name: /library/, strong: ['library', 'borrow book', 'return book', 'overdue', 'research database', 'journal', 'library clearance'], weak: ['book', 'research', 'reference'] },
];

function contains(text, term) {
  const padded = ` ${text} `;
  const phrase = normalize(term);
  if (padded.includes(` ${phrase} `)) return true;
  const words = phrase.split(' ');
  const last = words.pop();
  const plural = /[^aeiou]y$/.test(last) ? `${last.slice(0, -1)}ies` : `${last}s`;
  return padded.includes(` ${[...words, plural].join(' ')} `);
}

export function matchConcern(text, offices = []) {
  const query = String(text || '').trim();
  const input = normalize(query);
  if (!input || !Array.isArray(offices)) return { state: 'none', matches: [], query };

  const ranked = offices.map((office) => {
    const name = normalize(office.name);
    const rule = rules.find((item) => item.name.test(name));
    const direct = name.length > 3 && contains(input, name);
    const mentalHealthRequest = contains(input, 'mental health');
    const genericHealthWord = (word) => mentalHealthRequest && /clinic|health/.test(name) && normalize(word) === 'health';
    const strong = (rule?.strong || []).filter((word) => contains(input, word) && !genericHealthWord(word));
    const weak = (rule?.weak || []).filter((word) => contains(input, word));
    // Office keywords remain effective when a staff member edits the directory.
    const custom = (office.keywords || []).filter((word) => normalize(word).length > 2 && contains(input, word) && !genericHealthWord(word));
    const servicePhrases = (office.services || []).filter((service) => normalize(service).length > 4 && contains(input, normalize(service)));
    const reasons = [...new Set([...strong, ...weak, ...custom, ...servicePhrases])];
    let score = direct ? 98 : strong.length ? Math.min(95, 78 + 8 * (strong.length - 1)) : custom.length ? Math.min(86, 72 + 5 * (custom.length - 1)) : weak.length ? Math.min(65, 44 + weak.length * 8) : 0;
    if (servicePhrases.length) score = Math.max(score, 90);
    if (!direct && strong.length && weak.length) score = Math.min(95, score + 3);
    return { office, score, reasons: direct ? [office.name, ...reasons] : reasons };
  }).filter((item) => item.score > 0).sort((a, b) => b.score - a.score || a.office.name.localeCompare(b.office.name));

  if (!ranked.length) return { state: 'none', matches: [], query };
  // Requests spanning different categories need clarification, e.g. subject payment.
  const mixedCategories = ranked.length > 1 && ranked[0].office.category !== ranked[1].office.category && ranked[1].score >= 50 && ranked[0].score - ranked[1].score < 28;
  if (mixedCategories) ranked.forEach((item, index) => { item.score = Math.min(item.score, Math.max(40, 64 - index * 8)); });
  const state = ranked[0].score >= 70 ? 'recommended' : 'low';
  // The prototype also suggests the offices that can check enrollment/account
  // records when an IT request may need a referral. These fixed fallback scores
  // never influence the main match or the clarification threshold.
  if (state === 'recommended' && /it services|information technology/.test(normalize(ranked[0].office.name))) {
    const related = [
      [/registrar/, 58, 'May assist if portal access is tied to enrollment or student records.'],
      [/student affairs/, 31, 'Can help with general student assistance and office referrals.'],
    ];
    for (const [name, score, reason] of related) {
      const office = offices.find((item) => name.test(normalize(item.name)));
      if (office && !ranked.some((item) => item.office.id === office.id)) ranked.push({ office, score, reasons: [reason] });
    }
    ranked.sort((a, b) => b.score - a.score || a.office.name.localeCompare(b.office.name));
  }
  return { state, matches: ranked.slice(0, 3), query };
}
