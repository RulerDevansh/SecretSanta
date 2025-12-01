import { useState } from 'react';
import { authApi } from '../api/client';
import GoogleLoginButton from './GoogleLoginButton';

const initialForm = {
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
};

const AuthView = ({ onAuthSuccess }) => {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isRegister = mode === 'register';

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isRegister && form.password !== form.confirmPassword) {
        setError('Passwords do not match');
        setLoading(false);
        return;
      }

      const payload = {
        email: form.email,
        password: form.password,
      };

      let response;
      if (isRegister) {
        response = await authApi.register({
          ...payload,
          name: form.name,
          confirmPassword: form.confirmPassword,
        });
      } else {
        response = await authApi.login(payload);
      }

      onAuthSuccess(response);
      setForm(initialForm);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleCredential = async (credential) => {
    if (loading) return;
    setLoading(true);
    setError('');
    try {
      const response = await authApi.googleLogin({ credential });
      onAuthSuccess(response);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[760px] px-4 py-12 mx-auto md:ml-16 md:mr-0">
      <div className="bg-white/85 rounded-3xl shadow-2xl p-8 md:p-10 backdrop-blur border border-white/50">
        <div className="flex flex-col gap-10 lg:flex-row">
          <div className="lg:w-[42%] text-center lg:text-left">
            <p className="uppercase tracking-[0.3em] text-holly-500 font-semibold text-sm">Tis the season</p>
            <h1 className="text-4xl md:text-5xl font-bold text-holly-700 mt-3">Secret Santa Exchange</h1>
            <p className="text-holly-600 mt-4 text-lg">
              Create or join festive groups, keep track of members, and send magical wish lists right to your Secret Santa.
            </p>
            <ul className="mt-6 space-y-3 text-left text-holly-600">
              <li>🎄 Join securely with Google or email</li>
              <li>🎁 Generate shareable group codes</li>
              <li>✨ Collect thoughtful wish forms</li>
            </ul>
          </div>

          <div className="flex-1 lg:max-w-sm lg:ml-auto">
            <form onSubmit={handleSubmit} className="space-y-4">
              {isRegister && (
                <div>
                  <label className="block text-sm font-semibold text-holly-600">Name</label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-holly-200 bg-white/70 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-holly-400"
                    placeholder="Buddy the Elf"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-holly-600">Email</label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-holly-200 bg-white/70 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-holly-400"
                  placeholder="you@email.com"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-holly-600">Password</label>
                <input
                  type="password"
                  required
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-holly-200 bg-white/70 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-holly-400"
                  placeholder="••••••••"
                />
              </div>

              {isRegister && (
                <div>
                  <label className="block text-sm font-semibold text-holly-600">Confirm password</label>
                  <input
                    type="password"
                    required
                    value={form.confirmPassword}
                    onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-holly-200 bg-white/70 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-holly-400"
                    placeholder="••••••••"
                  />
                </div>
              )}

              {error && <p className="text-sm text-red-600">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-holly-600 py-3 text-white font-semibold shadow-lg shadow-holly-600/40 hover:bg-holly-500 disabled:opacity-60"
              >
                {loading ? 'Please wait...' : isRegister ? 'Create account' : 'Sign in'}
              </button>
            </form>

            <div className="mt-4">
              <GoogleLoginButton disabled={loading} onCredential={handleGoogleCredential} />
            </div>

            <p className="mt-4 text-center text-sm text-holly-600">
              {isRegister ? 'Already have an account?' : "Need an account?"}{' '}
              <button
                type="button"
                className="text-holly-700 font-semibold hover:underline"
                onClick={() => {
                  setMode(isRegister ? 'login' : 'register');
                  setForm(initialForm);
                  setError('');
                }}
              >
                {isRegister ? 'Sign in' : 'Register'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthView;
