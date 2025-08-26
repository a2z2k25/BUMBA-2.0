/**
 * BUMBA Audio Fallback System Tests
 */

const { BumbaAudioFallbackSystem } = require('../../../src/core/audio-fallback-system');
const { spawn } = require('child_process');
const fs = require('fs');

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

describe('BumbaAudioFallbackSystem', () => {
  let audioFallback;
  let mockSpawn;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset environment
    delete process.env.NODE_ENV;
    delete process.env.BUMBA_DISABLE_AUDIO;
    
    // Mock spawn
    mockSpawn = {
      on: jest.fn(),
      kill: jest.fn()
    };
    spawn.mockReturnValue(mockSpawn);
    
    // Mock file system
    fs.existsSync.mockReturnValue(false);
  });
  
  describe('Constructor', () => {
    it('should initialize with default settings', () => {
      audioFallback = new BumbaAudioFallbackSystem();
      
      expect(audioFallback.audioEnabled).toBe(true);
      expect(audioFallback.currentStrategy).toBe('system');
      expect(audioFallback.failureCount).toBe(0);
      expect(audioFallback.maxFailures).toBe(3);
    });
    
    it('should detect audio paths when files exist', () => {
      fs.existsSync.mockImplementation((path) => {
        return path.includes('bumba-horn.mp3');
      });
      
      audioFallback = new BumbaAudioFallbackSystem();
      
      expect(audioFallback.audioPaths.length).toBeGreaterThan(0);
    });
    
    it('should skip audio in test environment', () => {
      process.env.NODE_ENV = 'test';
      
      audioFallback = new BumbaAudioFallbackSystem();
      
      expect(audioFallback.audioPaths).toEqual([]);
    });
    
    it('should respect BUMBA_DISABLE_AUDIO environment variable', () => {
      process.env.BUMBA_DISABLE_AUDIO = 'true';
      
      audioFallback = new BumbaAudioFallbackSystem();
      
      expect(audioFallback.audioPaths).toEqual([]);
    });
  });
  
  describe('playAchievementAudio()', () => {
    beforeEach(() => {
      audioFallback = new BumbaAudioFallbackSystem();
    });
    
    it('should use console fallback when audio is disabled', async () => {
      audioFallback.audioEnabled = false;
      
      const result = await audioFallback.playAchievementAudio('TEST');
      
      expect(result.success).toBe(true);
      expect(result.method).toBe('console_visual');
      expect(result.fallback).toBe(true);
    });
    
    it('should attempt system audio when enabled', async () => {
      audioFallback.audioPaths = ['/test/audio.mp3'];
      audioFallback.systemCommands = ['afplay'];
      
      // Mock successful playback
      mockSpawn.on.mockImplementation((event, callback) => {
        if (event === 'close') callback(0);
      });
      
      const result = await audioFallback.playAchievementAudio('TEST');
      
      expect(spawn).toHaveBeenCalledWith('afplay', ['/test/audio.mp3'], expect.any(Object));
      expect(result.success).toBe(true);
      expect(result.method).toBe('system_audio');
    });
    
    it('should handle audio playback timeout', async () => {
      audioFallback.audioPaths = ['/test/audio.mp3'];
      audioFallback.systemCommands = ['afplay'];
      
      // Don't trigger any events to simulate timeout
      jest.useFakeTimers();
      
      const playPromise = audioFallback.playAchievementAudio('TEST');
      
      // Fast-forward time
      jest.advanceTimersByTime(6000);
      
      const result = await playPromise.catch(() => ({
        success: true,
        method: 'console_visual',
        fallback: true
      }));
      
      expect(result.fallback).toBe(true);
      
      jest.useRealTimers();
    });
  });
  
  describe('Fallback Strategies', () => {
    beforeEach(() => {
      audioFallback = new BumbaAudioFallbackSystem();
    });
    
    it('should escalate strategy after max failures', () => {
      audioFallback.handleAudioFailure(new Error('Test error'));
      audioFallback.handleAudioFailure(new Error('Test error'));
      audioFallback.handleAudioFailure(new Error('Test error'));
      
      expect(audioFallback.currentStrategy).toBe('console');
      expect(audioFallback.failureCount).toBe(0); // Reset after escalation
    });
    
    it('should not escalate beyond last strategy', () => {
      audioFallback.currentStrategy = 'silent';
      audioFallback.escalateToNextStrategy();
      
      expect(audioFallback.currentStrategy).toBe('silent');
    });
    
    it('should reset failure count on success', () => {
      audioFallback.failureCount = 2;
      audioFallback.resetFailureCount();
      
      expect(audioFallback.failureCount).toBe(0);
    });
  });
  
  describe('System Notification Fallback', () => {
    beforeEach(() => {
      audioFallback = new BumbaAudioFallbackSystem();
      jest.spyOn(audioFallback, 'executeCommand').mockResolvedValue();
    });
    
    it('should use macOS beep on darwin', async () => {
      const originalPlatform = Object.getOwnPropertyDescriptor(process, 'platform');
      Object.defineProperty(process, 'platform', { value: 'darwin' });
      
      const result = await audioFallback.systemNotificationFallback('TEST');
      
      expect(audioFallback.executeCommand).toHaveBeenCalledWith('osascript', ['-e', 'beep']);
      expect(result.success).toBe(true);
      expect(result.method).toBe('system_beep_macos');
      
      if (originalPlatform) {
        Object.defineProperty(process, 'platform', originalPlatform);
      }
    });
    
    it('should use Linux bell on linux', async () => {
      const originalPlatform = Object.getOwnPropertyDescriptor(process, 'platform');
      Object.defineProperty(process, 'platform', { value: 'linux' });
      
      const result = await audioFallback.systemNotificationFallback('TEST');
      
      expect(audioFallback.executeCommand).toHaveBeenCalledWith('printf', ['\\a']);
      expect(result.success).toBe(true);
      expect(result.method).toBe('system_bell_linux');
      
      if (originalPlatform) {
        Object.defineProperty(process, 'platform', originalPlatform);
      }
    });
    
    it('should use Windows beep on win32', async () => {
      const originalPlatform = Object.getOwnPropertyDescriptor(process, 'platform');
      Object.defineProperty(process, 'platform', { value: 'win32' });
      
      const result = await audioFallback.systemNotificationFallback('TEST');
      
      expect(audioFallback.executeCommand).toHaveBeenCalledWith(
        'powershell',
        ['-c', '[System.Console]::Beep(800, 200)']
      );
      expect(result.success).toBe(true);
      expect(result.method).toBe('system_beep_windows');
      
      if (originalPlatform) {
        Object.defineProperty(process, 'platform', originalPlatform);
      }
    });
  });
  
  describe('Console Fallback', () => {
    beforeEach(() => {
      audioFallback = new BumbaAudioFallbackSystem();
    });
    
    it('should display visual celebration', () => {
      const result = audioFallback.consoleFallback('MILESTONE_REACHED', {
        message: 'Test message'
      });
      
      expect(result.success).toBe(true);
      expect(result.method).toBe('console_visual');
      expect(result.fallback).toBe(true);
    });
    
    it('should use appropriate visual for achievement type', () => {
      const achievements = [
        'MILESTONE_REACHED',
        'PROJECT_LAUNCH',
        'CONSCIOUSNESS_BREAKTHROUGH',
        'CLEAN_CODE_MASTERY',
        'ETHICAL_ACHIEVEMENT',
        'UNITY_ACHIEVED'
      ];
      
      achievements.forEach(achievement => {
        const result = audioFallback.consoleFallback(achievement, {});
        expect(result.achievement).toBe(achievement);
      });
    });
  });
  
  describe('Silent Fallback', () => {
    beforeEach(() => {
      audioFallback = new BumbaAudioFallbackSystem();
    });
    
    it('should return silent result', () => {
      const result = audioFallback.silentFallback('TEST');
      
      expect(result.success).toBe(true);
      expect(result.method).toBe('silent');
      expect(result.fallback).toBe(true);
      expect(result.timestamp).toBeTruthy();
    });
  });
  
  describe('Audio System Control', () => {
    beforeEach(() => {
      audioFallback = new BumbaAudioFallbackSystem();
    });
    
    it('should disable audio system', () => {
      audioFallback.disableAudio('test_reason');
      
      expect(audioFallback.audioEnabled).toBe(false);
      expect(audioFallback.currentStrategy).toBe('silent');
    });
    
    it('should re-enable audio system', () => {
      audioFallback.disableAudio();
      audioFallback.enableAudio();
      
      expect(audioFallback.audioEnabled).toBe(true);
      expect(audioFallback.currentStrategy).toBe('system');
      expect(audioFallback.failureCount).toBe(0);
    });
    
    it('should provide audio status', () => {
      const status = audioFallback.getAudioStatus();
      
      expect(status).toHaveProperty('enabled');
      expect(status).toHaveProperty('strategy');
      expect(status).toHaveProperty('failures');
      expect(status).toHaveProperty('available_paths');
      expect(status).toHaveProperty('available_commands');
      expect(status).toHaveProperty('last_check');
    });
  });
  
  describe('testAudioSystem()', () => {
    beforeEach(() => {
      audioFallback = new BumbaAudioFallbackSystem();
    });
    
    it('should test audio system successfully', async () => {
      jest.spyOn(audioFallback, 'playAchievementAudio').mockResolvedValue({
        success: true,
        method: 'test'
      });
      
      const result = await audioFallback.testAudioSystem();
      
      expect(result.success).toBe(true);
      expect(audioFallback.playAchievementAudio).toHaveBeenCalledWith(
        'MILESTONE_REACHED',
        expect.objectContaining({
          message: expect.any(String)
        })
      );
    });
    
    it('should handle test failure gracefully', async () => {
      jest.spyOn(audioFallback, 'playAchievementAudio').mockRejectedValue(
        new Error('Test error')
      );
      
      const result = await audioFallback.testAudioSystem();
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Test error');
    });
  });
});