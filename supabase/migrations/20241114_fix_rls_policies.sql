-- Fix RLS policies for custom authentication system
-- Since we're using service role key, we'll bypass RLS and handle authorization in the API layer

-- Grant all permissions to service role for all tables
GRANT ALL ON users TO service_role;
GRANT ALL ON players TO service_role;
GRANT ALL ON matches TO service_role;
GRANT ALL ON teams TO service_role;
GRANT ALL ON match_players TO service_role;
GRANT ALL ON player_ratings TO service_role;

-- Disable RLS for now since we're handling authorization in the API layer
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE players DISABLE ROW LEVEL SECURITY;
ALTER TABLE matches DISABLE ROW LEVEL SECURITY;
ALTER TABLE teams DISABLE ROW LEVEL SECURITY;
ALTER TABLE match_players DISABLE ROW LEVEL SECURITY;
ALTER TABLE player_ratings DISABLE ROW LEVEL SECURITY;