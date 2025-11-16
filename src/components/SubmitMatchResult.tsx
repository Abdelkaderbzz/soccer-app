import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useStore } from '@/store/useStore'
import { Trophy, User, Target, Clock, ArrowLeft, Save } from 'lucide-react'
import { toast } from 'sonner'

interface GoalScorer {
  player_id: string
  goals: number
}

export default function SubmitMatchResult() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { matches, currentPlayer, submitMatchResult } = useStore()
  
  const match = matches.find(m => m.id === id)
  const [teamAScore, setTeamAScore] = useState(0)
  const [teamBScore, setTeamBScore] = useState(0)
  const [duration, setDuration] = useState(60)
  const [goalScorers, setGoalScorers] = useState<GoalScorer[]>([])
  const [loading, setLoading] = useState(false)

  if (!match) {
    toast.error('Match not found')
    navigate('/matches')
    return null
  }

  const teamAPlayers = match.match_players?.filter(mp => mp.team === 'A') || []
  const teamBPlayers = match.match_players?.filter(mp => mp.team === 'B') || []
  const allPlayers = [...teamAPlayers, ...teamBPlayers]

  const handleGoalScorerChange = (playerId: string, goals: number) => {
    setGoalScorers(prev => {
      const filtered = prev.filter(g => g.player_id !== playerId)
      if (goals > 0) {
        return [...filtered, { player_id: playerId, goals }]
      }
      return filtered
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!currentPlayer) {
      toast.error('You must be logged in to submit match results')
      return
    }

    if (teamAScore < 0 || teamBScore < 0) {
      toast.error('Scores cannot be negative')
      return
    }

    if (duration <= 0) {
      toast.error('Match duration must be positive')
      return
    }

    setLoading(true)

    try {
      await submitMatchResult({
        match_id: match.id,
        team_a_score: teamAScore,
        team_b_score: teamBScore,
        duration_minutes: duration,
        goal_scorers: goalScorers.reduce((acc, scorer) => {
          acc[scorer.player_id] = scorer.goals
          return acc
        }, {} as Record<string, number>)
      })

      toast.success('Match result submitted successfully! 🎉')
      navigate(`/matches/${match.id}`)
    } catch (error) {
      toast.error('Failed to submit match result')
    } finally {
      setLoading(false)
    }
  }

  const totalGoals = teamAScore + teamBScore
  const recordedGoals = goalScorers.reduce((sum, scorer) => sum + scorer.goals, 0)

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <button
          onClick={() => navigate(`/matches/${match.id}`)}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Match</span>
        </button>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Submit Match Result</h1>
        <p className="text-gray-600">Record the final score and goal scorers for {match.location}</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl p-8 space-y-8">
        {/* Final Score */}
        <div className="bg-gray-50 rounded-xl p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Trophy className="h-6 w-6 text-yellow-500" />
            <h2 className="text-xl font-semibold text-gray-900">Final Score</h2>
          </div>
          
          <div className="grid grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Team A Score
              </label>
              <input
                type="number"
                min="0"
                value={teamAScore}
                onChange={(e) => setTeamAScore(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-center text-lg font-semibold"
              />
            </div>
            
            <div className="flex items-center justify-center">
              <span className="text-2xl font-bold text-gray-400">:</span>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Team B Score
              </label>
              <input
                type="number"
                min="0"
                value={teamBScore}
                onChange={(e) => setTeamBScore(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-center text-lg font-semibold"
              />
            </div>
          </div>
        </div>

        {/* Match Duration */}
        <div className="bg-gray-50 rounded-xl p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Clock className="h-6 w-6 text-blue-500" />
            <h2 className="text-xl font-semibold text-gray-900">Match Duration</h2>
          </div>
          
          <div className="flex items-center space-x-4">
            <input
              type="number"
              min="1"
              max="120"
              value={duration}
              onChange={(e) => setDuration(parseInt(e.target.value) || 60)}
              className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
            <span className="text-gray-600">minutes</span>
          </div>
        </div>

        {/* Goal Scorers */}
        <div className="bg-gray-50 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <Target className="h-6 w-6 text-green-500" />
              <h2 className="text-xl font-semibold text-gray-900">Goal Scorers</h2>
            </div>
            <div className="text-sm text-gray-600">
              {recordedGoals} / {totalGoals} goals recorded
            </div>
          </div>

          {allPlayers.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No players have joined this match yet</p>
          ) : (
            <div className="grid gap-4">
              {allPlayers.map((mp) => (
                <div key={mp.player_id} className="flex items-center justify-between bg-white rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    {mp.players?.photo_url ? (
                      <img
                        src={mp.players.photo_url}
                        alt={mp.players.nickname}
                        className="w-8 h-8 rounded-full"
                      />
                    ) : (
                      <User className="h-8 w-8 text-gray-400" />
                    )}
                    <div>
                      <p className="font-medium text-gray-900">{mp.players?.nickname}</p>
                      <p className="text-sm text-gray-600">Team {mp.team}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      min="0"
                      max="10"
                      value={goalScorers.find(g => g.player_id === mp.player_id)?.goals || 0}
                      onChange={(e) => handleGoalScorerChange(mp.player_id, parseInt(e.target.value) || 0)}
                      className="w-16 px-2 py-1 border border-gray-300 rounded text-center"
                    />
                    <span className="text-sm text-gray-600">goals</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {recordedGoals !== totalGoals && totalGoals > 0 && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                ⚠️ You've recorded {recordedGoals} goals but the total score shows {totalGoals} goals. 
                Please make sure all goal scorers are recorded.
              </p>
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate(`/matches/${match.id}`)}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || allPlayers.length === 0}
            className="flex items-center space-x-2 px-6 py-2 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg hover:from-green-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="h-4 w-4" />
            <span>{loading ? 'Submitting...' : 'Submit Result'}</span>
          </button>
        </div>
      </form>
    </div>
  )
}