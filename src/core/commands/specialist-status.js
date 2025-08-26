#!/usr/bin/env node

/**
 * BUMBA Specialist Status Command
 * Shows which specialists are production-ready
 * 
 * Usage: /bumba:specialists --verified
 */

const chalk = require('chalk');
const { getMaturityManager } = require('../specialists/specialist-maturity');
const fs = require('fs');
const path = require('path');

class SpecialistStatusCommand {
  constructor() {
    this.maturityManager = getMaturityManager();
  }
  
  /**
   * Execute the command
   */
  async execute(args = {}) {
    const { verified, export: exportManifest, detailed } = args;
    
    if (exportManifest) {
      return this.exportManifest();
    }
    
    if (verified) {
      return this.showVerifiedOnly();
    }
    
    if (detailed) {
      return this.showDetailed();
    }
    
    // Default: show overview
    return this.showOverview();
  }
  
  /**
   * Show overview of all specialists
   */
  showOverview() {
    console.log(chalk.cyan.bold('\n╔══════════════════════════════════════════════════════╗'));
    console.log(chalk.cyan.bold('║           BUMBA SPECIALIST STATUS                    ║'));
    console.log(chalk.cyan.bold('╚══════════════════════════════════════════════════════╝\n'));
    
    const output = this.maturityManager.formatForCLI();
    console.log(output);
    
    console.log(chalk.gray('\nTips:'));
    console.log(chalk.gray('  • Use --verified to see only production-ready specialists'));
    console.log(chalk.gray('  • Use --detailed for full capability breakdown'));
    console.log(chalk.gray('  • Use --export to generate verified-specialists.json\n'));
    
    return { success: true };
  }
  
  /**
   * Show only verified specialists
   */
  showVerifiedOnly() {
    console.log(chalk.green.bold('\n✅ VERIFIED SPECIALISTS (Production Ready)\n'));
    
    const verified = this.maturityManager.getVerifiedSpecialists();
    
    if (verified.length === 0) {
      console.log(chalk.yellow('No verified specialists found.'));
      return { success: false };
    }
    
    verified.forEach(spec => {
      console.log(chalk.green(`${spec.maturity.icon} ${spec.name}`));
      console.log(chalk.gray(`   ${spec.notes}`));
      
      if (spec.capabilities.verified.length > 0) {
        console.log(chalk.gray(`   Verified: ${spec.capabilities.verified.join(', ')}`));
      }
      console.log();
    });
    
    console.log(chalk.green(`\nTotal: ${verified.length} production-ready specialists\n`));
    
    return { 
      success: true, 
      verified: verified.map(s => s.id) 
    };
  }
  
  /**
   * Show detailed capability breakdown
   */
  showDetailed() {
    console.log(chalk.cyan.bold('\n📋 DETAILED SPECIALIST ANALYSIS\n'));
    
    const allData = require('../specialists/specialist-maturity').SPECIALIST_MATURITY;
    
    Object.entries(allData).forEach(([id, data]) => {
      const m = data.maturity;
      console.log(`${m.icon} ${chalk.bold(id)}`);
      console.log(`   Maturity: ${m.name} (Level ${m.level})`);
      console.log(`   Status: ${data.notes}`);
      
      if (data.lastVerified) {
        console.log(`   Last Verified: ${data.lastVerified}`);
      }
      
      if (data.capabilities.claimed.length > 0) {
        console.log(`   Claimed: ${data.capabilities.claimed.join(', ')}`);
      }
      
      if (data.capabilities.verified.length > 0) {
        console.log(chalk.green(`   ✓ Verified: ${data.capabilities.verified.join(', ')}`));
      } else if (data.capabilities.claimed.length > 0) {
        console.log(chalk.yellow(`   ⚠ Unverified capabilities`));
      }
      
      console.log();
    });
    
    return { success: true };
  }
  
  /**
   * Export verified specialists manifest
   */
  exportManifest() {
    const manifest = this.maturityManager.exportVerifiedManifest();
    const outputPath = path.join(process.cwd(), 'verified-specialists.json');
    
    fs.writeFileSync(
      outputPath,
      JSON.stringify(manifest, null, 2),
      'utf8'
    );
    
    console.log(chalk.green(`\n✅ Exported verified specialists to: ${outputPath}\n`));
    console.log('Manifest includes:');
    console.log(`  • ${manifest.specialists.length} verified specialists`);
    console.log(`  • Maturity levels and verification dates`);
    console.log(`  • Capability verification status\n`);
    
    return { 
      success: true, 
      path: outputPath,
      specialists: manifest.specialists.length
    };
  }
}

// Export for use in command router
module.exports = SpecialistStatusCommand;

// Allow direct execution
if (require.main === module) {
  const command = new SpecialistStatusCommand();
  
  const args = process.argv.slice(2);
  const options = {
    verified: args.includes('--verified'),
    export: args.includes('--export'),
    detailed: args.includes('--detailed')
  };
  
  command.execute(options).then(result => {
    process.exit(result.success ? 0 : 1);
  });
}