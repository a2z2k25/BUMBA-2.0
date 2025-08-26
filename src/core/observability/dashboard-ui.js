/**
 * BUMBA Agent Observability Dashboard UI
 * 
 * Provides visual dashboard components for agent observability data
 */

const { logger } = require('../logging/bumba-logger');

/**
 * Dashboard UI Generator
 */
class ObservabilityDashboard {
  constructor(observabilitySystem) {
    this.observability = observabilitySystem;
    this.refreshInterval = 5000; // 5 seconds
    this.autoRefresh = false;
  }

  /**
   * Generate HTML dashboard
   */
  generateHTML() {
    const dashboard = this.observability.getDashboard();
    
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>BUMBA Agent Observability Dashboard</title>
    <style>
        ${this.getCSS()}
    </style>
</head>
<body>
    <div class="dashboard">
        <header class="dashboard-header">
            <h1>🟢 BUMBA Agent Observability</h1>
            <div class="header-info">
                <span class="timestamp">Last Updated: ${new Date(dashboard.timestamp).toLocaleString()}</span>
                <span class="health-indicator ${this.getHealthClass(dashboard.system_overview.health_status)}">
                    Health: ${(dashboard.system_overview.health_status * 100).toFixed(1)}%
                </span>
            </div>
        </header>

        <div class="dashboard-grid">
            ${this.generateSystemOverview(dashboard.system_overview)}
            ${this.generatePerformanceMetrics(dashboard.performance_metrics)}
            ${this.generateAgentStatus(dashboard.agent_status)}
            ${this.generateActiveTraces(dashboard.active_traces)}
            ${this.generateAnomalies(dashboard.recent_anomalies)}
            ${this.generateBottlenecks(dashboard.bottlenecks)}
            ${this.generateConsciousnessMetrics(dashboard.consciousness_metrics)}
        </div>
    </div>

    <script>
        ${this.getJavaScript()}
    </script>
</body>
</html>`;
  }

  /**
   * Generate system overview section
   */
  generateSystemOverview(overview) {
    return `
        <div class="card system-overview">
            <h2>System Overview</h2>
            <div class="metrics-grid">
                <div class="metric">
                    <span class="metric-label">Active Traces</span>
                    <span class="metric-value">${overview.active_traces}</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Active Spans</span>
                    <span class="metric-value">${overview.active_spans}</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Total Agents</span>
                    <span class="metric-value">${overview.total_agents}</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Uptime</span>
                    <span class="metric-value">${this.formatUptime(overview.uptime)}</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Memory Usage</span>
                    <span class="metric-value">${this.formatMemory(overview.memory_usage.heapUsed)}</span>
                </div>
            </div>
        </div>`;
  }

  /**
   * Generate performance metrics section
   */
  generatePerformanceMetrics(metrics) {
    return `
        <div class="card performance-metrics">
            <h2>Performance Metrics</h2>
            <div class="metrics-grid">
                <div class="metric">
                    <span class="metric-label">Requests/Hour</span>
                    <span class="metric-value">${metrics.requests_per_hour || 0}</span>
                </div>
                <div class="metric ${this.getMetricClass('error_rate', metrics.error_rate)}">
                    <span class="metric-label">Error Rate</span>
                    <span class="metric-value">${((metrics.error_rate || 0) * 100).toFixed(2)}%</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Avg Response Time</span>
                    <span class="metric-value">${(metrics.average_response_time || 0).toFixed(0)}ms</span>
                </div>
                <div class="metric ${this.getMetricClass('response_time', metrics.p95_response_time)}">
                    <span class="metric-label">P95 Response Time</span>
                    <span class="metric-value">${(metrics.p95_response_time || 0).toFixed(0)}ms</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Throughput</span>
                    <span class="metric-value">${(metrics.throughput || 0).toFixed(1)}/sec</span>
                </div>
            </div>
        </div>`;
  }

  /**
   * Generate agent status section
   */
  generateAgentStatus(agentStatus) {
    const agents = Object.values(agentStatus);
    
    if (agents.length === 0) {
      return `
        <div class="card agent-status">
            <h2>Agent Status</h2>
            <p class="no-data">No active agents</p>
        </div>`;
    }

    const agentRows = agents.map(agent => `
        <tr>
            <td>${agent.agentId}</td>
            <td>${agent.active_spans}</td>
            <td>${agent.total_spans}</td>
            <td>${this.calculateSuccessRate(agent).toFixed(1)}%</td>
            <td>${this.formatTimestamp(agent.last_activity)}</td>
        </tr>
    `).join('');

    return `
        <div class="card agent-status">
            <h2>Agent Status</h2>
            <table class="agent-table">
                <thead>
                    <tr>
                        <th>Agent ID</th>
                        <th>Active Spans</th>
                        <th>Total Spans</th>
                        <th>Success Rate</th>
                        <th>Last Activity</th>
                    </tr>
                </thead>
                <tbody>
                    ${agentRows}
                </tbody>
            </table>
        </div>`;
  }

  /**
   * Generate active traces section
   */
  generateActiveTraces(activeTraces) {
    if (activeTraces.length === 0) {
      return `
        <div class="card active-traces">
            <h2>Active Traces</h2>
            <p class="no-data">No active traces</p>
        </div>`;
    }

    const traceRows = activeTraces.slice(0, 10).map(trace => `
        <tr>
            <td><code>${trace.traceId.substring(0, 8)}...</code></td>
            <td>${trace.agentId}</td>
            <td>${trace.operation}</td>
            <td>${this.formatDuration(trace.duration)}</td>
            <td>${trace.span_count}</td>
        </tr>
    `).join('');

    return `
        <div class="card active-traces">
            <h2>Active Traces (${activeTraces.length})</h2>
            <table class="trace-table">
                <thead>
                    <tr>
                        <th>Trace ID</th>
                        <th>Agent</th>
                        <th>Operation</th>
                        <th>Duration</th>
                        <th>Spans</th>
                    </tr>
                </thead>
                <tbody>
                    ${traceRows}
                </tbody>
            </table>
        </div>`;
  }

  /**
   * Generate anomalies section
   */
  generateAnomalies(anomalies) {
    if (anomalies.length === 0) {
      return `
        <div class="card anomalies">
            <h2>Recent Anomalies</h2>
            <p class="no-data success">No anomalies detected</p>
        </div>`;
    }

    const anomalyRows = anomalies.map(anomaly => `
        <tr class="anomaly-${anomaly.severity}">
            <td>${anomaly.type}</td>
            <td>${anomaly.agentId || 'System'}</td>
            <td><span class="severity-badge ${anomaly.severity}">${anomaly.severity}</span></td>
            <td>${anomaly.message}</td>
            <td>${this.formatTimestamp(anomaly.timestamp)}</td>
        </tr>
    `).join('');

    return `
        <div class="card anomalies">
            <h2>Recent Anomalies (${anomalies.length})</h2>
            <table class="anomaly-table">
                <thead>
                    <tr>
                        <th>Type</th>
                        <th>Agent</th>
                        <th>Severity</th>
                        <th>Message</th>
                        <th>Time</th>
                    </tr>
                </thead>
                <tbody>
                    ${anomalyRows}
                </tbody>
            </table>
        </div>`;
  }

  /**
   * Generate bottlenecks section
   */
  generateBottlenecks(bottlenecks) {
    if (bottlenecks.length === 0) {
      return `
        <div class="card bottlenecks">
            <h2>Performance Bottlenecks</h2>
            <p class="no-data success">No bottlenecks detected</p>
        </div>`;
    }

    const bottleneckRows = bottlenecks.map(bottleneck => `
        <tr class="bottleneck-${bottleneck.severity}">
            <td>${bottleneck.type}</td>
            <td>${bottleneck.agentId}</td>
            <td>${bottleneck.operation}</td>
            <td><span class="severity-badge ${bottleneck.severity}">${bottleneck.severity}</span></td>
            <td>${bottleneck.impact}</td>
        </tr>
    `).join('');

    return `
        <div class="card bottlenecks">
            <h2>Performance Bottlenecks (${bottlenecks.length})</h2>
            <table class="bottleneck-table">
                <thead>
                    <tr>
                        <th>Type</th>
                        <th>Agent</th>
                        <th>Operation</th>
                        <th>Severity</th>
                        <th>Impact</th>
                    </tr>
                </thead>
                <tbody>
                    ${bottleneckRows}
                </tbody>
            </table>
        </div>`;
  }

  /**
   * Generate consciousness metrics section
   */
  generateConsciousnessMetrics(consciousness) {
    return `
        <div class="card consciousness-metrics">
            <h2>Consciousness Metrics</h2>
            <div class="metrics-grid">
                <div class="metric ${this.getConsciousnessClass(consciousness.average_consciousness_score)}">
                    <span class="metric-label">Avg Consciousness</span>
                    <span class="metric-value">${(consciousness.average_consciousness_score * 100).toFixed(1)}%</span>
                </div>
                <div class="metric ${this.getConsciousnessClass(consciousness.ethical_alignment)}">
                    <span class="metric-label">Ethical Alignment</span>
                    <span class="metric-value">${(consciousness.ethical_alignment * 100).toFixed(1)}%</span>
                </div>
                <div class="metric ${this.getConsciousnessClass(consciousness.decision_quality)}">
                    <span class="metric-label">Decision Quality</span>
                    <span class="metric-value">${(consciousness.decision_quality * 100).toFixed(1)}%</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Total Decisions</span>
                    <span class="metric-value">${consciousness.total_decisions}</span>
                </div>
            </div>
        </div>`;
  }

  /**
   * Get CSS styles
   */
  getCSS() {
    return `
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #f5f6fa;
            color: #2f3542;
            line-height: 1.6;
        }

        .dashboard {
            max-width: 1400px;
            margin: 0 auto;
            padding: 20px;
        }

        .dashboard-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 30px;
            padding: 20px;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .dashboard-header h1 {
            color: #2f3542;
            font-size: 2rem;
        }

        .header-info {
            display: flex;
            gap: 20px;
            align-items: center;
        }

        .timestamp {
            color: #57606f;
            font-size: 0.9rem;
        }

        .health-indicator {
            padding: 4px 12px;
            border-radius: 20px;
            font-weight: 600;
            font-size: 0.9rem;
        }

        .health-indicator.excellent { background: #2ed573; color: white; }
        .health-indicator.good { background: #70a1ff; color: white; }
        .health-indicator.warning { background: #ffa502; color: white; }
        .health-indicator.critical { background: #ff4757; color: white; }

        .dashboard-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
            gap: 20px;
        }

        .card {
            background: white;
            border-radius: 8px;
            padding: 20px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .card h2 {
            margin-bottom: 20px;
            color: #2f3542;
            font-size: 1.3rem;
            border-bottom: 2px solid #f1f2f6;
            padding-bottom: 10px;
        }

        .metrics-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
            gap: 15px;
        }

        .metric {
            text-align: center;
            padding: 15px;
            background: #f8f9fa;
            border-radius: 6px;
            transition: all 0.3s ease;
        }

        .metric:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        }

        .metric-label {
            display: block;
            font-size: 0.8rem;
            color: #747d8c;
            text-transform: uppercase;
            font-weight: 600;
            margin-bottom: 5px;
        }

        .metric-value {
            display: block;
            font-size: 1.5rem;
            font-weight: 700;
            color: #2f3542;
        }

        .metric.warning { background: #fff3cd; border-left: 4px solid #ffa502; }
        .metric.critical { background: #f8d7da; border-left: 4px solid #ff4757; }
        .metric.success { background: #d4edda; border-left: 4px solid #2ed573; }

        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
        }

        th, td {
            padding: 10px;
            text-align: left;
            border-bottom: 1px solid #e9ecef;
        }

        th {
            background: #f8f9fa;
            font-weight: 600;
            color: #495057;
            font-size: 0.9rem;
        }

        td {
            font-size: 0.9rem;
        }

        .no-data {
            text-align: center;
            color: #6c757d;
            font-style: italic;
            padding: 20px;
        }

        .no-data.success {
            color: #28a745;
        }

        .severity-badge {
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 0.8rem;
            font-weight: 600;
            text-transform: uppercase;
        }

        .severity-badge.low { background: #bee5eb; color: #0c5460; }
        .severity-badge.medium { background: #fff3cd; color: #856404; }
        .severity-badge.high { background: #f5c6cb; color: #721c24; }
        .severity-badge.critical { background: #f8d7da; color: #721c24; }

        code {
            background: #f8f9fa;
            padding: 2px 6px;
            border-radius: 4px;
            font-family: 'Monaco', 'Menlo', monospace;
            font-size: 0.85rem;
        }

        .anomaly-critical { background-color: #fff5f5; }
        .anomaly-high { background-color: #fffbf0; }
        .anomaly-medium { background-color: #f0f9ff; }

        .bottleneck-critical { background-color: #fff5f5; }
        .bottleneck-high { background-color: #fffbf0; }
        .bottleneck-medium { background-color: #f0f9ff; }

        @media (max-width: 768px) {
            .dashboard-header {
                flex-direction: column;
                gap: 15px;
                text-align: center;
            }

            .dashboard-grid {
                grid-template-columns: 1fr;
            }

            .metrics-grid {
                grid-template-columns: repeat(2, 1fr);
            }

            table {
                font-size: 0.8rem;
            }

            th, td {
                padding: 8px 4px;
            }
        }
    `;
  }

  /**
   * Get JavaScript for auto-refresh
   */
  getJavaScript() {
    return `
        // Auto-refresh functionality
        let autoRefreshEnabled = false;
        let refreshInterval;

        function toggleAutoRefresh() {
            autoRefreshEnabled = !autoRefreshEnabled;
            if (autoRefreshEnabled) {
                refreshInterval = setInterval(() => {
                    location.reload();
                }, 5000);
            } else {
                clearInterval(refreshInterval);
            }
        }

        // Add auto-refresh button
        const headerInfo = document.querySelector('.header-info');
        const autoRefreshBtn = document.createElement('button');
        autoRefreshBtn.textContent = 'Auto Refresh: OFF';
        autoRefreshBtn.style.cssText = 'padding: 8px 16px; border: none; border-radius: 4px; background: #70a1ff; color: white; cursor: pointer; font-size: 0.9rem;';
        autoRefreshBtn.onclick = () => {
            toggleAutoRefresh();
            autoRefreshBtn.textContent = autoRefreshEnabled ? 'Auto Refresh: ON' : 'Auto Refresh: OFF';
            autoRefreshBtn.style.background = autoRefreshEnabled ? '#2ed573' : '#70a1ff';
        };
        headerInfo.appendChild(autoRefreshBtn);

        // Highlight updated metrics
        document.querySelectorAll('.metric').forEach(metric => {
            metric.addEventListener('mouseover', () => {
                metric.style.background = '#e3f2fd';
            });
            metric.addEventListener('mouseout', () => {
                metric.style.background = '#f8f9fa';
            });
        });
    `;
  }

  /**
   * Helper methods for formatting and styling
   */
  formatUptime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  }

  formatMemory(bytes) {
    const mb = bytes / 1024 / 1024;
    return `${mb.toFixed(1)} MB`;
  }

  formatDuration(ms) {
    if (ms < 1000) {return `${ms}ms`;}
    const seconds = ms / 1000;
    if (seconds < 60) {return `${seconds.toFixed(1)}s`;}
    const minutes = seconds / 60;
    return `${minutes.toFixed(1)}m`;
  }

  formatTimestamp(timestamp) {
    if (!timestamp) {return 'Never';}
    return new Date(timestamp).toLocaleTimeString();
  }

  calculateSuccessRate(agent) {
    if (agent.total_spans === 0) {return 100;}
    return ((agent.total_spans - (agent.failed_spans || 0)) / agent.total_spans) * 100;
  }

  getHealthClass(healthScore) {
    if (healthScore >= 0.9) {return 'excellent';}
    if (healthScore >= 0.8) {return 'good';}
    if (healthScore >= 0.6) {return 'warning';}
    return 'critical';
  }

  getMetricClass(type, value) {
    if (type === 'error_rate') {
      if (value > 0.1) {return 'critical';}
      if (value > 0.05) {return 'warning';}
      return 'success';
    }
    if (type === 'response_time') {
      if (value > 5000) {return 'critical';}
      if (value > 2000) {return 'warning';}
      return 'success';
    }
    return '';
  }

  getConsciousnessClass(score) {
    if (score >= 0.9) {return 'success';}
    if (score >= 0.8) {return '';}
    if (score >= 0.7) {return 'warning';}
    return 'critical';
  }

  /**
   * Generate minimal text dashboard for console output
   */
  generateTextDashboard() {
    const dashboard = this.observability.getDashboard();
    
    return `
╔══════════════════════════════════════════════════════════════════════════════╗
║                     BUMBA Agent Observability Dashboard                     ║
╠══════════════════════════════════════════════════════════════════════════════╣
║ Health: ${(dashboard.system_overview.health_status * 100).toFixed(1)}% | Active Traces: ${dashboard.system_overview.active_traces} | Active Spans: ${dashboard.system_overview.active_spans} | Agents: ${dashboard.system_overview.total_agents}
║ Memory: ${this.formatMemory(dashboard.system_overview.memory_usage.heapUsed)} | Uptime: ${this.formatUptime(dashboard.system_overview.uptime)}
╠══════════════════════════════════════════════════════════════════════════════╣
║ Performance Metrics:
║   • Error Rate: ${((dashboard.performance_metrics.error_rate || 0) * 100).toFixed(2)}%
║   • Avg Response: ${(dashboard.performance_metrics.average_response_time || 0).toFixed(0)}ms
║   • P95 Response: ${(dashboard.performance_metrics.p95_response_time || 0).toFixed(0)}ms
║   • Requests/Hr: ${dashboard.performance_metrics.requests_per_hour || 0}
╠══════════════════════════════════════════════════════════════════════════════╣
║ Consciousness Metrics:
║   • Avg Score: ${(dashboard.consciousness_metrics.average_consciousness_score * 100).toFixed(1)}%
║   • Ethical Alignment: ${(dashboard.consciousness_metrics.ethical_alignment * 100).toFixed(1)}%
║   • Decision Quality: ${(dashboard.consciousness_metrics.decision_quality * 100).toFixed(1)}%
║   • Total Decisions: ${dashboard.consciousness_metrics.total_decisions}
╠══════════════════════════════════════════════════════════════════════════════╣
║ Active Issues:
║   • Anomalies: ${dashboard.recent_anomalies.length}
║   • Bottlenecks: ${dashboard.bottlenecks.length}
║   • Active Traces: ${dashboard.active_traces.length}
╚══════════════════════════════════════════════════════════════════════════════╝
    `.trim();
  }

  /**
   * Start dashboard server (if needed)
   */
  startServer(port = 3000) {
    // This would integrate with Express or similar to serve the dashboard
    logger.info(`🟢 Dashboard would be available at http://localhost:${port}/dashboard`);
    return {
      port,
      url: `http://localhost:${port}/dashboard`,
      html: this.generateHTML()
    };
  }
}

module.exports = { ObservabilityDashboard };