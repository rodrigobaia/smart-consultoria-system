namespace SpertaComissao.Application.Common;

/// <summary>
/// Abstração para data/hora (testabilidade e consistência).
/// </summary>
public interface IDateTimeProvider
{
    DateTime UtcNow { get; }
}
