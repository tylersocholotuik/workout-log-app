using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WorkoutLogAPI.Migrations
{
    /// <inheritdoc />
    public partial class AddEffortTypeToWorkoutExercisesAndEffortRatingToSets : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "rpe",
                table: "sets",
                newName: "effort_rating");

            migrationBuilder.AddColumn<string>(
                name: "effort_type",
                table: "workout_exercises",
                type: "text",
                nullable: false,
                defaultValue: "rpe");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "effort_type",
                table: "workout_exercises");

            migrationBuilder.RenameColumn(
                name: "effort_rating",
                table: "sets",
                newName: "rpe");
        }
    }
}
