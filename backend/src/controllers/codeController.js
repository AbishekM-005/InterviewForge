import ENV from "../lib/env.js";

const LANGUAGE_CONFIGS = {
  javascript: { language: "javascript", version: "18.15.0", extension: "js" },
  python: { language: "python", version: "3.10.0", extension: "py" },
  java: { language: "java", version: "15.0.2", extension: "java" },
};

const DEFAULT_PISTON_API = "http://localhost:2000/api/v2";
const EXECUTION_TIMEOUT_MS = Number.parseInt(ENV.CODE_EXECUTION_TIMEOUT_MS, 10) || 20000;
const MAX_CODE_SIZE = Number.parseInt(ENV.CODE_EXECUTION_MAX_CODE_SIZE, 10) || 20000;

export async function executeCode(req, res) {
  try {
    const { language, code } = req.body || {};
    const languageConfig =
      typeof language === "string" ? LANGUAGE_CONFIGS[language.trim().toLowerCase()] : null;

    if (!languageConfig) {
      return res.status(400).json({
        success: false,
        error: "Unsupported language",
      });
    }

    if (typeof code !== "string" || code.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: "Code is required",
      });
    }

    if (code.length > MAX_CODE_SIZE) {
      return res.status(413).json({
        success: false,
        error: `Code is too large. Max size is ${MAX_CODE_SIZE} characters`,
      });
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), EXECUTION_TIMEOUT_MS);

    try {
      const headers = {
        "Content-Type": "application/json",
      };

      if (ENV.PISTON_AUTH_TOKEN) {
        headers[ENV.PISTON_AUTH_HEADER || "Authorization"] = ENV.PISTON_AUTH_HEADER
          ? ENV.PISTON_AUTH_TOKEN
          : `Bearer ${ENV.PISTON_AUTH_TOKEN}`;
      }

      const response = await fetch(`${ENV.PISTON_API_URL || DEFAULT_PISTON_API}/execute`, {
        method: "POST",
        headers,
        signal: controller.signal,
        body: JSON.stringify({
          language: languageConfig.language,
          version: languageConfig.version,
          files: [
            {
              name: `main.${languageConfig.extension}`,
              content: code,
            },
          ],
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        return res.status(response.status).json({
          success: false,
          error: text?.trim() || `Code runner returned HTTP ${response.status}`,
        });
      }

      const data = await response.json();
      const output = data?.run?.output || "";
      const stderr = data?.run?.stderr || "";

      if (stderr) {
        return res.status(200).json({
          success: false,
          output,
          error: stderr,
        });
      }

      return res.status(200).json({
        success: true,
        output: output || "No Output",
      });
    } catch (error) {
      if (error?.name === "AbortError") {
        return res.status(504).json({
          success: false,
          error: `Execution timed out after ${EXECUTION_TIMEOUT_MS}ms`,
        });
      }

      console.error("Error calling Piston API: ", error);
      const causeMessage =
        error?.cause?.code || error?.cause?.message || error?.message || "Unknown error";
      return res.status(502).json({
        success: false,
        error: `Failed to execute code with configured runner: ${causeMessage}`,
      });
    } finally {
      clearTimeout(timeoutId);
    }
  } catch (error) {
    console.error("Error in executeCode controller: ", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
}
