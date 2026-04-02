#!/usr/bin/env node
import React from 'react';
import { render } from 'ink';
import { LLMEngine } from './engine/llm.ts';
import { App } from './ui/App.tsx';
import { validateConfig } from './config.ts';

async function main() {
  if (!validateConfig()) {
    process.exit(1);
  }

  const engine = new LLMEngine();
  
  // Clear the screen before starting
  console.clear();
  
  // Render the Ink App
  const { waitUntilExit } = render(React.createElement(App, { engine }));
  
  try {
    await waitUntilExit();
  } catch (err) {
    console.error('Fatal error:', err);
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
