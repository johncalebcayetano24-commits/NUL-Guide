import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Brand, Button, Field, Modal } from '../components/UI';
import { DEMO_PASSWORD } from '../data/seed';
import assets from '../data/assets';
import { useApp } from '../state/AppContext';
import '../styles/login.css';

export default function Login() {
  const [params, setParams] = useSearchParams();
  const role = params.get('role') === 'staff' ? 'staff' : 'student';
  const staff = role === 'staff';
  const { login, notify } = useApp();
  const navigate = useNavigate();
  const [email, setEmail] = useState(staff ? 'maria.santos@nu-laguna.edu.ph' : 'juan.delacruz@students.nu-laguna.edu.ph');
  const [password, setPassword] = useState(DEMO_PASSWORD);
  const [showPassword, setShowPassword] = useState(false);
  const [keep, setKeep] = useState(false);
  const [error, setError] = useState('');
  const [dialog, setDialog] = useState(null);
  const [resetEmail, setResetEmail] = useState('juan.delacruz@students.nu-laguna.edu.ph');
  const [resetSent, setResetSent] = useState(false);
  const [resetError, setResetError] = useState('');
  const a = assets['student-login'];
  const switchRole = value => { setParams(value === 'staff' ? { role: value } : {}); setEmail(value === 'staff' ? 'maria.santos@nu-laguna.edu.ph' : 'juan.delacruz@students.nu-laguna.edu.ph'); setError(''); };
  const submit = event => {
    event.preventDefault();
    if (!email.trim() || !password) return setError('Enter your demo account and password.');
    const allowed = staff ? ['maria.santos@nu-laguna.edu.ph'] : ['juan.delacruz@students.nu-laguna.edu.ph', '2025-1024378'];
    if (!allowed.includes(email.trim().toLowerCase()) || password !== DEMO_PASSWORD) return setError('These details do not match the selected demo account. Open Demo login details below.');
    login(role, keep); navigate(staff ? '/staff/dashboard' : '/student/home');
  };
  const reset = event => { event.preventDefault(); if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(resetEmail.trim())) return setResetError('Enter a valid NU email address.'); setResetSent(true); setResetError(''); };
  return <div className="auth-page"><section className="auth-art" aria-label="NUL Guide introduction"><div className="auth-background"><img src={a.imgLoginArt} alt="" /><div /></div><div className="auth-brand"><Brand light /></div><div className="nu-crest" aria-label="National University logo"><img className="nu-crest-navy" src={a.img35408Eff} alt="" /><img className="nu-crest-white" src={a.imgFfffffff} alt="" /><img className="nu-crest-gold" src={a.imgFfd41Cff} alt="" /></div><h2 className="auth-hero-title">Find the right office.<br /><span>Get help faster.</span></h2><p className="auth-hero-description">Describe your concern in your own words. NUL Guide points you to the right office, shows you how to get there, and tracks your request until it’s resolved.</p><p className="auth-tagline">Education that works.®</p></section>
    <main className="auth-form-side"><div className="auth-form-wrap"><div className="auth-heading"><h1>Welcome back</h1>{staff ? <p>Sign in with your staff or admin account</p> : <p>New to NUL Guide? <button type="button" onClick={() => setDialog('account')}>Create an account</button></p>}</div><div className="auth-role-toggle" aria-label="Select login role"><button className={!staff ? 'selected' : ''} aria-pressed={!staff} type="button" onClick={() => switchRole('student')}><img src={a.imgIconUser} alt="" />Student</button><button className={staff ? 'selected' : ''} aria-pressed={staff} type="button" onClick={() => switchRole('staff')}><img src={a.imgIconShield} alt="" />Staff / Admin</button></div>
      <form className="auth-form" onSubmit={submit} noValidate><Field label={staff ? 'Staff email' : 'Student email or Student ID'}><input autoComplete="username" value={email} onChange={event => setEmail(event.target.value)} aria-invalid={!!error} /></Field><Field label="Password"><div className="auth-password"><input autoComplete="current-password" type={showPassword ? 'text' : 'password'} value={password} onChange={event => setPassword(event.target.value)} aria-invalid={!!error} /><button className="icon-button" type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} aria-pressed={showPassword} onClick={() => setShowPassword(value => !value)}><img src={a.imgIconEye} alt="" /></button></div></Field><div className="auth-options"><label><input type="checkbox" checked={keep} onChange={event => setKeep(event.target.checked)} />Keep me signed in</label><button type="button" onClick={() => { setDialog('reset'); setResetSent(false); setResetError(''); }}>Forgot password?</button></div>{error && <p className="field-error" role="alert">{error}</p>}<Button type="submit">{staff ? 'Log in to Staff Dashboard' : 'Log in to NUL Guide'}</Button></form>
      {!staff && <><div className="auth-divider"><span />or<span /></div><Button variant="secondary" className="auth-guest" onClick={() => { login('student', false, true); navigate('/student/home'); }}>Continue as Guest</Button></>}<div className="auth-info"><img src={a.imgIconInfo} alt="" /><p>{staff ? 'Staff accounts are created by the NUL Guide administrator. Students should use the Student tab.' : 'Staff and administrators switch to “Staff / Admin” above to open the Staff Dashboard.'}</p></div><details className="auth-demo"><summary>Demo login details</summary><p>This local assessment simulates sign-in. The accounts above are prefilled.</p><p>Student: juan.delacruz@students.nu-laguna.edu.ph<br />or Student ID: 2025-1024378</p><p>Staff: maria.santos@nu-laguna.edu.ph<br />Password for both: <code>{DEMO_PASSWORD}</code></p></details></div></main>
    {dialog === 'reset' && <Modal title="Reset your password" onClose={() => setDialog(null)} footer={resetSent ? <Button onClick={() => setDialog(null)}>Done</Button> : <><Button variant="secondary" onClick={() => setDialog(null)}>Cancel</Button><Button type="submit" form="reset-form">Send reset link</Button></>}>{resetSent ? <div className="stack"><p>Demo reset request recorded.</p><p className="muted">No email is sent by this front-end demonstration. Use the demo password <code>{DEMO_PASSWORD}</code> to sign in.</p></div> : <form id="reset-form" className="stack" onSubmit={reset} noValidate><p className="muted">Enter your NU email. If it’s registered, we’ll send you a link to reset your password.</p><Field label="NU email" error={resetError}><input type="email" autoComplete="email" value={resetEmail} onChange={event => setResetEmail(event.target.value)} /></Field><small className="muted">Local demonstration: no reset email will be sent.</small></form>}</Modal>}
    {dialog === 'account' && <Modal title="Create an account" onClose={() => setDialog(null)} footer={<Button onClick={() => { setDialog(null); notify('Student demo account is ready. Select Log in to NUL Guide.'); }}>Use the student demo account</Button>}><p className="muted">NU accounts are normally provided by the university. This assessment uses Juan Dela Cruz’s sample account so you can explore all student features.</p><p className="auth-account-note">No account information is sent to a server.</p></Modal>}
  </div>;
}
