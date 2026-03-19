#!/usr/bin/env node

import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import readline from "readline";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TEMPLATE_ROOT = path.join(__dirname, "..");
const TARGET_ROOT = process.cwd();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const question = (query) =>
  new Promise((resolve) => rl.question(query, resolve));

// Utility to copy files recursively
function copyRecursiveSync(src, dest) {
  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = exists && stats.isDirectory();
  if (isDirectory) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    fs.readdirSync(src).forEach((childItemName) => {
      copyRecursiveSync(
        path.join(src, childItemName),
        path.join(dest, childItemName),
      );
    });
  } else {
    if (!fs.existsSync(path.dirname(dest))) {
      fs.mkdirSync(path.dirname(dest), { recursive: true });
    }
    fs.copyFileSync(src, dest);
  }
}

async function detectStack() {
  const stack = {
    isNext: false,
    isPython: false,
    hasTailwind: false,
    hasDrizzle: false,
    hasAI: false,
    name: path.basename(TARGET_ROOT),
  };

  const pkgPath = path.join(TARGET_ROOT, "package.json");
  if (fs.existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
      stack.name = pkg.name || stack.name;
      const deps = { ...pkg.dependencies, ...pkg.devDependencies };
      if (deps["next"]) stack.isNext = true;
      if (deps["tailwindcss"]) stack.hasTailwind = true;
      if (deps["drizzle-orm"]) stack.hasDrizzle = true;
      if (deps["ai"] || deps["openai"] || deps["langchain"]) stack.hasAI = true;
    } catch (e) {}
  }

  const pyprojectPath = path.join(TARGET_ROOT, "pyproject.toml");
  const reqPath = path.join(TARGET_ROOT, "requirements.txt");
  if (fs.existsSync(pyprojectPath) || fs.existsSync(reqPath)) {
    stack.isPython = true;
    try {
      const content = fs.existsSync(pyprojectPath)
        ? fs.readFileSync(pyprojectPath, "utf-8")
        : fs.readFileSync(reqPath, "utf-8");
      if (content.includes("openai") || content.includes("langchain"))
        stack.hasAI = true;
    } catch (e) {}
  }

  return stack;
}

async function main() {
  console.log("\n🚀 Iniciando Lucas Template CLI...\n");

  const stack = await detectStack();
  console.log("🔍 Stack detectado:");
  console.log(`   - Proyecto: ${stack.name}`);
  console.log(`   - Next.js/React: ${stack.isNext ? "Sí" : "No"}`);
  console.log(`   - Python: ${stack.isPython ? "Sí" : "No"}`);
  console.log(`   - AI/LLM: ${stack.hasAI ? "Sí" : "No"}`);
  console.log("");

  const confirm = await question("¿Es correcto este stack? (S/n): ");
  if (confirm.toLowerCase() === "n") {
    stack.isNext =
      (await question("¿Usa Next.js/React? (s/N): ")).toLowerCase() === "s";
    stack.isPython =
      (await question("¿Usa Python? (s/N): ")).toLowerCase() === "s";
    stack.hasAI =
      (await question("¿Usa AI/LLMs? (s/N): ")).toLowerCase() === "s";
  }

  console.log("\n📦 Copiando archivos base...");

  // 1. Copy .vscode
  const vscodeSrc = path.join(TEMPLATE_ROOT, ".vscode");
  const vscodeDest = path.join(TARGET_ROOT, ".vscode");
  if (fs.existsSync(vscodeSrc)) {
    copyRecursiveSync(vscodeSrc, vscodeDest);
    console.log("   ✅ .vscode/ copiado");
  }

  // 2. Copy AGENTS.md
  const agentsSrc = path.join(TEMPLATE_ROOT, "AGENTS.md");
  const agentsDest = path.join(TARGET_ROOT, "AGENTS.md");
  if (fs.existsSync(agentsSrc)) {
    fs.copyFileSync(agentsSrc, agentsDest);
    console.log("   ✅ AGENTS.md copiado");
  }

  // 3. Determine which instructions to keep
  const instructionsToKeep = [
    "global-profile.instructions.md",
    "git-workflow.instructions.md",
    "testing.instructions.md",
  ];
  if (stack.isNext) instructionsToKeep.push("react-nextjs.instructions.md");
  if (stack.isPython) instructionsToKeep.push("python.instructions.md");
  if (stack.hasAI) instructionsToKeep.push("llm-ai.instructions.md");
  instructionsToKeep.push("docker-devops.instructions.md");

  // 4. Copy and merge instructions
  const instructionsSrcDir = path.join(
    TEMPLATE_ROOT,
    ".github",
    "instructions",
  );
  const githubDestDir = path.join(TARGET_ROOT, ".github");
  const instructionsDestDir = path.join(githubDestDir, "instructions");

  if (!fs.existsSync(instructionsDestDir)) {
    fs.mkdirSync(instructionsDestDir, { recursive: true });
  }

  let mergedInstructions = `# ${stack.name} — AI Instructions\n\n> Este archivo consolida las reglas del proyecto para Copilot/Cursor.\n\n`;

  for (const file of instructionsToKeep) {
    const srcFile = path.join(instructionsSrcDir, file);
    if (fs.existsSync(srcFile)) {
      fs.copyFileSync(srcFile, path.join(instructionsDestDir, file));
      const content = fs.readFileSync(srcFile, "utf-8");
      mergedInstructions += `\n\n---\n## ${file.replace(".instructions.md", "")}\n\n${content}`;
    }
  }
  console.log("   ✅ Instrucciones copiadas");

  // 5. Generate copilot-instructions.md and .cursorrules
  const copilotDest = path.join(githubDestDir, "copilot-instructions.md");
  fs.writeFileSync(copilotDest, mergedInstructions);
  console.log("   ✅ .github/copilot-instructions.md generado y consolidado");

  const cursorDest = path.join(TARGET_ROOT, ".cursorrules");
  fs.writeFileSync(cursorDest, mergedInstructions);
  console.log("   ✅ .cursorrules generado en la raíz");

  // 6. Install VS Code Extensions
  const installExt = await question(
    "\n¿Deseas instalar las extensiones recomendadas de VS Code ahora? (s/N): ",
  );
  if (installExt.toLowerCase() === "s") {
    try {
      const extJsonPath = path.join(vscodeDest, "extensions.json");
      if (fs.existsSync(extJsonPath)) {
        const extData = JSON.parse(fs.readFileSync(extJsonPath, "utf-8"));
        if (extData.recommendations) {
          console.log("   Instalando extensiones...");
          for (const ext of extData.recommendations) {
            try {
              execSync(`code --install-extension ${ext}`, { stdio: "ignore" });
              console.log(`     + ${ext} instalada`);
            } catch (e) {
              console.log(
                `     - Error instalando ${ext} (¿tienes 'code' en el PATH?)`,
              );
            }
          }
        }
      }
    } catch (e) {
      console.log("   ❌ Error leyendo extensions.json");
    }
  }

  // 7. Setup Husky
  const setupHusky = await question(
    "\n¿Deseas configurar Husky + Commitlint para Conventional Commits? (s/N): ",
  );
  if (setupHusky.toLowerCase() === "s") {
    try {
      if (!fs.existsSync(path.join(TARGET_ROOT, ".git"))) {
        console.log("   Inicializando repositorio Git...");
        execSync("git init", { stdio: "ignore" });
      }
      if (!fs.existsSync(path.join(TARGET_ROOT, "package.json"))) {
        console.log("   Creando package.json base...");
        execSync("npm init -y", { stdio: "ignore" });
      }

      console.log("   Instalando husky y commitlint...");
      execSync(
        "npm install --save-dev husky @commitlint/cli @commitlint/config-conventional",
        { stdio: "ignore" },
      );
      execSync("npx husky init", { stdio: "ignore" });

      fs.writeFileSync(
        path.join(TARGET_ROOT, ".commitlintrc.json"),
        JSON.stringify(
          {
            extends: ["@commitlint/config-conventional"],
          },
          null,
          2,
        ),
      );

      fs.writeFileSync(
        path.join(TARGET_ROOT, ".husky", "commit-msg"),
        "npx --no -- commitlint --edit ${1}\n",
      );
      console.log("   ✅ Husky configurado");
    } catch (e) {
      console.log(
        "   ❌ Error configurando Husky. Asegúrate de tener git instalado.",
      );
    }
  }

  console.log(
    "\n🎉 ¡Template inyectado con éxito! Tu IA ahora es mucho más inteligente.\n",
  );
  rl.close();
}

main().catch((err) => {
  console.error("Error:", err);
  rl.close();
  process.exit(1);
});
