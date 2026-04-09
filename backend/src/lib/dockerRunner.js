import { spawn } from "child_process";

const LANGUAGE_RUNNERS = {
  javascript: {
    image: "node:18-alpine",
    buildCommand: () => ({
      fileName: "main.js",
      runCommand: "node main.js",
    }),
  },
  python: {
    image: "python:3.12-alpine",
    buildCommand: () => ({
      fileName: "main.py",
      runCommand: "python main.py",
    }),
  },
  java: {
    image: "eclipse-temurin:17-jdk",
    buildCommand: (code) => {
      const publicClassMatch = code.match(/\bpublic\s+class\s+([A-Za-z_]\w*)\b/);
      const classMatch = code.match(/\bclass\s+([A-Za-z_]\w*)\b/);
      const className = publicClassMatch?.[1] || classMatch?.[1] || "Main";

      return {
        fileName: `${className}.java`,
        runCommand: `javac ${className}.java && java ${className}`,
      };
    },
  },
};

const DEFAULT_TIMEOUT = 20000;
const DOCKER_BINARY = "docker";
const IMAGE_PULL_TIMEOUT = 5 * 60 * 1000;
const preparedImages = new Map();

const createDockerRunnerError = (message, code, cause) => {
  const error = new Error(message);
  error.code = code;
  if (cause) {
    error.cause = cause;
  }
  return error;
};

const runDockerCommand = (args, input, timeoutMs) =>
  new Promise((resolve, reject) => {
    const child = spawn(DOCKER_BINARY, args, {
      stdio: ["pipe", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";
    let timedOut = false;

    const timeoutId = setTimeout(() => {
      timedOut = true;
      child.kill("SIGKILL");
    }, timeoutMs || DEFAULT_TIMEOUT);

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString("utf8");
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString("utf8");
    });

    child.on("error", (error) => {
      clearTimeout(timeoutId);
      reject(error);
    });

    child.on("close", (code, signal) => {
      clearTimeout(timeoutId);
      if (timedOut) {
        return reject(new Error("Execution timed out"));
      }
      resolve({ code, signal, stdout, stderr });
    });

    if (input) {
      child.stdin.write(input);
    }
    child.stdin.end();
  });

const ensureDockerImageAvailable = async (image) => {
  if (preparedImages.has(image)) {
    return preparedImages.get(image);
  }

  const ensurePromise = (async () => {
    const inspectResult = await runDockerCommand(["image", "inspect", image], null, 10000);

    if (inspectResult.code === 0) {
      return;
    }

    let pullResult;
    try {
      pullResult = await runDockerCommand(
        ["pull", "--quiet", image],
        null,
        IMAGE_PULL_TIMEOUT
      );
    } catch (error) {
      if (error?.message === "Execution timed out") {
        throw createDockerRunnerError(
          `Preparing the ${image} runtime is taking longer than expected`,
          "DOCKER_IMAGE_PREP_TIMEOUT",
          error
        );
      }

      throw createDockerRunnerError(
        `Failed to prepare Docker image ${image}`,
        "DOCKER_IMAGE_PREP_FAILED",
        error
      );
    }

    if (pullResult.code !== 0) {
      const errorMessage =
        pullResult.stderr?.trim() ||
        pullResult.stdout?.trim() ||
        `Failed to pull Docker image ${image}`;

      throw createDockerRunnerError(
        errorMessage,
        "DOCKER_IMAGE_PREP_FAILED"
      );
    }
  })();

  preparedImages.set(image, ensurePromise);

  try {
    await ensurePromise;
  } catch (error) {
    preparedImages.delete(image);
    throw error;
  }
};

export async function runCodeInDocker(language, code, timeoutMs = DEFAULT_TIMEOUT) {
  const runner = LANGUAGE_RUNNERS[language];

  if (!runner) {
    throw new Error("Unsupported language for Docker execution");
  }

  await ensureDockerImageAvailable(runner.image);
  const { fileName, runCommand } = runner.buildCommand(code);

  const dockerArgs = [
    "run",
    "--rm",
    "--network",
    "none",
    "--cap-drop",
    "ALL",
    "--security-opt",
    "no-new-privileges",
    "--memory",
    "256m",
    "--memory-swap",
    "256m",
    "--cpus",
    "0.5",
    "--pids-limit",
    "64",
    "--read-only",
    "-i",
    "--workdir",
    "/workspace",
    "--tmpfs",
    "/tmp:rw,noexec,nosuid,size=64m",
    "--tmpfs",
    "/workspace:rw,noexec,nosuid,size=64m",
    runner.image,
    "sh",
    "-lc",
    `cat > ${fileName} && ${runCommand}`,
  ];

  const result = await runDockerCommand(dockerArgs, code, timeoutMs);

  return {
    success: result.code === 0,
    output: result.stdout || "",
    error: result.stderr || "",
    exitCode: result.code,
    signal: result.signal,
  };
}
