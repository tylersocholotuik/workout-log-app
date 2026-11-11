using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WorkoutLogAPI.Migrations
{
    /// <inheritdoc />
    public partial class CreateUserSettingsTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "user_settings",
                columns: table => new
                {
                    user_id = table.Column<string>(type: "text", nullable: false),
                    theme = table.Column<string>(type: "text", nullable: false, defaultValue: "dark"),
                    weight_unit = table.Column<string>(type: "text", nullable: false, defaultValue: "lbs"),
                    distance_unit = table.Column<string>(type: "text", nullable: false, defaultValue: "meters"),
                    effort_type = table.Column<string>(type: "text", nullable: false, defaultValue: "rpe"),
                    show_one_rep_max = table.Column<bool>(type: "boolean", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_user_settings", x => x.user_id);
                    table.ForeignKey(
                        name: "FK_user_settings_users_user_id",
                        column: x => x.user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            // Backfill: the CreateTable column defaults above only apply to rows
            // inserted after this migration runs, so give every pre-existing user
            // a settings row with the same defaults.
            migrationBuilder.Sql(@"
                INSERT INTO user_settings (user_id, theme, weight_unit, distance_unit, effort_type, show_one_rep_max, created_at)
                SELECT id, 'dark', 'lbs', 'meters', 'rpe', true, now()
                FROM users
                WHERE id NOT IN (SELECT user_id FROM user_settings);
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "user_settings");
        }
    }
}
