const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbzOy3GzEra_cO88DLC9bbqwwgUKXjJFZuIPI9rMXwWl1Q63zNaZmt4v3fR2vEppHX7BYg/exec";

const statusElement = document.getElementById("status");
const rawJson = document.getElementById("rawJson");
const reloadButton = document.getElementById("reloadButton");

reloadButton.addEventListener("click", loadFiche);

loadFiche();

async function loadFiche() {
  const id = getQueryParam("id");

  if (!id) {
    setStatus("Échec : aucun ID équipement dans l’URL.", "ko");
    return;
  }

  document.getElementById("qrLink").textContent = window.location.href;

  await loadEquipement(id);
  await loadHistoriqueEquipement(id);
}

async function loadEquipement(id) {
  setStatus("Chargement de la fiche équipement...", "");

  try {
    const url =
      WEB_APP_URL
      + "?action=getEquipement"
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

    renderEquipement(data.equipement);

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
      + "?action=listHistoriqueEquipement"
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

function renderEquipement(equipement) {
  document.getElementById("equipementTitle").textContent =
    String(equipement.code || "") + " - " + String(equipement.nom || "");

  document.getElementById("ficheId").textContent = equipement.id || "";
  document.getElementById("ficheCode").textContent = equipement.code || "";
  document.getElementById("ficheNom").textContent = equipement.nom || "";
  document.getElementById("ficheFamille").textContent = equipement.famille || "";
  document.getElementById("ficheEmplacement").textContent = equipement.emplacement || "";
  document.getElementById("ficheCommentaire").textContent = equipement.commentaire || "";

  document.getElementById("ficheStatut").innerHTML = renderStatut(equipement.statut || "");
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

  const date = new Date(value);

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
