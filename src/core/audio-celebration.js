/**
 * BUMBA Audio Celebration System
 * Ensures bumba-horn.mp3 plays for all achievements
 */

const { audioFallbackSystem } = require('./audio-fallback-system');
const { logger } = require('./logging/bumba-logger');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { getInstance: getConfig } = require('./config/bumba-config');

class BumbaAudioCelebration {
  constructor() {
    // Get configuration
    this.config = getConfig();
    this.audioConfig = this.config.getSection('audio');
    
    // Check if audio is enabled
    this.audioEnabled = this.audioConfig.enabled && this.config.get('features.audioEnabled', true);
    
    // Dynamic audio file resolution
    this.audioFile = this.resolveAudioPath();
    
    // Verify file exists
    this.audioExists = this.audioFile && fs.existsSync(this.audioFile);
    
    if (this.audioEnabled && this.audioExists) {
      logger.info('🔴 BUMBA Audio Celebration System initialized');
      logger.info(`🔊 Sacred horn located: ${this.audioFile}`);
    } else if (!this.audioEnabled) {
      logger.info('🔇 Audio celebration system disabled by configuration');
    } else {
      logger.warn('🟠️ bumba-horn.mp3 not found at expected locations');
    }
    
    // Track celebrations
    this.celebrationCount = 0;
    this.lastCelebration = null;
  }
  
  /**
   * Resolve audio file path dynamically
   */
  resolveAudioPath() {
    // Check environment variable first
    if (process.env.BUMBA_AUDIO_PATH) {
      const envPath = process.env.BUMBA_AUDIO_PATH;
      if (fs.existsSync(envPath)) {
        return envPath;
      }
    }
    
    // Check configuration path
    const configAudioPath = this.config.get('paths.audio');
    if (configAudioPath) {
      const configFile = path.join(configAudioPath, 'bumba-horn.mp3');
      if (fs.existsSync(configFile)) {
        return configFile;
      }
    }
    
    // Check multiple possible locations
    const possiblePaths = [
      // Relative to this file
      path.join(__dirname, '../../assets/audio/bumba-horn.mp3'),
      // Relative to project root
      path.join(process.cwd(), 'assets/audio/bumba-horn.mp3'),
      // In node_modules (npm install)
      path.join(process.cwd(), 'node_modules/bumba/assets/audio/bumba-horn.mp3'),
      // Global npm install
      path.join(os.homedir(), '.bumba/assets/audio/bumba-horn.mp3'),
      // User's home directory
      path.join(os.homedir(), '.claude/assets/audio/bumba-horn.mp3'),
      // Development path
      path.join(__dirname, '../../../assets/audio/bumba-horn.mp3')
    ];
    
    // Find first existing path
    for (const audioPath of possiblePaths) {
      if (fs.existsSync(audioPath)) {
        return audioPath;
      }
    }
    
    return null; // No audio file found
  }
  
  /**
   * Play the sacred bumba-horn.mp3
   */
  async celebrate(achievement = 'ACHIEVEMENT_UNLOCKED', options = {}) {
    try {
      // Check if audio is disabled
      if (!this.audioEnabled) {
        return this.visualCelebration(achievement, options);
      }
      
      if (!this.audioExists) {
        return this.visualCelebration(achievement, options);
      }
      
      // Primary method: Direct audio playback on macOS
      if (process.platform === 'darwin') {
        return await this.playOnMac(achievement, options);
      }
      
      // Fallback to audio system
      return await audioFallbackSystem.playAchievementAudio(achievement, options);
      
    } catch (error) {
      logger.error('Audio celebration error:', error);
      return this.visualCelebration(achievement, options);
    }
  }
  
  /**
   * Play audio on macOS using afplay
   */
  async playOnMac(achievement, options) {
    return new Promise((resolve, reject) => {
      const afplay = spawn('afplay', [this.audioFile]);
      
      // Log the celebration
      this.logCelebration(achievement, options);
      
      afplay.on('close', (code) => {
        if (code === 0) {
          this.celebrationCount++;
          this.lastCelebration = Date.now();
          resolve({
            success: true,
            method: 'afplay',
            achievement,
            count: this.celebrationCount
          });
        } else {
          reject(new Error(`afplay exited with code ${code}`));
        }
      });
      
      afplay.on('error', (err) => {
        reject(err);
      });
    });
  }
  
  /**
   * Visual celebration when audio isn't available
   */
  visualCelebration(achievement, options) {
    const celebrations = [
      '🏁🔴🏁 BUMBA CELEBRATION! 🏁🔴🏁',
      '🏁🟡🏁 ACHIEVEMENT UNLOCKED! 🏁🟡🏁',
      '🟡🔊🟡 MILESTONE REACHED! 🟡🔊🟡',
      '🟢🏁🟢 CONSCIOUSNESS ACHIEVEMENT! 🟢🏁🟢',
      '🟢🔴🟢 SACRED MOMENT! 🟢🔴🟢'
    ];
    
    const celebration = celebrations[Math.floor(Math.random() * celebrations.length)];
    
    console.log('\n' + '='.repeat(50));
    console.log(celebration);
    console.log(`🏁 ${achievement}`);
    if (options.message) {
      console.log(`📝 ${options.message}`);
    }
    console.log('='.repeat(50) + '\n');
    
    this.celebrationCount++;
    this.lastCelebration = Date.now();
    
    return {
      success: true,
      method: 'visual',
      achievement,
      count: this.celebrationCount
    };
  }
  
  /**
   * Log celebration details
   */
  logCelebration(achievement, options) {
    const emojis = options.emoji || '🔴';
    console.log(`\n${emojis} BUMBA CELEBRATION: ${achievement} ${emojis}`);
    
    if (options.message) {
      console.log(`   ${options.message}`);
    }
    
    if (options.milestone) {
      console.log(`   Milestone: ${options.milestone}`);
    }
    
    console.log(`   🔊 Playing: bumba-horn.mp3`);
    console.log('');
  }
  
  /**
   * Test the audio system
   */
  async test() {
    console.log('\n🧪 Testing BUMBA Audio Celebration System...\n');
    
    console.log(`Audio file: ${this.audioFile}`);
    console.log(`File exists: ${this.audioExists ? '🏁' : '🔴'}`);
    console.log(`Platform: ${process.platform}`);
    console.log('');
    
    if (this.audioExists) {
      console.log('🔴 Playing bumba-horn.mp3...');
      const result = await this.celebrate('AUDIO_TEST', {
        message: 'Testing the sacred horn!',
        emoji: '🧪'
      });
      
      console.log('Result:', result);
      return result;
    } else {
      console.log('🟠️ Audio file not found, using visual celebration');
      return this.visualCelebration('AUDIO_TEST', {
        message: 'Audio file missing - visual celebration only'
      });
    }
  }
  
  /**
   * Get celebration statistics
   */
  getStats() {
    return {
      totalCelebrations: this.celebrationCount,
      lastCelebration: this.lastCelebration ? new Date(this.lastCelebration).toISOString() : 'Never',
      audioAvailable: this.audioExists,
      audioFile: this.audioFile
    };
  }
}

// Export singleton instance
const audioCelebration = new BumbaAudioCelebration();

module.exports = {
  BumbaAudioCelebration,
  AudioCelebration: BumbaAudioCelebration, // Alias for compatibility
  audioCelebration,
  
  // Quick celebration function
  celebrate: (achievement, options) => audioCelebration.celebrate(achievement, options),
  
  // Test function
  testAudio: () => audioCelebration.test()
};