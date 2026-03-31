import type OpenAI from 'openai';

// ─── Tool Interface ─────────────────────────────────────────
export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
  execute: (args: Record<string, unknown>) => Promise<string>;
}

// Convert our tool definitions to OpenAI function calling format
export function toOpenAITools(tools: ToolDefinition[]): OpenAI.ChatCompletionTool[] {
  return tools.map(tool => ({
    type: 'function' as const,
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters,
    },
  }));
}

// Execute a tool by name
export async function executeTool(
  tools: ToolDefinition[],
  name: string,
  argsJson: string,
): Promise<string> {
  const tool = tools.find(t => t.name === name);
  if (!tool) {
    return `Error: Unknown tool "${name}"`;
  }

  try {
    const args = JSON.parse(argsJson);
    return await tool.execute(args);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return `Error executing ${name}: ${message}`;
  }
}
