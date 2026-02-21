using Microsoft.Extensions.DependencyInjection;
using SpertaComissao.Application.Common;

namespace SpertaComissao.Application;

/// <summary>
/// Extensão de IoC para a camada Application (Clean Architecture).
/// </summary>
public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddScoped<IDateTimeProvider, DateTimeProvider>();
        return services;
    }
}
