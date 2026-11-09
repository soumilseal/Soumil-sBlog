import React, { useState } from 'react';
import {
  Mail,
  Lock,
  User as UserIcon,
  Eye,
  EyeOff,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Image,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { registerUser, loginWithEmail, loginWithGoogle, resetPassword } from '../../services/authService';
import { BRANDING } from '../../config/branding';
import { PageRoute } from '../../types';
import { ImageUploadDropzone } from '../common/ImageUploadDropzone';

interface AuthPageProps {
  initialMode?: 'login' | 'register';
  onSuccess: () => void;
  onNavigate: (route: PageRoute) => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({
  initialMode = 'login',
  onSuccess,
  onNavigate,
}) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  // Password strength calculation
  const getPasswordStrength = (pass: string) => {
    let score = 0;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;
    return score; // 0 to 4
  };

  const strength = getPasswordStrength(password);
  const strengthLabels = ['Weak', 'Fair', 'Good', 'Strong', 'Impervious'];
  const strengthColors = ['bg-rose-500', 'bg-amber-500', 'bg-yellow-400', 'bg-cyan-400', 'bg-emerald-400'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      if (mode === 'login') {
        if (!email.trim() || !password) {
          throw new Error('Please fill in both email and password.');
        }
        await loginWithEmail(email.trim(), password, rememberMe);
        onSuccess();
      } else {
        // Register validations
        if (!fullName.trim()) throw new Error('Full Name is required.');
        if (!username.trim() || username.length < 3) throw new Error('Username must be at least 3 characters.');
        if (!email.trim() || !email.includes('@')) throw new Error('Please provide a valid email address.');
        if (password.length < 6) throw new Error('Password must be at least 6 characters.');
        if (password !== confirmPassword) throw new Error('Passwords do not match.');

        await registerUser(email.trim(), password, fullName.trim(), username.trim(), avatarFile);
        setSuccessMsg('Account created successfully! Redirecting...');
        setTimeout(() => onSuccess(), 700);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('auth/invalid-credential') || msg.includes('auth/wrong-password')) {
        setErrorMsg('Invalid email or password. Please double-check and try again.');
      } else if (msg.includes('auth/email-already-in-use')) {
        setErrorMsg('An account with this email address already exists. Please log in.');
      } else {
        setErrorMsg(msg.replace('Firebase: ', ''));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setErrorMsg(null);
    setLoading(true);
    try {
      await loginWithGoogle();
      onSuccess();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMsg(msg.replace('Firebase: ', ''));
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim() || !email.includes('@')) {
      setErrorMsg('Please enter your email address to receive password reset instructions.');
      return;
    }
    setErrorMsg(null);
    setLoading(true);
    try {
      await resetPassword(email.trim());
      setSuccessMsg('Password reset email sent! Check your inbox.');
      setShowForgotPassword(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-ambient-mesh flex items-center justify-center p-4 sm:p-6 relative">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-md">
        {/* Top return back to landing link */}
        <div className="text-center mb-6">
          <button
            onClick={() => onNavigate({ type: 'landing' })}
            className="text-xs text-slate-400 hover:text-cyan-300 font-mono-code transition-colors"
          >
            ← Return to Welcome Page
          </button>
        </div>

        {/* Auth Glass Card */}
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 shadow-2xl backdrop-blur-2xl">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-400/40 mx-auto flex items-center justify-center text-cyan-300 mb-3 shadow-lg shadow-cyan-500/20">
              <Sparkles className="w-6 h-6 text-amber-300" />
            </div>
            <h2 className="font-editorial text-2xl sm:text-3xl font-bold text-white">
              {mode === 'login' ? 'Welcome Back' : 'Join the Community'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              {mode === 'login'
                ? `Sign in to explore and publish on ${BRANDING.name}`
                : 'Create your personal account and start writing today'}
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex p-1 bg-slate-900/80 rounded-xl mb-6 border border-white/5">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                mode === 'login'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                mode === 'register'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Error & Success Alerts */}
          {errorMsg && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-start gap-2">
              <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <>
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Full Name
                  </label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Soumil Seal"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full bg-slate-900/60 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
                    />
                  </div>
                </div>

                {/* Username */}
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Username
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono-code text-xs">
                      @
                    </span>
                    <input
                      type="text"
                      required
                      placeholder="soumil"
                      value={username}
                      onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                      className="w-full bg-slate-900/60 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 font-mono-code"
                    />
                  </div>
                </div>

                {/* Profile Picture Upload from Device */}
                <div className="pt-1">
                  <ImageUploadDropzone
                    label="Profile Picture (optional)"
                    sublabel="Select a photo from your computer or phone"
                    aspectRatio="avatar"
                    onFileSelect={(file) => setAvatarFile(file)}
                  />
                </div>
              </>
            )}

            {/* Email Address */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  required
                  placeholder="you@domain.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-900/60 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-slate-300">Password</label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(!showForgotPassword)}
                    className="text-[11px] text-cyan-400 hover:underline"
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-900/60 border border-white/10 rounded-xl pl-10 pr-10 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Password strength indicator for registration */}
              {mode === 'register' && password.length > 0 && (
                <div className="mt-2">
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                    <span>Password Strength:</span>
                    <span className="font-semibold text-cyan-300">
                      {strengthLabels[strength]}
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden flex gap-1">
                    {[0, 1, 2, 3].map((idx) => (
                      <div
                        key={idx}
                        className={`h-full flex-1 transition-all duration-300 ${
                          idx < strength ? strengthColors[strength] : 'bg-transparent'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password (Registration only) */}
            {mode === 'register' && (
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-slate-900/60 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
                  />
                </div>
              </div>
            )}

            {/* Remember Me checkbox (Login only) */}
            {mode === 'login' && (
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-slate-300">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-slate-700 bg-slate-900 text-cyan-400 focus:ring-cyan-400"
                  />
                  <span>Remember me on this browser</span>
                </label>
              </div>
            )}

            {/* Forgot Password Action Area */}
            {showForgotPassword && (
              <div className="p-3 rounded-xl bg-slate-900/90 border border-cyan-500/30 text-xs space-y-2">
                <p className="text-slate-300">
                  Send reset link to: <span className="text-cyan-300 font-semibold">{email || 'your email'}</span>
                </p>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="w-full py-1.5 bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 rounded-lg hover:bg-cyan-500/30 transition-all font-semibold"
                >
                  Confirm Send Password Reset
                </button>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-400 to-amber-300 text-slate-950 font-bold text-sm shadow-lg shadow-cyan-400/20 hover:opacity-95 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>{mode === 'login' ? 'Sign In' : 'Create Account'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Alternative: Google Sign-in */}
          <div className="relative my-6 text-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10" />
            </div>
            <span className="relative px-3 bg-[#0a1122] text-[11px] font-mono-code text-slate-500 uppercase tracking-widest">
              Or continue with
            </span>
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-xl glass-panel text-slate-200 hover:text-white hover:bg-white/5 border border-white/10 text-xs font-semibold flex items-center justify-center gap-3 transition-all disabled:opacity-50"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#EA4335"
                d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z"
              />
              <path
                fill="#4285F4"
                d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
              />
              <path
                fill="#FBBC05"
                d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3 0-.8.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.3 0 15.2c0 2.8.7 5.4 1.9 7.8l3.7-3z"
              />
              <path
                fill="#34A853"
                d="M12 23.5c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2-6.4-4.8L1.9 17c1.8 3.7 5.6 6.5 10.1 6.5z"
              />
            </svg>
            <span>Google Account</span>
          </button>

          {/* Toggle mode footer */}
          <div className="mt-6 text-center text-xs text-slate-400">
            {mode === 'login' ? (
              <p>
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('register');
                    setErrorMsg(null);
                  }}
                  className="text-cyan-400 font-semibold hover:underline"
                >
                  Create one now
                </button>
              </p>
            ) : (
              <p>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setErrorMsg(null);
                  }}
                  className="text-cyan-400 font-semibold hover:underline"
                >
                  Sign in here
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
