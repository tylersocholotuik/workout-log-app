using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WorkoutLogAPI.Migrations
{
    /// <inheritdoc />
    public partial class UseDateOnlyForWorkoutDate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // The existing "date" values were stored as UTC instants (timestamptz) that were
            // actually created from Alberta local time. This one-time backfill re-interprets
            // those instants in America/Edmonton to recover the calendar day the user actually
            // meant, before narrowing the column to a plain date. This timezone is hardcoded
            // deliberately: it reflects the real-world timezone of the only data that has ever
            // been written to this column, not a general-purpose conversion rule. Going forward,
            // the API only ever receives/stores calendar dates directly, so no timezone
            // conversion is needed (or should be added) for new data.
            migrationBuilder.Sql(
                """
                ALTER TABLE "workouts"
                ALTER COLUMN "date" TYPE date
                USING ("date" AT TIME ZONE 'America/Edmonton')::date;
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                """
                ALTER TABLE "workouts"
                ALTER COLUMN "date" TYPE timestamp with time zone
                USING "date"::timestamp AT TIME ZONE 'America/Edmonton';
                """);
        }
    }
}
