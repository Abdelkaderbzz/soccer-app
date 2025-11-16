import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Users,
  Star,
  Shield,
  UserPlus,
  Trophy,
  Calendar,
  Mail,
  User,
} from 'lucide-react';

interface Player {
  id: string;
  username: string;
  email: string;
  rating: number;
  avatar_url?: string;
}

interface ClubPlayer {
  player: Player;
  role: string;
}

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
  club_players: ClubPlayer[];
}

const ClubDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [club, setClub] = useState<Club | null>(null);
  const [loading, setLoading] = useState(true);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [error, setError] = useState('');
  const [isManager, setIsManager] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const token = localStorage.getItem('token');

  useEffect(() => {
    if (id) {
      fetchClub();
    }
  }, [id]);

  const fetchClub = async () => {
    try {
      const response = await fetch(`http://localhost:3001/api/clubs/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      setClub(data);

      // Check if current user is manager or admin
      const userResponse = await fetch('http://localhost:3001/api/auth/me', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const userData = await userResponse.json();
      setIsAdmin(userData.role === 'admin');

      const manager = data.club_players.find(
        (cp: ClubPlayer) =>
          cp.player.id === userData.id &&
          (cp.role === 'manager' || cp.role === 'captain')
      );
      setIsManager(!!manager || userData.role === 'admin');
    } catch (error) {
      console.error('Error fetching club:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInvitePlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      // First find player by email
      const playerResponse = await fetch(
        `http://localhost:3001/api/players/email/${inviteEmail}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!playerResponse.ok) {
        throw new Error('Player not found with this email');
      }

      const player = await playerResponse.json();

      // Send invitation
      const inviteResponse = await fetch(
        `http://localhost:3001/api/clubs/${id}/invite`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ playerId: player.id }),
        }
      );

      if (!inviteResponse.ok) {
        const errorData = await inviteResponse.json();
        throw new Error(errorData.error || 'Failed to send invitation');
      }

      setInviteEmail('');
      setShowInviteForm(false);
      alert('Invitation sent successfully!');
    } catch (error) {
      console.error('Error inviting player:', error);
      setError(
        error instanceof Error ? error.message : 'Failed to send invitation'
      );
    }
  };

  if (loading) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto'></div>
          <p className='mt-4 text-gray-600'>Loading club details...</p>
        </div>
      </div>
    );
  }

  if (!club) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='text-center'>
          <Shield className='h-12 w-12 text-gray-400 mx-auto mb-4' />
          <h3 className='text-lg font-medium text-gray-900 mb-2'>
            Club not found
          </h3>
          <Link to='/clubs' className='text-blue-600 hover:text-blue-800'>
            Back to clubs
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gray-50'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        {/* Club Header */}
        <div className='bg-white rounded-lg shadow-md p-6 mb-8'>
          <div className='flex items-start justify-between'>
            <div className='flex items-center space-x-4'>
              {club.logo_url ? (
                <img
                  src={club.logo_url}
                  alt={club.name}
                  className='h-20 w-20 rounded-full object-cover'
                />
              ) : (
                <div className='h-20 w-20 bg-blue-100 rounded-full flex items-center justify-center'>
                  <Shield className='h-10 w-10 text-blue-600' />
                </div>
              )}
              <div>
                <h1 className='text-3xl font-bold text-gray-900'>
                  {club.name}
                </h1>
                <p className='text-gray-600 mt-1'>
                  Created by {club.created_by_user.username}
                </p>
                {club.description && (
                  <p className='text-gray-700 mt-3'>{club.description}</p>
                )}
              </div>
            </div>
            {(isManager || isAdmin) && (
              <button
                onClick={() => setShowInviteForm(true)}
                className='bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2'
              >
                <UserPlus className='h-5 w-5' />
                <span>Invite Player</span>
              </button>
            )}
          </div>

          <div className='grid grid-cols-1 md:grid-cols-3 gap-6 mt-6 pt-6 border-t border-gray-200'>
            <div className='text-center'>
              <div className='flex items-center justify-center space-x-2 text-blue-600 mb-2'>
                <Users className='h-5 w-5' />
                <span className='text-2xl font-bold'>
                  {club.club_players.length}
                </span>
              </div>
              <p className='text-gray-600'>Total Players</p>
            </div>
            <div className='text-center'>
              <div className='flex items-center justify-center space-x-2 text-yellow-600 mb-2'>
                <Star className='h-5 w-5' />
                <span className='text-2xl font-bold'>
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
              <p className='text-gray-600'>Average Rating</p>
            </div>
            <div className='text-center'>
              <div className='flex items-center justify-center space-x-2 text-green-600 mb-2'>
                <Trophy className='h-5 w-5' />
                <span className='text-2xl font-bold'>0</span>
              </div>
              <p className='text-gray-600'>Matches Won</p>
            </div>
          </div>
        </div>

        {/* Invite Player Form */}
        {showInviteForm && (
          <div className='bg-white rounded-lg shadow-md p-6 mb-8'>
            <h2 className='text-xl font-semibold mb-4'>
              Invite Player to Club
            </h2>
            <form onSubmit={handleInvitePlayer} className='space-y-4'>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Player Email *
                </label>
                <input
                  type='email'
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
                  placeholder='player@example.com'
                  required
                />
              </div>
              {error && <div className='text-red-600 text-sm'>{error}</div>}
              <div className='flex space-x-4'>
                <button
                  type='submit'
                  className='bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700'
                >
                  Send Invitation
                </button>
                <button
                  type='button'
                  onClick={() => setShowInviteForm(false)}
                  className='bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400'
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Players List */}
        <div className='bg-white rounded-lg shadow-md p-6'>
          <h2 className='text-xl font-semibold mb-6'>Club Players</h2>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
            {club.club_players.map((clubPlayer, index) => (
              <div
                key={clubPlayer.player.id}
                className='border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow'
              >
                <div className='flex items-center space-x-3 mb-3'>
                  {clubPlayer.player.avatar_url ? (
                    <img
                      src={clubPlayer.player.avatar_url}
                      alt={clubPlayer.player.username}
                      className='h-12 w-12 rounded-full object-cover'
                    />
                  ) : (
                    <div className='h-12 w-12 bg-gray-200 rounded-full flex items-center justify-center'>
                      <User className='h-6 w-6 text-gray-600' />
                    </div>
                  )}
                  <div className='flex-1'>
                    <Link
                      to={`/players/${clubPlayer.player.id}`}
                      className='font-medium text-gray-900 hover:text-blue-600'
                    >
                      {clubPlayer.player.username}
                    </Link>
                    <div className='flex items-center space-x-2 text-sm text-gray-500'>
                      <Mail className='h-3 w-3' />
                      <span className='truncate'>
                        {clubPlayer.player.email}
                      </span>
                    </div>
                  </div>
                  {clubPlayer.role === 'manager' && (
                    <Shield className='h-4 w-4 text-yellow-600' />
                  )}
                  {clubPlayer.role === 'captain' && (
                    <Trophy className='h-4 w-4 text-blue-600' />
                  )}
                </div>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center space-x-1'>
                    <Star className='h-4 w-4 text-yellow-500' />
                    <span className='text-sm font-medium'>
                      {clubPlayer.player.rating.toFixed(1)}
                    </span>
                  </div>
                  <span className='text-xs text-gray-500 capitalize'>
                    {clubPlayer.role}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {club.club_players.length === 0 && (
            <div className='text-center py-8'>
              <Users className='h-12 w-12 text-gray-400 mx-auto mb-4' />
              <h3 className='text-lg font-medium text-gray-900 mb-2'>
                No players yet
              </h3>
              <p className='text-gray-500'>
                {isManager || isAdmin
                  ? 'Invite players to join your club!'
                  : 'This club is waiting for players to join.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClubDetail;