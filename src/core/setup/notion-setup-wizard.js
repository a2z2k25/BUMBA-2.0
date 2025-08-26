/**
 * BUMBA Notion Setup Wizard
 * Interactive configuration tool for Notion integration
 */

const readline = require('readline');
const fs = require('fs').promises;
const path = require('path');
const { logger } = require('../logging/bumba-logger');

class NotionSetupWizard {
  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    this.envPath = path.join(process.cwd(), '.env');
    this.config = {};
  }

  /**
   * Main wizard entry point
   */
  async run() {
    console.log('\n' + '='.repeat(60));
    console.log('🚀 BUMBA Notion Integration Setup Wizard');
    console.log('='.repeat(60) + '\n');
    
    try {
      // Check existing configuration
      const existing = await this.checkExistingConfig();
      if (existing.isComplete) {
        const overwrite = await this.prompt(
          '\n⚠️  Notion configuration already exists.\n' +
          'Do you want to reconfigure? (y/n): '
        );
        
        if (overwrite.toLowerCase() !== 'y') {
          console.log('\n✅ Keeping existing configuration.');
          this.rl.close();
          return;
        }
      }
      
      // Choose setup mode
      const mode = await this.selectMode();
      
      // Gather configuration based on mode
      switch (mode) {
        case '1':
          await this.setupMCPMode();
          break;
        
        case '2':
          await this.setupAPIMode();
          break;
        
        case '3':
          await this.setupLocalMode();
          break;
        
        default:
          console.log('\n❌ Invalid selection. Exiting.');
          this.rl.close();
          return;
      }
      
      // Save configuration
      await this.saveConfiguration();
      
      // Test connection
      const testResult = await this.testConnection();
      
      if (testResult.success) {
        console.log(`\n✅ ${testResult.message}`);
        
        // Offer to create sample dashboard
        const createSample = await this.prompt(
          '\nWould you like to create a sample dashboard? (y/n): '
        );
        
        if (createSample.toLowerCase() === 'y') {
          await this.createSampleDashboard();
        }
      } else {
        console.log(`\n⚠️  ${testResult.message}`);
        console.log('Please check your configuration and try again.');
      }
      
      console.log('\n' + '='.repeat(60));
      console.log('✅ Setup Complete!');
      console.log('='.repeat(60) + '\n');
      
      // Show next steps
      this.showNextSteps();
      
    } catch (error) {
      console.error('\n❌ Setup failed:', error.message);
    } finally {
      this.rl.close();
    }
  }

  /**
   * Check existing configuration
   */
  async checkExistingConfig() {
    try {
      const envContent = await fs.readFile(this.envPath, 'utf8');
      
      const hasNotionConfig = 
        envContent.includes('NOTION_API_KEY') ||
        envContent.includes('NOTION_MCP_ENABLED');
      
      return { 
        isComplete: hasNotionConfig,
        content: envContent 
      };
    } catch (error) {
      // .env doesn't exist
      return { isComplete: false, content: '' };
    }
  }

  /**
   * Select setup mode
   */
  async selectMode() {
    console.log('Choose your Notion integration mode:\n');
    console.log('1. Notion MCP Server (Recommended for Claude Desktop)');
    console.log('   - Best integration with Claude');
    console.log('   - Real-time sync capabilities');
    console.log('   - Advanced features\n');
    
    console.log('2. Direct Notion API');
    console.log('   - Works anywhere');
    console.log('   - Simple setup');
    console.log('   - No additional software needed\n');
    
    console.log('3. Local Simulation Only');
    console.log('   - No Notion account required');
    console.log('   - For testing and development');
    console.log('   - Data stored locally\n');
    
    return await this.prompt('Select mode (1-3): ');
  }

  /**
   * Setup MCP mode
   */
  async setupMCPMode() {
    console.log('\n' + '-'.repeat(40));
    console.log('Setting up Notion MCP Server Integration');
    console.log('-'.repeat(40) + '\n');
    
    // Check if MCP server is already running
    const { getInstance: getDetector } = require('../mcp/mcp-detector');
    const detector = getDetector();
    const detected = await detector.detect();
    
    if (detected.available) {
      console.log(`✅ MCP server detected via ${detected.method}`);
      this.config.NOTION_MCP_ENABLED = 'true';
      
      if (detected.url) {
        this.config.NOTION_MCP_SERVER_URL = detected.url;
      }
    } else {
      console.log('ℹ️  MCP server not detected. Let\'s configure it.\n');
      
      const serverUrl = await this.prompt(
        'Enter MCP server URL (default: http://localhost:3000): '
      );
      
      this.config.NOTION_MCP_ENABLED = 'true';
      this.config.NOTION_MCP_SERVER_URL = serverUrl || 'http://localhost:3000';
      
      console.log('\n📝 You\'ll need to start the MCP server separately.');
      console.log('   Install: npm install -g @modelcontextprotocol/server-notion');
      console.log('   Run: npx @modelcontextprotocol/server-notion');
    }
    
    // Still need API key for MCP server
    console.log('\n📝 MCP server needs your Notion API key.');
    
    const apiKey = await this.promptSecret('Enter your Notion API key: ');
    this.config.NOTION_API_KEY = apiKey;
    
    const databaseId = await this.prompt('Enter your Notion database ID: ');
    this.config.NOTION_DATABASE_ID = databaseId;
    
    const workspaceId = await this.prompt('Enter your Notion workspace ID (optional): ');
    if (workspaceId) {
      this.config.NOTION_WORKSPACE_ID = workspaceId;
    }
  }

  /**
   * Setup API mode
   */
  async setupAPIMode() {
    console.log('\n' + '-'.repeat(40));
    console.log('Setting up Direct Notion API Integration');
    console.log('-'.repeat(40) + '\n');
    
    console.log('📝 You\'ll need:');
    console.log('   1. Notion Integration Token');
    console.log('   2. Database ID');
    console.log('   3. Workspace ID (optional)\n');
    
    console.log('Get your API key from: https://www.notion.so/my-integrations\n');
    
    const apiKey = await this.promptSecret('Enter your Notion API key: ');
    this.config.NOTION_API_KEY = apiKey;
    
    const databaseId = await this.prompt('Enter your Notion database ID: ');
    this.config.NOTION_DATABASE_ID = databaseId;
    
    const workspaceId = await this.prompt('Enter your Notion workspace ID (optional): ');
    if (workspaceId) {
      this.config.NOTION_WORKSPACE_ID = workspaceId;
    }
    
    this.config.NOTION_ENABLED = 'true';
    this.config.NOTION_MCP_ENABLED = 'false';
  }

  /**
   * Setup local simulation mode
   */
  async setupLocalMode() {
    console.log('\n' + '-'.repeat(40));
    console.log('Setting up Local Simulation Mode');
    console.log('-'.repeat(40) + '\n');
    
    console.log('✅ No Notion account required!');
    console.log('   Data will be stored locally in .bumba/notion-simulation/\n');
    
    this.config.NOTION_ENABLED = 'false';
    this.config.NOTION_MCP_ENABLED = 'false';
    
    const autoPublish = await this.prompt(
      'Enable auto-publishing to local storage? (y/n): '
    );
    
    if (autoPublish.toLowerCase() === 'y') {
      this.config.NOTION_AUTO_PUBLISH = 'true';
      
      const interval = await this.prompt(
        'Publish interval in minutes (default: 60): '
      );
      
      this.config.NOTION_PUBLISH_INTERVAL = (parseInt(interval) || 60) * 60000;
    }
  }

  /**
   * Save configuration to .env
   */
  async saveConfiguration() {
    console.log('\n📝 Saving configuration...');
    
    // Read existing .env if it exists
    let envContent = '';
    try {
      envContent = await fs.readFile(this.envPath, 'utf8');
    } catch (error) {
      // File doesn't exist, will create new one
    }
    
    // Remove old Notion configuration
    const lines = envContent.split('\n');
    const filteredLines = lines.filter(line => 
      !line.startsWith('NOTION_') && 
      !line.includes('# Notion')
    );
    
    // Add new configuration
    const notionConfig = [
      '',
      '# Notion Integration Configuration',
      '# Generated by BUMBA Setup Wizard',
      ...Object.entries(this.config).map(([key, value]) => `${key}=${value}`),
      ''
    ].join('\n');
    
    // Combine and save
    const newContent = filteredLines.join('\n') + notionConfig;
    await fs.writeFile(this.envPath, newContent);
    
    console.log('✅ Configuration saved to .env');
  }

  /**
   * Test the connection
   */
  async testConnection() {
    console.log('\n🧪 Testing connection...');
    
    try {
      // Load the new configuration
      require('dotenv').config({ override: true });
      
      // Test using the bridge
      const { NotionMCPBridge } = require('../mcp/notion-mcp-bridge');
      const bridge = new NotionMCPBridge();
      
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Connection timeout'));
        }, 5000);
        
        bridge.once('ready', (status) => {
          clearTimeout(timeout);
          resolve(status);
        });
      });
      
      const status = bridge.getStatus();
      
      if (status.mode === 'local') {
        return { 
          success: true, 
          message: 'Local simulation mode activated' 
        };
      } else if (status.mode === 'mcp') {
        return { 
          success: true, 
          message: 'Connected via MCP server' 
        };
      } else if (status.mode === 'api') {
        return { 
          success: true, 
          message: 'Connected via Notion API' 
        };
      } else {
        return { 
          success: false, 
          message: 'Connection failed' 
        };
      }
    } catch (error) {
      return { 
        success: false, 
        message: `Connection failed: ${error.message}` 
      };
    }
  }

  /**
   * Create sample dashboard
   */
  async createSampleDashboard() {
    console.log('\n📊 Creating sample dashboard...');
    
    try {
      const { getNotionPublisher } = require('../dashboard/notion-publisher');
      const publisher = getNotionPublisher();
      
      await publisher.initialize();
      
      // Create sample metrics
      const sampleMetrics = {
        system: {
          uptime: { value: 86400, type: 'counter', unit: 'seconds' },
          memory: { value: 75, type: 'percentage', unit: '%' },
          cpu: { value: 45, type: 'percentage', unit: '%' }
        },
        performance: {
          responseTime: { value: 125, type: 'gauge', unit: 'ms' },
          throughput: { value: 1000, type: 'counter', unit: 'req/s' }
        }
      };
      
      await publisher.publish(sampleMetrics);
      
      console.log('✅ Sample dashboard created!');
    } catch (error) {
      console.log(`⚠️  Could not create sample dashboard: ${error.message}`);
    }
  }

  /**
   * Show next steps
   */
  showNextSteps() {
    console.log('Next Steps:');
    console.log('-----------');
    console.log('1. Test your connection:');
    console.log('   /bumba:notion:status\n');
    
    console.log('2. View the integration guide:');
    console.log('   docs/reports/NOTION_INTEGRATION_GUIDE.md\n');
    
    console.log('3. Start using Notion features:');
    console.log('   /bumba:notion:sync');
    console.log('   /bumba:notion:leaderboard');
    console.log('   /bumba:notion:score\n');
    
    console.log('For help: /bumba:help notion');
  }

  /**
   * Prompt for user input
   */
  prompt(question) {
    return new Promise((resolve) => {
      this.rl.question(question, resolve);
    });
  }

  /**
   * Prompt for secret input (hides characters)
   */
  async promptSecret(question) {
    // Note: In production, use a proper password input library
    // For now, using regular prompt with warning
    console.log('⚠️  Input will be visible (consider using a password manager)');
    return await this.prompt(question);
  }
}

/**
 * Run the wizard
 */
async function runSetupWizard() {
  const wizard = new NotionSetupWizard();
  await wizard.run();
}

// Allow running directly
if (require.main === module) {
  runSetupWizard().catch(console.error);
}

module.exports = {
  NotionSetupWizard,
  runSetupWizard
};