# Smart Consultoria System — Regras da POC (Documento Detalhado)

Este documento consolida as **regras de negócio e comportamento** definidas e implementadas durante a construção da POC em HTML/CSS/JS, para servir de referência na migração para Blazor e na validação de aceite.

---

## 1. Autenticação e perfis de acesso

### 1.1 Perfis (roles)

| Perfil         | Descrição resumida |
|----------------|--------------------|
| Administrador  | Acesso total: cadastros, importação, credenciamento, configuração. |
| Gestor        | Cadastros, importação, credenciamento; associação loja/usuário. |
| Consultor     | Home, Propostas, Comissões (relatório), Cadastro de Lojas (somente leitura). |
| Operador      | Idem Consultor. |
| Auxiliar      | Idem Consultor e Operador. |

### 1.2 Controle de acesso por tela

- **Importação**: apenas **Administrador** e **Gestor**.
- **Propostas**: Administrador, Gestor, Consultor, Operador, Auxiliar.
- **Credenciamento**: apenas **Administrador** e **Gestor**.
- **Relatório de Comissões**: Administrador, Gestor, Consultor, Operador, Auxiliar.
- **Cadastro de Lojas**: todos os perfis acima; **Auxiliar, Operador e Consultor** veem a tela em **somente leitura** (sem botão Novo, sem edição/exclusão, sem aba Comissões).
- **Cadastro de Usuários, Colaboradores, Produtos, Bancos**: apenas **Administrador** e **Gestor**.
- **Configuração**: apenas **Administrador** e **Gestor**.
- **Home, Perfil, Alterar Senha**: qualquer usuário autenticado.

### 1.3 Menu (sidebar)

- Itens do menu são exibidos conforme o perfil (`data-roles`). Apenas as rotas permitidas ao perfil logado aparecem.
- Estrutura atual:
  - **Navegação**: Home.
  - **Financeiro**: Importação, Propostas, Credenciamento.
  - **Relatórios**: Comissões (relatório).
  - **Cadastros**: Lojas, Usuários, Colaboradores, Produtos, Bancos.

---

## 2. Importação

### 2.1 Competência do lote

- **Competência (mês/ano)** é **obrigatória** para definir o lote de importação.
- Formato do lote: chave `AAAA-MM` (ex.: `2025-03`), rótulo `MM/AAAA` (ex.: `03/2025`).
- **Reimportar**: é possível escolher um lote existente em "Reimportar lote existente". Nesse caso, o mês/ano do formulário pode ser ignorado e o lote selecionado é **substituído** pelos novos dados.

### 2.2 Percentual ILA no mês

- **Obrigatório** informar o percentual ILA no mês (%). Aceita formato pt-BR (ex.: 2,5) ou 2.5.
- Validações:
  - Não pode ser vazio.
  - Deve ser **≥ 0** e **≤ 100**.
- O valor é armazenado no lote e utilizado como base de cálculo em regras de comissão.

### 2.3 Arquivos

- Pelo menos **um** arquivo deve ser selecionado: **Vendas.csv**, **Itens.csv** e/ou **Totalseg.xlsx**.
- **Encoding**: UTF-8, Windows-1252 ou ISO-8859-1 (aplicado na leitura do CSV).
- **Vendas/Itens**: CSV com separador ponto e vírgula (`;`). Coluna utilizada para cruzamento: **Código da Proposta** (ou equivalentes normalizados). Linhas sem código da proposta geram erro no staging.
- **Totalseg**: primeira planilha do Excel; colunas buscadas por nomes normalizados (Código da Proposta, Produto, Valor Seguro, etc.).
- **Cruzamento**: Itens e Totalseg são vinculados às propostas pelo **Código da Proposta**. Itens/Totalseg sem venda correspondente no mesmo lote ficam como **pendentes**.

### 2.4 Persistência do lote

- Lotes são salvos em `localStorage` (chave `poc_import_batches_v1`). Cada lote contém: `competenciaKey`, `competenciaLabel`, `percentualIla`, `data` (propostas, erros, etc.).
- O último lote processado é armazenado em `STORAGE_LAST_BATCH` e usado nas telas de Propostas e Relatório de Comissões para exibir dados da competência atual.

---

## 3. Credenciamento financeiro (lojas)

### 3.1 Escopo da tela

- A tela de **Credenciamento** edita apenas os **campos financeiros** da loja (nome e CNPJ vêm do cadastro de lojas e são somente leitura).
- **Novo credenciamento**: é obrigatório **selecionar a loja** em um dropdown; os dados da loja (nome, CNPJ) são preenchidos a partir do cadastro. Ao salvar, o registro da loja é atualizado com os dados financeiros.
- **Edição**: abre a loja já selecionada; apenas mensalidade, percentual Cockpit, dia vencimento, datas e flags são alterados no save.

### 3.2 Campos

| Campo                         | Obrigatório | Observação |
|------------------------------|-------------|------------|
| Loja (novo)                  | Sim         | Dropdown; apenas na criação. |
| Valor da Mensalidade         | Condicional | Pode ser zero; ver regra “pelo menos um”. |
| Indeterminado (Mensalidade)  | Não         | Checkbox; quando marcado, o campo valor fica desabilitado. |
| Percentual Cockpit (%)       | Condicional | Ver regra “pelo menos um”. |
| Indeterminado (Cockpit)      | Não         | Checkbox; quando marcado, o campo percentual fica desabilitado. |
| Data para nova renegociação (Cockpit) | Não  | Data específica do Cockpit. |
| Dia de Vencimento           | Sim         | 1 a 31. |
| Data da Próxima Negociação  | Sim         | Data geral de reajuste. |

### 3.3 Regra “pelo menos um”

- É obrigatório ter **ao menos um** dos seguintes:
  - Valor da mensalidade **> 0**, ou
  - Percentual Cockpit **> 0**, ou
  - **Indeterminado** marcado para Mensalidade, ou
  - **Indeterminado** marcado para Cockpit.
- Caso contrário, o save é bloqueado com mensagem orientando o preenchimento ou a opção Indeterminado.

### 3.4 Persistência

- Apenas os campos de credenciamento são gravados na entidade **loja**: `mensalidade`, `mensalidadeIndeterminado`, `percentualCockpit`, `cockpitIndeterminado`, `dataRenegociacaoCockpit`, `diaVencimento`, `dataReajuste`, `updatedAt`. Nome e CNPJ **não** são sobrescritos por esta tela.

### 3.5 Listagem

- Colunas na lista de credenciamento: Loja, CNPJ, Mensalidade, Cockpit %, Vencimento, Próximo Reajuste, Reneg. Cockpit.
- Botão de ação: **Novo Credenciamento**; exclusão de credenciamento não é oferecida (`hideDeleteBtn: true`).

---

## 4. Cadastro de Lojas

### 4.1 Abas

- **Dados da Loja**: Razão Social, Nome Fantasia, CNPJ, E-mail, Telefone, Chave PIX, Status.
- **Dados do Sócio**: lista dinâmica de sócios (Nome, Telefone, E-mail); adicionar/remover.
- **Operadores**: associação de colaboradores com perfil Operador (checkboxes).
- **Consultores**: associação de colaboradores com perfil Consultor (checkboxes).
- **Auxiliares**: associação de colaboradores com perfil Auxiliar (checkboxes).
- **Comissões**: exibida apenas para **Administrador** e **Gestor**. Para Auxiliar, Operador e Consultor a aba **Comissões não é exibida**.

### 4.2 Aba Comissões (por produto)

- Para cada **produto** cadastrado no sistema é exibido um bloco com:
  - Nome/descrição e código do produto.
  - **Valor cadastrado no produto**: exibido conforme o tipo do produto:
    - **Valor Fixo (monetário)**: "Valor cadastrado no produto: **R$ X,XX**".
    - **Percentual**: "Valor cadastrado no produto: **X,XX%**".
  - Quatro campos de percentual: **Gestor (%)**, **Auxiliar (%)**, **Operador (%)**, **Consultor (%)**.
- Os percentuais são armazenados em `configFinanceira` da loja, chave por `id` do produto: `{ [produtoId]: { gestor, auxiliar, operador, consultor } }`.

### 4.3 Validação da soma dos percentuais (Comissões)

- Ao **salvar** a loja, para **cada produto** que possua alguma configuração em `configFinanceira`:
  - Calcula-se a **soma** dos percentuais dos quatro perfis (Gestor + Auxiliar + Operador + Consultor), considerando formato pt-BR.
  - **Produto com tipo Valor Fixo (monetário)**:
    - A soma **não pode ultrapassar 100%**.
  - **Produto com tipo Percentual**:
    - A soma **não pode ultrapassar o valor do percentual cadastrado no produto**.
- Se alguma regra for violada, o save é **interrompido** e é exibida mensagem de erro indicando o produto e o limite (100% ou percentual do produto).

### 4.4 Somente leitura para Auxiliar, Operador e Consultor

- Nas telas de cadastro que usam o CRUD genérico (`crud-page.js`), se o perfil for **Auxiliar**, **Operador** ou **Consultor**:
  - Não é exibido botão "Novo Registro".
  - Não é exibida coluna "Ações" (editar/excluir).
  - Não é exibido botão "Limpar Base".
  - O formulário de edição não é oferecido da mesma forma que para Administrador/Gestor. Na prática, no Cadastro de Lojas esses perfis veem apenas lista e, além disso, a aba Comissões está oculta.

---

## 5. Cadastro de Produtos

### 5.1 Campos

- **Código**: obrigatório.
- **Descrição**: obrigatório.
- **Tipo Comissão**: obrigatório; opções **Percentual** ou **Valor Fixo**.
- **Valor**: obrigatório; interpretado como percentual (0–100) ou valor em reais conforme o tipo.
- **Status**: Ativo ou Inativo.

### 5.2 Comportamento do campo Valor

- No **Percentual**: máscara/validação até 100,00; exibição com sufixo "%".
- No **Valor Fixo**: máscara de moeda; exibição com prefixo "R$".
- O valor é normalizado no save (remoção de R$, pontos de milhar, vírgula trocada por ponto) e armazenado como número.

### 5.3 Uso na aba Comissões da loja

- O **valor cadastrado no produto** e o **tipo** (Percentual / Valor Fixo) são usados na aba Comissões do Cadastro de Lojas para exibir o "Valor cadastrado no produto" e para aplicar a regra de validação da soma (limite 100% ou percentual do produto).

---

## 6. Cadastro de Usuários, Colaboradores e Bancos

- **Usuários**: cadastro pelo Administrador/Gestor; campos conforme escopo (usuário, senha, 2FA simulado, perfil, status).
- **Colaboradores**: Nome, CPF, E-mail, Telefone (opcional), data de nascimento, Endereço (opcional), PIX; associação a Loja(s) e a Usuário; filtrados por perfil (Operador, Consultor, Auxiliar) para as listas de associação no Cadastro de Lojas.
- **Bancos**: cadastro de instituições financeiras (campos definidos na tela); acesso apenas Administrador e Gestor.

---

## 7. Propostas e relatório de comissões

- **Propostas**: listagem baseada no último lote de importação (competência); exibição dos dados das propostas e itens/Totalseg vinculados.
- **Relatório de Comissões**: utiliza o mesmo lote e dados de comissão (mock/regras em JS) para exibir relatório por perfil/comissão.

---

## 8. Persistência (localStorage) — entidades da POC

- **lojas**: dados da loja + sócios, operadores, consultores, auxiliares, `configFinanceira` (comissões por produto/perfil) e campos de credenciamento (mensalidade, cockpit, datas, indeterminado).
- **produtos**: código, descrição, tipoComissao (Percentual/Valor Fixo), valor, status.
- **usuarios**, **colaboradores**, **bancos**: conforme cadastros.
- **Lotes de importação**: `poc_import_batches_v1` (lista de lotes com competência, ILA, propostas, erros, etc.); `STORAGE_LAST_BATCH` para o último lote usado.

---

## 9. Resumo das validações críticas

| Contexto              | Regra |
|-----------------------|--------|
| Importação            | Competência (mês/ano) obrigatória; percentual ILA obrigatório, 0 ≤ ILA ≤ 100; pelo menos um arquivo. |
| Credenciamento        | Pelo menos um: mensalidade > 0, cockpit > 0 ou Indeterminado em um deles; dia vencimento e data próxima negociação obrigatórios. |
| Cadastro de Lojas (Comissões) | Por produto: soma (Gestor + Auxiliar + Operador + Consultor) ≤ 100% se valor monetário; soma ≤ percentual do produto se tipo percentual. |
| Cadastro de Produtos  | Código, descrição, tipo e valor obrigatórios; valor numérico normalizado no save. |

---

## 10. Referências

- **Escopo e autores**: `docs-full/escopo.txt`
- **Arquitetura alvo**: `docs-full/arquitetura-solucao.md`
- **Plano de desenvolvimento**: `docs-full/plano-desenvolvimento.md`
- **POC**: pasta `docs/` (HTML, CSS, JS); layout e menu em `docs/js/poc.js`; CRUD genérico em `docs/js/crud-page.js`; persistência em `docs/js/store.js`.

Este documento deve ser atualizado sempre que novas regras forem definidas ou alteradas na POC.
