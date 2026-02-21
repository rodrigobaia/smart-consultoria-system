# SpertaComissao - Cria solution e projetos com .NET 9 (dotnet new)
# Executar na raiz do repositório: .\src\scripts\create-solution.ps1
# Ou dentro de src: .\scripts\create-solution.ps1

$ErrorActionPreference = "Stop"
# Sempre trabalhar na pasta que contém a solution (src)
$srcDir = if (Test-Path "SpertaComissao.sln") { (Get-Location).Path } elseif (Test-Path "src\SpertaComissao.sln") { "src" } else { "." }
if ($srcDir -eq "src") { Push-Location src }

Write-Host "Criando solution e projetos com .NET 9 em $(Get-Location)..." -ForegroundColor Cyan

# Solution
dotnet new sln -n SpertaComissao -o . --force 2>$null
if (-not $?) {
    dotnet new sln -n SpertaComissao -o .
}

# Class Library - Domain
dotnet new classlib -n SpertaComissao.Domain -f net9.0 -o SpertaComissao.Domain -lang C#
# Class Library - Application
dotnet new classlib -n SpertaComissao.Application -f net9.0 -o SpertaComissao.Application -lang C#
# Class Library - Infrastructure
dotnet new classlib -n SpertaComissao.Infrastructure -f net9.0 -o SpertaComissao.Infrastructure -lang C#
# Blazor Server - Web
dotnet new blazorserver -n SpertaComissao.Web -f net9.0 -o SpertaComissao.Web -lang C#

# Adicionar projetos à solution
dotnet sln SpertaComissao.sln add SpertaComissao.Domain/SpertaComissao.Domain.csproj
dotnet sln SpertaComissao.sln add SpertaComissao.Application/SpertaComissao.Application.csproj
dotnet sln SpertaComissao.sln add SpertaComissao.Infrastructure/SpertaComissao.Infrastructure.csproj
dotnet sln SpertaComissao.sln add SpertaComissao.Web/SpertaComissao.Web.csproj

# Referências entre projetos (Clean Architecture)
dotnet add SpertaComissao.Application/SpertaComissao.Application.csproj reference SpertaComissao.Domain/SpertaComissao.Domain.csproj
dotnet add SpertaComissao.Infrastructure/SpertaComissao.Infrastructure.csproj reference SpertaComissao.Application/SpertaComissao.Application.csproj SpertaComissao.Domain/SpertaComissao.Domain.csproj
dotnet add SpertaComissao.Web/SpertaComissao.Web.csproj reference SpertaComissao.Application/SpertaComissao.Application.csproj SpertaComissao.Infrastructure/SpertaComissao.Infrastructure.csproj

Write-Host "Solution e projetos criados. Próximo passo: adicionar código (Domain, Application, Infrastructure) e configurar DI." -ForegroundColor Green
dotnet build SpertaComissao.sln

if ($srcDir -eq "src") { Pop-Location }
