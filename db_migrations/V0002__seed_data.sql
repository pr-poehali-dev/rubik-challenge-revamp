
INSERT INTO users (username, email, password_hash, is_admin, balance)
VALUES ('admin', 'admin@wasteland.shop', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', TRUE, 99999);

INSERT INTO cases (name, price, img_url) VALUES
  ('СТАНДАРТНЫЙ', 50,  'https://cdn.poehali.dev/projects/f4df7e9e-38ca-4c43-9a9a-658478926a3f/files/2e9d7b55-d51c-42cd-abf0-46b5efe32777.jpg'),
  ('БОЕВОЙ',      150, 'https://cdn.poehali.dev/projects/f4df7e9e-38ca-4c43-9a9a-658478926a3f/files/77e96c0d-9a4a-4f00-a7b7-808d2e684032.jpg'),
  ('ПРАЗДНИЧНЫЙ', 300, 'https://cdn.poehali.dev/projects/f4df7e9e-38ca-4c43-9a9a-658478926a3f/files/c2faedf2-bd62-4038-9238-36fd605fb916.jpg');

INSERT INTO prizes (case_id, name, emoji, rarity, weight) VALUES
  (1, 'Патроны x50',    '🔫', 'common',    50),
  (1, 'Медикаменты',    '💊', 'common',    30),
  (1, 'Патроны x200',   '🔫', 'rare',      15),
  (1, 'Рюкзак',         '🎒', 'epic',       4),
  (1, 'Ковбой',         '🤠', 'legendary',  1),
  (2, 'Патроны x200',   '🔫', 'common',    40),
  (2, 'Медикаменты x3', '💊', 'common',    25),
  (2, 'Рюкзак',         '🎒', 'rare',      20),
  (2, 'Самурай',        '⚔️', 'epic',      10),
  (2, 'Ковбой NY',      '🎅', 'legendary',  5),
  (3, 'Медикаменты x5', '💊', 'common',    30),
  (3, 'Рюкзак',         '🎒', 'rare',      30),
  (3, 'Санта',          '🎅', 'epic',      25),
  (3, 'Ковбой NY',      '🤠', 'legendary', 10),
  (3, 'Боевой пасс',    '⭐', 'legendary',  5);
