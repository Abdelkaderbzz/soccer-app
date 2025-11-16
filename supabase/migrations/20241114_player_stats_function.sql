-- Create function to increment player statistics
CREATE OR REPLACE FUNCTION increment_player_stats(
  player_id UUID,
  is_winner BOOLEAN,
  goals_scored INTEGER DEFAULT 0
) RETURNS VOID AS $$
BEGIN
  -- Update player statistics
  UPDATE players SET
    matches_played = matches_played + 1,
    wins = wins + CASE WHEN is_winner THEN 1 ELSE 0 END,
    goals_scored = goals_scored + goals_scored
  WHERE user_id = player_id;
  
  -- Update player rating based on performance (simple algorithm)
  UPDATE players SET
    overall_rating = CASE 
      WHEN is_winner AND goals_scored > 0 THEN overall_rating + 0.1
      WHEN is_winner THEN overall_rating + 0.05
      WHEN NOT is_winner AND goals_scored > 0 THEN overall_rating + 0.02
      ELSE overall_rating - 0.02
    END
  WHERE user_id = player_id;
  
  -- Ensure rating stays within bounds (1.0 to 10.0)
  UPDATE players SET
    overall_rating = CASE 
      WHEN overall_rating > 10.0 THEN 10.0
      WHEN overall_rating < 1.0 THEN 1.0
      ELSE overall_rating
    END
  WHERE user_id = player_id;
END;
$$ LANGUAGE plpgsql;