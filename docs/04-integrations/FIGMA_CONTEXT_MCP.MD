# Figma Context MCP Integration

## Overview
The Figma Context MCP (Framelink) provides AI-optimized Figma design data specifically tailored for AI coding assistants to implement designs in "one-shot".

## Key Differences from Standard Figma MCP
- **AI-Optimized**: Simplifies Figma API responses for better AI comprehension
- **Context Reduction**: Reduces noise to improve accuracy
- **Layout Focus**: Provides detailed layout information for precise implementation
- **One-Shot Implementation**: Designed for complete design-to-code in a single prompt

## Installation
```bash
npm install -g figma-developer-mcp
```

## Configuration
Add to your environment:
```bash
export FIGMA_CONTEXT_API_KEY="your-figma-api-key"
```

## Usage in BUMBA

### Basic Design Implementation
```bash
/bumba:figma-context "implement the dashboard design from [figma-url]"
```

### Component Extraction
```bash
/bumba:design --with-context "extract all components from figma file"
```

### Layout Analysis
```bash
/bumba:analyze-ux --figma-context "analyze spacing and layout patterns"
```

## Capabilities
- Simplified Figma API responses
- Layout information extraction
- Component hierarchy understanding
- Style system extraction
- Responsive design data
- Asset optimization hints

## Best Practices
1. Use for complex layout implementations
2. Combine with standard Figma MCP for asset management
3. Ideal for component library generation
4. Perfect for design system implementation

## Fallback Strategy
If Figma Context MCP is unavailable, BUMBA falls back to:
1. Standard Figma MCP
2. Manual design specification
3. Visual analysis tools
