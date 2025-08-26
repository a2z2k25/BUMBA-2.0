/**
 * Dynamic Widget Adapter for Notion
 * 
 * Converts Bumba's DynamicWidgets to Notion-embeddable visualizations
 */

const { createCanvas } = require('canvas');

class WidgetAdapter {
  constructor(options = {}) {
    this.theme = {
      background: '#1e1e1e',
      text: '#ffffff',
      grid: '#333333',
      primary: '#FFD700',  // Bumba gold
      secondary: '#40E0D0', // Bumba teal
      success: '#90EE90',
      warning: '#FFD700',
      danger: '#FF4444',
      info: '#87CEEB'
    };
    
    this.defaultSize = {
      width: options.width || 600,
      height: options.height || 400
    };
  }

  /**
   * Create Progress Bar visualization
   */
  createProgressBar(data) {
    const { width, height } = this.defaultSize;
    const canvas = createCanvas(width, 100); // Slim height for progress bar
    const ctx = canvas.getContext('2d');
    
    // Background
    ctx.fillStyle = this.theme.background;
    ctx.fillRect(0, 0, width, 100);
    
    // Title
    ctx.fillStyle = this.theme.text;
    ctx.font = 'bold 14px monospace';
    ctx.fillText(data.title || 'Progress', 20, 30);
    
    // Progress bar background
    const barX = 20;
    const barY = 45;
    const barWidth = width - 40;
    const barHeight = 30;
    
    ctx.fillStyle = '#333';
    ctx.fillRect(barX, barY, barWidth, barHeight);
    
    // Progress fill
    const progress = Math.min(100, Math.max(0, data.value || 0));
    const fillWidth = (barWidth * progress) / 100;
    
    // Gradient fill
    const gradient = ctx.createLinearGradient(barX, 0, barX + fillWidth, 0);
    gradient.addColorStop(0, this.theme.secondary);
    gradient.addColorStop(1, this.theme.primary);
    
    ctx.fillStyle = gradient;
    ctx.fillRect(barX, barY, fillWidth, barHeight);
    
    // Progress text
    ctx.fillStyle = this.theme.text;
    ctx.font = 'bold 16px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`${progress.toFixed(1)}%`, width / 2, barY + 20);
    
    // Additional info
    if (data.subtitle) {
      ctx.font = '11px monospace';
      ctx.fillStyle = '#888';
      ctx.fillText(data.subtitle, width / 2, 90);
    }
    
    return this.canvasToNotion(canvas, 'progress-bar', data);
  }

  /**
   * Create Burndown Chart
   */
  createBurndownChart(data) {
    const { width, height } = this.defaultSize;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    
    // Background
    ctx.fillStyle = this.theme.background;
    ctx.fillRect(0, 0, width, height);
    
    // Title
    ctx.fillStyle = this.theme.text;
    ctx.font = 'bold 16px monospace';
    ctx.fillText(data.title || 'Sprint Burndown', 20, 30);
    
    // Chart area
    const chartPadding = { top: 60, right: 40, bottom: 60, left: 60 };
    const chartWidth = width - chartPadding.left - chartPadding.right;
    const chartHeight = height - chartPadding.top - chartPadding.bottom;
    
    // Grid
    this.drawGrid(ctx, chartPadding, chartWidth, chartHeight);
    
    // Axes
    this.drawAxes(ctx, chartPadding, chartWidth, chartHeight, data);
    
    // Ideal line
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(chartPadding.left, chartPadding.top);
    ctx.lineTo(chartPadding.left + chartWidth, chartPadding.top + chartHeight);
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Actual burndown line
    if (data.points && data.points.length > 0) {
      ctx.strokeStyle = this.theme.primary;
      ctx.lineWidth = 3;
      ctx.beginPath();
      
      data.points.forEach((point, index) => {
        const x = chartPadding.left + (index / (data.points.length - 1)) * chartWidth;
        const y = chartPadding.top + ((data.total - point.remaining) / data.total) * chartHeight;
        
        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
        
        // Point marker
        ctx.fillStyle = this.theme.primary;
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fill();
      });
      
      ctx.stroke();
    }
    
    // Legend
    this.drawLegend(ctx, width - 150, 60, [
      { color: this.theme.primary, label: 'Actual' },
      { color: '#666', label: 'Ideal', dashed: true }
    ]);
    
    return this.canvasToNotion(canvas, 'burndown-chart', data);
  }

  /**
   * Create Velocity Chart
   */
  createVelocityChart(data) {
    const { width, height } = this.defaultSize;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    
    // Background
    ctx.fillStyle = this.theme.background;
    ctx.fillRect(0, 0, width, height);
    
    // Title
    ctx.fillStyle = this.theme.text;
    ctx.font = 'bold 16px monospace';
    ctx.fillText(data.title || 'Team Velocity', 20, 30);
    
    // Chart area
    const chartPadding = { top: 60, right: 40, bottom: 60, left: 60 };
    const chartWidth = width - chartPadding.left - chartPadding.right;
    const chartHeight = height - chartPadding.top - chartPadding.bottom;
    
    if (data.sprints && data.sprints.length > 0) {
      const barWidth = chartWidth / (data.sprints.length * 2);
      const maxVelocity = Math.max(...data.sprints.map(s => Math.max(s.committed || 0, s.completed || 0)));
      
      data.sprints.forEach((sprint, index) => {
        const x = chartPadding.left + (index * 2 + 0.5) * barWidth;
        
        // Committed bar
        const committedHeight = (sprint.committed / maxVelocity) * chartHeight;
        ctx.fillStyle = '#666';
        ctx.fillRect(x, chartPadding.top + chartHeight - committedHeight, barWidth * 0.8, committedHeight);
        
        // Completed bar
        const completedHeight = (sprint.completed / maxVelocity) * chartHeight;
        ctx.fillStyle = sprint.completed >= sprint.committed ? this.theme.success : this.theme.warning;
        ctx.fillRect(x + barWidth, chartPadding.top + chartHeight - completedHeight, barWidth * 0.8, completedHeight);
        
        // Sprint label
        ctx.fillStyle = '#888';
        ctx.font = '10px monospace';
        ctx.save();
        ctx.translate(x + barWidth, chartPadding.top + chartHeight + 10);
        ctx.rotate(-Math.PI / 4);
        ctx.fillText(sprint.name, 0, 0);
        ctx.restore();
      });
    }
    
    // Average line
    if (data.average) {
      const avgY = chartPadding.top + chartHeight - (data.average / maxVelocity) * chartHeight;
      ctx.strokeStyle = this.theme.danger;
      ctx.lineWidth = 2;
      ctx.setLineDash([10, 5]);
      ctx.beginPath();
      ctx.moveTo(chartPadding.left, avgY);
      ctx.lineTo(chartPadding.left + chartWidth, avgY);
      ctx.stroke();
      ctx.setLineDash([]);
      
      ctx.fillStyle = this.theme.danger;
      ctx.font = '11px monospace';
      ctx.fillText(`Avg: ${data.average}`, chartPadding.left + chartWidth + 5, avgY + 4);
    }
    
    return this.canvasToNotion(canvas, 'velocity-chart', data);
  }

  /**
   * Create Department Status Grid
   */
  createStatusGrid(data) {
    const { width } = this.defaultSize;
    const canvas = createCanvas(width, 300);
    const ctx = canvas.getContext('2d');
    
    // Background
    ctx.fillStyle = this.theme.background;
    ctx.fillRect(0, 0, width, 300);
    
    // Title
    ctx.fillStyle = this.theme.text;
    ctx.font = 'bold 16px monospace';
    ctx.fillText(data.title || 'Department Status', 20, 30);
    
    // Grid layout
    const gridStart = 60;
    const cellWidth = (width - 40) / 4;
    const cellHeight = 50;
    
    if (data.departments) {
      data.departments.forEach((dept, index) => {
        const row = Math.floor(index / 4);
        const col = index % 4;
        const x = 20 + col * cellWidth;
        const y = gridStart + row * (cellHeight + 10);
        
        // Cell background
        const statusColors = {
          active: this.theme.success,
          busy: this.theme.warning,
          blocked: this.theme.danger,
          idle: '#666'
        };
        
        ctx.fillStyle = statusColors[dept.status] || '#444';
        ctx.globalAlpha = 0.3;
        ctx.fillRect(x, y, cellWidth - 10, cellHeight);
        ctx.globalAlpha = 1;
        
        // Department name
        ctx.fillStyle = this.theme.text;
        ctx.font = 'bold 12px monospace';
        ctx.fillText(dept.name, x + 10, y + 20);
        
        // Metrics
        ctx.font = '10px monospace';
        ctx.fillStyle = '#aaa';
        ctx.fillText(`Tasks: ${dept.taskCount || 0}`, x + 10, y + 35);
        ctx.fillText(`Load: ${dept.load || 0}%`, x + 10, y + 45);
      });
    }
    
    return this.canvasToNotion(canvas, 'status-grid', data);
  }

  /**
   * Create Risk Matrix
   */
  createRiskMatrix(data) {
    const { width, height } = this.defaultSize;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    
    // Background
    ctx.fillStyle = this.theme.background;
    ctx.fillRect(0, 0, width, height);
    
    // Title
    ctx.fillStyle = this.theme.text;
    ctx.font = 'bold 16px monospace';
    ctx.fillText(data.title || 'Risk Matrix', 20, 30);
    
    // Matrix grid
    const gridSize = 3;
    const cellWidth = (width - 120) / gridSize;
    const cellHeight = (height - 120) / gridSize;
    const startX = 60;
    const startY = 60;
    
    // Risk zones
    const riskColors = [
      ['#2d5016', '#3d6826', '#4d7c36'], // Low
      ['#665500', '#887700', '#aa9900'], // Medium  
      ['#661100', '#882200', '#aa3333']  // High
    ];
    
    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        ctx.fillStyle = riskColors[row][col];
        ctx.globalAlpha = 0.3;
        ctx.fillRect(
          startX + col * cellWidth,
          startY + row * cellHeight,
          cellWidth,
          cellHeight
        );
        ctx.globalAlpha = 1;
        
        // Grid lines
        ctx.strokeStyle = '#444';
        ctx.lineWidth = 1;
        ctx.strokeRect(
          startX + col * cellWidth,
          startY + row * cellHeight,
          cellWidth,
          cellHeight
        );
      }
    }
    
    // Axes labels
    ctx.fillStyle = '#888';
    ctx.font = '12px monospace';
    ctx.fillText('Impact →', startX + (cellWidth * gridSize) / 2 - 30, height - 20);
    
    ctx.save();
    ctx.translate(20, startY + (cellHeight * gridSize) / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Probability →', 0, 0);
    ctx.restore();
    
    // Plot risks
    if (data.risks) {
      data.risks.forEach(risk => {
        const x = startX + (risk.impact - 1) * cellWidth + cellWidth / 2;
        const y = startY + (3 - risk.probability) * cellHeight + cellHeight / 2;
        
        // Risk bubble
        ctx.fillStyle = risk.severity === 'critical' ? this.theme.danger : 
                       risk.severity === 'high' ? this.theme.warning : 
                       this.theme.info;
        ctx.beginPath();
        ctx.arc(x, y, 15, 0, Math.PI * 2);
        ctx.fill();
        
        // Risk ID
        ctx.fillStyle = '#000';
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(risk.id, x, y + 3);
      });
    }
    
    return this.canvasToNotion(canvas, 'risk-matrix', data);
  }

  /**
   * Helper: Draw grid
   */
  drawGrid(ctx, padding, width, height) {
    ctx.strokeStyle = this.theme.grid;
    ctx.lineWidth = 0.5;
    
    // Vertical lines
    for (let i = 0; i <= 10; i++) {
      const x = padding.left + (i / 10) * width;
      ctx.beginPath();
      ctx.moveTo(x, padding.top);
      ctx.lineTo(x, padding.top + height);
      ctx.stroke();
    }
    
    // Horizontal lines
    for (let i = 0; i <= 5; i++) {
      const y = padding.top + (i / 5) * height;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(padding.left + width, y);
      ctx.stroke();
    }
  }

  /**
   * Helper: Draw axes
   */
  drawAxes(ctx, padding, width, height, data) {
    ctx.strokeStyle = this.theme.text;
    ctx.lineWidth = 2;
    
    // X axis
    ctx.beginPath();
    ctx.moveTo(padding.left, padding.top + height);
    ctx.lineTo(padding.left + width, padding.top + height);
    ctx.stroke();
    
    // Y axis
    ctx.beginPath();
    ctx.moveTo(padding.left, padding.top);
    ctx.lineTo(padding.left, padding.top + height);
    ctx.stroke();
    
    // Labels
    ctx.fillStyle = '#888';
    ctx.font = '11px monospace';
    
    // X labels (dates)
    if (data.dates) {
      data.dates.forEach((date, index) => {
        const x = padding.left + (index / (data.dates.length - 1)) * width;
        ctx.fillText(date, x - 20, padding.top + height + 20);
      });
    }
    
    // Y labels (points)
    if (data.total) {
      for (let i = 0; i <= 5; i++) {
        const value = Math.round((data.total / 5) * (5 - i));
        const y = padding.top + (i / 5) * height;
        ctx.fillText(value.toString(), padding.left - 30, y + 5);
      }
    }
  }

  /**
   * Helper: Draw legend
   */
  drawLegend(ctx, x, y, items) {
    ctx.fillStyle = '#333';
    ctx.fillRect(x - 10, y - 10, 140, items.length * 25 + 20);
    
    items.forEach((item, index) => {
      const itemY = y + index * 25;
      
      // Line sample
      ctx.strokeStyle = item.color;
      ctx.lineWidth = 2;
      if (item.dashed) ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(x, itemY + 5);
      ctx.lineTo(x + 30, itemY + 5);
      ctx.stroke();
      ctx.setLineDash([]);
      
      // Label
      ctx.fillStyle = '#aaa';
      ctx.font = '11px monospace';
      ctx.fillText(item.label, x + 40, itemY + 10);
    });
  }

  /**
   * Convert canvas to Notion-compatible format
   */
  canvasToNotion(canvas, type, metadata) {
    return {
      type: type,
      dataURL: canvas.toDataURL(),
      width: canvas.width,
      height: canvas.height,
      embedHTML: `
        <div style="background: #1e1e1e; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <img src="${canvas.toDataURL()}" 
               alt="${metadata.title || type}" 
               style="width: 100%; max-width: ${canvas.width}px; height: auto;" />
          <div style="color: #666; font-size: 11px; margin-top: 8px; font-family: monospace; text-align: right;">
            Bumba Framework • ${new Date().toLocaleString()}
          </div>
        </div>
      `,
      metadata: {
        ...metadata,
        generated: new Date().toISOString(),
        framework: 'bumba'
      }
    };
  }

  /**
   * Generate all standard visualizations
   */
  async generateStandardSet(projectData) {
    const visualizations = [];
    
    // Overall progress
    visualizations.push(this.createProgressBar({
      title: 'Overall Project Progress',
      value: projectData.overallProgress || 0,
      subtitle: `${projectData.completedTasks || 0} of ${projectData.totalTasks || 0} tasks complete`
    }));
    
    // Sprint burndown
    if (projectData.currentSprint) {
      visualizations.push(this.createBurndownChart({
        title: `${projectData.currentSprint.name} Burndown`,
        total: projectData.currentSprint.totalPoints,
        points: projectData.currentSprint.burndownData,
        dates: projectData.currentSprint.dates
      }));
    }
    
    // Team velocity
    if (projectData.sprints && projectData.sprints.length > 0) {
      visualizations.push(this.createVelocityChart({
        title: 'Team Velocity',
        sprints: projectData.sprints,
        average: projectData.averageVelocity
      }));
    }
    
    // Department status
    visualizations.push(this.createStatusGrid({
      title: 'Department Status',
      departments: projectData.departments || []
    }));
    
    // Risk matrix
    if (projectData.risks && projectData.risks.length > 0) {
      visualizations.push(this.createRiskMatrix({
        title: 'Risk Assessment',
        risks: projectData.risks
      }));
    }
    
    return visualizations;
  }
}

module.exports = WidgetAdapter;