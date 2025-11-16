import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useStore } from '@/store/useStore';
import { 
  Calendar, Users, MapPin, Clock, Trophy, Star, 
  Shield, Target, Zap, Plus, Shuffle, ArrowLeft 
} from 'lucide-react';
import { formatDate, getStatusColor, calculateTeamStrength, cn } from '@/lib/utils';
import { toast } from 'sonner';
import PlayerRating from '@/components/PlayerRating';

export default function MatchDetails() {
  const { id } = useParams<{ id: string }>();
  const { matches, loading, balanceTeams } = useStore();
  const [match, setMatch] = useState<any>(null);
  const [teamA, setTeamA] = useState<any[]>([]);
  const [teamB, setTeamB] = useState<any[]>([]);

  useEffect(() => {
    if (id && matches.length > 0) {
      const foundMatch = matches.find(m => m.id === id);
      if (foundMatch) {
        setMatch(foundMatch);
        
        // Separate players by team
        const players = foundMatch.match_players || [];
        setTeamA(players.filter((p: any) => p.team === 'A'));
        setTeamB(players.filter((p: any) => p.team === 'B'));
      }
    }
  }, [id, matches]);

  const handleBalanceTeams = async () => {
    if (!id) return;
    
    try {
      await balanceTeams(id);
      toast.success('Teams balanced successfully! 🎯');
      // Refresh match data
      window.location.reload();
    } catch (error) {
      toast.error('Failed to balance teams');
    }
  };

  const handleJoinMatch = () => {
    toast.success('Join match functionality coming soon! ⚽');
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Match not found</h2>
        <Link to="/matches" className="text-green-600 hover:text-green-800 font-medium">
          ← Back to matches
        </Link>
      </div>
    );
  }

  const teamAStrength = calculateTeamStrength(teamA.map(p => p.players));
  const teamBStrength = calculateTeamStrength(teamB.map(p => p.players));
  const balanceScore = Math.abs(teamAStrength - teamBStrength);

  // Get current player info for rating system
  const { currentPlayer } = useStore();
  const allPlayers = [...teamA, ...teamB].map(mp => mp.players).filter(Boolean);
  const currentPlayerId = currentPlayer?.id || '';

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link to="/matches" className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors mb-4">
          <ArrowLeft className="h-4 w-4" />
          <span>Back to matches</span>
        </Link>
        
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <span className={cn('px-3 py-1 rounded-full text-sm font-medium', getStatusColor(match.status))}>
                  {match.status}
                </span>
                <span className="text-sm text-gray-500">
                  {match.match_players?.length || 0}/{match.max_players} players
                </span>
              </div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">{match.location}</h1>
              <div className="flex items-center space-x-4 text-gray-600">
                <div className="flex items-center space-x-1">
                  <Calendar className="h-4 w-4" />
                  <span>{formatDate(match.match_date)}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <MapPin className="h-4 w-4" />
                  <span>{match.format}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Users className="h-4 w-4" />
                  <span>Organized by {match.players?.nickname}</span>
                </div>
              </div>
            </div>
            
            {match.status === 'upcoming' && (
              <div className="flex space-x-2">
                <button
                  onClick={handleJoinMatch}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  Join Match
                </button>
                <button
                  onClick={handleBalanceTeams}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center space-x-2"
                >
                  <Shuffle className="h-4 w-4" />
                  <span>Balance Teams</span>
                </button>
              </div>
            )}
            
            {match.status === 'in_progress' && (
              <Link
                to={`/matches/${match.id}/submit-result`}
                className="bg-orange-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-orange-700 transition-colors flex items-center space-x-2"
              >
                <Trophy className="h-4 w-4" />
                <span>Submit Result</span>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Team Display */}
      {match.status !== 'upcoming' && (
        <div className="mb-6">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-800 flex items-center space-x-2">
                <Trophy className="h-6 w-6 text-yellow-600" />
                <span>Teams</span>
              </h2>
              <div className="text-sm text-gray-600">
                Balance Score: <span className={cn('font-bold', balanceScore < 0.5 ? 'text-green-600' : 'text-yellow-600')}>
                  {balanceScore.toFixed(1)}
                </span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Team A */}
              <div className="border-2 border-blue-200 rounded-lg p-4 bg-blue-50">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-blue-800 flex items-center space-x-2">
                    <Shield className="h-5 w-5" />
                    <span>Team A</span>
                  </h3>
                  <div className="text-sm text-blue-600">
                    Strength: <span className="font-bold">{teamAStrength.toFixed(1)}</span>
                  </div>
                </div>
                <div className="space-y-3">
                  {teamA.map((player) => (
                    <div key={player.id} className="flex items-center space-x-3 p-2 bg-white rounded-lg">
                      <img
                        src={player.players?.photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(player.players?.nickname)}&background=3b82f6&color=fff`}
                        alt={player.players?.nickname}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-gray-800">{player.players?.nickname}</p>
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <span>⭐ {player.players?.overall_rating}</span>
                          <span>•</span>
                          <span>{player.goals_scored} goals</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Team B */}
              <div className="border-2 border-red-200 rounded-lg p-4 bg-red-50">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-red-800 flex items-center space-x-2">
                    <Target className="h-5 w-5" />
                    <span>Team B</span>
                  </h3>
                  <div className="text-sm text-red-600">
                    Strength: <span className="font-bold">{teamBStrength.toFixed(1)}</span>
                  </div>
                </div>
                <div className="space-y-3">
                  {teamB.map((player) => (
                    <div key={player.id} className="flex items-center space-x-3 p-2 bg-white rounded-lg">
                      <img
                        src={player.players?.photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(player.players?.nickname)}&background=ef4444&color=fff`}
                        alt={player.players?.nickname}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-gray-800">{player.players?.nickname}</p>
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <span>⭐ {player.players?.overall_rating}</span>
                          <span>•</span>
                          <span>{player.goals_scored} goals</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Match Results */}
      {match.match_results && match.match_results.length > 0 && (
        <div className="mb-6">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center space-x-2">
              <Trophy className="h-6 w-6 text-yellow-600" />
              <span>Match Results</span>
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-blue-800 mb-2">Team A</h3>
                <div className="text-4xl font-bold text-blue-600 mb-2">
                  {match.match_results[0].team_a_score}
                </div>
                <div className="text-sm text-gray-600">
                  {match.match_results[0].duration_minutes} minutes
                </div>
              </div>
              
              <div className="text-center">
                <h3 className="text-lg font-semibold text-red-800 mb-2">Team B</h3>
                <div className="text-4xl font-bold text-red-600 mb-2">
                  {match.match_results[0].team_b_score}
                </div>
                <div className="text-sm text-gray-600">
                  Final Score
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Player List */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center space-x-2">
          <Users className="h-6 w-6 text-green-600" />
          <span>Players ({match.match_players?.length || 0}/{match.max_players})</span>
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(match.match_players || []).map((player: any) => (
            <div key={player.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <img
                src={player.players?.photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(player.players?.nickname)}&background=10b981&color=fff`}
                alt={player.players?.nickname}
                className="w-12 h-12 rounded-full object-cover"
              />
              <div className="flex-1">
                <Link
                  to={`/players/${player.players?.id}`}
                  className="font-medium text-gray-800 hover:text-green-600 transition-colors"
                >
                  {player.players?.nickname}
                </Link>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <span>⭐ {player.players?.overall_rating}</span>
                  <span>•</span>
                  <span>{player.players?.position_preference}</span>
                  {player.team && (
                    <>
                      <span>•</span>
                      <span className={cn('px-2 py-1 rounded text-xs font-medium', 
                        player.team === 'A' ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'
                      )}>
                        Team {player.team}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Player Rating Section - Only show for completed matches and logged-in players */}
      {match.status === 'completed' && currentPlayer && allPlayers.length > 1 && (
        <div className="mb-6">
          <PlayerRating
            matchId={match.id}
            players={allPlayers}
            currentPlayerId={currentPlayerId}
            onRatingSubmitted={() => {
              toast.success('Rating submitted successfully!')
              // Optionally refresh the page or update ratings
            }}
          />
        </div>
      )}
    </div>
  );
}