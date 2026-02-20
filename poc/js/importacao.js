/* Importação (POC) — lê Vendas/Itens no browser, faz staging e cruza por Código da Proposta
 * Persistência: salva resultado em localStorage via Poc.saveImport()
 */

const PocImportacao = (() => {
  function parseCsvSemicolon(text) {
    const lines = String(text ?? "")
      .replaceAll("\r\n", "\n")
      .replaceAll("\r", "\n")
      .split("\n")
      .map((x) => x.trimEnd())
      .filter((x) => x.length > 0);

    if (lines.length === 0) return { header: [], rows: [] };
    const header = lines[0].split(";").map((h) => h.trim());
    const rows = [];
    for (let i = 1; i < lines.length; i++) rows.push(lines[i].split(";"));
    return { header, rows };
  }

  function findColumnIndex(header, candidates) {
    const normHeader = header.map(Poc.normalizeHeader);
    for (const cand of candidates) {
      const idx = normHeader.findIndex((h) => h === cand || h.includes(cand));
      if (idx >= 0) return idx;
    }
    return -1;
  }

  async function readFileAsText(file, encoding) {
    if (!file) return "";
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result ?? ""));
      reader.onerror = () => reject(reader.error || new Error("Falha ao ler arquivo"));
      try {
        reader.readAsText(file, encoding);
      } catch {
        reader.readAsText(file);
      }
    });
  }

  function buildStagingRows({ header, rows }, kind) {
    const idxCodigo = findColumnIndex(header, ["cod da proposta", "c d da proposta", "codigo da proposta"]);
    const idxChassi = findColumnIndex(header, ["chassi"]);
    const result = [];
    const errors = [];

    for (let i = 0; i < rows.length; i++) {
      const cols = rows[i];
      const codigo = idxCodigo >= 0 ? Poc.safeStr(cols[idxCodigo]) : null;
      const chassi = idxChassi >= 0 ? Poc.safeStr(cols[idxChassi]) : null;
      const rowNum = i + 2;

      if (!codigo) {
        errors.push({ kind, line: rowNum, message: "Código da Proposta ausente (necessário para cruzamento)." });
      }
      result.push({ kind, line: rowNum, codigoProposta: codigo, chassi, cols });
    }

    return { staging: result, errors, header };
  }

  function normalizeFromVendas(vendasStagingInfo) {
    const { header, staging } = vendasStagingInfo;
    const idxCodigo = findColumnIndex(header, ["cod da proposta", "codigo da proposta"]);
    const idxLoja = findColumnIndex(header, ["loja"]);
    const idxCnpjLoja = findColumnIndex(header, ["cnpj loja", "cnpj"]);
    const idxBanco = findColumnIndex(header, ["banco"]);
    const idxValorFin = findColumnIndex(header, ["valor financiado"]);
    const idxStatus = findColumnIndex(header, ["situacao"]);

    const propostasByCodigo = new Map();
    for (const r of staging) {
      const codigo = idxCodigo >= 0 ? Poc.safeStr(r.cols[idxCodigo]) : r.codigoProposta;
      if (!codigo) continue;
      if (propostasByCodigo.has(codigo)) continue;
      propostasByCodigo.set(codigo, {
        codigoProposta: codigo,
        loja: idxLoja >= 0 ? Poc.safeStr(r.cols[idxLoja]) : null,
        cnpjLoja: idxCnpjLoja >= 0 ? Poc.safeStr(r.cols[idxCnpjLoja]) : null,
        banco: idxBanco >= 0 ? Poc.safeStr(r.cols[idxBanco]) : null,
        valorFinanciado: idxValorFin >= 0 ? Poc.parsePtBrNumber(r.cols[idxValorFin]) : null,
        status: idxStatus >= 0 ? Poc.safeStr(r.cols[idxStatus]) : null,
        itens: [],
      });
    }
    return propostasByCodigo;
  }

  function attachItensToPropostas(itensStagingInfo, propostasByCodigo) {
    const { header, staging } = itensStagingInfo;
    const idxCodigo = findColumnIndex(header, ["cod da proposta", "codigo da proposta"]);
    const idxTipo = findColumnIndex(header, ["tipo"]);
    const idxCodItem = findColumnIndex(header, ["codigo"]);
    const idxFornecedor = findColumnIndex(header, ["fornecedor"]);
    const idxDesc = findColumnIndex(header, ["descricao"]);
    const idxQtd = findColumnIndex(header, ["quantidade"]);
    const idxVlrUnit = findColumnIndex(header, ["valor unitario"]);
    const idxCortesia = findColumnIndex(header, ["cortesia"]);

    const pending = [];
    for (const r of staging) {
      const codigo = idxCodigo >= 0 ? Poc.safeStr(r.cols[idxCodigo]) : r.codigoProposta;
      if (!codigo) continue;

      const item = {
        codigoProposta: codigo,
        tipo: idxTipo >= 0 ? Poc.safeStr(r.cols[idxTipo]) : null,
        codigoItem: idxCodItem >= 0 ? Poc.safeStr(r.cols[idxCodItem]) : null,
        fornecedor: idxFornecedor >= 0 ? Poc.safeStr(r.cols[idxFornecedor]) : null,
        descricao: idxDesc >= 0 ? Poc.safeStr(r.cols[idxDesc]) : null,
        quantidade: idxQtd >= 0 ? Poc.parsePtBrNumber(r.cols[idxQtd]) : null,
        valorUnitario: idxVlrUnit >= 0 ? Poc.parsePtBrNumber(r.cols[idxVlrUnit]) : null,
        cortesia: idxCortesia >= 0 ? String(r.cols[idxCortesia] ?? "").trim().toLowerCase() === "s" : false,
        line: r.line,
      };

      const prop = propostasByCodigo.get(codigo);
      if (!prop) {
        pending.push({ kind: "Itens", line: r.line, codigoProposta: codigo, message: "Item sem Venda correspondente no mesmo lote (pendente)." });
        continue;
      }
      prop.itens.push(item);
    }
    return pending;
  }

  function renderSummary(data) {
    const el = document.getElementById("importSummary");
    el.classList.remove("card--hidden");
    const errors = data.errors.length;
    const pending = data.pending.length;
    el.innerHTML = `
      <h2 style="margin:0 0 10px 0; font-size:16px;">Resumo do lote (POC)</h2>
      <div class="kpi">
        <div class="kpiCard"><div class="kpiCard__label">Linhas Vendas (staging)</div><div class="kpiCard__value">${data.vendasRaw.length}</div></div>
        <div class="kpiCard"><div class="kpiCard__label">Linhas Itens (staging)</div><div class="kpiCard__value">${data.itensRaw.length}</div></div>
        <div class="kpiCard"><div class="kpiCard__label">Erros</div><div class="kpiCard__value" style="color:${errors ? "var(--danger)" : "var(--ok)"}">${errors}</div></div>
        <div class="kpiCard"><div class="kpiCard__label">Pendências</div><div class="kpiCard__value" style="color:${pending ? "var(--danger)" : "var(--ok)"}">${pending}</div></div>
      </div>
      <div style="margin-top:10px" class="badges">
        <span class="badge badge--ok">Propostas normalizadas: <strong>${data.propostas.length}</strong></span>
        <span class="badge">Encoding: <strong>${Poc.escapeHtml(data.encoding)}</strong></span>
      </div>
    `;
  }

  function renderStaging(kind, containerId, stagingInfo) {
    const container = document.querySelector(containerId);
    container.classList.remove("card--hidden");

    const preview = stagingInfo.staging.slice(0, 8);
    const rowsHtml = preview
      .map((r) => `<tr><td>${r.line}</td><td>${Poc.escapeHtml(r.codigoProposta ?? "—")}</td><td>${Poc.escapeHtml(r.chassi ?? "—")}</td></tr>`)
      .join("");

    const errors = stagingInfo.errors;
    const errHtml = errors.length
      ? `<div class="badges" style="margin-top:8px;"><span class="badge badge--bad">Erros: <strong>${errors.length}</strong></span></div>
         <ul class="bullets">${errors
           .slice(0, 6)
           .map((e) => `<li><strong>Linha ${e.line}:</strong> ${Poc.escapeHtml(e.message)}</li>`)
           .join("")}</ul>`
      : `<div class="badges" style="margin-top:8px;"><span class="badge badge--ok">Sem erros de chave (POC)</span></div>`;

    container.innerHTML = `
      <h2 style="margin:0 0 10px 0; font-size:16px;">Staging — ${Poc.escapeHtml(kind)}</h2>
      <div class="muted">Preview (primeiras ${preview.length} linhas)</div>
      <div class="tableWrap" style="margin-top:10px;">
        <table>
          <thead><tr><th>Linha</th><th>Código Proposta</th><th>Chassi</th></tr></thead>
          <tbody>${rowsHtml}</tbody>
        </table>
      </div>
      ${errHtml}
    `;
  }

  function renderCross(data) {
    const container = document.getElementById("importCross");
    container.classList.remove("card--hidden");

    const pend = data.pending.slice(0, 10);
    const pendHtml = pend.length
      ? `<ul class="bullets">${pend
          .map((p) => `<li><strong>${Poc.escapeHtml(p.codigoProposta)}</strong> (linha ${p.line}): ${Poc.escapeHtml(p.message)}</li>`)
          .join("")}</ul>`
      : `<div class="badges"><span class="badge badge--ok">Nenhuma pendência de cruzamento (POC)</span></div>`;

    container.innerHTML = `
      <h2 style="margin:0 0 10px 0; font-size:16px;">Cruzamento (Vendas × Itens)</h2>
      <div class="badges">
        <span class="badge ${data.errors.length ? "badge--bad" : "badge--ok"}">Erros de chave: <strong>${data.errors.length}</strong></span>
        <span class="badge ${data.pending.length ? "badge--bad" : "badge--ok"}">Itens sem venda: <strong>${data.pending.length}</strong></span>
      </div>
      <div style="margin-top:8px" class="muted">Pendências (preview)</div>
      ${pendHtml}
      <div class="actions">
        <a class="btn btn--primary" href="./propostas.html">Ver Propostas</a>
      </div>
    `;
  }

  function clearUi() {
    document.getElementById("importSummary").classList.add("card--hidden");
    document.getElementById("importStagingVendas").classList.add("card--hidden");
    document.getElementById("importStagingItens").classList.add("card--hidden");
    document.getElementById("importCross").classList.add("card--hidden");
  }

  async function processImport() {
    const fV = document.getElementById("fileVendas").files?.[0] || null;
    const fI = document.getElementById("fileItens").files?.[0] || null;
    if (!fV || !fI) {
      Poc.toast("Selecione os dois arquivos (Vendas.csv e Itens.csv).", "bad");
      return;
    }

    clearUi();
    const encoding = document.getElementById("importEncoding").value || "utf-8";
    try {
      const [vText, iText] = await Promise.all([readFileAsText(fV, encoding), readFileAsText(fI, encoding)]);
      const vendasCsv = parseCsvSemicolon(vText);
      const itensCsv = parseCsvSemicolon(iText);

      const vendasStagingInfo = buildStagingRows(vendasCsv, "Vendas");
      const itensStagingInfo = buildStagingRows(itensCsv, "Itens");

      const propostasByCodigo = normalizeFromVendas(vendasStagingInfo);
      const pending = attachItensToPropostas(itensStagingInfo, propostasByCodigo);
      const propostas = [...propostasByCodigo.values()].sort((a, b) => String(a.codigoProposta).localeCompare(String(b.codigoProposta)));

      const data = {
        encoding,
        vendasRaw: vendasStagingInfo.staging,
        itensRaw: itensStagingInfo.staging,
        errors: [...vendasStagingInfo.errors, ...itensStagingInfo.errors],
        pending,
        propostas,
      };

      Poc.saveImport(data);

      renderSummary(data);
      renderStaging("Vendas", "#importStagingVendas", vendasStagingInfo);
      renderStaging("Itens", "#importStagingItens", itensStagingInfo);
      renderCross(data);

      Poc.toast("Importação processada e salva (POC).", "ok");
    } catch (e) {
      console.error(e);
      Poc.toast(`Falha ao processar: ${e?.message || e}`, "bad");
    }
  }

  function init() {
    document.getElementById("btnProcessar").addEventListener("click", processImport);
    document.getElementById("btnLimpar").addEventListener("click", () => {
      document.getElementById("fileVendas").value = "";
      document.getElementById("fileItens").value = "";
      Poc.clearImport();
      clearUi();
      Poc.toast("Importação limpa.", "ok");
    });
  }

  return { init };
})();


