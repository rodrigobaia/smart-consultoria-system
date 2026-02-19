# Smart Consultoria System — Documento de Arquitetura (Blazor Server + Clean Architecture)

## Visão geral
O **Smart Consultoria System** é um sistema para **gestão de comissões e ganhos relacionados a financiamentos**, com:

- Cadastros (Usuários, Colaboradores, Lojas, Produtos, Contratos)
- Definição de comissão por perfil (**matriz Produto x Perfil**) com **histórico de alterações**
- Controle de pagamento de comissão (Consultor/Operador/Gestor)
- Dashboard e Relatórios
- Importação de planilhas/arquivos (CSV/Excel) para produção/itens/vendas
- Controle de acesso usando **ASP.NET Identity** (login, roles, 2FA)

A aplicação será **Blazor Server responsiva**, acessível via **celular/tablet/desktop**.

---

## Requisitos não-funcionais (arquitetura)
- **Clean Architecture** (separação clara por camadas)
- **SOLID** e baixo acoplamento
- **IoC/DI** (injeção de dependências)
- **EF Core** com **MySQL**
- **ASP.NET Identity** para autenticação/autorização (com **Roles** e **Policies**)
- **Auditoria e rastreabilidade** (principalmente para histórico de comissão e pagamentos)
- **Segurança** (2FA, lockout, logs, proteção contra acesso indevido)
- **Responsividade** (UI adaptada a telas menores)
- **Evolutivo** (fácil de adicionar relatórios/regras novas)

---

## Stack tecnológica proposta
- **.NET 8 (ou 9, se o ambiente já estiver padronizado)**
- **Blazor Server**
- **ASP.NET Core Identity** (+ suporte a **2FA**)
- **Entity Framework Core**
- **MySQL** via provedor **Pomelo.EntityFrameworkCore.MySql**
- **UI responsiva**:
  - Opção A: **Bootstrap 5** (nativo, simples, leve)
  - Opção B: **MudBlazor** (componentes prontos, excelente responsividade)
- **FluentValidation** (validações no Application)
- **MediatR** (opcional, para CQRS/UseCases de forma limpa)
- **Serilog** (logs estruturados)

---

## Estrutura da solução (Clean Architecture)
A solução será dividida em projetos (camadas) com dependências “para dentro”:

### `SmartConsultoria.Domain`
Contém o **núcleo do negócio** (sem dependência de EF/Identity/UI):
- Entidades (regras e invariantes)
- Value Objects (ex.: Cnpj, Cpf, Money, Percentual)
- Enums (Status, TipoComissao, PerfisNegocio)
- Interfaces de repositório (contratos)
- Regras de domínio (ex.: cálculo de comissão, validações críticas)

### `SmartConsultoria.Application`
Contém os **casos de uso** (o “o que o sistema faz”):
- Use Cases / Services (ex.: CadastrarLoja, DefinirComissaoProdutoPerfil, ImportarArquivoProducao)
- DTOs/ViewModels (entrada/saída)
- Validações (FluentValidation)
- Interfaces para serviços externos (ex.: `IFileStorage`, `ICurrentUser`, `IDateTime`)
- Políticas de autorização em nível de caso de uso (quando aplicável)

### `SmartConsultoria.Infrastructure`
Implementa as dependências externas:
- EF Core DbContext
- Migrations
- Repositórios EF
- Identity (User/Role customizados se necessário)
- Integrações (ex.: leitura Excel/CSV, storage de arquivos, envio e-mail/SMS 2FA)

### `SmartConsultoria.Web` (Blazor Server)
Camada de apresentação:
- Páginas/Componentes Blazor
- Fluxos de UI (cadastros, consultas, relatórios)
- Configuração DI, AuthN/AuthZ, endpoints, etc.
- Layout responsivo (sidebar colapsável, menus por perfil)

### Regras de dependência (direção das referências)
- Web → Application, Infrastructure
- Infrastructure → Application, Domain
- Application → Domain
- Domain → (nada)

---

## Modelo de autorização (Identity)
### Roles (conforme escopo)
- Administrador
- Gestor
- Consultoria
- Operador

### Policies (recomendado para granularidade)
Exemplos:
- `CanManageUsers` (Admin/Gestor)
- `CanManageStores` (Admin/Gestor)
- `CanImportSpreadsheets` (Admin/Gestor)
- `CanViewCommissions` (Consultoria/Operador/Gestor/Admin)
- `CanConfigureCommissionMatrix` (Admin/Gestor)
- `CanManagePayments` (Admin/Gestor)

### 2FA e segurança
- 2FA habilitável por usuário (TOTP via Authenticator App)
- Lockout após tentativas falhas
- Auditoria de login e alterações críticas (matriz/pagamentos)

---

## Banco de dados (MySQL) — entidades principais (proposta)
> Esta modelagem é **proposta inicial** baseada no escopo e pode ser refinada conforme as planilhas e regras reais.

### Cadastros
#### Loja
- Id, RazaoSocial, NomeFantasia, Cnpj, ClienteDesde, Status
- Contatos (Telefone, Email)
- Endereços (1..N)
- Sócios (1..N)

#### Colaborador
- Id, Nome, Cpf, Email, Telefone (opcional), DataNascimento, Pix, Status
- Endereço (opcional)
- Relacionamentos:
  - Colaborador ↔ Loja (N..N)
  - Colaborador ↔ UsuárioIdentity (0..1 ou 1..1, conforme regra)

#### Produto
- Id, Codigo, Descricao
- TipoComissaoPadrao (Percentual/ValorFixo), ValorPadrao (opcional), Status

#### Banco / Instituição Financeira
Entidade necessária para suportar regras por instituição (ex.: incentivo do consultor para Daycoval e BBC) e para normalizar dados vindos das importações.

**InstituicaoFinanceira** (ou **Banco**)
- Id
- Nome (ex.: Banco Daycoval, Banco BBC)
- CodigoExterno (opcional: código do DMS/legado)
- Status (Ativo/Inativo)
- Observacao (opcional)

#### Contrato de adesão (por loja)
**ContratoAdesaoLoja**
- Id, LojaId
- ValorMensalidade, DataInicio, DataProximoReajuste, Descricao, Validade

---

## Matriz de comissão (Produto x Perfil) + histórico
### Comissão (vigente)
**ComissaoRegra**
- Id, ProdutoId, Perfil (Operador/Consultor/Social/etc)
- TipoComissao (Percentual/ValorFixo), Valor
- VigenciaInicio, VigenciaFim (opcional) ou “ativa”

### Histórico de alteração
**ComissaoRegraHistorico**
- Id, ComissaoRegraId, AlteradoEm, AlteradoPorUserId
- Snapshot (Tipo/Valor/Vigência) ou registro de mudanças

> Observação: o histórico pode ser implementado como tabela explícita (mais simples e auditável) ou por padrão de vigência (início/fim).

---

## Produção/Financiamentos (importação)
Como o escopo menciona importação, e considerando que os arquivos padrão serão `docs/Vendas.csv` e `docs/Itens.csv`, o processo será modelado em **duas fases**:

- **Staging (Raw Import)**: persistir cada linha “crua” do CSV + resultado de parse + erros, garantindo auditoria e reprocessamento.
- **Processamento (Normalizado)**: cruzar e validar dados entre Vendas e Itens e então gravar nas tabelas de domínio (Propostas/Itens/Financeiro) e gerar comissões.

### 1) Lote de importação (auditoria)
**ImportacaoArquivo**
- Id, NomeArquivo, TipoArquivo (CSV/Excel), Status, ProcessadoEm, ProcessadoPorUserId
- Hash/Checksum (opcional), EncodingDetectado (ex.: Windows-1252), Separador (ex.: `;`)
- Totais (linhas lidas/importadas/erros)

**ImportacaoErro**
- Id, ImportacaoId, TipoArquivo (Vendas/Itens), Linha
- Campo (opcional), Mensagem, ConteudoOriginal

> Observação: os headers dos CSVs podem vir com acentuação e variações de encoding (ex.: `C�d.` no arquivo), então o importador deve suportar **Windows-1252/ISO-8859-1** e normalização de headers.

### 2) Staging (linhas cruas) — para validação e rastreabilidade
Objetivo: garantir importação **idempotente**, auditável e com erros por linha sem “poluir” as tabelas definitivas.

**ImportacaoVendaRaw**
- Id, ImportacaoId, LinhaNumero
- CodigoProposta (campo `Cód. da Proposta`)
- CodigoPropostaDms (campo `Cód. da Proposta DMS`)
- ConteudoOriginal (linha completa)
- ParseOk (bool), ErrosJson (opcional), ImportadoEm
- Campos parseados principais (para facilitar validação e cruzamento), por exemplo:
  - LojaNome, LojaCnpj
  - ClienteCpfCnpj, ClienteNome
  - VendedorNome, VendedorCpf
  - Chassi
  - BancoNome, TipoFinanciamento
  - Status (campo `Situação`)
  - ValorFinanciado (campo `Valor Financiado`)
  - Datas (DataVenda, DataFechamento, DataFaturamento, DataPagamento, etc.)

**ImportacaoItemRaw**
- Id, ImportacaoId, LinhaNumero
- CodigoProposta (campo `Cód. da Proposta`)
- Tipo (campo `Tipo`)
- CodigoItem (campo `Código`)
- Fornecedor, Descricao
- Quantidade, ValorUnitario, Cortesia
- VendedorNome, VendedorCpf
- Chassi, ClienteNome (conforme arquivo)
- ConteudoOriginal, ParseOk, ErrosJson, ImportadoEm

Chaves/índices recomendados:
- Unique (ImportacaoId, LinhaNumero)
- Índices por `CodigoProposta` e `Chassi` para cruzamento eficiente.

### 3) Tabelas normalizadas (pós-cruzamento) — “modelo definitivo”
Após validar e cruzar `Vendas.csv` + `Itens.csv` por `CodigoProposta` (e conferências por `Chassi` quando aplicável), gravar nas tabelas definitivas abaixo.

#### Proposta/Venda (núcleo)
**Proposta**
- Id
- CodigoProposta (externo) — obrigatório
- CodigoPropostaDms (opcional)
- NumeroNf (campo `Número NF`, opcional)
- LojaId (resolvida por CNPJ; se não existir, pode ser criada/pendente)
- ClienteId (resolvido por CPF/CNPJ)
- VendedorId (resolvido por CPF)
- VeiculoId (resolvido por Chassi)
- TipoCliente, Departamento
- StatusProposta (ex.: Aprovada/Cancelada/…)
- Datas relevantes (Venda/Fechamento/Cancelamento/Faturamento/Pagamento/Envio/Retorno/Previsões)
- TipoFinanciamento, BancoId, TabelaCodigo/Descricao (quando existir)
- Valores financeiros principais:
  - ValorFinanciado
  - ValorVeiculo, RecursosProprios, TrocoCliente, Entrada, ValorNota, etc. (conforme colunas do CSV)
- Auditoria:
  - ImportacaoArquivoId (origem), ImportadoEm, ImportadoPorUserId
- Idempotência:
  - IdentificadorExterno (ex.: `CodigoProposta + LojaCnpj` ou hash da linha), para evitar duplicidade no reprocessamento

#### Itens vinculados à proposta
**PropostaItem**
- Id
- PropostaId (FK)
- Tipo (ex.: F&I)
- CodigoItem, Fornecedor, Descricao
- Quantidade, ValorUnitario, Cortesia (bool)
- VendedorId (quando houver divergência do vendedor da proposta, manter por item)

#### Entidades auxiliares para normalização
**Cliente**
- Id, TipoPessoa (F/J), CpfCnpj, Nome, Telefones (opcional)

**Veiculo**
- Id, Chassi, TipoVeiculo, Segmento, Marca, Modelo, Descricao, Cor, AnoFabricacao, AnoModelo, Placa (quando houver)

**InstituicaoFinanceira** (Cadastro)
- Id, Nome
- CodigoDmsCdc (opcional), CodigoDmsLeasing (opcional) ou outros códigos externos

> Observação: nem todos os campos do `Vendas.csv` precisam ir para tabelas próprias no MVP; alguns podem ficar na `Proposta` como colunas até o modelo estabilizar.

### 4) Validações mínimas do pipeline de importação
- **Estruturais**:
  - Separador `;` e presença do header esperado
  - Encoding compatível (Windows-1252/ISO-8859-1) e normalização
- **Chaves**:
  - `CodigoProposta` obrigatório em Vendas e Itens
  - `Chassi` obrigatório quando o negócio exigir vínculo com veículo
- **Consistência entre arquivos**:
  - Todo `ImportacaoItemRaw.CodigoProposta` deve existir em `ImportacaoVendaRaw` do mesmo lote (ou ir para fila de pendência/erro)
  - Se `Chassi` existir nos dois, deve bater (senão erro de consistência)
- **Tipos e formatos**:
  - Datas válidas (pt-BR `dd/MM/yyyy`)
  - Decimais em pt-BR (`1.234,56`) e percentuais (`2,05%`)
  - CNPJ/CPF formatados e validados
- **Regras de negócio (pós-normalização)**:
  - A partir de `Proposta` + `PropostaItem` calcular “base de comissão” e gerar `ComissaoApurada` conforme matriz vigente e regras de incentivo.

### 5) Observação importante (detalhamento futuro)
- O **detalhamento das colunas** de `Vendas.csv` e `Itens.csv` (mapeamento coluna → campo → tabela) será descrito mais à frente, quando o layout for fechado.
- As **fórmulas de cálculo** (comissão, bases de cálculo, cruzamentos, regras de validação específicas por coluna) também serão documentadas em etapa posterior.

---

## Comissão apurada e pagamentos
### Comissão apurada
**ComissaoApurada**
- Id
- PropostaId (FK)
- PropostaItemId (FK, opcional — quando a comissão for itemizada)
- DestinatarioTipo (Consultor/Operador/Gestor)
- DestinatarioId (ColaboradorId ou outro)
- RegraAplicadaId
- BaseCalculo (ex.: ValorFinanciado / ValorItem / outro), BaseTipo (enum)
- ValorComissao, CalculadaEm
- Status (Pendente/Aprovada/Paga/Cancelada)

### Pagamento (lote) e itens
**PagamentoComissao**
- Id, Competencia (mês/ano), PagoEm, PagoPorUserId
- ValorTotal, Observacao

**PagamentoItem**
- Id, PagamentoId, ComissaoApuradaId, ValorPago

---

## Regras de negócio principais (escopo → casos de uso)
### Usuários (Admin/Gestor)
- Criar usuário, definir role, status (Ativo/Inativo/Bloqueado)
- Habilitar 2FA
- Bloquear/desbloquear

### Lojas (Admin/Gestor)
- CRUD de lojas + sócios + endereços
- Vincular contrato de adesão (mensalidade, reajuste, validade)

### Colaboradores
- CRUD de colaborador (CPF, PIX etc.)
- Vincular colaborador a lojas
- Vincular colaborador ao usuário (se necessário)

### Produtos
- CRUD produto e tipo de comissão

### Matriz de comissão (Admin/Gestor)
- Definir comissão por Produto x Perfil
- Toda alteração gera **histórico** (quem alterou, quando, valores anteriores)

### Importação de planilhas (Admin/Gestor)
- Upload de CSV/Excel
- Validação, idempotência, logs de erros por linha
- Persistir **Propostas/Itens** (pós-cruzamento `Vendas.csv` + `Itens.csv`) e gerar comissões apuradas conforme regras vigentes

### Incentivo consultor (regra manual inicial)
Regra descrita no escopo:
- Consultor recebe **1%** sobre todo o volume financiado das lojas cadastradas por ele (Daycoval e BBC)

Implicações de modelo:
- A **Instituição Financeira** deve existir como entidade de cadastro e estar vinculada às operações importadas (`Proposta`/produção), permitindo filtrar e aplicar regras por banco.
- No mínimo, a entidade deve suportar identificar **Daycoval** e **BBC** de forma consistente (por nome/código).

Implementação inicial (manual assistida pelo sistema):
- Tela para selecionar **consultor + período**
- Sistema calcula volume total das lojas vinculadas ao consultor e gera “comissão incentivo”
- Possibilidade de ajuste manual (com auditoria)

Evolução futura:
- Automatizar ao importar produção, desde que os vínculos loja→consultor estejam completos

### Pagamento de comissão
- Listar comissões pendentes por período/colaborador/perfil
- Aprovar e marcar como pagas (com lote de pagamento)
- Relatório de pagamentos

### Dashboard e relatórios
Dashboard (exemplos de indicadores):
- Produção total
- Comissão pendente vs paga
- Top lojas
- Top colaboradores

Relatórios (mínimo do escopo + extensões):
- Comissão por Perfil
- Comissão por Loja
- Comissão por Colaborador
- Pagamentos por competência
- Produção por banco/produto/período

---

## UI/UX (responsivo)
- Layout:
  - Topbar (usuário/logoff)
  - Sidebar colapsável (mobile-first)
  - Menus filtrados por Role/Policy
- Formulários:
  - Validação e máscaras (CNPJ/CPF/valor monetário)
- Listagens:
  - Paginação e filtro (importações, produção, comissões)
- Mobile:
  - Menus em drawer
  - Tabelas adaptadas (cards/colunas reduzidas)

---

## Padrões de implementação (SOLID/IoC)
- Cada caso de uso em `Application` com responsabilidade única:
  - `CreateLojaUseCase`, `UpdateProdutoUseCase`, `ImportProducaoUseCase`, etc.
- `Infrastructure` implementa:
  - `ILojaRepository`, `IProdutoRepository`, etc.
- `Web` orquestra UI → chama `Application`
- Cross-cutting:
  - `ICurrentUserService` para usuário logado
  - `IDateTimeProvider` para tempo testável
  - `IAuditTrail` para auditoria

---

## Configuração, ambientes e migrações
- `appsettings.json` / `appsettings.Development.json`
  - ConnectionString MySQL
  - Logging
  - Config Identity (senha, lockout, etc.)
- EF Migrations versionadas no `Infrastructure`
- Seed inicial:
  - Roles
  - Usuário Admin padrão (somente em DEV ou via comando controlado)

---

## Testes (recomendação)
- **Domain**: testes de regras (ex.: cálculo de comissão)
- **Application**: testes de casos de uso (mock de repositórios/serviços)
- **Infrastructure**: testes de repositório (opcional, com MySQL em container)
- **Web**: smoke tests (opcional)

---

## Entregáveis do “primeiro corte” (MVP técnico)
- Solução + camadas + DI
- EF Core + MySQL + migrations
- Identity + Roles + 2FA habilitável
- Layout responsivo + login/register
- CRUD básico (Loja, Produto, Colaborador)
- Matriz de comissão + histórico (CRUD + auditoria)
- Importação (um tipo de arquivo inicialmente) + log de erros
- Tela de consulta de comissões por perfil

---

## Decisões em aberto (para fechar a Arquitetura v1)
- **UI**: Bootstrap 5 ou MudBlazor?
- **Perfis da matriz**: além de Operador/Consultor, “Social” é um perfil real? Quais perfis entram na matriz?
- **Vínculo consultor→lojas**: loja tem 1 consultor responsável ou pode ter vários consultores ao longo do tempo (com histórico)?
- **Importações**: quais arquivos serão padrão (ex.: os que estão em `docs/`) e quais colunas são obrigatórias?


