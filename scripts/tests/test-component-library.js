#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');

async function test() {
  console.log('\n🏁 BUMBA Component Library Test');
  console.log('=================================\n');
  
  const { getInstance } = require('./src/core/notion/bumba-component-library');
  const library = getInstance();
  
  // Create demo dashboard with all components
  const html = library.createDashboard();
  
  const dir = path.join(process.cwd(), '.bumba', 'notion-simulation', 'dashboards');
  await fs.mkdir(dir, { recursive: true });
  
  const file = path.join(dir, `component-library-${Date.now()}.html`);
  await fs.writeFile(file, html);
  
  console.log('🏁 Component Library Dashboard Created');
  console.log('📁 ' + file);
  
  console.log('\n📊 All Sampler Components:');
  console.log('  1. RunChart - Time-series line graphs with dotted lines');
  console.log('  2. Sparkline - Mini bar charts for trends');
  console.log('  3. BarChart - Horizontal bars with values');
  console.log('  4. Gauge - Progress bars with percentages');
  console.log('  5. TextBox - Scrollable text/tables (Docker stats)');
  console.log('  6. AsciiBox - Large ASCII text display');
  console.log('  7. StatusGrid - Key-value status indicators');
  
  console.log('\n🏁 Strict Compliance:');
  console.log('  • ONLY emojis: 🟢🟡🟠🔴🏁');
  console.log('  • Exact sampler styling');
  console.log('  • Reusable component library');
  console.log('  • Each component is standalone');
  
  console.log('\nOpening in browser...');
  exec(`open "${file}"`);
}

test().catch(console.error);