using Microsoft.EntityFrameworkCore;
using WorkoutLogAPI.Data.Converters;
using WorkoutLogAPI.Enums;
using WorkoutLogAPI.Models;

namespace WorkoutLogAPI.Data;

public class WorkoutDbContext : DbContext
{
    public WorkoutDbContext(DbContextOptions<WorkoutDbContext> options) : base(options)
    {
    }

    public DbSet<User> Users { get; set; }
    public DbSet<UserSettings> UserSettings { get; set; }
    public DbSet<Exercise> Exercises { get; set; }
    public DbSet<Workout> Workouts { get; set; }
    public DbSet<WorkoutExercise> WorkoutExercises { get; set; }
    public DbSet<Set> Sets { get; set; }
    public DbSet<RevokedToken> RevokedTokens { get; set; }
    public DbSet<PasswordResetToken> PasswordResetTokens { get; set; }

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

    protected override void ConfigureConventions(ModelConfigurationBuilder configurationBuilder)
    {
        // Store every occurrence of these enum types as their lowercase name
        // (e.g. "lbs") instead of the default int, so columns stay human-readable
        // and match the API's JSON values.
        configurationBuilder.Properties<Theme>().HaveConversion<LowercaseEnumConverter<Theme>>();
        configurationBuilder.Properties<WeightUnit>().HaveConversion<LowercaseEnumConverter<WeightUnit>>();
        configurationBuilder.Properties<DistanceUnit>().HaveConversion<LowercaseEnumConverter<DistanceUnit>>();
        configurationBuilder.Properties<EffortRatingType>().HaveConversion<LowercaseEnumConverter<EffortRatingType>>();
        configurationBuilder.Properties<ExerciseType>().HaveConversion<LowercaseEnumConverter<ExerciseType>>();
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // The relationships, indexes, column/table naming, and max lengths below are all
        // configured via data annotations directly on the entity classes. Only configuration
        // with no data annotation equivalent lives here: delete behavior and check constraints.

        modelBuilder.Entity<User>(entity =>
        {
            entity.HasIndex(e => e.Email).IsUnique();
        });
        
        modelBuilder.Entity<UserSettings>(entity =>
        {
            entity.HasKey(us => us.UserId);
            entity.HasOne(us => us.User)
                .WithOne(u => u.Settings)
                .HasForeignKey<UserSettings>(us => us.UserId)
                .OnDelete(DeleteBehavior.Cascade);
            
            // Dark (not Light, the enum's zero value) is both the CLR default and the
            // DB default, so the sentinel must be set explicitly - otherwise EF can't
            // distinguish "unset" from an explicit Theme.Light assignment and would
            // silently override Light with the DB default on insert.
            entity.Property(us => us.Theme)
                .HasDefaultValue(Theme.Dark)
                .HasSentinel(Theme.Dark);
            entity.Property(us => us.WeightUnit).HasDefaultValue(WeightUnit.Lbs);
            entity.Property(us => us.DistanceUnit).HasDefaultValue(DistanceUnit.Meters);
            entity.Property(us => us.EffortType).HasDefaultValue(EffortRatingType.Rpe);
        });

        modelBuilder.Entity<Exercise>(entity =>
        {
            // Foreign key to User (nullable - null means system exercise)
            entity.HasOne(e => e.User)
                .WithMany(u => u.Exercises)
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Restrict);
            
            entity.Property(e => e.ExerciseType).HasDefaultValue(ExerciseType.Reps);

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

            entity.Property(we => we.EffortType).HasDefaultValue(EffortRatingType.Rpe);
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

        modelBuilder.Entity<PasswordResetToken>(entity =>
        {
            entity.HasIndex(prt => prt.UserId);
        });
    }
}
