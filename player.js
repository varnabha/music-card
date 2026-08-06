(() => {
  const TRACKS = [
    {
      slug: "chaand-baaliyan",
      title: "Chaand Baaliyan",
      artist: "Aditya A",
      dedication: "For a pretty Moon",
      src: "audio/chaand-baaliyan.mp3",
    },
    {
      slug: "saiyaan",
      title: "Saiyaan",
      artist: "Kailash Kher",
      dedication: "",
      src: "audio/saiyaan.mp3",
    },
    {
      slug: "i-think-they-call-this-love",
      title: "I Think They Call This Love",
      artist: "Matthew Ifield",
      dedication: "You can say that I'm a fool",
      src: "audio/i-think-they-call-this-love.mp3",
    },
    {
      slug: "cant-help-falling-in-love",
      title: "Can't Help Falling in Love",
      artist: "Elvis Presley",
      dedication: "Only fools rush in",
      src: "audio/cant-help-falling-in-love.mp3",
    },
    {
      slug: "saudebaazi",
      title: "Saudebaazi",
      artist: "Javed Bashir",
      dedication: "",
      src: "audio/saudebaazi.mp3",
    },
    {
      slug: "kabhi-jo-badal-barse",
      title: "Kabhi Jo Badal Barse",
      artist: "Arijit Singh",
      dedication: "",
      src: "audio/kabhi-jo-badal-barse.mp3",
    },
  ];

  const audio = document.getElementById("audio");
  const playBtn = document.getElementById("playBtn");
  const prevBtn = document.getElementById("prevBtn");
  const nextBtn = document.getElementById("nextBtn");
  const progress = document.getElementById("progress");
  const progressFill = document.getElementById("progressFill");
  const progressKnob = document.getElementById("progressKnob");
  const timeCurrent = document.getElementById("timeCurrent");
  const timeDuration = document.getElementById("timeDuration");
  const audioNote = document.getElementById("audioNote");
  const artistLabel = document.getElementById("artistLabel");
  const titleEl = document.getElementById("songTitle");
  const dedicationLabel = document.getElementById("dedicationLabel");
  const liveCard = document.getElementById("liveCard");
  const artSlot = document.getElementById("artSlot");

  if (!audio || !playBtn || !progress || !progressFill || !liveCard || !artSlot) return;

  let seeking = false;
  let currentIndex = 0;
  let arts = {};
  let loadGen = 0;

  function audioUrl(src) {
    try {
      return new URL(src, window.location.href).href;
    } catch {
      return src;
    }
  }

  function pickIndexFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const slug = (params.get("song") || params.get("t") || "").trim().toLowerCase();
    const idx = TRACKS.findIndex((t) => t.slug === slug);
    return idx >= 0 ? idx : 0;
  }

  function formatTime(seconds) {
    if (!Number.isFinite(seconds)) return "0:00";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${String(s).padStart(2, "0")}`;
  }

  function hideAudioNote() {
    if (audioNote) audioNote.hidden = true;
  }

  function showAudioNote() {
    if (audioNote) audioNote.hidden = false;
  }

  function setPlaying(isPlaying) {
    playBtn.classList.toggle("is-playing", isPlaying);
    const title = TRACKS[currentIndex]?.title || "song";
    playBtn.setAttribute("aria-label", isPlaying ? `Pause ${title}` : `Play ${title}`);
  }

  function syncPlayingFromAudio() {
    setPlaying(!audio.paused && !audio.ended);
  }

  function updateProgress() {
    const cur = audio.currentTime || 0;
    const duration = audio.duration || 0;
    if (timeCurrent) timeCurrent.textContent = formatTime(cur);
    if (timeDuration) timeDuration.textContent = formatTime(duration);
    if (!seeking && duration > 0) {
      const pct = (cur / duration) * 100;
      progressFill.style.width = `${pct}%`;
      if (progressKnob) progressKnob.style.left = `${pct}%`;
      progress.setAttribute("aria-valuenow", String(Math.round(pct)));
    }
  }

  function syncChrome(track) {
    if (titleEl) titleEl.textContent = track.title;
    if (artistLabel) artistLabel.textContent = track.artist;
    if (dedicationLabel) {
      dedicationLabel.textContent = track.dedication || "";
      dedicationLabel.hidden = !track.dedication;
    }
    document.title = `${track.title} · chirkut`;
    liveCard.className = `sp-card live-card theme-${track.slug}`;
    const artHtml = arts[track.slug];
    if (artHtml) artSlot.innerHTML = artHtml;
    hideAudioNote();
  }

  function isIgnorablePlayError(err) {
    if (!err) return false;
    return err.name === "AbortError" || err.name === "NotAllowedError";
  }

  function loadTrack(index, { autoplay = false } = {}) {
    currentIndex = (index + TRACKS.length) % TRACKS.length;
    const track = TRACKS[currentIndex];
    const gen = ++loadGen;

    hideAudioNote();
    syncChrome(track);
    setPlaying(false);
    progressFill.style.width = "0%";
    if (progressKnob) progressKnob.style.left = "0%";
    updateProgress();

    audio.pause();
    audio.removeAttribute("src");
    audio.load();
    audio.src = audioUrl(track.src);
    audio.load();

    const url = new URL(window.location.href);
    url.searchParams.set("song", track.slug);
    history.replaceState(null, "", url);

    const onReady = () => {
      if (gen !== loadGen) return;
      hideAudioNote();
      updateProgress();
      if (autoplay) {
        audio.play().catch((err) => {
          if (gen !== loadGen) return;
          if (isIgnorablePlayError(err)) return;
          setPlaying(false);
          showAudioNote();
        });
      }
    };

    if (audio.readyState >= 2) {
      onReady();
    } else {
      audio.addEventListener("canplay", onReady, { once: true });
    }
  }

  async function togglePlay() {
    hideAudioNote();
    if (audio.paused) {
      try {
        await audio.play();
      } catch (err) {
        if (isIgnorablePlayError(err)) return;
        setPlaying(false);
        // Only show missing if the media really failed
        if (audio.error && audio.error.code !== 1) showAudioNote();
      }
    } else {
      audio.pause();
    }
  }

  function seekFromClientX(clientX) {
    const rect = progress.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    if (Number.isFinite(audio.duration) && audio.duration > 0) {
      audio.currentTime = ratio * audio.duration;
      progressFill.style.width = `${ratio * 100}%`;
      if (progressKnob) progressKnob.style.left = `${ratio * 100}%`;
    }
  }

  playBtn.addEventListener("click", togglePlay);
  prevBtn?.addEventListener("click", () => loadTrack(currentIndex - 1, { autoplay: true }));
  nextBtn?.addEventListener("click", () => loadTrack(currentIndex + 1, { autoplay: true }));

  audio.addEventListener("play", () => {
    hideAudioNote();
    syncPlayingFromAudio();
  });
  audio.addEventListener("pause", syncPlayingFromAudio);
  audio.addEventListener("playing", () => {
    hideAudioNote();
    syncPlayingFromAudio();
  });
  audio.addEventListener("timeupdate", updateProgress);
  audio.addEventListener("loadedmetadata", () => {
    hideAudioNote();
    updateProgress();
  });
  audio.addEventListener("ended", () => {
    setPlaying(false);
    loadTrack(currentIndex + 1, { autoplay: true });
  });
  audio.addEventListener("error", () => {
    // 1 = MEDIA_ERR_ABORTED (normal when switching tracks)
    if (!audio.error || audio.error.code === 1) return;
    setPlaying(false);
    showAudioNote();
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

  fetch("assets/covers/arts.json")
    .then((r) => r.json())
    .then((data) => {
      arts = data;
      loadTrack(pickIndexFromUrl());
    })
    .catch(() => {
      loadTrack(pickIndexFromUrl());
    });
})();
