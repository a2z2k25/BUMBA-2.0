# BUMBA Audio & Celebration Systems Guide

## Overview

The BUMBA CLI includes a sophisticated Audio & Celebration System that provides auditory and visual feedback for achievements, milestones, and important events. The system features automatic fallback mechanisms, cross-platform support, and extensive configuration options.

## Features

- **Dynamic Audio File Resolution**: Automatically finds audio files across multiple locations
- **Cross-Platform Support**: Works on macOS, Linux, and Windows
- **Intelligent Fallback System**: Multiple fallback strategies ensure celebrations always work
- **Configuration-Driven**: Flexible configuration through environment variables and config files
- **Visual Celebrations**: Beautiful ASCII art celebrations when audio is unavailable
- **Test Coverage**: Comprehensive test suite with 100% coverage

## Quick Start

### Basic Usage

```javascript
const { audioCelebration } = require('bumba/audio');

// Celebrate an achievement
await audioCelebration.celebrate('MILESTONE_REACHED', {
  message: 'First deployment successful!'
});

// Test the audio system
await audioCelebration.test();

// Get celebration statistics
const stats = audioCelebration.getStats();
console.log(`Total celebrations: ${stats.totalCelebrations}`);
```

### Command Line Usage

```bash
# Test audio system
bumba audio test

# Celebrate a milestone
bumba celebrate "Project Launch"

# Check audio status
bumba audio status
```

## Configuration

### Environment Variables

Configure the audio system using environment variables:

```bash
# Specify custom audio file path
export BUMBA_AUDIO_PATH="/path/to/custom/celebration.mp3"

# Disable audio globally
export BUMBA_DISABLE_AUDIO=true

# Set audio configuration directory
export BUMBA_AUDIO_DIR="$HOME/.bumba/audio"
```

### Configuration File

Add audio settings to `bumba.config.js`:

```javascript
module.exports = {
  audio: {
    enabled: true,
    volume: 0.8,
    fallbackEnabled: true,
    audioPath: './assets/audio/custom-horn.mp3',
    commands: {
      darwin: ['afplay', 'say'],
      linux: ['aplay', 'paplay', 'mpg123'],
      win32: ['powershell']
    }
  },
  features: {
    audioEnabled: true,
    celebrationsEnabled: true
  }
};
```

## Audio File Locations

The system searches for `bumba-horn.mp3` in the following locations (in order):

1. **Environment Variable**: `$BUMBA_AUDIO_PATH`
2. **Config Path**: `~/.claude/assets/audio/bumba-horn.mp3`
3. **Project Root**: `./assets/audio/bumba-horn.mp3`
4. **NPM Installation**: `node_modules/bumba/assets/audio/bumba-horn.mp3`
5. **Global Installation**: `~/.bumba/assets/audio/bumba-horn.mp3`
6. **Development Path**: Relative to source files

## Fallback System

The audio system includes multiple fallback strategies:

### 1. System Audio (Primary)
- Attempts to play the actual audio file using platform-specific commands
- macOS: `afplay`
- Linux: `aplay`, `paplay`, `mpg123`
- Windows: PowerShell audio commands

### 2. System Notifications (Secondary)
- Falls back to system notification sounds
- macOS: System beep via `osascript`
- Linux: Terminal bell
- Windows: Console beep

### 3. Console Visual (Tertiary)
- Beautiful ASCII art celebrations in the console
- Different visuals for different achievement types
- Includes emoji and color support

### 4. Silent Mode (Final)
- Records celebrations without audio or visual output
- Useful for CI/CD environments
- Still tracks statistics

## Achievement Types

The system recognizes various achievement types with custom celebrations:

- `MILESTONE_REACHED` - Project milestones
- `PROJECT_LAUNCH` - Product launches
- `CONSCIOUSNESS_BREAKTHROUGH` - Framework achievements
- `CLEAN_CODE_MASTERY` - Code quality achievements
- `ETHICAL_ACHIEVEMENT` - Ethical coding milestones
- `UNITY_ACHIEVED` - Team collaboration successes

## Custom Audio Files

### Adding Custom Audio

1. Place your audio file in one of the searched directories
2. Name it `bumba-horn.mp3` OR
3. Set `BUMBA_AUDIO_PATH` to point to your custom file

### Supported Formats

- MP3 (recommended)
- WAV
- M4A
- Any format supported by your system's audio player

## Troubleshooting

### Audio Not Playing

1. **Check File Existence**:
   ```bash
   bumba audio status
   ```

2. **Verify Audio Commands**:
   ```bash
   which afplay  # macOS
   which aplay   # Linux
   ```

3. **Test Audio System**:
   ```bash
   bumba audio test
   ```

4. **Check Permissions**:
   ```bash
   ls -la ~/.bumba/assets/audio/
   ```

### Common Issues

#### Issue: "Audio file not found"
**Solution**: Ensure `bumba-horn.mp3` exists in one of the searched locations or set `BUMBA_AUDIO_PATH`

#### Issue: "Audio playback timeout"
**Solution**: Check system audio settings and ensure audio commands are available

#### Issue: "Audio disabled by configuration"
**Solution**: Check `BUMBA_DISABLE_AUDIO` environment variable and config settings

#### Issue: No sound but no errors
**Solution**: Check system volume and audio output device settings

### Debug Mode

Enable debug logging for detailed audio system information:

```bash
export BUMBA_DEBUG=true
export BUMBA_LOG_LEVEL=debug
bumba audio test
```

## API Reference

### `audioCelebration.celebrate(achievement, options)`

Celebrate an achievement with audio and/or visual feedback.

**Parameters:**
- `achievement` (String): Type of achievement
- `options` (Object):
  - `message`: Custom message to display
  - `emoji`: Custom emoji for the celebration
  - `milestone`: Milestone description

**Returns:** Promise<Object> with celebration result

### `audioCelebration.test()`

Test the audio system and report status.

**Returns:** Promise<Object> with test results

### `audioCelebration.getStats()`

Get celebration statistics.

**Returns:** Object with:
- `totalCelebrations`: Number of celebrations
- `lastCelebration`: Timestamp of last celebration
- `audioAvailable`: Whether audio file is available
- `audioFile`: Path to audio file

### `audioFallbackSystem.playAchievementAudio(achievement, options)`

Lower-level API for playing audio with fallback chain.

### `audioFallbackSystem.getAudioStatus()`

Get detailed audio system status.

**Returns:** Object with:
- `enabled`: Whether audio is enabled
- `strategy`: Current fallback strategy
- `failures`: Number of recent failures
- `available_paths`: Number of found audio paths
- `available_commands`: Number of available audio commands

## Testing

The audio system includes comprehensive tests:

```bash
# Run audio system tests
npm test -- tests/unit/core/audio-celebration.test.js
npm test -- tests/unit/core/audio-fallback-system.test.js

# Run with coverage
npm test -- --coverage tests/unit/core/audio-*.test.js
```

## Integration Examples

### With BUMBA Commands

```javascript
// In command handler
const { audioCelebration } = require('./audio-celebration');

async function handleDeployCommand() {
  // ... deployment logic ...
  
  await audioCelebration.celebrate('PROJECT_LAUNCH', {
    message: 'Successfully deployed to production!',
    milestone: 'v2.0.0 Release'
  });
}
```

### With Test Suites

```javascript
// In Jest setup
beforeAll(() => {
  process.env.BUMBA_DISABLE_AUDIO = 'true'; // Disable audio in tests
});

// In individual tests
it('should celebrate on success', async () => {
  const result = await runImportantTest();
  
  if (result.success) {
    await audioCelebration.celebrate('CLEAN_CODE_MASTERY');
  }
});
```

### With CI/CD

```yaml
# GitHub Actions
env:
  BUMBA_DISABLE_AUDIO: true  # Silent mode for CI

# Or use visual celebrations
env:
  BUMBA_AUDIO_STRATEGY: console  # Visual only
```

## Performance

- Audio playback is non-blocking
- Timeout protection (3-5 seconds max)
- Automatic strategy escalation on failures
- Memory-efficient singleton pattern
- Zero dependencies for core functionality

## Contributing

To contribute to the audio system:

1. Add tests for new features
2. Ensure cross-platform compatibility
3. Update this documentation
4. Test on macOS, Linux, and Windows if possible

## License

Part of the BUMBA CLI. See main LICENSE file.