/**
 * Dependency Visualizer
 * Generates visual representations of module dependencies
 * Sprint 17-20 - Architecture Fix
 */

const path = require('path');
const fs = require('fs');
const { dependencyManager } = require('./dependency-manager');
const { logger } = require('../logging/bumba-logger');

class DependencyVisualizer {
  constructor() {
    this.nodes = new Map();
    this.edges = [];
    this.clusters = new Map();
  }
  
  /**
   * Generate dependency graph for visualization
   */
  async generateGraph(rootPath = process.cwd()) {
    const srcPath = path.join(rootPath, 'src');
    await dependencyManager.analyzeCodebase(srcPath);
    
    // Build nodes
    for (const [module, deps] of dependencyManager.dependencies) {
      const relativePath = path.relative(rootPath, module);
      this.addNode(module, relativePath);
      
      // Build edges
      for (const dep of deps) {
        const depRelative = path.relative(rootPath, dep);
        this.addEdge(relativePath, depRelative);
      }
    }
    
    // Detect clusters
    this.detectClusters();
    
    return {
      nodes: Array.from(this.nodes.values()),
      edges: this.edges,
      clusters: Array.from(this.clusters.values()),
      stats: this.calculateStats()
    };
  }
  
  /**
   * Add node to graph
   */
  addNode(fullPath, relativePath) {
    const category = dependencyManager.getModuleCategory(fullPath);
    const size = this.calculateNodeSize(fullPath);
    
    this.nodes.set(relativePath, {
      id: relativePath,
      label: path.basename(fullPath, '.js'),
      fullPath,
      category: category || 'other',
      size,
      dependencies: dependencyManager.dependencies.get(fullPath)?.size || 0,
      dependents: dependencyManager.dependents.get(fullPath)?.size || 0,
      isCircular: this.isInCircularDependency(fullPath)
    });
  }
  
  /**
   * Add edge to graph
   */
  addEdge(source, target) {
    const isCircular = this.isCircularEdge(source, target);
    const violations = this.getViolations(source, target);
    
    this.edges.push({
      source,
      target,
      isCircular,
      violations: violations.length > 0,
      violationDetails: violations
    });
  }
  
  /**
   * Calculate node size based on importance
   */
  calculateNodeSize(fullPath) {
    const deps = dependencyManager.dependencies.get(fullPath)?.size || 0;
    const dependents = dependencyManager.dependents.get(fullPath)?.size || 0;
    
    // Size based on how many modules depend on this
    return 5 + Math.min(dependents * 2, 20);
  }
  
  /**
   * Check if module is in circular dependency
   */
  isInCircularDependency(fullPath) {
    for (const chain of dependencyManager.circularDeps) {
      if (chain.includes(fullPath)) {
        return true;
      }
    }
    return false;
  }
  
  /**
   * Check if edge is part of circular dependency
   */
  isCircularEdge(source, target) {
    const sourceFull = path.resolve(process.cwd(), source);
    const targetFull = path.resolve(process.cwd(), target);
    
    for (const chain of dependencyManager.circularDeps) {
      if (chain.includes(`${sourceFull} -> ${targetFull}`)) {
        return true;
      }
    }
    return false;
  }
  
  /**
   * Get boundary violations for edge
   */
  getViolations(source, target) {
    const violations = [];
    
    for (const violation of dependencyManager.violations) {
      const violationSource = path.relative(process.cwd(), violation.module);
      const violationTarget = path.relative(process.cwd(), violation.dependency);
      
      if (violationSource === source && violationTarget === target) {
        violations.push(violation.rule);
      }
    }
    
    return violations;
  }
  
  /**
   * Detect module clusters
   */
  detectClusters() {
    const categories = new Map();
    
    for (const [nodePath, node] of this.nodes) {
      if (!categories.has(node.category)) {
        categories.set(node.category, []);
      }
      categories.get(node.category).push(node.id);
    }
    
    for (const [category, nodes] of categories) {
      this.clusters.set(category, {
        id: category,
        label: category.charAt(0).toUpperCase() + category.slice(1),
        nodes,
        color: this.getCategoryColor(category)
      });
    }
  }
  
  /**
   * Get color for category
   */
  getCategoryColor(category) {
    const colors = {
      core: '#2196F3',      // Blue
      specialists: '#4CAF50', // Green
      departments: '#FF9800', // Orange
      commands: '#9C27B0',   // Purple
      security: '#F44336',   // Red
      auth: '#E91E63',       // Pink
      utils: '#607D8B',      // Blue Grey
      config: '#795548',     // Brown
      other: '#9E9E9E'       // Grey
    };
    return colors[category] || colors.other;
  }
  
  /**
   * Calculate statistics
   */
  calculateStats() {
    let totalDeps = 0;
    let maxDeps = 0;
    let maxDependents = 0;
    let circularCount = 0;
    let violationCount = 0;
    
    for (const node of this.nodes.values()) {
      totalDeps += node.dependencies;
      maxDeps = Math.max(maxDeps, node.dependencies);
      maxDependents = Math.max(maxDependents, node.dependents);
      if (node.isCircular) circularCount++;
    }
    
    for (const edge of this.edges) {
      if (edge.violations) violationCount++;
    }
    
    return {
      totalNodes: this.nodes.size,
      totalEdges: this.edges.length,
      averageDependencies: (totalDeps / this.nodes.size).toFixed(2),
      maxDependencies: maxDeps,
      maxDependents,
      circularNodes: circularCount,
      violationEdges: violationCount,
      clusters: this.clusters.size
    };
  }
  
  /**
   * Generate D3.js visualization HTML
   */
  generateD3Visualization() {
    const graph = {
      nodes: Array.from(this.nodes.values()),
      links: this.edges.map(e => ({
        source: e.source,
        target: e.target,
        circular: e.isCircular,
        violation: e.violations
      }))
    };
    
    return `
<!DOCTYPE html>
<html>
<head>
    <title>BUMBA Dependency Graph</title>
    <script src="https://d3js.org/d3.v7.min.js"></script>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            background: #f5f5f5;
        }
        
        #graph {
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .node {
            stroke: #fff;
            stroke-width: 2px;
            cursor: pointer;
        }
        
        .node:hover {
            stroke-width: 3px;
        }
        
        .link {
            stroke-opacity: 0.6;
        }
        
        .link.circular {
            stroke: #f44336;
            stroke-width: 2px;
        }
        
        .link.violation {
            stroke: #ff9800;
            stroke-dasharray: 5,5;
        }
        
        .tooltip {
            position: absolute;
            text-align: left;
            padding: 10px;
            font-size: 12px;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            border-radius: 4px;
            pointer-events: none;
            opacity: 0;
        }
        
        #stats {
            margin-top: 20px;
            padding: 15px;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .stat-item {
            display: inline-block;
            margin-right: 30px;
            margin-bottom: 10px;
        }
        
        .stat-label {
            font-weight: bold;
            color: #666;
        }
        
        .stat-value {
            color: #333;
            font-size: 1.2em;
        }
        
        #legend {
            position: absolute;
            top: 20px;
            right: 20px;
            background: white;
            padding: 15px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .legend-item {
            margin-bottom: 8px;
        }
        
        .legend-color {
            display: inline-block;
            width: 20px;
            height: 10px;
            margin-right: 8px;
            vertical-align: middle;
        }
    </style>
</head>
<body>
    <h1>BUMBA Dependency Graph</h1>
    
    <div id="legend">
        <h3>Legend</h3>
        <div class="legend-item">
            <span class="legend-color" style="background: #999"></span>
            Normal Dependency
        </div>
        <div class="legend-item">
            <span class="legend-color" style="background: #f44336"></span>
            Circular Dependency
        </div>
        <div class="legend-item">
            <span class="legend-color" style="background: #ff9800"></span>
            Boundary Violation
        </div>
    </div>
    
    <svg id="graph"></svg>
    <div class="tooltip"></div>
    
    <div id="stats">
        <h3>Statistics</h3>
        ${Object.entries(this.calculateStats()).map(([key, value]) => `
            <div class="stat-item">
                <span class="stat-label">${key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                <span class="stat-value">${value}</span>
            </div>
        `).join('')}
    </div>
    
    <script>
        const graph = ${JSON.stringify(graph)};
        const clusters = ${JSON.stringify(Array.from(this.clusters.values()))};
        
        const width = window.innerWidth - 40;
        const height = 600;
        
        const svg = d3.select("#graph")
            .attr("width", width)
            .attr("height", height);
        
        const tooltip = d3.select(".tooltip");
        
        // Create force simulation
        const simulation = d3.forceSimulation(graph.nodes)
            .force("link", d3.forceLink(graph.links)
                .id(d => d.id)
                .distance(100))
            .force("charge", d3.forceManyBody().strength(-300))
            .force("center", d3.forceCenter(width / 2, height / 2))
            .force("collision", d3.forceCollide().radius(d => d.size * 2));
        
        // Create container for zoom
        const container = svg.append("g");
        
        // Add zoom behavior
        svg.call(d3.zoom()
            .extent([[0, 0], [width, height]])
            .scaleExtent([0.1, 4])
            .on("zoom", (event) => {
                container.attr("transform", event.transform);
            }));
        
        // Draw links
        const link = container.append("g")
            .selectAll("line")
            .data(graph.links)
            .enter().append("line")
            .attr("class", d => {
                let classes = "link";
                if (d.circular) classes += " circular";
                if (d.violation) classes += " violation";
                return classes;
            })
            .attr("stroke", d => {
                if (d.circular) return "#f44336";
                if (d.violation) return "#ff9800";
                return "#999";
            });
        
        // Draw nodes
        const node = container.append("g")
            .selectAll("circle")
            .data(graph.nodes)
            .enter().append("circle")
            .attr("class", "node")
            .attr("r", d => d.size)
            .attr("fill", d => {
                const cluster = clusters.find(c => c.id === d.category);
                return cluster ? cluster.color : "#999";
            })
            .call(d3.drag()
                .on("start", dragstarted)
                .on("drag", dragged)
                .on("end", dragended))
            .on("mouseover", (event, d) => {
                tooltip.transition()
                    .duration(200)
                    .style("opacity", .9);
                tooltip.html(\`
                    <strong>\${d.label}</strong><br/>
                    Path: \${d.id}<br/>
                    Category: \${d.category}<br/>
                    Dependencies: \${d.dependencies}<br/>
                    Dependents: \${d.dependents}<br/>
                    \${d.isCircular ? '<span style="color:#f44336">⚠️ Circular Dependency</span>' : ''}
                \`)
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 28) + "px");
            })
            .on("mouseout", () => {
                tooltip.transition()
                    .duration(500)
                    .style("opacity", 0);
            });
        
        // Add labels
        const label = container.append("g")
            .selectAll("text")
            .data(graph.nodes)
            .enter().append("text")
            .text(d => d.label)
            .style("font-size", "10px")
            .style("fill", "#333")
            .attr("dx", 12)
            .attr("dy", 4);
        
        // Update positions on tick
        simulation.on("tick", () => {
            link
                .attr("x1", d => d.source.x)
                .attr("y1", d => d.source.y)
                .attr("x2", d => d.target.x)
                .attr("y2", d => d.target.y);
            
            node
                .attr("cx", d => d.x)
                .attr("cy", d => d.y);
            
            label
                .attr("x", d => d.x)
                .attr("y", d => d.y);
        });
        
        // Drag functions
        function dragstarted(event, d) {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
        }
        
        function dragged(event, d) {
            d.fx = event.x;
            d.fy = event.y;
        }
        
        function dragended(event, d) {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
        }
    </script>
</body>
</html>`;
  }
  
  /**
   * Generate Mermaid diagram
   */
  generateMermaidDiagram() {
    const lines = ['graph TD'];
    const nodeStyles = [];
    const linkStyles = [];
    
    // Add nodes with styles
    let nodeIndex = 0;
    for (const [nodePath, node] of this.nodes) {
      const nodeId = `N${nodeIndex}`;
      const label = node.label.replace(/[^a-zA-Z0-9]/g, '_');
      
      lines.push(`    ${nodeId}[${label}]`);
      
      if (node.isCircular) {
        nodeStyles.push(`    style ${nodeId} fill:#ffebee,stroke:#f44336,stroke-width:2px`);
      } else {
        const cluster = Array.from(this.clusters.values()).find(c => c.id === node.category);
        if (cluster) {
          nodeStyles.push(`    style ${nodeId} fill:${cluster.color}20,stroke:${cluster.color}`);
        }
      }
      
      node.mermaidId = nodeId;
      nodeIndex++;
    }
    
    // Add edges
    let linkIndex = 0;
    for (const edge of this.edges) {
      const sourceNode = this.nodes.get(edge.source);
      const targetNode = this.nodes.get(edge.target);
      
      if (sourceNode && targetNode) {
        const linkLabel = edge.isCircular ? '-->|circular|' : '-->';
        lines.push(`    ${sourceNode.mermaidId} ${linkLabel} ${targetNode.mermaidId}`);
        
        if (edge.violations) {
          linkStyles.push(`    linkStyle ${linkIndex} stroke:#ff9800,stroke-dasharray: 5 5`);
        }
        linkIndex++;
      }
    }
    
    return [...lines, ...nodeStyles, ...linkStyles].join('\n');
  }
  
  /**
   * Save visualization to file
   */
  async saveVisualization(format = 'html', outputPath = 'dependency-graph') {
    switch (format) {
      case 'html':
        const html = this.generateD3Visualization();
        fs.writeFileSync(`${outputPath}.html`, html);
        logger.info(`Visualization saved to ${outputPath}.html`);
        break;
        
      case 'mermaid':
        const mermaid = this.generateMermaidDiagram();
        fs.writeFileSync(`${outputPath}.mmd`, mermaid);
        logger.info(`Mermaid diagram saved to ${outputPath}.mmd`);
        break;
        
      case 'json':
        const graph = await this.generateGraph();
        fs.writeFileSync(`${outputPath}.json`, JSON.stringify(graph, null, 2));
        logger.info(`Graph data saved to ${outputPath}.json`);
        break;
        
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }
}

// CLI Interface
if (require.main === module) {
  const visualizer = new DependencyVisualizer();
  
  const command = process.argv[2];
  const format = process.argv[3] || 'html';
  const output = process.argv[4] || 'dependency-graph';
  
  async function run() {
    switch (command) {
      case 'generate':
        await visualizer.generateGraph();
        await visualizer.saveVisualization(format, output);
        console.log(`\nDependency visualization generated: ${output}.${format === 'html' ? 'html' : format === 'mermaid' ? 'mmd' : 'json'}`);
        console.log('\nStatistics:');
        const stats = visualizer.calculateStats();
        Object.entries(stats).forEach(([key, value]) => {
          console.log(`  ${key}: ${value}`);
        });
        break;
        
      case 'stats':
        await visualizer.generateGraph();
        const graphStats = visualizer.calculateStats();
        console.log('\n=== Dependency Graph Statistics ===\n');
        Object.entries(graphStats).forEach(([key, value]) => {
          const label = key.replace(/([A-Z])/g, ' $1').trim();
          console.log(`${label}: ${value}`);
        });
        break;
        
      default:
        console.log('Usage: node dependency-visualizer.js [generate|stats] [format] [output]');
        console.log('  generate - Generate visualization (format: html|mermaid|json)');
        console.log('  stats    - Show dependency statistics');
        console.log('\nExamples:');
        console.log('  node dependency-visualizer.js generate html my-graph');
        console.log('  node dependency-visualizer.js generate mermaid deps');
        console.log('  node dependency-visualizer.js stats');
    }
  }
  
  run().catch(console.error);
}

module.exports = {
  DependencyVisualizer,
  visualizer: new DependencyVisualizer()
};