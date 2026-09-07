using Microsoft.EntityFrameworkCore;
using WorkoutLogAPI.Enums;
using WorkoutLogAPI.Models;

namespace WorkoutLogAPI.Data;

public class WorkoutDbContext : DbContext
{
    public WorkoutDbContext(DbContextOptions<WorkoutDbContext> options) : base(options)
    {
    }

    public DbSet<User> Users { get; set; }
    public DbSet<Exercise> Exercises { get; set; }
    public DbSet<Workout> Workouts { get; set; }
    public DbSet<WorkoutExercise> WorkoutExercises { get; set; }
    public DbSet<Set> Sets { get; set; }
    public DbSet<RevokedToken> RevokedTokens { get; set; }

    public override int SaveChanges()
    {
        UpdateTimestamps();
        return base.SaveChanges();
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        UpdateTimestamps();
        return base.SaveChangesAsync(cancellationToken);
    }

    private void UpdateTimestamps()
    {
        var entries = ChangeTracker.Entries()
            .Where(e => e.Entity is IAuditableEntity && e.State == EntityState.Modified);

        foreach (var entry in entries)
        {
            if (entry.Entity is IAuditableEntity entity)
            {
                entity.UpdatedAt = DateTime.UtcNow;
            }
        }
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // The relationships, indexes, column/table naming, and max lengths below are all
        // configured via data annotations directly on the entity classes. Only configuration
        // with no data annotation equivalent lives here: delete behavior and check constraints.

        modelBuilder.Entity<Exercise>(entity =>
        {
            // Foreign key to User (nullable - null means system exercise)
            entity.HasOne(e => e.User)
                .WithMany(u => u.Exercises)
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            // Prevent deleting system exercises (UserId = null)
            entity.ToTable(t => t.HasCheckConstraint(
                "CK_Exercise_SystemExercise_NotDeleted",
                "\"user_id\" IS NOT NULL OR \"deleted\" = false"
            ));
        });

        modelBuilder.Entity<Workout>(entity =>
        {
            entity.HasOne(w => w.User)
                .WithMany(u => u.Workouts)
                .HasForeignKey(w => w.UserId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<WorkoutExercise>(entity =>
        {
            entity.HasOne(we => we.Exercise)
                .WithMany(e => e.WorkoutExercises)
                .HasForeignKey(we => we.ExerciseId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(we => we.Workout)
                .WithMany(w => w.Exercises)
                .HasForeignKey(we => we.WorkoutId)
                .OnDelete(DeleteBehavior.Restrict);

            // Store the enum as its lowercase name ("lbs"/"kg") instead of the default
            // int, so the column stays human-readable and matches the API's JSON values.
            entity.Property(we => we.WeightUnit)
                .HasConversion(
                    unit => unit.ToString().ToLowerInvariant(),
                    value => Enum.Parse<WeightUnit>(value, ignoreCase: true));
        });

        modelBuilder.Entity<Set>(entity =>
        {
            entity.HasOne(s => s.Exercise)
                .WithMany(we => we.Sets)
                .HasForeignKey(s => s.ExerciseId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<RevokedToken>(entity =>
        {
            entity.HasIndex(rt => rt.Jti).IsUnique();
        });
    }
}
