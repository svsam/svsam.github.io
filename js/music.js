async function loadNowPlaying() {
  try {
    const response = await fetch("api/lastfm.php");
    const data = await response.json();
    const nowPlayingDiv = document.getElementById("now-playing");

    if (data.recenttracks && data.recenttracks.track && data.recenttracks.track.length > 0) {
      const track = data.recenttracks.track[0];
      const artist = track.artist["#text"];
      const name = track.name;
      const albumArt = track.image?.[2]?.["#text"] || "";

      nowPlayingDiv.innerHTML = `
        <p><b>${name}</b> by ${artist}</p>
        ${albumArt ? `<img src="${albumArt}" alt="Album Art" width="100">` : ""}
      `;
    } else {
      nowPlayingDiv.textContent = "No recent track found.";
    }
  } catch (err) {
    console.error("Error fetching music:", err);
  }
}

loadNowPlaying();
