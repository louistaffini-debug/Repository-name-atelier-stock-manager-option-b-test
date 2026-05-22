const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbzOy3GzEra_cO88DLC9bbqwwgUKXjJFZuIPI9rMXwWl1Q63zNaZmt4v3fR2vEppHX7BYg/exec";

const runTestsButton = document.getElementById("runTestsButton");
const compareButton = document.getElementById("compareButton");
const statusElement = document.getElementById("status");
const testsBody = document.getElementById("testsBody");
const rawJson = document.getElementById("rawJson");
const compareBody = document.getElementById("compareBody");
const gristEquipementsBody = document.getElementById("gristEquipementsBody");

runTestsButton.addEventListener("click", runGristTests);
compareButton.addEventListener("click", compareSheetAndGrist);

const gristTests = [
  {
    label: "API Apps Script",
    action: "health",
    expectedField: "version"
  },
  {
    label: "Connexion Grist",
    action: "gristHealth",
    expectedField: "test"
  },
  {
    label: "Grist - Equipements",
    action: "gristListEquipements",
    listField: "equipements"
  },
  {
    label: "Grist - Familles",
    action: "gristListFamilles",
    listField: "familles"
  },
  {
    label: "Grist - Emplacements",
    action: "gristListEmplacements",
    listField: "emplacements"
  },
  {
    label: "Grist - Historique",
    action: "gristListHistorique",
    listField: "historique"
  }
];

async function runGristTests() {
  setStatus("Tests Grist en cours...", "");
  testsBody.innerHTML = "";
  rawJson.textContent = "";
  resetCounts();

  const results = [];
  let allOk = true;
  let lastJson = null;
  let gristEquipements = [];

  for (const test of gristTests) {
    try {
      const data = await callApi(test.action);
      lastJson = data;

      if (!data.ok) {
        throw new Error(data.error || "Réponse API invalide");
      }

      let detail = "Réponse OK";
      let state = "ok";

      if (test.listField) {
        const list = data[test.listField] || [];
        detail = list.length + " ligne(s) reçue(s)";

        if (list.length === 0) {
          state = "warn";
          detail += " - table vide ou données non importées";
        }

        updateCount(test.listField, list.length);

        if (test.listField === "equipements") {
          gristEquipements = list;
        }
      }

      if (test.action === "gristHealth" && data.test) {
        detail = "Connexion OK - " + (data.test.recordsReceived || 0) + " ligne(s) test reçue(s)";
      }

      results.push({ label: test.label, state, detail });
    } catch (error) {
      allOk = false;
      results.push({ label: test.label, state: "ko", detail: error.message });
    }
  }

  renderTestResults(results);
  renderGristEquipements(gristEquipements);
  rawJson.textContent = JSON.stringify(lastJson, null, 2);

  if (allOk) {
    setStatus("Tests terminés : connexion Grist opérationnelle.", "ok");
  } else {
    setStatus("Tests terminés avec au moins une erreur.", "ko");
  }
}

async function compareSheetAndGrist() {
  setStatus("Comparaison Google Sheet / Grist en cours...", "");
  compareBody.innerHTML = "";

  const rows = [
    { label: "Equipements", sheetAction: "listEquipements", gristAction: "gristListEquipements", sheetField: "equipements", gristField: "equipements" },
    { label: "Familles", sheetAction: "listFamilles", gristAction: "gristListFamilles", sheetField: "familles", gristField: "familles" },
    { label: "Emplacements", sheetAction: "listEmplacements", gristAction: "gristListEmplacements", sheetField: "emplacements", gristField: "emplacements" },
    { label: "Historique", sheetAction: "listHistorique", gristAction: "gristListHistorique", sheetField: "historique", gristField: "historique" }
  ];

  try {
    const rendered = [];

    for (const row of rows) {
      const sheetData = await callApi(row.sheetAction);
      const gristData = await callApi(row.gristAction);

      if (!sheetData.ok) {
        throw new Error("Erreur Google Sheet " + row.label + " : " + (sheetData.error || "réponse invalide"));
      }

      if (!gristData.ok) {
        throw new Error("Erreur Grist " + row.label + " : " + (gristData.error || "réponse invalide"));
      }

      const sheetCount = (sheetData[row.sheetField] || []).length;
      const gristCount = (gristData[row.gristField] || []).length;

      let state = "OK";
      let className = "ok";

      if (sheetCount !== gristCount) {
        state = "Écart à traiter";
        className = "ko";
      }

      rendered.push({ label: row.label, sheetCount, gristCount, state, className });
    }

    renderComparison(rendered);
    setStatus("Comparaison terminée.", "ok");
  } catch (error) {
    console.error(error);
    setStatus("Échec comparaison : " + error.message, "ko");
    rawJson.textContent = error.message;
  }
}

async function callApi(action) {
  const url = WEB_APP_URL + "?action=" + encodeURIComponent(action) + "&t=" + Date.now();

  const response = await fetch(url, {
    method: "GET",
    cache: "no-store",
    redirect: "follow"
  });

  if (!response.ok) {
    throw new Error("Erreur HTTP " + response.status + " " + response.statusText);
  }

  return response.json();
}

function renderTestResults(results) {
  testsBody.innerHTML = "";

  results.forEach(result => {
    const row = document.createElement("tr");
    const badge = renderResultBadge(result.state);

    row.innerHTML = `
      <td>${escapeHtml(result.label)}</td>
      <td>${badge}</td>
      <td>${escapeHtml(result.detail)}</td>
    `;

    testsBody.appendChild(row);
  });
}

function renderResultBadge(state) {
  if (state === "ok") {
    return '<span class="badge test-ok">OK</span>';
  }

  if (state === "warn") {
    return '<span class="badge test-warn">Vide</span>';
  }

  return '<span class="badge test-ko">Erreur</span>';
}

function renderGristEquipements(items) {
  gristEquipementsBody.innerHTML = "";

  if (!items || items.length === 0) {
    gristEquipementsBody.innerHTML = "<tr><td colspan='6'>Aucun équipement Grist trouvé.</td></tr>";
    return;
  }

  items.slice(0, 20).forEach(item => {
    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${escapeHtml(item.id)}</td>
      <td>${escapeHtml(item.code)}</td>
      <td>${escapeHtml(item.nom)}</td>
      <td>${escapeHtml(item.famille)}</td>
      <td>${escapeHtml(item.emplacement)}</td>
      <td>${renderStatut(String(item.statut || ""))}</td>
    `;

    gristEquipementsBody.appendChild(row);
  });
}

function renderComparison(rows) {
  compareBody.innerHTML = "";

  rows.forEach(item => {
    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${escapeHtml(item.label)}</td>
      <td>${escapeHtml(item.sheetCount)}</td>
      <td>${escapeHtml(item.gristCount)}</td>
      <td class="${item.className}">${escapeHtml(item.state)}</td>
    `;

    compareBody.appendChild(row);
  });
}

function updateCount(field, count) {
  if (field === "equipements") {
    document.getElementById("countGristEquipements").textContent = count;
  } else if (field === "familles") {
    document.getElementById("countGristFamilles").textContent = count;
  } else if (field === "emplacements") {
    document.getElementById("countGristEmplacements").textContent = count;
  } else if (field === "historique") {
    document.getElementById("countGristHistorique").textContent = count;
  }
}

function resetCounts() {
  document.getElementById("countGristEquipements").textContent = "-";
  document.getElementById("countGristFamilles").textContent = "-";
  document.getElementById("countGristEmplacements").textContent = "-";
  document.getElementById("countGristHistorique").textContent = "-";
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
