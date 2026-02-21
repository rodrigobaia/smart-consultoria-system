namespace SpertaComissao.Application.Common;

/// <summary>
/// Implementação padrão de IDateTimeProvider.
/// </summary>
public sealed class DateTimeProvider : IDateTimeProvider
{
    public DateTime UtcNow => DateTime.UtcNow;
}
