using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WorkoutLogAPI.Migrations
{
    /// <inheritdoc />
    public partial class AddExerciseTypeAndCardioFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "weight_unit",
                table: "workout_exercises",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AddColumn<string>(
                name: "distance_unit",
                table: "workout_exercises",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "distance",
                table: "sets",
                type: "double precision",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "duration_seconds",
                table: "sets",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "target_distance_max",
                table: "sets",
                type: "double precision",
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "target_distance_min",
                table: "sets",
                type: "double precision",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "target_seconds_max",
                table: "sets",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "target_seconds_min",
                table: "sets",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "exercise_type",
                table: "exercises",
                type: "text",
                nullable: false,
                defaultValue: "reps");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "distance_unit",
                table: "workout_exercises");

            migrationBuilder.DropColumn(
                name: "distance",
                table: "sets");

            migrationBuilder.DropColumn(
                name: "duration_seconds",
                table: "sets");

            migrationBuilder.DropColumn(
                name: "target_distance_max",
                table: "sets");

            migrationBuilder.DropColumn(
                name: "target_distance_min",
                table: "sets");

            migrationBuilder.DropColumn(
                name: "target_seconds_max",
                table: "sets");

            migrationBuilder.DropColumn(
                name: "target_seconds_min",
                table: "sets");

            migrationBuilder.DropColumn(
                name: "exercise_type",
                table: "exercises");

            migrationBuilder.AlterColumn<string>(
                name: "weight_unit",
                table: "workout_exercises",
                type: "text",
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);
        }
    }
}
