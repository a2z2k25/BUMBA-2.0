#!/usr/bin/env node

const chalk = require('chalk');
const ora = require('ora');
const boxen = require('boxen').default || require('boxen');

// Disable logging
process.env.LOG_LEVEL = 'error';

class SpawningDemo {
    constructor() {
        this.agents = [];
        this.territories = new Map();
        this.activeTasks = [];
    }
    
    async run() {
        console.clear();
        console.log(boxen(
            chalk.bold.cyan('🚀 BUMBA Agent Spawning System Demo\n') +
            chalk.gray('Demonstrating Manager → Specialist Spawning Logic'),
            { padding: 1, margin: 1, borderStyle: 'round' }
        ));
        
        await this.demonstrateSpawning();
        await this.demonstrateAllocation();
        await this.demonstrateExecution();
        await this.showResults();
    }
    
    async demonstrateSpawning() {
        console.log(chalk.bold.white('\n📋 Phase 1: Department Managers Spawn Specialists\n'));
        
        const departments = [
            {
                name: 'Product',
                icon: '🟡',
                manager: 'ProductStrategistManager',
                task: 'Design new feature roadmap',
                specialists: [
                    { type: 'Product Manager', model: 'gpt-4', icon: '📊' },
                    { type: 'Market Analyst', model: 'claude-3', icon: '📈' },
                    { type: 'User Researcher', model: 'gpt-4', icon: '👥' }
                ]
            },
            {
                name: 'Design',
                icon: '🔴',
                manager: 'DesignEngineerManager',
                task: 'Create UI/UX designs',
                specialists: [
                    { type: 'UI Designer', model: 'claude-3', icon: '🎨' },
                    { type: 'UX Researcher', model: 'gpt-4', icon: '🔍' },
                    { type: 'Design Systems', model: 'claude-instant', icon: '📐' }
                ]
            },
            {
                name: 'Backend',
                icon: '🟢',
                manager: 'BackendEngineerManager',
                task: 'Build API infrastructure',
                specialists: [
                    { type: 'Backend Engineer', model: 'gpt-4', icon: '⚙️' },
                    { type: 'Database Architect', model: 'claude-3', icon: '🗄️' },
                    { type: 'DevOps Engineer', model: 'gpt-3.5-turbo', icon: '🔧' }
                ]
            },
            {
                name: 'QA',
                icon: '🟠',
                manager: 'QAManager',
                task: 'Test and validate system',
                specialists: [
                    { type: 'Test Engineer', model: 'gpt-4', icon: '🧪' },
                    { type: 'Security Analyst', model: 'claude-3', icon: '🔒' },
                    { type: 'Performance Tester', model: 'gpt-3.5-turbo', icon: '⚡' }
                ]
            }
        ];
        
        for (const dept of departments) {
            console.log(chalk.bold(`${dept.icon} ${dept.name} Department`));
            console.log(chalk.gray(`   Manager: ${dept.manager}`));
            console.log(chalk.gray(`   Task: "${dept.task}"`));
            
            const spinner = ora({
                text: `Spawning specialists...`,
                color: 'yellow',
                spinner: 'dots'
            }).start();
            
            await this.sleep(800);
            
            for (const specialist of dept.specialists) {
                const agent = {
                    id: `${dept.name.toLowerCase()}-${this.agents.length + 1}`,
                    department: dept.name,
                    type: specialist.type,
                    model: specialist.model,
                    icon: specialist.icon,
                    status: 'spawned',
                    task: dept.task
                };
                this.agents.push(agent);
            }
            
            spinner.succeed(chalk.green(`Spawned ${dept.specialists.length} specialists`));
            
            for (const specialist of dept.specialists) {
                console.log(chalk.gray(`     └─ ${specialist.icon} ${specialist.type} (${specialist.model})`));
            }
            
            console.log('');
        }
    }
    
    async demonstrateAllocation() {
        console.log(chalk.bold.white('\n🗺️  Phase 2: Territory Allocation\n'));
        
        const territories = [
            {
                name: 'User Interface Zone',
                departments: ['Product', 'Design'],
                resources: ['Component Library', 'Style System', 'User Data']
            },
            {
                name: 'Backend Services Zone',
                departments: ['Backend'],
                resources: ['API Gateway', 'Database', 'Cache Layer']
            },
            {
                name: 'Testing Zone',
                departments: ['QA'],
                resources: ['Test Suites', 'Security Tools', 'Performance Metrics']
            },
            {
                name: 'Shared Resources Zone',
                departments: ['Product', 'Design', 'Backend', 'QA'],
                resources: ['Documentation', 'Analytics', 'Monitoring']
            }
        ];
        
        for (const territory of territories) {
            const deptIcons = territory.departments.map(d => {
                switch(d) {
                    case 'Product': return '🟡';
                    case 'Design': return '🔴';
                    case 'Backend': return '🟢';
                    case 'QA': return '🟠';
                    default: return '⚪';
                }
            }).join(' ');
            
            console.log(chalk.bold(`${deptIcons} ${territory.name}`));
            console.log(chalk.gray(`   Departments: ${territory.departments.join(', ')}`));
            console.log(chalk.gray(`   Resources: ${territory.resources.join(', ')}`));
            
            this.territories.set(territory.name, {
                departments: territory.departments,
                resources: territory.resources,
                agents: this.agents.filter(a => territory.departments.includes(a.department))
            });
            
            const agentCount = this.territories.get(territory.name).agents.length;
            console.log(chalk.green(`   ✓ Allocated to ${agentCount} agents\n`));
        }
    }
    
    async demonstrateExecution() {
        console.log(chalk.bold.white('\n⚡ Phase 3: Parallel Execution\n'));
        
        const tasks = [
            { department: 'Product', action: 'Analyzing market trends', agents: 3 },
            { department: 'Design', action: 'Creating wireframes', agents: 3 },
            { department: 'Backend', action: 'Building endpoints', agents: 3 },
            { department: 'QA', action: 'Running test suites', agents: 3 }
        ];
        
        console.log(chalk.gray('Starting parallel execution across departments...\n'));
        
        // Simulate parallel execution with progress bars
        const promises = tasks.map(async (task, index) => {
            const deptAgents = this.agents.filter(a => a.department === task.department);
            const icon = deptAgents[0]?.icon || '🤖';
            const color = this.getColorForDepartment(task.department);
            
            await this.sleep(index * 200); // Stagger start times
            
            // Show progress for this department
            await this.showProgress(task.department, task.action, icon, color);
            
            return {
                department: task.department,
                completed: task.agents,
                action: task.action
            };
        });
        
        const results = await Promise.all(promises);
        
        console.log(chalk.green('\n✅ All parallel tasks completed:'));
        for (const result of results) {
            const icon = this.getIconForDepartment(result.department);
            console.log(chalk.gray(`   ${icon} ${result.department}: ${result.completed} agents completed "${result.action}"`));
        }
    }
    
    async showResults() {
        console.log(chalk.bold.white('\n📊 Spawning System Summary\n'));
        
        const summary = {
            totalAgents: this.agents.length,
            departments: 4,
            territories: this.territories.size,
            models: [...new Set(this.agents.map(a => a.model))].length
        };
        
        const box = boxen(
            chalk.cyan('System Statistics:\n\n') +
            `Total Agents Spawned: ${chalk.green(summary.totalAgents)}\n` +
            `Active Departments: ${chalk.green(summary.departments)}\n` +
            `Territories Allocated: ${chalk.green(summary.territories)}\n` +
            `AI Models in Use: ${chalk.green(summary.models)}\n\n` +
            chalk.gray('Key Capabilities Demonstrated:\n') +
            chalk.white('• Department managers spawn specialized agents\n') +
            chalk.white('• Agents are allocated to work territories\n') +
            chalk.white('• Parallel execution across departments\n') +
            chalk.white('• Dynamic model selection per specialist\n') +
            chalk.white('• Territory-based resource management'),
            { 
                padding: 1, 
                margin: 1, 
                borderStyle: 'double',
                borderColor: 'cyan'
            }
        );
        
        console.log(box);
        
        console.log(chalk.bold.white('Agent Distribution:'));
        const deptCounts = {};
        for (const agent of this.agents) {
            deptCounts[agent.department] = (deptCounts[agent.department] || 0) + 1;
        }
        
        for (const [dept, count] of Object.entries(deptCounts)) {
            const icon = this.getIconForDepartment(dept);
            const color = this.getColorForDepartment(dept);
            console.log(color(`${icon} ${dept}: ${count} specialists`));
        }
        
        console.log(chalk.bold.green('\n✨ Spawning system demonstration complete!\n'));
    }
    
    async showProgress(department, action, icon, colorFn) {
        const width = 30;
        const duration = 2000;
        const steps = 20;
        const stepDuration = duration / steps;
        
        for (let i = 0; i <= steps; i++) {
            const progress = (i / steps) * 100;
            const filled = Math.floor((i / steps) * width);
            const empty = width - filled;
            const bar = '█'.repeat(filled) + '░'.repeat(empty);
            
            process.stdout.write(
                `\r${icon} ${department}: ${colorFn(bar)} ${progress.toFixed(0)}% - ${action}`
            );
            
            await this.sleep(stepDuration);
        }
        console.log('');
    }
    
    getColorForDepartment(dept) {
        switch(dept) {
            case 'Product': return chalk.yellow;
            case 'Design': return chalk.red;
            case 'Backend': return chalk.green;
            case 'QA': return chalk.rgb(255, 165, 0);
            default: return chalk.white;
        }
    }
    
    getIconForDepartment(dept) {
        switch(dept) {
            case 'Product': return '🟡';
            case 'Design': return '🔴';
            case 'Backend': return '🟢';
            case 'QA': return '🟠';
            default: return '⚪';
        }
    }
    
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Run demo
const demo = new SpawningDemo();
demo.run().catch(console.error);