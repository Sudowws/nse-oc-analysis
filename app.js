function parseCsv(text) {
  // Simple CSV parser (works for your numeric table)
  const lines = text.trim().split(/\r?\n/);
  return lines.map(l => l.split(","));
}

function toNum(x) {
  const n = Number(String(x).trim());
  return Number.isFinite(n) ? n : 0;
}

function renderTable(rows) {
  const [hdr, ...data] = rows;
  const tbl = document.getElementById("tbl");

  let html = "<thead><tr>";
  for (const h of hdr) html += `<th class="${h.includes('expiry') ? 'left':''}">${h}</th>`;
  html += "</tr></thead><tbody>";

  for (const r of data) {
    html += "<tr>";
    r.forEach((v, i) => {
      const isLeft = (hdr[i] === "expiryDate");
      html += `<td class="${isLeft ? 'left':''}">${v}</td>`;
    });
    html += "</tr>";
  }
  html += "</tbody>";
  tbl.innerHTML = html;
}

function computeKpis(rows) {
  const [hdr, ...data] = rows;
  const col = (name) => hdr.indexOf(name);

  const iCE = col("CE_oi");
  const iPE = col("PE_oi");
  const iCEchg = col("CE_chgOi");
  const iPEchg = col("PE_chgOi");

  let ceOi = 0, peOi = 0, ceChg = 0, peChg = 0;
  for (const r of data) {
    ceOi += toNum(r[iCE]);
    peOi += toNum(r[iPE]);
    ceChg += toNum(r[iCEchg]);
    peChg += toNum(r[iPEchg]);
  }

  const pcr = ceOi ? (peOi / ceOi) : 0;
  const pcrChg = ceChg ? (peChg / ceChg) : 0;

  return { ceOi, peOi, pcr, ceChg, peChg, pcrChg };
}

async function loadCsv(url) {
  const status = document.getElementById("status");
  status.textContent = "Loading…";

  const r = await fetch(url, { cache: "no-store" });
  if (!r.ok) throw new Error("CSV fetch failed: " + r.status);

  const text = await r.text();
  const rows = parseCsv(text);

  renderTable(rows);

  const k = computeKpis(rows);
  document.getElementById("kpiText").innerHTML = `
    Total CE OI: <b>${Math.round(k.ceOi).toLocaleString()}</b><br/>
    Total PE OI: <b>${Math.round(k.peOi).toLocaleString()}</b><br/>
    PCR (OI): <b>${k.pcr.toFixed(3)}</b><br/>
    PCR (ChgOI): <b>${k.pcrChg.toFixed(3)}</b>
  `;

  status.textContent = "Loaded: " + new Date().toLocaleString();
}

document.getElementById("loadBtn").addEventListener("click", async () => {
  try {
    const url = document.getElementById("csvUrl").value.trim();
    await loadCsv(url);
  } catch (e) {
    document.getElementById("status").textContent = "Error: " + e.message;
  }
});

// convenience: keep the URL in localStorage
const key = "oc_csv_url";
const csvUrl = document.getElementById("csvUrl");
csvUrl.value = localStorage.getItem(key) || "";
csvUrl.addEventListener("change", () => localStorage.setItem(key, csvUrl.value));
