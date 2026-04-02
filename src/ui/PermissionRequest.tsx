import React from 'react';
import { Box, Text } from 'ink';
import SelectInput from 'ink-select-input';

interface PermissionRequestProps {
  tool: string;
  args: string;
  onHandle: (approved: boolean) => void;
}

export const PermissionRequest: React.FC<PermissionRequestProps> = ({ tool, args, onHandle }) => {
  const items = [
    { label: '✅ Approve', value: true },
    { label: '❌ Deny', value: false },
  ];

  const handleSelect = (item: { value: boolean }) => {
    onHandle(item.value);
  };

  return (
    <Box flexDirection="column" borderStyle="double" borderColor="yellow" paddingX={1} marginY={1}>
      <Text bold color="yellow">⚠️  Permission Request</Text>
      <Text>💖 Simp Chong wants to run: <Text bold color="#FF0a54">{tool}</Text></Text>
      <Box marginY={1}>
        <Text color="gray">{args}</Text>
      </Box>
      <SelectInput items={items} onSelect={handleSelect} />
    </Box>
  );
};
