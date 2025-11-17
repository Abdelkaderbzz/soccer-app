import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  User, Calendar, Trophy, Target, Star, 
  ArrowLeft, Award, TrendingUp, Shield, Zap, Users 
} from 'lucide-react';
import { formatDate, getWinRate, formatRating } from '@/lib/utils';
import { getData, putData, postData } from '@/lib/http';
import { supabase } from '@/lib/supabase';
import { useStore } from '@/store/useStore';

export default function PlayerProfile() {
  const { id } = useParams<{ id: string }>();
  const [player, setPlayer] = useState<any>(null);
  const [ratings, setRatings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const { currentUser, setCurrentPlayer } = useStore();

  useEffect(() => {
    if (id) {
      fetchPlayer();
      fetchPlayerRatings();
    }
  }, [id]);

  const fetchPlayer = async () => {
    try {
      const data = await getData<any>(`/players/${id}`)
      setPlayer(data)
    } catch (error) {
      console.error('Error fetching player:', error)
    } finally {
      setLoading(false)
    }
  };

  const fetchPlayerRatings = async () => {
    try {
      const data = await getData<any[]>(`/players/${id}/ratings`)
      setRatings(data)
    } catch (error) {
      console.error('Error fetching ratings:', error)
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!id || !e.target.files || e.target.files.length === 0) return;
      const file = e.target.files[0];
      setUploading(true);
      const { path, token } = await postData<{ path: string; token: string }>(
        `/players/${id}/photo/signed-url`,
        { fileName: file.name }
      )
      const { error: uploadError } = await supabase.storage
        .from('soccer-app')
        .uploadToSignedUrl(path, token, file)
      if (uploadError) throw uploadError

      const updated = await putData<any>(`/players/${id}`, { photo_url: path })
      setPlayer((prev: any) => ({ ...prev, photo_url: path }));
      if (currentUser && currentUser.id === player?.user_id) {
        setCurrentPlayer(updated || { ...player, photo_url: path });
      }
    } catch (err: any) {
      console.error('Error uploading photo:', err);
      alert(err.message || 'Failed to upload photo');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
      </div>
    );
  }

  if (!player) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Player not found</h2>
        <Link to="/" className="text-green-600 hover:text-green-800 font-medium">
          ← Back to home
        </Link>
      </div>
    );
  }

  const averageRatings = {
    skill: ratings.filter(r => r.category === 'skill').reduce((sum, r) => sum + r.rating, 0) / ratings.filter(r => r.category === 'skill').length || 0,
    teamwork: ratings.filter(r => r.category === 'teamwork').reduce((sum, r) => sum + r.rating, 0) / ratings.filter(r => r.category === 'teamwork').length || 0,
    sportsmanship: ratings.filter(r => r.category === 'sportsmanship').reduce((sum, r) => sum + r.rating, 0) / ratings.filter(r => r.category === 'sportsmanship').length || 0
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link to="/" className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors mb-4">
          <ArrowLeft className="h-4 w-4" />
          <span>Back to home</span>
        </Link>
        
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="flex flex-col md:flex-row items-center md:items-start space-y-6 md:space-y-0 md:space-x-8">
            <div className="relative">
              <img
                src={player.photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(player.nickname)}&background=10b981&color=fff`}
                alt={player.nickname}
                className="w-32 h-32 rounded-full object-cover border-4 border-green-200"
              />
              {currentUser?.id === player.user_id && (
                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2">
                  <label className="bg-green-600 text-white px-3 py-1 rounded-lg text-sm cursor-pointer hover:bg-green-700">
                    {uploading ? 'Uploading...' : 'Change Photo'}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                      disabled={uploading}
                    />
                  </label>
                </div>
              )}
              <div className="absolute -bottom-2 -right-2 bg-yellow-400 text-white rounded-full p-2">
                <Trophy className="h-6 w-6" />
              </div>
            </div>
            
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-4xl font-bold text-gray-800 mb-2">{player.nickname}</h1>
              <div className="flex items-center justify-center md:justify-start space-x-2 mb-4">
                <div className="flex items-center space-x-1">
                  <Star className="h-5 w-5 text-yellow-500" />
                  <span className="text-xl font-bold text-gray-800">{formatRating(player.overall_rating)}</span>
                </div>
                <span className="text-gray-400">•</span>
                <span className="text-gray-600 capitalize">{player.position_preference}</span>
              </div>
              
              <p className="text-gray-600 mb-4">
                ⚽ Football enthusiast bringing energy and competition to every match!
              </p>
              
              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-600">Joined {new Date(player.created_at).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Award className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-600">{player.matches_played} matches played</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-lg p-6 text-center">
          <div className="bg-green-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
            <Trophy className="h-6 w-6 text-green-600" />
          </div>
          <div className="text-2xl font-bold text-gray-800">{player.wins}</div>
          <div className="text-gray-600">Wins</div>
        </div>
        
        <div className="bg-white rounded-xl shadow-lg p-6 text-center">
          <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
            <Target className="h-6 w-6 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-gray-800">{player.goals_scored}</div>
          <div className="text-gray-600">Goals Scored</div>
        </div>
        
        <div className="bg-white rounded-xl shadow-lg p-6 text-center">
          <div className="bg-yellow-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
            <TrendingUp className="h-6 w-6 text-yellow-600" />
          </div>
          <div className="text-2xl font-bold text-gray-800">{getWinRate(player.wins, player.matches_played)}</div>
          <div className="text-gray-600">Win Rate</div>
        </div>
        
        <div className="bg-white rounded-xl shadow-lg p-6 text-center">
          <div className="bg-purple-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
            <Star className="h-6 w-6 text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-gray-800">{formatRating(player.overall_rating)}</div>
          <div className="text-gray-600">Overall Rating</div>
        </div>
      </div>

      {/* Rating Breakdown */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center space-x-2">
          <Star className="h-6 w-6 text-yellow-600" />
          <span>Rating Breakdown</span>
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <Zap className="h-5 w-5 text-orange-600" />
              <h3 className="font-semibold text-gray-800">Skill</h3>
            </div>
            <div className="text-3xl font-bold text-orange-600 mb-1">
              {formatRating(averageRatings.skill)}
            </div>
            <div className="text-sm text-gray-600">
              {ratings.filter(r => r.category === 'skill').length} ratings
            </div>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <Users className="h-5 w-5 text-blue-600" />
              <h3 className="font-semibold text-gray-800">Teamwork</h3>
            </div>
            <div className="text-3xl font-bold text-blue-600 mb-1">
              {formatRating(averageRatings.teamwork)}
            </div>
            <div className="text-sm text-gray-600">
              {ratings.filter(r => r.category === 'teamwork').length} ratings
            </div>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <Shield className="h-5 w-5 text-green-600" />
              <h3 className="font-semibold text-gray-800">Sportsmanship</h3>
            </div>
            <div className="text-3xl font-bold text-green-600 mb-1">
              {formatRating(averageRatings.sportsmanship)}
            </div>
            <div className="text-sm text-gray-600">
              {ratings.filter(r => r.category === 'sportsmanship').length} ratings
            </div>
          </div>
        </div>
      </div>

      {/* Recent Ratings */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center space-x-2">
          <Star className="h-6 w-6 text-yellow-600" />
          <span>Recent Ratings</span>
        </h2>
        
        {ratings.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Star className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No ratings received yet</p>
            <p className="text-sm">Play some matches to get rated by teammates!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {ratings.slice(0, 5).map((rating) => (
              <div key={rating.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <img
                      src={rating.rater?.photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(rating.rater?.nickname)}&background=10b981&color=fff`}
                      alt={rating.rater?.nickname}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div>
                      <p className="font-medium text-gray-800">{rating.rater?.nickname}</p>
                      <p className="text-sm text-gray-600">{rating.match?.location}</p>
                      <p className="text-xs text-gray-500">{formatDate(rating.created_at)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center space-x-1 mb-1">
                      <Star className="h-4 w-4 text-yellow-500" />
                      <span className="font-bold text-gray-800">{formatRating(rating.rating)}</span>
                    </div>
                    <span className="text-xs text-gray-600 capitalize">{rating.category}</span>
                  </div>
                </div>
                {rating.comment && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-700 italic">"{rating.comment}"</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}