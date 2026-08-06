(() => {
  const qrUrl = document.getElementById("qrUrl");
  const qrBox = document.getElementById("qrBox");
  const regenQr = document.getElementById("regenQr");
  const printBtn = document.getElementById("printBtn");

  if (!qrUrl || !qrBox || typeof QRCode === "undefined") return;

  const storageKey = "chaand-baaliyan-qr-url";

  function defaultUrl() {
    const base = `${window.location.origin}${window.location.pathname.replace(
      /card\.html$/,
      "index.html"
    )}`;
    return `${base}?song=chaand-baaliyan`;
  }

  function renderQr(url) {
    qrBox.innerHTML = "";
    new QRCode(qrBox, {
      text: url,
      width: 156,
      height: 156,
      colorDark: "#0c1220",
      colorLight: "#f7f1e4",
      correctLevel: QRCode.CorrectLevel.M,
    });
  }

  const saved = localStorage.getItem(storageKey);
  qrUrl.value = saved || defaultUrl();
  renderQr(qrUrl.value);

  function saveAndRender() {
    const value = qrUrl.value.trim() || defaultUrl();
    qrUrl.value = value;
    localStorage.setItem(storageKey, value);
    renderQr(value);
  }

  regenQr?.addEventListener("click", saveAndRender);
  qrUrl.addEventListener("change", saveAndRender);
  printBtn?.addEventListener("click", () => {
    saveAndRender();
    window.print();
  });
})();
