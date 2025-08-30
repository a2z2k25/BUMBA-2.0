#!/usr/bin/env node

const chalk = require('chalk');
const ora = require('ora');
const boxen = require('boxen').default || require('boxen');

// Disable logging
process.env.LOG_LEVEL = 'error';

class AgentLifecycleDemo {
    constructor() {
        this.agents = [];
        this.lifecycleEvents = [];
        this.performanceMetrics = {
            spawned: 0,
            completed: 0,
            failed: 0,
            recycled: 0
        };
    }
    
    async run() {
        console.clear();
        console.log(boxen(
            chalk.bold.cyan('♻️  BUMBA Agent Lifecycle Management\n') +
            chalk.gray('Demonstrating Full Agent Lifecycle: Spawn → Execute → Dissolve'),
            { padding: 1, margin: 1, borderStyle: 'round' }
        ));
        
        await this.demonstrateFullLifecycle();
        await this.demonstratePoolManagement();
        await this.demonstrateErrorRecovery();
        await this.demonstrateResourceOptimization();
        await this.showLifecycleReport();
    }
    
    async demonstrateFullLifecycle() {
        console.log(chalk.bold.white('\n🔄 Complete Agent Lifecycle Demo\n'));
        
        const agent = {
            id: 'agent-001',
            type: 'Backend Engineer',
            department: 'Backend',
            icon: '🟢',
            model: 'gpt-4'
        };
        
        const stages = [
            { name: 'Spawning', icon: '🥚', duration: 500, status: 'initializing' },
            { name: 'Registration', icon: '📝', duration: 300, status: 'registered' },
            { name: 'Activation', icon: '⚡', duration: 400, status: 'active' },
            { name: 'Task Assignment', icon: '📋', duration: 600, status: 'assigned' },
            { name: 'Processing', icon: '⚙️', duration: 2000, status: 'processing' },
            { name: 'Completion', icon: '✅', duration: 400, status: 'completed' },
            { name: 'Cleanup', icon: '🧹', duration: 300, status: 'cleaning' },
            { name: 'Dissolution', icon: '💨', duration: 200, status: 'dissolved' }
        ];
        
        console.log(chalk.bold(`${agent.icon} ${agent.type} (${agent.id})`));
        console.log(chalk.gray(`Model: ${agent.model}\n`));
        
        for (const stage of stages) {
            const spinner = ora({
                text: `${stage.icon} ${stage.name}...`,
                color: 'yellow'
            }).start();
            
            await this.sleep(stage.duration);
            
            // Record lifecycle event
            this.lifecycleEvents.push({
                agentId: agent.id,
                stage: stage.name,
                status: stage.status,
                timestamp: new Date().toISOString()
            });
            
            if (stage.name === 'Processing') {
                spinner.succeed(chalk.green(`${stage.icon} ${stage.name}`));
                
                // Show sub-tasks during processing
                const tasks = [
                    'Analyzing requirements',
                    'Generating solution',
                    'Optimizing performance',
                    'Validating output'
                ];
                
                for (const task of tasks) {
                    console.log(chalk.gray(`     └─ ${task}...`));
                    await this.sleep(300);
                }
            } else {
                spinner.succeed(chalk.blue(`${stage.icon} ${stage.name}`));
            }
        }
        
        this.performanceMetrics.spawned++;
        this.performanceMetrics.completed++;
        
        console.log(chalk.green('\n✓ Lifecycle completed successfully'));
    }
    
    async demonstratePoolManagement() {
        console.log(chalk.bold.white('\n🏊 Agent Pool Management\n'));
        
        const pools = [
            { name: 'High-Priority Pool', size: 5, model: 'gpt-4', color: chalk.red },
            { name: 'Standard Pool', size: 10, model: 'gpt-3.5-turbo', color: chalk.yellow },
            { name: 'Economy Pool', size: 15, model: 'claude-instant', color: chalk.green }
        ];
        
        for (const pool of pools) {
            console.log(pool.color.bold(`${pool.name}`));
            console.log(chalk.gray(`   Model: ${pool.model}`));
            console.log(chalk.gray(`   Pool Size: ${pool.size} agents`));
            
            // Show pool utilization
            const utilized = Math.floor(Math.random() * pool.size);
            const available = pool.size - utilized;
            const utilization = (utilized / pool.size * 100).toFixed(0);
            
            const bar = this.createUtilizationBar(utilized, pool.size);
            console.log(chalk.gray(`   Utilization: ${bar} ${utilization}%`));
            console.log(chalk.green(`   ✓ ${available} agents available\n`));
            
            // Add agents to our tracking
            for (let i = 0; i < pool.size; i++) {
                this.agents.push({
                    id: `${pool.name.toLowerCase().replace(/\s+/g, '-')}-${i}`,
                    pool: pool.name,
                    model: pool.model,
                    status: i < utilized ? 'busy' : 'available'
                });
            }
        }
        
        // Demonstrate dynamic scaling
        console.log(chalk.cyan('🔄 Dynamic Pool Scaling:'));
        const spinner = ora('Detecting high load...').start();
        await this.sleep(1000);
        spinner.succeed('High load detected - scaling High-Priority Pool from 5 to 8 agents');
        
        this.performanceMetrics.spawned += 3;
    }
    
    async demonstrateErrorRecovery() {
        console.log(chalk.bold.white('\n🛡️  Error Recovery & Resilience\n'));
        
        const scenarios = [
            {
                error: 'Agent Timeout',
                agent: 'backend-engineer-03',
                recovery: 'Respawning with increased timeout'
            },
            {
                error: 'Model Unavailable',
                agent: 'ui-designer-02',
                recovery: 'Switching to fallback model (gpt-3.5-turbo)'
            },
            {
                error: 'Memory Limit Exceeded',
                agent: 'data-analyst-01',
                recovery: 'Splitting task and spawning helper agents'
            }
        ];
        
        for (const scenario of scenarios) {
            console.log(chalk.red(`❌ Error: ${scenario.error}`));
            console.log(chalk.gray(`   Agent: ${scenario.agent}`));
            
            const spinner = ora({
                text: 'Initiating recovery protocol...',
                color: 'yellow'
            }).start();
            
            await this.sleep(1500);
            
            spinner.succeed(chalk.green(`✓ Recovery: ${scenario.recovery}`));
            console.log('');
            
            this.performanceMetrics.failed++;
            this.performanceMetrics.recycled++;
        }
    }
    
    async demonstrateResourceOptimization() {
        console.log(chalk.bold.white('\n📊 Resource Optimization\n'));
        
        const optimizations = [
            {
                metric: 'Token Usage',
                before: '125,000 tokens/hour',
                after: '87,000 tokens/hour',
                improvement: '30% reduction'
            },
            {
                metric: 'Response Time',
                before: '3.2 seconds avg',
                after: '1.8 seconds avg',
                improvement: '44% faster'
            },
            {
                metric: 'Cost Efficiency',
                before: '$12.50/hour',
                after: '$7.80/hour',
                improvement: '38% savings'
            }
        ];
        
        console.log(chalk.cyan('🤖 AI-Driven Optimization Results:\n'));
        
        for (const opt of optimizations) {
            console.log(chalk.bold(`${opt.metric}:`));
            console.log(chalk.gray(`   Before: ${opt.before}`));
            console.log(chalk.gray(`   After:  ${opt.after}`));
            console.log(chalk.green(`   ✓ ${opt.improvement}\n`));
        }
        
        // Show real-time optimization
        const spinner = ora('Analyzing current workload for optimization...').start();
        await this.sleep(2000);
        spinner.succeed('Identified 3 agents for recycling, 2 for model downgrade');
    }
    
    async showLifecycleReport() {
        console.log(chalk.bold.white('\n📈 Lifecycle Management Report\n'));
        
        const reportBox = boxen(
            chalk.cyan('Lifecycle Performance Metrics:\n\n') +
            `Agents Spawned: ${chalk.green(this.performanceMetrics.spawned)}\n` +
            `Tasks Completed: ${chalk.green(this.performanceMetrics.completed)}\n` +
            `Errors Recovered: ${chalk.yellow(this.performanceMetrics.failed)}\n` +
            `Agents Recycled: ${chalk.green(this.performanceMetrics.recycled)}\n` +
            `Active Agents: ${chalk.green(this.agents.filter(a => a.status === 'busy').length)}\n` +
            `Available Agents: ${chalk.green(this.agents.filter(a => a.status === 'available').length)}\n\n` +
            chalk.white('Lifecycle Features:\n') +
            chalk.gray('• Full spawn-to-dissolve management\n') +
            chalk.gray('• Dynamic pool scaling\n') +
            chalk.gray('• Automatic error recovery\n') +
            chalk.gray('• Resource optimization\n') +
            chalk.gray('• Performance monitoring'),
            { 
                padding: 1, 
                margin: 1, 
                borderStyle: 'double',
                borderColor: 'cyan'
            }
        );
        
        console.log(reportBox);
        
        // Show lifecycle event timeline
        console.log(chalk.bold.white('Recent Lifecycle Events:'));
        const recentEvents = this.lifecycleEvents.slice(-5);
        for (const event of recentEvents) {
            console.log(chalk.gray(`• ${event.stage} → ${event.status} (${event.agentId})`));
        }
        
        console.log(chalk.bold.green('\n✨ Agent lifecycle management demonstration complete!\n'));
    }
    
    createUtilizationBar(used, total) {
        const width = 20;
        const filled = Math.floor((used / total) * width);
        const empty = width - filled;
        return chalk.green('█'.repeat(filled)) + chalk.gray('░'.repeat(empty));
    }
    
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Run the demo
const demo = new AgentLifecycleDemo();
demo.run().catch(console.error);