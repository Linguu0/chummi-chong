import * as fs from 'fs';
import * as path from 'path';
import type { ToolDefinition } from './baseTool.ts';

export const fileWriteTool: ToolDefinition = {
  name: 'write_file',
  description:
    'Create a new file or overwrite an existing file with the provided content. Parent directories will be created automatically if they don\'t exist. Use this for creating new files from scratch.',
  parameters: {
    type: 'object',
    properties: {
      file_path: {
        type: 'string',
        description: 'Absolute or relative path for the file to create/overwrite',
      },
      content: {
        type: 'string',
        description: 'The complete content to write to the file',
      },
    },
    required: ['file_path', 'content'],
  },

  async execute(args: Record<string, unknown>): Promise<string> {
    const filePath = path.resolve(args.file_path as string);
    const content = args.content as string;

    if (content === undefined || content === null) {
      return 'Error: No content provided';
    }

    try {
      // Create parent directories if needed
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      const existed = fs.existsSync(filePath);
      fs.writeFileSync(filePath, content, 'utf-8');

      const lines = content.split('\n').length;
      return existed
        ? `✅ Overwrote ${filePath} (${lines} lines)`
        : `✅ Created ${filePath} (${lines} lines)`;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return `Error writing file: ${message}`;
    }
  },
};
