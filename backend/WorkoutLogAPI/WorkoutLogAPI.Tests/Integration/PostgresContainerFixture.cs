using Npgsql;
using Testcontainers.PostgreSql;
using Xunit;

namespace WorkoutLogAPI.Tests.Integration;

/// <summary>
/// Starts one real Postgres container (via Testcontainers, the same <c>postgres:16</c>
/// image used by the project's docker-compose setup) for the whole test run, shared by
/// every integration test class in the <see cref="PostgresCollection"/> collection.
///
/// Individual test classes don't run against this database directly - each
/// <see cref="CustomWebApplicationFactory"/> instance creates and drops its own
/// short-lived database *inside* this container (see
/// <see cref="CreateDatabaseAsync"/>/<see cref="DropDatabaseAsync"/>), so tests stay
/// isolated from one another without paying the cost of starting a new container per
/// test class.
/// </summary>
public class PostgresContainerFixture : IAsyncLifetime
{
    private readonly PostgreSqlContainer _container = new PostgreSqlBuilder("postgres:16-alpine")
        .WithDatabase("workout_log_test")
        .WithUsername("postgres")
        .WithPassword("postgres")
        .Build();

    public Task InitializeAsync() => _container.StartAsync();

    public Task DisposeAsync() => _container.DisposeAsync().AsTask();

    /// <summary>
    /// Creates a brand-new, empty database in the shared container and returns a
    /// connection string pointing at it. Schema creation (migrations) is left to the
    /// application itself, exactly as it happens in production.
    /// </summary>
    public async Task<string> CreateDatabaseAsync(string databaseName)
    {
        await using var connection = new NpgsqlConnection(_container.GetConnectionString());
        await connection.OpenAsync();
        await using var command = connection.CreateCommand();
        command.CommandText = $"CREATE DATABASE \"{databaseName}\"";
        await command.ExecuteNonQueryAsync();

        var builder = new NpgsqlConnectionStringBuilder(_container.GetConnectionString())
        {
            Database = databaseName
        };
        return builder.ConnectionString;
    }

    public async Task DropDatabaseAsync(string databaseName)
    {
        // Clear the pool first so Npgsql doesn't keep idle connections to the
        // database open in the background, which would otherwise make DROP DATABASE fail.
        NpgsqlConnection.ClearAllPools();

        await using var connection = new NpgsqlConnection(_container.GetConnectionString());
        await connection.OpenAsync();
        await using var command = connection.CreateCommand();
        command.CommandText = $"DROP DATABASE IF EXISTS \"{databaseName}\" WITH (FORCE)";
        await command.ExecuteNonQueryAsync();
    }
}

/// <summary>
/// xUnit collection tying every integration test class to the single shared
/// <see cref="PostgresContainerFixture"/>, so the container is started once for the
/// whole test run instead of once per test class.
/// </summary>
[CollectionDefinition(Name)]
public class PostgresCollection : ICollectionFixture<PostgresContainerFixture>
{
    public const string Name = "Postgres Integration Tests";
}
