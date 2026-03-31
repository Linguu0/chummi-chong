#!/usr/bin/env node
import * as readline from 'readline';
import chalk from 'chalk';
import { config, validateConfig } from './config.ts';
import { LLMEngine } from './engine/llm.ts';
import {
  printBanner,
  printWelcome,
  printHelp,
  userPrompt,
  formatAssistantLabel,
  formatDivider,
  formatError,
  formatInfo,
} from './ui.ts';

// ─── Main REPL ──────────────────────────────────────────────
async function main(): Promise<void> {
  // Show the beautiful banner
  console.clear();
  printBanner();

  // Validate config
  if (!validateConfig()) {
    process.exit(1);
  }

  // Show working directory
  printWelcome(process.cwd());

  // Initialize the LLM engine
  const engine = new LLMEngine();

  // Create readline interface
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: userPrompt(),
    terminal: true,
  });

  // Handle graceful exit
  const exit = () => {
    console.log(
      chalk.hex('#4ECDC4')('\n\n  👋 See you later! — Chummi Chong\n')
    );
    rl.close();
    process.exit(0);
  };

  process.on('SIGINT', exit);

  rl.prompt();

  rl.on('line', async (line: string) => {
    const input = line.trim();

    if (!input) {
      rl.prompt();
      return;
    }

    // ─── Handle slash commands ───
    if (input.startsWith('/')) {
      const cmd = input.toLowerCase();

      switch (cmd) {
        case '/quit':
        case '/exit':
        case '/q':
          exit();
          return;

        case '/help':
        case '/h':
          printHelp();
          rl.prompt();
          return;

        case '/clear':
          engine.clearHistory();
          console.clear();
          printBanner();
          formatInfo('Conversation cleared! Fresh start. 🧹');
          rl.prompt();
          return;

        case '/model':
          formatInfo(engine.getModelInfo());
          rl.prompt();
          return;

        default:
          formatError(`Unknown command: ${cmd}. Type /help for available commands.`);
          rl.prompt();
          return;
      }
    }

    // ─── Send to LLM ───
    try {
      // Temporarily pause the readline to allow tool permission prompts
      rl.pause();

      const response = await engine.chat(input);

      // Print response
      console.log(formatAssistantLabel());
      console.log();

      // Pretty print the response with word wrapping
      const lines = response.split('\n');
      for (const responseLine of lines) {
        console.log(chalk.white(`  ${responseLine}`));
      }

      formatDivider();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      formatError(message);
    }

    // Resume readline
    rl.resume();
    rl.prompt();
  });

  rl.on('close', () => {
    exit();
  });
}

// ─── Run ─────────────────────────────────────────────────────
main().catch(err => {
  console.error(chalk.red(`\n Fatal error: ${err.message}\n`));
  process.exit(1);
});
