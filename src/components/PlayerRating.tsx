import { useState } from 'react';
import { Star, User, Send } from 'lucide-react';
import { toast } from 'sonner';

interface Player {
  id: string;
  nickname: string;
  photo_url?: string;
}

interface PlayerRatingProps {
  matchId: string;
  players: Player[];
  currentPlayerId: string;
  onRatingSubmitted?: () => void;
}

export default function PlayerRating({
  matchId,
  players,
  currentPlayerId,
  onRatingSubmitted,
}: PlayerRatingProps) {
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [comments, setComments] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const handleRatingChange = (playerId: string, rating: number) => {
    setRatings((prev) => ({ ...prev, [playerId]: rating }));
  };

  const handleCommentChange = (playerId: string, comment: string) => {
    setComments((prev) => ({ ...prev, [playerId]: comment }));
  };

  const handleSubmitRating = async (playerId: string) => {
    if (!ratings[playerId]) {
      toast.error('Please select a rating');
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/ratings', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          match_id: matchId,
          rated_player_id: playerId,
          rating: ratings[playerId],
          comment: comments[playerId] || '',
          category: 'overall',
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to submit rating');
      }

      toast.success(
        `Rating submitted for ${
          players.find((p) => p.id === playerId)?.nickname
        }!`
      );

      // Remove rated player from the list
      setRatings((prev) => {
        const newRatings = { ...prev };
        delete newRatings[playerId];
        return newRatings;
      });

      setComments((prev) => {
        const newComments = { ...prev };
        delete newComments[playerId];
        return newComments;
      });

      if (onRatingSubmitted) {
        onRatingSubmitted();
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to submit rating'
      );
    } finally {
      setLoading(false);
    }
  };

  const unratedPlayers = players.filter(
    (p) => p.id !== currentPlayerId && !ratings[p.id]
  );

  if (unratedPlayers.length === 0) {
    return (
      <div className='bg-green-50 border border-green-200 rounded-lg p-6 text-center'>
        <Star className='h-8 w-8 text-green-600 mx-auto mb-2' />
        <h3 className='text-lg font-semibold text-green-800 mb-1'>
          All ratings submitted!
        </h3>
        <p className='text-green-700'>
          You've rated all other players in this match.
        </p>
      </div>
    );
  }

  return (
    <div className='bg-white rounded-xl shadow-lg p-6'>
      <div className='flex items-center space-x-2 mb-6'>
        <Star className='h-6 w-6 text-yellow-500' />
        <h2 className='text-xl font-bold text-gray-800'>
          Rate Your Teammates & Opponents
        </h2>
      </div>

      <div className='space-y-6'>
        {unratedPlayers.map((player) => (
          <div
            key={player.id}
            className='border border-gray-200 rounded-lg p-4'
          >
            <div className='flex items-center space-x-3 mb-4'>
              {player.photo_url ? (
                <img
                  src={player.photo_url}
                  alt={player.nickname}
                  className='w-12 h-12 rounded-full object-cover'
                />
              ) : (
                <div className='w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center'>
                  <User className='h-6 w-6 text-gray-600' />
                </div>
              )}
              <div>
                <h3 className='font-semibold text-gray-900'>
                  {player.nickname}
                </h3>
                <p className='text-sm text-gray-600'>
                  Rate this player's performance
                </p>
              </div>
            </div>

            {/* Rating Stars */}
            <div className='mb-4'>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Rating (1-5 stars)
              </label>
              <div className='flex space-x-1'>
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type='button'
                    onClick={() => handleRatingChange(player.id, star)}
                    className={`p-1 transition-colors ${
                      ratings[player.id] >= star
                        ? 'text-yellow-500 hover:text-yellow-600'
                        : 'text-gray-300 hover:text-yellow-400'
                    }`}
                  >
                    <Star className='h-6 w-6 fill-current' />
                  </button>
                ))}
              </div>
              {ratings[player.id] && (
                <p className='text-sm text-gray-600 mt-1'>
                  {ratings[player.id]} out of 5 stars
                </p>
              )}
            </div>

            {/* Comment */}
            <div className='mb-4'>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Comment (optional)
              </label>
              <textarea
                value={comments[player.id] || ''}
                onChange={(e) => handleCommentChange(player.id, e.target.value)}
                placeholder="Share your feedback about this player's performance..."
                rows={2}
                className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none'
              />
            </div>

            {/* Submit Button */}
            <button
              onClick={() => handleSubmitRating(player.id)}
              disabled={loading || !ratings[player.id]}
              className='w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2'
            >
              <Send className='h-4 w-4' />
              <span>Submit Rating</span>
            </button>
          </div>
        ))}
      </div>

      <div className='mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200'>
        <h4 className='font-semibold text-blue-800 mb-2'>Rating Guidelines</h4>
        <ul className='text-sm text-blue-700 space-y-1'>
          <li>• 5 stars: Outstanding performance</li>
          <li>• 4 stars: Very good performance</li>
          <li>• 3 stars: Good performance</li>
          <li>• 2 stars: Below average performance</li>
          <li>• 1 star: Poor performance</li>
        </ul>
      </div>
    </div>
  );
}