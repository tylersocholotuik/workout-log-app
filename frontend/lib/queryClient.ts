import { QueryClient, QueryCache, MutationCache } from "@tanstack/react-query";
import { addToast } from "@heroui/react";
import { ApiError } from "./api/apiErrors";

// Global query client for TanStack Query with error handling for queries and mutations
export const queryClient = new QueryClient({
  defaultOptions: {
      queries: {
          retry: (failureCount, error) => {
              if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
                  return false;
              }
              return failureCount < 3;
          },
      },
  },
  queryCache: new QueryCache({
      onError: (error) => {
          // Render dedicated UI for 403 errors instead of generic error toasts
          if (error instanceof ApiError && error.status === 403) {
              return;
          }

          addToast({
              title: "Error",
              description:
                  error instanceof Error ? error.message : "An unknown error occurred",
              color: "danger",
          });
      }
  }),
  mutationCache: new MutationCache({
      onError: (error, _variables, _context, mutation) => {
          // Mutations that already render their own inline error UI (e.g. a
          // form field's validation message) can opt out via `meta` to avoid
          // showing the same message twice.
          if (mutation.options.meta?.skipGlobalErrorToast) {
              return;
          }

          addToast({
              title: "Error",
              description:
                  error instanceof Error ? error.message : "An unknown error occurred",
              color: "danger",
          });
      }
  }),
});