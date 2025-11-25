import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../shared/contexts/AuthContext';

const SignupPage: React.FC = () => {
  const navigate = useNavigate();
  const { signup } = useAuth();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    name: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signup(formData.username, formData.email, formData.password, formData.name);
      navigate('/test/profile');
    } catch (err: any) {
      // Extract error message
      let errorMessage = 'Failed to create account. Please try again.';
      
      if (err.message) {
        errorMessage = err.message;
      } else if (err.error) {
        errorMessage = err.error;
      } else if (typeof err === 'string') {
        errorMessage = err;
      }
      
      // Add helpful hints for common errors
      if (errorMessage.includes('fetch') || errorMessage.includes('network')) {
        errorMessage += ' Make sure the backend server is running on http://localhost:3001';
      }
      
      setError(errorMessage);
      console.error('Signup error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'radial-gradient(ellipse at left, rgba(30, 30, 45, 0.5) 0%, transparent 50%), radial-gradient(ellipse at right, rgba(30, 30, 45, 0.5) 0%, transparent 50%), #0a0a0a' }}>
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-white text-center tracking-tight font-light mb-2">
            <span className="text-4xl md:text-5xl">THIS</span>
            <span className="text-lg md:text-xl mx-3 text-white/40">or</span>
            <span className="text-4xl md:text-5xl">THAT</span>
          </h1>
          <p className="text-sm text-white/50 uppercase tracking-wide">Create Your Account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-4 border border-red-500/50 text-red-400 text-sm" style={{ background: 'rgba(30, 30, 30, 0.8)' }}>
              {error}
            </div>
          )}

          <div>
            <label htmlFor="name" className="block text-sm text-white/70 mb-2 uppercase tracking-wide">
              Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 text-white border border-white/10 focus:border-white/20 transition-all outline-none"
              style={{ background: 'rgba(30, 30, 30, 0.8)' }}
              placeholder="Your display name"
            />
          </div>

          <div>
            <label htmlFor="username" className="block text-sm text-white/70 mb-2 uppercase tracking-wide">
              Username
            </label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
              minLength={3}
              maxLength={50}
              pattern="[a-zA-Z0-9_]+"
              className="w-full px-4 py-3 text-white border border-white/10 focus:border-white/20 transition-all outline-none"
              style={{ background: 'rgba(30, 30, 30, 0.8)' }}
              placeholder="username123"
            />
            <p className="mt-1 text-xs text-white/50">Alphanumeric and underscores only</p>
          </div>

          <div>
            <label htmlFor="email" className="block text-sm text-white/70 mb-2 uppercase tracking-wide">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 text-white border border-white/10 focus:border-white/20 transition-all outline-none"
              style={{ background: 'rgba(30, 30, 30, 0.8)' }}
              placeholder="your@email.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm text-white/70 mb-2 uppercase tracking-wide">
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              minLength={8}
              className="w-full px-4 py-3 text-white border border-white/10 focus:border-white/20 transition-all outline-none"
              style={{ background: 'rgba(30, 30, 30, 0.8)' }}
              placeholder="At least 8 characters"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full px-6 py-3.5 text-sm font-semibold text-white border border-white/10 hover:border-white/20 transition-all tracking-wide uppercase disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: 'rgba(30, 30, 30, 0.8)' }}
          >
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>

          <div className="text-center">
            <button
              type="button"
              onClick={() => navigate('/test')}
              className="text-sm text-white/50 hover:text-white/70 transition-colors"
            >
              Back to Home
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SignupPage;

