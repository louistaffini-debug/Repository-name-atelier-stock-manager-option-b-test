const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbzOy3GzEra_cO88DLC9bbqwwgUKXjJFZuIPI9rMXwWl1Q63zNaZmt4v3fR2vEppHX7BYg/exec";
const EXPECTED_REPOSITORY_PATH = "/atelier-stock-manager/";
const MIN_API_VERSION = "0.15.0";

const statusElement = document.getElementById("status");
const diagnosticBody = document.getElementById("diagnosticBody");
const summaryBox = document.getElementById("summaryBox");
const rawJson = document.getElementById("rawJson");
const runDiagnosticButton = document.getElementById("runDiagnosticButton");
const printButton = document.getElementById("printButton");

const results = [];

runDiagnosticButton.addEventListener("click", runDiagnostic);
printButton.addEventListener("click", () => window.print());

renderDetectedLinks();
runDiagnostic();

async function runDiagnostic() {
  results.length = 0;
  diagnosticBody.innerHTML = "";
  summaryBox.textContent = "Diagnostic en cours...";
  setStatus("Diagnostic en cours...", "");

  try {
    addResult("URL GitHub Pages", window.location.pathname.includes(EXPECTED_REPOSITORY_PATH),
      "Chemin détecté : " + window.location.pathname);

    const health = await callApi("health");
    addResult("API health", health.ok === true, "Version API : " + (health.version || "inconnue"));
    addResult("Version API minimale", compareVersions(health.version || "0.0.0", MIN_API_VERSION) >= 0,
      "Version minimale attendue : " + MIN_API_VERSION);

    const equipementsData = await callApi("listEquipements");
    const equipements = equipementsData.equipements || [];
    addResult("Lecture équipements", equipementsData.ok === true && equipements.length > 0,
      equipements.length + " équipement(s) lu(s)");

    const famillesData = await callApi("listFamilles");
    const familles = famillesData.familles || [];
    addResult("Lecture familles actives", famillesData.ok === true && familles.length > 0,
      familles.length + " famille(s) active(s)");

    const emplacementsData = await callApi("listEmplacements");
    const emplacements = emplacementsData.emplacements || [];
    addResult("Lecture emplacements actifs", emplacementsData.ok === true && emplacements.length > 0,
      emplacements.length + " emplacement(s) actif(s)");

    const historiqueData = await callApi("listHistorique");
    const historique = historiqueData.historique || [];
    addResult("Lecture historique", historiqueData.ok === true,
      historique.length + " ligne(s) d’historique lue(s)");

    if (equipements.length > 0) {
      const first = equipements[0];
      const id = first.id;
      const ficheUrl = buildUrl("fiche.html", { id });
      const qrUrl = buildUrl("qrcodes.html", { id });

      document.getElementById("ficheUrl").innerHTML = makeLink(ficheUrl);
      document.getElementById("qrUrl").innerHTML = makeLink(buildUrl("qrcodes.html"));

      const ficheData = await callApi("getEquipement", { id });
      addResult("Fiche équipement API", ficheData.ok === true && ficheData.equipement && String(ficheData.equipement.id) === String(id),
        "Test avec " + id + " - " + (ficheData.equipement ? ficheData.equipement.code : ""));

      const histoEquipementData = await callApi("listHistoriqueEquipement", { id });
      const histoEquipement = histoEquipementData.historique || [];
      const onlyThisId = histoEquipement.every(item => String(item.id).trim() === String(id).trim());
      addResult("Historique filtré équipement", histoEquipementData.ok === true && onlyThisId,
        histoEquipement.length + " ligne(s) pour " + id);

      addResult("Lien fiche stable", ficheUrl.includes("/fiche.html?id=" + encodeURIComponent(id)), ficheUrl);
      addResult("Lien QR équipement", qrUrl.includes("/qrcodes.html?id=" + encodeURIComponent(id)), qrUrl);
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

async function callApi(action, params = {}) {
  const url = new URL(WEB_APP_URL);
  url.searchParams.set("action", action);
  url.searchParams.set("t", Date.now());

  Object.keys(params).forEach(key => {
    url.searchParams.set(key, params[key]);
  });

  const response = await fetch(url.href, {
    method: "GET",
    cache: "no-store",
    redirect: "follow"
  });

  if (!response.ok) {
    throw new Error("Erreur HTTP " + action + " : " + response.status + " " + response.statusText);
  }

  const data = await response.json();
  rawJson.textContent = JSON.stringify(data, null, 2);
  return data;
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
  const homeUrl = buildUrl("index.html");
  const qrUrl = buildUrl("qrcodes.html");

  document.getElementById("currentUrl").innerHTML = makeLink(currentUrl);
  document.getElementById("homeUrl").innerHTML = makeLink(homeUrl);
  document.getElementById("qrUrl").innerHTML = makeLink(qrUrl);
  document.getElementById("ficheUrl").textContent = "Sera généré après lecture du premier équipement.";
}

function buildUrl(page, params = {}) {
  const url = new URL(page, window.location.href);

  Object.keys(params).forEach(key => {
    url.searchParams.set(key, params[key]);
  });

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
