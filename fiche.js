const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbzOy3GzEra_cO88DLC9bbqwwgUKXjJFZuIPI9rMXwWl1Q63zNaZmt4v3fR2vEppHX7BYg/exec";

const DATA_SOURCE = getQueryParam("source") === "grist" ? "grist" : "sheet";
const IS_GRIST_MODE = DATA_SOURCE === "grist";

const STATUTS = [
  "Disponible",
  "Utilisé",
  "Maintenance",
  "Hors service"
];

let currentEquipement = null;
let selectedStatut = null;

const statusElement = document.getElementById("status");
const rawJson = document.getElementById("rawJson");
const reloadButton = document.getElementById("reloadButton");
const saveQuickStatusButton = document.getElementById("saveQuickStatusButton");

reloadButton.addEventListener("click", loadFiche);
saveQuickStatusButton.addEventListener("click", saveQuickStatus);

document.querySelectorAll(".quick-status").forEach(button => {
  button.addEventListener("click", () => {
    selectedStatut = button.dataset.statut;
    renderQuickStatusSelection();
  });
});

initSourceMode();
loadFiche();


function initSourceMode() {
  const subtitle = document.querySelector(".subtitle");
  if (subtitle) {
    subtitle.textContent = IS_GRIST_MODE
      ? "Atelier Stock Manager - fiche individuelle / Grist test écriture statut V0.20a"
      : "Atelier Stock Manager - fiche individuelle / Google Sheet";
  }

  const firstCard = document.querySelector("section.card");
  if (firstCard) {
    const modeBar = document.createElement("div");
    modeBar.className = IS_GRIST_MODE ? "source-banner source-grist" : "source-banner source-sheet";
    modeBar.innerHTML = IS_GRIST_MODE
      ? "Mode actif : <strong>Grist test écriture statut</strong>. La modification du statut/commentaire est autorisée avec le code atelier."
      : "Mode actif : <strong>Google Sheet</strong>. Modification terrain active.";
    firstCard.insertBefore(modeBar, firstCard.firstChild);
  }

}

function buildPageUrl(page, params = {}) {
  const url = new URL(page, window.location.href);

  Object.keys(params).forEach(key => {
    if (params[key] !== undefined && params[key] !== null && params[key] !== "") {
      url.searchParams.set(key, params[key]);
    }
  });

  if (IS_GRIST_MODE) {
    url.searchParams.set("source", "grist");
  }

  return url.pathname.split("/").pop() + url.search;
}

async function loadFiche() {
  const id = getQueryParam("id");

  if (!id) {
    setStatus("Échec : aucun ID équipement dans l’URL.", "ko");
    return;
  }

  document.getElementById("qrLink").textContent = window.location.href;
  const qrPageLink = document.getElementById("qrPageLink");
  if (qrPageLink) {
    qrPageLink.href = buildPageUrl("qrcodes.html", { id: id });
  }

  await loadEquipement(id);
  await loadHistoriqueEquipement(id);
}

async function loadEquipement(id) {
  setStatus("Chargement de la fiche équipement...", "");

  try {
    const url =
      WEB_APP_URL
      + "?action=" + encodeURIComponent(IS_GRIST_MODE ? "getEquipementGrist" : "getEquipement")
      + "&id=" + encodeURIComponent(id)
      + "&t=" + Date.now();

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

    currentEquipement = data.equipement;
    selectedStatut = currentEquipement.statut || "Disponible";

    renderEquipement(currentEquipement);
    renderQuickStatusSelection();

    setStatus("Succès : fiche équipement chargée.", "ok");

  } catch (error) {
    console.error(error);
    setStatus("Échec : " + error.message, "ko");
    rawJson.textContent = error.message;
  }
}

async function loadHistoriqueEquipement(id) {
  try {
    const url =
      WEB_APP_URL
      + "?action=" + encodeURIComponent(IS_GRIST_MODE ? "listHistoriqueEquipementGrist" : "listHistoriqueEquipement")
      + "&id=" + encodeURIComponent(id)
      + "&t=" + Date.now();

    const response = await fetch(url, {
      method: "GET",
      cache: "no-store",
      redirect: "follow"
    });

    if (!response.ok) {
      throw new Error("Erreur HTTP historique : " + response.status);
    }

    const data = await response.json();

    if (!data.ok) {
      throw new Error(data.error || "Réponse historique invalide");
    }

    renderHistorique(data.historique || []);

  } catch (error) {
    console.error(error);
    setStatus("Échec historique : " + error.message, "ko");
  }
}

async function saveQuickStatus() {
  if (!currentEquipement || !currentEquipement.id) {
    setStatus("Échec : aucun équipement chargé.", "ko");
    return;
  }

  if (!selectedStatut) {
    setStatus("Échec : aucun statut sélectionné.", "ko");
    return;
  }

  const pin = document.getElementById("writePin").value.trim();
  const commentaire = document.getElementById("quickCommentaire").value.trim();

  setStatus("Enregistrement rapide en cours...", "");

  try {
    const action = IS_GRIST_MODE ? "updateStatutGrist" : "updateStatut";
    const url =
      WEB_APP_URL
      + "?action=" + encodeURIComponent(action)
      + "&id=" + encodeURIComponent(currentEquipement.id)
      + "&statut=" + encodeURIComponent(selectedStatut)
      + "&commentaire=" + encodeURIComponent(commentaire)
      + "&pin=" + encodeURIComponent(pin)
      + "&t=" + Date.now();

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

    setStatus("Succès : statut mis à jour depuis la fiche.", "ok");

    await loadFiche();

  } catch (error) {
    console.error(error);
    setStatus("Échec : " + error.message, "ko");
    rawJson.textContent = error.message;
  }
}

function renderEquipement(equipement) {
  document.getElementById("equipementTitle").textContent =
    String(equipement.code || "") + " - " + String(equipement.nom || "");

  document.getElementById("ficheId").textContent = equipement.id || "";
  document.getElementById("ficheCode").textContent = equipement.code || "";
  document.getElementById("ficheFamille").textContent = equipement.famille || "";
  document.getElementById("ficheEmplacement").textContent = equipement.emplacement || "";
  document.getElementById("ficheCommentaire").textContent = equipement.commentaire || "";
  document.getElementById("quickCommentaire").value = equipement.commentaire || "";

  document.getElementById("ficheStatutHero").innerHTML = renderStatut(equipement.statut || "");
}

function renderQuickStatusSelection() {
  document.querySelectorAll(".quick-status").forEach(button => {
    const isSelected = button.dataset.statut === selectedStatut;
    button.classList.toggle("selected", isSelected);
  });
}

function renderHistorique(historique) {
  const body = document.getElementById("ficheHistoriqueBody");

  body.innerHTML = "";

  if (!historique || historique.length === 0) {
    body.innerHTML = "<tr><td colspan='6'>Aucun historique trouvé pour cet équipement.</td></tr>";
    return;
  }

  historique.forEach(item => {
    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${escapeHtml(formatDate(item.timestamp))}</td>
      <td>${renderStatut(String(item.ancienStatut || ""))}</td>
      <td>${renderStatut(String(item.nouveauStatut || ""))}</td>
      <td>${escapeHtml(item.ancienCommentaire)}</td>
      <td>${escapeHtml(item.nouveauCommentaire)}</td>
      <td>${escapeHtml(item.source)}</td>
    `;

    body.appendChild(row);
  });
}

function renderStatut(statut) {
  const safeStatut = escapeHtml(statut || "");

  let className = "badge";

  if (statut === "Disponible") {
    className += " statut-disponible";
  } else if (statut === "Utilisé") {
    className += " statut-utilise";
  } else if (statut === "Maintenance") {
    className += " statut-maintenance";
  } else if (statut === "Hors service") {
    className += " statut-hors-service";
  }

  return `<span class="${className}">${safeStatut}</span>`;
}

function getQueryParam(name) {
  const params = new URLSearchParams(window.location.search);
  return params.get(name);
}

function formatDate(value) {
  if (!value) {
    return "";
  }

  let date;

  if (typeof value === "number") {
    // Grist renvoie les dates/heures sous forme de timestamp Unix en secondes.
    // JavaScript attend des millisecondes : on convertit si la valeur est petite.
    date = new Date(value < 100000000000 ? value * 1000 : value);
  } else if (/^\d+(\.\d+)?$/.test(String(value).trim())) {
    const numericValue = Number(value);
    date = new Date(numericValue < 100000000000 ? numericValue * 1000 : numericValue);
  } else {
    date = new Date(value);
  }

  if (isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("fr-FR");
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
