-- Clubs management system
-- Add admin role to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'player' CHECK (role IN ('player', 'admin'));

-- Clubs table
CREATE TABLE IF NOT EXISTS clubs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    logo_url TEXT,
    created_by UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Club players (many-to-many relationship)
CREATE TABLE IF NOT EXISTS club_players (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    club_id UUID REFERENCES clubs(id) ON DELETE CASCADE,
    player_id UUID REFERENCES players(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'member' CHECK (role IN ('member', 'captain', 'vice_captain')),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(club_id, player_id)
);

-- Club invitations
CREATE TABLE IF NOT EXISTS club_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    club_id UUID REFERENCES clubs(id) ON DELETE CASCADE,
    player_id UUID REFERENCES players(id) ON DELETE CASCADE,
    invited_by UUID REFERENCES users(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(club_id, player_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_clubs_created_by ON clubs(created_by);
CREATE INDEX IF NOT EXISTS idx_club_players_club_id ON club_players(club_id);
CREATE INDEX IF NOT EXISTS idx_club_players_player_id ON club_players(player_id);
CREATE INDEX IF NOT EXISTS idx_club_invitations_club_id ON club_invitations(club_id);
CREATE INDEX IF NOT EXISTS idx_club_invitations_player_id ON club_invitations(player_id);

-- Grant permissions
GRANT ALL ON clubs TO service_role;
GRANT ALL ON club_players TO service_role;
GRANT ALL ON club_invitations TO service_role;