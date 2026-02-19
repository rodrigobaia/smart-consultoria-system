/* CRUD genérico (POC) — render simples para cadastros em HTML/JS
 * Usa PocStore (localStorage) para persistência.
 */

const PocCrudPage = (() => {
  function render({ entityKey, title, fields }) {
    const root = document.getElementById("crudRoot");
    if (!root) throw new Error("Faltou <div id=\"crudRoot\"></div> na página.");

    const list = PocStore.load(entityKey);

    const formFieldsHtml = fields
      .map((f) => {
        const id = `f_${f.key}`;
        const type = f.type || "text";
        const placeholder = f.placeholder || "";
        return `
          <label class="field">
            <span>${Poc.escapeHtml(f.label)}</span>
            <input id="${id}" type="${type}" placeholder="${Poc.escapeHtml(placeholder)}" autocomplete="off" />
          </label>
        `;
      })
      .join("");

    const rowsHtml = list
      .slice(0, 500)
      .map((item) => {
        const cols = fields
          .map((f) => `<td>${Poc.escapeHtml(item[f.key] ?? "—")}</td>`)
          .join("");
        return `
          <tr>
            ${cols}
            <td style="white-space:nowrap;">
              <button class="btn btn--ghost" data-del="${Poc.escapeHtml(item.id)}">Excluir</button>
            </td>
          </tr>
        `;
      })
      .join("");

    root.innerHTML = `
      <div class="card">
        <div class="row row--between row--wrap">
          <div>
            <h1>${Poc.escapeHtml(title)}</h1>
            <p class="muted">CRUD mock (POC) com persistência em <code>localStorage</code>.</p>
          </div>
          <div class="badges">
            <span class="badge">Registros: <strong>${list.length}</strong></span>
          </div>
        </div>

        <div class="grid grid--2" style="margin-top:10px;">
          ${formFieldsHtml}
        </div>
        <div class="actions">
          <button id="btnAdd" class="btn btn--primary">Adicionar</button>
          <button id="btnClear" class="btn btn--ghost">Limpar tudo</button>
        </div>
      </div>

      <div class="card">
        <h2 style="margin:0 0 10px 0; font-size:16px;">Lista</h2>
        <div class="tableWrap">
          <table>
            <thead>
              <tr>
                ${fields.map((f) => `<th>${Poc.escapeHtml(f.label)}</th>`).join("")}
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml || `<tr><td colspan="${fields.length + 1}" class="muted">Sem registros.</td></tr>`}
            </tbody>
          </table>
        </div>
      </div>
    `;

    document.getElementById("btnAdd").addEventListener("click", () => {
      const obj = {};
      for (const f of fields) {
        const v = document.getElementById(`f_${f.key}`).value;
        obj[f.key] = (v || "").trim();
      }
      const requiredMissing = fields.some((f) => f.required && !obj[f.key]);
      if (requiredMissing) {
        Poc.toast("Preencha os campos obrigatórios.", "bad");
        return;
      }
      PocStore.add(entityKey, obj);
      Poc.toast("Registro adicionado (POC).", "ok");
      render({ entityKey, title, fields });
    });

    document.getElementById("btnClear").addEventListener("click", () => {
      if (!confirm("Limpar todos os registros deste cadastro?")) return;
      PocStore.clear(entityKey);
      Poc.toast("Cadastro limpo (POC).", "ok");
      render({ entityKey, title, fields });
    });

    root.querySelectorAll("button[data-del]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-del");
        PocStore.remove(entityKey, id);
        Poc.toast("Registro removido (POC).", "ok");
        render({ entityKey, title, fields });
      });
    });
  }

  return { render };
})();


