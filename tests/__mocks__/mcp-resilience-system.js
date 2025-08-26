
module.exports = {
  mcpServerManager: {
    getSystemHealth: () => ({ essential_health: 1.0 }),
    reconnectAll: async () => true,
    getStatus: () => ({ connected: 21, total: 21 })
  }
};