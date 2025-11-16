import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Trophy,
  Calendar,
  Star,
  Shield,
  UserPlus,
  Plus,
} from 'lucide-react';

interface Club {
  id: string;
  name: string;
  description?: string;
  logo_url?: string;
  created_by_user: {
    id: string;
    username: string;
    email: string;
  };
  club_players: Array<{
    player: {
      id: string;
      username: string;
      email: string;
      rating: number;
    };
  }>;
}

const Clubs: React.FC = () => {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newClub, setNewClub] = useState({
    name: '',
    description: '',
    logo_url: '',
  });
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState('');

  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchClubs();
    checkAdminStatus();
  }, []);

  const fetchClubs = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/clubs', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      setClubs(data);
    } catch (error) {
      console.error('Error fetching clubs:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkAdminStatus = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/auth/me', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      setIsAdmin(data.role === 'admin');
    } catch (error) {
      console.error('Error checking admin status:', error);
    }
  };

  const handleCreateClub = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch('http://localhost:3001/api/clubs', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newClub),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create club');
      }

      const createdClub = await response.json();
      setClubs([...clubs, createdClub]);
      setNewClub({ name: '', description: '', logo_url: '' });
      setShowCreateForm(false);
    } catch (error) {
      console.error('Error creating club:', error);
      setError(
        error instanceof Error ? error.message : 'Failed to create club'
      );
    }
  };

  if (loading) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto'></div>
          <p className='mt-4 text-gray-600'>Loading clubs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gray-50'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        <div className='mb-8'>
          <div className='flex justify-between items-center'>
            <div>
              <h1 className='text-3xl font-bold text-gray-900'>
                Football Clubs
              </h1>
              <p className='mt-2 text-gray-600'>
                Browse and manage football clubs
              </p>
            </div>
            {isAdmin && (
              <button
                onClick={() => setShowCreateForm(true)}
                className='bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2'
              >
                <Plus className='h-5 w-5' />
                <span>Create Club</span>
              </button>
            )}
          </div>
        </div>

        {/* Create Club Form */}
        {showCreateForm && (
          <div className='bg-white rounded-lg shadow-md p-6 mb-8'>
            <h2 className='text-xl font-semibold mb-4'>Create New Club</h2>
            <form onSubmit={handleCreateClub} className='space-y-4'>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Club Name *
                </label>
                <input
                  type='text'
                  value={newClub.name}
                  onChange={(e) =>
                    setNewClub({ ...newClub, name: e.target.value })
                  }
                  className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
                  required
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Description
                </label>
                <textarea
                  value={newClub.description}
                  onChange={(e) =>
                    setNewClub({ ...newClub, description: e.target.value })
                  }
                  className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
                  rows={3}
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Logo URL
                </label>
                <input
                  type='url'
                  value={newClub.logo_url}
                  onChange={(e) =>
                    setNewClub({ ...newClub, logo_url: e.target.value })
                  }
                  className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
                  placeholder='https://example.com/logo.png'
                />
              </div>
              {error && <div className='text-red-600 text-sm'>{error}</div>}
              <div className='flex space-x-4'>
                <button
                  type='submit'
                  className='bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700'
                >
                  Create Club
                </button>
                <button
                  type='button'
                  onClick={() => setShowCreateForm(false)}
                  className='bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400'
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Clubs Grid */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
          {clubs.map((club) => (
            <Link
              key={club.id}
              to={`/clubs/${club.id}`}
              className='bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6'
            >
              <div className='flex items-start justify-between mb-4'>
                <div className='flex items-center space-x-3'>
                  {club.logo_url ? (
                    <img
                      src={club.logo_url}
                      alt={club.name}
                      className='h-12 w-12 rounded-full object-cover'
                    />
                  ) : (
                    <div className='h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center'>
                      <Shield className='h-6 w-6 text-blue-600' />
                    </div>
                  )}
                  <div>
                    <h3 className='text-lg font-semibold text-gray-900'>
                      {club.name}
                    </h3>
                    <p className='text-sm text-gray-500'>
                      by {club.created_by_user.username}
                    </p>
                  </div>
                </div>
              </div>

              {club.description && (
                <p className='text-gray-600 text-sm mb-4 line-clamp-2'>
                  {club.description}
                </p>
              )}

              <div className='flex items-center justify-between text-sm text-gray-500'>
                <div className='flex items-center space-x-1'>
                  <Users className='h-4 w-4' />
                  <span>{club.club_players.length} players</span>
                </div>
                <div className='flex items-center space-x-1'>
                  <Star className='h-4 w-4' />
                  <span>
                    {club.club_players.length > 0
                      ? (
                          club.club_players.reduce(
                            (sum, cp) => sum + cp.player.rating,
                            0
                          ) / club.club_players.length
                        ).toFixed(1)
                      : '0.0'}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {clubs.length === 0 && (
          <div className='text-center py-12'>
            <Shield className='h-12 w-12 text-gray-400 mx-auto mb-4' />
            <h3 className='text-lg font-medium text-gray-900 mb-2'>
              No clubs found
            </h3>
            <p className='text-gray-500'>
              {isAdmin
                ? 'Create your first club to get started!'
                : 'No clubs have been created yet.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Clubs;
