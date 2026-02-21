#!/usr/bin/env bash
# SpertaComissao - Cria solution e projetos com .NET 9 (dotnet new)
# Executar na raiz do repositório: bash src/scripts/create-solution.sh
# Ou dentro de src: bash scripts/create-solution.sh

set -e
# Trabalhar na pasta src (onde fica a solution)
if [ -f "SpertaComissao.sln" ]; then
  SRC_DIR="."
elif [ -f "src/SpertaComissao.sln" ]; then
  cd src
else
  SRC_DIR="."
fi

echo "Criando solution e projetos com .NET 9 em $(pwd)..."

# Solution
dotnet new sln -n SpertaComissao -o . --force 2>/dev/null || dotnet new sln -n SpertaComissao -o .

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

echo "Solution e projetos criados. Próximo passo: adicionar código (Domain, Application, Infrastructure) e configurar DI."
dotnet build SpertaComissao.sln
