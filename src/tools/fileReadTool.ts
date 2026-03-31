import * as fs from 'fs';
import * as path from 'path';
import type { ToolDefinition } from './baseTool.ts';

export const fileReadTool: ToolDefinition = {
  name: 'read_file',
  description:
    'Read the contents of a file. Returns the file content with line numbers. Use this to understand code, check configurations, or inspect any text file. For binary files, use the bash tool instead.',
  parameters: {
    type: 'object',
    properties: {
      file_path: {
        type: 'string',
        description: 'Absolute or relative path to the file to read',
      },
      start_line: {
        type: 'number',
        description: 'Optional start line (1-indexed). If omitted, reads from beginning.',
      },
      end_line: {
        type: 'number',
        description: 'Optional end line (1-indexed, inclusive). If omitted, reads to end.',
      },
    },
    required: ['file_path'],
  },

  async execute(args: Record<string, unknown>): Promise<string> {
    const filePath = path.resolve(args.file_path as string);
    const startLine = (args.start_line as number) || 1;
    const endLine = args.end_line as number | undefined;

    if (!fs.existsSync(filePath)) {
      return `Error: File not found: ${filePath}`;
    }

    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      return `Error: "${filePath}" is a directory, not a file. Use bash with 'ls' to list contents.`;
    }

    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.split('\n');
      const end = endLine ? Math.min(endLine, lines.length) : lines.length;
      const start = Math.max(1, startLine);

      const numbered = lines
        .slice(start - 1, end)
        .map((line, i) => `${String(start + i).padStart(4)}: ${line}`)
        .join('\n');

      return `File: ${filePath} (${lines.length} lines)\n${numbered}`;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return `Error reading file: ${message}`;
    }
  },
};
