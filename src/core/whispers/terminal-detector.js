/**
 * BUMBA Terminal Detector
 * Detects terminal capabilities for Agent Whispers feature
 * Part of the minimal, tasteful enhancement suite
 */

const os = require('os');

class TerminalDetector {
  constructor() {
    this.capabilities = this.detect();
  }

  detect() {
    const platform = os.platform();
    const term = process.env.TERM || '';
    const termProgram = process.env.TERM_PROGRAM || '';
    const isCI = process.env.CI === 'true';
    
    // Terminal type detection
    const terminalType = this.detectTerminalType(termProgram, term);
    
    // Capability detection
    const capabilities = {
      type: terminalType,
      platform,
      
      // Feature support
      supportsTitleBar: this.checkTitleBarSupport(terminalType, platform),
      supportsANSIColor: this.checkColorSupport(term, isCI),
      supportsStatusLine: this.checkStatusLineSupport(terminalType),
      supportsUnicode: this.checkUnicodeSupport(),
      supports256Color: term.includes('256color'),
      supportsTrueColor: this.checkTrueColorSupport(term, termProgram),
      
      // Terminal dimensions
      columns: process.stdout.columns || 80,
      rows: process.stdout.rows || 24,
      
      // Environment
      isCI,
      isTTY: process.stdout.isTTY,
      isDebug: process.env.DEBUG === 'true',
      
      // Recommended features for this terminal
      recommended: {
        whisperLocation: 'title',
        updateInterval: 2000,
        colorMode: 'gradient'
      }
    };
    
    // Adjust recommendations based on terminal
    this.adjustRecommendations(capabilities);
    
    return capabilities;
  }
  
  detectTerminalType(termProgram, term) {
    // macOS terminals
    if (termProgram === 'iTerm.app') return 'iTerm2';
    if (termProgram === 'Apple_Terminal') return 'Terminal.app';
    if (termProgram === 'Hyper') return 'Hyper';
    
    // Cross-platform
    if (termProgram === 'vscode') return 'VSCode';
    if (process.env.TERMINUS_SUBLIME) return 'Terminus';
    if (process.env.ALACRITTY_LOG) return 'Alacritty';
    
    // Windows
    if (process.env.WT_SESSION) return 'WindowsTerminal';
    if (process.env.ConEmuPID) return 'ConEmu';
    
    // Linux
    if (process.env.GNOME_TERMINAL_SERVICE) return 'GnomeTerminal';
    if (term === 'xterm-kitty') return 'Kitty';
    if (process.env.KONSOLE_VERSION) return 'Konsole';
    
    // Default
    if (term.includes('xterm')) return 'xterm';
    return 'unknown';
  }
  
  checkTitleBarSupport(terminalType, platform) {
    // Most modern terminals support title bar updates
    const supported = [
      'iTerm2', 'Terminal.app', 'VSCode', 'Hyper',
      'WindowsTerminal', 'ConEmu', 'GnomeTerminal',
      'Kitty', 'Konsole', 'xterm', 'Alacritty'
    ];
    
    return supported.includes(terminalType);
  }
  
  checkColorSupport(term, isCI) {
    // CI environments often have limited color support
    if (isCI) return false;
    
    // Check for NO_COLOR env var (respect user preference)
    if (process.env.NO_COLOR) return false;
    
    // Check COLORTERM for truecolor support
    if (process.env.COLORTERM) return true;
    
    // Check TERM for color indicators
    return term.includes('color') || term.includes('256');
  }
  
  checkStatusLineSupport(terminalType) {
    // Only some terminals support a separate status line
    const supported = ['iTerm2', 'Kitty', 'Terminus'];
    return supported.includes(terminalType);
  }
  
  checkUnicodeSupport() {
    // Check if unicode is likely supported
    const lang = process.env.LANG || '';
    const lcAll = process.env.LC_ALL || '';
    
    return lang.includes('UTF-8') || 
           lang.includes('UTF8') || 
           lcAll.includes('UTF-8') || 
           lcAll.includes('UTF8');
  }
  
  checkTrueColorSupport(term, termProgram) {
    // Check for true color (24-bit) support
    if (process.env.COLORTERM === 'truecolor' || 
        process.env.COLORTERM === '24bit') {
      return true;
    }
    
    // Known true color terminals
    const trueColorTerminals = [
      'iTerm2', 'VSCode', 'Hyper', 'WindowsTerminal',
      'Kitty', 'Alacritty'
    ];
    
    return trueColorTerminals.includes(this.detectTerminalType(termProgram, term));
  }
  
  adjustRecommendations(capabilities) {
    // Adjust recommendations based on detected capabilities
    
    if (!capabilities.supportsTitleBar) {
      capabilities.recommended.whisperLocation = 'inline';
    }
    
    if (capabilities.supportsStatusLine) {
      capabilities.recommended.whisperLocation = 'statusline';
    }
    
    if (!capabilities.supportsTrueColor) {
      capabilities.recommended.colorMode = 'basic';
    }
    
    if (capabilities.isCI) {
      capabilities.recommended.whisperLocation = 'disabled';
      capabilities.recommended.colorMode = 'none';
    }
    
    if (!capabilities.isTTY) {
      capabilities.recommended.whisperLocation = 'disabled';
    }
  }
  
  // Get current terminal dimensions
  getDimensions() {
    return {
      columns: process.stdout.columns || 80,
      rows: process.stdout.rows || 24
    };
  }
  
  // Check if whispers should be enabled
  shouldEnableWhispers() {
    return this.capabilities.isTTY && 
           !this.capabilities.isCI &&
           (this.capabilities.supportsTitleBar || this.capabilities.supportsStatusLine);
  }
  
  // Get optimal whisper configuration for this terminal
  getOptimalConfig() {
    return {
      enabled: this.shouldEnableWhispers(),
      location: this.capabilities.recommended.whisperLocation,
      colorMode: this.capabilities.recommended.colorMode,
      updateInterval: this.capabilities.recommended.updateInterval,
      useEmoji: this.capabilities.supportsUnicode,
      use256Color: this.capabilities.supports256Color,
      useTrueColor: this.capabilities.supportsTrueColor
    };
  }
}

// Singleton instance
let detector = null;

module.exports = {
  TerminalDetector,
  
  // Get or create singleton detector
  getDetector() {
    if (!detector) {
      detector = new TerminalDetector();
    }
    return detector;
  },
  
  // Quick access methods
  getCapabilities() {
    return this.getDetector().capabilities;
  },
  
  getOptimalConfig() {
    return this.getDetector().getOptimalConfig();
  },
  
  shouldEnableWhispers() {
    return this.getDetector().shouldEnableWhispers();
  }
};