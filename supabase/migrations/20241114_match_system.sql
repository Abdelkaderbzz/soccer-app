-- Create matches table
CREATE TABLE IF NOT EXISTS matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    location TEXT NOT NULL,
    match_date TIMESTAMP WITH TIME ZONE NOT NULL,
    format TEXT NOT NULL CHECK (format IN ('5v5', '7v7', '11v11')),
    max_players INTEGER NOT NULL CHECK (max_players >= 2 AND max_players <= 22),
    status TEXT DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'in_progress', 'completed', 'cancelled')),
    organizer_id UUID REFERENCES users(id) ON DELETE CASCADE,
    team_a_club_id UUID REFERENCES clubs(id) ON DELETE SET NULL,
    team_b_club_id UUID REFERENCES clubs(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create match_players table
CREATE TABLE IF NOT EXISTS match_players (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
    player_id UUID REFERENCES users(id) ON DELETE CASCADE,
    team TEXT CHECK (team IN ('A', 'B')),
    goals_scored INTEGER DEFAULT 0,
    is_present BOOLEAN DEFAULT true,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(match_id, player_id)
);

-- Create match_results table
CREATE TABLE IF NOT EXISTS match_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
    team_a_score INTEGER NOT NULL DEFAULT 0,
    team_b_score INTEGER NOT NULL DEFAULT 0,
    duration_minutes INTEGER,
    goal_scorers JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create player_ratings table
CREATE TABLE IF NOT EXISTS player_ratings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rater_id UUID REFERENCES users(id) ON DELETE CASCADE,
    rated_player_id UUID REFERENCES users(id) ON DELETE CASCADE,
    match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 10),
    category TEXT DEFAULT 'overall' CHECK (category IN ('overall', 'skill', 'teamwork', 'sportsmanship')),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(rater_id, rated_player_id, match_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_matches_organizer_id ON matches(organizer_id);
CREATE INDEX IF NOT EXISTS idx_matches_status ON matches(status);
CREATE INDEX IF NOT EXISTS idx_matches_match_date ON matches(match_date);
CREATE INDEX IF NOT EXISTS idx_matches_team_a_club_id ON matches(team_a_club_id);
CREATE INDEX IF NOT EXISTS idx_matches_team_b_club_id ON matches(team_b_club_id);

CREATE INDEX IF NOT EXISTS idx_match_players_match_id ON match_players(match_id);
CREATE INDEX IF NOT EXISTS idx_match_players_player_id ON match_players(player_id);
CREATE INDEX IF NOT EXISTS idx_match_players_team ON match_players(team);

CREATE INDEX IF NOT EXISTS idx_match_results_match_id ON match_results(match_id);

CREATE INDEX IF NOT EXISTS idx_player_ratings_rater_id ON player_ratings(rater_id);
CREATE INDEX IF NOT EXISTS idx_player_ratings_rated_player_id ON player_ratings(rated_player_id);
CREATE INDEX IF NOT EXISTS idx_player_ratings_match_id ON player_ratings(match_id);
CREATE INDEX IF NOT EXISTS idx_player_ratings_created_at ON player_ratings(created_at);

-- Grant permissions
GRANT ALL PRIVILEGES ON matches TO authenticated;
GRANT ALL PRIVILEGES ON match_players TO authenticated;
GRANT ALL PRIVILEGES ON match_results TO authenticated;
GRANT ALL PRIVILEGES ON player_ratings TO authenticated;

GRANT SELECT ON matches TO anon;
GRANT SELECT ON match_players TO anon;
GRANT SELECT ON match_results TO anon;
GRANT SELECT ON player_ratings TO anon;