import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";

const projectId = process.env.VERCEL_PROJECT_ID;

const projectMap = new Map([
  ["prj_9YIAro54fNw1dRN5ewr0FYC2y60g", "frontend-admin"],
  ["prj_UAzpzpWqWMdS8XLuV2R61nFxPaea", "frontend-loja"]
]);

const fallbackProject = process.env.VERCEL_TARGET_PROJECT || "frontend-admin";
const targetProject = projectMap.get(projectId) || fallbackProject;
const projectDir = resolve(process.cwd(), targetProject);
const distDir = resolve(projectDir, "dist");
const rootDistDir = resolve(process.cwd(), "dist");

console.log(`Projeto Vercel detectado: ${projectId || "sem-id"} -> ${targetProject}`);

if (!existsSync(projectDir)) {
  console.error(`Projeto de deploy nao encontrado: ${targetProject}`);
  process.exit(1);
}

runNpm(["install", "--no-fund", "--no-audit"], projectDir);
runNpm(["run", "build"], projectDir);

rmSync(rootDistDir, { recursive: true, force: true });
mkdirSync(rootDistDir, { recursive: true });
cpSync(distDir, rootDistDir, { recursive: true });

console.log(`Build Vercel concluido para ${targetProject}.`);

function runNpm(args, cwd) {
  const isWindows = process.platform === "win32";
  const command = isWindows ? "cmd.exe" : "npm";
  const commandArgs = isWindows ? ["/d", "/s", "/c", "npm", ...args] : args;
  const result = spawnSync(command, commandArgs, {
    cwd,
    encoding: "utf8",
    env: process.env
  });

  if (result.stdout) {
    process.stdout.write(result.stdout);
  }

  if (result.stderr) {
    process.stderr.write(result.stderr);
  }

  if (result.error) {
    console.error(result.error);
    process.exit(1);
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}
