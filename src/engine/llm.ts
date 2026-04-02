import OpenAI from 'openai';
import { config } from '../config.ts';
import { Conversation } from './conversation.ts';
import { getSystemPrompt } from './systemPrompt.ts';
import { allTools } from '../tools/registry.ts';
import { toOpenAITools, executeTool } from '../tools/baseTool.ts';

export type LLMUpdate = 
  | { type: 'status'; message: string }
  | { type: 'tool_call'; tool: string; args: string }
  | { type: 'tool_result'; result: string; isError: boolean }
  | { type: 'content'; text: string }
  | { type: 'permission_request'; tool: string; args: string; onHandle: (approved: boolean) => void };

export class LLMEngine {
  private client: OpenAI;
  private conversation: Conversation;
  private toolDefs: OpenAI.ChatCompletionTool[];

  constructor() {
    this.client = new OpenAI({
      apiKey: config.nvidia.apiKey,
      baseURL: config.nvidia.baseUrl,
    });

    const systemPrompt = getSystemPrompt(process.cwd());
    this.conversation = new Conversation(systemPrompt, config.app.maxHistoryLength);
    this.toolDefs = toOpenAITools(allTools);
  }

  async chat(
    userMessage: string, 
    onUpdate?: (update: LLMUpdate) => void
  ): Promise<string> {
    this.conversation.addUser(userMessage);

    if (onUpdate) onUpdate({ type: 'status', message: 'Chummi is thinking...' });

    try {
      let response = await this.callLLM();

      let iterations = 0;
      const maxIterations = 10;

      while (response.tool_calls && response.tool_calls.length > 0 && iterations < maxIterations) {
        iterations++;

        this.conversation.addAssistantToolCalls(response.tool_calls);

        for (const toolCall of response.tool_calls) {
          const toolName = toolCall.function.name;
          const toolArgs = toolCall.function.arguments;

          // Request permission for sensitive tools (bash, write_file, edit_file)
          if (['bash', 'write_file', 'edit_file'].includes(toolName)) {
            if (onUpdate) {
              const approved = await new Promise<boolean>((resolve) => {
                onUpdate({ 
                  type: 'permission_request', 
                  tool: toolName, 
                  args: toolArgs, 
                  onHandle: resolve 
                });
              });

              if (!approved) {
                const result = 'Command cancelled by user.';
                if (onUpdate) onUpdate({ type: 'tool_result', result, isError: true });
                this.conversation.addToolResult(toolCall.id, result);
                continue;
              }
            }
          }

          if (onUpdate) onUpdate({ type: 'tool_call', tool: toolName, args: toolArgs });

          const result = await executeTool(allTools, toolName, toolArgs);
          const isError = result.startsWith('Error');
          
          if (onUpdate) onUpdate({ type: 'tool_result', result, isError });

          this.conversation.addToolResult(toolCall.id, result);
        }

        if (onUpdate) onUpdate({ type: 'status', message: 'Chummi is processing results...' });
        response = await this.callLLM();
      }

      const assistantMessage = response.content || '(no response)';
      this.conversation.addAssistant(assistantMessage);

      if (onUpdate) onUpdate({ type: 'content', text: assistantMessage });

      return assistantMessage;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);

      if (message.includes('401') || message.includes('Unauthorized')) {
        throw new Error('❌ Invalid NVIDIA API key. Check your .env file.');
      }
      if (message.includes('429') || message.includes('rate')) {
        throw new Error('⏳ Rate limited. Please wait a moment and try again.');
      }
      throw new Error(`API error: ${message}`);
    }
  }

  private async callLLM(): Promise<{ content: string | null; tool_calls?: OpenAI.ChatCompletionMessageToolCall[] }> {
    const messages = this.conversation.getMessages();

    try {
      const completion = await this.client.chat.completions.create({
        model: config.nvidia.model,
        messages,
        tools: this.toolDefs.length > 0 ? this.toolDefs : undefined,
        tool_choice: 'auto',
        temperature: 0.7,
        max_tokens: 4096,
      });

      const choice = completion.choices[0];
      if (!choice) {
        return { content: 'Sorry, I got an empty response. Try again?' };
      }

      return {
        content: choice.message.content,
        tool_calls: choice.message.tool_calls,
      };
    } catch (err: unknown) {
      // If function calling fails, retry without tools
      const message = err instanceof Error ? err.message : String(err);
      if (message.includes('tools') || message.includes('function')) {
        const completion = await this.client.chat.completions.create({
          model: config.nvidia.model,
          messages,
          temperature: 0.7,
          max_tokens: 4096,
        });

        const choice = completion.choices[0];
        return { content: choice?.message.content || 'No response.' };
      }
      throw err;
    }
  }

  clearHistory(): void {
    const systemPrompt = getSystemPrompt(process.cwd());
    this.conversation.clear(systemPrompt);
  }

  getModelInfo(): string {
    return `Model: ${config.nvidia.model}\nBase URL: ${config.nvidia.baseUrl}\nHistory: ${this.conversation.length} messages`;
  }
}
