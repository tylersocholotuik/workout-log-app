using Microsoft.EntityFrameworkCore;
using WorkoutLogAPI.Data;

namespace WorkoutLogAPI.Tests.TestHelpers;

/// <summary>
/// Creates a fresh, isolated <see cref="WorkoutDbContext"/> backed by EF Core's InMemory
/// provider instead of PostgreSQL.
///
/// DbContext's DbSet properties are not virtual members, so Moq cannot intercept/override them.
/// The InMemory provider gives us a real EF Core pipeline that behaves like a real database 
/// without needing an actual PostgreSQL instance in CI.
///
/// Each call uses a new, uniquely-named database (via Guid) so tests never share state or
/// interfere with each other, even when they run in parallel.
/// </summary>
public static class InMemoryDbContextFactory
{
    public static WorkoutDbContext Create()
    {
        var options = new DbContextOptionsBuilder<WorkoutDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        return new WorkoutDbContext(options);
    }
}
