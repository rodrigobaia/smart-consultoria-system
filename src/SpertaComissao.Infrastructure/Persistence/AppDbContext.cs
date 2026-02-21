using Microsoft.EntityFrameworkCore;

namespace SpertaComissao.Infrastructure.Persistence;

/// <summary>
/// DbContext principal. Entidades e DbSets serão adicionados nas próximas etapas (Identity, Loja, Produto, etc.).
/// </summary>
public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options)
    {
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        // Configurações de entidades e seeds nas próximas etapas.
    }
}
