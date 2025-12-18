import { useState } from 'react';
import { User, APP_VERSION } from '../App';
import { ShieldCheck, LogIn } from 'lucide-react';
import logo from 'figma:asset/8cb4e74c943326f982bc5bf90d14623946c7755b.png';
import { AuthAPI } from '../services/api';

interface LoginPageProps {
  onLogin: (user: User) => void;
  users: User[];
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await AuthAPI.login(username, password);
      const role = response.user.role === 'admin' ? 'superadmin' : response.user.role;
      onLogin({ 
        username: response.user.username, 
        role, 
        id: response.user.id.toString() 
      });
    } catch (err: any) {
      setError(err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-8">
        <div className="flex flex-col items-center mb-8">
          <img src={logo} alt="VUCUE African Leadership College" className="h-20 mb-4" />
          <p className="text-center text-gray-600">Attendance & Vehicle Tracking System</p>
          <p className="text-center text-gray-400 mt-1">v{APP_VERSION}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="username" className="block text-gray-700 mb-2">
              Username
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#002E6D]"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#002E6D]"
              required
              disabled={loading}
            />
          </div>

          {error && (
            <div className="text-red-600 text-center">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#002E6D] text-white py-3 rounded-lg hover:bg-[#003a8c] transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Logging in...
              </>
            ) : (
              <>
                <LogIn className="w-5 h-5" />
                Login
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-500">
          <p>Default credentials:</p>
          <p className="mt-1">Admin: admin / admin123</p>
          <p>Dean: dean / dean123</p>
        </div>
      </div>
    </div>
  );
}