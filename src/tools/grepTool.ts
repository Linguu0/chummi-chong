import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import type { ToolDefinition } from './baseTool.ts';

export const grepTool: ToolDefinition = {
  name: 'grep',
  description:
    'Search for text patterns within files. Uses ripgrep (rg) if available, otherwise falls back to built-in search. Returns matching lines with file paths and line numbers. Great for finding function definitions, imports, error messages, and more.',
  parameters: {
    type: 'object',
    properties: {
      pattern: {
        type: 'string',
        description: 'The search pattern (supports regex)',
      },
      search_path: {
        type: 'string',
        description: 'Directory or file to search in (defaults to current directory)',
      },
      case_insensitive: {
        type: 'boolean',
        description: 'Whether to ignore case (default: false)',
      },
      include: {
        type: 'string',
        description: 'File glob pattern to include (e.g., "*.ts", "*.py")',
      },
    },
    required: ['pattern'],
  },

  async execute(args: Record<string, unknown>): Promise<string> {
    const pattern = args.pattern as string;
    const searchPath = path.resolve((args.search_path as string) || '.');
    const caseInsensitive = args.case_insensitive as boolean;
    const include = args.include as string;

    if (!fs.existsSync(searchPath)) {
      return `Error: Path not found: ${searchPath}`;
    }

    // Try ripgrep first
    try {
      let cmd = `rg --no-heading --line-number --max-count 50`;
      if (caseInsensitive) cmd += ' -i';
      if (include) cmd += ` --glob '${include}'`;
      cmd += ` '${pattern.replace(/'/g, "'\\''")}' '${searchPath}'`;

      const output = execSync(cmd, {
        encoding: 'utf-8',
        timeout: 10000,
        maxBuffer: 512 * 1024,
      });
      return output || 'No matches found.';
    } catch {
      // ripgrep not found or no results, try grep
    }

    // Fallback to grep
    try {
      let cmd = `grep -rnI --max-count=50`;
      if (caseInsensitive) cmd += ' -i';
      if (include) cmd += ` --include='${include}'`;
      cmd += ` '${pattern.replace(/'/g, "'\\''")}' '${searchPath}'`;

      const output = execSync(cmd, {
        encoding: 'utf-8',
        timeout: 10000,
        maxBuffer: 512 * 1024,
      });
      return output || 'No matches found.';
    } catch {
      return 'No matches found.';
    }
  },
};
