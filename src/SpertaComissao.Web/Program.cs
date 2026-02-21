using SpertaComissao.Application;
using SpertaComissao.Infrastructure;
using SpertaComissao.Web;

var builder = WebApplication.CreateBuilder(args);

// Clean Architecture: IoC por camada
builder.Services.AddApplication();
builder.Services.AddInfrastructure(builder.Configuration);

builder.Services.AddRazorComponents()
    .AddInteractiveServerComponents();

var app = builder.Build();

if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Error", createScopeForErrors: true);
    app.UseHsts();
}

app.UseHttpsRedirection();
app.UseStaticFiles();
app.UseAntiforgery();

app.MapRazorComponents<App>()
    .AddInteractiveServerRenderMode();

// Rota raiz redireciona para a POC (quando servida em /poc) ou para a página Blazor
app.MapGet("/", () => Results.Redirect("/poc/")).ExcludeFromDescription();

app.Run();
