import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@shared/contexts/AuthContext';

const SignupPage: React.FC = () => {
  const navigate = useNavigate();
  const { signup } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    referralCode: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await signup({
        name: formData.name.trim(),
        username: formData.username.trim(),
        email: formData.email.trim(),
        password: formData.password,
        referralCode: formData.referralCode.trim() || undefined,
      });
      navigate('/app');
    } catch (err: any) {
      const message =
        err?.message ||
        err?.error ||
        'Failed to create account. Please ensure the backend is running and try again.';
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
          <p className="text-xs text-white/60 uppercase tracking-[0.3rem]">Create Account</p>
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
            <label htmlFor="name" className="text-sm text-white/70 uppercase tracking-wide">
              Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              maxLength={100}
              value={formData.name}
              onChange={handleChange}
              className="w-full px-4 py-3 text-white border border-white/10 focus:border-white/20 outline-none rounded"
              style={{ background: 'rgba(30, 30, 30, 0.85)' }}
              placeholder="Display name"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="username" className="text-sm text-white/70 uppercase tracking-wide">
              Username
            </label>
            <input
              id="username"
              name="username"
              type="text"
              required
              minLength={3}
              maxLength={50}
              value={formData.username}
              onChange={handleChange}
              className="w-full px-4 py-3 text-white border border-white/10 focus:border-white/20 outline-none rounded"
              style={{ background: 'rgba(30, 30, 30, 0.85)' }}
              placeholder="handle"
            />
          </div>

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
              placeholder="At least 8 characters"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="referralCode" className="text-sm text-white/70 uppercase tracking-wide">
              Referral Code (Optional)
            </label>
            <input
              id="referralCode"
              name="referralCode"
              type="text"
              value={formData.referralCode}
              onChange={handleChange}
              className="w-full px-4 py-3 text-white border border-white/10 focus:border-white/20 outline-none rounded"
              style={{ background: 'rgba(30, 30, 30, 0.85)' }}
              placeholder="8-character code"
            />
            <p className="text-xs text-white/40">
              Invitations award 200 bonus credits to the referrer once you sign up.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full px-6 py-3.5 text-sm font-semibold text-white border border-white/10 hover:border-white/20 transition-all tracking-wide uppercase disabled:opacity-50 disabled:cursor-not-allowed rounded"
            style={{ background: 'rgba(30, 30, 30, 0.9)' }}
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>

          <div className="text-center text-sm text-white/60 space-y-2">
            <Link to="/login" className="hover:text-white transition-colors block">
              Already playing? Sign in
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

export default SignupPage;

