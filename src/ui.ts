import chalk from 'chalk';
import gradientString from 'gradient-string';

const BANNER_ART = `
 ██████╗██╗  ██╗██╗   ██╗███╗   ███╗███╗   ███╗██╗
██╔════╝██║  ██║██║   ██║████╗ ████║████╗ ████║██║
██║     ███████║██║   ██║██╔████╔██║██╔████╔██║██║
██║     ██╔══██║██║   ██║██║╚██╔╝██║██║╚██╔╝██║██║
╚██████╗██║  ██║╚██████╔╝██║ ╚═╝ ██║██║ ╚═╝ ██║██║
 ╚═════╝╚═╝  ╚═╝ ╚═════╝ ╚═╝     ╚═╝╚═╝     ╚═╝╚═╝
 ██████╗██╗  ██╗ ██████╗ ███╗   ██╗ ██████╗ 
██╔════╝██║  ██║██╔═══██╗████╗  ██║██╔════╝ 
██║     ███████║██║   ██║██╔██╗ ██║██║  ███╗
██║     ██╔══██║██║   ██║██║╚██╗██║██║   ██║
╚██████╗██║  ██║╚██████╔╝██║ ╚████║╚██████╔╝
 ╚═════╝╚═╝  ╚═╝ ╚═════╝ ╚═╝  ╚═══╝ ╚═════╝ 
`;

const chummiGradient = gradientString(['#FF6B6B', '#4ECDC4', '#45B7D1', '#96E6A1', '#DDA0DD']);
const accentGradient = gradientString(['#667eea', '#764ba2']);

export function printBanner(): void {
  console.log(chummiGradient(BANNER_ART));
  console.log(
    accentGradient('  ═══════════════════════════════════════════════════')
  );
  console.log(
    chalk.gray('  ') +
    chalk.bold.hex('#4ECDC4')('🤖 Your AI Coding Assistant') +
    chalk.gray('  •  ') +
    chalk.hex('#DDA0DD')('Powered by NVIDIA NIM')
  );
  console.log(
    accentGradient('  ═══════════════════════════════════════════════════')
  );
  console.log();
  console.log(
    chalk.gray('  Type your message and press Enter. Use ') +
    chalk.hex('#4ECDC4')('/help') +
    chalk.gray(' for commands, ') +
    chalk.hex('#FF6B6B')('/quit') +
    chalk.gray(' to exit.')
  );
  console.log();
}

export function printWelcome(workingDir: string): void {
  console.log(
    chalk.hex('#96E6A1')('  📁 Working directory: ') +
    chalk.bold.white(workingDir)
  );
  console.log();
}

export function printHelp(): void {
  const commands = [
    ['/help', 'Show this help message'],
    ['/clear', 'Clear conversation history'],
    ['/model', 'Show current model info'],
    ['/quit', 'Exit Chummi Chong'],
  ];

  console.log();
  console.log(chalk.bold.hex('#4ECDC4')('  📚 Available Commands:'));
  console.log(chalk.gray('  ─────────────────────────────────'));
  for (const [cmd, desc] of commands) {
    console.log(
      chalk.hex('#DDA0DD')(`  ${cmd.padEnd(12)}`) +
      chalk.gray(desc as string)
    );
  }
  console.log();

  console.log(chalk.bold.hex('#45B7D1')('  🛠️  Available Tools:'));
  console.log(chalk.gray('  ─────────────────────────────────'));
  const tools = [
    ['bash', 'Run shell commands'],
    ['read_file', 'Read file contents'],
    ['write_file', 'Create / overwrite files'],
    ['edit_file', 'Edit parts of a file'],
    ['grep', 'Search file contents'],
    ['glob', 'Find files by pattern'],
  ];
  for (const [tool, desc] of tools) {
    console.log(
      chalk.hex('#96E6A1')(`  ${tool.padEnd(12)}`) +
      chalk.gray(desc as string)
    );
  }
  console.log();
}

export function userPrompt(): string {
  return chalk.bold.hex('#4ECDC4')('  🤖 chummi') + chalk.hex('#DDA0DD')(' ❯ ');
}

export function formatAssistantLabel(): string {
  return chalk.bold.hex('#FF6B6B')('\n  ✨ Chummi Chong');
}

export function formatToolCall(toolName: string, args: string): void {
  console.log(
    chalk.hex('#45B7D1')('\n  🔧 Tool: ') +
    chalk.bold.hex('#96E6A1')(toolName) +
    chalk.gray(' ─────────────────────')
  );
  if (args && args.length < 200) {
    console.log(chalk.gray(`     ${args}`));
  }
}

export function formatToolResult(result: string, isError: boolean = false): void {
  const maxLen = 2000;
  const truncated = result.length > maxLen
    ? result.substring(0, maxLen) + chalk.gray(`\n     ... (${result.length - maxLen} chars truncated)`)
    : result;

  if (isError) {
    console.log(chalk.red(`  ❌ Error: ${truncated}`));
  } else {
    const lines = truncated.split('\n');
    for (const line of lines) {
      console.log(chalk.gray(`     ${line}`));
    }
  }
}

export function formatDivider(): void {
  console.log(
    chalk.gray('\n  ────────────────────────────────────────────────\n')
  );
}

export function formatError(msg: string): void {
  console.log(chalk.bold.red(`\n  ❌ ${msg}\n`));
}

export function formatInfo(msg: string): void {
  console.log(chalk.hex('#45B7D1')(`\n  ℹ️  ${msg}\n`));
}
