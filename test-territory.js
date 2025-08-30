#!/usr/bin/env node

const chalk = require('chalk');
const ora = require('ora');
const boxen = require('boxen').default || require('boxen');

// Disable logging
process.env.LOG_LEVEL = 'error';

class TerritoryManagementDemo {
    constructor() {
        this.territories = new Map();
        this.agents = [];
        this.conflicts = [];
    }
    
    async run() {
        console.clear();
        console.log(boxen(
            chalk.bold.cyan('🗺️  BUMBA Territory Management System\n') +
            chalk.gray('Demonstrating AI-Enhanced Territory Allocation'),
            { padding: 1, margin: 1, borderStyle: 'round' }
        ));
        
        await this.createAgents();
        await this.allocateTerritories();
        await this.demonstrateConflictResolution();
        await this.demonstrateDynamicReallocation();
        await this.showFinalReport();
    }
    
    async createAgents() {
        console.log(chalk.bold.white('\n👥 Creating Agent Teams\n'));
        
        const teams = [
            { dept: 'Product', color: chalk.yellow, icon: '🟡', count: 4 },
            { dept: 'Design', color: chalk.red, icon: '🔴', count: 4 },
            { dept: 'Backend', color: chalk.green, icon: '🟢', count: 5 },
            { dept: 'QA', color: chalk.rgb(255, 165, 0), icon: '🟠', count: 3 }
        ];
        
        for (const team of teams) {
            const spinner = ora({
                text: `Creating ${team.dept} agents...`,
                color: 'yellow'
            }).start();
            
            await this.sleep(500);
            
            for (let i = 0; i < team.count; i++) {
                this.agents.push({
                    id: `${team.dept.toLowerCase()}-${i + 1}`,
                    department: team.dept,
                    color: team.color,
                    icon: team.icon,
                    status: 'active'
                });
            }
            
            spinner.succeed(team.color(`${team.icon} Created ${team.count} ${team.dept} agents`));
        }
        
        console.log(chalk.gray(`\nTotal agents created: ${this.agents.length}`));
    }
    
    async allocateTerritories() {
        console.log(chalk.bold.white('\n🏁 Initial Territory Allocation\n'));
        
        const zones = [
            {
                name: 'Frontend Zone',
                resources: ['React Components', 'Style System', 'UI Library'],
                priority: 'high',
                agents: []
            },
            {
                name: 'API Zone',
                resources: ['REST Endpoints', 'GraphQL Schema', 'WebSockets'],
                priority: 'high',
                agents: []
            },
            {
                name: 'Database Zone',
                resources: ['PostgreSQL', 'Redis Cache', 'Elasticsearch'],
                priority: 'medium',
                agents: []
            },
            {
                name: 'Infrastructure Zone',
                resources: ['Kubernetes', 'Docker', 'CI/CD Pipeline'],
                priority: 'medium',
                agents: []
            },
            {
                name: 'Testing Zone',
                resources: ['Unit Tests', 'E2E Tests', 'Performance Tests'],
                priority: 'high',
                agents: []
            }
        ];
        
        // AI-driven allocation simulation
        console.log(chalk.cyan('🤖 AI analyzing agent capabilities and zone requirements...\n'));
        await this.sleep(1000);
        
        // Allocate agents to zones based on department expertise
        for (const zone of zones) {
            const allocation = this.allocateAgentsToZone(zone);
            this.territories.set(zone.name, allocation);
            
            // Display allocation
            const agentIcons = allocation.agents.map(a => a.icon).join(' ');
            console.log(chalk.bold(`${agentIcons} ${zone.name}`));
            console.log(chalk.gray(`   Priority: ${zone.priority}`));
            console.log(chalk.gray(`   Resources: ${zone.resources.join(', ')}`));
            console.log(chalk.green(`   ✓ Allocated ${allocation.agents.length} agents\n`));
        }
    }
    
    allocateAgentsToZone(zone) {
        const allocation = { ...zone, agents: [] };
        
        // Smart allocation based on zone name and department expertise
        if (zone.name.includes('Frontend')) {
            allocation.agents = this.agents.filter(a => 
                a.department === 'Design' || a.department === 'Product'
            ).slice(0, 4);
        } else if (zone.name.includes('API') || zone.name.includes('Database')) {
            allocation.agents = this.agents.filter(a => 
                a.department === 'Backend'
            ).slice(0, 3);
        } else if (zone.name.includes('Testing')) {
            allocation.agents = this.agents.filter(a => 
                a.department === 'QA'
            );
        } else if (zone.name.includes('Infrastructure')) {
            allocation.agents = this.agents.filter(a => 
                a.department === 'Backend'
            ).slice(3, 5);
        }
        
        return allocation;
    }
    
    async demonstrateConflictResolution() {
        console.log(chalk.bold.white('\n⚠️  Conflict Detection & Resolution\n'));
        
        const conflicts = [
            {
                zone1: 'Frontend Zone',
                zone2: 'API Zone',
                resource: 'User Authentication Service',
                agents1: ['design-1', 'product-1'],
                agents2: ['backend-1', 'backend-2']
            },
            {
                zone1: 'Database Zone',
                zone2: 'Testing Zone',
                resource: 'Test Database Instance',
                agents1: ['backend-3'],
                agents2: ['qa-1', 'qa-2']
            }
        ];
        
        for (const conflict of conflicts) {
            console.log(chalk.yellow(`⚠️  Conflict Detected:`));
            console.log(chalk.gray(`   Resource: ${conflict.resource}`));
            console.log(chalk.gray(`   ${conflict.zone1} agents: ${conflict.agents1.join(', ')}`));
            console.log(chalk.gray(`   ${conflict.zone2} agents: ${conflict.agents2.join(', ')}`));
            
            const spinner = ora({
                text: 'AI mediating conflict...',
                color: 'cyan'
            }).start();
            
            await this.sleep(1500);
            
            const resolution = this.resolveConflict(conflict);
            spinner.succeed(chalk.green(`✓ Resolved: ${resolution}`));
            console.log('');
            
            this.conflicts.push({ ...conflict, resolution });
        }
    }
    
    resolveConflict(conflict) {
        const resolutions = [
            'Implemented time-sharing schedule with 15-minute slots',
            'Created read-only replica for testing zone',
            'Established priority queue with backend-first access',
            'Deployed dedicated testing instance'
        ];
        
        return resolutions[Math.floor(Math.random() * resolutions.length)];
    }
    
    async demonstrateDynamicReallocation() {
        console.log(chalk.bold.white('\n🔄 Dynamic Territory Reallocation\n'));
        
        const events = [
            {
                type: 'Load Spike',
                zone: 'API Zone',
                action: 'Reallocating agents from low-priority zones'
            },
            {
                type: 'Critical Bug',
                zone: 'Testing Zone',
                action: 'Emergency reallocation of all available QA agents'
            },
            {
                type: 'Feature Launch',
                zone: 'Frontend Zone',
                action: 'Expanding territory boundaries for deployment'
            }
        ];
        
        for (const event of events) {
            console.log(chalk.bold.yellow(`🚨 Event: ${event.type}`));
            console.log(chalk.gray(`   Affected Zone: ${event.zone}`));
            
            const spinner = ora({
                text: event.action,
                color: 'yellow'
            }).start();
            
            await this.sleep(1000);
            
            // Simulate reallocation
            const territory = this.territories.get(event.zone);
            if (territory) {
                const newAgents = Math.floor(Math.random() * 3) + 1;
                spinner.succeed(chalk.green(`✓ Reallocated ${newAgents} additional agents to ${event.zone}`));
            }
            console.log('');
        }
    }
    
    async showFinalReport() {
        console.log(chalk.bold.white('\n📊 Territory Management Report\n'));
        
        const stats = {
            totalTerritories: this.territories.size,
            totalAgents: this.agents.length,
            conflictsResolved: this.conflicts.length,
            averageAgentsPerTerritory: Math.round(this.agents.length / this.territories.size)
        };
        
        const reportBox = boxen(
            chalk.cyan('Territory System Metrics:\n\n') +
            `Active Territories: ${chalk.green(stats.totalTerritories)}\n` +
            `Deployed Agents: ${chalk.green(stats.totalAgents)}\n` +
            `Conflicts Resolved: ${chalk.green(stats.conflictsResolved)}\n` +
            `Avg Agents/Territory: ${chalk.green(stats.averageAgentsPerTerritory)}\n\n` +
            chalk.white('AI Optimization Features:\n') +
            chalk.gray('• Intelligent agent-to-zone matching\n') +
            chalk.gray('• Automated conflict detection\n') +
            chalk.gray('• Dynamic resource reallocation\n') +
            chalk.gray('• Priority-based scheduling\n') +
            chalk.gray('• Real-time boundary adjustments'),
            { 
                padding: 1, 
                margin: 1, 
                borderStyle: 'double',
                borderColor: 'cyan'
            }
        );
        
        console.log(reportBox);
        
        // Show territory summary
        console.log(chalk.bold.white('Territory Distribution:'));
        for (const [name, territory] of this.territories) {
            const icons = territory.agents.map(a => a.icon).join('');
            console.log(chalk.gray(`${icons} ${name}: ${territory.agents.length} agents`));
        }
        
        console.log(chalk.bold.green('\n✨ Territory management demonstration complete!\n'));
    }
    
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Run the demo
const demo = new TerritoryManagementDemo();
demo.run().catch(console.error);