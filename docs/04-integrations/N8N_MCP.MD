# N8N MCP Integration

## Overview
The N8N MCP Server enables BUMBA to interact with n8n workflow automation through natural language, allowing complex business process automation.

## Capabilities
- **Workflow Management**: Create, read, update, delete workflows
- **Execution Control**: Trigger and monitor workflow executions
- **Webhook Integration**: Handle webhook-based automations
- **Natural Language**: Control workflows through conversational commands

## Installation
```bash
npm install -g @leonardsellem/n8n-mcp-server
```

## Configuration
Add to your environment:
```bash
export N8N_API_URL="http://localhost:5678/api/v1"
export N8N_API_KEY="your-n8n-api-key"
export N8N_WEBHOOK_USERNAME="optional-webhook-username"
export N8N_WEBHOOK_PASSWORD="optional-webhook-password"
```

## Usage in BUMBA

### Workflow Creation
```bash
/bumba:workflow create "customer onboarding automation"
```

### Workflow Execution
```bash
/bumba:n8n run "send-weekly-reports"
```

### Webhook Management
```bash
/bumba:workflow webhook "setup github issue handler"
```

### Complex Automation
```bash
/bumba:implement-agents "create multi-step data pipeline with n8n"
```

## Integration Points
1. **Data Processing**: ETL pipelines
2. **API Integration**: Connect multiple services
3. **Notification Systems**: Alerts and messaging
4. **Scheduled Tasks**: Cron-based automations
5. **Event-Driven**: Webhook-based triggers

## Example Workflows

### Customer Support Automation
```javascript
await bumba.execute('/bumba:n8n create', {
  name: 'support-ticket-handler',
  triggers: ['email', 'webhook'],
  actions: ['classify', 'route', 'respond'],
  integrations: ['zendesk', 'slack', 'openai']
});
```

### Data Sync Pipeline
```javascript
await bumba.execute('/bumba:workflow', {
  type: 'data-sync',
  source: 'postgres',
  destination: 'elasticsearch',
  schedule: '*/15 * * * *'
});
```

## Best Practices
1. Use for complex multi-step automations
2. Implement error handling in workflows
3. Monitor execution logs
4. Test workflows in staging first
5. Document workflow dependencies

## Fallback Strategy
If N8N MCP is unavailable, BUMBA falls back to:
1. Manual workflow configuration
2. Direct API integrations
3. Custom automation scripts
