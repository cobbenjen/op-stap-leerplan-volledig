const faseSelect = document.getElementById("faseSelect");
const domeinSelect = document.getElementById("domeinSelect");
const subdomeinSelect = document.getElementById("subdomeinSelect");
const leerplanSelect = document.getElementById("leerplanSelect");
const showButton = document.getElementById("showButton");
const resetButton = document.getElementById("resetButton");
const statusEl = document.getElementById("status");
const tableWrapper = document.getElementById("tableWrapper");
const resultBody = document.getElementById("resultBody");

let rows = [];
const DATA_FILES = {
  wiskunde: "./data.json",
  "nederlands-en-communicatie": "./data2.json",
};

function normalizeValue(value) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function uniqSorted(values) {
  return [...new Set(values.filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, "nl")
  );
}

function getSelectedFilters() {
  return {
    fase: faseSelect.value,
    domein: domeinSelect.value,
    subdomein: subdomeinSelect.value,
  };
}

function matchRow(row, filters) {
  if (filters.fase && row.fase !== filters.fase) return false;
  if (filters.domein && row.domein !== filters.domein) return false;
  if (filters.subdomein && row.subdomein !== filters.subdomein) return false;
  return true;
}

function setSelectOptions(selectEl, values, placeholder, selectedValue = "") {
  const previousValue = normalizeValue(selectedValue);
  selectEl.innerHTML = "";

  const placeholderOption = document.createElement("option");
  placeholderOption.value = "";
  placeholderOption.textContent = placeholder;
  selectEl.appendChild(placeholderOption);

  for (const value of values) {
    const normalized = normalizeValue(value);
    if (!normalized) continue;
    const option = document.createElement("option");
    option.value = normalized;
    option.textContent = normalized;
    selectEl.appendChild(option);
  }

  const hasPrevious = previousValue && values.map(normalizeValue).includes(previousValue);
  if (hasPrevious) {
    selectEl.value = previousValue;
  } else {
    selectEl.value = "";
  }
}

function updateFilterOptions(changedFilterName = "") {
  const selected = getSelectedFilters();

  const rowsForFase = rows.filter((row) => {
    if (selected.domein && row.domein !== selected.domein) return false;
    if (selected.subdomein && row.subdomein !== selected.subdomein) return false;
    return true;
  });
  const rowsForDomein = rows.filter((row) => {
    if (selected.fase && row.fase !== selected.fase) return false;
    if (selected.subdomein && row.subdomein !== selected.subdomein) return false;
    return true;
  });
  const rowsForSubdomein = rows.filter((row) => {
    if (selected.fase && row.fase !== selected.fase) return false;
    if (selected.domein && row.domein !== selected.domein) return false;
    return true;
  });

  const faseOptions = uniqSorted(rowsForFase.map((row) => row.fase));
  const domeinOptions = uniqSorted(rowsForDomein.map((row) => row.domein));
  const subdomeinOptions = uniqSorted(rowsForSubdomein.map((row) => row.subdomein));

  setSelectOptions(faseSelect, faseOptions, "Alle fases", selected.fase);
  setSelectOptions(domeinSelect, domeinOptions, "Alle domeinen", selected.domein);
  setSelectOptions(
    subdomeinSelect,
    subdomeinOptions,
    "Alle subdomeinen",
    selected.subdomein
  );

  if (changedFilterName) {
    clearResultsToNeutralState();
  }
}

function renderTable(filteredRows) {
  resultBody.innerHTML = "";
  const fragment = document.createDocumentFragment();

  for (const row of filteredRows) {
    const tr = document.createElement("tr");
    tr.className = "hover:bg-slate-50";

    const tdI = document.createElement("td");
    tdI.className = "px-4 py-3 text-slate-800";
    tdI.textContent = row.colI || "-";

    const tdJ = document.createElement("td");
    tdJ.className = "px-4 py-3 text-slate-800";
    tdJ.textContent = row.colJ || "-";

    const tdK = document.createElement("td");
    tdK.className = "px-4 py-3 text-slate-800";
    tdK.textContent = row.colK || "-";

    tr.append(tdI, tdJ, tdK);
    fragment.appendChild(tr);
  }

  resultBody.appendChild(fragment);
}

function setStatusMessage(message, kind = "neutral") {
  const base =
    "rounded-xl border p-6 text-center text-sm";
  const styleByKind = {
    neutral: "border-dashed border-slate-300 bg-slate-50 text-slate-600",
    success: "border-emerald-200 bg-emerald-50 text-emerald-800",
    warning: "border-amber-200 bg-amber-50 text-amber-800",
    error: "border-red-200 bg-red-50 text-red-800",
  };

  statusEl.className = `${base} ${styleByKind[kind] || styleByKind.neutral}`;
  statusEl.textContent = message;
}

function clearResultsToNeutralState() {
  tableWrapper.classList.add("hidden");
  resultBody.innerHTML = "";
  statusEl.classList.remove("hidden");
  setStatusMessage("Kies filters en klik op Gegevens tonen om resultaten te zien.");
}

function showResults() {
  const filters = getSelectedFilters();
  const filteredRows = rows.filter((row) => matchRow(row, filters));

  if (filteredRows.length === 0) {
    tableWrapper.classList.add("hidden");
    resultBody.innerHTML = "";
    statusEl.classList.remove("hidden");
    setStatusMessage("Geen resultaten voor de huidige selectie.", "warning");
    return;
  }

  renderTable(filteredRows);
  tableWrapper.classList.remove("hidden");
  statusEl.classList.remove("hidden");
  setStatusMessage(`${filteredRows.length} resultaat/resultaten gevonden.`, "success");
}

function resetFilters() {
  faseSelect.value = "";
  domeinSelect.value = "";
  subdomeinSelect.value = "";
  updateFilterOptions("");
  clearResultsToNeutralState();
}

function getSelectedDataFile() {
  const rawValue = normalizeValue(leerplanSelect?.value).toLowerCase();
  const normalizedValue = rawValue
    .replaceAll("&", "en")
    .replaceAll("/", "-")
    .replaceAll(/\s+/g, "-");

  if (DATA_FILES[normalizedValue]) {
    return DATA_FILES[normalizedValue];
  }

  if (normalizedValue.includes("nederlands")) {
    return "./data2.json";
  }

  return "./data.json";
}

async function loadData() {
  const dataFile = getSelectedDataFile();
  try {
    const response = await fetch(dataFile, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const raw = await response.json();
    if (!Array.isArray(raw)) {
      throw new Error("Ongeldige datastructuur");
    }

    rows = raw.map((item) => ({
      fase: normalizeValue(item.fase),
      domein: normalizeValue(item.domein),
      subdomein: normalizeValue(item.subdomein),
      colI: normalizeValue(item.colI),
      colJ: normalizeValue(item.colJ),
      colK: normalizeValue(item.colK),
    }));

    updateFilterOptions("");
    clearResultsToNeutralState();
  } catch (error) {
    tableWrapper.classList.add("hidden");
    resultBody.innerHTML = "";
    statusEl.classList.remove("hidden");
    setStatusMessage(
      "Data laden mislukt. Controleer of het gekozen JSON-bestand aanwezig en geldig is.",
      "error"
    );
    console.error(`Fout bij laden van ${dataFile}:`, error);
  }
}

faseSelect.addEventListener("change", () => updateFilterOptions("fase"));
domeinSelect.addEventListener("change", () => updateFilterOptions("domein"));
subdomeinSelect.addEventListener("change", () => updateFilterOptions("subdomein"));
showButton.addEventListener("click", showResults);
resetButton.addEventListener("click", resetFilters);
if (leerplanSelect) {
  leerplanSelect.addEventListener("change", async () => {
    faseSelect.value = "";
    domeinSelect.value = "";
    subdomeinSelect.value = "";
    await loadData();
  });
}

loadData();
