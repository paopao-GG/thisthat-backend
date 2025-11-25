import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@shared/contexts/AuthContext';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const from = (location.state as { from?: Location })?.from?.pathname || '/app';

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(formData);
      navigate(from, { replace: true });
    } catch (err: any) {
      const message =
        err?.message ||
        err?.error ||
        'Failed to login. Please verify your credentials and that the backend is running.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [event.target.name]: event.target.value,
    }));
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-6 py-10"
      style={{
        background:
          'radial-gradient(ellipse at left, rgba(30, 30, 45, 0.5) 0%, transparent 50%), radial-gradient(ellipse at right, rgba(30, 30, 45, 0.5) 0%, transparent 50%), #0a0a0a',
      }}
    >
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-white tracking-tight font-light">
            <span className="text-4xl md:text-5xl">THIS</span>
            <span className="text-lg md:text-xl mx-3 text-white/40">or</span>
            <span className="text-4xl md:text-5xl">THAT</span>
          </h1>
          <p className="text-xs text-white/60 uppercase tracking-[0.3rem]">Welcome Back</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div
              className="p-4 border border-red-500/60 text-red-300 text-sm rounded"
              style={{ background: 'rgba(30, 30, 30, 0.85)' }}
            >
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="email" className="text-sm text-white/70 uppercase tracking-wide">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-3 text-white border border-white/10 focus:border-white/20 outline-none rounded"
              style={{ background: 'rgba(30, 30, 30, 0.85)' }}
              placeholder="you@email.com"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm text-white/70 uppercase tracking-wide">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={8}
              value={formData.password}
              onChange={handleChange}
              className="w-full px-4 py-3 text-white border border-white/10 focus:border-white/20 outline-none rounded"
              style={{ background: 'rgba(30, 30, 30, 0.85)' }}
              placeholder="Enter your password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full px-6 py-3.5 text-sm font-semibold text-white border border-white/10 hover:border-white/20 transition-all tracking-wide uppercase disabled:opacity-50 disabled:cursor-not-allowed rounded"
            style={{ background: 'rgba(30, 30, 30, 0.9)' }}
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>

          <div className="text-center text-sm text-white/60 space-y-2">
            <Link to="/signup" className="hover:text-white transition-colors block">
              Need an account? Create one
            </Link>
            <Link to="/" className="hover:text-white transition-colors block">
              Back to welcome screen
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;

