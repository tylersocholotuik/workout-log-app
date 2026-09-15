using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using WorkoutLogAPI.Data;

namespace WorkoutLogAPI.Tests.TestHelpers;

/// <summary>
/// Creates a <see cref="WorkoutDbContext"/> backed by a real (if temporary) SQLite
/// database instead of EF Core's InMemory provider.
///
/// Why this exists alongside <see cref="InMemoryDbContextFactory"/>: EF Core's InMemory
/// provider isn't a real relational database - it doesn't support some relational-only
/// query translations, notably <c>ExecuteDeleteAsync</c>/<c>ExecuteUpdateAsync</c> (used by
/// <c>JwtService.RevokeTokenAsync</c> to purge expired revoked tokens). SQLite is a real
/// relational engine, so it supports those translations and is a closer
/// stand-in for the production PostgreSQL database. Prefer InMemoryDbContextFactory by
/// default for speed/simplicity, and reach for this one specifically when the code under
/// test relies on relational-only EF Core features.
///
/// The underlying SQLite connection is opened against ":memory:" and kept open for the
/// lifetime of the returned context (EF Core holds a reference to it), which is what keeps
/// the in-memory database alive - SQLite normally destroys an in-memory database as soon as
/// its connection closes. Each call gets its own brand-new connection/database, so tests
/// remain isolated from one another.
/// </summary>
public static class SqliteInMemoryDbContextFactory
{
    public static WorkoutDbContext Create()
    {
        var connection = new SqliteConnection("DataSource=:memory:");
        connection.Open();

        var options = new DbContextOptionsBuilder<WorkoutDbContext>()
            .UseSqlite(connection)
            .Options;

        var context = new WorkoutDbContext(options);
        context.Database.EnsureCreated();
        return context;
    }
}
