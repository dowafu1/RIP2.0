import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ShoppingList from './pages/ShoppingList';
import AuthPage from './pages/AuthPage';
import ChatPage from './pages/ChatPage';
import { ShoppingBag, MessageCircle, LogOut, Menu, X } from 'lucide-react';
import { useState } from 'react';

function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  if (!user) return null;

  const links = [
    { to: '/', label: 'Покупки', icon: ShoppingBag },
    { to: '/chat', label: 'Чат', icon: MessageCircle },
  ];

  return (
    <nav className="bg-white border-b sticky top-0 z-50">
      <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link to="/" className="font-bold text-lg">👕 Гардероб</Link>

        {/* Desktop nav */}
        <div className="hidden sm:flex items-center gap-1">
          {links.map(link => (
            <Link
              key={link.to}
              to={link.to}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition ${
                location.pathname === link.to
                  ? 'bg-blue-50 text-blue-600 font-medium'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <link.icon className="w-4 h-4" />
              {link.label}
            </Link>
          ))}
          <div className="w-px h-6 bg-gray-200 mx-2"></div>
          <span className="text-sm text-gray-500 mr-2">{user.username}</span>
          <button
            onClick={logout}
            className="p-1.5 text-gray-400 hover:text-red-600 transition"
            title="Выйти"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

        {/* Mobile menu button */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="sm:hidden p-1.5 text-gray-600"
        >
          {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="sm:hidden border-t bg-white px-4 py-2">
          {links.map(link => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setMenuOpen(false)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
                location.pathname === link.to
                  ? 'bg-blue-50 text-blue-600 font-medium'
                  : 'text-gray-600'
              }`}
            >
              <link.icon className="w-4 h-4" />
              {link.label}
            </Link>
          ))}
          <div className="border-t mt-2 pt-2 flex items-center justify-between">
            <span className="text-sm text-gray-500">{user.username}</span>
            <button onClick={() => { logout(); setMenuOpen(false); }} className="text-sm text-red-600">
              Выйти
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/auth" />;
  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (user) return <Navigate to="/" />;
  return <>{children}</>;
}

function AppContent() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <Routes>
        <Route path="/auth" element={<PublicRoute><AuthPage /></PublicRoute>} />
        <Route path="/" element={<ProtectedRoute><ShoppingList /></ProtectedRoute>} />
        <Route path="/chat" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}
