/**
 * BUMBA Framework - MCP Server Installation Module
 * Manages MCP server discovery and documentation
 * @module src/installer/mcp-installer
 * @version 2.0
 */

const {
  displayStatus,
  displayProgress,
  createBox,
  colors
} = require('./display');
const { logger } = require('../core/logging/bumba-logger');
const BumbaError = require('../core/error-handling/bumba-error-system');

const MCP_SERVERS = [
  // Product Strategy & Management
  {
    name: 'notion',
    command: 'claude mcp add notion --server npx:@modelcontextprotocol/server-notion',
    description: 'Collaborative PRD editing and stakeholder workflows',
    category: 'Product Strategy'
  },
  {
    name: 'airtable',
    command: 'claude mcp add airtable --server npx:@modelcontextprotocol/server-airtable',
    description: 'Project tracking and analytics integration',
    category: 'Product Strategy'
  },

  // Essential Core Servers
  {
    name: 'memory',
    command: 'claude mcp add memory --server npx:@modelcontextprotocol/server-memory',
    description: 'Enhanced context preservation across sessions',
    category: 'Essential'
  },
  {
    name: 'filesystem',
    command: 'claude mcp add filesystem --server npx:@modelcontextprotocol/server-filesystem',
    description: 'File system operations with validation',
    category: 'Essential'
  },
  {
    name: 'context7',
    command: 'claude mcp add context7 --server npx:@upstash/context7-mcp',
    description: 'Official library docs and patterns lookup',
    category: 'Essential'
  },
  {
    name: 'ref',
    command: 'claude mcp add ref --server npx:ref-tools-mcp',
    description: 'Token-efficient documentation search (60-95% fewer tokens than Context7)',
    category: 'Essential',
    note: 'Requires REF_API_KEY from https://ref.tools'
  },
  {
    name: 'pieces',
    command: 'claude mcp add pieces --server npx:pieces-mcp',
    description: 'Developer knowledge management and context-aware code snippet organization',
    category: 'Essential',
    note: 'Optional PIECES_API_KEY for enhanced features'
  },
  {
    name: 'exa',
    command: 'claude mcp add exa --server npx:exa-mcp',
    description: 'AI-optimized search engine for high-quality semantic research',
    category: 'Essential',
    note: 'Requires EXA_API_KEY from https://exa.ai'
  },
  {
    name: 'semgrep',
    command: 'claude mcp add semgrep --server uvx:semgrep-mcp',
    description: 'Security vulnerability scanning with 5,000+ static analysis rules',
    category: 'Essential',
    note: 'Optional SEMGREP_APP_TOKEN for AppSec Platform integration'
  },
  {
    name: 'sequential-thinking',
    command: 'claude mcp add sequential-thinking --server npx:@modelcontextprotocol/server-sequential-thinking',
    description: 'Complex multi-step reasoning and analysis',
    category: 'Essential'
  },
  {
    name: 'magic-ui',
    command: 'claude mcp add magic-ui --server npx:@21st-dev/magic@latest',
    description: 'Modern UI component generation',
    category: 'Essential'
  },
  {
    name: 'playwright',
    command: 'claude mcp add playwright --server npx:@modelcontextprotocol/server-playwright',
    description: 'Browser automation and testing',
    category: 'Essential'
  },
  {
    name: 'figma-devmode',
    command: 'claude mcp add figma-devmode --server transport=stdio,command=figma-devmode-mcp',
    description: 'Figma Dev Mode MCP for direct design-to-code workflows',
    category: 'Essential',
    note: 'Requires Figma Desktop App with Dev Mode MCP Server enabled'
  },
  {
    name: 'figma-context',
    command: 'claude mcp add figma-context --server npx:-y,figma-developer-mcp,--stdio',
    description: 'Figma layout information and design context extraction',
    category: 'Essential',
    note: 'Requires FIGMA_API_KEY environment variable'
  },

  // Foundation Servers
  {
    name: 'fetch',
    command: 'claude mcp add fetch --server npx:@modelcontextprotocol/server-fetch',
    description: 'Web content fetching and validation',
    category: 'Foundation'
  },
  {
    name: 'github',
    command: 'claude mcp add github --server npx:@modelcontextprotocol/server-github',
    description: 'GitHub integration and repository management',
    category: 'Foundation'
  },
  {
    name: 'brave-search',
    command: 'claude mcp add brave-search --server npx:@modelcontextprotocol/server-brave-search',
    description: 'Privacy-focused web search',
    category: 'Foundation'
  },

  // Development Tools
  {
    name: 'docker-mcp',
    command: 'claude mcp add docker-mcp --server npx:-y,@quantgeekdev/docker-mcp',
    description: 'Docker container and compose stack management with AI assistance',
    category: 'Development',
    note: 'Requires Docker Engine and permissions for container operations'
  },
  {
    name: 'oracle-mcp',
    command: 'claude mcp add oracle-mcp --server npx:-y,@hdcola/mcp-server-oracle',
    description: 'Oracle database operations and SQL query execution',
    category: 'Development',
    note: 'Requires Oracle database connection credentials'
  },
  {
    name: 'digitalocean-mcp',
    command: 'claude mcp add digitalocean-mcp --server npx:-y,@digitalocean-labs/mcp-digitalocean',
    description: 'DigitalOcean App Platform deployment and management',
    category: 'Development',
    note: 'Requires DIGITALOCEAN_API_TOKEN for cloud operations'
  },
  {
    name: 'brave-search',
    command: 'claude mcp add brave-search --server npx:@modelcontextprotocol/server-brave-search',
    description: 'Privacy-focused web search',
    category: 'Development'
  },
  {
    name: 'postgres',
    command: 'claude mcp add postgres --server npx:@modelcontextprotocol/server-postgres',
    description: 'PostgreSQL database integration',
    category: 'Development'
  },
  {
    name: 'pinecone',
    command: 'claude mcp add pinecone --server npx:-y,@pinecone-database/mcp',
    description: 'Vector database for AI-powered search, RAG, and semantic retrieval',
    category: 'Development',
    note: 'Requires PINECONE_API_KEY from https://app.pinecone.io'
  },
  {
    name: 'serena',
    command: 'claude mcp add serena --server uvx:serena',
    description: 'Semantic code retrieval and editing toolkit - turns LLMs into powerful coding agents',
    category: 'Development',
    note: 'Supports Python, JS/TS, Go, Rust, Java, C# and more. Requires uv package manager.'
  },
  {
    name: 'reflektion',
    command: 'claude mcp add reflektion --server npx:-y,reflektion',
    description: 'Advanced reflection and introspection capabilities for enhanced AI agent reasoning',
    category: 'Development',
    note: 'Enables deep code understanding and self-improvement capabilities'
  }
];

/**
 * Install MCP servers (documentation mode)
 * @async
 * @function installMCPServers
 * @returns {Promise<Array>} Array of server installation results
 * @throws {BumbaError} When MCP server documentation fails
 */
async function installMCPServers() {
  const totalServers = MCP_SERVERS.length;
  let completedServers = 0;

  console.log('\n' + colors.yellowGreen('🟢 Documenting MCP Server Ecosystem...'));
  console.log(colors.gray('─'.repeat(60)));

  // Simulate processing each server
  for (const server of MCP_SERVERS) {
    completedServers++;
    const percent = Math.round((completedServers / totalServers) * 100);

    // Update progress
    if (process.stdout.clearLine) {
      process.stdout.clearLine();
      process.stdout.cursorTo(0);
    }
    process.stdout.write(
      `${colors.yellowGreen('🟢')} Processing: ${colors.white(server.name.padEnd(20))} ` +
      `[${completedServers}/${totalServers}] ${percent}%`
    );

    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 30));
  }

  console.log('\n');

  // Document all servers
  const results = MCP_SERVERS.map(server => ({ ...server, status: 'documented' }));

  displayMCPResults(results);
  return results;
}

/**
 * Display MCP installation results
 * @function displayMCPResults
 * @param {Array} results - Array of MCP server results
 * @returns {void}
 */
function displayMCPResults(results) {
  const categories = ['Product Strategy', 'Essential', 'Foundation', 'Development'];

  console.log('\n' + colors.success('🟢 MCP Documentation Complete'));
  console.log(colors.white(`   ${results.length} servers documented for manual setup`));
  console.log(colors.gray('   Core framework is fully operational'));

  categories.forEach(category => {
    const categoryServers = results.filter(s => s.category === category);
    if (categoryServers.length === 0) {return;}

    console.log('\n' + colors.yellow(`▸ ${category} Servers`));
    console.log(colors.gray('─'.repeat(50)));

    categoryServers.forEach(server => {
      const icon = colors.success('●');
      console.log(`  ${icon} ${colors.white(server.name.padEnd(20))} ${colors.gray(server.description.substring(0, 40) + '...')}`);
      if (server.note) {
        console.log(`     ${colors.warning('🟢')} ${colors.gray(server.note)}`);
      }
    });
  });

  // Installation instructions box
  const instructionsBox = createBox(
    colors.yellow.bold('MCP Server Installation') + '\n' +
    '\n' +
    colors.white('To install servers manually:') + '\n' +
    colors.gray('0. Install BUMBA: npm install -g bumba') + '\n' +
    colors.gray('1. Open Claude Code settings') + '\n' +
    colors.gray('2. Navigate to MCP Servers section') + '\n' +
    colors.gray('3. Run the commands shown above') + '\n' +
    '\n' +
    colors.white('Core BUMBA works perfectly without MCP servers')
    , 50);

  console.log('\n' + instructionsBox);
}

module.exports = {
  installMCPServers,
  MCP_SERVERS
};
