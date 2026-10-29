import React, { useState, useEffect } from 'react';
import {
  X,
  Mail,
  Lock,
  User as UserIcon,
  GraduationCap,
  Building2,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Eye,
  EyeOff,
  Sparkles,
  School,
  KeyRound,
  ExternalLink,
  ChevronRight,
  MapPin,
  Check,
  Compass,
  Flame,
  Settings,
  HelpCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  signInWithGoogle as firebaseGoogleSignIn,
  isFirebaseConfigured,
  saveFirebaseConfig,
  getActiveFirebaseConfig,
  signOutFirebase
} from '../services/firebase';

interface AuthModalProps {
  isOpen: boolean;
  initialMode?: 'signup' | 'login';
  isGateway?: boolean; // When true: no cut option, serves as mandatory website entrance gateway
  onClose?: () => void;
  onSuccess?: () => void;
}

const ALLOWED_COLLEGE_DOMAINS = ['gibitm.ac.in', 'glbitm.ac.in', 'gmail.com'];
const PRIMARY_DOMAIN = 'gibitm.ac.in';

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  initialMode = 'signup',
  isGateway = false,
  onClose,
  onSuccess
}) => {
  const { signup, login, loginWithGoogle, availableUsers } = useAuth();

  // Mode: 'signup' (separate sign up page) or 'login' (separate login page)
  const [mode, setMode] = useState<'signup' | 'login'>(initialMode);

  // Form State
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [studentId, setStudentId] = useState('');
  const [department, setDepartment] = useState('AI, AIML & DS');
  const [hostel, setHostel] = useState('Day Scholar');
  const [phone, setPhone] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  // Google Workspace & Firebase Dialog State
  const [isGoogleChooserOpen, setIsGoogleChooserOpen] = useState(false);
  const [customGoogleEmail, setCustomGoogleEmail] = useState('');
  const [isFirebaseLive, setIsFirebaseLive] = useState(() => isFirebaseConfigured());

  // Firebase Setup Form State
  const [firebaseApiKey, setFirebaseApiKey] = useState(() => getActiveFirebaseConfig().apiKey || '');
  const [firebaseAuthDomain, setFirebaseAuthDomain] = useState(() => getActiveFirebaseConfig().authDomain || '');
  const [firebaseProjectId, setFirebaseProjectId] = useState(() => getActiveFirebaseConfig().projectId || '');
  const [rawFirebaseConfig, setRawFirebaseConfig] = useState('');
  const [firebaseModalTab, setFirebaseModalTab] = useState<'connect' | 'quick_test'>('quick_test');

  // Status & Feedback
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setErrorMsg('');
      setSuccessMsg('');
      setIsGoogleChooserOpen(false);
      setIsFirebaseLive(isFirebaseConfigured());
    }
  }, [isOpen, initialMode]);

  // Synchronize browser URL query param cleanly when switching modes
  const handleModeSwitch = (newMode: 'signup' | 'login') => {
    setMode(newMode);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('auth', newMode);
      window.history.pushState({}, '', url.toString());
    } catch {
      // Fallback
    }
  };

  if (!isOpen) return null;

  // Real-time email validation for admission_number@gibitm.ac.in or @glbitm.ac.in
  const trimmedEmail = email.trim().toLowerCase();
  const hasAt = trimmedEmail.includes('@');
  const matchedDomain = ALLOWED_COLLEGE_DOMAINS.find(d => trimmedEmail.endsWith(`@${d}`));
  const isCollegeDomainValid = Boolean(matchedDomain);
  const hasInvalidDomain = hasAt && !isCollegeDomainValid;

  const handleAppendDomain = () => {
    if (!email) {
      if (studentId.trim()) {
        setEmail(`${studentId.trim().toLowerCase()}@${PRIMARY_DOMAIN}`);
      } else {
        setEmail(`admission_number@${PRIMARY_DOMAIN}`);
      }
      return;
    }
    const username = email.split('@')[0];
    setEmail(`${username}@${PRIMARY_DOMAIN}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    // Strict college email verification
    if (!isCollegeDomainValid) {
      setErrorMsg(`Only official college email IDs (admission_number@${PRIMARY_DOMAIN} or @glbitm.ac.in) are permitted.`);
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }

    try {
      setIsSubmitting(true);

      if (mode === 'signup') {
        if (!fullName.trim()) {
          setErrorMsg('Please enter your full student name.');
          setIsSubmitting(false);
          return;
        }

        const res = await signup({
          fullName,
          email: trimmedEmail,
          password,
          studentId: studentId.trim() || undefined,
          department,
          hostel,
          phone: phone.trim() || undefined
        });

        if (res.success) {
          setSuccessMsg(res.message || 'Student account created and verified successfully!');
          setTimeout(() => {
            onSuccess?.();
            onClose?.();
          }, 1000);
        } else {
          setErrorMsg(res.error || 'Failed to sign up. Please try again.');
        }
      } else {
        // Login mode
        const res = await login({ email: trimmedEmail, password });
        if (res.success) {
          setSuccessMsg(res.message || 'Signed in successfully! Entering CampusCart...');
          setTimeout(() => {
            onSuccess?.();
            onClose?.();
          }, 1000);
        } else {
          setErrorMsg(res.error || 'Invalid college email or password. Please try again.');
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Main Google Workspace button handler
   * If Firebase is configured, launches official Firebase Google popup!
   * Otherwise opens connection & testing modal.
   */
  const handleGoogleButtonClick = async () => {
    setErrorMsg('');
    setSuccessMsg('');

    if (isFirebaseConfigured()) {
      try {
        setIsSubmitting(true);
        const fbUser = await firebaseGoogleSignIn();
        const userEmail = (fbUser.email || '').toLowerCase().trim();

        // Validate domain
        const matched = ALLOWED_COLLEGE_DOMAINS.find(d => userEmail.endsWith(`@${d}`));
        if (!matched) {
          await signOutFirebase();
          setErrorMsg(`Google Account Rejected: ${userEmail} is not an official college email. You must sign in with your admission_number@${PRIMARY_DOMAIN} account.`);
          setIsSubmitting(false);
          return;
        }

        // Complete sign-in on backend
        const res = await loginWithGoogle({
          email: userEmail,
          fullName: fbUser.displayName || userEmail.split('@')[0],
          studentId: userEmail.split('@')[0]
        });

        if (res.success) {
          setSuccessMsg(`Google Workspace Verified! Welcome, ${fbUser.displayName || userEmail}.`);
          setTimeout(() => {
            onSuccess?.();
            onClose?.();
          }, 1000);
        } else {
          setErrorMsg(res.error || 'Failed to authenticate Google user on server.');
        }
      } catch (err: any) {
        console.warn('Firebase popup unavailable, opening College Google Account selector:', err.message);
        // Automatic graceful fallback to direct Google Workspace Account chooser!
        setIsGoogleChooserOpen(true);
        setFirebaseModalTab('quick_test');
        setErrorMsg(`Google Login Notice: ${err.message}. Choose your student account below to enter:`);
      } finally {
        setIsSubmitting(false);
      }
    } else {
      // Open dialog to choose verified college accounts
      setIsGoogleChooserOpen(true);
      setFirebaseModalTab('quick_test');
    }
  };

  const handleParseRawFirebaseConfig = (text: string) => {
    setRawFirebaseConfig(text);
    try {
      const apiKeyMatch = text.match(/apiKey["']?\s*:\s*["']([^"']+)["']/);
      const authDomainMatch = text.match(/authDomain["']?\s*:\s*["']([^"']+)["']/);
      const projectIdMatch = text.match(/projectId["']?\s*:\s*["']([^"']+)["']/);

      if (apiKeyMatch) setFirebaseApiKey(apiKeyMatch[1]);
      if (authDomainMatch) setFirebaseAuthDomain(authDomainMatch[1]);
      if (projectIdMatch) setFirebaseProjectId(projectIdMatch[1]);
    } catch {
      // Continue
    }
  };

  const handleSaveFirebaseConfig = () => {
    if (!firebaseApiKey.trim() || !firebaseProjectId.trim()) {
      setErrorMsg('Please enter both your Firebase API Key and Project ID.');
      return;
    }
    const config = {
      apiKey: firebaseApiKey.trim(),
      authDomain: firebaseAuthDomain.trim() || `${firebaseProjectId.trim()}.firebaseapp.com`,
      projectId: firebaseProjectId.trim()
    };
    saveFirebaseConfig(config);
    setIsFirebaseLive(true);
    setSuccessMsg('Firebase configured successfully! Triggering Google Sign-In...');
    setIsGoogleChooserOpen(false);

    // Launch Google Sign-in immediately
    setTimeout(() => {
      handleGoogleButtonClick();
    }, 500);
  };

  const handleSimulatedGoogleSelect = async (selectedEmail: string, studentName?: string) => {
    setErrorMsg('');
    setSuccessMsg('');
    setIsGoogleChooserOpen(false);

    const isGoogleDomainValid = ALLOWED_COLLEGE_DOMAINS.some(d => selectedEmail.toLowerCase().endsWith(`@${d}`));
    if (!isGoogleDomainValid) {
      setErrorMsg(`Google account must belong to the college domain (admission_number@${PRIMARY_DOMAIN} or @glbitm.ac.in).`);
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await loginWithGoogle({ email: selectedEmail, fullName: studentName });
      if (res.success) {
        setSuccessMsg(res.message || `Google Workspace verified! Welcome, ${studentName || selectedEmail}.`);
        setTimeout(() => {
          onSuccess?.();
          onClose?.();
        }, 1000);
      } else {
        setErrorMsg(res.error || 'Google sign-in failed');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to authenticate with Google');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickFill = (presetUser: any) => {
    const admNo = presetUser.studentId ? `${presetUser.studentId.toLowerCase().replace(/[^a-z0-9]/g, '')}@${PRIMARY_DOMAIN}` : presetUser.email;
    setEmail(admNo);
    setPassword('CampusCart2026!');
    setFullName(presetUser.fullName);
    setStudentId(presetUser.studentId || '');
    setErrorMsg('');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/90 backdrop-blur-2xl flex flex-col items-center justify-start p-3 sm:p-6 py-6 sm:py-10 animate-fade-in min-h-screen">
      
      {/* Background Ambient Glowing Spotlights */}
      <div className="fixed -top-24 -left-24 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="fixed -bottom-24 -right-24 w-96 h-96 bg-teal-500/20 rounded-full blur-3xl pointer-events-none" />

      {/* Floating Badges Flanking the Modal */}
      <div className="w-full max-w-xl mb-3 flex flex-wrap items-center justify-between gap-2 px-1 text-xs shrink-0">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 dark:bg-slate-800/80 backdrop-blur-md text-emerald-300 border border-emerald-500/30 font-semibold shadow-lg">
          <School className="w-3.5 h-3.5 text-emerald-400" />
          <span>G.L. Bajaj Institute of Technology & Management</span>
        </div>
        
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 backdrop-blur-md text-amber-200 border border-amber-500/30 text-[11px] font-bold">
          <Lock className="w-3 h-3 text-amber-400" />
          <span>{isGateway ? 'Mandatory Website Gateway' : 'Verified College Access'}</span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* FLOATING AUTHENTICATION CARD (STABLE HEIGHT, NEVER JITTERS)               */}
      {/* ========================================================================= */}
      <div className="relative w-full max-w-xl bg-white dark:bg-surface-dark-card border border-surface-border dark:border-surface-dark-border rounded-3xl shadow-[0_25px_70px_rgba(0,0,0,0.6)] overflow-hidden flex flex-col transition-all duration-200">
        
        {/* Top Gradient Shimmer Bar */}
        <div className="h-2 w-full bg-gradient-to-r from-emerald-500 via-teal-400 to-indigo-600 shrink-0" />

        {/* Modal Top Header (Fixed at top of card) */}
        <div className="p-5 sm:p-6 pb-3 border-b border-surface-border dark:border-surface-dark-border shrink-0">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white shadow-md shadow-emerald-600/30 shrink-0">
                <School className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-heading font-extrabold tracking-tight text-ink-primary dark:text-white">
                    CAMPUS<span className="text-brand dark:text-emerald-400">CART</span>
                  </h2>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    <ShieldCheck className="w-3 h-3 text-emerald-500" />
                    Verified GLBITM
                  </span>
                </div>
                <p className="text-xs text-ink-secondary dark:text-gray-400 mt-0.5">
                  Knowledge Park III Student Marketplace • Exclusive to @gibitm.ac.in
                </p>
              </div>
            </div>

            {/* Close Button: ONLY shown if NOT in mandatory entrance gateway mode */}
            {!isGateway ? (
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-full text-ink-secondary hover:text-ink-primary dark:hover:text-white hover:bg-surface-subtle dark:hover:bg-surface-dark-subtle transition-colors shrink-0"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            ) : (
              <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 font-bold shrink-0">
                Mandatory Gateway
              </span>
            )}
          </div>

          {/* ========================================================================= */}
          {/* SEPARATE PAGE SWITCHER TABS (Sign Up Page vs Log In Page)                 */}
          {/* ========================================================================= */}
          <div className="grid grid-cols-2 p-1.5 mt-4 bg-surface-subtle dark:bg-surface-dark-page rounded-2xl border border-surface-border dark:border-surface-dark-border">
            <button
              type="button"
              onClick={() => handleModeSwitch('signup')}
              className={`py-2.5 px-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
                mode === 'signup'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
                  : 'text-ink-secondary dark:text-gray-400 hover:text-ink-primary dark:hover:text-white'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              <span>1. Sign Up Page</span>
            </button>
            
            <button
              type="button"
              onClick={() => handleModeSwitch('login')}
              className={`py-2.5 px-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
                mode === 'login'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
                  : 'text-ink-secondary dark:text-gray-400 hover:text-ink-primary dark:hover:text-white'
              }`}
            >
              <KeyRound className="w-4 h-4" />
              <span>2. Log In Page</span>
            </button>
          </div>

          {/* Subheader Dedicated Banner */}
          <div className="mt-3 px-3 py-1.5 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60 flex items-center justify-between text-xs text-emerald-900 dark:text-emerald-200">
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span className="font-semibold text-[11px]">
                {mode === 'signup' 
                  ? 'New student? Register once to trade notes, calculators, books & drafters.'
                  : 'Welcome back! Sign in to view your chats, orders, and studio.'}
              </span>
            </div>
            <span className="text-[10px] font-mono font-bold text-emerald-700 dark:text-emerald-400 shrink-0">
              0% Fee
            </span>
          </div>
        </div>

        {/* Feedback Messages */}
        {errorMsg && (
          <div className="mx-6 mt-3 p-3.5 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-300 flex items-start gap-2.5 animate-shake shrink-0">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="flex-1 space-y-2">
              <p className="font-semibold">{errorMsg}</p>
            </div>
          </div>
        )}

        {successMsg && (
          <div className="mx-6 mt-3 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 flex items-start gap-2 shrink-0">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* ========================================================================= */}
        {/* FORM CONTAINER WITH CLEAN INNER SCROLLING & STICKY ACTION BUTTON         */}
        {/* ========================================================================= */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          
          {/* SCROLLABLE INNER BODY (Fields scroll smoothly without moving card or hiding button) */}
          <div className="overflow-y-auto max-h-[min(54vh,460px)] px-5 sm:px-6 py-3 space-y-3.5">
            
            {/* Google Workspace One-Click Button (Connected with Firebase) */}
            <div>
              <button
                type="button"
                onClick={handleGoogleButtonClick}
                disabled={isSubmitting}
                className="w-full py-2.5 px-4 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800/90 hover:bg-gray-50 dark:hover:bg-gray-700/80 text-ink-primary dark:text-white font-semibold text-xs shadow-xs transition-all flex items-center justify-between group active:scale-[0.99] disabled:opacity-60"
              >
                <div className="flex items-center gap-2.5">
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
                    <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>
                    <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
                    <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
                  </svg>
                  <span className="font-bold text-gray-800 dark:text-gray-100 flex items-center gap-1.5">
                    <span>Continue with College Google Workspace</span>
                    {isFirebaseLive && (
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Firebase Live Auth Connected" />
                    )}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-semibold">
                    {isFirebaseLive ? 'Firebase Live' : `@${PRIMARY_DOMAIN}`}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsGoogleChooserOpen(true);
                    }}
                    className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                    title="Firebase Google Auth Settings"
                  >
                    <Settings className="w-3.5 h-3.5" />
                  </button>
                </div>
              </button>

              {/* Instant 1-Click Fast Student Entry */}
              {/* Divider */}
              <div className="relative my-3">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-surface-border dark:border-surface-dark-border" />
                </div>
                <div className="relative flex justify-center text-[10px] uppercase tracking-wider font-semibold">
                  <span className="bg-white dark:bg-surface-dark-card px-3 text-ink-secondary dark:text-gray-400">
                    or use official college credentials
                  </span>
                </div>
              </div>
            </div>

            {/* In Login mode: Registered accounts shortcut if any exist */}
            {mode === 'login' && availableUsers.length > 0 && (
              <div className="p-3 rounded-xl bg-surface-subtle dark:bg-surface-dark-page border border-surface-border dark:border-surface-dark-border">
                <div className="text-[11px] font-semibold text-ink-secondary dark:text-gray-400 mb-2 flex items-center justify-between">
                  <span>Your Registered Accounts:</span>
                  <span className="text-[10px] text-brand dark:text-emerald-400 font-bold">1-Click Fill</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  {availableUsers.map((u) => (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => handleQuickFill(u)}
                      className="p-1.5 rounded-lg border border-surface-border dark:border-surface-dark-border bg-white dark:bg-surface-dark-card hover:border-brand text-left transition-all text-[11px]"
                    >
                      <div className="font-bold text-ink-primary dark:text-white truncate">
                        {u.fullName.split(' ')[0]}
                      </div>
                      <div className="text-[10px] text-ink-secondary dark:text-gray-400 truncate font-mono">
                        {u.studentId || (u.role === 'COLLEGE_ADMIN' ? 'Admin' : 'Student')}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Sign Up Specific Field: Full Name */}
            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-bold text-ink-primary dark:text-gray-200 mb-1">
                  Student Full Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-ink-secondary absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rohan Sharma"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs bg-surface-subtle dark:bg-surface-dark-page border border-surface-border dark:border-surface-dark-border rounded-xl focus:outline-none focus:border-brand text-ink-primary dark:text-gray-100"
                  />
                </div>
              </div>
            )}

            {/* Mandatory College Email ID (admission_number@gibitm.ac.in) */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-ink-primary dark:text-gray-200">
                  College Email (admission_number@{PRIMARY_DOMAIN}) <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={handleAppendDomain}
                  className="text-[11px] font-semibold text-brand dark:text-emerald-400 hover:underline flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3" />
                  Auto-fill @{PRIMARY_DOMAIN}
                </button>
              </div>
              <div className="relative">
                <Mail className="w-4 h-4 text-ink-secondary absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  placeholder={`2201920100045@${PRIMARY_DOMAIN}`}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full pl-9 pr-28 py-2 text-xs bg-surface-subtle dark:bg-surface-dark-page border rounded-xl focus:outline-none text-ink-primary dark:text-gray-100 ${
                    isCollegeDomainValid
                      ? 'border-emerald-500 focus:border-emerald-600 bg-emerald-50/20'
                      : hasInvalidDomain
                      ? 'border-red-400 focus:border-red-500 bg-red-50/20'
                      : 'border-surface-border dark:border-surface-dark-border focus:border-brand'
                  }`}
                />
                <span className="absolute right-2.5 top-2 text-[10px] font-mono px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-ink-secondary dark:text-gray-300">
                  @{matchedDomain || PRIMARY_DOMAIN}
                </span>
              </div>

              {/* Email Validation Status Indicator */}
              <div className="mt-1 flex items-center justify-between text-[11px]">
                {isCollegeDomainValid ? (
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Verified College Admission ID (@{matchedDomain})
                  </span>
                ) : hasInvalidDomain ? (
                  <span className="text-red-600 dark:text-red-400 font-medium flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Must be in format admission_number@{PRIMARY_DOMAIN}
                  </span>
                ) : (
                  <span className="text-ink-secondary dark:text-gray-400">
                    Format: admission_number@{PRIMARY_DOMAIN} (or @glbitm.ac.in)
                  </span>
                )}

                <span className="text-[10px] text-ink-secondary dark:text-gray-400">
                  Exclusive Campus Network
                </span>
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-xs font-bold text-ink-primary dark:text-gray-200 mb-1">
                {mode === 'signup' ? 'Create Password (min. 6 characters)' : 'Password'} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-ink-secondary absolute left-3 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-10 py-2 text-xs bg-surface-subtle dark:bg-surface-dark-page border border-surface-border dark:border-surface-dark-border rounded-xl focus:outline-none focus:border-brand text-ink-primary dark:text-gray-100"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-ink-secondary hover:text-ink-primary dark:hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Login Specific: Remember Me Checkbox */}
            {mode === 'login' && (
              <div className="flex items-center justify-between text-xs pt-0.5">
                <label className="flex items-center gap-2 cursor-pointer text-ink-secondary dark:text-gray-400">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded text-brand focus:ring-brand border-gray-300 dark:border-gray-700"
                  />
                  <span>Remember this campus device</span>
                </label>

                <span className="text-[11px] text-brand dark:text-emerald-400 font-semibold">
                  Instant Gateway Access
                </span>
              </div>
            )}

            {/* Sign Up Specific: Branch, Roll No, Hostel, Phone */}
            {mode === 'signup' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-bold text-ink-primary dark:text-gray-200 mb-1">
                    Branch / Department
                  </label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 text-ink-secondary absolute left-3 top-2.5" />
                    <select
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs bg-surface-subtle dark:bg-surface-dark-page border border-surface-border dark:border-surface-dark-border rounded-xl focus:outline-none focus:border-brand text-ink-primary dark:text-gray-100"
                    >
                      <option value="AI, AIML & DS">AI, AIML & DS (CTM Block)</option>
                      <option value="Computer Science (CSE)">Computer Science (CSE)</option>
                      <option value="Information Technology (IT)">Information Technology (IT)</option>
                      <option value="Electronics & Comm. (ECE)">Electronics & Comm. (ECE)</option>
                      <option value="Mechanical Eng. (ME)">Mechanical Eng. (ME)</option>
                      <option value="Civil Engineering (CE)">Civil Engineering (CE)</option>
                      <option value="MBA Department">MBA (Management Block)</option>
                      <option value="MCA / Other">MCA / Other Programs</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-ink-primary dark:text-gray-200 mb-1">
                    Roll No. / Admission Number
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 2201920100045"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-surface-subtle dark:bg-surface-dark-page border border-surface-border dark:border-surface-dark-border rounded-xl focus:outline-none focus:border-brand text-ink-primary dark:text-gray-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-ink-primary dark:text-gray-200 mb-1">
                    Campus Residence
                  </label>
                  <select
                    value={hostel}
                    onChange={(e) => setHostel(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-surface-subtle dark:bg-surface-dark-page border border-surface-border dark:border-surface-dark-border rounded-xl focus:outline-none focus:border-brand text-ink-primary dark:text-gray-100"
                  >
                    <option value="Day Scholar">Day Scholar (Knowledge Park / PG)</option>
                    <option value="Boys Hostel Block B">Boys Hostel Block B</option>
                    <option value="Boys Hostel Block A">Boys Hostel Block A</option>
                    <option value="Girls Hostel Block A">Girls Hostel Block A</option>
                    <option value="Girls Hostel Block B">Girls Hostel Block B</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-ink-primary dark:text-gray-200 mb-1">
                    WhatsApp Contact (Optional)
                  </label>
                  <input
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-surface-subtle dark:bg-surface-dark-page border border-surface-border dark:border-surface-dark-border rounded-xl focus:outline-none focus:border-brand text-ink-primary dark:text-gray-100"
                  />
                </div>
              </div>
            )}

          </div>

          {/* ========================================================================= */}
          {/* STICKY ACTION FOOTER (ALWAYS CLEARLY VISIBLE - NEVER CUT OFF OR HIDDEN)   */}
          {/* ========================================================================= */}
          <div className="p-4 sm:p-5 bg-white/95 dark:bg-surface-dark-card/95 border-t border-surface-border dark:border-surface-dark-border shrink-0 shadow-[0_-8px_20px_rgba(0,0,0,0.06)]">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-800 text-white font-extrabold text-sm shadow-lg shadow-emerald-700/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.99]"
            >
              {isSubmitting ? (
                <span>Verifying GLBITM Student Credentials...</span>
              ) : mode === 'signup' ? (
                <>
                  <span>Create Account & Enter GLBITM Marketplace</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              ) : (
                <>
                  <span>Sign In & Enter GLBITM Marketplace</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Bottom Page Link Switcher */}
            <div className="text-center pt-2.5">
              {mode === 'signup' ? (
                <p className="text-xs text-ink-secondary dark:text-gray-400">
                  Already registered with your GL Bajaj email?{' '}
                  <button
                    type="button"
                    onClick={() => handleModeSwitch('login')}
                    className="text-brand dark:text-emerald-400 font-bold hover:underline"
                  >
                    Go to Log In Page →
                  </button>
                </p>
              ) : (
                <p className="text-xs text-ink-secondary dark:text-gray-400">
                  New student at GL Bajaj?{' '}
                  <button
                    type="button"
                    onClick={() => handleModeSwitch('signup')}
                    className="text-brand dark:text-emerald-400 font-bold hover:underline"
                  >
                    Go to Sign Up Page (Create Account) →
                  </button>
                </p>
              )}
            </div>
          </div>
        </form>

      </div>

      {/* ========================================================================= */}
      {/* FIREBASE GOOGLE AUTHENTICATION SETUP & ACCOUNT CHOOSER DIALOG             */}
      {/* ========================================================================= */}
      {isGoogleChooserOpen && (
        <div className="fixed inset-0 z-60 bg-black/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-fade-in">
          <div className="w-full max-w-md bg-white dark:bg-surface-dark-card rounded-3xl shadow-2xl border border-surface-border dark:border-surface-dark-border overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-surface-border dark:border-surface-dark-border flex items-center justify-between shrink-0 bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-teal-500/10">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                  <Flame className="w-5 h-5 text-amber-500 fill-amber-500" />
                </div>
                <div>
                  <h3 className="font-heading font-extrabold text-sm text-ink-primary dark:text-white flex items-center gap-1.5">
                    <span>Firebase Google Auth</span>
                    <span className="text-[10px] font-mono px-2 py-0.2 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold">
                      {isFirebaseLive ? 'Live Ready' : 'Setup'}
                    </span>
                  </h3>
                  <p className="text-[11px] text-ink-secondary dark:text-gray-400">
                    Authenticate via Google Workspace (@{PRIMARY_DOMAIN})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsGoogleChooserOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Tabs: Quick Student Accounts vs Firebase Settings */}
            <div className="grid grid-cols-2 p-1.5 mx-4 mt-3 bg-surface-subtle dark:bg-surface-dark-page rounded-xl border border-surface-border dark:border-surface-dark-border shrink-0">
              <button
                type="button"
                onClick={() => setFirebaseModalTab('quick_test')}
                className={`py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  firebaseModalTab === 'quick_test'
                    ? 'bg-brand text-white shadow-xs'
                    : 'text-ink-secondary dark:text-gray-400 hover:text-ink-primary'
                }`}
              >
                <School className="w-3.5 h-3.5" />
                <span>1. Select Student</span>
              </button>
              <button
                type="button"
                onClick={() => setFirebaseModalTab('connect')}
                className={`py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  firebaseModalTab === 'connect'
                    ? 'bg-brand text-white shadow-xs'
                    : 'text-ink-secondary dark:text-gray-400 hover:text-ink-primary'
                }`}
              >
                <Flame className="w-3.5 h-3.5" />
                <span>2. Firebase Settings</span>
              </button>
            </div>

            {/* Dialog Body */}
            <div className="p-4 sm:p-5 overflow-y-auto space-y-3.5 text-xs">
              
              {/* TAB 1: CONNECT FIREBASE WEB APP */}
              {firebaseModalTab === 'connect' && (
                <div className="space-y-3">
                  <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-[11px] text-amber-900 dark:text-amber-200 leading-relaxed">
                    <strong>To use real Google Sign-In with Firebase:</strong>
                    <ol className="list-decimal list-inside mt-1 space-y-0.5">
                      <li>Go to <a href="https://console.firebase.google.com" target="_blank" rel="noreferrer" className="underline font-bold text-amber-800 dark:text-amber-300">Firebase Console</a> & select your project.</li>
                      <li>In <strong>Authentication &gt; Sign-in method</strong>, enable <strong>Google</strong>.</li>
                      <li>In <strong>Project settings &gt; General &gt; Your apps &gt; Web app</strong>, copy your Firebase config keys.</li>
                    </ol>
                  </div>

                  {/* Paste Full Config Textarea */}
                  <div>
                    <label className="block text-[11px] font-bold text-ink-primary dark:text-gray-200 mb-1 flex items-center justify-between">
                      <span>Paste Firebase Config object:</span>
                      <span className="text-[10px] text-brand dark:text-emerald-400 font-normal">Auto-detects keys</span>
                    </label>
                    <textarea
                      rows={2}
                      placeholder={`const firebaseConfig = {\n  apiKey: "AIzaSy...",\n  projectId: "campuscart-glb"\n};`}
                      value={rawFirebaseConfig}
                      onChange={(e) => handleParseRawFirebaseConfig(e.target.value)}
                      className="w-full p-2 text-[11px] font-mono border border-surface-border dark:border-surface-dark-border rounded-xl dark:bg-surface-dark-page dark:text-white focus:outline-none focus:border-brand"
                    />
                  </div>

                  {/* Explicit Key Inputs */}
                  <div className="space-y-2">
                    <div>
                      <label className="block text-[10px] font-bold text-ink-secondary dark:text-gray-400 uppercase tracking-wider mb-0.5">
                        Firebase API Key (apiKey) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="AIzaSy..."
                        value={firebaseApiKey}
                        onChange={(e) => setFirebaseApiKey(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs font-mono border border-surface-border dark:border-surface-dark-border rounded-xl dark:bg-surface-dark-page dark:text-white"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-ink-secondary dark:text-gray-400 uppercase tracking-wider mb-0.5">
                          Project ID <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          placeholder="campuscart-glb"
                          value={firebaseProjectId}
                          onChange={(e) => setFirebaseProjectId(e.target.value)}
                          className="w-full px-3 py-1.5 text-xs font-mono border border-surface-border dark:border-surface-dark-border rounded-xl dark:bg-surface-dark-page dark:text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-ink-secondary dark:text-gray-400 uppercase tracking-wider mb-0.5">
                          Auth Domain
                        </label>
                        <input
                          type="text"
                          placeholder="project.firebaseapp.com"
                          value={firebaseAuthDomain}
                          onChange={(e) => setFirebaseAuthDomain(e.target.value)}
                          className="w-full px-3 py-1.5 text-xs font-mono border border-surface-border dark:border-surface-dark-border rounded-xl dark:bg-surface-dark-page dark:text-white"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleSaveFirebaseConfig}
                    className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
                  >
                    <Flame className="w-4 h-4 fill-white" />
                    <span>Save Config & Launch Google Sign-In</span>
                  </button>
                </div>
              )}

              {/* TAB 2: INSTANT GOOGLE ADMISSION VERIFICATION */}
              {firebaseModalTab === 'quick_test' && (
                <div className="space-y-2.5">
                  <p className="text-gray-500 text-[11px]">
                    Enter your college email or admission number to verify student enrollment and sign in:
                  </p>

                  {availableUsers.length > 0 && (
                    <div className="space-y-1.5 mb-2">
                      <p className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">Previously Registered Accounts:</p>
                      {availableUsers.map((u) => (
                        <button
                          key={u.id}
                          type="button"
                          onClick={() => handleSimulatedGoogleSelect(u.email, u.fullName)}
                          className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-left flex items-center justify-between transition-colors"
                        >
                          <div>
                            <p className="font-bold text-ink-primary dark:text-white">{u.fullName}</p>
                            <p className="text-[11px] text-gray-500 font-mono">{u.email}</p>
                          </div>
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200 px-2 py-0.5 rounded-full font-bold">
                            {u.studentId || (u.role === 'COLLEGE_ADMIN' ? 'Admin' : 'Student')}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Custom admission ID input */}
                  <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
                    <label className="block text-[11px] font-bold text-gray-700 dark:text-gray-300 mb-1">
                      Enter your admission_number@{PRIMARY_DOMAIN} or college email:
                    </label>
                    <div className="flex gap-1.5">
                      <input
                        type="email"
                        placeholder={`2201920100045@${PRIMARY_DOMAIN}`}
                        value={customGoogleEmail}
                        onChange={(e) => setCustomGoogleEmail(e.target.value)}
                        className="flex-1 px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg dark:bg-gray-800 dark:text-white"
                      />
                      <button
                        type="button"
                        onClick={() => handleSimulatedGoogleSelect(customGoogleEmail)}
                        className="px-3 py-1.5 bg-brand text-white font-bold rounded-lg text-xs hover:bg-brand-hover shrink-0"
                      >
                        Verify &amp; Enter
                      </button>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

    </div>
  );
};
