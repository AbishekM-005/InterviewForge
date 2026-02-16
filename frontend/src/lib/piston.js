// Used for code execution via backend proxy route
import axiosInstance from "./axios";

const SUPPORTED_LANGUAGES = new Set(["javascript", "python", "java"]);

/**
 *
 * @param {string} language - programming language
 * @param {string} code - source code to be executed
 * @returns {Promise<{success:boolean,output?:string,error?:string}>}
 */

export async function executeCode(language, code) {
  try {
    if (!SUPPORTED_LANGUAGES.has(language)) {
      return {
        success: false,
        error: `Unsupported Language: ${language}`,
      };
    }

    if (typeof code !== "string" || code.trim().length === 0) {
      return {
        success: false,
        error: "Code is required",
      };
    }

    if (code.length > 20000) {
      return {
        success: false,
        error: "Code is too large to execute",
      };
    }

    const { data } = await axiosInstance.post(
      "/code/execute",
      {
        language,
        code,
      },
      {
        timeout: 25000,
      }
    );

    return data;
  } catch (error) {
    const status = error?.response?.status;
    const message =
      error?.response?.data?.error ||
      error?.response?.data?.msg ||
      error?.message ||
      "Unknown error";

    return {
      success: false,
      error: status
        ? `HTTP error! status : ${status} - ${message}`
        : `Failed to execute code: ${message}`,
    };
  }
}
