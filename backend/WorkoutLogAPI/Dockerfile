# syntax=docker/dockerfile:1

# ---- Build & publish ----
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Copy only the project file first so `dotnet restore` is cached separately
# from source changes (faster rebuilds when only .cs files change).
COPY WorkoutLogAPI/WorkoutLogAPI.csproj WorkoutLogAPI/
RUN dotnet restore WorkoutLogAPI/WorkoutLogAPI.csproj

# Copy the rest of the source and publish a self-contained release build.
COPY WorkoutLogAPI/ WorkoutLogAPI/
RUN dotnet publish WorkoutLogAPI/WorkoutLogAPI.csproj \
    -c Release \
    -o /app/publish \
    --no-restore

# ---- Runtime ----
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish .

ENV ASPNETCORE_ENVIRONMENT=Production
EXPOSE 8080

# Render assigns a dynamic $PORT at runtime; Kestrel must bind to it.
# Falls back to 8080 for local `docker run` testing where $PORT isn't set.
CMD ["/bin/sh", "-c", "ASPNETCORE_URLS=http://+:${PORT:-8080} dotnet WorkoutLogAPI.dll"]
