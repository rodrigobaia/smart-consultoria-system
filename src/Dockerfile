# SpertaComissao - prova de conceito (POC no Docker)
# Build a partir da raiz do repositório: docker build -f src/Dockerfile .
# A POC (pasta docs/) é copiada para wwwroot/poc e servida em /poc/

FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Contexto = raiz do repo: copiar solution e projetos (caminhos relativos a src/)
COPY src/SpertaComissao.sln ./
COPY src/SpertaComissao.Domain/*.csproj ./SpertaComissao.Domain/
COPY src/SpertaComissao.Application/*.csproj ./SpertaComissao.Application/
COPY src/SpertaComissao.Infrastructure/*.csproj ./SpertaComissao.Infrastructure/
COPY src/SpertaComissao.Web/*.csproj ./SpertaComissao.Web/

RUN dotnet restore SpertaComissao.sln

COPY src/ ./

WORKDIR /src/SpertaComissao.Web
RUN dotnet publish -c Release -o /app/publish --no-restore

# Copiar POC para wwwroot/poc (contexto = raiz do repo)
COPY docs/ /app/publish/wwwroot/poc/

FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS runtime
WORKDIR /app
EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080
ENV ASPNETCORE_ENVIRONMENT=Production

COPY --from=build /app/publish .

ENTRYPOINT ["dotnet", "SpertaComissao.Web.dll"]
