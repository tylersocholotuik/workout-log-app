using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WorkoutLogAPI.Migrations
{
    /// <inheritdoc />
    public partial class AddFinishedAtToWorkouts : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "finished_at",
                table: "workouts",
                type: "timestamp with time zone",
                nullable: true);
            
            // Backfill: Set finished_at to created_at or updated_at for existing workouts
            migrationBuilder.Sql(@"
                UPDATE workouts
                SET finished_at = COALESCE(updated_at, created_at)
                WHERE finished_at IS NULL;
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "finished_at",
                table: "workouts");
        }
    }
}
