import { execSync } from 'child_process';
import type { ToolDefinition } from './baseTool.ts';

export const bashTool: ToolDefinition = {
  name: 'bash',
  description:
    'Execute a shell command in the user\'s terminal. Use this for running scripts, installing packages, git operations, listing files, and any other terminal commands. Always prefer this for quick file system checks (ls, cat, find). The command runs in the current working directory.',
  parameters: {
    type: 'object',
    properties: {
      command: {
        type: 'string',
        description: 'The shell command to execute',
      },
    },
    required: ['command'],
  },

  async execute(args: Record<string, unknown>): Promise<string> {
    const command = args.command as string;
    if (!command) return 'Error: No command provided';

    try {
      const output = execSync(command, {
        encoding: 'utf-8',
        timeout: 30000,
        maxBuffer: 1024 * 1024,
        cwd: process.cwd(),
        stdio: ['pipe', 'pipe', 'pipe'],
      });
      return output || '(command completed with no output)';
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'stderr' in err) {
        const execErr = err as { stderr: string; stdout: string; status: number };
        return `Exit code: ${execErr.status}\nstdout: ${execErr.stdout || ''}\nstderr: ${execErr.stderr || ''}`;
      }
      const message = err instanceof Error ? err.message : String(err);
      return `Error: ${message}`;
    }
  },
};
