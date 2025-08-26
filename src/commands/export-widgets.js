#!/usr/bin/env node

/**
 * BUMBA Widget Export Command
 * Export sampler-style widgets for Notion embedding
 */

const { BumbaWidgets } = require('../core/widgets');
const path = require('path');
const chalk = require('chalk');

async function exportWidgets(outputDir = './bumba-widgets') {
  console.log(chalk.green('\n🏁 BUMBA Widget Export\n'));
  
  try {
    const widgets = new BumbaWidgets();
    const absolutePath = path.resolve(outputDir);
    
    console.log(chalk.yellow('📦 Exporting widgets to:'), absolutePath);
    
    const files = await widgets.exportWidgets(absolutePath);
    
    console.log(chalk.green('\n🏁 Widgets exported successfully:\n'));
    
    files.forEach(file => {
      const filename = path.basename(file);
      console.log(`  • ${filename}`);
    });
    
    console.log(chalk.cyan('\n📌 How to use in Notion:'));
    console.log('  1. Upload HTML files to HTTPS server (GitHub Pages, Vercel, etc.)');
    console.log('  2. In Notion, type /embed');
    console.log('  3. Paste the widget URL');
    console.log('  4. Widget will auto-resize to column width\n');
    
    console.log(chalk.gray('💡 Tip: Use services like notion-widgets.com for easy hosting\n'));
    
    return { success: true, files };
  } catch (error) {
    console.error(chalk.red('🔴 Export failed:'), error.message);
    return { success: false, error };
  }
}

// If run directly
if (require.main === module) {
  const outputDir = process.argv[2] || './bumba-widgets';
  exportWidgets(outputDir).then(result => {
    process.exit(result.success ? 0 : 1);
  });
}

module.exports = { exportWidgets };