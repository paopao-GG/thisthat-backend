import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../shared/contexts/AuthContext';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(formData.email, formData.password);
      navigate('/test/profile');
    } catch (err: any) {
      // Extract error message
      let errorMessage = 'Failed to login. Please try again.';
      
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
      console.error('Login error:', err);
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
          <p className="text-sm text-white/50 uppercase tracking-wide">Welcome Back</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-4 border border-red-500/50 text-red-400 text-sm" style={{ background: 'rgba(30, 30, 30, 0.8)' }}>
              {error}
            </div>
          )}

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
              placeholder="Enter your password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full px-6 py-3.5 text-sm font-semibold text-white border border-white/10 hover:border-white/20 transition-all tracking-wide uppercase disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: 'rgba(30, 30, 30, 0.8)' }}
          >
            {loading ? 'Logging In...' : 'Login'}
          </button>

          <div className="text-center space-y-2">
            <button
              type="button"
              onClick={() => navigate('/test/signup')}
              className="text-sm text-white/50 hover:text-white/70 transition-colors"
            >
              Don't have an account? Sign up
            </button>
            <div>
              <button
                type="button"
                onClick={() => navigate('/test')}
                className="text-sm text-white/50 hover:text-white/70 transition-colors"
              >
                Back to Home
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;

