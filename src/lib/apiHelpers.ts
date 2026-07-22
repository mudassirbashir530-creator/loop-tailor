import { getAuth } from "firebase/auth";

/**
 * Safely fetches data from an API, preventing "Unexpected end of JSON input" errors.
 * Handles Firebase Auth tokens, empty responses, invalid JSON, and timeouts.
 *
 * @param url - The API endpoint URL.
 * @param options - Fetch options (method, body, headers, etc.).
 * @param timeoutMs - Timeout in milliseconds (default: 10000ms).
 * @returns Promise with data and error.
 */
export async function safeFetchJSON(url: string, options: RequestInit = {}, timeoutMs: number = 10000): Promise<{ data: any; error: string | null; response?: Response }> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  const finalOptions: RequestInit = { ...options, signal: controller.signal };

  try {
    const auth = getAuth();
    const user = auth.currentUser;
    const headers = new Headers(finalOptions.headers || {});
    
    if (user) {
      const token = await user.getIdToken();
      headers.set("Authorization", `Bearer ${token}`);
    }
    
    if (!headers.has("Content-Type") && finalOptions.body) {
      headers.set("Content-Type", "application/json");
    }
    finalOptions.headers = headers;

    const response = await fetch(url, finalOptions);
    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error(`[API Error] ${response.status} ${response.statusText} at ${url}`);
      const errorText = await response.text();
      let errorMessage = `HTTP Error ${response.status}`;
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.error || errorMessage;
      } catch {
        errorMessage = errorText || errorMessage;
      }
      throw new Error(errorMessage);
    }

    const contentType = response.headers.get("content-type");
    const isJson = contentType && contentType.includes("application/json");

    const textResponse = await response.text();

    if (!textResponse || textResponse.trim() === "") {
      console.warn(`[API Warning] Empty response body received from ${url}. Returning default object.`);
      return { data: {}, error: null, response };
    }

    if (isJson) {
      try {
        const jsonData = JSON.parse(textResponse);
        return { data: jsonData, error: null, response };
      } catch (parseError) {
        console.error("[API Error] Failed to parse JSON:", parseError, "Raw text:", textResponse);
        throw new Error("Received invalid data format from the server.");
      }
    } else {
      console.warn(`[API Warning] Expected JSON but received ${contentType}. Returning raw text.`);
      return { data: textResponse, error: null, response };
    }

  } catch (error: any) {
    clearTimeout(timeoutId);
    console.error("[API Request Failed]", error);

    let errorMessage = "An unexpected error occurred. Please try again.";
    
    if (error.name === "AbortError") {
      errorMessage = "The request timed out. Please check your internet connection.";
    } else if (error.message) {
      errorMessage = error.message;
    }

    return { data: null, error: errorMessage };
  }
}
