# Operability Command - Integration Status Dashboard

## Purpose
Display comprehensive operability status and integration health dashboard.

## Usage
```
/bumba:operability [action]
```

## Actions
- `/bumba:operability` - Show full dashboard
- `/bumba:operability status` - Quick status summary
- `/bumba:operability quiet` - Toggle quiet mode
- `/bumba:operability reset` - Reset tracking data

## Dashboard Components

### Overall Score
- Percentage of total operability achieved
- Current achievement level and status
- Progress bar visualization
- Distance to next achievement

### Category Breakdown
- Integration category status
- Connected vs available count
- Individual progress bars
- Required vs optional indicators

### Smart Suggestions
- Next best integration to connect
- Expected operability increase
- Connection difficulty rating
- Time to implement estimate

### Connection History
- Recently connected integrations
- Failed connection attempts
- Success rate statistics
- Performance metrics

## Quiet Mode
At 80% operability, the system enters quiet mode:
- Reduced reminder frequency (30 min vs 5 min)
- Shorter, less intrusive messages
- Focus on critical issues only
- Can be manually toggled

## Status Indicators

### Visual Indicators
- 🔴 0-19% - Critical (Initialization)
- 🟠 20-39% - Low (Getting Started)
- 🟡 40-59% - Medium (Making Progress)
- 🟢 60-79% - Good (Well Connected)
- ✅ 80-94% - Excellent (Highly Operational)
- 🚀 95-99% - Near Perfect (Production Ready)
- 🏆 100% - Perfect (Fully Operational)

### Progress Bars
- Filled blocks: █ (Connected)
- Empty blocks: ░ (Available)
- Colors match achievement levels

## Integration Health
- ✅ Connected and working
- ⚠️ Connected with warnings
- ❌ Connection failed
- ○ Not attempted
- · Available to connect

## Features
- Real-time operability tracking
- Achievement-based progression
- Smart reminder system
- Connection wizard integration
- Export status reports
- Historical tracking

## Tips
- Check operability after adding integrations
- Use quiet mode when comfortable with setup
- Export reports for documentation
- Monitor failed connections for issues
- Celebrate achievement unlocks!