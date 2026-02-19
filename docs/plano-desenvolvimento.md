# Plano de Desenvolvimento — Smart Consultoria System

Este documento define um **plano de desenvolvimento por etapas** com **checklist de entregas** e **critérios de aceite**, começando por uma **POC em HTML/CSS/JS** para validar o fluxo antes do desenvolvimento em **Blazor Server**.

---

## Premissas
- A arquitetura alvo está descrita em `docs/arquitetura-solucao.md`.
- As colunas completas de `Vendas.csv` e `Itens.csv` e as fórmulas/cálculos detalhados serão descritos em etapa posterior (já registrado na documentação).
- Perfis de acesso (roles): **Administrador**, **Gestor**, **Consultoria**, **Operador**.

---

## Definição de pronto (DoD) — geral
- **Checklist da etapa 100% concluído**
- **Critérios de aceite atendidos**
- Documentação da etapa atualizada em `docs/`
- Telas/fluxos principais demonstráveis (quando aplicável)

---

## Etapa 0 — Alinhamento e refinamento do escopo (rápido)
### Objetivo
Fechar decisões mínimas para não retrabalhar (UI base, perfis da matriz, vínculos, importações).

### Checklist de entrega
- [ ] Definir padrão de UI para o Blazor (Bootstrap 5 **ou** MudBlazor)
- [ ] Confirmar perfis que entram na **matriz de comissão** (ex.: Operador/Consultor/(Social?)/Gestor?)
- [ ] Definir regra do vínculo **Consultor ↔ Loja** (1 responsável vs histórico)
- [ ] Definir estratégia de importação (lote, idempotência, reprocessamento, falhas por linha)
- [ ] Criar um “glossário” mínimo (o que é Proposta, Produção, Comissão, Incentivo, etc.)

### Critérios de aceite
- [ ] Decisões registradas (adendo no `docs/arquitetura-solucao.md` ou documento específico)

---

## Etapa 1 — POC (HTML/CSS/JS) para validar o fluxo
### Objetivo
Validar **UX e fluxo funcional** sem backend, reduzindo risco antes do Blazor.

### Escopo da POC
POC estática (ou com “mock” em JS) simulando:
- Login (simulado)
- Menu por perfil (simulado)
- Importação (upload de arquivo e leitura no browser)
- “Staging view”: linhas importadas + erros
- Cruzamento `Vendas` x `Itens` por `CodigoProposta` (simulado)
- Saída: lista “Propostas” e “Itens” normalizados (simulado)
- Consulta simples de comissões (mock)

### Checklist de entrega
- [ ] Projeto POC (pasta `poc/` ou `docs/poc/`) com:
  - [ ] `index.html`
  - [ ] `styles.css` (responsivo)
  - [ ] `app.js` (mock de dados e fluxo)
- [ ] Layout mobile-first:
  - [ ] menu colapsável/drawer
  - [ ] tabelas em modo card no mobile (quando necessário)
- [ ] Telas (mínimo):
  - [ ] Login (simulado)
  - [ ] Home
  - [ ] Importação (upload de `Vendas.csv` e `Itens.csv`)
  - [ ] Resultado da importação (erros por linha + resumo)
  - [ ] Propostas (resultado do cruzamento)
  - [ ] Itens por proposta
- [ ] Validações “de UX”:
  - [ ] bloquear importação se faltar um dos arquivos
  - [ ] apresentar erros por linha (simulado)
  - [ ] resumo do lote: lidas/importadas/erros (simulado)
- [ ] Documentar como executar (abrir o `index.html` e fluxo de uso)

### Critérios de aceite
- [ ] Fluxo completo demonstrável em browser (desktop e mobile)
- [ ] Usuários conseguem validar se o “passo a passo” atende o esperado (sem discutir fórmulas ainda)
- [ ] Ajustes de UX/fluxo incorporados antes do Blazor

---

## Etapa 2 — Bootstrap da solução .NET (Clean Architecture)
### Objetivo
Criar a solução base com camadas, DI, configurações e base para evoluir.

### Checklist de entrega
- [ ] Solution + projetos:
  - [ ] `*.sln`
  - [ ] `Domain`, `Application`, `Infrastructure`, `Web`
- [ ] DI/IoC:
  - [ ] extensão de injeção por camada (`AddApplication`, `AddInfrastructure`, etc.)
- [ ] Configurações:
  - [ ] `appsettings.Development.json` com connection string MySQL (placeholder)
- [ ] Padrões básicos:
  - [ ] logging estruturado (Serilog ou logging padrão)
  - [ ] tratamento de erro amigável na Web

### Critérios de aceite
- [ ] A solução compila e executa
- [ ] Estrutura pronta para Identity + EF + MySQL

---

## Etapa 3 — Identity (AuthN/AuthZ) + Roles + 2FA (base)
### Objetivo
Ter autenticação/autorização pronta para proteger telas e regras.

### Checklist de entrega
- [ ] ASP.NET Identity configurado com MySQL
- [ ] Roles criadas/seed (Admin, Gestor, Consultoria, Operador)
- [ ] Páginas:
  - [ ] Login/Logout
  - [ ] Registro (se aplicável) ou criação via Admin
- [ ] Autorização:
  - [ ] menus por role/policy
  - [ ] páginas protegidas (ex.: Importação só Admin/Gestor)
- [ ] 2FA habilitável (mínimo: suporte a TOTP)

### Critérios de aceite
- [ ] Usuário não autenticado não acessa rotas protegidas
- [ ] Cada role enxerga apenas o que deve

---

## Etapa 4 — Modelo de dados + EF Core + Migrations (base)
### Objetivo
Materializar o modelo mínimo no MySQL e garantir evolução via migrations.

### Checklist de entrega
- [ ] DbContext + migrations
- [ ] Tabelas iniciais (mínimo):
  - [ ] Cadastros: Loja, Colaborador, Produto (mínimo para o sistema nascer)
  - [ ] Importação: ImportacaoArquivo, ImportacaoErro, ImportacaoVendaRaw, ImportacaoItemRaw
  - [ ] Propostas: Proposta, PropostaItem (+ auxiliares mínimos, conforme necessidade)
- [ ] Auditoria mínima (CreatedAt/CreatedBy etc. ou equivalente)

### Critérios de aceite
- [ ] Banco sobe com `dotnet ef database update` (ou mecanismo equivalente)
- [ ] Migrations versionadas e reprodutíveis

---

## Etapa 5 — Cadastros essenciais (CRUD) + UX
### Objetivo
Dar base operacional para associar dados e preparar importações.

### Checklist de entrega
- [ ] CRUD Loja (Admin/Gestor)
- [ ] CRUD Colaborador (Admin/Gestor)
- [ ] CRUD Produto (Admin/Gestor)
- [ ] CRUD Banco / Instituição Financeira (Admin/Gestor)
- [ ] Vinculações:
  - [ ] Colaborador ↔ Loja
  - [ ] (se aplicável) Colaborador ↔ Usuário

### Critérios de aceite
- [ ] Telas responsivas e usáveis em celular/tablet
- [ ] Permissões respeitadas por role

---

## Etapa 6 — Importação (pipeline: staging → normalização) — sem fórmulas finais
### Objetivo
Implementar importação robusta com logs por linha, cruzamento e persistência final (mesmo que cálculos de comissão sejam “stub”).

### Checklist de entrega
- [ ] Upload de `Vendas.csv` e `Itens.csv` (Admin/Gestor)
- [ ] Criação de lote `ImportacaoArquivo` + persistência raw (linha a linha)
- [ ] Parse com suporte a encoding pt-BR e separador `;`
- [ ] Validações estruturais e consistência mínima
- [ ] Cruzamento por `CodigoProposta`
- [ ] Gravação nas tabelas normalizadas (Proposta/PropostaItem)
- [ ] Tela de acompanhamento do lote:
  - [ ] resumo (lidas/importadas/erros)
  - [ ] listagem de erros por linha
  - [ ] reprocessar lote (quando aplicável)

### Critérios de aceite
- [ ] Importação não “quebra” com erros: registra e continua (quando possível)
- [ ] Lote é auditável e reprocessável

---

## Etapa 7 — Matriz de comissão + histórico
### Objetivo
Permitir configurar comissão por Produto x Perfil e manter histórico.

### Checklist de entrega
- [ ] CRUD da matriz `ComissaoRegra`
- [ ] Histórico (`ComissaoRegraHistorico`) a cada alteração
- [ ] Tela de consulta do histórico

### Critérios de aceite
- [ ] Toda alteração registra usuário/data/valores antigos e novos

---

## Etapa 8 — Cálculo de comissão (regras e fórmulas) + geração de `ComissaoApurada`
### Objetivo
Aplicar fórmulas definidas posteriormente, gerar comissões e permitir consulta por perfil.

### Checklist de entrega
- [ ] Documentar fórmulas e bases de cálculo (documento próprio em `docs/`)
- [ ] Implementar cálculo no Application (testável)
- [ ] Gerar `ComissaoApurada` após importação (ou job/reprocessamento)
- [ ] Tela de consulta de comissão por perfil/colaborador/período

### Critérios de aceite
- [ ] Resultados batem com casos de teste/planilhas de referência

---

## Etapa 9 — Incentivo do consultor (1% por produção) — modo manual assistido
### Objetivo
Implementar a regra do escopo inicialmente de forma manual, auditável.

### Checklist de entrega
- [ ] Tela: selecionar consultor + período
- [ ] Calcular volume das lojas vinculadas ao consultor
- [ ] Gerar comissão incentivo (auditável) e permitir ajuste manual

### Critérios de aceite
- [ ] Cálculo e auditoria claros para o usuário

---

## Etapa 10 — Pagamentos de comissão (workflow)
### Objetivo
Controlar aprovação e pagamento com lote e histórico.

### Checklist de entrega
- [ ] Aprovar comissões
- [ ] Gerar lote de pagamento (`PagamentoComissao` + itens)
- [ ] Marcar comissões como pagas
- [ ] Relatório de pagamentos por competência

### Critérios de aceite
- [ ] Rastreabilidade: quem pagou, quando, o quê, por qual competência

---

## Etapa 11 — Dashboard e Relatórios
### Objetivo
Entregar visão gerencial e relatórios principais.

### Checklist de entrega
- [ ] Dashboard (cards e tendências)
- [ ] Relatórios:
  - [ ] Comissão por Perfil
  - [ ] Comissão por Loja
  - [ ] Comissão por Colaborador
  - [ ] Produção por banco/período

### Critérios de aceite
- [ ] Performance aceitável e usabilidade no mobile

---

## Etapa 12 — Hardening (segurança, performance, observabilidade) + Deploy
### Objetivo
Preparar para uso real.

### Checklist de entrega
- [ ] Logs e trilha de auditoria revisados
- [ ] Políticas de senha/lockout/2FA revisadas
- [ ] Backup/restore (procedimento)
- [ ] Documentação de deploy (IIS/Linux + MySQL)

### Critérios de aceite
- [ ] Ambiente reproduzível e checklist de produção pronto

---

## Checklist macro (visão rápida)
- [ ] Etapa 0 — Alinhamento
- [ ] Etapa 1 — POC HTML/CSS/JS
- [ ] Etapa 2 — Bootstrap .NET
- [ ] Etapa 3 — Identity/Roles/2FA
- [ ] Etapa 4 — EF/MySQL/Migrations
- [ ] Etapa 5 — Cadastros
- [ ] Etapa 6 — Importação (staging→normalização)
- [ ] Etapa 7 — Matriz de comissão + histórico
- [ ] Etapa 8 — Fórmulas + cálculo de comissão
- [ ] Etapa 9 — Incentivo consultor (manual assistido)
- [ ] Etapa 10 — Pagamentos
- [ ] Etapa 11 — Dashboard/Relatórios
- [ ] Etapa 12 — Hardening/Deploy


