DROP TABLE IF EXISTS tracks;
CREATE TABLE tracks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  artist TEXT NOT NULL,
  image TEXT NOT NULL
);

INSERT INTO tracks (title, artist, image)
VALUES (
  'Shelter',
  'Porter Robinson & Madeon',
  'https://upload.wikimedia.org/wikipedia/en/6/6b/Shelter_%28Porter_Robinson_and_Madeon_song%29.jpg'
);
