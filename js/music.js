const nowPlayingDiv = document.getElementById('now-playing');

const renderTrack = track => {
    if (!track) {
        nowPlayingDiv.textContent = 'No music entries found.';
        return;
    }

    nowPlayingDiv.innerHTML = `
    <div>
        <img src="${track.image}" alt="Album Art">
        <p>🎵 Now Playing: <strong>${track.title}</strong> by <em>${track.artist}</em></p>
    </div>
    `;
};

const loadTrackFromDatabase = async () => {
    try {
        const response = await fetch('data/music.db');
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const buffer = await response.arrayBuffer();
        const SQL = await initSqlJs({
            locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/${file}`,
        });
        const db = new SQL.Database(new Uint8Array(buffer));
        const result = db.exec('SELECT title, artist, image FROM tracks ORDER BY id DESC LIMIT 1;');

        if (!result.length || !result[0].values.length) {
            renderTrack(null);
            return;
        }

        const [title, artist, image] = result[0].values[0];
        renderTrack({ title, artist, image });
    } catch (err) {
        console.error('Failed to fetch track:', err);
        nowPlayingDiv.textContent = 'Unable to load music data.';
    }
};

loadTrackFromDatabase();
