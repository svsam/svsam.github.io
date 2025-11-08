
const username = 'SvSams';
const apiKey = '47a13e14f60cf4155a0deaab5e2b1eb7';
const nowPlayingDiv = document.getElementById('now-playing');

fetch(`https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=${username}&api_key=${apiKey}&format=json&limit=1`)
.then(res => res.json())
.then(data => {
    const track = data.recenttracks.track[0];
    const artist = track.artist['#text'];
    const title = track.name;
    const albumArt = track.image[2]['#text']; // Medium size

    nowPlayingDiv.innerHTML = `
    <div>
        <img src="${albumArt}" alt="Album Art">
        <p>🎵 Now Playing: <strong>${title}</strong> by <em>${artist}</em></p>
    </div>
    `;
})
.catch(err => console.error('Failed to fetch track:', err));