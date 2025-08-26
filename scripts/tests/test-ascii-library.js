#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');

async function test() {
  console.log('\n🏁 BUMBA ASCII Component Library Test');
  console.log('=====================================\n');
  
  const { getInstance } = require('./src/core/notion/bumba-component-library-ascii');
  const library = getInstance();
  
  // Create demo dashboard with pure ASCII components
  const html = library.createDashboard();
  
  const dir = path.join(process.cwd(), '.bumba', 'notion-simulation', 'dashboards');
  await fs.mkdir(dir, { recursive: true });
  
  const file = path.join(dir, `ascii-library-${Date.now()}.html`);
  await fs.writeFile(file, html);
  
  console.log('🏁 ASCII Component Library Dashboard Created');
  console.log('📁 ' + file);
  
  console.log('\n📊 Pure ASCII Components:');
  console.log('  • Box-drawing characters for borders');
  console.log('  • Dots and colons for line charts');
  console.log('  • Vertical bars for sparklines');  
  console.log('  • Horizontal lines for bar charts');
  console.log('  • Pipe characters for gauges');
  console.log('  • Monospace ASCII tables');
  console.log('  • ASCII art support');
  
  console.log('\n🔴 Sampler-Style Features:');
  console.log('  • Clean terminal aesthetic');
  console.log('  • Proper character alignment');
  console.log('  • Color-coded data series');
  console.log('  • Grid lines in charts');
  console.log('  • Exact sampler layouts');
  
  console.log('\nOpening in browser...');
  exec(`open "${file}"`);
}

test().catch(console.error);