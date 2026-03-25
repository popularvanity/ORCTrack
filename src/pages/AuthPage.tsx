import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, User, Eye, EyeOff, Zap, ArrowLeft, Shield, Terminal, AlertTriangle, UserPlus, LogIn, KeyRound, Fingerprint } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

type AuthMode = 'gate' | 'login' | 'register';

export default function AuthPage() {
  const { isAuthenticated, login, register, masterLogin, dbReady } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState<AuthMode>(() => {
    const m = searchParams.get('mode');
    if (m === 'register') return 'register';
    if (m === 'login') return 'login';
    return 'gate';
  });
  const [masterPwd, setMasterPwd] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);
  const [scanLine, setScanLine] = useState(0);
  const [particles] = useState(() =>
    Array.from({ length: 30 }, () => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 1,
      speed: Math.random() * 2 + 0.5,
      opacity: Math.random() * 0.3 + 0.1,
    }))
  );

  useEffect(() => {
    if (isAuthenticated) navigate('/admin');
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    const interval = setInterval(() => {
      setScanLine(prev => (prev + 1) % 100);
    }, 30);
    return () => clearInterval(interval);
  }, []);

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  const handleMasterAuth = () => {
    if (masterLogin(masterPwd)) {
      navigate('/admin');
    } else {
      setError('ACCESS DENIED — Invalid master key');
      triggerShake();
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleLogin = async () => {
    if (!username || !password) { setError('Fill in all fields'); return; }
    setLoading(true);
    const result = await login(username, password);
    setLoading(false);
    if (result.success) {
      navigate('/admin');
    } else {
      setError(result.error || 'Login failed');
      triggerShake();
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleRegister = async () => {
    if (!username || !password) { setError('Fill in all fields'); return; }
    if (username.length < 3) { setError('Username must be 3+ characters'); return; }
    if (password.length < 4) { setError('Password must be 4+ characters'); return; }
    if (confirmPwd && password !== confirmPwd) { setError('Passwords do not match'); return; }
    setLoading(true);
    const result = await register(username, password);
    setLoading(false);
    if (result.success) {
      navigate('/admin');
    } else {
      setError(result.error || 'Registration failed');
      triggerShake();
      setTimeout(() => setError(''), 3000);
    }
  };

  if (!dbReady) {
    return (
      <div className="min-h-screen bg-[#050508] flex items-center justify-center">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
          <Zap size={32} className="text-cyan-500" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050508] text-white flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated particles */}
      <div className="fixed inset-0 pointer-events-none">
        {particles.map((p, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-cyan-500"
            style={{ width: p.size, height: p.size, opacity: p.opacity, left: `${p.x}%`, top: `${p.y}%` }}
            animate={{ y: [0, -50, 0], opacity: [p.opacity, p.opacity * 2, p.opacity] }}
            transition={{ duration: 4 / p.speed, repeat: Infinity, delay: i * 0.2 }}
          />
        ))}
        <div className="absolute top-1/4 left-1/3 w-[500px] h-[500px] bg-cyan-500/5 rounded-full blur-[150px]" />
        <div className="absolute bottom-1/4 right-1/3 w-[400px] h-[400px] bg-violet-500/5 rounded-full blur-[150px]" />
        <div className="absolute inset-0 opacity-[0.02]" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }} />
        <div
          className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent transition-all"
          style={{ top: `${scanLine}%` }}
        />
      </div>

      {/* Back button */}
      <motion.button
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        onClick={() => navigate('/')}
        className="fixed top-6 left-6 z-50 flex items-center gap-2 text-sm text-gray-500 hover:text-white transition-colors group"
      >
        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
        Back to site
      </motion.button>

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className={`relative w-full max-w-md ${shake ? 'animate-[shake_0.5s_ease]' : ''}`}
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', damping: 15 }}
            className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-violet-600 shadow-2xl shadow-cyan-500/30 mb-4"
          >
            {mode === 'register' ? <UserPlus size={28} className="text-white" /> :
             mode === 'login' ? <Fingerprint size={28} className="text-white" /> :
             <Shield size={28} className="text-white" />}
          </motion.div>
          <h1 className="text-2xl font-bold">
            <span className="text-cyan-400">ORC</span>{' '}
            {mode === 'register' ? 'Create Account' : mode === 'login' ? 'Sign In' : 'Admin Access'}
          </h1>
          <p className="text-xs text-gray-500 mt-1 font-mono tracking-wider">
            {mode === 'register' ? 'JOIN THE ORC TRACKER COMMUNITY' :
             mode === 'login' ? 'WELCOME BACK, ADMIN' :
             'SECURE AUTHENTICATION PORTAL'}
          </p>
        </div>

        {/* Card */}
        <div className="relative rounded-3xl border border-white/10 bg-gradient-to-b from-gray-900/90 to-gray-950/95 backdrop-blur-2xl shadow-2xl overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-[1px] bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />

          <div className="p-8">
            <AnimatePresence mode="wait">
              {/* GATE MODE */}
              {mode === 'gate' && (
                <motion.div key="gate" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                  <div className="mb-6">
                    <label className="flex items-center gap-2 text-xs font-medium text-gray-400 mb-2">
                      <KeyRound size={12} />
                      MASTER KEY
                    </label>
                    <div className="relative">
                      <input
                        type={showPwd ? 'text' : 'password'}
                        value={masterPwd}
                        onChange={e => setMasterPwd(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleMasterAuth()}
                        placeholder="Enter master password..."
                        className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3.5 pr-10 text-sm text-white placeholder-gray-600 outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-all font-mono"
                        autoFocus
                      />
                      <button onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors">
                        {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={handleMasterAuth}
                    className="w-full rounded-xl bg-gradient-to-r from-cyan-600 to-violet-600 py-3.5 text-sm font-semibold text-white hover:from-cyan-500 hover:to-violet-500 transition-all shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40 active:scale-[0.98]"
                  >
                    Authenticate
                  </button>

                  <div className="flex items-center gap-4 my-6">
                    <div className="flex-1 h-px bg-white/10" />
                    <span className="text-xs text-gray-600 font-mono">OR</span>
                    <div className="flex-1 h-px bg-white/10" />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setMode('login')}
                      className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] py-3 text-sm text-gray-300 hover:bg-white/[0.08] hover:border-white/20 transition-all"
                    >
                      <LogIn size={14} />
                      Login
                    </button>
                    <button
                      onClick={() => setMode('register')}
                      className="flex items-center justify-center gap-2 rounded-xl border border-cyan-500/20 bg-cyan-500/5 py-3 text-sm text-cyan-400 hover:bg-cyan-500/10 hover:border-cyan-500/30 transition-all"
                    >
                      <UserPlus size={14} />
                      Register
                    </button>
                  </div>
                </motion.div>
              )}

              {/* LOGIN MODE */}
              {mode === 'login' && (
                <motion.div key="login" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <div className="space-y-4 mb-6">
                    <div>
                      <label className="flex items-center gap-2 text-xs font-medium text-gray-400 mb-2">
                        <User size={12} />
                        USERNAME
                      </label>
                      <input
                        type="text"
                        value={username}
                        onChange={e => setUsername(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleLogin()}
                        placeholder="Enter username..."
                        className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3.5 text-sm text-white placeholder-gray-600 outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-all"
                        autoFocus
                      />
                    </div>
                    <div>
                      <label className="flex items-center gap-2 text-xs font-medium text-gray-400 mb-2">
                        <Lock size={12} />
                        PASSWORD
                      </label>
                      <div className="relative">
                        <input
                          type={showPwd ? 'text' : 'password'}
                          value={password}
                          onChange={e => setPassword(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && handleLogin()}
                          placeholder="Enter password..."
                          className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3.5 pr-10 text-sm text-white placeholder-gray-600 outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-all"
                        />
                        <button onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors">
                          {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleLogin}
                    disabled={loading}
                    className="w-full rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 py-3.5 text-sm font-semibold text-white hover:from-cyan-500 hover:to-blue-500 transition-all shadow-lg shadow-cyan-500/20 disabled:opacity-50 active:scale-[0.98]"
                  >
                    {loading ? 'Signing in...' : 'Sign In'}
                  </button>

                  <div className="mt-4 flex items-center justify-between">
                    <button onClick={() => setMode('gate')} className="text-xs text-gray-500 hover:text-white transition-colors flex items-center gap-1">
                      <ArrowLeft size={12} /> Master key
                    </button>
                    <button onClick={() => setMode('register')} className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors">
                      Create account →
                    </button>
                  </div>
                </motion.div>
              )}

              {/* REGISTER MODE */}
              {mode === 'register' && (
                <motion.div key="register" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <div className="space-y-4 mb-6">
                    <div>
                      <label className="flex items-center gap-2 text-xs font-medium text-gray-400 mb-2">
                        <User size={12} />
                        USERNAME
                      </label>
                      <input
                        type="text"
                        value={username}
                        onChange={e => setUsername(e.target.value)}
                        placeholder="Choose a username (3+ chars)..."
                        className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3.5 text-sm text-white placeholder-gray-600 outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 transition-all"
                        autoFocus
                      />
                    </div>
                    <div>
                      <label className="flex items-center gap-2 text-xs font-medium text-gray-400 mb-2">
                        <Lock size={12} />
                        PASSWORD
                      </label>
                      <div className="relative">
                        <input
                          type={showPwd ? 'text' : 'password'}
                          value={password}
                          onChange={e => setPassword(e.target.value)}
                          placeholder="Choose password (4+ chars)..."
                          className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3.5 pr-10 text-sm text-white placeholder-gray-600 outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 transition-all"
                        />
                        <button onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors">
                          {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="flex items-center gap-2 text-xs font-medium text-gray-400 mb-2">
                        <Lock size={12} />
                        CONFIRM PASSWORD
                      </label>
                      <input
                        type={showPwd ? 'text' : 'password'}
                        value={confirmPwd}
                        onChange={e => setConfirmPwd(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleRegister()}
                        placeholder="Confirm your password..."
                        className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3.5 text-sm text-white placeholder-gray-600 outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 transition-all"
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleRegister}
                    disabled={loading}
                    className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 py-3.5 text-sm font-semibold text-white hover:from-violet-500 hover:to-fuchsia-500 transition-all shadow-lg shadow-violet-500/20 disabled:opacity-50 active:scale-[0.98]"
                  >
                    {loading ? 'Creating account...' : 'Create Account'}
                  </button>

                  <p className="text-[10px] text-gray-600 text-center mt-3">
                    Account stored in local database. Access admin tools after registration.
                  </p>

                  <div className="mt-4 flex items-center justify-between">
                    <button onClick={() => setMode('gate')} className="text-xs text-gray-500 hover:text-white transition-colors flex items-center gap-1">
                      <ArrowLeft size={12} /> Master key
                    </button>
                    <button onClick={() => setMode('login')} className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors">
                      Already have an account? →
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="mt-4 flex items-center gap-2 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3"
                >
                  <AlertTriangle size={14} className="text-red-400 flex-shrink-0" />
                  <p className="text-xs text-red-400">{error}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Security info */}
        <div className="mt-6 text-center">
          <p className="text-[10px] text-gray-600 font-mono">
            <Terminal size={10} className="inline mb-0.5" /> v2.0 · localStorage DB · No WASM Required
          </p>
        </div>
      </motion.div>
    </div>
  );
}
