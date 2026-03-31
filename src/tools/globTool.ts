import { glob } from 'glob';
import * as path from 'path';
import type { ToolDefinition } from './baseTool.ts';

export const globTool: ToolDefinition = {
  name: 'find_files',
  description:
    'Find files matching a glob pattern. Use this to discover project structure, find specific file types, or locate files by name. Returns matching file paths.',
  parameters: {
    type: 'object',
    properties: {
      pattern: {
        type: 'string',
        description: 'Glob pattern to match (e.g., "**/*.ts", "src/**/*.py", "*.json")',
      },
      search_path: {
        type: 'string',
        description: 'Base directory to search from (defaults to current directory)',
      },
    },
    required: ['pattern'],
  },

  async execute(args: Record<string, unknown>): Promise<string> {
    const pattern = args.pattern as string;
    const searchPath = path.resolve((args.search_path as string) || '.');

    try {
      const matches = await glob(pattern, {
        cwd: searchPath,
        nodir: false,
        ignore: ['**/node_modules/**', '**/.git/**', '**/dist/**'],
        maxDepth: 10,
      });

      if (matches.length === 0) {
        return `No files found matching "${pattern}" in ${searchPath}`;
      }

      const limited = matches.slice(0, 100);
      let result = `Found ${matches.length} file(s) matching "${pattern}":\n`;
      result += limited.map(f => `  ${f}`).join('\n');

      if (matches.length > 100) {
        result += `\n  ... and ${matches.length - 100} more`;
      }

      return result;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return `Error searching files: ${message}`;
    }
  },
};
