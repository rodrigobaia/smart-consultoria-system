/* CRUD genérico (POC) — render simples para cadastros em HTML/JS
 * Usa PocStore (localStorage) para persistência.
 */

const PocCrudPage = (() => {
  let state = {
    view: "list", // 'list' or 'form'
    filter: "",
    editId: null,
  };

  function render(config) {
    const root = document.getElementById("crudRoot");
    if (!root) throw new Error("Faltou <div id=\"crudRoot\"></div> na página.");

    if (state.view === "form") {
      renderForm(root, config);
    } else {
      renderList(root, config);
    }
  }

  function renderList(root, config) {
    const { entityKey, title, fields } = config;
    const allData = PocStore.load(entityKey);
    const filtered = allData.filter((item) => {
      if (!state.filter) return true;
      const f = state.filter.toLowerCase();
      return fields.some((field) =>
        String(item[field.key] ?? "").toLowerCase().includes(f)
      );
    });

    const rowsHtml = filtered
      .map((item) => {
        const cols = fields
          .map((f) => {
            let val = item[f.key] ?? "—";
            if (Array.isArray(val)) val = val.join(", ");
            return `<td>${Poc.escapeHtml(String(val))}</td>`;
          })
          .join("");
        return `
          <tr>
            ${cols}
            <td style="white-space:nowrap; text-align:right;">
              <button class="btn btn--ghost" data-del="${Poc.escapeHtml(item.id)}">Excluir</button>
            </td>
          </tr>
        `;
      })
      .join("");

    root.innerHTML = `
      <div class="card">
        <div class="row row--between row--wrap" style="margin-bottom: 20px;">
          <div>
            <h1>${Poc.escapeHtml(title)}</h1>
            <p class="muted">Lista de registros com filtro e busca.</p>
          </div>
          <button id="btnNovo" class="btn btn--primary">＋ Novo Registro</button>
        </div>

        <div class="row row--wrap" style="gap: 10px; margin-bottom: 20px;">
          <div class="field field--inline" style="flex: 1;">
            <input id="txtFilter" type="text" placeholder="Filtrar registros..." value="${Poc.escapeHtml(state.filter)}" autocomplete="off" />
          </div>
          <button id="btnClearData" class="btn btn--ghost">Limpar Base</button>
        </div>

        <div class="tableWrap">
          <table>
            <thead>
              <tr>
                ${fields.map((f) => `<th>${Poc.escapeHtml(f.label)}</th>`).join("")}
                <th style="text-align:right;">Ações</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml || `<tr><td colspan="${fields.length + 1}" class="muted" style="text-align:center; padding: 40px;">Nenhum registro encontrado.</td></tr>`}
            </tbody>
          </table>
        </div>
        <div class="muted" style="margin-top: 15px; font-size: 13px;">
          Total: <strong>${allData.length}</strong> registros ${state.filter ? `(Filtrado: <strong>${filtered.length}</strong>)` : ""}
        </div>
      </div>
    `;

    // Events
    document.getElementById("btnNovo").onclick = () => {
      state.view = "form";
      render(config);
    };

    const txtFilter = document.getElementById("txtFilter");
    txtFilter.oninput = (e) => {
      state.filter = e.target.value;
      render(config);
      document.getElementById("txtFilter").focus();
    };

    document.getElementById("btnClearData").onclick = () => {
      if (!confirm("Limpar todos os registros deste cadastro?")) return;
      PocStore.clear(entityKey);
      Poc.toast("Cadastro limpo.", "ok");
      render(config);
    };

    root.querySelectorAll("button[data-del]").forEach((btn) => {
      btn.onclick = () => {
        const id = btn.getAttribute("data-del");
        PocStore.remove(entityKey, id);
        Poc.toast("Registro removido.", "ok");
        render(config);
      };
    });
  }

  function renderForm(root, config) {
    const { title, fields, entityKey } = config;

    const fieldsHtml = fields.map(f => {
      const id = `f_${f.key}`;
      const label = Poc.escapeHtml(f.label);
      const req = f.required ? '<b style="color:var(--danger)">*</b>' : '';

      if (f.type === 'select' && Array.isArray(f.options)) {
        const optionsHtml = (f.options || []).map(opt => {
          const val = typeof opt === 'string' ? opt : opt.value;
          const lab = typeof opt === 'string' ? opt : opt.label;
          return `<option value="${Poc.escapeHtml(val)}">${Poc.escapeHtml(lab)}</option>`;
        }).join("");

        return `
          <label class="field">
            <span>${label} ${req}</span>
            <select id="${id}" ${f.multiple ? 'multiple style="height:100px; padding:5px;"' : ''}>
              ${!f.multiple ? '<option value="">(Selecione)</option>' : ''}
              ${optionsHtml}
            </select>
            ${f.multiple ? '<small class="muted">Segure Ctrl para selecionar vários</small>' : ''}
          </label>
        `;
      }

      if (f.type === 'checkbox-group' && Array.isArray(f.options)) {
        const checksHtml = (f.options || []).map((opt, idx) => {
          const val = typeof opt === 'string' ? opt : opt.value;
          const lab = typeof opt === 'string' ? opt : opt.label;
          const name = `check_${f.key}`;
          return `
            <label class="row" style="gap:8px; cursor:pointer;">
              <input type="checkbox" name="${name}" value="${Poc.escapeHtml(val)}" />
              <span style="font-size:13px; color:var(--text);">${Poc.escapeHtml(lab)}</span>
            </label>
          `;
        }).join("");

        return `
          <div class="field">
            <span>${label} ${req}</span>
            <div class="grid" style="gap:8px; padding:10px; border:1px solid var(--border); border-radius:var(--radius2); background:var(--panel2); max-height:150px; overflow:auto;">
              ${checksHtml}
            </div>
            <small class="muted">Selecione as opções desejadas</small>
          </div>
        `;
      }

      return `
        <label class="field">
          <span>${label} ${req}</span>
          <input id="${id}" type="${f.type || 'text'}" placeholder="${Poc.escapeHtml(f.placeholder || '')}" autocomplete="off" />
        </label>
      `;
    }).join("");

    root.innerHTML = `
      <div class="card card--narrow">
        <div style="margin-bottom: 24px;">
          <button id="btnVoltar" class="btn btn--ghost" style="margin-bottom: 15px;">← Voltar para Lista</button>
          <h1>Novo: ${Poc.escapeHtml(title)}</h1>
          <p class="muted">Preencha os campos abaixo para adicionar um novo registro.</p>
        </div>

        <div class="grid" style="gap: 16px;">
          ${fieldsHtml}
        </div>

        <div class="actions" style="margin-top: 30px; border-top: 1px solid var(--border); pt: 20px;">
          <button id="btnSave" class="btn btn--primary" style="flex: 1;">Salvar Registro</button>
          <button id="btnCancel" class="btn btn--ghost">Cancelar</button>
        </div>
      </div>
    `;

    document.getElementById("btnVoltar").onclick = document.getElementById("btnCancel").onclick = () => {
      state.view = "list";
      render(config);
    };

    document.getElementById("btnSave").onclick = () => {
      const obj = {};
      for (const f of fields) {
        if (f.type === 'checkbox-group') {
          const checks = document.querySelectorAll(`input[name="check_${f.key}"]:checked`);
          obj[f.key] = Array.from(checks).map(c => c.value);
        } else {
          const el = document.getElementById(`f_${f.key}`);
          if (f.multiple && el.tagName === 'SELECT') {
            obj[f.key] = Array.from(el.selectedOptions).map(opt => opt.value);
          } else {
            obj[f.key] = (el.value || "").trim();
          }
        }
      }

      const missing = fields.filter(f => f.required && !obj[f.key]);
      if (missing.length) {
        Poc.toast(`Campos obrigatórios: ${missing.map(m => m.label).join(", ")}`, "bad");
        return;
      }

      PocStore.add(entityKey, obj);
      Poc.toast("Registro salvo com sucesso!", "ok");
      state.view = "list";
      render(config);
    };
  }

  return { render };
})();


