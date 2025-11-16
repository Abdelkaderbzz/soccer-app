import React, { useState, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { UserPlus, Send, Check, X, Users, Trophy } from 'lucide-react';
import { toast } from 'sonner';

interface Player {
  id: string;
  nickname: string;
  photo_url: string;
  overall_rating: number;
  position_preference: string;
}

interface MatchInvitation {
  id: string;
  match_id: string;
  player_id: string;
  invited_by: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  players: Player;
  match: {
    location: string;
    match_date: string;
  };
}

interface MatchInvitationsProps {
  matchId: string;
  team?: 'A' | 'B' | null;
  onInviteComplete?: () => void;
}

export default function MatchInvitations({ matchId, team, onInviteComplete }: MatchInvitationsProps) {
  const { currentUser, token } = useStore();
  const [players, setPlayers] = useState<Player[]>([]);
  const [invitations, setInvitations] = useState<MatchInvitation[]>([]);
  const [selectedPlayerId, setSelectedPlayerId] = useState('');
  const [loading, setLoading] = useState(false);
  const [showInviteForm, setShowInviteForm] = useState(false);

  useEffect(() => {
    fetchAvailablePlayers();
    fetchInvitations();
  }, [matchId]);

  const fetchAvailablePlayers = async () => {
    try {
      // Fetch all players except current user
      const response = await fetch('http://localhost:3001/api/players', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      setPlayers(data.filter((player: Player) => player.id !== currentUser?.id));
    } catch (error) {
      console.error('Error fetching players:', error);
      toast.error('Failed to fetch players');
    }
  };

  const fetchInvitations = async () => {
    try {
      const response = await fetch(`http://localhost:3001/api/matches/${matchId}/invitations`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      setInvitations(data);
    } catch (error) {
      console.error('Error fetching invitations:', error);
    }
  };

  const handleInvitePlayer = async () => {
    if (!selectedPlayerId) {
      toast.error('Please select a player to invite');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`http://localhost:3001/api/matches/${matchId}/invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          player_id: selectedPlayerId,
          team: team
        }),
      });

      if (response.ok) {
        toast.success('Player invited successfully!');
        setSelectedPlayerId('');
        setShowInviteForm(false);
        fetchInvitations();
        onInviteComplete?.();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to invite player');
      }
    } catch (error) {
      console.error('Error inviting player:', error);
      toast.error('Failed to invite player');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptInvitation = async (invitationId: string) => {
    try {
      const response = await fetch(`http://localhost:3001/api/matches/invitations/${invitationId}/accept`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        toast.success('Invitation accepted!');
        fetchInvitations();
        onInviteComplete?.();
      }
    } catch (error) {
      console.error('Error accepting invitation:', error);
      toast.error('Failed to accept invitation');
    }
  };

  const handleRejectInvitation = async (invitationId: string) => {
    try {
      const response = await fetch(`http://localhost:3001/api/matches/invitations/${invitationId}/reject`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        toast.success('Invitation rejected');
        fetchInvitations();
      }
    } catch (error) {
      console.error('Error rejecting invitation:', error);
      toast.error('Failed to reject invitation');
    }
  };

  const pendingInvitations = invitations.filter(inv => inv.status === 'pending');
  const acceptedInvitations = invitations.filter(inv => inv.status === 'accepted');

  return (
    <div className="space-y-6">
      {/* Invite New Player */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center">
            <UserPlus className="w-5 h-5 mr-2" />
            Invite Players
            {team && <span className="ml-2 text-sm text-gray-500">(Team {team})</span>}
          </h3>
          <button
            onClick={() => setShowInviteForm(!showInviteForm)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
          >
            <Send className="w-4 h-4 mr-2" />
            Invite Player
          </button>
        </div>

        {showInviteForm && (
          <div className="border-t pt-4">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Player
              </label>
              <select
                value={selectedPlayerId}
                onChange={(e) => setSelectedPlayerId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Choose a player...</option>
                {players.map((player) => (
                  <option key={player.id} value={player.id}>
                    {player.nickname} (Rating: {player.overall_rating})
                  </option>
                ))}
              </select>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={handleInvitePlayer}
                disabled={loading || !selectedPlayerId}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Sending...' : 'Send Invitation'}
              </button>
              <button
                onClick={() => setShowInviteForm(false)}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Pending Invitations */}
      {pendingInvitations.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <Users className="w-5 h-5 mr-2" />
            Pending Invitations ({pendingInvitations.length})
          </h3>
          <div className="space-y-3">
            {pendingInvitations.map((invitation) => (
              <div key={invitation.id} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="flex items-center space-x-3">
                  <img
                    src={invitation.players.photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(invitation.players.nickname)}&background=3B82F6&color=fff`}
                    alt={invitation.players.nickname}
                    className="w-10 h-10 rounded-full"
                  />
                  <div>
                    <p className="font-medium text-gray-800">{invitation.players.nickname}</p>
                    <p className="text-sm text-gray-600">
                      Invited to {invitation.match.location} • {new Date(invitation.match.match_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleAcceptInvitation(invitation.id)}
                    className="bg-green-600 text-white p-2 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleRejectInvitation(invitation.id)}
                    className="bg-red-600 text-white p-2 rounded-lg hover:bg-red-700 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Accepted Players */}
      {acceptedInvitations.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <Trophy className="w-5 h-5 mr-2" />
            Confirmed Players ({acceptedInvitations.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {acceptedInvitations.map((invitation) => (
              <div key={invitation.id} className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg border border-green-200">
                <img
                  src={invitation.players.photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(invitation.players.nickname)}&background=3B82F6&color=fff`}
                  alt={invitation.players.nickname}
                  className="w-10 h-10 rounded-full"
                />
                <div>
                  <p className="font-medium text-gray-800">{invitation.players.nickname}</p>
                  <p className="text-sm text-gray-600">Rating: {invitation.players.overall_rating}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}