/* POC — shared helpers/layout/session for multi-page HTML */

(function () {
  const STORAGE_SESSION = "poc_session_v1";
  const STORAGE_IMPORT = "poc_import_v1";
  const STORAGE_THEME = "poc_theme_v1";

  const POC_VERSION = "1.0.0 - Release 2";

  function $(sel) {
    const el = document.querySelector(sel);
    if (!el) throw new Error(`Elemento não encontrado: ${sel}`);
    return el;
  }

  function escapeHtml(str) {
    return String(str ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function normalizeHeader(h) {
    return String(h ?? "")
      .toLowerCase()
      .normalize("NFD")
      .replaceAll(/[\u0300-\u036f]/g, "")
      .replaceAll(/[^a-z0-9]+/g, " ")
      .trim()
      .replaceAll(/\s+/g, " ");
  }

  function safeStr(v) {
    const s = String(v ?? "").trim();
    return s ? s : null;
  }

  function parsePtBrNumber(value) {
    if (value === null || value === undefined) return null;
    const s0 = String(value).trim();
    if (!s0) return null;
    const s1 = s0.replaceAll("%", "").replaceAll(/\s+/g, "");
    const normalized = s1.replaceAll(".", "").replaceAll(",", ".");
    const num = Number(normalized);
    return Number.isFinite(num) ? num : null;
  }

  function formatMoneyBR(value) {
    const num = typeof value === "number" ? value : parsePtBrNumber(value);
    if (num === null || Number.isNaN(num)) return "—";
    return num.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }

  function toast(message, type = "ok") {
    const el = document.getElementById("toast");
    if (!el) return;
    el.classList.remove("toast--hidden", "toast--ok", "toast--bad");
    el.classList.add(type === "bad" ? "toast--bad" : "toast--ok");
    el.textContent = message;
    window.clearTimeout(toast._t);
    toast._t = window.setTimeout(() => el.classList.add("toast--hidden"), 3500);
  }

  function getSession() {
    try {
      const raw = localStorage.getItem(STORAGE_SESSION);
      if (!raw) return null;
      const s = JSON.parse(raw);
      if (!s?.user || !s?.role) return null;
      return s;
    } catch {
      return null;
    }
  }

  function setSession(sess) {
    if (!sess) localStorage.removeItem(STORAGE_SESSION);
    else localStorage.setItem(STORAGE_SESSION, JSON.stringify(sess));
  }

  function clearImport() {
    localStorage.removeItem(STORAGE_IMPORT);
  }

  function saveImport(data) {
    localStorage.setItem(STORAGE_IMPORT, JSON.stringify(data));
  }

  function mergeImport(newData) {
    try {
      const old = loadImport() || { vendasRaw: [], itensRaw: [], propostas: [], pending: [], errors: [] };

      // Merge Raws
      if (newData.vendasRaw?.length) old.vendasRaw = newData.vendasRaw;
      if (newData.itensRaw?.length) old.itensRaw = newData.itensRaw;

      // Update metadata
      old.encoding = newData.encoding || old.encoding;
      old.propostas = newData.propostas || old.propostas;
      old.pending = newData.pending || old.pending;
      old.errors = newData.errors || old.errors;
      old.vendasInfo = newData.vendasInfo || old.vendasInfo;
      old.itensInfo = newData.itensInfo || old.itensInfo;

      saveImport(old);
      return old;
    } catch (e) {
      console.error("Erro ao mesclar importação:", e);
      saveImport(newData);
      return newData;
    }
  }

  function loadImport() {
    try {
      const raw = localStorage.getItem(STORAGE_IMPORT);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  function getTheme() {
    return localStorage.getItem(STORAGE_THEME) || "light";
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem(STORAGE_THEME, theme);
  }

  function toggleTheme() {
    const current = getTheme();
    const next = current === "light" ? "dark" : "light";
    applyTheme(next);
    updateThemeIcon();
  }

  function updateThemeIcon() {
    const btn = document.getElementById("btnToggleTheme");
    if (!btn) return;
    const isDark = getTheme() === "dark";
    btn.innerHTML = isDark ? "☀️" : "🌙";
    btn.title = isDark ? "Mudar para tema claro" : "Mudar para tema escuro";
  }

  function openNav() {
    const nav = document.getElementById("nav");
    const bd = document.getElementById("backdrop");
    if (!nav || !bd) return;
    nav.classList.add("nav--open");
    nav.classList.remove("nav--closed");
    bd.classList.remove("backdrop--hidden");
  }

  function closeNav() {
    const nav = document.getElementById("nav");
    const bd = document.getElementById("backdrop");
    if (!nav || !bd) return;
    nav.classList.remove("nav--open");
    nav.classList.add("nav--closed");
    bd.classList.add("backdrop--hidden");
  }

  function toggleNav() {
    const nav = document.getElementById("nav");
    if (!nav) return;
    const isOpen = nav.classList.contains("nav--open");
    if (isOpen) closeNav();
    else openNav();
  }

  function applyRoleToNav(sess) {
    document.querySelectorAll("a.nav__item[data-roles]").forEach((a) => {
      const roles = a.getAttribute("data-roles").split(",").map((x) => x.trim());
      const show = !!sess && roles.includes(sess.role);
      a.classList.toggle("nav__item--hidden", !show);
    });
  }

  function setActiveNav(routeKey) {
    document.querySelectorAll(".nav__item").forEach((a) => {
      const r = a.getAttribute("data-route");
      a.classList.toggle("nav__item--active", r === routeKey);
    });
  }

  function requireAuth({ allowRoles = null, redirect = "./login.html" } = {}) {
    const sess = getSession();
    if (!sess) {
      location.href = redirect;
      return null;
    }
    if (allowRoles && !allowRoles.includes(sess.role)) {
      toast("Sem permissão para esta página (POC).", "bad");
      location.href = "./home.html";
      return null;
    }
    return sess;
  }

  function renderShell({ activeRoute = "home" } = {}) {
    const sess = getSession();

    const app = document.getElementById("app");
    if (!app) throw new Error("Faltou <div id=\"app\"></div> na página.");

    // move content to slot
    const content = document.getElementById("content");
    const contentHtml = content ? content.innerHTML : "";

    const userInits = sess ? sess.user.substring(0, 1).toUpperCase() : "?";

    app.innerHTML = `
      <div class="app">
        <header class="topbar">
          <div class="topbar__left">
            <button id="btnToggleNav" class="icon-btn" aria-label="Abrir menu" title="Menu">☰</button>
            <img src="./images/logo-sperta-consultoria.jpeg" alt="Sperta Consultoria Logo" class="topbar__logo">
            <div class="topbar__title">
              <div class="brand">Smart Consultoria System</div>
              <div class="subtitle">POC (HTML/CSS/JS)</div>
            </div>
          </div>
          <div class="topbar__right">
            <button id="btnToggleTheme" class="icon-btn" aria-label="Alternar tema" title="Alternar tema"></button>
            
            <a href="./configuracao.html" id="btnSettings" class="icon-btn ${sess && (sess.role === 'Administrador' || sess.role === 'Gestor') ? "" : "btn--hidden"}" title="Configurações" style="text-decoration:none; display:flex; align-items:center; justify-content:center;">⚙️</a>

            <div class="user-menu ${sess ? "" : "chip--hidden"}" id="userMenu">
              <div class="user-trigger" id="userTrigger">
                <div class="user-trigger__avatar">${userInits}</div>
                <span class="brand" style="font-size:13px">${escapeHtml(sess?.user || "")}</span>
                <small>▾</small>
              </div>
              <div class="user-dropdown" id="userDropdown">
                <div class="user-dropdown__header">
                  <span class="user-dropdown__name">${escapeHtml(sess?.user || "")}</span>
                  <span class="user-dropdown__role">${escapeHtml(sess?.role || "")}</span>
                </div>
                <a href="./perfil.html" class="user-dropdown__link">👤 Meu Perfil</a>
                <a href="./alterar-senha.html" class="user-dropdown__link">🔑 Alterar Senha</a>
                <div class="user-dropdown__divider"></div>
                <a href="#" id="btnLogout" class="user-dropdown__link user-dropdown__link--danger">🚪 Sair</a>
              </div>
            </div>
          </div>
        </header>

        <aside id="nav" class="nav nav--closed" aria-label="Navegação">
          <div class="nav__section">
            <div class="nav__sectionTitle">Navegação</div>
            <a class="nav__item" href="./home.html" data-route="home" data-roles="Administrador,Gestor,Consultor,Operador">🏠 Home</a>
            <a class="nav__item" href="./importacao.html" data-route="importacao" data-roles="Administrador,Gestor">📥 Importação</a>
            <a class="nav__item" href="./propostas.html" data-route="propostas" data-roles="Administrador,Gestor,Consultor,Operador">📄 Propostas</a>
            <a class="nav__item" href="./comissoes.html" data-route="comissoes" data-roles="Administrador,Gestor,Consultor,Operador">💰 Comissões</a>
          </div>

          <div class="nav__section">
            <div class="nav__sectionTitle">Relatórios</div>
            <a class="nav__item" href="./relatorio-comissao.html" data-route="relatorio-comissao" data-roles="Administrador,Gestor,Consultor,Operador">📊 Comissões</a>
          </div>

          <div class="nav__section">
            <div class="nav__sectionTitle">Cadastros</div>
            <a class="nav__item" href="./cad-lojas.html" data-route="cad-lojas" data-roles="Administrador,Gestor">🏢 Lojas</a>
            <a class="nav__item" href="./cad-usuarios.html" data-route="cad-usuarios" data-roles="Administrador,Gestor">👥 Usuários</a>
            <a class="nav__item" href="./cad-colaboradores.html" data-route="cad-colaboradores" data-roles="Administrador,Gestor">🤝 Colaboradores</a>
            <a class="nav__item" href="./cad-produtos.html" data-route="cad-produtos" data-roles="Administrador,Gestor">📦 Produtos</a>
            <a class="nav__item" href="./cad-bancos.html" data-route="cad-bancos" data-roles="Administrador,Gestor">🏦 Bancos</a>
          </div>

          <div class="nav__footer">
            Versão ${POC_VERSION}
          </div>
        </aside>

        <main class="main">
          <div id="toast" class="toast toast--hidden" role="status" aria-live="polite"></div>
          <div id="slot">${contentHtml}</div>
          <footer class="footer">
            <div class="muted">
              POC local (sem backend). Arquivos: <code>poc/*.html</code>, <code>poc/styles.css</code>, <code>poc/js/*.js</code>
            </div>
          </footer>
        </main>

        <div id="backdrop" class="backdrop backdrop--hidden" aria-hidden="true"></div>
      </div>
    `;

    // wire shell
    const btnNav = document.getElementById("btnToggleNav");
    const bd = document.getElementById("backdrop");
    btnNav?.addEventListener("click", toggleNav);
    bd?.addEventListener("click", closeNav);
    document.querySelectorAll(".nav__item").forEach((a) => a.addEventListener("click", () => closeNav()));

    // user dropdown logic
    const userTrigger = document.getElementById("userTrigger");
    const userDropdown = document.getElementById("userDropdown");
    if (userTrigger && userDropdown) {
      userTrigger.onclick = (e) => {
        e.stopPropagation();
        userDropdown.classList.toggle("user-dropdown--open");
      };
      document.addEventListener("click", () => {
        userDropdown.classList.remove("user-dropdown--open");
      });
    }

    document.getElementById("btnLogout")?.addEventListener("click", (e) => {
      e.preventDefault();
      setSession(null);
      clearImport();
      location.href = "./login.html";
    });

    applyRoleToNav(sess);
    setActiveNav(activeRoute);

    // Theme initialization
    const initialTheme = getTheme();
    applyTheme(initialTheme);
    updateThemeIcon();
    document.getElementById("btnToggleTheme")?.addEventListener("click", toggleTheme);
  }

  function showModal({ title, content }) {
    const id = "pocModal";
    let modal = document.getElementById(id);
    if (!modal) {
      modal = document.createElement("div");
      modal.id = id;
      modal.className = "modalWrap";
      document.body.appendChild(modal);
    }

    modal.innerHTML = `
      <div class="modalBackdrop"></div>
      <div class="modalCard">
        <div class="modalHeader">
          <h2>${escapeHtml(title)}</h2>
          <button class="modalClose">&times;</button>
        </div>
        <div class="modalContent">${content}</div>
      </div>
    `;

    modal.style.display = "flex";

    const close = () => modal.style.display = "none";
    modal.querySelector(".modalClose").onclick = close;
    modal.querySelector(".modalBackdrop").onclick = close;
  }

  window.Poc = {
    $,
    escapeHtml,
    normalizeHeader,
    safeStr,
    parsePtBrNumber,
    formatMoneyBR,
    toast,
    showModal,
    getSession,
    setSession,
    requireAuth,
    renderShell,
    saveImport,
    mergeImport,
    loadImport,
    clearImport,
    getProducts: () => PocStore.load("produtos"),
    seed: () => {
      const prods = PocStore.load("produtos");
      const matrixRaw = localStorage.getItem("poc_commission_matrix");

      // Se não tem produtos OU não tem matriz, vamos forçar o seed
      if (prods.length === 0 || !matrixRaw || matrixRaw === "{}") {
        // Limpa para garantir sincronia entre IDs de produtos e chaves da matriz
        PocStore.clear("produtos");

        const initial = [
          { nome: "Mensalidade" },
          { nome: "Cockpit" },
          { nome: "SPFv" },
          { nome: "SPRenda" },
          { nome: "SPRenda Premium" },
          { nome: "DIA" },
          { nome: "DIA Premium" },
          { nome: "Garantia Full" },
          { nome: "Garantia MC" }
        ];
        initial.forEach(p => PocStore.add("produtos", p));

        const p2 = PocStore.load("produtos");
        const matrix = {};
        const data = {
          "Consultor": ["5%", "0,50%", "2%", "2%", "2%", "2%", "2%", "R$ 50,00", "R$ 25,00"],
          "Operador": ["15%", "2,50%", "3%", "3%", "3%", "3%", "3%", "R$ 100,00", "R$ 25,00"],
          "Smart": ["80%", "7,00%", "20%", "10%", "10%", "10%", "10%", "R$ 450,00", "R$ 350,00"]
        };

        const roles = ["Consultor", "Operador", "Smart"];
        roles.forEach(role => {
          p2.forEach((prod, i) => {
            if (data[role] && data[role][i]) {
              matrix[`${role}_${prod.id}`] = data[role][i];
            }
          });
        });
        localStorage.setItem("poc_commission_matrix", JSON.stringify(matrix));
      }
    }
  };
})();


