import { spawn } from "child_process";

const LANGUAGE_RUNNERS = {
  javascript: {
    image: "node:18-alpine",
    command: "cat > main.js && node main.js",
  },
  python: {
    image: "python:3.12-alpine",
    command: "cat > main.py && python main.py",
  },
  java: {
    image: "openjdk:17-alpine",
    command: "cat > Main.java && javac Main.java && java Main",
  },
};

const DEFAULT_TIMEOUT = 20000;
const DOCKER_BINARY = "docker";

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

export async function runCodeInDocker(language, code, timeoutMs = DEFAULT_TIMEOUT) {
  const runner = LANGUAGE_RUNNERS[language];

  if (!runner) {
    throw new Error("Unsupported language for Docker execution");
  }

  const dockerArgs = [
    "run",
    "--rm",
    "--network",
    "none",
    "--memory",
    "256m",
    "--cpus",
    "0.5",
    "-i",
    "--workdir",
    "/workspace",
    runner.image,
    "sh",
    "-lc",
    runner.command,
  ];

  const result = await runDockerCommand(dockerArgs, code, timeoutMs);

  return {
    success: result.code === 0,
    output: (result.stdout || "") + (result.stderr ? "\n" + result.stderr : ""),
    error: result.stderr || "",
    exitCode: result.code,
    signal: result.signal,
  };
}
