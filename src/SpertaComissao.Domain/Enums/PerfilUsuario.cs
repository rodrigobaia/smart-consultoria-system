namespace SpertaComissao.Domain.Enums;

/// <summary>
/// Perfis de acesso do sistema (roles).
/// </summary>
public static class PerfilUsuario
{
    public const string Administrador = "Administrador";
    public const string Gestor = "Gestor";
    public const string Consultor = "Consultor";
    public const string Operador = "Operador";
    public const string Auxiliar = "Auxiliar";

    public static readonly IReadOnlyList<string> Todos = new[]
    {
        Administrador, Gestor, Consultor, Operador, Auxiliar
    };
}
