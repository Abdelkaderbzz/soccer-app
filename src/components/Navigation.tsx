import { Link, useLocation } from 'react-router-dom';
import { Trophy, Users, Calendar, Plus, BarChart3, Home, User, LogOut, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useStore } from '@/store/useStore';

export default function Navigation() {
  const location = useLocation();
  const { currentUser, currentPlayer, logout } = useStore();

  const navItems = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/matches', label: 'Matches', icon: Calendar },
    { path: '/matches/create', label: 'Create Match', icon: Plus },
    { path: '/players', label: 'Players', icon: Users },
    { path: '/clubs', label: 'Clubs', icon: Shield },
    { path: '/statistics', label: 'Statistics', icon: BarChart3 },
  ];

  return (
    <nav className="bg-white shadow-lg border-b-4 border-green-500">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center space-x-2">
            <Trophy className="h-8 w-8 text-green-600" />
            <span className="text-2xl font-bold text-gray-800">⚽ Football Hub</span>
          </Link>
          
          <div className="hidden md:flex space-x-1">
            {currentUser && navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path || 
                (item.path !== '/' && location.pathname.startsWith(item.path));
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    'flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200',
                    isActive 
                      ? 'bg-green-100 text-green-800 border-2 border-green-300' 
                      : 'text-gray-600 hover:bg-green-50 hover:text-green-700'
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Authentication section */}
          <div className="flex items-center space-x-4">
            {currentUser ? (
              <div className="flex items-center space-x-3">
                <Link
                  to={`/players/${currentPlayer?.id || ''}`}
                  className="flex items-center space-x-2 text-gray-700 hover:text-green-600"
                >
                  {currentPlayer?.photo_url ? (
                    <img
                      src={currentPlayer.photo_url}
                      alt={currentPlayer.nickname}
                      className="w-8 h-8 rounded-full"
                    />
                  ) : (
                    <User className="h-6 w-6" />
                  )}
                  <span className="font-medium">{currentPlayer?.nickname || currentUser.email}</span>
                </Link>
                <button
                  onClick={logout}
                  className="flex items-center space-x-1 text-gray-600 hover:text-red-600"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="text-sm">Logout</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  to="/login"
                  className={cn(
                    'px-4 py-2 rounded-lg font-medium transition-all duration-200',
                    location.pathname === '/login'
                      ? 'bg-green-100 text-green-800'
                      : 'text-gray-600 hover:bg-green-50 hover:text-green-700'
                  )}
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className={cn(
                    'px-4 py-2 rounded-lg font-medium transition-all duration-200',
                    location.pathname === '/register'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-green-600 text-white hover:bg-green-700'
                  )}
                >
                  Sign Up
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button className="text-gray-600 hover:text-green-600">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}