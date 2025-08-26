/**
 * BUMBA Audio Fallback System
 * Resilient audio system with graceful degradation
 */

const path = require('path');
const { logger } = require('./logging/bumba-logger');

const fs = require('fs');
const { spawn } = require('child_process');

class BumbaAudioFallbackSystem {
  constructor() {
    this.audioEnabled = true;
    this.fallbackStrategies = ['system', 'console', 'silent'];
    this.currentStrategy = 'system';
    this.failureCount = 0;
    this.maxFailures = 3;

    this.audioPaths = this.detectAudioPaths();
    this.systemCommands = this.detectSystemAudioCommands();
  }

  /**
   * Detect possible audio file locations
   */
  detectAudioPaths() {
    // Skip audio in test environment
    if (process.env.NODE_ENV === 'test' || process.env.BUMBA_DISABLE_AUDIO === 'true') {
      return [];
    }
    
    const possiblePaths = [
      // Package installation paths
      path.resolve(__dirname, '../../assets/audio/bumba-horn.mp3'),
      path.resolve(process.cwd(), 'node_modules/bumba/assets/audio/bumba-horn.mp3'),
      // Development paths
      path.resolve(process.cwd(), 'assets/audio/bumba-horn.mp3'),
      path.resolve(__dirname, '../../../assets/audio/bumba-horn.mp3'),
      path.resolve(process.cwd(), 'src/assets/audio/bumba-horn.mp3'),
      path.resolve(__dirname, '../assets/audio/bumba-horn.mp3'),
      // Global installation paths
      path.resolve(process.env.HOME || process.env.USERPROFILE || '', '.bumba/assets/audio/bumba-horn.mp3'),
      path.resolve('/usr/local/lib/node_modules/bumba/assets/audio/bumba-horn.mp3')
    ];

    return possiblePaths.filter(audioPath => {
      try {
        return fs.existsSync(audioPath);
      } catch (error) {
        return false;
      }
    });
  }

  /**
   * Detect available system audio commands
   */
  detectSystemAudioCommands() {
    const commands = {
      darwin: ['afplay', 'say'],
      linux: ['aplay', 'paplay', 'espeak'],
      win32: ['powershell']
    };

    const platform = process.platform;
    const platformCommands = commands[platform] || [];

    return platformCommands.filter(cmd => {
      try {
        const { spawnSync } = require('child_process');
        const result = spawnSync('which', [cmd], { stdio: 'ignore' });
        return result.status === 0;
      } catch (error) {
        return false;
      }
    });
  }

  /**
   * Play achievement audio with fallback chain
   */
  async playAchievementAudio(achievement = 'MILESTONE_REACHED', options = {}) {
    if (!this.audioEnabled) {
      return this.consoleFallback(achievement, options);
    }

    try {
      switch (this.currentStrategy) {
        case 'system':
          return await this.systemAudioFallback(achievement, options);
        case 'console':
          return this.consoleFallback(achievement, options);
        case 'silent':
          return this.silentFallback(achievement, options);
        default:
          return this.consoleFallback(achievement, options);
      }
    } catch (error) {
      this.handleAudioFailure(error);
      return this.escalateFallback(achievement, options);
    }
  }

  /**
   * Primary system audio attempt
   */
  async systemAudioFallback(achievement, options) {
    // Try to play actual audio file
    if (this.audioPaths.length > 0 && this.systemCommands.length > 0) {
      const audioPath = this.audioPaths[0];
      const command = this.systemCommands[0];

      return new Promise((resolve, reject) => {
        const process = spawn(command, [audioPath], {
          stdio: 'ignore',
          timeout: 5000
        });

        const timeout = setTimeout(() => {
          process.kill();
          reject(new Error('Audio playback timeout'));
        }, 5000);

        process.on('close', (code) => {
          clearTimeout(timeout);
          if (code === 0) {
            this.resetFailureCount();
            resolve({
              success: true,
              method: 'system_audio',
              achievement: achievement
            });
          } else {
            reject(new Error(`Audio process exited with code ${code}`));
          }
        });

        process.on('error', (error) => {
          clearTimeout(timeout);
          reject(error);
        });
      });
    }

    // Fall back to system notification sound
    return this.systemNotificationFallback(achievement, options);
  }

  /**
   * System notification fallback
   */
  async systemNotificationFallback(achievement, options) {
    const platform = process.platform;

    try {
      if (platform === 'darwin') {
        // macOS notification sound
        await this.executeCommand('osascript', ['-e', 'beep']);
        return {
          success: true,
          method: 'system_beep_macos',
          achievement: achievement
        };
      } else if (platform === 'linux') {
        // Linux system bell
        await this.executeCommand('printf', ['\\a']);
        return {
          success: true,
          method: 'system_bell_linux',
          achievement: achievement
        };
      } else if (platform === 'win32') {
        // Windows system sound
        await this.executeCommand('powershell', ['-c', '[System.Console]::Beep(800, 200)']);
        return {
          success: true,
          method: 'system_beep_windows',
          achievement: achievement
        };
      }
    } catch (error) {
      // Continue to console fallback
    }

    return this.consoleFallback(achievement, options);
  }

  /**
   * Console-based audio representation
   */
  consoleFallback(achievement, options) {
    const audioVisuals = {
      'MILESTONE_REACHED': '🟢🏁 ACHIEVEMENT UNLOCKED 🏁🟢',
      'PROJECT_LAUNCH': '🟢🟢 PROJECT LAUNCHED 🟢🟢',
      'CONSCIOUSNESS_BREAKTHROUGH': '🏁🟢 WISDOM ACHIEVED 🟢🏁',
      'CLEAN_CODE_MASTERY': '🟢🟢 CLEAN CODE MASTERY 🟢🟢',
      'ETHICAL_ACHIEVEMENT': '🟢🏁 ETHICAL STANDARDS 🏁🟢',
      'UNITY_ACHIEVED': '🏁🏁 UNITY BREAKTHROUGH 🏁🏁'
    };

    const visual = audioVisuals[achievement] || '🏁🟢 BUMBA ACHIEVEMENT 🟢🏁';

    logger.info('\n' + '='.repeat(50));
    logger.info(`  ${visual}`);
    logger.info('='.repeat(50) + '\n');

    if (options.message) {
      logger.info(`🟢 ${options.message}\n`);
    }

    return {
      success: true,
      method: 'console_visual',
      achievement: achievement,
      fallback: true
    };
  }

  /**
   * Silent fallback (for automated environments)
   */
  silentFallback(achievement, options) {
    return {
      success: true,
      method: 'silent',
      achievement: achievement,
      fallback: true,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Execute system command with timeout
   */
  executeCommand(command, args) {
    return new Promise((resolve, reject) => {
      const process = spawn(command, args, {
        stdio: 'ignore',
        timeout: 3000
      });

      const timeout = setTimeout(() => {
        process.kill();
        reject(new Error('Command timeout'));
      }, 3000);

      process.on('close', (code) => {
        clearTimeout(timeout);
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Command exited with code ${code}`));
        }
      });

      process.on('error', (error) => {
        clearTimeout(timeout);
        reject(error);
      });
    });
  }

  /**
   * Handle audio failure and adjust strategy
   */
  handleAudioFailure(error) {
    this.failureCount++;

    logger.warn(`🟢 Audio playback failed (${this.failureCount}/${this.maxFailures}): ${error.message}`);

    if (this.failureCount >= this.maxFailures) {
      this.escalateToNextStrategy();
    }
  }

  /**
   * Escalate to next fallback strategy
   */
  escalateToNextStrategy() {
    const currentIndex = this.fallbackStrategies.indexOf(this.currentStrategy);
    const nextIndex = Math.min(currentIndex + 1, this.fallbackStrategies.length - 1);

    this.currentStrategy = this.fallbackStrategies[nextIndex];
    this.failureCount = 0;

    logger.info(`🟢 Audio system switched to: ${this.currentStrategy}`);
  }

  /**
   * Escalate fallback during runtime
   */
  async escalateFallback(achievement, options) {
    this.escalateToNextStrategy();
    return this.playAchievementAudio(achievement, options);
  }

  /**
   * Reset failure count on success
   */
  resetFailureCount() {
    if (this.failureCount > 0) {
      this.failureCount = 0;
      logger.info('🏁 Audio system recovered');
    }
  }

  /**
   * Disable audio system entirely
   */
  disableAudio(reason = 'user_request') {
    this.audioEnabled = false;
    this.currentStrategy = 'silent';
    logger.info(`🟢 Audio system disabled: ${reason}`);
  }

  /**
   * Re-enable audio system
   */
  enableAudio() {
    this.audioEnabled = true;
    this.currentStrategy = 'system';
    this.failureCount = 0;
    logger.info('🟢 Audio system re-enabled');
  }

  /**
   * Get current audio system status
   */
  getAudioStatus() {
    return {
      enabled: this.audioEnabled,
      strategy: this.currentStrategy,
      failures: this.failureCount,
      available_paths: this.audioPaths.length,
      available_commands: this.systemCommands.length,
      last_check: new Date().toISOString()
    };
  }

  /**
   * Test audio system
   */
  async testAudioSystem() {
    const status = this.getAudioStatus();

    logger.info('🟢 Testing BUMBA Audio System...\n');
    logger.info(`Strategy: ${status.strategy}`);
    logger.info(`Audio files found: ${status.available_paths}`);
    logger.info(`System commands available: ${status.available_commands}`);

    try {
      const result = await this.playAchievementAudio('MILESTONE_REACHED', {
        message: 'Audio system test - if you hear this, audio is working!'
      });

      logger.info('\n🏁 Audio test completed:', result.method);
      return result;
    } catch (error) {
      logger.info('\n🔴 Audio test failed:', error.message);
      return { success: false, error: error.message };
    }
  }
}

// Export singleton instance
const audioFallbackSystem = new BumbaAudioFallbackSystem();

module.exports = {
  AudioFallbackSystem: BumbaAudioFallbackSystem,  // Standard export name
  BumbaAudioFallbackSystem,  // Keep for backward compatibility
  audioFallbackSystem  // Singleton instance
};
