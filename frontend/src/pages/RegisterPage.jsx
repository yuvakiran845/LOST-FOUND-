import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

function RegisterPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [error, setError]         = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const validate = () => {
    if (!form.name.trim())    return 'Name is required.';
    if (!form.email.trim())   return 'Email is required.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return 'Please enter a valid email.';
    if (form.password.length < 6)  return 'Password must be at least 6 characters.';
    if (form.password !== form.confirmPassword) return 'Passwords do not match.';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validate();
    if (err) { setError(err); return; }
    setIsLoading(true);
    setError('');
    try {
      const { data } = await api.post('/auth/register', {
        name: form.name.trim(), email: form.email.trim(), password: form.password,
      });
      login(data.token, data.user);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const inputCls = "w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition-all";

  return (
    <div className="min-h-screen bg-white flex">

      {/* ── Left panel ── */}
      <div className="hidden lg:flex lg:w-5/12 bg-gray-50 border-r border-gray-200 flex-col justify-between p-12">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-7 h-7 bg-gray-900 rounded-lg flex items-center justify-center">
            <span className="text-white text-xs font-bold">C</span>
          </div>
          <span className="font-semibold text-gray-900 text-sm">CampusConnect</span>
        </Link>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-900">
            The smarter way to recover lost items on campus.
          </h2>
          <div className="space-y-3">
            {[
              { icon: '📋', text: 'Report lost & found items in seconds'        },
              { icon: '🔗', text: 'Auto-matched with similar reports'            },
              { icon: '📬', text: 'Send and receive recovery requests'           },
              { icon: '✅', text: 'Track status until the item is returned'      },
            ].map(f => (
              <div key={f.text} className="flex items-center gap-3">
                <span className="text-base">{f.icon}</span>
                <span className="text-sm text-gray-600">{f.text}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-gray-400">
          © {new Date().getFullYear()} CampusConnect · SVCE Final Year Project
        </p>
      </div>

      {/* ── Right form ── */}
      <div className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm">

          {/* Mobile logo */}
          <div className="lg:hidden mb-8">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-7 h-7 bg-gray-900 rounded-lg flex items-center justify-center">
                <span className="text-white text-xs font-bold">C</span>
              </div>
              <span className="font-semibold text-gray-900 text-sm">CampusConnect</span>
            </Link>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-1">Create your account</h1>
          <p className="text-sm text-gray-500 mb-8">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-600 hover:underline font-medium">
              Log in
            </Link>
          </p>

          {error && (
            <div className="mb-5 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <div>
              <label htmlFor="reg-name" className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
              <input
                id="reg-name" name="name" type="text" autoComplete="name"
                placeholder="Yuva Kiran"
                value={form.name} onChange={handleChange} disabled={isLoading}
                className={inputCls}
              />
            </div>

            <div>
              <label htmlFor="reg-email" className="block text-sm font-medium text-gray-700 mb-1.5">Email address</label>
              <input
                id="reg-email" name="email" type="email" autoComplete="email"
                placeholder="you@svce.ac.in"
                value={form.email} onChange={handleChange} disabled={isLoading}
                className={inputCls}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="reg-password" className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                <input
                  id="reg-password" name="password" type="password" autoComplete="new-password"
                  placeholder="Min. 6 chars"
                  value={form.password} onChange={handleChange} disabled={isLoading}
                  className={inputCls}
                />
              </div>
              <div>
                <label htmlFor="reg-confirm" className="block text-sm font-medium text-gray-700 mb-1.5">Confirm</label>
                <input
                  id="reg-confirm" name="confirmPassword" type="password" autoComplete="new-password"
                  placeholder="Re-enter"
                  value={form.confirmPassword} onChange={handleChange} disabled={isLoading}
                  className={inputCls}
                />
              </div>
            </div>

            <button
              id="reg-submit"
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 mt-2 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Creating account…
                </span>
              ) : 'Create Account'}
            </button>

            <p className="text-center text-gray-400 text-xs">
              By signing up you agree to our terms of use.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

export default RegisterPage;
