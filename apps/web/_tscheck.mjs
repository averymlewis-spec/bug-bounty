// Diagnostic for the web package: syntax-check the TS client + list missing imports.
import { execSync } from "node:child_process";
import { readFileSync, existsSync, readdirSync } from "node:fs";
const web = "/Users/kingavery/Downloads/ZERO-Autonomous-Business-OS-v72-PROFIT-COMMAND-LEARNING/workspaces/agent_4c53dbd52c/repo/apps/web";

function exists(p) { try { execSync(`cd ${web} && npx tsc --noEmit`, { stdio: "pipe", timeout: 120000 }); return "BUILD_OK"; } catch(e){ return "BUILD_FAIL:\n" + (e.stderr||"").toString().slice(0,1500); } }
console.log(exists());
