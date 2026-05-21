    const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbzOy3GzEra_cO88DLC9bbqwwgUKXjJFZuIPI9rMXwWl1Q63zNaZmt4v3fR2vEppHX7BYg/exec";

    const STATUTS = [
      "Disponible",
      "Utilisé",
      "Maintenance",
      "Hors service"
    ];

    let familles = [];
    let emplacements = [];

    const loadButton = document.getElementById("loadButton");
    const historyButton = document.getElementById("historyButton");
    const refreshAllButton = document.getElementById("refreshAllButton");
    const addEquipementForm = document.getElementById("addEquipementForm");

    const addFamilleForm = document.getElementById("addFamilleForm");
    const addEmplacementForm = document.getElementById("addEmplacementForm");

    const statusElement = document.getElementById("status");
    const equipementsBody = document.getElementById("equipementsBody");
    const historiqueBody = document.getElementById("historiqueBody");
    const rawJson = document.getElementById("rawJson");

    loadButton.addEventListener("click", loadEquipements);
    historyButton.addEventListener("click", loadHistorique);
    refreshAllButton.addEventListener("click", refreshAll);
    addEquipementForm.addEventListener("submit", addEquipement);
    addFamilleForm.addEventListener("submit", addFamille);
    addEmplacementForm.addEventListener("submit", addEmplacement);

    loadReferentiels();

    async function refreshAll() {
      await loadEquipements();
      await loadHistorique();
    }

    async function loadEquipements() {
      setStatus("Chargement des équipements en cours...", "");

      try {
        const url = WEB_APP_URL + "?action=listEquipements&t=" + Date.now();

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

        renderEquipements(data.equipements);

        setStatus("Succès : équipements chargés depuis Apps Script.", "ok");

      } catch (error) {
        console.error(error);
        setStatus("Échec : " + error.message, "ko");
        rawJson.textContent = error.message;
      }
    }

    async function loadHistorique() {
      setStatus("Chargement de l’historique en cours...", "");

      try {
        const url = WEB_APP_URL + "?action=listHistorique&t=" + Date.now();

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

        renderHistorique(data.historique);

        setStatus("Succès : historique chargé depuis Apps Script.", "ok");

      } catch (error) {
        console.error(error);
        setStatus("Échec : " + error.message, "ko");
        rawJson.textContent = error.message;
      }
    }

    function getWritePin() {
    return document.getElementById("writePin").value.trim();
      }

    async function addEquipement(event) {
      event.preventDefault();

      setStatus("Ajout de l’équipement en cours...", "");

      try {
        const code = document.getElementById("newCode").value.trim();
        const nom = document.getElementById("newNom").value.trim();
        const famille = document.getElementById("newFamille").value.trim();
        const emplacement = document.getElementById("newEmplacement").value.trim();
        const statut = document.getElementById("newStatut").value;
        const commentaire = document.getElementById("newCommentaire").value.trim();

        const url =
          WEB_APP_URL
          + "?action=addEquipement"
          + "&code=" + encodeURIComponent(code)
          + "&nom=" + encodeURIComponent(nom)
          + "&famille=" + encodeURIComponent(famille)
          + "&emplacement=" + encodeURIComponent(emplacement)
          + "&statut=" + encodeURIComponent(statut)
         + "&commentaire=" + encodeURIComponent(commentaire)
         + "&pin=" + encodeURIComponent(getWritePin())
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

        setStatus("Succès : équipement ajouté.", "ok");

        addEquipementForm.reset();

        await loadEquipements();
        await loadHistorique();

      } catch (error) {
        console.error(error);
        setStatus("Échec : " + error.message, "ko");
        rawJson.textContent = error.message;
      }
    }

    function renderEquipements(equipements) {
      equipementsBody.innerHTML = "";

      if (!equipements || equipements.length === 0) {
        equipementsBody.innerHTML = "<tr><td colspan='8'>Aucun équipement trouvé.</td></tr>";
        return;
      }

      equipements.forEach(equipement => {
        const row = document.createElement("tr");

        const id = escapeHtml(equipement.id);
        const statut = String(equipement.statut || "");
        const commentaire = String(equipement.commentaire || "");

        row.innerHTML = `
          <td>${escapeHtml(equipement.code)}</td>
          <td>${escapeHtml(equipement.nom)}</td>
          <td>${escapeHtml(equipement.famille)}</td>
          <td>${escapeHtml(equipement.emplacement)}</td>
          <td>${renderStatut(statut)}</td>
          <td>${renderStatutSelect(id, statut)}</td>
          <td>
            <input
              id="commentaire-${id}"
              type="text"
              value="${escapeHtml(commentaire)}"
            >
          </td>
          <td>
            <button onclick="saveStatut('${id}')">Enregistrer</button>
          </td>
        `;

        equipementsBody.appendChild(row);
      });
    }

    function renderHistorique(historique) {
      historiqueBody.innerHTML = "";

      if (!historique || historique.length === 0) {
        historiqueBody.innerHTML = "<tr><td colspan='8'>Aucun historique trouvé.</td></tr>";
        return;
      }

      historique.forEach(item => {
        const row = document.createElement("tr");

        row.innerHTML = `
          <td>${escapeHtml(formatDate(item.timestamp))}</td>
          <td>${escapeHtml(item.code)}</td>
          <td>${escapeHtml(item.nom)}</td>
          <td>${renderStatut(String(item.ancienStatut || ""))}</td>
          <td>${renderStatut(String(item.nouveauStatut || ""))}</td>
          <td>${escapeHtml(item.ancienCommentaire)}</td>
          <td>${escapeHtml(item.nouveauCommentaire)}</td>
          <td>${escapeHtml(item.source)}</td>
        `;

        historiqueBody.appendChild(row);
      });
    }

    function renderStatutSelect(id, selectedStatut) {
      const options = STATUTS.map(statut => {
        const selected = statut === selectedStatut ? "selected" : "";
        return `<option value="${escapeHtml(statut)}" ${selected}>${escapeHtml(statut)}</option>`;
      }).join("");

      return `
        <select id="statut-${escapeHtml(id)}">
          ${options}
        </select>
      `;
    }

    async function saveStatut(id) {
      setStatus("Enregistrement en cours pour " + id + "...", "");

      try {
        const statut = document.getElementById("statut-" + id).value;
        const commentaire = document.getElementById("commentaire-" + id).value;

        const url =
          WEB_APP_URL
          + "?action=updateStatut"
          + "&id=" + encodeURIComponent(id)
          + "&statut=" + encodeURIComponent(statut)
          + "&commentaire=" + encodeURIComponent(commentaire)
          + "&pin=" + encodeURIComponent(getWritePin())
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

        setStatus("Succès : statut mis à jour pour " + id + ".", "ok");

        await loadEquipements();
        await loadHistorique();

      } catch (error) {
        console.error(error);
        setStatus("Échec : " + error.message, "ko");
        rawJson.textContent = error.message;
      }
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
