import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '@/store/useStore';
import { Calendar, Users, MapPin, Clock, Filter, Plus, Shield } from 'lucide-react';
import { formatDate, getStatusColor } from '@/lib/utils';
import { cn } from '@/lib/utils';

export default function Matches() {
  const { matches, loading, fetchMatches } = useStore();
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'completed'>('all');

  useEffect(() => {
    fetchMatches();
  }, [fetchMatches]);

  const filteredMatches = matches.filter(match => {
    if (filter === 'all') return true;
    return match.status === filter;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center space-x-2">
          <Calendar className="h-8 w-8 text-green-600" />
          <span>Football Matches</span>
        </h1>
        <Link
          to="/matches/create"
          className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Create Match</span>
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        {[{ key: 'all', label: 'All Matches' }, { key: 'upcoming', label: 'Upcoming' }, { key: 'completed', label: 'Completed' }].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key as any)}
            className={cn(
              'px-4 py-2 rounded-md font-medium transition-colors',
              filter === tab.key
                ? 'bg-white text-green-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Matches Grid */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
        </div>
      ) : filteredMatches.length === 0 ? (
        <div className="text-center py-12">
          <Calendar className="h-16 w-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-xl font-semibold text-gray-600 mb-2">No matches found</h3>
          <p className="text-gray-500 mb-4">
            {filter === 'all' ? 'No matches have been created yet.' : `No ${filter} matches available.`}
          </p>
          <Link
            to="/matches/create"
            className="bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors inline-flex items-center space-x-2"
          >
            <Plus className="h-5 w-5" />
            <span>Create Your First Match</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMatches.map((match) => (
            <div key={match.id} className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow border border-gray-200">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className={cn('px-3 py-1 rounded-full text-sm font-medium', getStatusColor(match.status))}>
                    {match.status}
                  </span>
                  <span className="text-sm text-gray-500">
                    {match.match_players?.length || 0}/{match.max_players}
                  </span>
                </div>
                
                {/* Club vs Club Display */}
                {match.team_a_club && match.team_b_club ? (
                  <div className="mb-4">
                    <div className="flex items-center justify-between bg-blue-50 p-3 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <Shield className="h-5 w-5 text-blue-600" />
                        <div>
                          <p className="font-semibold text-blue-800">{match.team_a_club.name}</p>
                          <p className="text-xs text-blue-600">vs</p>
                        </div>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold text-blue-800">VS</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div>
                          <p className="font-semibold text-blue-800 text-right">{match.team_b_club.name}</p>
                          <p className="text-xs text-blue-600 text-right">vs</p>
                        </div>
                        <Shield className="h-5 w-5 text-blue-600" />
                      </div>
                    </div>
                  </div>
                ) : (
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">{match.location}</h3>
                )}
                
                <div className="space-y-2 mb-4">
                  <div className="flex items-center space-x-2 text-gray-600">
                    <Clock className="h-4 w-4" />
                    <span className="text-sm">{formatDate(match.match_date)}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-gray-600">
                    <MapPin className="h-4 w-4" />
                    <span className="text-sm">{match.format} format</span>
                  </div>
                  <div className="flex items-center space-x-2 text-gray-600">
                    <Users className="h-4 w-4" />
                    <span className="text-sm">
                      Organized by {match.players?.nickname || 'Unknown'}
                    </span>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <Link
                    to={`/matches/${match.id}`}
                    className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors text-center"
                  >
                    View Details
                  </Link>
                  {match.status === 'upcoming' && (
                    <button
                      onClick={() => {/* Handle join match */}}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                    >
                      Join
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}