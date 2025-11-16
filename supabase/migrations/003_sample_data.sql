-- Insert sample data for testing

-- Sample players
INSERT INTO players (user_id, nickname, photo_url, overall_rating, matches_played, wins, goals_scored, position_preference) VALUES 
('00000000-0000-0000-0000-000000000001', 'Lionel Messi', 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=football+player+cartoon+avatar+with+goat+horns+funny+playful&image_size=square', 4.8, 25, 20, 45, 'forward'),
('00000000-0000-0000-0000-000000000002', 'Cristiano Ronaldo', 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=football+player+cartoon+avatar+with+sunglasses+confident+funny&image_size=square', 4.7, 23, 18, 42, 'forward'),
('00000000-0000-0000-0000-000000000003', 'Neymar Jr', 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=football+player+cartoon+avatar+with+colorful+hair+playful+funny&image_size=square', 4.5, 20, 15, 35, 'forward'),
('00000000-0000-0000-0000-000000000004', 'Kevin De Bruyne', 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=football+player+cartoon+avatar+with+red+hair+serious+funny&image_size=square', 4.6, 22, 16, 25, 'midfielder'),
('00000000-0000-0000-0000-000000000005', 'Virgil van Dijk', 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=football+player+cartoon+avatar+with+dreadlocks+tall+defender+funny&image_size=square', 4.4, 18, 12, 8, 'defender'),
('00000000-0000-0000-0000-000000000006', 'Manuel Neuer', 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=football+goalkeeper+cartoon+avatar+with+gloves+serious+funny&image_size=square', 4.3, 15, 10, 0, 'goalkeeper'),
('00000000-0000-0000-0000-000000000007', 'Kylian Mbappé', 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=football+player+cartoon+avatar+young+fast+playful+funny&image_size=square', 4.2, 12, 8, 28, 'forward'),
('00000000-0000-0000-0000-000000000008', 'Robert Lewandowski', 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=football+player+cartoon+avatar+with+bayern+poland+goalscorer+funny&image_size=square', 4.1, 10, 6, 22, 'forward');

-- Sample matches
INSERT INTO matches (location, match_date, format, max_players, status, organizer_id) VALUES 
('Central Park Field A', NOW() + INTERVAL '2 days', '5v5', 10, 'upcoming', 
 (SELECT id FROM players WHERE nickname = 'Lionel Messi')),
('Riverside Stadium', NOW() + INTERVAL '5 days', '7v7', 14, 'upcoming', 
 (SELECT id FROM players WHERE nickname = 'Cristiano Ronaldo')),
('Community Sports Center', NOW() - INTERVAL '3 days', '5v5', 10, 'completed', 
 (SELECT id FROM players WHERE nickname = 'Neymar Jr')),
('Downtown Arena', NOW() - INTERVAL '1 week', '11v11', 22, 'completed', 
 (SELECT id FROM players WHERE nickname = 'Kevin De Bruyne'));

-- Sample match players for upcoming match
INSERT INTO match_players (match_id, player_id, team, goals_scored, is_present) VALUES 
((SELECT id FROM matches WHERE location = 'Central Park Field A' ORDER BY created_at DESC LIMIT 1),
 (SELECT id FROM players WHERE nickname = 'Lionel Messi'), 'A', 0, true),
((SELECT id FROM matches WHERE location = 'Central Park Field A' ORDER BY created_at DESC LIMIT 1),
 (SELECT id FROM players WHERE nickname = 'Neymar Jr'), 'A', 0, true),
((SELECT id FROM matches WHERE location = 'Central Park Field A' ORDER BY created_at DESC LIMIT 1),
 (SELECT id FROM players WHERE nickname = 'Kevin De Bruyne'), 'A', 0, true),
((SELECT id FROM matches WHERE location = 'Central Park Field A' ORDER BY created_at DESC LIMIT 1),
 (SELECT id FROM players WHERE nickname = 'Virgil van Dijk'), 'A', 0, true),
((SELECT id FROM matches WHERE location = 'Central Park Field A' ORDER BY created_at DESC LIMIT 1),
 (SELECT id FROM players WHERE nickname = 'Cristiano Ronaldo'), 'B', 0, true),
((SELECT id FROM matches WHERE location = 'Central Park Field A' ORDER BY created_at DESC LIMIT 1),
 (SELECT id FROM players WHERE nickname = 'Kylian Mbappé'), 'B', 0, true),
((SELECT id FROM matches WHERE location = 'Central Park Field A' ORDER BY created_at DESC LIMIT 1),
 (SELECT id FROM players WHERE nickname = 'Robert Lewandowski'), 'B', 0, true),
((SELECT id FROM matches WHERE location = 'Central Park Field A' ORDER BY created_at DESC LIMIT 1),
 (SELECT id FROM players WHERE nickname = 'Manuel Neuer'), 'B', 0, true);

-- Sample completed match with results
INSERT INTO match_results (match_id, team_a_score, team_b_score, duration_minutes, goal_scorers) VALUES 
((SELECT id FROM matches WHERE location = 'Community Sports Center' ORDER BY created_at DESC LIMIT 1),
 5, 3, 90, '[{"player_id": "(SELECT id FROM players WHERE nickname = \'Lionel Messi\')", "goals": 2}, {"player_id": "(SELECT id FROM players WHERE nickname = \'Neymar Jr\')", "goals": 1}, {"player_id": "(SELECT id FROM players WHERE nickname = \'Kevin De Bruyne\')", "goals": 1}]');

-- Sample player ratings
INSERT INTO player_ratings (rater_id, rated_player_id, match_id, rating, category, comment) VALUES 
((SELECT id FROM players WHERE nickname = 'Cristiano Ronaldo'),
 (SELECT id FROM players WHERE nickname = 'Lionel Messi'),
 (SELECT id FROM matches WHERE location = 'Community Sports Center' ORDER BY created_at DESC LIMIT 1),
 5.0, 'skill', 'Incredible performance, unstoppable!'),
((SELECT id FROM players WHERE nickname = 'Kylian Mbappé'),
 (SELECT id FROM players WHERE nickname = 'Lionel Messi'),
 (SELECT id FROM matches WHERE location = 'Community Sports Center' ORDER BY created_at DESC LIMIT 1),
 4.5, 'teamwork', 'Great assists and team play'),
((SELECT id FROM players WHERE nickname = 'Manuel Neuer'),
 (SELECT id FROM players WHERE nickname = 'Neymar Jr'),
 (SELECT id FROM matches WHERE location = 'Community Sports Center' ORDER BY created_at DESC LIMIT 1),
 4.0, 'sportsmanship', 'Fair play and good spirit');