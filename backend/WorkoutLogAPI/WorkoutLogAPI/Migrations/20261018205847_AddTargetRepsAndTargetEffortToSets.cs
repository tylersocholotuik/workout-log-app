using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WorkoutLogAPI.Migrations
{
    /// <inheritdoc />
    public partial class AddTargetRepsAndTargetEffortToSets : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<double>(
                name: "target_effort_max",
                table: "sets",
                type: "double precision",
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "target_effort_min",
                table: "sets",
                type: "double precision",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "target_reps_max",
                table: "sets",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "target_reps_min",
                table: "sets",
                type: "integer",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "target_effort_max",
                table: "sets");

            migrationBuilder.DropColumn(
                name: "target_effort_min",
                table: "sets");

            migrationBuilder.DropColumn(
                name: "target_reps_max",
                table: "sets");

            migrationBuilder.DropColumn(
                name: "target_reps_min",
                table: "sets");
        }
    }
}
