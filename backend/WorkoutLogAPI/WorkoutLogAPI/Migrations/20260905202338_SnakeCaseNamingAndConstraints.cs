using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WorkoutLogAPI.Migrations
{
    /// <inheritdoc />
    public partial class SnakeCaseNamingAndConstraints : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Exercises_Users_UserId",
                table: "Exercises");

            migrationBuilder.DropForeignKey(
                name: "FK_Sets_WorkoutExercises_ExerciseId",
                table: "Sets");

            migrationBuilder.DropForeignKey(
                name: "FK_WorkoutExercises_Exercises_ExerciseId",
                table: "WorkoutExercises");

            migrationBuilder.DropForeignKey(
                name: "FK_WorkoutExercises_Workouts_WorkoutId",
                table: "WorkoutExercises");

            migrationBuilder.DropForeignKey(
                name: "FK_Workouts_Users_UserId",
                table: "Workouts");

            migrationBuilder.DropPrimaryKey(
                name: "PK_Workouts",
                table: "Workouts");

            migrationBuilder.DropPrimaryKey(
                name: "PK_Users",
                table: "Users");

            migrationBuilder.DropPrimaryKey(
                name: "PK_Sets",
                table: "Sets");

            migrationBuilder.DropPrimaryKey(
                name: "PK_Exercises",
                table: "Exercises");

            migrationBuilder.DropCheckConstraint(
                name: "CK_Exercise_SystemExercise_NotDeleted",
                table: "Exercises");

            migrationBuilder.DropPrimaryKey(
                name: "PK_WorkoutExercises",
                table: "WorkoutExercises");

            migrationBuilder.RenameTable(
                name: "Workouts",
                newName: "workouts");

            migrationBuilder.RenameTable(
                name: "Users",
                newName: "users");

            migrationBuilder.RenameTable(
                name: "Sets",
                newName: "sets");

            migrationBuilder.RenameTable(
                name: "Exercises",
                newName: "exercises");

            migrationBuilder.RenameTable(
                name: "WorkoutExercises",
                newName: "workout_exercises");

            migrationBuilder.RenameColumn(
                name: "Title",
                table: "workouts",
                newName: "title");

            migrationBuilder.RenameColumn(
                name: "Notes",
                table: "workouts",
                newName: "notes");

            migrationBuilder.RenameColumn(
                name: "Deleted",
                table: "workouts",
                newName: "deleted");

            migrationBuilder.RenameColumn(
                name: "Date",
                table: "workouts",
                newName: "date");

            migrationBuilder.RenameColumn(
                name: "Id",
                table: "workouts",
                newName: "id");

            migrationBuilder.RenameColumn(
                name: "UserId",
                table: "workouts",
                newName: "user_id");

            migrationBuilder.RenameColumn(
                name: "UpdatedAt",
                table: "workouts",
                newName: "updated_at");

            migrationBuilder.RenameColumn(
                name: "CreatedAt",
                table: "workouts",
                newName: "created_at");

            migrationBuilder.RenameIndex(
                name: "IX_Workouts_UserId",
                table: "workouts",
                newName: "IX_workouts_user_id");

            migrationBuilder.RenameColumn(
                name: "Email",
                table: "users",
                newName: "email");

            migrationBuilder.RenameColumn(
                name: "Id",
                table: "users",
                newName: "id");

            migrationBuilder.RenameColumn(
                name: "UpdatedAt",
                table: "users",
                newName: "updated_at");

            migrationBuilder.RenameColumn(
                name: "PasswordHash",
                table: "users",
                newName: "password_hash");

            migrationBuilder.RenameColumn(
                name: "LastName",
                table: "users",
                newName: "last_name");

            migrationBuilder.RenameColumn(
                name: "LastLoginAt",
                table: "users",
                newName: "last_login_at");

            migrationBuilder.RenameColumn(
                name: "IsLocked",
                table: "users",
                newName: "is_locked");

            migrationBuilder.RenameColumn(
                name: "IsAdmin",
                table: "users",
                newName: "is_admin");

            migrationBuilder.RenameColumn(
                name: "FirstName",
                table: "users",
                newName: "first_name");

            migrationBuilder.RenameColumn(
                name: "FailedLoginAttempts",
                table: "users",
                newName: "failed_login_attempts");

            migrationBuilder.RenameColumn(
                name: "DisplayName",
                table: "users",
                newName: "display_name");

            migrationBuilder.RenameColumn(
                name: "CreatedAt",
                table: "users",
                newName: "created_at");

            migrationBuilder.RenameIndex(
                name: "IX_Users_Email",
                table: "users",
                newName: "IX_users_email");

            migrationBuilder.RenameColumn(
                name: "Weight",
                table: "sets",
                newName: "weight");

            migrationBuilder.RenameColumn(
                name: "Rpe",
                table: "sets",
                newName: "rpe");

            migrationBuilder.RenameColumn(
                name: "Reps",
                table: "sets",
                newName: "reps");

            migrationBuilder.RenameColumn(
                name: "Deleted",
                table: "sets",
                newName: "deleted");

            migrationBuilder.RenameColumn(
                name: "Id",
                table: "sets",
                newName: "id");

            migrationBuilder.RenameColumn(
                name: "UpdatedAt",
                table: "sets",
                newName: "updated_at");

            migrationBuilder.RenameColumn(
                name: "ExerciseId",
                table: "sets",
                newName: "exercise_id");

            migrationBuilder.RenameColumn(
                name: "CreatedAt",
                table: "sets",
                newName: "created_at");

            migrationBuilder.RenameIndex(
                name: "IX_Sets_ExerciseId",
                table: "sets",
                newName: "IX_sets_exercise_id");

            migrationBuilder.RenameColumn(
                name: "Name",
                table: "exercises",
                newName: "name");

            migrationBuilder.RenameColumn(
                name: "Deleted",
                table: "exercises",
                newName: "deleted");

            migrationBuilder.RenameColumn(
                name: "Id",
                table: "exercises",
                newName: "id");

            migrationBuilder.RenameColumn(
                name: "UserId",
                table: "exercises",
                newName: "user_id");

            migrationBuilder.RenameColumn(
                name: "UpdatedAt",
                table: "exercises",
                newName: "updated_at");

            migrationBuilder.RenameColumn(
                name: "CreatedAt",
                table: "exercises",
                newName: "created_at");

            migrationBuilder.RenameIndex(
                name: "IX_Exercises_Name",
                table: "exercises",
                newName: "IX_exercises_name");

            migrationBuilder.RenameIndex(
                name: "IX_Exercises_UserId",
                table: "exercises",
                newName: "IX_exercises_user_id");

            migrationBuilder.RenameColumn(
                name: "Notes",
                table: "workout_exercises",
                newName: "notes");

            migrationBuilder.RenameColumn(
                name: "Deleted",
                table: "workout_exercises",
                newName: "deleted");

            migrationBuilder.RenameColumn(
                name: "Id",
                table: "workout_exercises",
                newName: "id");

            migrationBuilder.RenameColumn(
                name: "WorkoutId",
                table: "workout_exercises",
                newName: "workout_id");

            migrationBuilder.RenameColumn(
                name: "WeightUnit",
                table: "workout_exercises",
                newName: "weight_unit");

            migrationBuilder.RenameColumn(
                name: "UpdatedAt",
                table: "workout_exercises",
                newName: "updated_at");

            migrationBuilder.RenameColumn(
                name: "ExerciseId",
                table: "workout_exercises",
                newName: "exercise_id");

            migrationBuilder.RenameColumn(
                name: "CreatedAt",
                table: "workout_exercises",
                newName: "created_at");

            migrationBuilder.RenameIndex(
                name: "IX_WorkoutExercises_WorkoutId",
                table: "workout_exercises",
                newName: "IX_workout_exercises_workout_id");

            migrationBuilder.RenameIndex(
                name: "IX_WorkoutExercises_ExerciseId",
                table: "workout_exercises",
                newName: "IX_workout_exercises_exercise_id");

            migrationBuilder.AlterColumn<string>(
                name: "title",
                table: "workouts",
                type: "character varying(50)",
                maxLength: 50,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AlterColumn<string>(
                name: "notes",
                table: "workouts",
                type: "character varying(250)",
                maxLength: 250,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);

            migrationBuilder.AlterColumn<bool>(
                name: "deleted",
                table: "workouts",
                type: "boolean",
                nullable: false,
                oldClrType: typeof(bool),
                oldType: "boolean",
                oldDefaultValue: false);

            migrationBuilder.AlterColumn<DateTime>(
                name: "date",
                table: "workouts",
                type: "timestamp with time zone",
                nullable: false,
                oldClrType: typeof(DateTime),
                oldType: "timestamp with time zone",
                oldDefaultValueSql: "CURRENT_TIMESTAMP");

            migrationBuilder.AlterColumn<DateTime>(
                name: "created_at",
                table: "workouts",
                type: "timestamp with time zone",
                nullable: false,
                oldClrType: typeof(DateTime),
                oldType: "timestamp with time zone",
                oldDefaultValueSql: "CURRENT_TIMESTAMP");

            migrationBuilder.AlterColumn<string>(
                name: "email",
                table: "users",
                type: "character varying(255)",
                maxLength: 255,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AlterColumn<string>(
                name: "password_hash",
                table: "users",
                type: "character varying(255)",
                maxLength: 255,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AlterColumn<string>(
                name: "last_name",
                table: "users",
                type: "character varying(50)",
                maxLength: 50,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AlterColumn<bool>(
                name: "is_locked",
                table: "users",
                type: "boolean",
                nullable: false,
                oldClrType: typeof(bool),
                oldType: "boolean",
                oldDefaultValue: false);

            migrationBuilder.AlterColumn<bool>(
                name: "is_admin",
                table: "users",
                type: "boolean",
                nullable: false,
                oldClrType: typeof(bool),
                oldType: "boolean",
                oldDefaultValue: false);

            migrationBuilder.AlterColumn<string>(
                name: "first_name",
                table: "users",
                type: "character varying(50)",
                maxLength: 50,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AlterColumn<int>(
                name: "failed_login_attempts",
                table: "users",
                type: "integer",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "integer",
                oldDefaultValue: 0);

            migrationBuilder.AlterColumn<string>(
                name: "display_name",
                table: "users",
                type: "character varying(25)",
                maxLength: 25,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);

            migrationBuilder.AlterColumn<DateTime>(
                name: "created_at",
                table: "users",
                type: "timestamp with time zone",
                nullable: false,
                oldClrType: typeof(DateTime),
                oldType: "timestamp with time zone",
                oldDefaultValueSql: "CURRENT_TIMESTAMP");

            migrationBuilder.AlterColumn<bool>(
                name: "deleted",
                table: "sets",
                type: "boolean",
                nullable: false,
                oldClrType: typeof(bool),
                oldType: "boolean",
                oldDefaultValue: false);

            migrationBuilder.AlterColumn<DateTime>(
                name: "created_at",
                table: "sets",
                type: "timestamp with time zone",
                nullable: false,
                oldClrType: typeof(DateTime),
                oldType: "timestamp with time zone",
                oldDefaultValueSql: "CURRENT_TIMESTAMP");

            migrationBuilder.AlterColumn<string>(
                name: "name",
                table: "exercises",
                type: "character varying(100)",
                maxLength: 100,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AlterColumn<bool>(
                name: "deleted",
                table: "exercises",
                type: "boolean",
                nullable: false,
                oldClrType: typeof(bool),
                oldType: "boolean",
                oldDefaultValue: false);

            migrationBuilder.AlterColumn<DateTime>(
                name: "created_at",
                table: "exercises",
                type: "timestamp with time zone",
                nullable: false,
                oldClrType: typeof(DateTime),
                oldType: "timestamp with time zone",
                oldDefaultValueSql: "CURRENT_TIMESTAMP");

            migrationBuilder.AlterColumn<string>(
                name: "notes",
                table: "workout_exercises",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);

            migrationBuilder.AlterColumn<bool>(
                name: "deleted",
                table: "workout_exercises",
                type: "boolean",
                nullable: false,
                oldClrType: typeof(bool),
                oldType: "boolean",
                oldDefaultValue: false);

            migrationBuilder.AlterColumn<string>(
                name: "weight_unit",
                table: "workout_exercises",
                type: "character varying(10)",
                maxLength: 10,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AlterColumn<DateTime>(
                name: "created_at",
                table: "workout_exercises",
                type: "timestamp with time zone",
                nullable: false,
                oldClrType: typeof(DateTime),
                oldType: "timestamp with time zone",
                oldDefaultValueSql: "CURRENT_TIMESTAMP");

            migrationBuilder.AddPrimaryKey(
                name: "PK_workouts",
                table: "workouts",
                column: "id");

            migrationBuilder.AddPrimaryKey(
                name: "PK_users",
                table: "users",
                column: "id");

            migrationBuilder.AddPrimaryKey(
                name: "PK_sets",
                table: "sets",
                column: "id");

            migrationBuilder.AddPrimaryKey(
                name: "PK_exercises",
                table: "exercises",
                column: "id");

            migrationBuilder.AddPrimaryKey(
                name: "PK_workout_exercises",
                table: "workout_exercises",
                column: "id");

            migrationBuilder.AddCheckConstraint(
                name: "CK_Exercise_SystemExercise_NotDeleted",
                table: "exercises",
                sql: "\"user_id\" IS NOT NULL OR \"deleted\" = false");

            migrationBuilder.AddForeignKey(
                name: "FK_exercises_users_user_id",
                table: "exercises",
                column: "user_id",
                principalTable: "users",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_sets_workout_exercises_exercise_id",
                table: "sets",
                column: "exercise_id",
                principalTable: "workout_exercises",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_workout_exercises_exercises_exercise_id",
                table: "workout_exercises",
                column: "exercise_id",
                principalTable: "exercises",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_workout_exercises_workouts_workout_id",
                table: "workout_exercises",
                column: "workout_id",
                principalTable: "workouts",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_workouts_users_user_id",
                table: "workouts",
                column: "user_id",
                principalTable: "users",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_exercises_users_user_id",
                table: "exercises");

            migrationBuilder.DropForeignKey(
                name: "FK_sets_workout_exercises_exercise_id",
                table: "sets");

            migrationBuilder.DropForeignKey(
                name: "FK_workout_exercises_exercises_exercise_id",
                table: "workout_exercises");

            migrationBuilder.DropForeignKey(
                name: "FK_workout_exercises_workouts_workout_id",
                table: "workout_exercises");

            migrationBuilder.DropForeignKey(
                name: "FK_workouts_users_user_id",
                table: "workouts");

            migrationBuilder.DropPrimaryKey(
                name: "PK_workouts",
                table: "workouts");

            migrationBuilder.DropPrimaryKey(
                name: "PK_users",
                table: "users");

            migrationBuilder.DropPrimaryKey(
                name: "PK_sets",
                table: "sets");

            migrationBuilder.DropPrimaryKey(
                name: "PK_exercises",
                table: "exercises");

            migrationBuilder.DropCheckConstraint(
                name: "CK_Exercise_SystemExercise_NotDeleted",
                table: "exercises");

            migrationBuilder.DropPrimaryKey(
                name: "PK_workout_exercises",
                table: "workout_exercises");

            migrationBuilder.RenameTable(
                name: "workouts",
                newName: "Workouts");

            migrationBuilder.RenameTable(
                name: "users",
                newName: "Users");

            migrationBuilder.RenameTable(
                name: "sets",
                newName: "Sets");

            migrationBuilder.RenameTable(
                name: "exercises",
                newName: "Exercises");

            migrationBuilder.RenameTable(
                name: "workout_exercises",
                newName: "WorkoutExercises");

            migrationBuilder.RenameColumn(
                name: "title",
                table: "Workouts",
                newName: "Title");

            migrationBuilder.RenameColumn(
                name: "notes",
                table: "Workouts",
                newName: "Notes");

            migrationBuilder.RenameColumn(
                name: "deleted",
                table: "Workouts",
                newName: "Deleted");

            migrationBuilder.RenameColumn(
                name: "date",
                table: "Workouts",
                newName: "Date");

            migrationBuilder.RenameColumn(
                name: "id",
                table: "Workouts",
                newName: "Id");

            migrationBuilder.RenameColumn(
                name: "user_id",
                table: "Workouts",
                newName: "UserId");

            migrationBuilder.RenameColumn(
                name: "updated_at",
                table: "Workouts",
                newName: "UpdatedAt");

            migrationBuilder.RenameColumn(
                name: "created_at",
                table: "Workouts",
                newName: "CreatedAt");

            migrationBuilder.RenameIndex(
                name: "IX_workouts_user_id",
                table: "Workouts",
                newName: "IX_Workouts_UserId");

            migrationBuilder.RenameColumn(
                name: "email",
                table: "Users",
                newName: "Email");

            migrationBuilder.RenameColumn(
                name: "id",
                table: "Users",
                newName: "Id");

            migrationBuilder.RenameColumn(
                name: "updated_at",
                table: "Users",
                newName: "UpdatedAt");

            migrationBuilder.RenameColumn(
                name: "password_hash",
                table: "Users",
                newName: "PasswordHash");

            migrationBuilder.RenameColumn(
                name: "last_name",
                table: "Users",
                newName: "LastName");

            migrationBuilder.RenameColumn(
                name: "last_login_at",
                table: "Users",
                newName: "LastLoginAt");

            migrationBuilder.RenameColumn(
                name: "is_locked",
                table: "Users",
                newName: "IsLocked");

            migrationBuilder.RenameColumn(
                name: "is_admin",
                table: "Users",
                newName: "IsAdmin");

            migrationBuilder.RenameColumn(
                name: "first_name",
                table: "Users",
                newName: "FirstName");

            migrationBuilder.RenameColumn(
                name: "failed_login_attempts",
                table: "Users",
                newName: "FailedLoginAttempts");

            migrationBuilder.RenameColumn(
                name: "display_name",
                table: "Users",
                newName: "DisplayName");

            migrationBuilder.RenameColumn(
                name: "created_at",
                table: "Users",
                newName: "CreatedAt");

            migrationBuilder.RenameIndex(
                name: "IX_users_email",
                table: "Users",
                newName: "IX_Users_Email");

            migrationBuilder.RenameColumn(
                name: "weight",
                table: "Sets",
                newName: "Weight");

            migrationBuilder.RenameColumn(
                name: "rpe",
                table: "Sets",
                newName: "Rpe");

            migrationBuilder.RenameColumn(
                name: "reps",
                table: "Sets",
                newName: "Reps");

            migrationBuilder.RenameColumn(
                name: "deleted",
                table: "Sets",
                newName: "Deleted");

            migrationBuilder.RenameColumn(
                name: "id",
                table: "Sets",
                newName: "Id");

            migrationBuilder.RenameColumn(
                name: "updated_at",
                table: "Sets",
                newName: "UpdatedAt");

            migrationBuilder.RenameColumn(
                name: "exercise_id",
                table: "Sets",
                newName: "ExerciseId");

            migrationBuilder.RenameColumn(
                name: "created_at",
                table: "Sets",
                newName: "CreatedAt");

            migrationBuilder.RenameIndex(
                name: "IX_sets_exercise_id",
                table: "Sets",
                newName: "IX_Sets_ExerciseId");

            migrationBuilder.RenameColumn(
                name: "name",
                table: "Exercises",
                newName: "Name");

            migrationBuilder.RenameColumn(
                name: "deleted",
                table: "Exercises",
                newName: "Deleted");

            migrationBuilder.RenameColumn(
                name: "id",
                table: "Exercises",
                newName: "Id");

            migrationBuilder.RenameColumn(
                name: "user_id",
                table: "Exercises",
                newName: "UserId");

            migrationBuilder.RenameColumn(
                name: "updated_at",
                table: "Exercises",
                newName: "UpdatedAt");

            migrationBuilder.RenameColumn(
                name: "created_at",
                table: "Exercises",
                newName: "CreatedAt");

            migrationBuilder.RenameIndex(
                name: "IX_exercises_name",
                table: "Exercises",
                newName: "IX_Exercises_Name");

            migrationBuilder.RenameIndex(
                name: "IX_exercises_user_id",
                table: "Exercises",
                newName: "IX_Exercises_UserId");

            migrationBuilder.RenameColumn(
                name: "notes",
                table: "WorkoutExercises",
                newName: "Notes");

            migrationBuilder.RenameColumn(
                name: "deleted",
                table: "WorkoutExercises",
                newName: "Deleted");

            migrationBuilder.RenameColumn(
                name: "id",
                table: "WorkoutExercises",
                newName: "Id");

            migrationBuilder.RenameColumn(
                name: "workout_id",
                table: "WorkoutExercises",
                newName: "WorkoutId");

            migrationBuilder.RenameColumn(
                name: "weight_unit",
                table: "WorkoutExercises",
                newName: "WeightUnit");

            migrationBuilder.RenameColumn(
                name: "updated_at",
                table: "WorkoutExercises",
                newName: "UpdatedAt");

            migrationBuilder.RenameColumn(
                name: "exercise_id",
                table: "WorkoutExercises",
                newName: "ExerciseId");

            migrationBuilder.RenameColumn(
                name: "created_at",
                table: "WorkoutExercises",
                newName: "CreatedAt");

            migrationBuilder.RenameIndex(
                name: "IX_workout_exercises_workout_id",
                table: "WorkoutExercises",
                newName: "IX_WorkoutExercises_WorkoutId");

            migrationBuilder.RenameIndex(
                name: "IX_workout_exercises_exercise_id",
                table: "WorkoutExercises",
                newName: "IX_WorkoutExercises_ExerciseId");

            migrationBuilder.AlterColumn<string>(
                name: "Title",
                table: "Workouts",
                type: "text",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(50)",
                oldMaxLength: 50);

            migrationBuilder.AlterColumn<string>(
                name: "Notes",
                table: "Workouts",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(250)",
                oldMaxLength: 250,
                oldNullable: true);

            migrationBuilder.AlterColumn<bool>(
                name: "Deleted",
                table: "Workouts",
                type: "boolean",
                nullable: false,
                defaultValue: false,
                oldClrType: typeof(bool),
                oldType: "boolean");

            migrationBuilder.AlterColumn<DateTime>(
                name: "Date",
                table: "Workouts",
                type: "timestamp with time zone",
                nullable: false,
                defaultValueSql: "CURRENT_TIMESTAMP",
                oldClrType: typeof(DateTime),
                oldType: "timestamp with time zone");

            migrationBuilder.AlterColumn<DateTime>(
                name: "CreatedAt",
                table: "Workouts",
                type: "timestamp with time zone",
                nullable: false,
                defaultValueSql: "CURRENT_TIMESTAMP",
                oldClrType: typeof(DateTime),
                oldType: "timestamp with time zone");

            migrationBuilder.AlterColumn<string>(
                name: "Email",
                table: "Users",
                type: "text",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(255)",
                oldMaxLength: 255);

            migrationBuilder.AlterColumn<string>(
                name: "PasswordHash",
                table: "Users",
                type: "text",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(255)",
                oldMaxLength: 255);

            migrationBuilder.AlterColumn<string>(
                name: "LastName",
                table: "Users",
                type: "text",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(50)",
                oldMaxLength: 50);

            migrationBuilder.AlterColumn<bool>(
                name: "IsLocked",
                table: "Users",
                type: "boolean",
                nullable: false,
                defaultValue: false,
                oldClrType: typeof(bool),
                oldType: "boolean");

            migrationBuilder.AlterColumn<bool>(
                name: "IsAdmin",
                table: "Users",
                type: "boolean",
                nullable: false,
                defaultValue: false,
                oldClrType: typeof(bool),
                oldType: "boolean");

            migrationBuilder.AlterColumn<string>(
                name: "FirstName",
                table: "Users",
                type: "text",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(50)",
                oldMaxLength: 50);

            migrationBuilder.AlterColumn<int>(
                name: "FailedLoginAttempts",
                table: "Users",
                type: "integer",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "integer");

            migrationBuilder.AlterColumn<string>(
                name: "DisplayName",
                table: "Users",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(25)",
                oldMaxLength: 25,
                oldNullable: true);

            migrationBuilder.AlterColumn<DateTime>(
                name: "CreatedAt",
                table: "Users",
                type: "timestamp with time zone",
                nullable: false,
                defaultValueSql: "CURRENT_TIMESTAMP",
                oldClrType: typeof(DateTime),
                oldType: "timestamp with time zone");

            migrationBuilder.AlterColumn<bool>(
                name: "Deleted",
                table: "Sets",
                type: "boolean",
                nullable: false,
                defaultValue: false,
                oldClrType: typeof(bool),
                oldType: "boolean");

            migrationBuilder.AlterColumn<DateTime>(
                name: "CreatedAt",
                table: "Sets",
                type: "timestamp with time zone",
                nullable: false,
                defaultValueSql: "CURRENT_TIMESTAMP",
                oldClrType: typeof(DateTime),
                oldType: "timestamp with time zone");

            migrationBuilder.AlterColumn<string>(
                name: "Name",
                table: "Exercises",
                type: "text",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(100)",
                oldMaxLength: 100);

            migrationBuilder.AlterColumn<bool>(
                name: "Deleted",
                table: "Exercises",
                type: "boolean",
                nullable: false,
                defaultValue: false,
                oldClrType: typeof(bool),
                oldType: "boolean");

            migrationBuilder.AlterColumn<DateTime>(
                name: "CreatedAt",
                table: "Exercises",
                type: "timestamp with time zone",
                nullable: false,
                defaultValueSql: "CURRENT_TIMESTAMP",
                oldClrType: typeof(DateTime),
                oldType: "timestamp with time zone");

            migrationBuilder.AlterColumn<string>(
                name: "Notes",
                table: "WorkoutExercises",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(100)",
                oldMaxLength: 100,
                oldNullable: true);

            migrationBuilder.AlterColumn<bool>(
                name: "Deleted",
                table: "WorkoutExercises",
                type: "boolean",
                nullable: false,
                defaultValue: false,
                oldClrType: typeof(bool),
                oldType: "boolean");

            migrationBuilder.AlterColumn<string>(
                name: "WeightUnit",
                table: "WorkoutExercises",
                type: "text",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(10)",
                oldMaxLength: 10);

            migrationBuilder.AlterColumn<DateTime>(
                name: "CreatedAt",
                table: "WorkoutExercises",
                type: "timestamp with time zone",
                nullable: false,
                defaultValueSql: "CURRENT_TIMESTAMP",
                oldClrType: typeof(DateTime),
                oldType: "timestamp with time zone");

            migrationBuilder.AddPrimaryKey(
                name: "PK_Workouts",
                table: "Workouts",
                column: "Id");

            migrationBuilder.AddPrimaryKey(
                name: "PK_Users",
                table: "Users",
                column: "Id");

            migrationBuilder.AddPrimaryKey(
                name: "PK_Sets",
                table: "Sets",
                column: "Id");

            migrationBuilder.AddPrimaryKey(
                name: "PK_Exercises",
                table: "Exercises",
                column: "Id");

            migrationBuilder.AddPrimaryKey(
                name: "PK_WorkoutExercises",
                table: "WorkoutExercises",
                column: "Id");

            migrationBuilder.AddCheckConstraint(
                name: "CK_Exercise_SystemExercise_NotDeleted",
                table: "Exercises",
                sql: "\"UserId\" IS NOT NULL OR \"Deleted\" = false");

            migrationBuilder.AddForeignKey(
                name: "FK_Exercises_Users_UserId",
                table: "Exercises",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Sets_WorkoutExercises_ExerciseId",
                table: "Sets",
                column: "ExerciseId",
                principalTable: "WorkoutExercises",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_WorkoutExercises_Exercises_ExerciseId",
                table: "WorkoutExercises",
                column: "ExerciseId",
                principalTable: "Exercises",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_WorkoutExercises_Workouts_WorkoutId",
                table: "WorkoutExercises",
                column: "WorkoutId",
                principalTable: "Workouts",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Workouts_Users_UserId",
                table: "Workouts",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }
    }
}
