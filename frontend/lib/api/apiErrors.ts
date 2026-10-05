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

// Carries the HTTP status code alongside the extracted message so callers
// can distinguish why a request failed (e.g. 403 forbidden vs. 404 not
// found vs. 500 server error)
export class ApiError extends Error {
    status: number;

    constructor(message: string, status: number) {
        super(message);
        this.name = "ApiError";
        this.status = status;
    }
}

// Reads the error body from a failed Response and throws an ApiError built from it.
export const throwApiError = async (res: Response, fallback: string): Promise<never> => {
    const errorData = await res.json();
    throw new ApiError(extractErrorMessage(errorData, fallback), res.status);
};
