using Microsoft.AspNetCore.Mvc.Testing;

namespace WorkoutLogAPI.Tests.Integration;

/// <summary>
/// Common setup/teardown for controller integration tests: provisions a fresh
/// <see cref="CustomWebApplicationFactory"/> (and its own Postgres database) and an
/// <see cref="HttpClient"/> pointed at it, and cleans both up afterwards.
///
/// Test classes must be decorated with <c>[Collection(PostgresCollection.Name)]</c> so
/// xUnit injects the shared <see cref="PostgresContainerFixture"/> constructor
/// parameter they pass through to this base class.
/// </summary>
public abstract class IntegrationTestBase : IAsyncLifetime
{
    private readonly CustomWebApplicationFactory _factory;
    protected HttpClient Client { get; private set; } = null!;

    protected IntegrationTestBase(PostgresContainerFixture postgres)
    {
        _factory = new CustomWebApplicationFactory(postgres);
    }

    public async Task InitializeAsync()
    {
        await _factory.InitializeAsync();

        Client = _factory.CreateClient(new WebApplicationFactoryClientOptions
        {
            AllowAutoRedirect = false
        });
    }

    public async Task DisposeAsync()
    {
        Client.Dispose();
        await ((IAsyncLifetime)_factory).DisposeAsync();
    }
}
