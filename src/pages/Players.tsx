import { useEffect, useState } from 'react';
import { Users, User, Star, Trophy, Calendar } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { getData } from '@/lib/http';

interface Player {
  id: string;
  user_id: string;
  nickname: string;
  photo_url: string;
  overall_rating: number;
  matches_played: number;
  wins: number;
  goals_scored: number;
  position_preference: string;
  created_at: string;
  updated_at: string;
}

export default function Players() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const { token } = useStore();

  useEffect(() => {
    fetchPlayers();
  }, []);

  const fetchPlayers = async () => {
    try {
      const data = await getData<Player[]>('/players');
      setPlayers(data);
    } catch (error) {
      console.error('Error fetching players:', error);
    } finally {
      setLoading(false);
    }
  };

  const getWinRate = (wins: number, matches: number) => {
    if (matches === 0) return 0;
    return Math.round((wins / matches) * 100);
  };

  const getPositionColor = (position: string) => {
    const colors = {
      goalkeeper: 'bg-blue-100 text-blue-800',
      defender: 'bg-green-100 text-green-800',
      midfielder: 'bg-yellow-100 text-yellow-800',
      forward: 'bg-red-100 text-red-800',
    };
    return (
      colors[position as keyof typeof colors] || 'bg-gray-100 text-gray-800'
    );
  };

  if (loading) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-8'>
        <div className='max-w-6xl mx-auto'>
          <div className='flex items-center space-x-3 mb-8'>
            <Users className='h-8 w-8 text-green-600' />
            <h1 className='text-3xl font-bold text-gray-800'>Players</h1>
          </div>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className='bg-white rounded-lg shadow-md p-6 animate-pulse'
              >
                <div className='flex items-center space-x-4 mb-4'>
                  <div className='w-16 h-16 bg-gray-200 rounded-full'></div>
                  <div className='flex-1'>
                    <div className='h-4 bg-gray-200 rounded w-3/4 mb-2'></div>
                    <div className='h-3 bg-gray-200 rounded w-1/2'></div>
                  </div>
                </div>
                <div className='space-y-2'>
                  <div className='h-3 bg-gray-200 rounded'></div>
                  <div className='h-3 bg-gray-200 rounded'></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-8'>
      <div className='max-w-6xl mx-auto'>
        <div className='flex items-center justify-between mb-8'>
          <div className='flex items-center space-x-3'>
            <Users className='h-8 w-8 text-green-600' />
            <h1 className='text-3xl font-bold text-gray-800'>Players</h1>
          </div>
          <div className='text-sm text-gray-600'>
            Total Players: {players.length}
          </div>
        </div>

        {players.length === 0 ? (
          <div className='text-center py-12'>
            <Users className='h-16 w-16 text-gray-400 mx-auto mb-4' />
            <h3 className='text-lg font-medium text-gray-900 mb-2'>
              No players found
            </h3>
            <p className='text-gray-600'>
              Be the first to join and create your player profile!
            </p>
          </div>
        ) : (
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
            {players.map((player) => (
              <Link
                key={player.id}
                to={`/players/${player.id}`}
                className='bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 p-6'
              >
                <div className='flex items-center space-x-4 mb-4'>
                  <img
                    src={player.photo_url}
                    alt={player.nickname}
                    className='w-16 h-16 rounded-full object-cover'
                    onError={(e) => {
                      e.currentTarget.src =
                        'https://ui-avatars.com/api/?name=Player&background=random';
                    }}
                  />
                  <div className='flex-1'>
                    <h3 className='font-semibold text-gray-800 text-lg'>
                      {player.nickname}
                    </h3>
                    <span
                      className={cn(
                        'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
                        getPositionColor(player.position_preference)
                      )}
                    >
                      {player.position_preference}
                    </span>
                  </div>
                </div>

                <div className='space-y-3'>
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center space-x-1'>
                      <Star className='h-4 w-4 text-yellow-400 fill-current' />
                      <span className='text-sm font-medium'>
                        {player.overall_rating}
                      </span>
                    </div>
                    <div className='flex items-center space-x-1 text-sm text-gray-600'>
                      <Trophy className='h-4 w-4' />
                      <span>
                        {getWinRate(player.wins, player.matches_played)}% Win
                        Rate
                      </span>
                    </div>
                  </div>

                  <div className='grid grid-cols-2 gap-4 text-sm'>
                    <div className='text-center'>
                      <div className='font-semibold text-gray-800'>
                        {player.matches_played}
                      </div>
                      <div className='text-gray-600'>Matches</div>
                    </div>
                    <div className='text-center'>
                      <div className='font-semibold text-gray-800'>
                        {player.goals_scored}
                      </div>
                      <div className='text-gray-600'>Goals</div>
                    </div>
                  </div>

                  <div className='text-xs text-gray-500 text-center'>
                    Joined {new Date(player.created_at).toLocaleDateString()}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
