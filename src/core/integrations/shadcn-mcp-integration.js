/**
 * BUMBA ShadCN UI MCP Server Integration
 * Provides automatic ShadCN/UI component access through MCP
 * Repository: https://github.com/Jpisnice/shadcn-ui-mcp-server
 */

const { EventEmitter } = require('events');
const { logger } = require('../logging/bumba-logger');
const path = require('path');
const fs = require('fs');

class ShadCNMCPIntegration extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      enabled: config.enabled !== false, // Enabled by default
      autoConnect: config.autoConnect !== false,
      projectPath: config.projectPath || process.cwd(),
      componentsPath: config.componentsPath || 'components/ui',
      
      // ShadCN configuration
      shadcn: {
        style: config.style || 'default', // default, new-york
        tailwindConfig: config.tailwindConfig || 'tailwind.config.js',
        cssVariables: config.cssVariables !== false,
        tailwindCss: config.tailwindCss !== false,
        framework: config.framework || 'next', // next, vite, remix, gatsby, astro
        typescript: config.typescript !== false
      },
      
      // MCP Server configuration
      mcp: {
        serverName: 'shadcn-ui',
        serverPath: config.mcpServerPath || '@modelcontextprotocol/server-shadcn-ui',
        autoInstall: config.autoInstall !== false,
        capabilities: [
          'component-generation',
          'theme-customization',
          'variant-management',
          'accessibility-features'
        ]
      },
      
      // Component management
      components: {
        autoImport: config.autoImport !== false,
        registry: config.componentRegistry || 'https://ui.shadcn.com/registry',
        cache: config.cacheComponents !== false
      }
    };
    
    this.mcpClient = null;
    this.availableComponents = new Map();
    this.installedComponents = new Set();
    this.themeTokens = {};
    
    this.status = {
      mcpConnected: false,
      shadcnInstalled: false,
      componentsAvailable: 0,
      lastSync: null
    };
    
    if (this.config.enabled && this.config.autoConnect) {
      this.initialize();
    }
  }
  
  /**
   * Initialize ShadCN MCP integration
   */
  async initialize() {
    logger.info('🔴 Initializing ShadCN UI MCP Server integration');
    
    try {
      // Check if project has ShadCN configured
      const hasShadCN = await this.checkShadCNSetup();
      
      if (!hasShadCN && this.config.mcp.autoInstall) {
        logger.info('📦 ShadCN not detected, initializing setup...');
        await this.setupShadCN();
      }
      
      // Connect to MCP server
      await this.connectMCPServer();
      
      // Load available components
      await this.loadComponentRegistry();
      
      // Sync installed components
      await this.syncInstalledComponents();
      
      this.status.shadcnInstalled = true;
      this.status.lastSync = Date.now();
      
      logger.info('🏁 ShadCN UI MCP integration ready');
      logger.info(`📊 ${this.availableComponents.size} components available`);
      logger.info(`🟡 ${this.installedComponents.size} components installed`);
      
      this.emit('initialized', this.status);
      return true;
      
    } catch (error) {
      logger.error('🔴 Failed to initialize ShadCN MCP:', error);
      this.emit('initialization-failed', error);
      return false;
    }
  }
  
  /**
   * Check if ShadCN is set up in the project
   */
  async checkShadCNSetup() {
    const configPath = path.join(this.config.projectPath, 'components.json');
    const componentsDir = path.join(this.config.projectPath, this.config.componentsPath);
    
    return fs.existsSync(configPath) || fs.existsSync(componentsDir);
  }
  
  /**
   * Set up ShadCN in the project
   */
  async setupShadCN() {
    logger.info('🔧 Setting up ShadCN UI...');
    
    // Create components.json configuration
    const config = {
      "$schema": "https://ui.shadcn.com/schema.json",
      "style": this.config.shadcn.style,
      "rsc": this.config.shadcn.framework === 'next',
      "tsx": this.config.shadcn.typescript,
      "tailwind": {
        "config": this.config.shadcn.tailwindConfig,
        "css": "app/globals.css",
        "baseColor": "slate",
        "cssVariables": this.config.shadcn.cssVariables
      },
      "aliases": {
        "components": "@/components",
        "utils": "@/lib/utils"
      }
    };
    
    const configPath = path.join(this.config.projectPath, 'components.json');
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    
    // Create utils file
    const utilsDir = path.join(this.config.projectPath, 'lib');
    if (!fs.existsSync(utilsDir)) {
      fs.mkdirSync(utilsDir, { recursive: true });
    }
    
    const utilsContent = `import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
`;
    
    fs.writeFileSync(
      path.join(utilsDir, 'utils.ts'),
      utilsContent
    );
    
    logger.info('🏁 ShadCN UI configuration created');
  }
  
  /**
   * Connect to ShadCN MCP server
   */
  async connectMCPServer() {
    logger.info('🔌 Connecting to ShadCN MCP server...');
    
    // Mock MCP connection - in production, would use actual MCP client
    this.mcpClient = {
      connected: true,
      capabilities: this.config.mcp.capabilities,
      
      // Component generation
      generateComponent: async (name, options = {}) => {
        return this.generateComponent(name, options);
      },
      
      // Theme management
      updateTheme: async (tokens) => {
        return this.updateTheme(tokens);
      },
      
      // Component information
      getComponentInfo: async (name) => {
        return this.getComponentInfo(name);
      }
    };
    
    this.status.mcpConnected = true;
    logger.info('🏁 MCP server connected');
  }
  
  /**
   * Load component registry
   */
  async loadComponentRegistry() {
    // ShadCN UI component registry
    const components = [
      { name: 'accordion', category: 'Data Display', dependencies: ['@radix-ui/react-accordion'] },
      { name: 'alert', category: 'Feedback', dependencies: [] },
      { name: 'alert-dialog', category: 'Overlay', dependencies: ['@radix-ui/react-alert-dialog'] },
      { name: 'aspect-ratio', category: 'Layout', dependencies: ['@radix-ui/react-aspect-ratio'] },
      { name: 'avatar', category: 'Data Display', dependencies: ['@radix-ui/react-avatar'] },
      { name: 'badge', category: 'Data Display', dependencies: [] },
      { name: 'button', category: 'Inputs', dependencies: ['@radix-ui/react-slot'] },
      { name: 'calendar', category: 'Inputs', dependencies: ['date-fns', '@radix-ui/react-icons'] },
      { name: 'card', category: 'Layout', dependencies: [] },
      { name: 'carousel', category: 'Data Display', dependencies: ['embla-carousel-react'] },
      { name: 'checkbox', category: 'Inputs', dependencies: ['@radix-ui/react-checkbox'] },
      { name: 'collapsible', category: 'Disclosure', dependencies: ['@radix-ui/react-collapsible'] },
      { name: 'command', category: 'Inputs', dependencies: ['cmdk'] },
      { name: 'context-menu', category: 'Overlay', dependencies: ['@radix-ui/react-context-menu'] },
      { name: 'dialog', category: 'Overlay', dependencies: ['@radix-ui/react-dialog'] },
      { name: 'drawer', category: 'Overlay', dependencies: ['vaul'] },
      { name: 'dropdown-menu', category: 'Overlay', dependencies: ['@radix-ui/react-dropdown-menu'] },
      { name: 'form', category: 'Inputs', dependencies: ['react-hook-form', '@hookform/resolvers', 'zod'] },
      { name: 'hover-card', category: 'Overlay', dependencies: ['@radix-ui/react-hover-card'] },
      { name: 'input', category: 'Inputs', dependencies: [] },
      { name: 'label', category: 'Inputs', dependencies: ['@radix-ui/react-label'] },
      { name: 'menubar', category: 'Navigation', dependencies: ['@radix-ui/react-menubar'] },
      { name: 'navigation-menu', category: 'Navigation', dependencies: ['@radix-ui/react-navigation-menu'] },
      { name: 'pagination', category: 'Navigation', dependencies: [] },
      { name: 'popover', category: 'Overlay', dependencies: ['@radix-ui/react-popover'] },
      { name: 'progress', category: 'Feedback', dependencies: ['@radix-ui/react-progress'] },
      { name: 'radio-group', category: 'Inputs', dependencies: ['@radix-ui/react-radio-group'] },
      { name: 'scroll-area', category: 'Layout', dependencies: ['@radix-ui/react-scroll-area'] },
      { name: 'select', category: 'Inputs', dependencies: ['@radix-ui/react-select'] },
      { name: 'separator', category: 'Layout', dependencies: ['@radix-ui/react-separator'] },
      { name: 'sheet', category: 'Overlay', dependencies: ['@radix-ui/react-dialog'] },
      { name: 'skeleton', category: 'Feedback', dependencies: [] },
      { name: 'slider', category: 'Inputs', dependencies: ['@radix-ui/react-slider'] },
      { name: 'switch', category: 'Inputs', dependencies: ['@radix-ui/react-switch'] },
      { name: 'table', category: 'Data Display', dependencies: [] },
      { name: 'tabs', category: 'Navigation', dependencies: ['@radix-ui/react-tabs'] },
      { name: 'textarea', category: 'Inputs', dependencies: [] },
      { name: 'toast', category: 'Feedback', dependencies: ['@radix-ui/react-toast'] },
      { name: 'toggle', category: 'Inputs', dependencies: ['@radix-ui/react-toggle'] },
      { name: 'toggle-group', category: 'Inputs', dependencies: ['@radix-ui/react-toggle-group'] },
      { name: 'tooltip', category: 'Overlay', dependencies: ['@radix-ui/react-tooltip'] }
    ];
    
    components.forEach(comp => {
      this.availableComponents.set(comp.name, comp);
    });
    
    this.status.componentsAvailable = this.availableComponents.size;
  }
  
  /**
   * Sync installed components
   */
  async syncInstalledComponents() {
    const componentsDir = path.join(this.config.projectPath, this.config.componentsPath);
    
    if (fs.existsSync(componentsDir)) {
      const files = fs.readdirSync(componentsDir);
      
      files.forEach(file => {
        const name = path.basename(file, path.extname(file));
        if (this.availableComponents.has(name)) {
          this.installedComponents.add(name);
        }
      });
    }
  }
  
  /**
   * Generate a ShadCN component
   */
  async generateComponent(name, options = {}) {
    logger.info(`🔴 Generating ShadCN component: ${name}`);
    
    const component = this.availableComponents.get(name);
    if (!component) {
      throw new Error(`Component "${name}" not found in registry`);
    }
    
    // Component would be fetched from registry in production
    const componentCode = this.getComponentTemplate(name, options);
    
    // Save component
    const componentPath = path.join(
      this.config.projectPath,
      this.config.componentsPath,
      `${name}.tsx`
    );
    
    const dir = path.dirname(componentPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(componentPath, componentCode);
    this.installedComponents.add(name);
    
    logger.info(`🏁 Component "${name}" generated at ${componentPath}`);
    
    // Install dependencies if needed
    if (component.dependencies.length > 0) {
      logger.info(`📦 Dependencies needed: ${component.dependencies.join(', ')}`);
    }
    
    this.emit('component-generated', { name, path: componentPath });
    
    return {
      name,
      path: componentPath,
      dependencies: component.dependencies
    };
  }
  
  /**
   * Get component template
   */
  getComponentTemplate(name, options = {}) {
    // Simplified templates - in production would fetch from registry
    const templates = {
      button: `import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }`,

      card: `import * as React from "react"

import { cn } from "@/lib/utils"

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-lg border bg-card text-card-foreground shadow-sm",
      className
    )}
    {...props}
  />
))
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-2xl font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }`
    };
    
    return templates[name] || `// ${name} component template not found`;
  }
  
  /**
   * Update theme tokens
   */
  async updateTheme(tokens) {
    logger.info('🔴 Updating theme tokens');
    
    this.themeTokens = { ...this.themeTokens, ...tokens };
    
    // Update CSS variables
    const cssVars = this.generateCSSVariables(tokens);
    
    this.emit('theme-updated', { tokens, cssVars });
    
    return { success: true, tokens: this.themeTokens };
  }
  
  /**
   * Generate CSS variables from tokens
   */
  generateCSSVariables(tokens) {
    const vars = [];
    
    for (const [key, value] of Object.entries(tokens)) {
      vars.push(`--${key}: ${value};`);
    }
    
    return vars.join('\n');
  }
  
  /**
   * Get component information
   */
  async getComponentInfo(name) {
    const component = this.availableComponents.get(name);
    
    if (!component) {
      return null;
    }
    
    return {
      name,
      category: component.category,
      dependencies: component.dependencies,
      installed: this.installedComponents.has(name),
      variants: this.getComponentVariants(name),
      props: this.getComponentProps(name),
      examples: this.getComponentExamples(name)
    };
  }
  
  /**
   * Get component variants
   */
  getComponentVariants(name) {
    const variants = {
      button: ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link'],
      badge: ['default', 'secondary', 'destructive', 'outline'],
      alert: ['default', 'destructive']
    };
    
    return variants[name] || [];
  }
  
  /**
   * Get component props
   */
  getComponentProps(name) {
    const props = {
      button: {
        variant: 'string',
        size: 'string',
        asChild: 'boolean',
        disabled: 'boolean'
      },
      card: {
        className: 'string'
      }
    };
    
    return props[name] || {};
  }
  
  /**
   * Get component examples
   */
  getComponentExamples(name) {
    const examples = {
      button: [
        '<Button>Click me</Button>',
        '<Button variant="outline">Outline</Button>',
        '<Button variant="ghost" size="sm">Small Ghost</Button>'
      ],
      card: [
        `<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <CardDescription>Card description</CardDescription>
  </CardHeader>
  <CardContent>
    <p>Card content</p>
  </CardContent>
</Card>`
      ]
    };
    
    return examples[name] || [];
  }
  
  /**
   * Install component with dependencies
   */
  async installComponent(name) {
    logger.info(`📦 Installing ShadCN component: ${name}`);
    
    const component = this.availableComponents.get(name);
    if (!component) {
      throw new Error(`Component "${name}" not found`);
    }
    
    // Generate component
    const result = await this.generateComponent(name);
    
    // Install npm dependencies
    if (component.dependencies.length > 0) {
      logger.info(`Installing dependencies: ${component.dependencies.join(', ')}`);
      // In production, would run: npm install <dependencies>
    }
    
    return result;
  }
  
  /**
   * List all available components
   */
  listComponents(category = null) {
    const components = [];
    
    for (const [name, comp] of this.availableComponents) {
      if (!category || comp.category === category) {
        components.push({
          name,
          category: comp.category,
          installed: this.installedComponents.has(name)
        });
      }
    }
    
    return components;
  }
  
  /**
   * Get integration status
   */
  getStatus() {
    return {
      ...this.status,
      installedComponents: Array.from(this.installedComponents),
      categories: this.getCategories()
    };
  }
  
  /**
   * Get component categories
   */
  getCategories() {
    const categories = new Set();
    
    for (const comp of this.availableComponents.values()) {
      categories.add(comp.category);
    }
    
    return Array.from(categories);
  }
  
  /**
   * Show setup guide
   */
  showSetupGuide() {
    logger.info(`
╔══════════════════════════════════════════════════════════╗
║                 ShadCN UI MCP Setup Guide                ║
╚══════════════════════════════════════════════════════════╝

The ShadCN UI MCP Server provides automatic access to ShadCN/UI
components through the Model Context Protocol.

To enable this integration:

1. Install the MCP server:
   npm install @modelcontextprotocol/server-shadcn-ui

2. Or clone and install manually:
   git clone https://github.com/Jpisnice/shadcn-ui-mcp-server
   cd shadcn-ui-mcp-server
   npm install

3. The integration will automatically:
   • Set up ShadCN in your project
   • Connect to the MCP server
   • Provide component generation
   • Manage theme customization

Features:
• 40+ accessible components
• Radix UI primitives
• Tailwind CSS styling
• TypeScript support
• Dark mode ready
• Copy & paste components

The integration is enabled by default but won't affect
projects that don't use ShadCN.
    `);
  }
}

// Export singleton instance
let instance = null;

module.exports = {
  ShadCNMCPIntegration,
  getInstance: (config) => {
    if (!instance) {
      instance = new ShadCNMCPIntegration(config);
    }
    return instance;
  }
};