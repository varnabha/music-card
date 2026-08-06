(() => {
  const TRACKS = [
    {
      slug: "chaand-baaliyan",
      title: "Chaand Baaliyan",
      artist: "Aditya A",
      src: "audio/chaand-baaliyan.mp3",
      card: "card.html",
    },
    {
      slug: "saiyaan",
      title: "Saiyaan",
      artist: "Kailash Kher",
      src: "audio/saiyaan.mp3",
      card: "saiyaan.html",
    },
    {
      slug: "i-think-they-call-this-love",
      title: "I Think They Call This Love",
      artist: "Matthew Ifield",
      src: "audio/i-think-they-call-this-love.mp3",
      card: "i-think-they-call-this-love.html",
    },
    {
      slug: "cant-help-falling-in-love",
      title: "Can't Help Falling in Love",
      artist: "Elvis Presley",
      src: "audio/cant-help-falling-in-love.mp3",
      card: "cant-help-falling-in-love.html",
    },
    {
      slug: "saudebaazi",
      title: "Saudebaazi",
      artist: "Javed Bashir",
      src: "audio/saudebaazi.mp3",
      card: "saudebaazi.html",
    },
    {
      slug: "kabhi-jo-badal-barse",
      title: "Kabhi Jo Badal Barse",
      artist: "Arijit Singh",
      src: "audio/kabhi-jo-badal-barse.mp3",
      card: "kabhi-jo-badal-barse.html",
    },
  ];

  const audio = document.getElementById("audio");
  const playBtn = document.getElementById("playBtn");
  const progress = document.getElementById("progress");
  const progressFill = document.getElementById("progressFill");
  const timeLabel = document.getElementById("timeLabel");
  const audioNote = document.getElementById("audioNote");
  const trackLabel = document.getElementById("trackLabel");
  const artistLabel = document.getElementById("artistLabel");
  const titleEl = document.getElementById("songTitle");
  const trackList = document.getElementById("trackList");
  const cardLink = document.getElementById("cardLink");

  if (!audio || !playBtn || !progress || !progressFill || !timeLabel) return;

  let seeking = false;
  let current = TRACKS[0];

  function pickTrackFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const slug = (params.get("song") || params.get("t") || "").trim().toLowerCase();
    if (!slug) return TRACKS[0];
    return TRACKS.find((t) => t.slug === slug) || TRACKS[0];
  }

  function formatTime(seconds) {
    if (!Number.isFinite(seconds)) return "0:00";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${String(s).padStart(2, "0")}`;
  }

  function updateTime() {
    const cur = audio.currentTime || 0;
    const duration = audio.duration || 0;
    timeLabel.textContent = `${formatTime(cur)} / ${formatTime(duration)}`;
    if (!seeking && duration > 0) {
      const pct = (cur / duration) * 100;
      progressFill.style.width = `${pct}%`;
      progress.setAttribute("aria-valuenow", String(Math.round(pct)));
    }
  }

  function setPlaying(isPlaying) {
    playBtn.classList.toggle("is-playing", isPlaying);
    playBtn.setAttribute(
      "aria-label",
      isPlaying ? `Pause ${current.title}` : `Play ${current.title}`
    );
  }

  function syncChrome() {
    if (trackLabel) trackLabel.textContent = current.title;
    if (artistLabel) artistLabel.textContent = current.artist;
    if (titleEl) titleEl.textContent = current.title;
    if (cardLink) {
      cardLink.href = current.card;
      cardLink.textContent = "Print the music card";
    }
    document.title = `${current.title} · chirkut`;
    if (audioNote) audioNote.hidden = true;
    if (trackList) {
      trackList.querySelectorAll("[data-slug]").forEach((btn) => {
        btn.classList.toggle("is-active", btn.dataset.slug === current.slug);
      });
    }
  }

  function loadTrack(track, { autoplay = false } = {}) {
    current = track;
    syncChrome();
    audio.src = track.src;
    audio.load();
    const url = new URL(window.location.href);
    url.searchParams.set("song", track.slug);
    history.replaceState(null, "", url);
    setPlaying(false);
    progressFill.style.width = "0%";
    updateTime();
    if (autoplay) {
      audio.play().then(() => setPlaying(true)).catch(() => {
        setPlaying(false);
        if (audioNote) audioNote.hidden = false;
      });
    }
  }

  async function togglePlay() {
    if (audio.paused) {
      try {
        await audio.play();
        setPlaying(true);
      } catch {
        setPlaying(false);
        if (audioNote) audioNote.hidden = false;
        if (trackLabel) trackLabel.textContent = "Add the song file to play";
      }
    } else {
      audio.pause();
      setPlaying(false);
    }
  }

  function seekFromClientX(clientX) {
    const rect = progress.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    if (Number.isFinite(audio.duration) && audio.duration > 0) {
      audio.currentTime = ratio * audio.duration;
      progressFill.style.width = `${ratio * 100}%`;
    }
  }

  if (trackList) {
    TRACKS.forEach((track) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "track-chip";
      btn.dataset.slug = track.slug;
      btn.textContent = track.title;
      btn.addEventListener("click", () => loadTrack(track, { autoplay: true }));
      trackList.appendChild(btn);
    });
  }

  playBtn.addEventListener("click", togglePlay);

  audio.addEventListener("timeupdate", updateTime);
  audio.addEventListener("loadedmetadata", updateTime);
  audio.addEventListener("ended", () => {
    setPlaying(false);
    progressFill.style.width = "0%";
    updateTime();
  });

  audio.addEventListener("error", () => {
    if (audioNote) audioNote.hidden = false;
    if (trackLabel) trackLabel.textContent = "Song file missing";
  });

  progress.addEventListener("pointerdown", (event) => {
    seeking = true;
    progress.setPointerCapture(event.pointerId);
    seekFromClientX(event.clientX);
  });

  progress.addEventListener("pointermove", (event) => {
    if (!seeking) return;
    seekFromClientX(event.clientX);
  });

  progress.addEventListener("pointerup", (event) => {
    seeking = false;
    seekFromClientX(event.clientX);
  });

  progress.addEventListener("keydown", (event) => {
    if (!Number.isFinite(audio.duration) || audio.duration <= 0) return;
    const step = audio.duration * 0.05;
    if (event.key === "ArrowRight") {
      audio.currentTime = Math.min(audio.duration, audio.currentTime + step);
    } else if (event.key === "ArrowLeft") {
      audio.currentTime = Math.max(0, audio.currentTime - step);
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.code === "Space" && event.target === document.body) {
      event.preventDefault();
      togglePlay();
    }
  });

  loadTrack(pickTrackFromUrl());
})();
