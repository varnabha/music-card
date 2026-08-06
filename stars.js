(() => {
  const canvas = document.getElementById("stars");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  const stars = [];
  let width = 0;
  let height = 0;
  let raf = 0;

  function resize() {
    width = canvas.width = window.innerWidth * devicePixelRatio;
    height = canvas.height = window.innerHeight * devicePixelRatio;
    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;
    seed();
  }

  function seed() {
    stars.length = 0;
    const count = Math.floor((window.innerWidth * window.innerHeight) / 9000);
    for (let i = 0; i < count; i += 1) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        r: (Math.random() * 1.4 + 0.3) * devicePixelRatio,
        a: Math.random() * 0.7 + 0.2,
        s: Math.random() * 0.02 + 0.005,
        p: Math.random() * Math.PI * 2,
      });
    }
  }

  function draw(t) {
    ctx.clearRect(0, 0, width, height);
    for (const star of stars) {
      const twinkle = 0.55 + Math.sin(t * star.s + star.p) * 0.45;
      ctx.beginPath();
      ctx.fillStyle = `rgba(242, 230, 196, ${star.a * twinkle})`;
      ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
      ctx.fill();
    }
    raf = requestAnimationFrame(draw);
  }

  window.addEventListener("resize", resize);
  resize();
  raf = requestAnimationFrame(draw);

  window.addEventListener("beforeunload", () => cancelAnimationFrame(raf));
})();
