import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '@/store/useStore';
import { Calendar, Users, Trophy, Plus, Clock, MapPin } from 'lucide-react';
import { formatDate, getStatusColor } from '@/lib/utils';
import { cn } from '@/lib/utils';

export default function Home() {
  const { matches, players, loading, fetchMatches, fetchPlayers } = useStore();

  useEffect(() => {
    fetchMatches();
    fetchPlayers();
  }, [fetchMatches, fetchPlayers]);

  const upcomingMatches = matches.filter(match => match.status === 'upcoming').slice(0, 3);
  const topPlayers = players.slice(0, 5);

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <section className="text-center py-12 bg-gradient-to-r from-green-600 to-blue-600 rounded-2xl text-white">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-5xl font-bold mb-4">⚽ Welcome to Football Hub</h1>
          <p className="text-xl mb-8 opacity-90">
            Organize epic football matches with balanced teams, track your stats, and become a legend! 🏆
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              to="/matches/create"
              className="bg-white text-green-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors flex items-center space-x-2"
            >
              <Plus className="h-5 w-5" />
              <span>Create Match</span>
            </Link>
            <Link
              to="/matches"
              className="bg-green-700 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-800 transition-colors flex items-center space-x-2"
            >
              <Calendar className="h-5 w-5" />
              <span>View Matches</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Quick Stats */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-lg border-2 border-green-200">
          <div className="flex items-center space-x-3">
            <div className="bg-green-100 p-3 rounded-lg">
              <Calendar className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{matches.length}</p>
              <p className="text-gray-600">Total Matches</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-lg border-2 border-blue-200">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-100 p-3 rounded-lg">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{players.length}</p>
              <p className="text-gray-600">Active Players</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-lg border-2 border-yellow-200">
          <div className="flex items-center space-x-3">
            <div className="bg-yellow-100 p-3 rounded-lg">
              <Trophy className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">
                {upcomingMatches.length}
              </p>
              <p className="text-gray-600">Upcoming Matches</p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Upcoming Matches */}
        <section className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center space-x-2">
              <Calendar className="h-6 w-6 text-green-600" />
              <span>Upcoming Matches</span>
            </h2>
            <Link to="/matches" className="text-green-600 hover:text-green-800 font-medium">
              View All →
            </Link>
          </div>
          
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
            </div>
          ) : upcomingMatches.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No upcoming matches</p>
              <Link to="/matches/create" className="text-green-600 hover:text-green-800 font-medium">
                Create one now!
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {upcomingMatches.map((match) => (
                <div key={match.id} className="border border-gray-200 rounded-lg p-4 hover:border-green-300 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <span className={cn('px-3 py-1 rounded-full text-sm font-medium', getStatusColor(match.status))}>
                      {match.status}
                    </span>
                    <span className="text-sm text-gray-500">
                      {match.match_players?.length || 0}/{match.max_players} players
                    </span>
                  </div>
                  <h3 className="font-semibold text-gray-800 mb-2">{match.location}</h3>
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <div className="flex items-center space-x-1">
                      <Clock className="h-4 w-4" />
                      <span>{formatDate(match.match_date)}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <MapPin className="h-4 w-4" />
                      <span>{match.format}</span>
                    </div>
                  </div>
                  <Link
                    to={`/matches/${match.id}`}
                    className="mt-3 inline-block bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                  >
                    View Match →
                  </Link>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Top Players */}
        <section className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center space-x-2">
              <Trophy className="h-6 w-6 text-yellow-600" />
              <span>Top Players</span>
            </h2>
            <Link to="/statistics" className="text-yellow-600 hover:text-yellow-800 font-medium">
              View All →
            </Link>
          </div>
          
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-600 mx-auto"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {topPlayers.map((player, index) => (
                <div key={player.id} className="flex items-center space-x-4 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex-shrink-0">
                    <span className="text-2xl font-bold text-gray-400">#{index + 1}</span>
                  </div>
                  <img
                    src={player.photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(player.nickname)}&background=10b981&color=fff`}
                    alt={player.nickname}
                    className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-800">{player.nickname}</h3>
                    <p className="text-sm text-gray-600">
                      {player.matches_played} matches • {player.goals_scored} goals
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center space-x-1">
                      <span className="text-yellow-500">⭐</span>
                      <span className="font-bold text-gray-800">{player.overall_rating}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}