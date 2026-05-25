const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbzOy3GzEra_cO88DLC9bbqwwgUKXjJFZuIPI9rMXwWl1Q63zNaZmt4v3fR2vEppHX7BYg/exec";
const EXPECTED_REPOSITORY_PATH = "/atelier-stock-manager/";
const MIN_API_VERSION = "1.0.0";
const DATA_SOURCE = getDataSource();
const IS_GRIST_MODE = DATA_SOURCE === "grist";

const statusElement = document.getElementById("status");
const diagnosticBody = document.getElementById("diagnosticBody");
const summaryBox = document.getElementById("summaryBox");
const rawJson = document.getElementById("rawJson");
const runDiagnosticButton = document.getElementById("runDiagnosticButton");
const printButton = document.getElementById("printButton");

const results = [];

runDiagnosticButton.addEventListener("click", runDiagnostic);
printButton.addEventListener("click", () => window.print());

initDiagnosticPage();
runDiagnostic();

function getDataSource() {
  const params = new URLSearchParams(window.location.search);
  return params.get("source") === "sheet" ? "sheet" : "grist";
}

function initDiagnosticPage() {
  const subtitle = document.querySelector(".subtitle");
  if (subtitle) {
    subtitle.textContent = IS_GRIST_MODE
      ? "Atelier Stock Manager - diagnostic Grist officiel"
      : "Atelier Stock Manager - diagnostic Google Sheet secours";
  }

  const card = document.querySelector("section.card");
  if (card) {
    const modeBar = document.createElement("div");
    modeBar.className = IS_GRIST_MODE ? "source-banner source-grist" : "source-banner source-sheet";
    modeBar.innerHTML = IS_GRIST_MODE
      ? "Mode diagnostiqué : <strong>Grist officiel</strong>"
      : "Mode diagnostiqué : <strong>Google Sheet secours</strong>";
    card.insertBefore(modeBar, card.firstChild);
  }

  document.querySelectorAll('a[href="index.html"]').forEach(link => {
    link.setAttribute("href", buildPageUrl("index.html"));
  });

  renderDetectedLinks();
}

async function runDiagnostic() {
  results.length = 0;
  diagnosticBody.innerHTML = "";
  summaryBox.className = "diagnostic-summary";
  summaryBox.textContent = "Diagnostic en cours...";
  rawJson.textContent = "Aucune réponse pour le moment.";
  setStatus("Diagnostic en cours...", "");

  try {
    addResult(
      "URL GitHub Pages",
      window.location.pathname.includes(EXPECTED_REPOSITORY_PATH),
      "Chemin détecté : " + window.location.pathname
    );

    addResult(
      "Source de données",
      true,
      IS_GRIST_MODE ? "Grist officiel par défaut" : "Google Sheet secours via ?source=sheet"
    );

    const health = await callApi("health", {}, false);
    addResult("API health", health.ok === true, "Version API : " + (health.version || "inconnue"));
    addResult(
      "Version API minimale",
      compareVersions(health.version || "0.0.0", MIN_API_VERSION) >= 0,
      "Version minimale attendue : " + MIN_API_VERSION
    );

    const security = await callApi("securityCheck", {}, false);
    const securityOk = security.ok === true
      && security.security
      && security.security.writePinConfigured
      && security.security.adminPinConfigured
      && security.grist
      && security.grist.apiKeyConfigured;

    addResult(
      "Configuration sécurisée Apps Script",
      securityOk,
      securityOk
        ? "WRITE_PIN, ADMIN_PIN et GRIST_API_KEY configurés dans les propriétés Apps Script."
        : "Vérifier securityCheck : propriété manquante ou non configurée."
    );

    const equipementsData = await callApi("listEquipements");
    const equipements = equipementsData.equipements || [];
    addResult(
      "Lecture équipements",
      equipementsData.ok === true && equipements.length > 0,
      getEffectiveAction("listEquipements") + " → " + equipements.length + " équipement(s) lu(s)"
    );

    const famillesData = await callApi("listFamilles");
    const familles = famillesData.familles || [];
    addResult(
      "Lecture familles actives",
      famillesData.ok === true && familles.length > 0,
      getEffectiveAction("listFamilles") + " → " + familles.length + " famille(s) active(s)"
    );

    const emplacementsData = await callApi("listEmplacements");
    const emplacements = emplacementsData.emplacements || [];
    addResult(
      "Lecture emplacements actifs",
      emplacementsData.ok === true && emplacements.length > 0,
      getEffectiveAction("listEmplacements") + " → " + emplacements.length + " emplacement(s) actif(s)"
    );

    const historiqueData = await callApi("listHistorique");
    const historique = historiqueData.historique || [];
    addResult(
      "Lecture historique",
      historiqueData.ok === true,
      getEffectiveAction("listHistorique") + " → " + historique.length + " ligne(s) d’historique lue(s)"
    );

    if (equipements.length > 0) {
      const first = equipements[0];
      const id = first.id || first.id2;
      const ficheUrl = buildFullPageUrl("fiche.html", { id });
      const qrEquipementUrl = buildFullPageUrl("qrcodes.html", { id });

      document.getElementById("ficheUrl").innerHTML = makeLink(ficheUrl);
      document.getElementById("qrUrl").innerHTML = makeLink(buildFullPageUrl("qrcodes.html"));

      const ficheData = await callApi("getEquipement", { id });
      const ficheId = ficheData.equipement ? (ficheData.equipement.id || ficheData.equipement.id2) : "";
      addResult(
        "Fiche équipement API",
        ficheData.ok === true && ficheData.equipement && String(ficheId) === String(id),
        getEffectiveAction("getEquipement") + " avec " + id + " - " + (ficheData.equipement ? ficheData.equipement.code : "")
      );

      const histoEquipementData = await callApi("listHistoriqueEquipement", { id });
      const histoEquipement = histoEquipementData.historique || [];
      const onlyThisId = histoEquipement.every(item => String(item.id || item.id2 || "").trim() === String(id).trim());
      addResult(
        "Historique filtré équipement",
        histoEquipementData.ok === true && onlyThisId,
        getEffectiveAction("listHistoriqueEquipement") + " → " + histoEquipement.length + " ligne(s) pour " + id
      );

      addResult("Lien fiche stable", ficheUrl.includes("/fiche.html?id=" + encodeURIComponent(id)), ficheUrl);
      addResult("Lien QR équipement", qrEquipementUrl.includes("/qrcodes.html?id=" + encodeURIComponent(id)), qrEquipementUrl);
    } else {
      addResult("Fiche équipement API", false, "Impossible de tester : aucun équipement trouvé.");
      addResult("Historique filtré équipement", false, "Impossible de tester : aucun équipement trouvé.");
    }

    renderResults();
    renderSummary();

  } catch (error) {
    console.error(error);
    addResult("Erreur diagnostic", false, error.message);
    renderResults();
    renderSummary();
    setStatus("Échec : " + error.message, "ko");
  }
}

async function callApi(action, params = {}, useSourceMapping = true) {
  const effectiveAction = useSourceMapping ? getEffectiveAction(action) : action;
  const url = new URL(WEB_APP_URL);
  url.searchParams.set("action", effectiveAction);
  url.searchParams.set("t", Date.now());

  Object.keys(params).forEach(key => {
    if (params[key] !== undefined && params[key] !== null) {
      url.searchParams.set(key, params[key]);
    }
  });

  const response = await fetch(url.href, {
    method: "GET",
    cache: "no-store",
    redirect: "follow"
  });

  if (!response.ok) {
    throw new Error("Erreur HTTP " + effectiveAction + " : " + response.status + " " + response.statusText);
  }

  const data = await response.json();
  rawJson.textContent = JSON.stringify(data, null, 2);

  if (data && data.ok === false) {
    throw new Error(effectiveAction + " : " + (data.error || "Réponse API en échec"));
  }

  return data;
}

function getEffectiveAction(action) {
  if (!IS_GRIST_MODE) {
    return action;
  }

  const gristActions = {
    listEquipements: "listEquipementsGrist",
    listFamilles: "listFamillesGrist",
    listEmplacements: "listEmplacementsGrist",
    listHistorique: "listHistoriqueGrist",
    getEquipement: "getEquipementGrist",
    listHistoriqueEquipement: "listHistoriqueEquipementGrist"
  };

  return gristActions[action] || action;
}

function addResult(name, ok, detail) {
  results.push({ name, ok, detail });
  renderResults();
}

function renderResults() {
  diagnosticBody.innerHTML = "";

  if (results.length === 0) {
    diagnosticBody.innerHTML = "<tr><td colspan='3'>Aucun test lancé.</td></tr>";
    return;
  }

  results.forEach(result => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${escapeHtml(result.name)}</td>
      <td>${result.ok ? "✅ OK" : "❌ À vérifier"}</td>
      <td>${escapeHtml(result.detail)}</td>
    `;

    if (!result.ok) {
      row.classList.add("diagnostic-ko-row");
    }

    diagnosticBody.appendChild(row);
  });
}

function renderSummary() {
  const okCount = results.filter(result => result.ok).length;
  const koCount = results.length - okCount;

  if (koCount === 0) {
    summaryBox.className = "diagnostic-summary diagnostic-ok";
    summaryBox.textContent = "Diagnostic validé : " + okCount + " contrôle(s) OK.";
    setStatus("Diagnostic validé.", "ok");
    return;
  }

  summaryBox.className = "diagnostic-summary diagnostic-ko";
  summaryBox.textContent = "Diagnostic à vérifier : " + koCount + " point(s) en anomalie sur " + results.length + ".";
  setStatus("Diagnostic terminé avec point(s) à vérifier.", "ko");
}

function renderDetectedLinks() {
  const currentUrl = window.location.href;
  const homeUrl = buildFullPageUrl("index.html");
  const qrUrl = buildFullPageUrl("qrcodes.html");

  document.getElementById("currentUrl").innerHTML = makeLink(currentUrl);
  document.getElementById("homeUrl").innerHTML = makeLink(homeUrl);
  document.getElementById("qrUrl").innerHTML = makeLink(qrUrl);
  document.getElementById("ficheUrl").textContent = "Sera généré après lecture du premier équipement.";
}

function buildPageUrl(page, params = {}) {
  const url = new URL(page, window.location.href);

  Object.keys(params).forEach(key => {
    if (params[key] !== undefined && params[key] !== null && params[key] !== "") {
      url.searchParams.set(key, params[key]);
    }
  });

  if (DATA_SOURCE === "sheet") {
    url.searchParams.set("source", "sheet");
  } else {
    url.searchParams.delete("source");
  }

  return url.pathname.split("/").pop() + url.search;
}

function buildFullPageUrl(page, params = {}) {
  const url = new URL(buildPageUrl(page, params), window.location.href);
  return url.href;
}

function makeLink(url) {
  return `<a href="${escapeHtml(url)}" target="_blank">${escapeHtml(url)}</a>`;
}

function compareVersions(a, b) {
  const pa = String(a).split(".").map(Number);
  const pb = String(b).split(".").map(Number);
  const length = Math.max(pa.length, pb.length);

  for (let i = 0; i < length; i++) {
    const na = pa[i] || 0;
    const nb = pb[i] || 0;

    if (na > nb) return 1;
    if (na < nb) return -1;
  }

  return 0;
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
