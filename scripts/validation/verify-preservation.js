#!/usr/bin/env node

/**
 * Preservation Verification Script
 * Verifies that all critical classes and methods are preserved
 * Part of Sprint 5: Testing & Validation
 */

const fs = require('fs');
const path = require('path');

// Critical classes that MUST be preserved
const CRITICAL_CLASSES = [
  'BumbaFramework2',
  'SimpleFramework',
  'ProductStrategistManager',
  'DesignEngineerManager',
  'BackendEngineerManager',
  'ModelAwareDepartmentManager',
  'UnifiedSpecialistBase',
  'JavascriptSpecialist',
  'PythonSpecialist',
  'OrchestrationHookSystem',
  'WaveOrchestrator',
  'TaskOrchestrator',
  'BumbaOrchestrationSystem',
  'UnifiedMemorySystem',
  'MemoryContextBroker',
  'ContextManager',
  'KnowledgeBase',
  'UnifiedCommunicationSystem',
  'MessageQueue',
  'CrossTeamSyncSystem'
];

// Critical methods that MUST be preserved
const CRITICAL_METHODS = [
  'enhanceProductStrategist',
  'enhanceDesignEngineer',
  'enhanceBackendEngineer',
  'connectProductStrategist',
  'connectDesignEngineer',
  'connectBackendEngineer',
  'initializeOrchestration',
  'initializeFramework',
  'initialize',
  'processTask',
  'execute',
  'handleCommand'
];

// Directories to search
const SEARCH_DIRS = [
  path.join(__dirname, '..', 'src', 'core'),
  path.join(__dirname, '..', 'src', 'agents'),
  path.join(__dirname, '..', 'src', 'systems')
];

let verificationResults = {
  classes: {
    found: [],
    missing: []
  },
  methods: {
    found: [],
    missing: []
  },
  unificationCheck: {
    importsInCore: false,
    modifiedFiles: []
  }
};

// Search for class definitions
function searchForClass(className, dir) {
  if (!fs.existsSync(dir)) return false;
  
  const files = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const file of files) {
    const fullPath = path.join(dir, file.name);
    
    if (file.isDirectory()) {
      if (searchForClass(className, fullPath)) return true;
    } else if (file.name.endsWith('.js')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      
      // Look for class definition
      const classPattern = new RegExp(`class\\s+${className}\\s*(?:extends|\\{)`, 'g');
      if (classPattern.test(content)) {
        return true;
      }
    }
  }
  
  return false;
}

// Search for method definitions
function searchForMethod(methodName, dir) {
  if (!fs.existsSync(dir)) return false;
  
  const files = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const file of files) {
    const fullPath = path.join(dir, file.name);
    
    if (file.isDirectory()) {
      if (searchForMethod(methodName, fullPath)) return true;
    } else if (file.name.endsWith('.js')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      
      // Look for method definition (function or method)
      const patterns = [
        new RegExp(`function\\s+${methodName}\\s*\\(`, 'g'),
        new RegExp(`${methodName}\\s*\\(.*\\)\\s*\\{`, 'g'),
        new RegExp(`${methodName}\\s*=\\s*(?:async\\s*)?(?:function|\\()`, 'g')
      ];
      
      for (const pattern of patterns) {
        if (pattern.test(content)) {
          return true;
        }
      }
    }
  }
  
  return false;
}

// Check for unification imports in core
function checkUnificationImports(dir) {
  if (!fs.existsSync(dir)) return false;
  
  const files = fs.readdirSync(dir, { withFileTypes: true });
  let found = false;
  
  for (const file of files) {
    const fullPath = path.join(dir, file.name);
    
    if (file.isDirectory()) {
      if (checkUnificationImports(fullPath)) found = true;
    } else if (file.name.endsWith('.js')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      
      // Check for unification imports
      if (content.includes('unification/') || 
          content.includes('UnificationLayer') ||
          content.includes('unified-bus') ||
          content.includes('context-broker')) {
        verificationResults.unificationCheck.modifiedFiles.push(fullPath);
        found = true;
      }
    }
  }
  
  return found;
}

// Main verification
console.log('🔍 Starting Preservation Verification...\n');

// Verify classes
console.log('📚 Verifying Critical Classes:');
for (const className of CRITICAL_CLASSES) {
  let found = false;
  
  for (const dir of SEARCH_DIRS) {
    if (searchForClass(className, dir)) {
      found = true;
      break;
    }
  }
  
  if (found) {
    verificationResults.classes.found.push(className);
    console.log(`  🏁 ${className}`);
  } else {
    verificationResults.classes.missing.push(className);
    console.log(`  🔴 ${className} - NOT FOUND`);
  }
}

console.log('\n📝 Verifying Critical Methods:');
for (const methodName of CRITICAL_METHODS) {
  let found = false;
  
  for (const dir of SEARCH_DIRS) {
    if (searchForMethod(methodName, dir)) {
      found = true;
      break;
    }
  }
  
  if (found) {
    verificationResults.methods.found.push(methodName);
    console.log(`  🏁 ${methodName}()`);
  } else {
    verificationResults.methods.missing.push(methodName);
    console.log(`  🔴 ${methodName}() - NOT FOUND`);
  }
}

console.log('\n🔗 Checking for Unification Imports in Core:');
const coreDir = path.join(__dirname, '..', 'src', 'core');
verificationResults.unificationCheck.importsInCore = checkUnificationImports(coreDir);

if (verificationResults.unificationCheck.importsInCore) {
  console.log('  🔴 Found unification imports in core files!');
  console.log('  Modified files:');
  verificationResults.unificationCheck.modifiedFiles.forEach(file => {
    console.log(`    - ${file}`);
  });
} else {
  console.log('  🏁 No unification imports in core - preservation intact!');
}

// Summary
console.log('\n' + '='.repeat(60));
console.log('📊 VERIFICATION SUMMARY:');
console.log('='.repeat(60));

const classPercentage = (verificationResults.classes.found.length / CRITICAL_CLASSES.length * 100).toFixed(1);
const methodPercentage = (verificationResults.methods.found.length / CRITICAL_METHODS.length * 100).toFixed(1);

console.log(`\nClasses Preserved: ${verificationResults.classes.found.length}/${CRITICAL_CLASSES.length} (${classPercentage}%)`);
if (verificationResults.classes.missing.length > 0) {
  console.log('Missing Classes:', verificationResults.classes.missing.join(', '));
}

console.log(`\nMethods Preserved: ${verificationResults.methods.found.length}/${CRITICAL_METHODS.length} (${methodPercentage}%)`);
if (verificationResults.methods.missing.length > 0) {
  console.log('Missing Methods:', verificationResults.methods.missing.join(', '));
}

console.log(`\nCore Isolation: ${verificationResults.unificationCheck.importsInCore ? '🔴 BROKEN' : '🏁 INTACT'}`);

// Final verdict
console.log('\n' + '='.repeat(60));
const allClassesFound = verificationResults.classes.missing.length === 0;
const allMethodsFound = verificationResults.methods.missing.length === 0;
const coreIsolated = !verificationResults.unificationCheck.importsInCore;

if (allClassesFound && allMethodsFound && coreIsolated) {
  console.log('🏁 PRESERVATION VERIFIED - All critical elements intact!');
  process.exit(0);
} else {
  console.log('🟠️ PRESERVATION WARNING - Some elements may be affected');
  process.exit(1);
}