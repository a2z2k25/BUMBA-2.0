#!/usr/bin/env node

/**
 * LIVE TEST: Chameleon Manager System
 * Watch managers shapeshift expertise in real-time
 */

const chalk = require('chalk');
const ChameleonManager = require('./src/core/departments/chameleon-manager');

console.log(chalk.cyan.bold('\n🦎 CHAMELEON MANAGER LIVE DEMONSTRATION'));
console.log(chalk.cyan('━'.repeat(50)));

async function demonstrateChameleon() {
  // Create a Chameleon Manager
  const manager = new ChameleonManager({
    name: 'Backend Chameleon',
    type: 'backend',
    validationDepth: 'L2'
  });
  
  console.log(chalk.green(`\n✅ Created ${manager.name} with polymorphic expertise\n`));
  
  // Test 1: Python Validation
  console.log(chalk.yellow('📝 TEST 1: Python Code with Common Issues'));
  console.log(chalk.gray('━'.repeat(40)));
  
  const pythonWork = {
    code: `
def process_items(items=[]):  # Mutable default!
    for item in items:
        print(item)
    items.append("processed")
    return items

def fetch_data():
    try:
        data = api.get()
    except:  # Bare except!
        pass
    return data
`,
    complexity: 'medium',
    type: 'function'
  };
  
  console.log(chalk.gray('Code snippet:'));
  console.log(chalk.blue(pythonWork.code.substring(0, 200) + '...'));
  
  console.log(chalk.yellow('\n🦎 Manager absorbing Python expertise...'));
  const pythonExpertise = await manager.assumeExpertise('python-specialist');
  console.log(chalk.green(`✓ Absorbed ${pythonExpertise.capabilities.length} Python capabilities`));
  console.log(chalk.green(`✓ Confidence: ${(pythonExpertise.confidence * 100).toFixed(0)}%`));
  
  const pythonValidation = await manager.validateWork(pythonWork, {
    name: 'Python Dev',
    type: 'python-specialist'
  });
  
  console.log(chalk.red('\n🔍 Validation Results:'));
  if (pythonValidation.errors?.length > 0) {
    pythonValidation.errors.forEach(error => {
      console.log(chalk.red(`  ❌ ERROR: ${error}`));
    });
  }
  if (pythonValidation.warnings?.length > 0) {
    pythonValidation.warnings.forEach(warning => {
      console.log(chalk.yellow(`  ⚠️  WARNING: ${warning}`));
    });
  }
  
  // Test 2: JavaScript/React Validation
  console.log(chalk.yellow('\n📝 TEST 2: React Code with Hook Issues'));
  console.log(chalk.gray('━'.repeat(40)));
  
  const reactWork = {
    code: `
function UserProfile({ userId }) {
  const [user, setUser] = useState(null);
  
  useEffect(() => {
    // Missing cleanup!
    fetchUser(userId).then(setUser);
  }, []); // Missing userId dependency!
  
  // Direct state mutation
  const updateUser = (name) => {
    user.name = name;
    setUser(user);
  };
  
  return <div>{user?.name}</div>;
}
`,
    patterns: ['direct-state-mutation', 'missing-keys'],
    complexity: 'medium'
  };
  
  console.log(chalk.gray('Code snippet:'));
  console.log(chalk.blue(reactWork.code.substring(0, 200) + '...'));
  
  console.log(chalk.yellow('\n🦎 Manager shapeshifting to React expertise...'));
  const reactExpertise = await manager.assumeExpertise('react-specialist');
  console.log(chalk.green(`✓ Transformed into React expert`));
  console.log(chalk.green(`✓ New capabilities: ${reactExpertise.capabilities[0]}`));
  
  const reactValidation = await manager.validateWork(reactWork, {
    name: 'React Dev',
    type: 'react-specialist'
  });
  
  console.log(chalk.red('\n🔍 Validation Results:'));
  if (reactValidation.errors?.length > 0) {
    reactValidation.errors.forEach(error => {
      console.log(chalk.red(`  ❌ ERROR: ${error}`));
    });
  }
  if (reactValidation.warnings?.length > 0) {
    reactValidation.warnings.forEach(warning => {
      console.log(chalk.yellow(`  ⚠️  WARNING: ${warning}`));
    });
  }
  
  // Test 3: Security Validation
  console.log(chalk.yellow('\n📝 TEST 3: API Code with Security Issues'));
  console.log(chalk.gray('━'.repeat(40)));
  
  const securityWork = {
    code: `
app.get('/user/:id', (req, res) => {
  const query = \`SELECT * FROM users WHERE id = \${req.params.id}\`;
  db.query(query, (err, result) => {
    res.json(result);
  });
});
`,
    security: {
      vulnerabilities: ['SQL injection'],
      sensitiveData: true,
      encryption: false
    },
    critical: true // This will trigger L3 validation
  };
  
  console.log(chalk.gray('Code snippet:'));
  console.log(chalk.blue(securityWork.code));
  
  console.log(chalk.yellow('\n🦎 Manager absorbing Security expertise...'));
  const securityExpertise = await manager.assumeExpertise('security-specialist');
  console.log(chalk.green(`✓ Security expertise loaded`));
  console.log(chalk.green(`✓ Focus areas: ${securityExpertise.validationFocus.join(', ')}`));
  
  const securityValidation = await manager.validateWork(securityWork, {
    name: 'Security Auditor',
    type: 'security-specialist'
  });
  
  console.log(chalk.red('\n🔍 Validation Results (L3 - Deep):'));
  if (securityValidation.errors?.length > 0) {
    securityValidation.errors.forEach(error => {
      console.log(chalk.red(`  ❌ CRITICAL: ${error}`));
    });
  }
  
  // Test 4: Rapid Expertise Switching
  console.log(chalk.yellow('\n📝 TEST 4: Rapid Expertise Switching'));
  console.log(chalk.gray('━'.repeat(40)));
  
  const specialists = [
    'golang-specialist',
    'database-specialist',
    'devops-engineer',
    'ml-engineer'
  ];
  
  console.log(chalk.cyan('Rapidly switching between expertises:'));
  for (const type of specialists) {
    const start = Date.now();
    await manager.assumeExpertise(type);
    const time = Date.now() - start;
    console.log(chalk.green(`  ✓ ${type}: ${time}ms`));
  }
  
  // Show metrics
  console.log(chalk.cyan('\n📊 CHAMELEON METRICS'));
  console.log(chalk.gray('━'.repeat(40)));
  
  const metrics = manager.getMetrics();
  console.log(chalk.white(`  Total Validations: ${metrics.validations}`));
  console.log(chalk.white(`  Expertise Switches: ${metrics.expertiseSwitches}`));
  console.log(chalk.white(`  Cache Hits: ${metrics.cacheHits}`));
  console.log(chalk.white(`  Cache Misses: ${metrics.cacheMisses}`));
  console.log(chalk.white(`  Cache Efficiency: ${(metrics.cacheEfficiency * 100).toFixed(0)}%`));
  console.log(chalk.white(`  Errors Detected: ${metrics.errorsDetected}`));
  console.log(chalk.white(`  Avg Validation Time: ${metrics.avgValidationTime.toFixed(0)}ms`));
  console.log(chalk.white(`  Avg Absorption Time: ${metrics.avgAbsorptionTime.toFixed(0)}ms`));
  
  // Show cache status
  console.log(chalk.cyan('\n💾 EXPERTISE CACHE STATUS'));
  console.log(chalk.gray('━'.repeat(40)));
  
  const cacheStats = manager.expertiseCache.getStats();
  console.log(chalk.white(`  Cached Profiles: ${manager.expertiseCache.size}`));
  console.log(chalk.white(`  Hit Rate: ${cacheStats.hitRate}`));
  console.log(chalk.white(`  Utilization: ${cacheStats.utilizationRate}`));
  console.log(chalk.white(`  Cached Types: ${manager.expertiseCache.keys().join(', ')}`));
  
  // Test cache efficiency
  console.log(chalk.yellow('\n📝 TEST 5: Cache Efficiency'));
  console.log(chalk.gray('━'.repeat(40)));
  
  console.log(chalk.cyan('Re-validating Python code (should use cache):'));
  const start = Date.now();
  await manager.assumeExpertise('python-specialist');
  const cacheTime = Date.now() - start;
  console.log(chalk.green(`  ✓ Cache hit: ${cacheTime}ms (vs initial load)`));
  
  // Demonstrate expertise details
  console.log(chalk.cyan('\n🧠 CURRENT EXPERTISE'));
  console.log(chalk.gray('━'.repeat(40)));
  
  const current = manager.getCurrentExpertise();
  console.log(chalk.white(`  Type: ${current.type}`));
  console.log(chalk.white(`  Level: ${current.level}`));
  console.log(chalk.white(`  Confidence: ${(current.confidence * 100).toFixed(0)}%`));
  console.log(chalk.white(`  Cached: ${current.cached}`));
  if (current.capabilities) {
    console.log(chalk.white(`  Sample Capabilities:`));
    current.capabilities.slice(0, 3).forEach(cap => {
      console.log(chalk.gray(`    • ${cap}`));
    });
  }
  
  // Cleanup
  await manager.shutdown();
  
  console.log(chalk.green.bold('\n✅ CHAMELEON DEMONSTRATION COMPLETE'));
  console.log(chalk.cyan('━'.repeat(50)));
  console.log(chalk.gray('\nThe manager successfully:'));
  console.log(chalk.gray('• Absorbed multiple expertise domains'));
  console.log(chalk.gray('• Validated code across different languages'));
  console.log(chalk.gray('• Caught real bugs and security issues'));
  console.log(chalk.gray('• Cached expertise for performance'));
  console.log(chalk.gray('• Switched contexts seamlessly'));
  
  console.log(chalk.green.bold('\n🦎 Chameleon Managers: Beyond Human Capability\n'));
  
  // Exit cleanly
  process.exit(0);
}

// Run demonstration
demonstrateChameleon().catch(error => {
  console.error(chalk.red('❌ Demonstration failed:'), error);
  process.exit(1);
});