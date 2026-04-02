import React from 'react';
import { Box, Text } from 'ink';

interface Message {
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  toolName?: string;
  isError?: boolean;
}

export const MessageList: React.FC<{ messages: Message[] }> = ({ messages }) => {
  return (
    <Box flexDirection="column">
      {messages.map((message, index) => (
        <Box key={index} marginBottom={1} flexDirection="column">
          {message.role === 'user' && (
            <Box>
              <Text bold color="#4ECDC4">👤 User: </Text>
              <Text>{message.content}</Text>
            </Box>
          )}
          
          {message.role === 'assistant' && (
            <Box flexDirection="column">
              <Text bold color="#FF6B6B">✨ Chummi: </Text>
              <Text>{message.content}</Text>
            </Box>
          )}
          
          {message.role === 'tool' && (
            <Box paddingLeft={2} borderStyle="round" borderColor="gray">
              <Text italic color="gray">
                {message.toolName ? `🔧 Running tool: ${message.toolName}` : message.content}
                {message.isError && <Text color="red"> (Error)</Text>}
              </Text>
            </Box>
          )}

          {message.role === 'system' && (
            <Box>
              <Text color={message.isError ? 'red' : 'yellow'}>{message.content}</Text>
            </Box>
          )}
        </Box>
      ))}
    </Box>
  );
};
