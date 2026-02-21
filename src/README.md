# SpertaComissao — Solução .NET 9 (Clean Architecture + DDD)

Prova de conceito da **Etapa 2** do plano de desenvolvimento. A solução compila, executa e serve a **POC (HTML/JS)** em Docker.

## Recriar a solution e projetos com .NET 9 (dotnet new)

Para gerar a estrutura usando os comandos oficiais do .NET 9 (class library e Blazor Server):

**PowerShell** (na raiz do repo ou dentro de `src`):
```powershell
.\src\scripts\create-solution.ps1
```

**Bash** (na raiz do repo ou dentro de `src`):
```bash
bash src/scripts/create-solution.sh
```

Os comandos utilizados internamente:
- `dotnet new sln -n SpertaComissao`
- `dotnet new classlib -n SpertaComissao.Domain -f net9.0`
- `dotnet new classlib -n SpertaComissao.Application -f net9.0`
- `dotnet new classlib -n SpertaComissao.Infrastructure -f net9.0`
- `dotnet new blazorserver -n SpertaComissao.Web -f net9.0`
- Referências entre projetos (Clean Architecture) e `dotnet sln add`.

## Estrutura (Clean Architecture)

| Projeto | Responsabilidade |
|--------|-------------------|
| **SpertaComissao.Domain** | Entidades, value objects, enums, contratos de repositório. Sem dependências externas. |
| **SpertaComissao.Application** | Casos de uso, DTOs, interfaces de serviços (ex.: `IDateTimeProvider`). DI: `AddApplication()`. |
| **SpertaComissao.Infrastructure** | EF Core, MySQL (Pomelo), DbContext, repositórios. DI: `AddInfrastructure(config)`. |
| **SpertaComissao.Web** | Blazor Server, layout, páginas. Servindo a POC estática em `/poc/`. |

## Como executar localmente

```bash
cd src
dotnet restore SpertaComissao.sln
dotnet build SpertaComissao.sln
dotnet run --project SpertaComissao.Web
```

- **Blazor**: http://localhost:5000/blazor  
- **POC**: copie o conteúdo da pasta `../docs` para `SpertaComissao.Web/wwwroot/poc` e acesse http://localhost:5000/poc/  
- **Raiz**: http://localhost:5000 redireciona para `/poc/`

## Como executar no Docker (POC)

Na **raiz do repositório** (onde estão as pastas `src` e `docs`):

```bash
docker compose -f src/docker-compose.yml up --build
```

- Aplicação: http://localhost:5080  
- POC: http://localhost:5080/poc/  
- Blazor: http://localhost:5080/blazor  

A pasta `docs/` é copiada para `wwwroot/poc` na imagem Docker, então a POC é servida como arquivos estáticos em `/poc/`.

## Configuração

- **Connection string MySQL**: `appsettings.Development.json` (placeholder). Para uso com EF/Identity nas próximas etapas, descomente o serviço `mysql` em `src/docker-compose.yml` e ajuste a connection string no serviço `web`.

## Próximas etapas (plano)

- Etapa 3: Identity (AuthN/AuthZ), Roles, 2FA (base)
- Etapa 4+: Entidades, migrações, telas Blazor
