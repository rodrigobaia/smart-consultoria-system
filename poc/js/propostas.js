/* Propostas (POC) — renderiza dados normalizados vindos do localStorage (pós-importação) */

const PocPropostas = (() => {
  function renderPropostas(data) {
    const wrap = document.getElementById("propostasTableWrap");
    const empty = document.getElementById("propostasEmpty");
    const detail = document.getElementById("propostaDetail");

    const search = (document.getElementById("propostaSearch").value || "").trim().toLowerCase();
    const list = data?.propostas || [];

    if (!list.length) {
      wrap.innerHTML = "";
      detail.classList.add("card--hidden");
      empty.style.display = "block";
      return;
    }
    empty.style.display = "none";

    const filtered = !search
      ? list
      : list.filter((p) => {
          const hay = `${p.codigoProposta} ${p.loja ?? ""} ${p.cnpjLoja ?? ""} ${p.banco ?? ""} ${p.status ?? ""}`.toLowerCase();
          return hay.includes(search);
        });

    const rows = filtered
      .slice(0, 400)
      .map((p) => {
        return `<tr>
          <td><a class="link" data-codigo="${Poc.escapeHtml(p.codigoProposta)}">${Poc.escapeHtml(p.codigoProposta)}</a></td>
          <td>${Poc.escapeHtml(p.loja ?? "—")}</td>
          <td>${Poc.escapeHtml(p.cnpjLoja ?? "—")}</td>
          <td>${Poc.escapeHtml(p.banco ?? "—")}</td>
          <td>${Poc.formatMoneyBR(p.valorFinanciado)}</td>
          <td>${Poc.escapeHtml(p.status ?? "—")}</td>
          <td>${p.itens?.length || 0}</td>
        </tr>`;
      })
      .join("");

    wrap.innerHTML = `
      <div class="tableWrap">
        <table>
          <thead>
            <tr>
              <th>Código</th>
              <th>Loja</th>
              <th>CNPJ</th>
              <th>Banco</th>
              <th>Valor Financiado</th>
              <th>Status</th>
              <th>Itens</th>
            </tr>
          </thead>
          <tbody>${rows || `<tr><td colspan="7" class="muted">Nenhum resultado.</td></tr>`}</tbody>
        </table>
      </div>
      <div class="muted" style="margin-top:8px;">
        Mostrando ${Math.min(filtered.length, 400)} de ${filtered.length} propostas (POC).
      </div>
    `;

    wrap.querySelectorAll("a.link[data-codigo]").forEach((a) => {
      a.addEventListener("click", () => showDetail(data, a.getAttribute("data-codigo")));
    });
  }

  function showDetail(data, codigo) {
    const p = (data?.propostas || []).find((x) => x.codigoProposta === codigo);
    if (!p) return;
    const el = document.getElementById("propostaDetail");
    el.classList.remove("card--hidden");

    const itens = p.itens || [];
    const itensRows = itens
      .slice(0, 200)
      .map((it) => {
        return `<tr>
          <td>${Poc.escapeHtml(it.tipo ?? "—")}</td>
          <td>${Poc.escapeHtml(it.codigoItem ?? "—")}</td>
          <td>${Poc.escapeHtml(it.fornecedor ?? "—")}</td>
          <td>${Poc.escapeHtml(it.descricao ?? "—")}</td>
          <td>${it.quantidade ?? "—"}</td>
          <td>${Poc.formatMoneyBR(it.valorUnitario)}</td>
          <td>${it.cortesia ? "Sim" : "Não"}</td>
        </tr>`;
      })
      .join("");

    el.innerHTML = `
      <div class="row row--between row--wrap">
        <div>
          <h2 style="margin:0; font-size:16px;">Detalhe — Proposta ${Poc.escapeHtml(p.codigoProposta)}</h2>
          <div class="muted">${Poc.escapeHtml(p.loja ?? "—")} • ${Poc.escapeHtml(p.banco ?? "—")}</div>
        </div>
        <div class="badges">
          <span class="badge">Itens: <strong>${itens.length}</strong></span>
          <span class="badge">Valor Financiado: <strong>${Poc.formatMoneyBR(p.valorFinanciado)}</strong></span>
        </div>
      </div>

      <div class="grid grid--2" style="margin-top:10px;">
        <div class="kpiCard">
          <div class="kpiCard__label">CNPJ Loja</div>
          <div class="kpiCard__value" style="font-size:16px;">${Poc.escapeHtml(p.cnpjLoja ?? "—")}</div>
        </div>
        <div class="kpiCard">
          <div class="kpiCard__label">Status</div>
          <div class="kpiCard__value" style="font-size:16px;">${Poc.escapeHtml(p.status ?? "—")}</div>
        </div>
      </div>

      <div style="margin-top:12px" class="tableWrap">
        <table>
          <thead>
            <tr>
              <th>Tipo</th>
              <th>Código</th>
              <th>Fornecedor</th>
              <th>Descrição</th>
              <th>Qtd</th>
              <th>Valor Unit.</th>
              <th>Cortesia</th>
            </tr>
          </thead>
          <tbody>${itensRows || `<tr><td colspan="7" class="muted">Sem itens.</td></tr>`}</tbody>
        </table>
      </div>
    `;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function init() {
    const data = Poc.loadImport();
    document.getElementById("propostaSearch").addEventListener("input", () => renderPropostas(Poc.loadImport()));
    renderPropostas(data);
  }

  return { init };
})();


