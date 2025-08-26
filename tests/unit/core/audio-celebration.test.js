/**
 * BUMBA Audio Celebration System Tests
 */

const { BumbaAudioCelebration } = require('../../../src/core/audio-celebration');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

// Mock dependencies
jest.mock('fs');
jest.mock('child_process');
jest.mock('../../../src/core/logging/bumba-logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  }
}));

jest.mock('../../../src/core/config/bumba-config', () => ({
  getInstance: jest.fn(() => ({
    getSection: jest.fn((section) => {
      if (section === 'audio') {
        return { enabled: true, volume: 0.8, fallbackEnabled: true };
      }
      return {};
    }),
    get: jest.fn((path, defaultValue) => {
      if (path === 'features.audioEnabled') return true;
      if (path === 'paths.audio') return '/test/audio';
      return defaultValue;
    })
  }))
}));

jest.mock('../../../src/core/audio-fallback-system', () => ({
  audioFallbackSystem: {
    playAchievementAudio: jest.fn().mockResolvedValue({
      success: true,
      method: 'fallback',
      achievement: 'TEST'
    })
  }
}));

describe('BumbaAudioCelebration', () => {
  let audioCelebration;
  let mockSpawn;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock spawn for audio playback
    mockSpawn = {
      on: jest.fn(),
      kill: jest.fn()
    };
    spawn.mockReturnValue(mockSpawn);
    
    // Mock file system
    fs.existsSync.mockImplementation((path) => {
      return path.includes('bumba-horn.mp3');
    });
  });
  
  describe('Constructor', () => {
    it('should initialize with audio file found', () => {
      audioCelebration = new BumbaAudioCelebration();
      
      expect(audioCelebration.audioEnabled).toBe(true);
      expect(audioCelebration.audioExists).toBe(true);
      expect(audioCelebration.audioFile).toBeTruthy();
    });
    
    it('should handle missing audio file gracefully', () => {
      fs.existsSync.mockReturnValue(false);
      
      audioCelebration = new BumbaAudioCelebration();
      
      expect(audioCelebration.audioExists).toBeFalsy();
      expect(audioCelebration.audioFile).toBe(null);
    });
    
    it('should respect BUMBA_AUDIO_PATH environment variable', () => {
      const customPath = '/custom/path/audio.mp3';
      process.env.BUMBA_AUDIO_PATH = customPath;
      fs.existsSync.mockImplementation((path) => path === customPath);
      
      audioCelebration = new BumbaAudioCelebration();
      
      expect(audioCelebration.audioFile).toBe(customPath);
      
      delete process.env.BUMBA_AUDIO_PATH;
    });
  });
  
  describe('celebrate()', () => {
    beforeEach(() => {
      fs.existsSync.mockReturnValue(true);
      audioCelebration = new BumbaAudioCelebration();
    });
    
    it('should play audio on macOS when file exists', async () => {
      const originalPlatform = Object.getOwnPropertyDescriptor(process, 'platform');
      Object.defineProperty(process, 'platform', { value: 'darwin' });
      
      // Mock successful audio playback
      mockSpawn.on.mockImplementation((event, callback) => {
        if (event === 'close') callback(0);
      });
      
      const result = await audioCelebration.celebrate('TEST_ACHIEVEMENT', {
        message: 'Test message'
      });
      
      expect(spawn).toHaveBeenCalledWith('afplay', [audioCelebration.audioFile]);
      expect(result.success).toBe(true);
      expect(result.method).toBe('afplay');
      expect(result.achievement).toBe('TEST_ACHIEVEMENT');
      
      if (originalPlatform) {
        Object.defineProperty(process, 'platform', originalPlatform);
      }
    });
    
    it('should use visual celebration when audio is disabled', async () => {
      audioCelebration.audioEnabled = false;
      
      const result = await audioCelebration.celebrate('TEST_ACHIEVEMENT');
      
      expect(result.success).toBe(true);
      expect(result.method).toBe('visual');
      expect(spawn).not.toHaveBeenCalled();
    });
    
    it('should use visual celebration when audio file is missing', async () => {
      audioCelebration.audioExists = false;
      
      const result = await audioCelebration.celebrate('TEST_ACHIEVEMENT');
      
      expect(result.success).toBe(true);
      expect(result.method).toBe('visual');
      expect(spawn).not.toHaveBeenCalled();
    });
    
    it('should handle audio playback failure gracefully', async () => {
      const originalPlatform = Object.getOwnPropertyDescriptor(process, 'platform');
      Object.defineProperty(process, 'platform', { value: 'darwin' });
      
      // Mock failed audio playback
      mockSpawn.on.mockImplementation((event, callback) => {
        if (event === 'error') callback(new Error('Audio playback failed'));
      });
      
      const result = await audioCelebration.celebrate('TEST_ACHIEVEMENT');
      
      expect(result.success).toBe(true);
      expect(result.method).toBe('visual');
      
      if (originalPlatform) {
        Object.defineProperty(process, 'platform', originalPlatform);
      }
    });
  });
  
  describe('visualCelebration()', () => {
    beforeEach(() => {
      audioCelebration = new BumbaAudioCelebration();
      jest.spyOn(console, 'log').mockImplementation();
    });
    
    afterEach(() => {
      console.log.mockRestore();
    });
    
    it('should display visual celebration', () => {
      const result = audioCelebration.visualCelebration('MILESTONE_REACHED', {
        message: 'Great job!'
      });
      
      expect(result.success).toBe(true);
      expect(result.method).toBe('visual');
      expect(result.achievement).toBe('MILESTONE_REACHED');
      expect(console.log).toHaveBeenCalled();
    });
    
    it('should increment celebration count', () => {
      const initialCount = audioCelebration.celebrationCount;
      
      audioCelebration.visualCelebration('TEST', {});
      
      expect(audioCelebration.celebrationCount).toBe(initialCount + 1);
      expect(audioCelebration.lastCelebration).toBeTruthy();
    });
  });
  
  describe('getStats()', () => {
    beforeEach(() => {
      audioCelebration = new BumbaAudioCelebration();
    });
    
    it('should return celebration statistics', () => {
      const stats = audioCelebration.getStats();
      
      expect(stats).toHaveProperty('totalCelebrations');
      expect(stats).toHaveProperty('lastCelebration');
      expect(stats).toHaveProperty('audioAvailable');
      expect(stats).toHaveProperty('audioFile');
    });
    
    it('should update stats after celebration', async () => {
      audioCelebration.audioExists = false; // Force visual celebration
      
      await audioCelebration.celebrate('TEST');
      
      const stats = audioCelebration.getStats();
      expect(stats.totalCelebrations).toBe(1);
      expect(stats.lastCelebration).not.toBe('Never');
    });
  });
  
  describe('Audio Path Resolution', () => {
    it('should check multiple paths for audio file', () => {
      fs.existsSync.mockImplementation((path) => {
        // Return true for any path containing 'assets/audio/bumba-horn.mp3'
        return path.includes('assets/audio/bumba-horn.mp3');
      });
      
      audioCelebration = new BumbaAudioCelebration();
      
      expect(fs.existsSync).toHaveBeenCalled();
      expect(audioCelebration.audioFile).toBeTruthy();
    });
    
    it('should prioritize environment variable path', () => {
      const envPath = '/env/audio/custom.mp3';
      process.env.BUMBA_AUDIO_PATH = envPath;
      
      fs.existsSync.mockImplementation((path) => path === envPath);
      
      audioCelebration = new BumbaAudioCelebration();
      
      expect(audioCelebration.audioFile).toBe(envPath);
      
      delete process.env.BUMBA_AUDIO_PATH;
    });
  });
  
  describe('Cross-platform Support', () => {
    const platforms = ['darwin', 'linux', 'win32'];
    
    platforms.forEach(platform => {
      it(`should handle ${platform} platform`, async () => {
        const originalPlatform = Object.getOwnPropertyDescriptor(process, 'platform');
        Object.defineProperty(process, 'platform', { value: platform });
        
        audioCelebration = new BumbaAudioCelebration();
        audioCelebration.audioExists = true;
        
        // Mock successful playback
        mockSpawn.on.mockImplementation((event, callback) => {
          if (event === 'close') callback(0);
        });
        
        const result = await audioCelebration.celebrate('TEST');
        
        expect(result.success).toBe(true);
        
        if (originalPlatform) {
          Object.defineProperty(process, 'platform', originalPlatform);
        }
      });
    });
  });
});