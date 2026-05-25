const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbzOy3GzEra_cO88DLC9bbqwwgUKXjJFZuIPI9rMXwWl1Q63zNaZmt4v3fR2vEppHX7BYg/exec";

const DATA_SOURCE = getQueryParam("source") === "sheet" ? "sheet" : "grist";
const IS_GRIST_MODE = DATA_SOURCE === "grist";

const statusElement = document.getElementById("status");
const rawJson = document.getElementById("rawJson");
const qrGrid = document.getElementById("qrGrid");
const reloadButton = document.getElementById("reloadButton");
const printButton = document.getElementById("printButton");
const pageTitle = document.getElementById("pageTitle");

reloadButton.addEventListener("click", loadQrCodes);
printButton.addEventListener("click", () => window.print());

initSourceMode();
loadQrCodes();


function initSourceMode() {
  const subtitle = document.querySelector(".subtitle");
  if (subtitle) {
    subtitle.textContent = IS_GRIST_MODE
      ? "Atelier Stock Manager - QR codes / Grist officiel"
      : "Atelier Stock Manager - QR codes / Google Sheet secours";
  }

  const firstCard = document.querySelector("section.card");
  if (firstCard) {
    const modeBar = document.createElement("div");
    modeBar.className = IS_GRIST_MODE ? "source-banner source-grist" : "source-banner source-sheet";
    modeBar.innerHTML = IS_GRIST_MODE
      ? "Mode actif : <strong>Grist officiel</strong>. Les QR codes générés pointent vers les fiches Grist par défaut."
      : "Mode secours : <strong>Google Sheet</strong>. QR codes de repli temporaire.";
    firstCard.insertBefore(modeBar, firstCard.firstChild);
  }

  updateInternalLinksForSource();
}

function updateInternalLinksForSource() {
  if (DATA_SOURCE !== "sheet") {
    return;
  }

  document.querySelectorAll('a[href="index.html"]').forEach(link => {
    link.setAttribute("href", "index.html?source=sheet");
  });
}

async function loadQrCodes() {
  setStatus("Chargement des équipements...", "");

  try {
    const url = WEB_APP_URL + "?action=" + encodeURIComponent(IS_GRIST_MODE ? "listEquipementsGrist" : "listEquipements") + "&t=" + Date.now();

    const response = await fetch(url, {
      method: "GET",
      cache: "no-store",
      redirect: "follow"
    });

    if (!response.ok) {
      throw new Error("Erreur HTTP : " + response.status + " " + response.statusText);
    }

    const data = await response.json();
    rawJson.textContent = JSON.stringify(data, null, 2);

    if (!data.ok) {
      throw new Error(data.error || "Réponse API invalide");
    }

    const requestedId = getQueryParam("id");
    let equipements = data.equipements || [];

    if (requestedId) {
      equipements = equipements.filter(item => String(item.id).trim() === String(requestedId).trim());
      pageTitle.textContent = "QR code équipement " + requestedId;
    } else {
      pageTitle.textContent = "QR codes à imprimer";
    }

    renderQrCodes(equipements);
    setStatus("Succès : " + equipements.length + " QR code(s) généré(s).", "ok");

  } catch (error) {
    console.error(error);
    setStatus("Échec : " + error.message, "ko");
    rawJson.textContent = error.message;
    qrGrid.innerHTML = "<p>Erreur de chargement.</p>";
  }
}

function renderQrCodes(equipements) {
  qrGrid.innerHTML = "";

  if (!equipements || equipements.length === 0) {
    qrGrid.innerHTML = "<p>Aucun équipement trouvé.</p>";
    return;
  }

  equipements.forEach(equipement => {
    const card = document.createElement("article");
    card.className = "qr-card";

    const ficheUrl = buildFicheUrl(equipement.id);
    const qrId = "qr-" + sanitizeId(equipement.id);

    card.innerHTML = `
      <h3>${escapeHtml(equipement.code || equipement.id)}</h3>
      <p><strong>${escapeHtml(equipement.nom || "")}</strong></p>
      <p class="small">${escapeHtml(equipement.famille || "")} - ${escapeHtml(equipement.emplacement || "")}</p>
      <div id="${qrId}" class="qr-box"></div>
      <p class="qr-url">${escapeHtml(ficheUrl)}</p>
    `;

    qrGrid.appendChild(card);
    createQrCode(document.getElementById(qrId), ficheUrl);
  });
}

function createQrCode(container, text) {
  container.innerHTML = "";

  if (typeof QRCode !== "undefined") {
    new QRCode(container, {
      text: text,
      width: 170,
      height: 170,
      correctLevel: QRCode.CorrectLevel.M
    });
    return;
  }

  const img = document.createElement("img");
  img.alt = "QR code";
  img.src = "https://api.qrserver.com/v1/create-qr-code/?size=170x170&data=" + encodeURIComponent(text);
  container.appendChild(img);
}

function buildFicheUrl(id) {
  const url = new URL("fiche.html", window.location.href);
  url.searchParams.set("id", id || "");
  if (DATA_SOURCE === "sheet") {
    url.searchParams.set("source", "sheet");
  }
  return url.href;
}

function sanitizeId(value) {
  return String(value || "")
    .replace(/[^a-zA-Z0-9_-]/g, "-");
}

function getQueryParam(name) {
  const params = new URLSearchParams(window.location.search);
  return params.get(name);
}

function setStatus(message, className) {
  statusElement.textContent = "Statut : " + message;
  statusElement.className = className;
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
