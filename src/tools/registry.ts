import type { ToolDefinition } from './baseTool.ts';
import { bashTool } from './bashTool.ts';
import { fileReadTool } from './fileReadTool.ts';
import { fileWriteTool } from './fileWriteTool.ts';
import { fileEditTool } from './fileEditTool.ts';
import { grepTool } from './grepTool.ts';
import { globTool } from './globTool.ts';

// ─── Tool Registry ──────────────────────────────────────────
// All available tools that Chummi Chong can use
export const allTools: ToolDefinition[] = [
  bashTool,
  fileReadTool,
  fileWriteTool,
  fileEditTool,
  grepTool,
  globTool,
];

export function getToolByName(name: string): ToolDefinition | undefined {
  return allTools.find(t => t.name === name);
}
