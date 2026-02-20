const PocComissoes = (() => {
  const MATRIX_KEY = "poc_commission_matrix";

  function getMatrix() {
    const raw = localStorage.getItem(MATRIX_KEY);
    return raw ? JSON.parse(raw) : {};
  }

  function saveMatrix(data) {
    localStorage.setItem(MATRIX_KEY, JSON.stringify(data));
  }

  function renderMatrix() {
    const wrap = document.getElementById("comissoesWrap");
    const empty = document.getElementById("comissoesEmpty");
    const products = Poc.getProducts();
    const matrix = getMatrix();

    if (products.length === 0) {
      wrap.innerHTML = "";
      empty.style.display = "block";
      return;
    }
    empty.style.display = "none";

    const roles = ["Consultor", "Operador", "Smart"];

    let html = `
      <div class="matrix-wrap">
        <table class="matrix-table">
          <thead>
            <tr>
              <th>Perfil / Produto</th>
              ${products.map(p => `<th>${Poc.escapeHtml(p.nome)}</th>`).join("")}
            </tr>
          </thead>
          <tbody>
    `;

    roles.forEach(role => {
      html += `<tr><td>${role}</td>`;
      products.forEach(p => {
        const val = matrix[`${role}_${p.id}`] || "";
        html += `
          <td>
            <input type="text" 
                   data-role="${role}" 
                   data-pid="${p.id}" 
                   value="${val}" 
                   placeholder="—"
                   onchange="PocComissoes.handleUpdate(this)" />
          </td>
        `;
      });
      html += `</tr>`;
    });

    html += `</tbody></table></div>`;
    wrap.innerHTML = html;
  }

  function handleUpdate(input) {
    const role = input.dataset.role;
    const pid = input.dataset.pid;
    const val = input.value.trim();

    const matrix = getMatrix();
    matrix[`${role}_${pid}`] = val;
    saveMatrix(matrix);

    Poc.toast(`Salvo: ${role} para este produto.`, "ok");
  }

  function init() {
    renderMatrix();
  }

  return { init, handleUpdate };
})();
