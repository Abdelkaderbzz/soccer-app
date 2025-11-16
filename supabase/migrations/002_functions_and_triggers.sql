-- Function to automatically update player overall rating
CREATE OR REPLACE FUNCTION update_player_overall_rating()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE players 
    SET overall_rating = (
        SELECT AVG(rating)::decimal(3,2)
        FROM player_ratings 
        WHERE rated_player_id = NEW.rated_player_id
    ),
    updated_at = NOW()
    WHERE id = NEW.rated_player_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for rating updates
CREATE TRIGGER trigger_update_player_rating
    AFTER INSERT OR UPDATE ON player_ratings
    FOR EACH ROW
    EXECUTE FUNCTION update_player_overall_rating();

-- Function to balance teams using snake draft algorithm
CREATE OR REPLACE FUNCTION balance_teams(match_uuid UUID)
RETURNS TABLE(team_a UUID[], team_b UUID[]) AS $$
DECLARE
    players_list UUID[];
    total_players INTEGER;
    team_size INTEGER;
BEGIN
    -- Get all players for the match ordered by rating
    SELECT ARRAY_AGG(player_id ORDER BY overall_rating DESC)
    INTO players_list
    FROM match_players mp
    JOIN players p ON mp.player_id = p.id
    WHERE mp.match_id = match_uuid AND mp.is_present = true;
    
    total_players := array_length(players_list, 1);
    team_size := total_players / 2;
    
    -- Simple snake draft for balance
    RETURN QUERY
    SELECT 
        players_list[1:team_size] as team_a,
        players_list[team_size+1:total_players] as team_b;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate team balance score
CREATE OR REPLACE FUNCTION calculate_team_balance_score(team_a UUID[], team_b UUID[])
RETURNS NUMERIC AS $$
DECLARE
    team_a_rating NUMERIC;
    team_b_rating NUMERIC;
BEGIN
    SELECT AVG(overall_rating)
    INTO team_a_rating
    FROM players
    WHERE id = ANY(team_a);
    
    SELECT AVG(overall_rating)
    INTO team_b_rating
    FROM players
    WHERE id = ANY(team_b);
    
    RETURN ABS(team_a_rating - team_b_rating);
END;
$$ LANGUAGE plpgsql;

-- Function to update match statistics after result submission
CREATE OR REPLACE FUNCTION update_match_statistics()
RETURNS TRIGGER AS $$
DECLARE
    player_record RECORD;
    is_winner BOOLEAN;
    goals_scored INTEGER;
BEGIN
    -- Update match status to completed
    UPDATE matches 
    SET status = 'completed', updated_at = NOW()
    WHERE id = NEW.match_id;
    
    -- Update player statistics
    FOR player_record IN 
        SELECT mp.*, p.overall_rating
        FROM match_players mp
        JOIN players p ON mp.player_id = p.id
        WHERE mp.match_id = NEW.match_id
    LOOP
        -- Determine if player is on winning team
        is_winner := (player_record.team = 'A' AND NEW.team_a_score > NEW.team_b_score) OR 
                    (player_record.team = 'B' AND NEW.team_b_score > NEW.team_a_score);
        
        -- Get goals scored by this player
        SELECT COALESCE((goal_scorers ->> player_record.player_id)::INTEGER, 0)
        INTO goals_scored
        FROM match_results
        WHERE id = NEW.id;
        
        -- Update player stats
        UPDATE players
        SET 
            matches_played = matches_played + 1,
            wins = wins + CASE WHEN is_winner THEN 1 ELSE 0 END,
            goals_scored = goals_scored + goals_scored,
            updated_at = NOW()
        WHERE id = player_record.player_id;
    END LOOP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for match result updates
CREATE TRIGGER trigger_update_match_statistics
    AFTER INSERT ON match_results
    FOR EACH ROW
    EXECUTE FUNCTION update_match_statistics();

-- Function to get top performers for a match
CREATE OR REPLACE FUNCTION get_match_top_performers(match_uuid UUID)
RETURNS TABLE(
    player_id UUID,
    nickname VARCHAR,
    photo_url TEXT,
    avg_rating NUMERIC,
    goals_scored INTEGER,
    team VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.nickname,
        p.photo_url,
        AVG(pr.rating)::NUMERIC as avg_rating,
        mp.goals_scored,
        mp.team
    FROM match_players mp
    JOIN players p ON mp.player_id = p.id
    LEFT JOIN player_ratings pr ON pr.rated_player_id = p.id AND pr.match_id = match_uuid
    WHERE mp.match_id = match_uuid
    GROUP BY p.id, p.nickname, p.photo_url, mp.goals_scored, mp.team
    ORDER BY avg_rating DESC NULLS LAST, mp.goals_scored DESC
    LIMIT 3;
END;
$$ LANGUAGE plpgsql;