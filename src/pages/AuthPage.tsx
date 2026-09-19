import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { LogIn, UserPlus } from 'lucide-react';

export default function AuthPage() {
  const { login, register, isLoading, error } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState('');
  const [useDemo, setUseDemo] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');

    if (useDemo) {
      // Demo login - save fake user
      const fakeUser = { id: 1, username, token: 'demo-token-' + Date.now() };
      localStorage.setItem('user', JSON.stringify(fakeUser));
      localStorage.setItem('token', fakeUser.token);
      window.location.reload();
      return;
    }

    try {
      if (isLogin) {
        await login(username, password);
      } else {
        await register(username, password);
      }
    } catch (err: any) {
      setLocalError(err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold">👕 Гардероб</h1>
          <p className="text-gray-500 text-sm mt-1">Список покупок одежды</p>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => { setIsLogin(true); setLocalError(''); }}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${
                isLogin ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <LogIn className="w-4 h-4 inline mr-1" />
              Вход
            </button>
            <button
              onClick={() => { setIsLogin(false); setLocalError(''); }}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${
                !isLogin ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <UserPlus className="w-4 h-4 inline mr-1" />
              Регистрация
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="text"
              placeholder="Имя пользователя"
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm"
              required
              minLength={3}
            />
            <input
              type="password"
              placeholder="Пароль"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm"
              required
              minLength={4}
            />

            {(localError || error) && (
              <p className="text-red-500 text-xs">{localError || error}</p>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50"
            >
              {isLoading ? 'Загрузка...' : isLogin ? 'Войти' : 'Зарегистрироваться'}
            </button>
          </form>

          <div className="mt-4 pt-4 border-t">
            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
              <input
                type="checkbox"
                checked={useDemo}
                onChange={e => setUseDemo(e.target.checked)}
                className="rounded"
              />
              Демо-режим (без сервера)
            </label>
            <p className="text-xs text-gray-400 mt-1">
              Используйте демо-режим если бэкенд не запущен
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
