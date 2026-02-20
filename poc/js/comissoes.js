/* Comissões (POC) — mock de consulta baseado nas propostas importadas */

const PocComissoes = (() => {
  function render() {
    const wrap = document.getElementById("comissoesWrap");
    const empty = document.getElementById("comissoesEmpty");
    const data = Poc.loadImport();
    const list = data?.propostas || [];

    if (!list.length) {
      wrap.innerHTML = "";
      empty.style.display = "block";
      return;
    }
    empty.style.display = "none";

    // POC: regra mock 1% do valor financiado
    const rows = list
      .slice(0, 120)
      .map((p) => {
        const base = p.valorFinanciado ?? 0;
        const valor = base * 0.01;
        return `<tr>
          <td>${Poc.escapeHtml(p.codigoProposta)}</td>
          <td>${Poc.escapeHtml(p.banco ?? "—")}</td>
          <td>${Poc.formatMoneyBR(base)}</td>
          <td>${Poc.formatMoneyBR(valor)}</td>
        </tr>`;
      })
      .join("");

    wrap.innerHTML = `
      <div class="badges" style="margin-bottom:10px">
        <span class="badge">Regra (mock): <strong>1%</strong> do Valor Financiado</span>
        <span class="badge badge--bad">Atenção: fórmula final ainda não definida</span>
      </div>
      <div class="tableWrap">
        <table>
          <thead>
            <tr>
              <th>Proposta</th>
              <th>Banco</th>
              <th>Base</th>
              <th>Comissão (mock)</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    `;
  }

  function init() {
    render();
  }

  return { init };
})();


