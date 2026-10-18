import { useEffect } from 'react';
import { Link, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { useApp } from './state/AppContext';
import { Button, EmptyState, Modal } from './components/UI';
import AppLayout from './layouts/AppLayout';
import Login from './pages/Login';
import Home from './pages/student/Home';
import { FindService, Recommendation, OfficeDirectory, OfficeDetails, Directions } from './pages/student/Services';
import { SubmitConcern, MyConcerns, ConcernDetails, Notifications, Announcements, Profile, HelpCenter, SubmissionSuccess } from './pages/student/Support';
import { StaffDashboard, StaffConcerns, StaffOffices, StaffStudents } from './pages/staff/StaffPages';

function RequireSession({ role }) {
  const { session } = useApp();
  return session?.role === role ? <AppLayout staff={role === 'staff'} /> : <Navigate to={role === 'staff' ? '/login?role=staff' : '/login'} replace />;
}
function NotFound() {
  const { session } = useApp();
  return <div className="not-found"><EmptyState title="This page could not be found" description="The link may have changed. Return to NUL Guide to find the office or service you need."><Link className="btn btn-primary" to={session ? `/${session.role}/${session.role === 'staff' ? 'dashboard' : 'home'}` : '/login'}>Return to NUL Guide</Link></EmptyState></div>;
}
export default function App() {
  const { session, logoutRequested, cancelLogout, logout } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [location.pathname]);
  return <>
    <Routes>
      <Route path="/" element={<Navigate to={session ? `/${session.role}/${session.role === 'staff' ? 'dashboard' : 'home'}` : '/login'} replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/student" element={<RequireSession role="student" />}>
        <Route index element={<Navigate to="home" replace />} />
        <Route path="home" element={<Home />} />
        <Route path="find" element={<FindService />} />
        <Route path="recommendation" element={<Recommendation />} />
        <Route path="offices" element={<OfficeDirectory />} />
        <Route path="offices/:officeId" element={<OfficeDetails />} />
        <Route path="directions" element={<Directions />} />
        <Route path="submit" element={<SubmitConcern />} />
        <Route path="success/:concernId" element={<SubmissionSuccess />} />
        <Route path="concerns" element={<MyConcerns />} />
        <Route path="concerns/:concernId" element={<ConcernDetails />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="announcements" element={<Announcements />} />
        <Route path="profile" element={<Profile />} />
        <Route path="help" element={<HelpCenter />} />
      </Route>
      <Route path="/staff" element={<RequireSession role="staff" />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<StaffDashboard />} />
        <Route path="concerns" element={<StaffConcerns />} />
        <Route path="offices" element={<StaffOffices />} />
        <Route path="students" element={<StaffStudents />} />
        <Route path="notifications" element={<Notifications staff />} />
        <Route path="profile" element={<Profile staff />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
    {logoutRequested && <Modal title="Log out of NUL Guide?" onClose={cancelLogout} footer={<><Button variant="secondary" onClick={cancelLogout}>Stay logged in</Button><Button onClick={() => { logout(); navigate('/login'); }}>Log Out</Button></>}><p className="muted">You can log back in anytime with your NU account.</p></Modal>}
  </>;
}
