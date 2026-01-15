/**
 * Codex Agent for Living Apps Dashboard Generator
 * 
 * This is the Codex SDK equivalent of claude_agent.py
 * Uses OpenAI's Codex TypeScript SDK for programmatic control
 * 
 * Usage:
 *   npx ts-node codex_agent.ts
 *   # or after build:
 *   node codex_agent.js
 * 
 * Environment Variables:
 *   - OPENAI_API_KEY: OpenAI API key (required)
 *   - GIT_PUSH_URL: Git URL with OAuth2 token for pushing
 *   - REPO_NAME: Repository/appgroup name
 *   - LIVINGAPPS_API_KEY: Living Apps API key for dashboard links
 *   - USER_PROMPT: Optional custom prompt for continue mode
 */

import { Codex } from "@openai/codex-sdk";

// Output types for streaming to parent process (matches claude_agent.py format)
interface OutputMessage {
  type: "think" | "tool" | "result" | "status";
  content?: string;
  tool?: string;
  input?: string;
  status?: "success" | "error";
  cost?: number;
}

function log(message: OutputMessage): void {
  console.log(JSON.stringify(message));
}

function logStatus(content: string): void {
  log({ type: "status", content });
}

async function main(): Promise<void> {
  const userPrompt = process.env.USER_PROMPT;
  const repoName = process.env.REPO_NAME;

  logStatus("[CODEX] Initialisiere Codex SDK...");

  // Initialize Codex client
  // Note: Authentication is handled via ~/.codex/auth.json (copied from host)
  // The SDK inherits the environment and reads auth from CODEX_HOME
  const codex = new Codex({
    env: {
      // Pass through required environment variables
      PATH: process.env.PATH || "/usr/local/bin:/usr/bin:/bin",
      HOME: process.env.HOME || "/home/user",
      CODEX_HOME: process.env.CODEX_HOME || "/home/user/.codex",
      GIT_PUSH_URL: process.env.GIT_PUSH_URL || "",
      REPO_NAME: process.env.REPO_NAME || "",
      LIVINGAPPS_API_KEY: process.env.LIVINGAPPS_API_KEY || "",
      // Node.js specific
      NODE_ENV: "production",
    },
  });

  // Model configuration - change this to use different models
  // Available models depend on your subscription:
  // - "o3" / "o3-mini" - Latest reasoning models
  // - "gpt-4.1" - GPT-4.1 
  // - "gpt-5-codex" - Codex-optimized (default)
  const model = process.env.CODEX_MODEL || "gpt-5.2-codex"; // Default to o3
  
  // Start a new thread with working directory and full permissions
  logStatus(`[CODEX] Erstelle Thread mit Model: ${model}`);
  logStatus("[CODEX] approvalPolicy: never, sandboxMode: danger-full-access");
  
  const thread = codex.startThread({
    model: model,
    workingDirectory: "/home/user/app",
    skipGitRepoCheck: true, // We handle git ourselves in deploy script
    approvalPolicy: "never", // No approval needed - fully autonomous
    sandboxMode: "danger-full-access", // Full file system access
    networkAccessEnabled: true, // Allow network for npm etc
    webSearchEnabled: false, // Don't need web search
    modelReasoningEffort: "high", // Use more reasoning for complex tasks
  });
  
  logStatus("[CODEX] Thread erstellt mit Full-Auto Mode");

  // Build the query based on mode
  let query: string;

  if (userPrompt) {
    // Continue Mode: Custom prompt from user
    logStatus(`[CODEX] Continue-Mode mit User-Prompt: ${userPrompt}`);
    
    query = `🚨 AUFGABE: Du MUSST das existierende Dashboard ändern und deployen!

User-Anfrage: "${userPrompt}"

PFLICHT-SCHRITTE (alle müssen ausgeführt werden):

1. LESEN: Lies src/pages/Dashboard.tsx um die aktuelle Struktur zu verstehen
2. ÄNDERN: Implementiere die User-Anfrage
3. TESTEN: Führe 'npm run build' aus um sicherzustellen dass es kompiliert
4. DEPLOYEN: Führe 'npx ts-node deploy_to_github.ts' aus um die Änderungen zu pushen
   Die Umgebungsvariablen sind bereits gesetzt - NICHT mit Dummy-Werten testen!

⚠️ KRITISCH:
- Du MUSST Änderungen am Code machen!
- Du MUSST am Ende das Deploy-Skript ausführen: npx ts-node deploy_to_github.ts
- Beende NICHT ohne zu deployen!
- Analysieren alleine reicht NICHT - du musst HANDELN!
- KEINE lokalen Test-Repos! Nutze die echten Umgebungsvariablen!

Das Dashboard existiert bereits. Mache NUR die angeforderten Änderungen, nicht mehr.
Starte JETZT mit Schritt 1!`;

  } else {
    // Build Mode: Create new dashboard
    logStatus("[CODEX] Build-Mode: Neues Dashboard erstellen");
    
    query = `Du bist ein Dashboard-Generator für Living Apps. Du MUSST jetzt ein Dashboard bauen!

SCHRITT 1 - SOFORT AUSFÜHREN:
Lies die Datei CLAUDE.md mit dem Read-Tool um die Anleitung zu verstehen.

SCHRITT 2:
Lies app_metadata.json um die App-Struktur und Felder zu verstehen.

SCHRITT 3:
Erstelle design_spec.json mit dem Design für das Dashboard:
- Welche KPIs sind wichtig?
- Welche Charts passen zu den Daten?
- Welches Farbschema?

SCHRITT 4:
Erstelle src/pages/Dashboard.tsx basierend auf design_spec.json:
- Importiere die Types aus src/types/app.ts
- Nutze den Service aus src/services/livingAppsService.ts
- Verwende shadcn/ui Komponenten
- Füge recharts Charts hinzu

SCHRITT 5:
Teste den Build:
npm run build

SCHRITT 6:
Deploye das Dashboard - verwende die ECHTEN Umgebungsvariablen:
npx ts-node deploy_to_github.ts

Die Umgebungsvariablen GIT_PUSH_URL, REPO_NAME und LIVINGAPPS_API_KEY sind bereits gesetzt!
Du musst sie NICHT manuell setzen oder mit Dummy-Werten testen!

⚠️ KRITISCH:
- Du MUSST Code schreiben! Analysieren alleine reicht NICHT!
- Du MUSST am Ende deployen mit: npx ts-node deploy_to_github.ts (OHNE eigene env vars!)
- Die Types und Services existieren bereits in src/types/ und src/services/
- Teste NICHT mit lokalen Dummy-Repos! Nutze die echten Umgebungsvariablen!

STARTE JETZT MIT SCHRITT 1: Lies CLAUDE.md!`;
  }

  logStatus("[CODEX] Starte Agent...");

  try {
    // Use streaming to get intermediate progress
    logStatus("[CODEX] Sende Query an Codex...");
    const { events } = await thread.runStreamed(query);

    let itemCount = 0;
    let toolCallCount = 0;

    // Process events as they come
    for await (const event of events) {
      // Log ALL events for debugging
      logStatus(`[CODEX] Event: ${event.type}`);
      
      switch (event.type) {
        case "item.created":
        case "item.started":
          itemCount++;
          // New item started (tool call, message, etc.)
          if (event.item) {
            const itemStr = JSON.stringify(event.item).substring(0, 800);
            log({
              type: "tool",
              tool: event.item.type || "item",
              input: itemStr,
            });
          }
          break;

        case "item.completed":
          // Item finished
          if (event.item) {
            const itemType = event.item.type || "unknown";
            const itemStr = JSON.stringify(event.item).substring(0, 1000);
            logStatus(`[CODEX] Item completed: ${itemType}`);
            
            // Log based on item type
            if (itemType === "message" && "content" in event.item) {
              const content = event.item.content;
              if (Array.isArray(content)) {
                for (const block of content) {
                  if (block.type === "text" && "text" in block) {
                    log({ type: "think", content: block.text });
                  }
                }
              } else if (typeof content === "string") {
                log({ type: "think", content: content });
              }
            } else if (itemType === "function_call" || itemType === "tool_use" || itemType === "tool_call") {
              toolCallCount++;
              log({
                type: "tool",
                tool: "name" in event.item ? String(event.item.name) : itemType,
                input: "arguments" in event.item ? String(event.item.arguments) : itemStr,
              });
            } else {
              // Log any other item type
              log({ type: "tool", tool: itemType, input: itemStr });
            }
          }
          break;

        case "turn.completed":
          // Turn finished
          logStatus(`[CODEX] Turn abgeschlossen - Items: ${itemCount}, Tool Calls: ${toolCallCount}`);
          if (event.usage) {
            const usage = event.usage as Record<string, unknown>;
            log({
              type: "result",
              status: "success",
              cost: typeof usage.total_tokens === "number" ? usage.total_tokens * 0.00001 : 0,
              content: `Items: ${itemCount}, Tools: ${toolCallCount}`,
            });
          } else {
            log({
              type: "result",
              status: "success",
              content: `Items: ${itemCount}, Tools: ${toolCallCount}`,
            });
          }
          break;

        case "turn.failed":
          logStatus("[CODEX] ❌ Turn fehlgeschlagen");
          if ("error" in event) {
            log({
              type: "result",
              status: "error",
              content: String(event.error),
            });
          }
          break;

        case "error":
          // Error occurred
          log({
            type: "result",
            status: "error",
            content: "error" in event ? String(event.error) : "Unknown error",
          });
          break;

        default:
          // Log event data for debugging
          const eventData = JSON.stringify(event).substring(0, 500);
          logStatus(`[CODEX] Unhandled event: ${eventData}`);
      }
    }

    logStatus(`[CODEX] ✅ Agent beendet - Total Items: ${itemCount}, Tool Calls: ${toolCallCount}`);
    
    if (toolCallCount === 0) {
      logStatus("[CODEX] ⚠️ WARNUNG: Keine Tool Calls ausgeführt! Agent hat möglicherweise nichts getan.");
    }
    
    log({ type: "result", status: "success" });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : "";
    logStatus(`[CODEX] ❌ Fehler: ${errorMessage}`);
    logStatus(`[CODEX] Stack: ${errorStack}`);
    log({ type: "result", status: "error", content: errorMessage });
    process.exit(1);
  }
}

// Run main
main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});

