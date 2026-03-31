import OpenAI from 'openai';
import ora from 'ora';
import chalk from 'chalk';
import { config } from '../config.ts';
import { Conversation } from './conversation.ts';
import { getSystemPrompt } from './systemPrompt.ts';
import { allTools } from '../tools/registry.ts';
import { toOpenAITools, executeTool } from '../tools/baseTool.ts';
import { formatToolCall, formatToolResult, formatAssistantLabel } from '../ui.ts';

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

  async chat(userMessage: string): Promise<string> {
    this.conversation.addUser(userMessage);

    const spinner = ora({
      text: chalk.hex('#45B7D1')(' Chummi is thinking...'),
      spinner: 'dots12',
      color: 'cyan',
    }).start();

    try {
      let response = await this.callLLM(spinner);

      // Tool execution loop — keep going while the AI wants to call tools
      let iterations = 0;
      const maxIterations = 10;

      while (response.tool_calls && response.tool_calls.length > 0 && iterations < maxIterations) {
        iterations++;
        spinner.stop();

        // Record assistant's tool call message
        this.conversation.addAssistantToolCalls(response.tool_calls);

        // Execute each tool call
        for (const toolCall of response.tool_calls) {
          const toolName = toolCall.function.name;
          const toolArgs = toolCall.function.arguments;

          formatToolCall(toolName, toolArgs);

          const result = await executeTool(allTools, toolName, toolArgs);
          const isError = result.startsWith('Error');
          formatToolResult(result, isError);

          this.conversation.addToolResult(toolCall.id, result);
        }

        // Call LLM again with tool results
        spinner.start(chalk.hex('#45B7D1')(' Chummi is processing results...'));
        response = await this.callLLM(spinner);
      }

      spinner.stop();

      const assistantMessage = response.content || '(no response)';
      this.conversation.addAssistant(assistantMessage);

      return assistantMessage;
    } catch (err: unknown) {
      spinner.stop();
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

  private async callLLM(
    spinner: ReturnType<typeof ora>,
  ): Promise<{ content: string | null; tool_calls?: OpenAI.ChatCompletionMessageToolCall[] }> {
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
        spinner.text = chalk.hex('#DDA0DD')(' Retrying without tools...');

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
