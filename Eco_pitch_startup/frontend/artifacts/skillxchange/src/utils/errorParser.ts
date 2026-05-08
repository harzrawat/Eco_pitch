import axios from "axios";

export function parseApiError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const message = error.response?.data?.error as string | undefined;

    if (!error.response) {
      return "Network error. Check your connection.";
    }

    if (status === 401) return message ?? "Invalid email or password";
    if (status === 404) return message ?? "Resource not found";
    if (status === 409) return message ?? "This email is already registered";
    if (status === 400) return message ?? "Invalid request";
    if (status === 403) return "You don't have permission.";
    if (status && status >= 500) return "Something went wrong. Try again later.";

    return message ?? "An unexpected error occurred";
  }
  return "An unexpected error occurred";
}
