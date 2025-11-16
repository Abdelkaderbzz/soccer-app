-- Initial schema for football match management platform

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Players table
CREATE TABLE IF NOT EXISTS players (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    nickname TEXT NOT NULL,
    photo_url TEXT,
    overall_rating DECIMAL(3,2) DEFAULT 5.0 CHECK (overall_rating >= 1.0 AND overall_rating <= 5.0),
    matches_played INTEGER DEFAULT 0,
    wins INTEGER DEFAULT 0,
    goals_scored INTEGER DEFAULT 0,
    position_preference TEXT CHECK (position_preference IN ('goalkeeper', 'defender', 'midfielder', 'forward')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Matches table
CREATE TABLE IF NOT EXISTS matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    match_date TIMESTAMP WITH TIME ZONE NOT NULL,
    location TEXT,
    max_players INTEGER DEFAULT 10,
    status TEXT DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'in_progress', 'completed', 'cancelled')),
    team_a_id UUID,
    team_b_id UUID,
    team_a_score INTEGER DEFAULT 0,
    team_b_score INTEGER DEFAULT 0,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Teams table
CREATE TABLE IF NOT EXISTS teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
    total_rating DECIMAL(3,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Match players (join table for players participating in matches)
CREATE TABLE IF NOT EXISTS match_players (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
    player_id UUID REFERENCES players(id) ON DELETE CASCADE,
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    position TEXT CHECK (position IN ('goalkeeper', 'defender', 'midfielder', 'forward')),
    rating DECIMAL(3,2) DEFAULT 5.0 CHECK (rating >= 1.0 AND rating <= 5.0),
    goals_scored INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(match_id, player_id)
);

-- Player ratings (for rating players after matches)
CREATE TABLE IF NOT EXISTS player_ratings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
    rated_player_id UUID REFERENCES players(id) ON DELETE CASCADE,
    rater_player_id UUID REFERENCES players(id) ON DELETE CASCADE,
    rating DECIMAL(3,2) NOT NULL CHECK (rating >= 1.0 AND rating <= 5.0),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(match_id, rated_player_id, rater_player_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_players_user_id ON players(user_id);
CREATE INDEX IF NOT EXISTS idx_matches_created_by ON matches(created_by);
CREATE INDEX IF NOT EXISTS idx_matches_status ON matches(status);
CREATE INDEX IF NOT EXISTS idx_match_players_match_id ON match_players(match_id);
CREATE INDEX IF NOT EXISTS idx_match_players_player_id ON match_players(player_id);
CREATE INDEX IF NOT EXISTS idx_player_ratings_match_id ON player_ratings(match_id);
CREATE INDEX IF NOT EXISTS idx_player_ratings_rated_player_id ON player_ratings(rated_player_id);

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_ratings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users policies
CREATE POLICY "Users can view all users" ON users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);

-- Players policies
CREATE POLICY "Anyone can view players" ON players FOR SELECT USING (true);
CREATE POLICY "Users can create own player profile" ON players FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own player profile" ON players FOR UPDATE USING (auth.uid() = user_id);

-- Matches policies
CREATE POLICY "Anyone can view matches" ON matches FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create matches" ON matches FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update own matches" ON matches FOR UPDATE USING (auth.uid() = created_by);

-- Teams policies
CREATE POLICY "Anyone can view teams" ON teams FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create teams" ON teams FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Match players policies
CREATE POLICY "Anyone can view match players" ON match_players FOR SELECT USING (true);
CREATE POLICY "Authenticated users can join matches" ON match_players FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update own match participation" ON match_players FOR UPDATE USING (auth.uid() IN (SELECT user_id FROM players WHERE id = player_id));

-- Player ratings policies
CREATE POLICY "Anyone can view ratings" ON player_ratings FOR SELECT USING (true);
CREATE POLICY "Authenticated users can rate players" ON player_ratings FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update own ratings" ON player_ratings FOR UPDATE USING (auth.uid() IN (SELECT user_id FROM players WHERE id = rater_player_id));

-- Grant permissions to anon and authenticated roles
GRANT SELECT ON users TO anon, authenticated;
GRANT INSERT ON users TO authenticated;
GRANT UPDATE ON users TO authenticated;

GRANT SELECT ON players TO anon, authenticated;
GRANT INSERT ON players TO authenticated;
GRANT UPDATE ON players TO authenticated;

GRANT SELECT ON matches TO anon, authenticated;
GRANT INSERT ON matches TO authenticated;
GRANT UPDATE ON matches TO authenticated;

GRANT SELECT ON teams TO anon, authenticated;
GRANT INSERT ON teams TO authenticated;

GRANT SELECT ON match_players TO anon, authenticated;
GRANT INSERT ON match_players TO authenticated;
GRANT UPDATE ON match_players TO authenticated;

GRANT SELECT ON player_ratings TO anon, authenticated;
GRANT INSERT ON player_ratings TO authenticated;
GRANT UPDATE ON player_ratings TO authenticated;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_players_updated_at BEFORE UPDATE ON players
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_matches_updated_at BEFORE UPDATE ON matches
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();