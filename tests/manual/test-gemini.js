#!/usr/bin/env node

/**
 * Test BUMBA with Gemini API
 */

const { ParallelAgentSystem } = require('./src/core/agents/parallel-agent-system');

async function testGemini() {
  console.log('Testing BUMBA with Gemini API...\n');
  
  // Check if API key is set
  if (!process.env.GOOGLE_API_KEY) {
    console.log('🔴 GOOGLE_API_KEY not set!');
    console.log('\nTo get a FREE Gemini API key:');
    console.log('1. Go to https://makersuite.google.com/app/apikey');
    console.log('2. Click "Create API Key"');
    console.log('3. Run: export GOOGLE_API_KEY=your-key-here\n');
    return;
  }
  
  console.log('🏁 Gemini API key detected\n');
  
  // Create parallel system
  const system = new ParallelAgentSystem({
    googleKey: process.env.GOOGLE_API_KEY
  });
  
  // Test tasks
  const tasks = [
    { agent: 'architect', prompt: 'Design a simple todo app', model: 'gemini' },
    { agent: 'developer', prompt: 'Write code for a todo app', model: 'gemini' }
  ];
  
  try {
    console.log('Executing parallel tasks with Gemini...\n');
    const results = await system.executeParallel(tasks);
    
    console.log('Results:');
    results.results.forEach(r => {
      console.log(`\n${r.agent}:`);
      console.log(r.success ? r.result.substring(0, 200) + '...' : 'Failed');
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testGemini();