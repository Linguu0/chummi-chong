import * as fs from 'fs';
import * as path from 'path';
import type { ToolDefinition } from './baseTool.ts';

export const fileEditTool: ToolDefinition = {
  name: 'edit_file',
  description:
    'Edit a file by replacing a specific string/block with new content. The old_text must match EXACTLY (including whitespace and indentation). Use read_file first to see the current contents before editing.',
  parameters: {
    type: 'object',
    properties: {
      file_path: {
        type: 'string',
        description: 'Path to the file to edit',
      },
      old_text: {
        type: 'string',
        description: 'The exact text to find and replace (must match exactly)',
      },
      new_text: {
        type: 'string',
        description: 'The replacement text',
      },
    },
    required: ['file_path', 'old_text', 'new_text'],
  },

  async execute(args: Record<string, unknown>): Promise<string> {
    const filePath = path.resolve(args.file_path as string);
    const oldText = args.old_text as string;
    const newText = args.new_text as string;

    if (!fs.existsSync(filePath)) {
      return `Error: File not found: ${filePath}`;
    }

    try {
      const content = fs.readFileSync(filePath, 'utf-8');

      if (!content.includes(oldText)) {
        return `Error: Could not find the specified text in ${filePath}. Make sure old_text matches exactly (including whitespace).`;
      }

      const occurrences = content.split(oldText).length - 1;
      if (occurrences > 1) {
        return `Warning: Found ${occurrences} occurrences of old_text. Please provide more context to uniquely identify the target. Only the first occurrence will be replaced.`;
      }

      const newContent = content.replace(oldText, newText);
      fs.writeFileSync(filePath, newContent, 'utf-8');

      return `✅ Edited ${filePath} — replaced ${oldText.split('\n').length} line(s)`;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return `Error editing file: ${message}`;
    }
  },
};
