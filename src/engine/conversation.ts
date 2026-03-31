import type OpenAI from 'openai';

export type Message = OpenAI.ChatCompletionMessageParam;

export class Conversation {
  private messages: Message[] = [];
  private maxHistory: number;

  constructor(systemPrompt: string, maxHistory: number = 50) {
    this.maxHistory = maxHistory;
    this.messages = [
      { role: 'system', content: systemPrompt },
    ];
  }

  addUser(content: string): void {
    this.messages.push({ role: 'user', content });
    this.trim();
  }

  addAssistant(content: string): void {
    this.messages.push({ role: 'assistant', content });
    this.trim();
  }

  addAssistantToolCalls(toolCalls: OpenAI.ChatCompletionMessageToolCall[]): void {
    this.messages.push({
      role: 'assistant',
      content: null,
      tool_calls: toolCalls,
    } as Message);
  }

  addToolResult(toolCallId: string, result: string): void {
    this.messages.push({
      role: 'tool',
      tool_call_id: toolCallId,
      content: result,
    } as Message);
  }

  getMessages(): Message[] {
    return [...this.messages];
  }

  clear(systemPrompt: string): void {
    this.messages = [
      { role: 'system', content: systemPrompt },
    ];
  }

  get length(): number {
    return this.messages.length;
  }

  private trim(): void {
    // Keep system prompt + last N messages
    if (this.messages.length > this.maxHistory + 1) {
      const system = this.messages[0];
      this.messages = [system, ...this.messages.slice(-(this.maxHistory))];
    }
  }
}
