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

    const loadAdminReferentielsButton = document.getElementById("loadAdminReferentielsButton");
    const adminFamillesBody = document.getElementById("adminFamillesBody");
    const adminEmplacementsBody = document.getElementById("adminEmplacementsBody");

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

    loadAdminReferentielsButton.addEventListener("click", loadAdminReferentiels);
    loadReferentiels();

async function loadReferentiels() {
  await loadFamilles();
  await loadEmplacements();
}

async function loadFamilles() {
  try {
    const url = WEB_APP_URL + "?action=listFamilles&t=" + Date.now();

    const response = await fetch(url, {
      method: "GET",
      cache: "no-store",
      redirect: "follow"
    });

    if (!response.ok) {
      throw new Error("Erreur HTTP familles : " + response.status);
    }

    const data = await response.json();

    if (!data.ok) {
      throw new Error(data.error || "Erreur chargement familles");
    }

    familles = data.familles || [];
    renderFamillesSelect();

  } catch (error) {
    console.error(error);
    setStatus("Échec chargement familles : " + error.message, "ko");
  }
}

async function loadEmplacements() {
  try {
    const url = WEB_APP_URL + "?action=listEmplacements&t=" + Date.now();

    const response = await fetch(url, {
      method: "GET",
      cache: "no-store",
      redirect: "follow"
    });

    if (!response.ok) {
      throw new Error("Erreur HTTP emplacements : " + response.status);
    }

    const data = await response.json();

    if (!data.ok) {
      throw new Error(data.error || "Erreur chargement emplacements");
    }

    emplacements = data.emplacements || [];
    renderEmplacementsSelect();

  } catch (error) {
    console.error(error);
    setStatus("Échec chargement emplacements : " + error.message, "ko");
  }
}

function renderFamillesSelect() {
  const select = document.getElementById("newFamille");

  select.innerHTML = "";

  if (!familles || familles.length === 0) {
    select.innerHTML = "<option value=''>Aucune famille disponible</option>";
    return;
  }

  select.innerHTML = "<option value=''>Choisir une famille</option>";

  familles.forEach(famille => {
    const option = document.createElement("option");
    option.value = famille.nomFamille;
    option.textContent = famille.nomFamille;
    select.appendChild(option);
  });
}

function renderEmplacementsSelect() {
  const select = document.getElementById("newEmplacement");

  select.innerHTML = "";

  if (!emplacements || emplacements.length === 0) {
    select.innerHTML = "<option value=''>Aucun emplacement disponible</option>";
    return;
  }

  select.innerHTML = "<option value=''>Choisir un emplacement</option>";

  emplacements.forEach(emplacement => {
    const option = document.createElement("option");
    option.value = emplacement.nomEmplacement;
    option.textContent = emplacement.nomEmplacement;
    select.appendChild(option);
  });
}

    async function refreshAll() {
      await loadEquipements();
      await loadHistorique();
    }

async function addFamille(event) {
  event.preventDefault();

  setStatus("Ajout de la famille en cours...", "");

  try {
    const nomFamille = document.getElementById("newNomFamille").value.trim();

    const url =
      WEB_APP_URL
      + "?action=addFamille"
      + "&nomFamille=" + encodeURIComponent(nomFamille)
      + "&pin=" + encodeURIComponent(getAdminPin())
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

    setStatus("Succès : famille ajoutée.", "ok");

    addFamilleForm.reset();
    await loadFamilles();
    await loadAdminFamilles();
      

  } catch (error) {
    console.error(error);
    setStatus("Échec : " + error.message, "ko");
    rawJson.textContent = error.message;
  }
}

async function addEmplacement(event) {
  event.preventDefault();

  setStatus("Ajout de l’emplacement en cours...", "");

  try {
    const nomEmplacement = document.getElementById("newNomEmplacement").value.trim();
    const description = document.getElementById("newDescriptionEmplacement").value.trim();

    const url =
      WEB_APP_URL
      + "?action=addEmplacement"
      + "&nomEmplacement=" + encodeURIComponent(nomEmplacement)
      + "&description=" + encodeURIComponent(description)
      + "&pin=" + encodeURIComponent(getAdminPin())
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

    setStatus("Succès : emplacement ajouté.", "ok");

    addEmplacementForm.reset();
    await loadEmplacements();
    await loadAdminEmplacements();

  } catch (error) {
    console.error(error);
    setStatus("Échec : " + error.message, "ko");
    rawJson.textContent = error.message;
  }
}

async function loadAdminReferentiels() {
  setStatus("Chargement des référentiels admin en cours...", "");

  try {
    await loadAdminFamilles();
    await loadAdminEmplacements();

    setStatus("Succès : référentiels admin chargés.", "ok");

  } catch (error) {
    console.error(error);
    setStatus("Échec : " + error.message, "ko");
    rawJson.textContent = error.message;
  }
}

async function loadAdminFamilles() {
  const url =
    WEB_APP_URL
    + "?action=listFamillesAdmin"
    + "&pin=" + encodeURIComponent(getAdminPin())
    + "&t=" + Date.now();

  const response = await fetch(url, {
    method: "GET",
    cache: "no-store",
    redirect: "follow"
  });

  if (!response.ok) {
    throw new Error("Erreur HTTP familles admin : " + response.status);
  }

  const data = await response.json();

  rawJson.textContent = JSON.stringify(data, null, 2);

  if (!data.ok) {
    throw new Error(data.error || "Erreur chargement familles admin");
  }

  renderAdminFamilles(data.familles || []);
}

async function loadAdminEmplacements() {
  const url =
    WEB_APP_URL
    + "?action=listEmplacementsAdmin"
    + "&pin=" + encodeURIComponent(getAdminPin())
    + "&t=" + Date.now();

  const response = await fetch(url, {
    method: "GET",
    cache: "no-store",
    redirect: "follow"
  });

  if (!response.ok) {
    throw new Error("Erreur HTTP emplacements admin : " + response.status);
  }

  const data = await response.json();

  rawJson.textContent = JSON.stringify(data, null, 2);

  if (!data.ok) {
    throw new Error(data.error || "Erreur chargement emplacements admin");
  }

  renderAdminEmplacements(data.emplacements || []);
}

function renderAdminFamilles(items) {
  adminFamillesBody.innerHTML = "";

  if (!items || items.length === 0) {
    adminFamillesBody.innerHTML = "<tr><td colspan='5'>Aucune famille trouvée.</td></tr>";
    return;
  }

  items.forEach(item => {
    const active = isReferenceActive(item.actif);
    const row = document.createElement("tr");

    if (!active) {
      row.classList.add("ref-inactive");
    }

    row.innerHTML = `
      <td>${escapeHtml(item.idFamille)}</td>
      <td>${escapeHtml(item.nomFamille)}</td>
      <td>${escapeHtml(item.ordreAffichage)}</td>
      <td>${active ? "Actif" : "Inactif"}</td>
      <td></td>
    `;

    const actionCell = row.querySelector("td:last-child");
    const button = document.createElement("button");

    button.textContent = active ? "Désactiver" : "Réactiver";
    button.className = active ? "btn-warning" : "btn-success";
    button.addEventListener("click", () => setFamilleActive(item.idFamille, !active));

    actionCell.appendChild(button);
    adminFamillesBody.appendChild(row);
  });
}

function renderAdminEmplacements(items) {
  adminEmplacementsBody.innerHTML = "";

  if (!items || items.length === 0) {
    adminEmplacementsBody.innerHTML = "<tr><td colspan='6'>Aucun emplacement trouvé.</td></tr>";
    return;
  }

  items.forEach(item => {
    const active = isReferenceActive(item.actif);
    const row = document.createElement("tr");

    if (!active) {
      row.classList.add("ref-inactive");
    }

    row.innerHTML = `
      <td>${escapeHtml(item.idEmplacement)}</td>
      <td>${escapeHtml(item.nomEmplacement)}</td>
      <td>${escapeHtml(item.description)}</td>
      <td>${escapeHtml(item.ordreAffichage)}</td>
      <td>${active ? "Actif" : "Inactif"}</td>
      <td></td>
    `;

    const actionCell = row.querySelector("td:last-child");
    const button = document.createElement("button");

    button.textContent = active ? "Désactiver" : "Réactiver";
    button.className = active ? "btn-warning" : "btn-success";
    button.addEventListener("click", () => setEmplacementActive(item.idEmplacement, !active));

    actionCell.appendChild(button);
    adminEmplacementsBody.appendChild(row);
  });
}

async function setFamilleActive(idFamille, actif) {
  setStatus("Mise à jour de la famille " + idFamille + "...", "");

  try {
    const url =
      WEB_APP_URL
      + "?action=setFamilleActive"
      + "&idFamille=" + encodeURIComponent(idFamille)
      + "&actif=" + encodeURIComponent(actif ? "true" : "false")
      + "&pin=" + encodeURIComponent(getAdminPin())
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

    setStatus("Succès : famille mise à jour.", "ok");

    await loadFamilles();
    await loadAdminFamilles();

  } catch (error) {
    console.error(error);
    setStatus("Échec : " + error.message, "ko");
    rawJson.textContent = error.message;
  }
}

async function setEmplacementActive(idEmplacement, actif) {
  setStatus("Mise à jour de l’emplacement " + idEmplacement + "...", "");

  try {
    const url =
      WEB_APP_URL
      + "?action=setEmplacementActive"
      + "&idEmplacement=" + encodeURIComponent(idEmplacement)
      + "&actif=" + encodeURIComponent(actif ? "true" : "false")
      + "&pin=" + encodeURIComponent(getAdminPin())
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

    setStatus("Succès : emplacement mis à jour.", "ok");

    await loadEmplacements();
    await loadAdminEmplacements();

  } catch (error) {
    console.error(error);
    setStatus("Échec : " + error.message, "ko");
    rawJson.textContent = error.message;
  }
}

function isReferenceActive(value) {
  if (value === true) {
    return true;
  }

  const text = String(value).trim().toUpperCase();
  return text === "TRUE" || text === "VRAI" || text === "1" || text === "OUI" || text === "YES";
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

    function getAdminPin() {
    return document.getElementById("adminPin").value.trim();
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
        equipementsBody.innerHTML = "<tr><td colspan='10'>Aucun équipement trouvé.</td></tr>";
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
            <a href="fiche.html?id=${encodeURIComponent(equipement.id || "")}" target="_blank">
              <button type="button" class="btn-secondary">Fiche</button>
            </a>
          </td>
          <td>
            <a href="qrcodes.html?id=${encodeURIComponent(equipement.id || "")}" target="_blank">
              <button type="button" class="btn-secondary">QR</button>
            </a>
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
