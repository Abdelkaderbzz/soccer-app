import { useEffect, useState } from 'react';
import { Trophy, Target, Star, TrendingUp, Users, Award } from 'lucide-react';
import { formatRating, getWinRate, cn } from '@/lib/utils';

interface Player {
  id: string;
  nickname: string;
  photo_url: string | null;
  overall_rating: number;
  matches_played: number;
  wins: number;
  goals_scored: number;
}

export default function Statistics() {
  const [leaderboard, setLeaderboard] = useState<Player[]>([]);
  const [topScorers, setTopScorers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStatistics();
  }, []);

  const fetchStatistics = async () => {
    try {
      const [leaderboardRes, topScorersRes] = await Promise.all([
        fetch('/api/statistics/leaderboard'),
        fetch('/api/statistics/top-scorers')
      ]);
      
      const leaderboardData = await leaderboardRes.json();
      const topScorersData = await topScorersRes.json();
      
      setLeaderboard(leaderboardData);
      setTopScorers(topScorersData);
    } catch (error) {
      console.error('Error fetching statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-800 mb-4 flex items-center justify-center space-x-3">
          <Trophy className="h-10 w-10 text-yellow-600" />
          <span>Football Statistics</span>
          <Trophy className="h-10 w-10 text-yellow-600" />
        </h1>
        <p className="text-xl text-gray-600">
          Discover the top performers and rising stars in our football community! 🌟
        </p>
      </div>

      {/* Overall Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-yellow-400 to-yellow-600 text-white rounded-xl shadow-lg p-6 text-center">
          <Trophy className="h-8 w-8 mx-auto mb-3" />
          <div className="text-3xl font-bold mb-1">{leaderboard.length}</div>
          <div className="text-sm opacity-90">Total Players</div>
        </div>
        
        <div className="bg-gradient-to-br from-blue-400 to-blue-600 text-white rounded-xl shadow-lg p-6 text-center">
          <Users className="h-8 w-8 mx-auto mb-3" />
          <div className="text-3xl font-bold mb-1">
            {leaderboard.reduce((sum, player) => sum + player.matches_played, 0)}
          </div>
          <div className="text-sm opacity-90">Matches Played</div>
        </div>
        
        <div className="bg-gradient-to-br from-green-400 to-green-600 text-white rounded-xl shadow-lg p-6 text-center">
          <Target className="h-8 w-8 mx-auto mb-3" />
          <div className="text-3xl font-bold mb-1">
            {leaderboard.reduce((sum, player) => sum + player.goals_scored, 0)}
          </div>
          <div className="text-sm opacity-90">Total Goals</div>
        </div>
        
        <div className="bg-gradient-to-br from-purple-400 to-purple-600 text-white rounded-xl shadow-lg p-6 text-center">
          <Award className="h-8 w-8 mx-auto mb-3" />
          <div className="text-3xl font-bold mb-1">
            {leaderboard.length > 0 ? formatRating(leaderboard[0].overall_rating) : '0.0'}
          </div>
          <div className="text-sm opacity-90">Top Rating</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top Rated Players */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="bg-yellow-100 p-3 rounded-lg">
              <Trophy className="h-6 w-6 text-yellow-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800">Top Rated Players</h2>
          </div>
          
          {leaderboard.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No players available</p>
            </div>
          ) : (
            <div className="space-y-4">
              {leaderboard.map((player, index) => (
                <div key={player.id} className="flex items-center space-x-4 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
                  <div className="flex-shrink-0">
                    <div className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center font-bold text-white',
                      index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-orange-600' : 'bg-gray-500'
                    )}>
                      {index + 1}
                    </div>
                  </div>
                  
                  <img
                    src={player.photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(player.nickname)}&background=10b981&color=fff`}
                    alt={player.nickname}
                    className="w-12 h-12 rounded-full object-cover border-2 border-yellow-300"
                  />
                  
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-800">{player.nickname}</h3>
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <span>{player.matches_played} matches</span>
                      <span>•</span>
                      <span>{getWinRate(player.wins, player.matches_played)} win rate</span>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="flex items-center space-x-1">
                      <Star className="h-4 w-4 text-yellow-500" />
                      <span className="font-bold text-lg text-gray-800">{formatRating(player.overall_rating)}</span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {player.matches_played > 0 ? 'Active' : 'New'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Goal Scorers */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="bg-red-100 p-3 rounded-lg">
              <Target className="h-6 w-6 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800">Top Goal Scorers</h2>
          </div>
          
          {topScorers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No goals scored yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {topScorers.map((player, index) => (
                <div key={player.id} className="flex items-center space-x-4 p-4 bg-gradient-to-r from-red-50 to-orange-50 rounded-lg border border-red-200">
                  <div className="flex-shrink-0">
                    <div className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center font-bold text-white',
                      index === 0 ? 'bg-red-500' : index === 1 ? 'bg-orange-500' : index === 2 ? 'bg-yellow-600' : 'bg-gray-500'
                    )}>
                      {index + 1}
                    </div>
                  </div>
                  
                  <img
                    src={player.photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(player.nickname)}&background=ef4444&color=fff`}
                    alt={player.nickname}
                    className="w-12 h-12 rounded-full object-cover border-2 border-red-300"
                  />
                  
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-800">{player.nickname}</h3>
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <span>{player.matches_played} matches</span>
                      <span>•</span>
                      <span>{formatRating(player.overall_rating)} rating</span>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="flex items-center space-x-1">
                      <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold">⚽</span>
                      </div>
                      <span className="font-bold text-lg text-gray-800">{player.goals_scored}</span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {player.matches_played > 0 ? `${(player.goals_scored / player.matches_played).toFixed(1)} per match` : '0.0 per match'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Performance Insights */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="bg-purple-100 p-3 rounded-lg">
            <TrendingUp className="h-6 w-6 text-purple-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800">Performance Insights</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
            <h3 className="font-semibold text-blue-800 mb-2">Most Consistent</h3>
            {leaderboard.length > 0 && (
              <div className="flex items-center space-x-3">
                <img
                  src={leaderboard[0].photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(leaderboard[0].nickname)}&background=3b82f6&color=fff`}
                  alt={leaderboard[0].nickname}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div>
                  <p className="font-medium text-gray-800">{leaderboard[0].nickname}</p>
                  <p className="text-sm text-gray-600">{formatRating(leaderboard[0].overall_rating)} rating</p>
                </div>
              </div>
            )}
          </div>
          
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
            <h3 className="font-semibold text-green-800 mb-2">Best Win Rate</h3>
            {leaderboard.length > 0 && (
              <div className="flex items-center space-x-3">
                {(() => {
                  const bestWinRate = [...leaderboard]
                    .filter(p => p.matches_played > 0)
                    .sort((a, b) => (b.wins / b.matches_played) - (a.wins / a.matches_played))[0];
                  
                  return bestWinRate ? (
                    <>
                      <img
                        src={bestWinRate.photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(bestWinRate.nickname)}&background=10b981&color=fff`}
                        alt={bestWinRate.nickname}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <div>
                        <p className="font-medium text-gray-800">{bestWinRate.nickname}</p>
                        <p className="text-sm text-gray-600">{getWinRate(bestWinRate.wins, bestWinRate.matches_played)} win rate</p>
                      </div>
                    </>
                  ) : null;
                })()}
              </div>
            )}
          </div>
          
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4 border border-orange-200">
            <h3 className="font-semibold text-orange-800 mb-2">Most Active</h3>
            {leaderboard.length > 0 && (
              <div className="flex items-center space-x-3">
                {(() => {
                  const mostActive = [...leaderboard].sort((a, b) => b.matches_played - a.matches_played)[0];
                  
                  return (
                    <>
                      <img
                        src={mostActive.photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(mostActive.nickname)}&background=f97316&color=fff`}
                        alt={mostActive.nickname}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <div>
                        <p className="font-medium text-gray-800">{mostActive.nickname}</p>
                        <p className="text-sm text-gray-600">{mostActive.matches_played} matches</p>
                      </div>
                    </>
                  );
                })()}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}