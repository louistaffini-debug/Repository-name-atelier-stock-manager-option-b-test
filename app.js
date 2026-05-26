    const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbzOy3GzEra_cO88DLC9bbqwwgUKXjJFZuIPI9rMXwWl1Q63zNaZmt4v3fR2vEppHX7BYg/exec";

    const DATA_SOURCE = getDataSource();
    const IS_GRIST_MODE = DATA_SOURCE === "grist";

    const STATUTS = [
      "Disponible",
      "Utilisé",
      "Maintenance",
      "Hors service"
    ];

    let familles = [];
    let emplacements = [];
    let currentEquipements = [];
    let currentView = "cards";

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
    const searchInput = document.getElementById("searchInput");
    const statusFilter = document.getElementById("statusFilter");
    const familleFilter = document.getElementById("familleFilter");
    const cardsView = document.getElementById("cardsView");
    const tableView = document.getElementById("tableView");
    const viewCardsButton = document.getElementById("viewCardsButton");
    const viewTableButton = document.getElementById("viewTableButton");
    const magasinPreview = document.getElementById("magasinPreview");

    loadButton.addEventListener("click", loadEquipements);
    historyButton.addEventListener("click", loadHistorique);
    refreshAllButton.addEventListener("click", refreshAll);
    addEquipementForm.addEventListener("submit", addEquipement);
    addFamilleForm.addEventListener("submit", addFamille);
    addEmplacementForm.addEventListener("submit", addEmplacement);

    loadAdminReferentielsButton.addEventListener("click", loadAdminReferentiels);

    if (searchInput) searchInput.addEventListener("input", refreshEquipementViews);
    if (statusFilter) statusFilter.addEventListener("change", refreshEquipementViews);
    if (familleFilter) familleFilter.addEventListener("change", refreshEquipementViews);
    if (viewCardsButton) viewCardsButton.addEventListener("click", () => setEquipmentView("cards"));
    if (viewTableButton) viewTableButton.addEventListener("click", () => setEquipmentView("table"));
    document.querySelectorAll(".module-tab").forEach(button => {
      button.addEventListener("click", () => setModuleBoard(button.dataset.board));
    });
    initSourceMode();
    loadReferentiels();


function getDataSource() {
  const params = new URLSearchParams(window.location.search);
  return params.get("source") === "sheet" ? "sheet" : "grist";
}

function buildApiUrl(action, params = {}) {
  const searchParams = new URLSearchParams();
  searchParams.set("action", action);

  Object.keys(params).forEach(key => {
    if (params[key] !== undefined && params[key] !== null) {
      searchParams.set(key, params[key]);
    }
  });

  searchParams.set("t", Date.now());
  return WEB_APP_URL + "?" + searchParams.toString();
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
  }

  return url.pathname.split("/").pop() + url.search;
}

function initSourceMode() {
  const subtitle = document.querySelector(".subtitle");
  if (subtitle) {
    subtitle.textContent = IS_GRIST_MODE
      ? "Atelier Stock Manager - Mode Grist officiel"
      : "Atelier Stock Manager - Mode secours Google Sheet";
  }

  const statusInfo = document.querySelector("#status")?.nextElementSibling;
  if (statusInfo) {
    statusInfo.textContent = IS_GRIST_MODE
      ? "Version attendue API : 1.0.0 - Source : Grist officiel"
      : "Version attendue API : 1.0.0 - Source : Google Sheet secours";
  }

  const modeBar = document.createElement("div");
  modeBar.className = IS_GRIST_MODE ? "source-banner source-grist" : "source-banner source-sheet";
  modeBar.innerHTML = IS_GRIST_MODE
    ? "Mode actif : <strong>Grist officiel</strong>. Base principale de l’application atelier."
    : "Mode secours : <strong>Google Sheet</strong>. À utiliser uniquement en repli temporaire.";

  const modeSlot = document.querySelector(".mode-slot");
  if (modeSlot) {
    modeSlot.innerHTML = "";
    modeSlot.appendChild(modeBar);
  } else {
    const firstCard = document.querySelector("section.card");
    if (firstCard) {
      firstCard.insertBefore(modeBar, firstCard.firstChild);
    }
  }

  const actions = document.querySelector(".actions");
  if (actions) {
    const gristUrl = new URL(window.location.href);
    gristUrl.searchParams.delete("source");

    const sheetUrl = new URL(window.location.href);
    sheetUrl.searchParams.set("source", "sheet");

    actions.insertAdjacentHTML("beforeend", `
      <a href="${gristUrl.pathname + gristUrl.search}"><button type="button" class="btn-secondary">Mode Grist officiel</button></a>
      <a href="${sheetUrl.pathname + sheetUrl.search}"><button type="button" class="btn-secondary">Mode Sheet secours</button></a>
    `);
  }

  updateInternalLinksForSource();
}

function updateInternalLinksForSource() {
  if (DATA_SOURCE !== "sheet") {
    return;
  }

  document.querySelectorAll('a[href="qrcodes.html"], a[href="diagnostic.html"]').forEach(link => {
    const url = new URL(link.getAttribute("href"), window.location.href);
    url.searchParams.set("source", "sheet");
    link.setAttribute("href", url.pathname.split("/").pop() + url.search);
  });
}

async function loadReferentiels() {
  await loadFamilles();
  await loadEmplacements();
}

async function loadFamilles() {
  try {
    const url = buildApiUrl(IS_GRIST_MODE ? "listFamillesGrist" : "listFamilles");

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
    const url = buildApiUrl(IS_GRIST_MODE ? "listEmplacementsGrist" : "listEmplacements");

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
  if (!select) return;

  select.innerHTML = "";

  if (!familles || familles.length === 0) {
    select.innerHTML = "<option value=''>Aucune famille disponible</option>";
    renderFamillesFilter();
    return;
  }

  select.innerHTML = "<option value=''>Choisir une famille</option>";

  familles.forEach(famille => {
    const option = document.createElement("option");
    option.value = famille.nomFamille;
    option.textContent = famille.nomFamille;
    select.appendChild(option);
  });

  renderFamillesFilter();
}

function renderFamillesFilter() {
  if (!familleFilter) return;
  const current = familleFilter.value;
  familleFilter.innerHTML = "<option value=''>Toutes les familles</option>";
  (familles || []).forEach(famille => {
    const option = document.createElement("option");
    option.value = famille.nomFamille;
    option.textContent = famille.nomFamille;
    familleFilter.appendChild(option);
  });
  familleFilter.value = current;
}

function renderEmplacementsSelect() {
  const select = document.getElementById("newEmplacement");
  if (!select) return;

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

  setStatus(IS_GRIST_MODE ? "Ajout de la famille dans Grist en cours..." : "Ajout de la famille en cours...", "");

  try {
    const nomFamille = document.getElementById("newNomFamille").value.trim();

    const url = buildApiUrl(IS_GRIST_MODE ? "addFamilleGrist" : "addFamille", {
      nomFamille: nomFamille,
      pin: getAdminPin()
    });

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

    setStatus(IS_GRIST_MODE ? "Succès : famille ajoutée dans Grist." : "Succès : famille ajoutée.", "ok");

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

  setStatus(IS_GRIST_MODE ? "Ajout de l’emplacement dans Grist en cours..." : "Ajout de l’emplacement en cours...", "");

  try {
    const nomEmplacement = document.getElementById("newNomEmplacement").value.trim();
    const description = document.getElementById("newDescriptionEmplacement").value.trim();

    const url = buildApiUrl(IS_GRIST_MODE ? "addEmplacementGrist" : "addEmplacement", {
      nomEmplacement: nomEmplacement,
      description: description,
      pin: getAdminPin()
    });

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

    setStatus(IS_GRIST_MODE ? "Succès : emplacement ajouté dans Grist." : "Succès : emplacement ajouté.", "ok");

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
  setStatus(IS_GRIST_MODE ? "Chargement des référentiels admin Grist en cours..." : "Chargement des référentiels admin en cours...", "");

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
  const url = buildApiUrl(IS_GRIST_MODE ? "listFamillesAdminGrist" : "listFamillesAdmin", {
    pin: getAdminPin()
  });

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
  const url = buildApiUrl(IS_GRIST_MODE ? "listEmplacementsAdminGrist" : "listEmplacementsAdmin", {
    pin: getAdminPin()
  });

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
    const url = buildApiUrl(IS_GRIST_MODE ? "setFamilleActiveGrist" : "setFamilleActive", {
      idFamille: idFamille,
      actif: actif ? "true" : "false",
      pin: getAdminPin()
    });

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

    setStatus(IS_GRIST_MODE ? "Succès : famille Grist mise à jour." : "Succès : famille mise à jour.", "ok");

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
    const url = buildApiUrl(IS_GRIST_MODE ? "setEmplacementActiveGrist" : "setEmplacementActive", {
      idEmplacement: idEmplacement,
      actif: actif ? "true" : "false",
      pin: getAdminPin()
    });

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

    setStatus(IS_GRIST_MODE ? "Succès : emplacement Grist mis à jour." : "Succès : emplacement mis à jour.", "ok");

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
        const url = buildApiUrl(IS_GRIST_MODE ? "listEquipementsGrist" : "listEquipements");

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
        const url = buildApiUrl(IS_GRIST_MODE ? "listHistoriqueGrist" : "listHistorique");

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

      setStatus(IS_GRIST_MODE ? "Ajout de l’équipement dans Grist en cours..." : "Ajout de l’équipement en cours...", "");

      try {
        const code = document.getElementById("newCode").value.trim();
        const nom = document.getElementById("newNom").value.trim();
        const famille = document.getElementById("newFamille").value.trim();
        const emplacement = document.getElementById("newEmplacement").value.trim();
        const statut = document.getElementById("newStatut").value;
        const commentaire = document.getElementById("newCommentaire").value.trim();

        const url = buildApiUrl(IS_GRIST_MODE ? "addEquipementGrist" : "addEquipement", {
          code: code,
          nom: nom,
          famille: famille,
          emplacement: emplacement,
          statut: statut,
          commentaire: commentaire,
          pin: getWritePin()
        });

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

        setStatus(IS_GRIST_MODE ? "Succès : équipement ajouté dans Grist." : "Succès : équipement ajouté.", "ok");

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
      currentEquipements = equipements || [];
      refreshEquipementViews();
    }

    function refreshEquipementViews() {
      const equipements = applyEquipementFilters(currentEquipements || []);
      renderEquipementsTable(equipements);
      renderEquipementsCards(equipements);
      updateDashboard(currentEquipements || []);
    }

    function applyEquipementFilters(equipements) {
      const search = (searchInput?.value || "").trim().toLowerCase();
      const statut = statusFilter?.value || "";
      const famille = familleFilter?.value || "";

      return (equipements || []).filter(equipement => {
        const text = [
          equipement.code,
          equipement.nom,
          equipement.famille,
          equipement.emplacement,
          equipement.statut,
          equipement.commentaire
        ].join(" ").toLowerCase();

        const matchSearch = !search || text.includes(search);
        const matchStatut = !statut || String(equipement.statut || "") === statut;
        const matchFamille = !famille || String(equipement.famille || "") === famille;

        return matchSearch && matchStatut && matchFamille;
      });
    }

    function renderEquipementsTable(equipements) {
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
          <td><strong>${escapeHtml(equipement.code)}</strong></td>
          <td>${escapeHtml(equipement.nom)}</td>
          <td>${escapeHtml(equipement.famille)}</td>
          <td>${escapeHtml(equipement.emplacement)}</td>
          <td>${renderStatut(statut)}</td>
          <td>${renderStatutSelect(id, statut, false)}</td>
          <td>
            <input
              id="commentaire-${id}"
              type="text"
              value="${escapeHtml(commentaire)}"
            >
          </td>
          <td>
            <a href="${buildPageUrl("fiche.html", { id: equipement.id || "" })}" target="_blank">
              <button type="button" class="btn-secondary">Fiche</button>
            </a>
          </td>
          <td>
            <a href="${buildPageUrl("qrcodes.html", { id: equipement.id || "" })}" target="_blank">
              <button type="button" class="btn-secondary">QR</button>
            </a>
          </td>
          <td>
            <button onclick="saveStatut('${id}')">${IS_GRIST_MODE ? "Enregistrer" : "Enregistrer"}</button>
          </td>
        `;

        equipementsBody.appendChild(row);
      });
    }

    function renderEquipementsCards(equipements) {
      if (!cardsView) return;
      cardsView.innerHTML = "";

      if (!equipements || equipements.length === 0) {
        cardsView.innerHTML = "<p>Aucun équipement trouvé.</p>";
        return;
      }

      equipements.forEach(equipement => {
        const statut = String(equipement.statut || "");
        const id = String(equipement.id || "");
        const card = document.createElement("article");
        card.className = "equipment-card";
        card.innerHTML = `
          <div class="equipment-visual">
            <div class="equipment-icon">${escapeHtml(getFamilyIcon(equipement.famille))}</div>
          </div>
          <div class="equipment-card-body">
            <div class="equipment-card-head">
              <div>
                <h3>${escapeHtml(equipement.code || id)}</h3>
                <p>${escapeHtml(equipement.nom || "")}</p>
              </div>
              ${renderStatut(statut)}
            </div>
            <div class="card-meta">
              <span>${escapeHtml(equipement.famille || "Non classé")}</span>
              <span>${escapeHtml(equipement.emplacement || "Emplacement à préciser")}</span>
            </div>
            <p class="card-comment">${escapeHtml(equipement.commentaire || "Aucun commentaire")}</p>
            <div class="card-actions">
              <a href="${buildPageUrl("fiche.html", { id })}" target="_blank"><button type="button" class="btn-secondary">Fiche</button></a>
              <a href="${buildPageUrl("qrcodes.html", { id })}" target="_blank"><button type="button" class="btn-secondary">QR</button></a>
            </div>
          </div>
        `;
        cardsView.appendChild(card);
      });
    }

    function updateDashboard(equipements) {
      const counters = {
        total: (equipements || []).length,
        Disponible: 0,
        Utilisé: 0,
        Maintenance: 0,
        "Hors service": 0
      };

      (equipements || []).forEach(equipement => {
        const statut = String(equipement.statut || "");
        if (Object.prototype.hasOwnProperty.call(counters, statut)) {
          counters[statut] += 1;
        }
      });

      setMetric("metricTotal", counters.total);
      setMetric("metricDisponible", counters.Disponible);
      setMetric("metricUtilise", counters.Utilisé);
      setMetric("metricMaintenance", counters.Maintenance);
      setMetric("metricHorsService", counters["Hors service"]);
    }

    function setMetric(id, value) {
      const element = document.getElementById(id);
      if (element) element.textContent = value;
    }

    function getFamilyIcon(famille) {
      const value = String(famille || "").toLowerCase();
      if (value.includes("métro")) return "⌖";
      if (value.includes("outil")) return "⚙";
      if (value.includes("frais")) return "▣";
      if (value.includes("tourn")) return "◉";
      return "◆";
    }

    function setEquipmentView(view) {
      currentView = view;
      if (cardsView) cardsView.hidden = view !== "cards";
      if (tableView) tableView.hidden = view !== "table";
      if (viewCardsButton) viewCardsButton.classList.toggle("active", view === "cards");
      if (viewTableButton) viewTableButton.classList.toggle("active", view === "table");
    }

    function setModuleBoard(board) {
      document.querySelectorAll(".module-tab").forEach(button => {
        button.classList.toggle("active", button.dataset.board === board);
      });

      if (magasinPreview) {
        magasinPreview.hidden = board === "atelier";
      }

      if (board === "magasin" && magasinPreview) {
        magasinPreview.scrollIntoView({ behavior: "smooth", block: "start" });
      }

      if (board === "atelier") {
        document.getElementById("equipementsSection")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
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

    function renderStatutSelect(id, selectedStatut, disabled = false) {
      const options = STATUTS.map(statut => {
        const selected = statut === selectedStatut ? "selected" : "";
        return `<option value="${escapeHtml(statut)}" ${selected}>${escapeHtml(statut)}</option>`;
      }).join("");

      return `
        <select id="statut-${escapeHtml(id)}" ${disabled ? "disabled" : ""}>
          ${options}
        </select>
      `;
    }

    async function saveStatut(id) {
      setStatus((IS_GRIST_MODE ? "Enregistrement Grist en cours pour " : "Enregistrement en cours pour ") + id + "...", "");

      try {
        const statut = document.getElementById("statut-" + id).value;
        const commentaire = document.getElementById("commentaire-" + id).value;

        const url = buildApiUrl(IS_GRIST_MODE ? "updateStatutGrist" : "updateStatut", {
          id: id,
          statut: statut,
          commentaire: commentaire,
          pin: getWritePin()
        });

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
