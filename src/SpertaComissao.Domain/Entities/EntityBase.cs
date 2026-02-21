namespace SpertaComissao.Domain.Entities;

/// <summary>
/// Entidade base com identificador e auditoria mínima (DDD).
/// </summary>
public abstract class EntityBase
{
    public string Id { get; protected set; } = string.Empty;
    public DateTime CreatedAt { get; protected set; }
    public DateTime? UpdatedAt { get; protected set; }
}
