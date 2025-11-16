-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (managed by Supabase Auth)
-- We don't need to create this manually as Supabase Auth handles it

-- Players table
CREATE TABLE IF NOT EXISTS players (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    nickname VARCHAR(50) UNIQUE NOT NULL,
    photo_url TEXT,
    overall_rating DECIMAL(3,2) DEFAULT 3.00 CHECK (overall_rating >= 1 AND overall_rating <= 5),
    matches_played INTEGER DEFAULT 0,
    wins INTEGER DEFAULT 0,
    goals_scored INTEGER DEFAULT 0,
    position_preference VARCHAR(20) DEFAULT 'any' CHECK (position_preference IN ('goalkeeper', 'defender', 'midfielder', 'forward', 'any')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Matches table
CREATE TABLE IF NOT EXISTS matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    location VARCHAR(255) NOT NULL,
    match_date TIMESTAMP WITH TIME ZONE NOT NULL,
    format VARCHAR(10) NOT NULL CHECK (format IN ('5v5', '7v7', '11v11')),
    max_players INTEGER NOT NULL CHECK (max_players > 0),
    status VARCHAR(20) DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'in_progress', 'completed', 'cancelled')),
    organizer_id UUID REFERENCES players(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Match players table
CREATE TABLE IF NOT EXISTS match_players (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
    player_id UUID REFERENCES players(id) ON DELETE CASCADE,
    team VARCHAR(1) CHECK (team IN ('A', 'B')),
    goals_scored INTEGER DEFAULT 0,
    is_present BOOLEAN DEFAULT true,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(match_id, player_id)
);

-- Player ratings table
CREATE TABLE IF NOT EXISTS player_ratings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rater_id UUID REFERENCES players(id) ON DELETE CASCADE,
    rated_player_id UUID REFERENCES players(id) ON DELETE CASCADE,
    match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
    rating DECIMAL(2,1) NOT NULL CHECK (rating >= 1 AND rating <= 5),
    category VARCHAR(20) NOT NULL CHECK (category IN ('skill', 'teamwork', 'sportsmanship')),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(rater_id, rated_player_id, match_id, category),
    CONSTRAINT no_self_rating CHECK (rater_id != rated_player_id)
);

-- Match results table
CREATE TABLE IF NOT EXISTS match_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
    team_a_score INTEGER NOT NULL CHECK (team_a_score >= 0),
    team_b_score INTEGER NOT NULL CHECK (team_b_score >= 0),
    duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0),
    goal_scorers JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(match_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_players_user_id ON players(user_id);
CREATE INDEX IF NOT EXISTS idx_players_nickname ON players(nickname);
CREATE INDEX IF NOT EXISTS idx_players_rating ON players(overall_rating DESC);
CREATE INDEX IF NOT EXISTS idx_matches_date ON matches(match_date);
CREATE INDEX IF NOT EXISTS idx_matches_status ON matches(status);
CREATE INDEX IF NOT EXISTS idx_matches_organizer ON matches(organizer_id);
CREATE INDEX IF NOT EXISTS idx_match_players_match ON match_players(match_id);
CREATE INDEX IF NOT EXISTS idx_match_players_player ON match_players(player_id);
CREATE INDEX IF NOT EXISTS idx_match_players_team ON match_players(match_id, team);
CREATE INDEX IF NOT EXISTS idx_ratings_rated_player ON player_ratings(rated_player_id);
CREATE INDEX IF NOT EXISTS idx_ratings_match ON player_ratings(match_id);
CREATE INDEX IF NOT EXISTS idx_ratings_category ON player_ratings(category);
CREATE INDEX IF NOT EXISTS idx_match_results_match ON match_results(match_id);

-- Enable Row Level Security (RLS)
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_results ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Players policies
CREATE POLICY "Players are publicly viewable" ON players FOR SELECT USING (true);
CREATE POLICY "Users can create own player profile" ON players FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own player profile" ON players FOR UPDATE USING (auth.uid() = user_id);

-- Matches policies
CREATE POLICY "Matches are publicly viewable" ON matches FOR SELECT USING (true);
CREATE POLICY "Organizers can create matches" ON matches FOR INSERT WITH CHECK ((SELECT id FROM players WHERE user_id = auth.uid()) IS NOT NULL);
CREATE POLICY "Organizers can update own matches" ON matches FOR UPDATE USING (organizer_id = (SELECT id FROM players WHERE user_id = auth.uid()));

-- Match players policies
CREATE POLICY "Match players are publicly viewable" ON match_players FOR SELECT USING (true);
CREATE POLICY "Players can join matches" ON match_players FOR INSERT WITH CHECK (player_id = (SELECT id FROM players WHERE user_id = auth.uid()));
CREATE POLICY "Organizers can update match players" ON match_players FOR UPDATE USING (EXISTS (SELECT 1 FROM matches WHERE matches.id = match_players.match_id AND matches.organizer_id = (SELECT id FROM players WHERE user_id = auth.uid())));

-- Player ratings policies
CREATE POLICY "Ratings are publicly viewable" ON player_ratings FOR SELECT USING (true);
CREATE POLICY "Players can create ratings" ON player_ratings FOR INSERT WITH CHECK (rater_id = (SELECT id FROM players WHERE user_id = auth.uid()));

-- Match results policies
CREATE POLICY "Match results are publicly viewable" ON match_results FOR SELECT USING (true);
CREATE POLICY "Organizers can create match results" ON match_results FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM matches WHERE matches.id = match_results.match_id AND matches.organizer_id = (SELECT id FROM players WHERE user_id = auth.uid())));

-- Grant permissions
GRANT SELECT ON players TO anon;
GRANT ALL ON players TO authenticated;
GRANT SELECT ON matches TO anon;
GRANT ALL ON matches TO authenticated;
GRANT SELECT ON match_players TO anon;
GRANT ALL ON match_players TO authenticated;
GRANT SELECT ON player_ratings TO anon;
GRANT ALL ON player_ratings TO authenticated;
GRANT SELECT ON match_results TO anon;
GRANT ALL ON match_results TO authenticated;