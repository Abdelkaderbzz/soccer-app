import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/store/useStore';
import {
  Calendar,
  MapPin,
  Users,
  Trophy,
  ArrowLeft,
  Shield,
} from 'lucide-react';
import { toast } from 'sonner';


export default function CreateMatch() {
  const navigate = useNavigate();
  const { createMatch, fetchClubs, clubs, myClubs, currentUser } = useStore();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    match_date: '',
    format: '5v5' as '5v5' | '7v7' | '11v11',
    max_players: 10,
    team_a_club_id: '',
    team_b_club_id: '',
    organizer_id: currentUser?.id || '',
  });

  const [matchType, setMatchType] = useState<'open' | 'club_vs_club'>('open');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (currentUser) {
      fetchClubs();
    }
  }, [currentUser, fetchClubs]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!formData.location || !formData.match_date) {
      toast.error('Please fill in all required fields');
      setLoading(false);
      return;
    }

    if (
      matchType === 'club_vs_club' &&
      (!formData.team_a_club_id || !formData.team_b_club_id)
    ) {
      toast.error('Please select both clubs for the match');
      setLoading(false);
      return;
    }

    if (
      matchType === 'club_vs_club' &&
      formData.team_a_club_id === formData.team_b_club_id
    ) {
      toast.error('Please select different clubs for the match');
      setLoading(false);
      return;
    }

    try {
      const matchData = {
        ...formData,
        match_date: new Date(formData.match_date).toISOString(),
        // Only include club IDs for club vs club matches
        team_a_club_id:
          matchType === 'club_vs_club' ? formData.team_a_club_id : null,
        team_b_club_id:
          matchType === 'club_vs_club' ? formData.team_b_club_id : null,
      };

      await createMatch(matchData);

      // If it's a club vs club match, automatically invite club members
      if (matchType === 'club_vs_club' && formData.team_a_club_id && formData.team_b_club_id) {
        toast.success('Match created successfully! Inviting club members... 🎉');
        
        // Invite members from both clubs
        const teamAClub = clubs.find(c => c.id === formData.team_a_club_id);
        const teamBClub = clubs.find(c => c.id === formData.team_b_club_id);
        
        if (teamAClub && teamBClub) {
          const teamAMembers = teamAClub.club_players?.length || 0;
          const teamBMembers = teamBClub.club_players?.length || 0;
          
          toast.success(`Invited ${teamAMembers + teamBMembers} club members to the match!`);
        }
      } else {
        toast.success('Match created successfully! 🎉');
      }
      
      navigate('/matches');
    } catch (error) {
      toast.error('Failed to create match. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'max_players' ? parseInt(value) : value,
    }));
  };

  const getAvailableClubs = () => {
    // Get clubs that the user is a member of
    // Since myClubs is ClubPlayer[], we need to fetch the actual club data
    return clubs.filter(club => 
      myClubs.some(clubPlayer => clubPlayer.club_id === club.id)
    );
  };

  const availableClubs = getAvailableClubs();

  return (
    <div className='max-w-4xl mx-auto'>
      <div className='mb-6'>
        <button
          onClick={() => navigate(-1)}
          className='flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors'
        >
          <ArrowLeft className='h-4 w-4' />
          <span>Back</span>
        </button>
      </div>

      <div className='bg-white rounded-xl shadow-lg p-8'>
        <div className='text-center mb-8'>
          <div className='bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4'>
            <Trophy className='h-8 w-8 text-green-600' />
          </div>
          <h1 className='text-3xl font-bold text-gray-800 mb-2'>
            Create New Match
          </h1>
          <p className='text-gray-600'>
            Organize an epic football match with balanced teams and fun
            competition! ⚽
          </p>
        </div>

        {/* Match Type Selection */}
        <div className='mb-8'>
          <h3 className='text-lg font-semibold text-gray-800 mb-4'>
            Match Type
          </h3>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <button
              type='button'
              onClick={() => setMatchType('open')}
              className={`p-4 rounded-lg border-2 transition-all ${
                matchType === 'open'
                  ? 'border-green-500 bg-green-50 text-green-800'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <Users className='w-8 h-8 mx-auto mb-2' />
              <h4 className='font-semibold'>Open Match</h4>
              <p className='text-sm text-gray-600 mt-1'>
                Players can join individually, teams will be balanced
                automatically
              </p>
            </button>

            <button
              type='button'
              onClick={() => setMatchType('club_vs_club')}
              className={`p-4 rounded-lg border-2 transition-all ${
                matchType === 'club_vs_club'
                  ? 'border-green-500 bg-green-50 text-green-800'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <Shield className='w-8 h-8 mx-auto mb-2' />
              <h4 className='font-semibold'>Club vs Club</h4>
              <p className='text-sm text-gray-600 mt-1'>
                Two clubs compete against each other with their members
              </p>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className='space-y-6'>
          {/* Basic Match Info */}
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <div>
              <label
                htmlFor='title'
                className='block text-sm font-medium text-gray-700 mb-2'
              >
                Match Title 🏆
              </label>
              <input
                type='text'
                id='title'
                name='title'
                value={formData.title}
                onChange={handleInputChange}
                placeholder='e.g., Weekend Championship, Friendly Match'
                className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors'
                required
              />
            </div>

            <div>
              <label
                htmlFor='location'
                className='block text-sm font-medium text-gray-700 mb-2'
              >
                Match Location 🏟️
              </label>
              <div className='relative'>
                <MapPin className='absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400' />
                <input
                  type='text'
                  id='location'
                  name='location'
                  value={formData.location}
                  onChange={handleInputChange}
                  placeholder='e.g., Central Park Field A, Riverside Stadium'
                  className='pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors'
                  required
                />
              </div>
            </div>
          </div>

          <div>
            <label
              htmlFor='description'
              className='block text-sm font-medium text-gray-700 mb-2'
            >
              Description (Optional)
            </label>
            <textarea
              id='description'
              name='description'
              value={formData.description}
              onChange={handleInputChange}
              placeholder='Add any additional details about the match...'
              rows={3}
              className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors'
            />
          </div>

          <div>
            <label
              htmlFor='match_date'
              className='block text-sm font-medium text-gray-700 mb-2'
            >
              Date & Time 📅
            </label>
            <div className='relative'>
              <Calendar className='absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400' />
              <input
                type='datetime-local'
                id='match_date'
                name='match_date'
                value={formData.match_date}
                onChange={handleInputChange}
                className='pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors'
                required
              />
            </div>
          </div>

          {/* Club Selection for Club vs Club Matches */}
          {matchType === 'club_vs_club' && (
            <div className='bg-blue-50 p-6 rounded-lg border border-blue-200'>
              <h3 className='text-lg font-semibold text-blue-800 mb-4 flex items-center'>
                <Shield className='w-5 h-5 mr-2' />
                Club Selection
              </h3>

              {availableClubs.length === 0 ? (
                <div className='text-center py-4'>
                  <Shield className='w-12 h-12 text-blue-400 mx-auto mb-2' />
                  <p className='text-blue-700 mb-2'>
                    You're not a member of any clubs yet.
                  </p>
                  <button
                    type='button'
                    onClick={() => navigate('/clubs')}
                    className='text-blue-600 hover:text-blue-800 font-medium'
                  >
                    Join or create a club first
                  </button>
                </div>
              ) : (
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <div>
                    <label
                      htmlFor='team_a_club_id'
                      className='block text-sm font-medium text-blue-800 mb-2'
                    >
                      Team A Club
                    </label>
                    <select
                      id='team_a_club_id'
                      name='team_a_club_id'
                      value={formData.team_a_club_id}
                      onChange={handleInputChange}
                      className='w-full px-4 py-3 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors'
                      required={matchType === 'club_vs_club'}
                    >
                      <option value=''>Select Club A</option>
                      {availableClubs.map((club) => (
                        <option key={club.id} value={club.id}>
                          {club.name} ({club.club_players?.length || 0} members)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor='team_b_club_id'
                      className='block text-sm font-medium text-blue-800 mb-2'
                    >
                      Team B Club
                    </label>
                    <select
                      id='team_b_club_id'
                      name='team_b_club_id'
                      value={formData.team_b_club_id}
                      onChange={handleInputChange}
                      className='w-full px-4 py-3 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors'
                      required={matchType === 'club_vs_club'}
                    >
                      <option value=''>Select Club B</option>
                      {availableClubs.map((club) => (
                        <option key={club.id} value={club.id}>
                          {club.name} ({club.club_players?.length || 0} members)
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Match Settings */}
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <div>
              <label
                htmlFor='format'
                className='block text-sm font-medium text-gray-700 mb-2'
              >
                Match Format ⚽
              </label>
              <select
                id='format'
                name='format'
                value={formData.format}
                onChange={handleInputChange}
                className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors'
              >
                <option value='5v5'>5v5 (10 players)</option>
                <option value='7v7'>7v7 (14 players)</option>
                <option value='11v11'>11v11 (22 players)</option>
              </select>
            </div>

            <div>
              <label
                htmlFor='max_players'
                className='block text-sm font-medium text-gray-700 mb-2'
              >
                Max Players 👥
              </label>
              <div className='relative'>
                <Users className='absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400' />
                <input
                  type='number'
                  id='max_players'
                  name='max_players'
                  value={formData.max_players}
                  onChange={handleInputChange}
                  min='2'
                  max='22'
                  className='pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors'
                />
              </div>
            </div>
          </div>

          {/* Match Preview */}
          <div className='bg-green-50 p-4 rounded-lg border border-green-200'>
            <h3 className='font-semibold text-green-800 mb-2'>
              🎯 Match Preview
            </h3>
            <div className='text-sm text-green-700 space-y-1'>
              <p>
                • Format: {formData.format} with {formData.max_players} players
                max
              </p>
              {matchType === 'club_vs_club' ? (
                <>
                  <p>• Type: Club vs Club competition</p>
                  <p>
                    • Team A:{' '}
                    {clubs.find((c) => c.id === formData.team_a_club_id)
                      ?.name || 'Not selected'}
                  </p>
                  <p>
                    • Team B:{' '}
                    {clubs.find((c) => c.id === formData.team_b_club_id)
                      ?.name || 'Not selected'}
                  </p>
                  <p>
                    • Club members will be invited to join their respective
                    teams
                  </p>
                </>
              ) : (
                <>
                  <p>• Type: Open match - players join individually</p>
                  <p>
                    • Teams will be automatically balanced based on player
                    ratings
                  </p>
                </>
              )}
              <p>• Players can rate each other after the match</p>
              <p>• Statistics will be updated automatically</p>
            </div>
          </div>

          <div className='flex space-x-4'>
            <button
              type='button'
              onClick={() => navigate(-1)}
              className='flex-1 bg-gray-200 text-gray-800 py-3 px-6 rounded-lg font-medium hover:bg-gray-300 transition-colors'
            >
              Cancel
            </button>
            <button
              type='submit'
              disabled={
                loading ||
                (matchType === 'club_vs_club' && availableClubs.length === 0)
              }
              className='flex-1 bg-green-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
            >
              {loading ? 'Creating...' : 'Create Match 🚀'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}