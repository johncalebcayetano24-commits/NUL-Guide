export const STUDENT_ID = 'student-juan';
export const DEMO_PASSWORD = 'NULGuide2026!';
export const categories = ['Academic', 'Admin', 'Finance', 'Health', 'Student Life', 'Tech'];
export const concernCategories = ['IT/Technical Support', 'Academic & Enrollment', 'Student Services & Health', 'Finance & Payments', 'Something else'];

const office = (id, name, category, description, department, building, floor, room, services, extra = {}) => ({
  id, name, category, description, department, building, floor, room, services,
  hours: 'Mon–Fri, 8 AM–5 PM', status: 'Open',
  phone: `(049) 123-4567 loc. ${room.replace(/\D/g, '') || '200'}`,
  email: `${id.replace('-', '')}@nu-laguna.edu.ph`,
  sampleContact: true, ...extra,
});

// These are the prototype's sample records, not verified university contact data.
const offices = [
  office('registrar', 'Registrar’s Office', 'Academic', 'Handles enrollment, subject loading, student records, and official documents.', 'Office of the Registrar', 'Admin Building', 'Ground Floor', '102', ['Enrollment assistance', 'Subject loading', 'Student records', 'Transcript requests', 'Enrollment certification', 'Adding and dropping subjects'], { keywords: ['enrollment', 'enroll', 'subject', 'grades', 'transcript', 'records', 'certificate of enrollment'] }),
  office('it', 'IT Services Office', 'Tech', 'Supports student portal access, NU accounts, campus Wi-Fi, and learning systems.', 'Information Technology Department', 'Tech Building', '2nd Floor', '204', ['Student portal access', 'NU account & password reset', 'Campus Wi-Fi connection', 'Microsoft 365 / MS Teams', 'Learning management system', 'Technical troubleshooting'], { email: 'itservices@nu-laguna.edu.ph', keywords: ['portal', 'password', 'account', 'wifi', 'wi-fi', 'internet', 'login', 'log in', 'teams', 'computer', 'technical'] }),
  office('cashier', 'Cashier’s Office', 'Finance', 'Assists with tuition payments, fees, balances, and payment verification.', 'Finance Department', 'Admin Building', 'Ground Floor', '105', ['Tuition payments', 'Payment verification', 'Official receipts', 'Balance inquiries', 'Refund requests', 'Payment arrangements'], { hours: 'Mon–Fri, 8 AM–4 PM', keywords: ['tuition', 'payment', 'pay', 'receipt', 'fees', 'balance', 'refund', 'financial'] }),
  office('guidance', 'Guidance & Counseling', 'Student Life', 'Provides confidential counseling, wellbeing support, and student guidance.', 'Guidance and Counseling Office', 'Student Center', '3rd Floor', '301', ['Individual counseling', 'Wellbeing consultations', 'Career guidance', 'Peer support', 'Adjustment support', 'Student assessments'], { hours: 'Mon–Fri, 9 AM–4 PM', status: 'Opens 9 AM', keywords: ['counseling', 'counselling', 'stress', 'anxiety', 'mental health', 'career', 'wellbeing'] }),
  office('clinic', 'University Clinic', 'Health', 'Offers first aid, medical consultations, and health services for students.', 'Health Services', 'Main Building', 'Ground Floor', '110', ['First aid', 'Medical consultation', 'Medical certificates', 'Health assessment', 'Health records', 'Medical referrals'], { hours: 'Mon–Sat, 7 AM–6 PM', email: 'clinic@nu-laguna.edu.ph', keywords: ['medical', 'health', 'sick', 'fever', 'pain', 'injury', 'clinic', 'medicine', 'first aid'] }),
  office('student-affairs', 'Student Affairs Office', 'Student Life', 'Supports student organizations, campus activities, and student concerns.', 'Office of Student Affairs', 'Student Center', '2nd Floor', '201', ['Student organizations', 'Campus activities', 'Student ID assistance', 'Student conduct', 'Student welfare', 'Event approval'], { email: 'studentaffairs@nu-laguna.edu.ph', keywords: ['student id', 'school id', 'organization', 'club', 'activity', 'event', 'lost id', 'student conduct'] }),
  office('admissions', 'Admissions Office', 'Admin', 'Helps prospective and incoming students with applications and admission requirements.', 'Admissions Department', 'Admin Building', 'Ground Floor', '101', ['Application assistance', 'Admission requirements', 'Campus inquiries', 'Transfer applications', 'New student orientation'], { keywords: ['admission', 'application', 'apply', 'incoming', 'transfer'] }),
  office('library', 'Library', 'Academic', 'Provides learning resources, borrowing services, and research assistance.', 'University Library', 'Main Building', '2nd Floor', 'Reading Area', ['Book borrowing', 'Research assistance', 'Digital resources', 'Library clearance', 'Study spaces', 'Reference services'], { hours: 'Mon–Fri, 8 AM–6 PM', keywords: ['book', 'library', 'borrow', 'research', 'journal', 'reading'] }),
];

const students = [
  { id: STUDENT_ID, name: 'Juan Dela Cruz', email: 'juan.delacruz@students.nu-laguna.edu.ph', course: 'BS Information Technology', year: '2nd Year', maskedId: '2025-***4378' },
  { id: 'student-jasmine', name: 'Jasmine Diaz', email: 'jasmine.diaz@example.edu', course: 'BS Information Technology', year: '2nd Year', maskedId: '2025-***2186' },
  { id: 'student-andrea', name: 'Andrea Reyes', email: 'andrea.reyes@example.edu', course: 'BS Computer Science', year: '1st Year', maskedId: '2026-***0891' },
  { id: 'student-paolo', name: 'Paolo Cruz', email: 'paolo.cruz@example.edu', course: 'BS Accountancy', year: '3rd Year', maskedId: '2024-***3912' },
  { id: 'student-mark', name: 'Mark Garcia', email: 'mark.garcia@example.edu', course: 'BS Business Administration', year: '2nd Year', maskedId: '2025-***6723' },
];

const makeConcern = (number, studentId, title, category, officeId, status, createdAt, response = '') => {
  const id = `NUL-2026-${String(number).padStart(5, '0')}`;
  const history = [{ status: 'Pending', text: 'Concern submitted and sent to the assigned office.', at: createdAt, by: 'Student' }];
  if (status !== 'Pending') history.push({ status: 'In Progress', text: 'Maria Santos is reviewing your concern.', at: '2026-09-28T08:00:00+08:00', by: 'Maria Santos' });
  if (status === 'Resolved') history.push({ status: 'Resolved', text: response || 'Your concern has been resolved.', at: '2026-09-29T09:30:00+08:00', by: 'Maria Santos' });
  return { id, reference: id, studentId, title, category, officeId, status, description: title + '. Please help me with the next steps. Thank you.', assignedTo: status === 'Pending' ? '' : 'Maria Santos', response, createdAt, updatedAt: history.at(-1).at, history, contactPreference: 'Email', attachment: null, feedback: null };
};

export function createSeedData() {
  return {
    version: 1,
    offices: structuredClone(offices), students: structuredClone(students),
    profile: { name: 'Juan Dela Cruz', email: 'juan.delacruz@students.nu-laguna.edu.ph', studentId: '2025-1024378', course: 'BS Information Technology', year: '2nd Year', campus: 'NU Laguna', phone: '', concernUpdates: true, smartMatchUpdates: true, announcementUpdates: true, emailUpdates: false, smsUpdates: false },
    concerns: [
      makeConcern(124, STUDENT_ID, 'Can’t log in to the student portal', 'IT/Technical Support', 'it', 'Pending', '2026-09-28T09:00:00+08:00'),
      makeConcern(123, STUDENT_ID, 'Can’t access the student portal after password reset', 'IT/Technical Support', 'it', 'In Progress', '2026-09-24T10:00:00+08:00', 'Hi Juan, we’re checking your account. Please try resetting your password using your registered NU email. We’ll update you once your access is restored.'),
      makeConcern(122, 'student-jasmine', 'Can’t access student portal after password reset.', 'IT/Technical Support', 'it', 'Pending', '2026-09-28T10:20:00+08:00'),
      makeConcern(121, 'student-andrea', 'Laptop not connecting to campus WiFi in Library.', 'IT/Technical Support', 'it', 'Pending', '2026-09-28T09:58:00+08:00'),
      makeConcern(120, 'student-paolo', 'Payment not reflected in student portal', 'Finance & Payments', 'cashier', 'In Progress', '2026-09-27T10:00:00+08:00', 'Payment located, posting now. Please check your balance again later today.'),
      {
        ...makeConcern(119, STUDENT_ID, 'Request for medical certificate for missed exam', 'Student Services & Health', 'clinic', 'Resolved', '2026-09-18T08:00:00+08:00', 'Your medical certificate is ready. Claim it at the University Clinic front desk and bring your student ID.'),
        updatedAt: '2026-09-21T09:30:00+08:00',
        history: [
          { status: 'Pending', text: 'Concern submitted and matched to University Clinic.', at: '2026-09-18T08:00:00+08:00', by: 'NUL Guide' },
          { status: 'In Progress', text: 'We are verifying your consultation record.', at: '2026-09-19T09:00:00+08:00', by: 'University Clinic' },
          { status: 'Resolved', text: 'Your medical certificate is ready.', at: '2026-09-21T09:30:00+08:00', by: 'University Clinic' },
        ],
        attachment: { name: 'consultation-slip.jpg', size: 248000, type: 'image/jpeg', sample: true },
      },
      makeConcern(118, 'student-mark', 'Request for enrollment certification', 'Academic & Enrollment', 'registrar', 'Resolved', '2026-09-17T08:00:00+08:00', 'Your enrollment certification is ready for collection at the Registrar’s Office.'),
      makeConcern(115, STUDENT_ID, 'Adding a subject after the enrollment deadline', 'Academic & Enrollment', 'registrar', 'Pending', '2026-09-27T09:00:00+08:00'),
    ],
    notifications: [
      { id: 'n1', role: 'student', title: 'Concern In Progress', message: 'Your concern NUL-2026-00123 is now In Progress.', at: '2026-09-28T08:00:00+08:00', read: false, concernId: 'NUL-2026-00123' },
      { id: 'n2', role: 'student', title: 'Office Match Found', message: 'We found a recommended office for your concern: Registrar’s Office.', at: '2026-09-28T05:00:00+08:00', read: false, officeId: 'registrar' },
      { id: 'n3', role: 'student', title: 'New Announcement', message: 'Enrollment period has been extended until Friday, October 2.', at: '2026-09-27T08:00:00+08:00', read: true, announcementId: 'a1' },
      { id: 'n7', role: 'student', title: 'Office Hours Updated', message: 'The University Clinic is now open until 6:00 PM on Saturdays.', at: '2026-09-26T08:00:00+08:00', read: true, officeId: 'clinic' },
      { id: 'n8', role: 'student', title: 'Concern Assigned', message: 'Your concern NUL-2026-00123 has been assigned to the IT Services Office.', at: '2026-09-25T08:00:00+08:00', read: true, concernId: 'NUL-2026-00123' },
      { id: 'n9', role: 'student', title: 'Concern Resolved', message: 'Your concern NUL-2026-00119 has been resolved.', at: '2026-09-21T09:30:00+08:00', read: true, concernId: 'NUL-2026-00119' },
      { id: 'n4', role: 'staff', title: 'New concern', message: 'Jasmine Diaz submitted NUL-2026-00122 to IT Services Office.', at: '2026-09-28T10:20:00+08:00', read: false, concernId: 'NUL-2026-00122' },
      { id: 'n5', role: 'staff', title: 'New concern', message: 'Andrea Reyes submitted NUL-2026-00121 to IT Services Office.', at: '2026-09-28T09:58:00+08:00', read: false, concernId: 'NUL-2026-00121' },
      { id: 'n6', role: 'staff', title: 'New concern', message: 'Paolo Cruz submitted NUL-2026-00120 to Cashier’s Office.', at: '2026-09-27T10:00:00+08:00', read: true, concernId: 'NUL-2026-00120' },
    ],
    announcements: [
      { id: 'a1', title: 'Late enrollment extended', message: 'Late enrollment for the 1st Trimester, A.Y. 2026–2027 is extended until Friday, October 2. Visit the Registrar’s Office or enroll through the student portal.', at: '2026-09-27T08:00:00+08:00', category: 'Academic', office: 'Registrar’s Office' },
      { id: 'a2', title: 'University Clinic Saturday hours', message: 'The University Clinic now stays open until 6:00 PM on Saturdays for consultations and first aid.', at: '2026-09-26T08:00:00+08:00', category: 'Health', office: 'University Clinic' },
    ],
  };
}
