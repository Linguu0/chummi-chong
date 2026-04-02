import React, { useState, useEffect } from 'react';
import { Box, Text, useInput, useApp } from 'ink';
import TextInput from 'ink-text-input';
import Spinner from 'ink-spinner';
import { LLMEngine, LLMUpdate } from '../engine/llm.ts';
import { MessageList } from './MessageList.tsx';
import { PermissionRequest } from './PermissionRequest.tsx';

interface Message {
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  toolName?: string;
  isError?: boolean;
}

export const App: React.FC<{ engine: LLMEngine }> = ({ engine }) => {
  const { exit } = useApp();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [permissionRequest, setPermissionRequest] = useState<{
    tool: string;
    args: string;
    onHandle: (approved: boolean) => void;
  } | null>(null);

  const handleSubmit = async (query: string) => {
    if (!query.trim() || isProcessing) return;

    setInput('');
    setIsProcessing(true);
    setMessages(prev => [...prev, { role: 'user', content: query }]);

    try {
      await engine.chat(query, (update: LLMUpdate) => {
        switch (update.type) {
          case 'status':
            setStatus(update.message);
            break;
          case 'tool_call':
            setMessages(prev => [
              ...prev,
              { role: 'tool', content: `🔧 Executing ${update.tool}...`, toolName: update.tool }
            ]);
            break;
          case 'tool_result':
            setMessages(prev => [
              ...prev,
              { role: 'tool', content: update.result, isError: update.isError }
            ]);
            break;
          case 'content':
            setMessages(prev => [...prev, { role: 'assistant', content: update.text }]);
            setStatus(null);
            break;
          case 'permission_request':
            setPermissionRequest({
              tool: update.tool,
              args: update.args,
              onHandle: (approved: boolean) => {
                setPermissionRequest(null);
                update.onHandle(approved);
              }
            });
            break;
        }
      });
    } catch (err: any) {
      setMessages(prev => [...prev, { role: 'system', content: `Error: ${err.message}`, isError: true }]);
    } finally {
      setIsProcessing(false);
      setStatus(null);
    }
  };

  useInput((input, key) => {
    if (key.ctrl && input === 'c') {
      exit();
    }
  });

  return (
    <Box flexDirection="column" paddingX={2} paddingY={1}>
      <MessageList messages={messages} />
      
      {permissionRequest && (
        <PermissionRequest
          tool={permissionRequest.tool}
          args={permissionRequest.args}
          onHandle={permissionRequest.onHandle}
        />
      )}

      {status && !permissionRequest && (
        <Box marginTop={1}>
          <Text color="#FF0a54">
            {/* @ts-ignore */}
            <Spinner type="dots" /> {status}
          </Text>
        </Box>
      )}

      {!permissionRequest && (
        <Box marginTop={1}>
          <Text bold color="#FF0a54">💖 simp ❯{' '}
          </Text>
          <TextInput
            value={input}
            onChange={setInput}
            onSubmit={handleSubmit}
            placeholder="Type your message..."
          />
        </Box>
      )}
      
      {isProcessing && !status && !permissionRequest && (
        <Box>
          <Text color="gray">Processing...</Text>
        </Box>
      )}
    </Box>
  );
};
