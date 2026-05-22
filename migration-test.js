const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbzOy3GzEra_cO88DLC9bbqwwgUKXjJFZuIPI9rMXwWl1Q63zNaZmt4v3fR2vEppHX7BYg/exec";

const previewButton = document.getElementById("previewButton");
const migrateHistoriqueButton = document.getElementById("migrateHistoriqueButton");
const statusElement = document.getElementById("status");
const rawJson = document.getElementById("rawJson");
const countsSummary = document.getElementById("countsSummary");
const diffsSummary = document.getElementById("diffsSummary");
const columnsSummary = document.getElementById("columnsSummary");
const samplesSummary = document.getElementById("samplesSummary");
const migrationResult = document.getElementById("migrationResult");

previewButton.addEventListener("click", runMigrationPreview);
migrateHistoriqueButton.addEventListener("click", runHistoriqueMigration);

async function runMigrationPreview() {
  setStatus("Aperçu de migration en cours...", "");

  try {
    const pin = document.getElementById("adminPin").value.trim();
    const url = WEB_APP_URL
      + "?action=migrateSheetToGristPreview"
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

    renderPreview(data.preview);
    setStatus("Succès : aperçu de migration généré. Aucune donnée n’a été modifiée.", "ok");

  } catch (error) {
    console.error(error);
    setStatus("Échec : " + error.message, "ko");
    rawJson.textContent = error.message;
  }
}

async function runHistoriqueMigration() {
  const confirmed = confirm(
    "Cette action va écrire réellement les lignes manquantes de l’historique dans Grist.\n\n" +
    "Elle ne modifie pas les équipements, les familles ni les emplacements.\n\n" +
    "Continuer ?"
  );

  if (!confirmed) {
    setStatus("Migration annulée par l’utilisateur.", "");
    return;
  }

  setStatus("Migration réelle de l’historique en cours...", "");

  try {
    const pin = document.getElementById("adminPin").value.trim();
    const url = WEB_APP_URL
      + "?action=migrateHistoriqueSheetToGrist"
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

    renderMigrationResult(data.migration);
    setStatus("Succès : migration de l’historique effectuée.", "ok");

    await runMigrationPreview();

  } catch (error) {
    console.error(error);
    setStatus("Échec : " + error.message, "ko");
    rawJson.textContent = error.message;
  }
}

function renderMigrationResult(migration) {
  if (!migration) {
    migrationResult.textContent = "Aucun résultat de migration.";
    return;
  }

  migrationResult.innerHTML = `
    <div class="table-container">
      <table>
        <tbody>
          <tr><th>Table</th><td>${escapeHtml(migration.table || "Historique")}</td></tr>
          <tr><th>Lignes Sheet</th><td>${migration.sheetCount}</td></tr>
          <tr><th>Grist avant</th><td>${migration.gristBeforeCount}</td></tr>
          <tr><th>Lignes à insérer</th><td>${migration.rowsToInsertCount}</td></tr>
          <tr><th>Lignes insérées</th><td>${migration.insertedCount}</td></tr>
          <tr><th>Lignes ignorées car déjà présentes</th><td>${migration.skippedAsAlreadyPresentCount}</td></tr>
          <tr><th>Grist après</th><td>${migration.gristAfterCount}</td></tr>
        </tbody>
      </table>
    </div>
    <h3>Aperçu des lignes insérées</h3>
    <pre>${escapeHtml(JSON.stringify(migration.insertedPreview || [], null, 2))}</pre>
  `;
}

function renderPreview(preview) {
  renderCounts(preview.counts);
  renderDiffs(preview.diffs);
  renderColumns(preview.columns, preview.mappingNotes);
  renderSamples(preview.sampleTransformedRows);
}

function renderCounts(counts) {
  const rows = ["Equipements", "Historique", "Familles", "Emplacements"].map(table => {
    const sheet = counts.sheet[table] || 0;
    const grist = counts.grist[table] || 0;
    const transformed = counts.transformed[table] || 0;
    const status = sheet === grist ? "OK" : "Écart à traiter";

    return `
      <tr>
        <td>${escapeHtml(table)}</td>
        <td>${sheet}</td>
        <td>${grist}</td>
        <td>${transformed}</td>
        <td>${status}</td>
      </tr>
    `;
  }).join("");

  countsSummary.innerHTML = `
    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>Table</th>
            <th>Google Sheet</th>
            <th>Grist actuel</th>
            <th>Lignes transformées</th>
            <th>État</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}

function renderDiffs(diffs) {
  diffsSummary.innerHTML = `
    <h3>Equipements</h3>
    ${renderDiffBlock(diffs.Equipements)}

    <h3>Familles</h3>
    ${renderDiffBlock(diffs.Familles)}

    <h3>Emplacements</h3>
    ${renderDiffBlock(diffs.Emplacements)}

    <h3>Historique</h3>
    <pre>${escapeHtml(JSON.stringify(diffs.Historique, null, 2))}</pre>
  `;
}

function renderDiffBlock(diff) {
  const keyDetails = diff.sheetKey && diff.gristKey && diff.sheetKey !== diff.gristKey
    ? `<li>Mapping : Google Sheet <strong>${escapeHtml(diff.sheetKey)}</strong> → Grist API <strong>${escapeHtml(diff.gristKey)}</strong></li>`
    : "";

  return `
    <ul>
      <li>Clé : <strong>${escapeHtml(diff.key || "-")}</strong></li>
      ${keyDetails}
      <li>Présents Sheet : ${diff.sheetCount}</li>
      <li>Présents Grist : ${diff.gristCount}</li>
      <li>Commun par clé : ${diff.identicalCountByKey || 0}</li>
      <li>Manquants dans Grist : ${escapeHtml((diff.missingInGrist || []).join(", ") || "aucun")}</li>
      <li>En trop dans Grist : ${escapeHtml((diff.extraInGrist || []).join(", ") || "aucun")}</li>
    </ul>
  `;
}

function renderColumns(columns, mappingNotes) {
  const notes = mappingNotes ? `
    <div class="card" style="box-shadow:none; background:#f8f8f8; margin-bottom:16px;">
      <h3>Notes de mapping</h3>
      <ul>
        <li>${escapeHtml(mappingNotes.Equipements || "")}</li>
        <li>${escapeHtml(mappingNotes.Historique || "")}</li>
        <li>${escapeHtml(mappingNotes.decision || "")}</li>
      </ul>
    </div>
  ` : "";

  columnsSummary.innerHTML = notes + `
    <div class="admin-ref-grid">
      ${renderColumnGroup("Google Sheet", columns.sheet)}
      ${renderColumnGroup("Grist actuel", columns.grist)}
      ${renderColumnGroup("Cible migration", columns.target)}
    </div>
  `;
}

function renderColumnGroup(title, data) {
  const content = Object.keys(data || {}).map(table => {
    return `<h4>${escapeHtml(table)}</h4><pre>${escapeHtml((data[table] || []).join("\n"))}</pre>`;
  }).join("");

  return `<div><h3>${escapeHtml(title)}</h3>${content}</div>`;
}

function renderSamples(samples) {
  samplesSummary.innerHTML = Object.keys(samples || {}).map(table => {
    return `
      <h3>${escapeHtml(table)}</h3>
      <pre>${escapeHtml(JSON.stringify(samples[table], null, 2))}</pre>
    `;
  }).join("");
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
