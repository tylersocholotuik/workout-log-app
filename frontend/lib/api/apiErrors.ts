// ASP.NET Core error response shapes we need to handle:
// 1. Custom controller errors: { error: string } (thrown via BadRequest(new { error = "..." }), etc.)
// 2. Automatic [ApiController] model validation failures (ValidationProblemDetails):
//    { title: string, errors: { FieldName: string[] } }
// 3. Fallback ProblemDetails shape with just a title.
export const extractErrorMessage = (errorData: unknown, fallback: string): string => {
    if (errorData && typeof errorData === "object") {
        const data = errorData as Record<string, unknown>;

        if (typeof data.error === "string") {
            return data.error;
        }

        if (data.errors && typeof data.errors === "object") {
            const messages = Object.values(
                data.errors as Record<string, string[]>
            ).flat();

            if (messages.length > 0) {
                return messages.join(" ");
            }
        }

        if (typeof data.title === "string") {
            return data.title;
        }
    }

    return fallback;
};
