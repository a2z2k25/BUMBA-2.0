# BUMBA Framework Brand Guidelines

**Document Version: 2.0  
**Created:** December 24, 2024  
**Purpose:** Official brand identity and visual language documentation  
**Status:** Corrected Brand Guidelines  

---

## Core Brand Identity

### The BUMBA Name
- **B**uilding
- **U**nified
- **M**ulti-agent
- **B**usiness
- **A**pplications

---

## Limited Emoji Set

### ONLY These 5 Emojis Are Permitted:

| Emoji | Department | Meaning | Usage |
|-------|------------|---------|-------|
| 🟡 | Strategy | ProductStrategist Department | Strategic planning, analysis, roadmap |
| 🟢 | Backend | BackendEngineer Department | Backend development, APIs, databases |
| 🔴 | Frontend | DesignEngineer Department | Frontend, UI/UX, visual design |
| 🟠 | Testing | Quality & Testing | Testing, validation, quality assurance |
| 🏁 | Completion | Task Complete | Finished tasks, completion states |

### Emoji Logic Mapping
```
🟡 Strategy → 🟢 Backend → 🔴 Frontend → 🟠 Testing → 🏁 Completion
```

**IMPORTANT**: No other emojis are permitted anywhere in the system.

---

## Color System

### Text Colors
- **Primary**: White (default terminal text)
- **Accent**: Grey (secondary information, subtle details)
- **Department Colors**: Match emoji color values

### BUMBA ASCII Logo Gradient
The gradient flows through these exact colors:
1. **Green** - Backend/Success
2. **Yellow** - Strategy/Planning  
3. **Orange** - Testing/Quality
4. **Red** - Frontend/Design

### Department Color Mapping

| Department | Text Color | Hex Value | Terminal Color | Emoji |
|------------|------------|-----------|----------------|-------|
| ProductStrategist | Yellow | #FFD700 | chalk.yellow | 🟡 |
| BackendEngineer | Green | #00FF00 | chalk.green | 🟢 |
| DesignEngineer | Red | #FF0000 | chalk.red | 🔴 |
| Testing/QA | Orange | #FFA500 | chalk.hex('#FFA500') | 🟠 |
| Complete | White | #FFFFFF | chalk.white | 🏁 |

---

## ASCII Logo Specification

```
╔══════════════════════════════════════╗
║  ____  _   _ __  __ ____    _       ║
║ | __ )| | | |  \/  | __ )  / \      ║  <- Green
║ |  _ \| | | | |\/| |  _ \ / _ \     ║  <- Yellow  
║ | |_) | |_| | |  | | |_) / ___ \    ║  <- Orange
║ |____/ \___/|_|  |_|____/_/   \_\   ║  <- Red
║                                      ║
║ Building Unified Multi-agent         ║
║ Business Applications                ║
╚══════════════════════════════════════╝
```

**Gradient Application**: Green → Yellow → Orange → Red (top to bottom)

---

## Specialist Spawn Coloring

When specialists are spawned, they MUST be colored according to their department:

### ProductStrategist Specialists (Yellow 🟡)
```javascript
console.log(chalk.yellow('🟡 Spawning StrategySpecialist...'));
console.log(chalk.yellow('   Working on: Market analysis'));
```

### BackendEngineer Specialists (Green 🟢)
```javascript
console.log(chalk.green('🟢 Spawning NodeSpecialist...'));
console.log(chalk.green('   Working on: API endpoint creation'));
```

### DesignEngineer Specialists (Red 🔴)
```javascript
console.log(chalk.red('🔴 Spawning ReactSpecialist...'));
console.log(chalk.red('   Working on: Component design'));
```

### Testing Specialists (Orange 🟠)
```javascript
console.log(chalk.hex('#FFA500')('🟠 Spawning TestSpecialist...'));
console.log(chalk.hex('#FFA500')('   Working on: Unit test coverage'));
```

### Task Completion (White 🏁)
```javascript
console.log(chalk.white('🏁 Task completed successfully'));
```

---

## Visual Tracking System

The color and emoji system allows users to visually track:
1. **Which department** is active (by color)
2. **What type of work** is happening (by emoji)
3. **Task progression** (emoji sequence)
4. **Completion status** (🏁 appears)

### Example Flow:
```
🟡 Strategy phase initiated
   Analyzing requirements...
🟢 Backend development started
   Creating data models...
🔴 Frontend implementation begun
   Designing components...
🟠 Testing in progress
   Running test suites...
🏁 Task completed
```

---

## Text Hierarchy

### Primary Elements
- **Main text**: White (default)
- **Department text**: Colored per department
- **Completion text**: White with 🏁

### Secondary Elements  
- **Subtle details**: Grey
- **File paths**: Grey
- **Timestamps**: Grey
- **Debug info**: Grey

### Example Output:
```javascript
console.log('BUMBA Framework v2.0');                    // White
console.log(chalk.grey('Initializing...'));              // Grey
console.log(chalk.yellow('🟡 ProductStrategist ready')); // Yellow
console.log(chalk.green('🟢 BackendEngineer ready'));    // Green  
console.log(chalk.red('🔴 DesignEngineer ready'));       // Red
console.log(chalk.grey('All systems operational'));       // Grey
```

---

## Implementation Rules

### 1. Emoji Usage
- **ONLY** use the 5 approved emojis: 🟡 🟢 🔴 🟠 🏁
- **ALWAYS** match emoji to department/purpose
- **NEVER** use decorative or additional emojis
- **ENFORCE** through validation scripts

### 2. Color Application
- **PRIMARY** text is white
- **ACCENT** text is grey
- **DEPARTMENT** text matches department color
- **GRADIENT** only on ASCII logo

### 3. Specialist Identification
```javascript
function getSpecialistDisplay(specialist) {
  const departmentColors = {
    'ProductStrategist': { color: chalk.yellow, emoji: '🟡' },
    'BackendEngineer': { color: chalk.green, emoji: '🟢' },
    'DesignEngineer': { color: chalk.red, emoji: '🔴' },
    'Testing': { color: chalk.hex('#FFA500'), emoji: '🟠' }
  };
  
  const dept = specialist.department;
  const config = departmentColors[dept];
  
  return config.color(`${config.emoji} ${specialist.name}: ${specialist.task}`);
}
```

### 4. Task Flow Display
```javascript
function displayTaskFlow(stage) {
  const stages = {
    'strategy': chalk.yellow('🟡 Strategy'),
    'backend': chalk.green('🟢 Backend'),
    'frontend': chalk.red('🔴 Frontend'),
    'testing': chalk.hex('#FFA500')('🟠 Testing'),
    'complete': chalk.white('🏁 Complete')
  };
  
  return stages[stage] || chalk.white(stage);
}
```

---

## Validation Requirements

### Automated Checks
1. Grep for unauthorized emojis
2. Validate color assignments
3. Ensure department-emoji matching
4. Check text hierarchy compliance

### Manual Review
1. ASCII logo gradient correct
2. Specialist spawn colors accurate
3. Task flow visualization clear
4. Grey text used appropriately

---

## Common Violations to Avoid

🔴 **WRONG**:
- Using 🔴, 🏁, 💚, 🟡️, or any other emojis
- Coloring success text green (should be white)
- Using blue, purple, or other colors
- Mixing department colors

🏁 **CORRECT**:
- Only 🟡 🟢 🔴 🟠 🏁 emojis
- White primary text, grey accents
- Department-specific coloring
- Consistent emoji-color pairing

---

## Migration Notes

### From Version 1.0.0 to 2.0.0
- Remove ALL emojis except: 🟡 🟢 🔴 🟠 🏁
- Replace color system with department colors
- Update all specialist spawn displays
- Ensure grey text for accents only

---

*"Clarity through consistency, tracking through color"* - BUMBA Visual System