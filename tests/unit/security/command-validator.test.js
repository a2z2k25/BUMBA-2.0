const CommandValidator = require('../../../src/core/security/command-validator');

// Mock RBAC system
const mockCheckPermission = jest.fn();
jest.mock('../../../src/core/security/rbac-system', () => ({
  getInstance: jest.fn(() => ({
    checkPermission: mockCheckPermission
  }))
}));

describe('CommandValidator', () => {
  afterEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  let validator;

  beforeEach(() => {
    validator = new CommandValidator();
    jest.clearAllMocks();
    // Default to allowing permissions
    mockCheckPermission.mockResolvedValue(true);
  });

  describe('validateCommand (async)', () => {
    it('should reject commands not in whitelist', async () => {
      const result = await validator.validateCommand('rm', ['-rf', '/']);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('not allowed');
    });

    it('should accept whitelisted commands', async () => {
      const result = await validator.validateCommand('git', ['status']);
      expect(result.valid).toBe(true);
      expect(result.sanitized).toBeDefined();
    });

    it('should reject commands with invalid format', async () => {
      const result = await validator.validateCommand('git;ls', []);
      expect(result.valid).toBe(false);
      // The command is not in whitelist, so it will get that error first
      expect(result.error).toContain("Command 'git;ls' is not allowed");
    });

    it('should validate npm install commands', async () => {
      const result = await validator.validateCommand('npm', ['install', 'jest']);
      expect(result.valid).toBe(true);
      expect(result.sanitized.args).toEqual(['install', 'jest']);
    });

    it('should reject npm commands with invalid package names', async () => {
      const result = await validator.validateCommand('npm', ['install', '../../malicious']);
      expect(result.valid).toBe(false);
    });

    it('should validate git commit messages', async () => {
      const result = await validator.validateCommand('git', ['commit', '-m', 'feat: add tests']);
      expect(result.valid).toBe(true);
    });

    it('should reject git commit with shell metacharacters', async () => {
      const result = await validator.validateCommand('git', ['commit', '-m', 'test; rm -rf /']);
      expect(result.valid).toBe(false);
    });

    it('should validate audio player commands', async () => {
      const result = await validator.validateCommand('afplay', [`${process.cwd()}/assets/audio/bumba-horn.mp3`]);
      expect(result.valid).toBe(true);
    });

    it('should sanitize arguments', async () => {
      const result = await validator.validateCommand('git', ['add', 'file\nname']);
      expect(result.valid).toBe(true);
      expect(result.sanitized.args).toEqual(['add', 'filename']);
    });

    it('should check permissions', async () => {
      // Override the default to deny permission for this test
      mockCheckPermission.mockResolvedValueOnce(false);

      const result = await validator.validateCommand('npm', ['install'], { user: 'restricted' });
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Insufficient permissions');
    });

    it('should pass permission check for authorized users', async () => {
      // Permission check should already return true by default
      const result = await validator.validateCommand('npm', ['install'], { user: 'admin' });
      expect(result.valid).toBe(true);
    });
  });

  describe('validateCommandSync', () => {
    it('should throw error indicating sync mode is deprecated', () => {
      expect(() => validator.validateCommandSync('npm', ['list'])).toThrow(
        'Synchronous command validation is no longer supported for security reasons'
      );
    });

    it('should throw error for any command in sync mode', () => {
      expect(() => validator.validateCommandSync('git', ['status'], {})).toThrow(
        'Synchronous command validation is no longer supported'
      );
    });

    it('should throw error even for valid commands', () => {
      expect(() => validator.validateCommandSync('which', ['node'])).toThrow();
      expect(() => validator.validateCommandSync('npm', ['install', 'jest'])).toThrow();
    });

    it('should throw error even for invalid commands', () => {
      expect(() => validator.validateCommandSync('rm', ['-rf', '/'])).toThrow(
        'Synchronous command validation is no longer supported'
      );
    });

    it('should direct users to async method', () => {
      expect(() => validator.validateCommandSync('git', ['add', 'file'])).toThrow(
        'Please use the async validateCommand() method instead'
      );
    });
  });

  describe('validateFilePath', () => {
    it('should reject directory traversal attempts', () => {
      // Test with paths that contain '..' - these get caught by the directory traversal check
      const result = validator.validateFilePath('../../etc/passwd');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Directory traversal detected');
      
      // Test another case - this normalizes to /etc/passwd
      const result2 = validator.validateFilePath('/home/user/../../../etc/passwd');
      // This should be rejected but might be for different reasons
      expect(result2.valid).toBe(false);
    });

    it('should reject relative paths', () => {
      const result = validator.validateFilePath('./config.json');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('absolute paths');
    });

    it('should accept valid absolute paths in allowed directories', () => {
      const result = validator.validateFilePath('/tmp/test.txt');
      expect(result.valid).toBe(true);
      expect(result.sanitized).toBe('/tmp/test.txt');
    });

    it('should normalize paths correctly', () => {
      const result = validator.validateFilePath('/tmp//test/../file.txt');
      expect(result.valid).toBe(true);
      expect(result.sanitized).toBe('/tmp/file.txt');
    });
  });

  describe('isValidPath', () => {
    it('should reject paths with directory traversal', () => {
      expect(validator.isValidPath('../etc/passwd')).toBe(false);
      expect(validator.isValidPath('../../root')).toBe(false);
    });

    it('should accept valid file paths', () => {
      expect(validator.isValidPath(`${process.cwd()}/src/index.js`)).toBe(true);
      expect(validator.isValidPath('src/core/config.js')).toBe(true);
    });
  });

  describe('containsShellMetacharacters', () => {
    it('should detect dangerous shell characters', () => {
      expect(validator.containsShellMetacharacters('test; rm -rf /')).toBe(true);
      expect(validator.containsShellMetacharacters('test && echo bad')).toBe(true);
      expect(validator.containsShellMetacharacters('test | grep')).toBe(true);
      expect(validator.containsShellMetacharacters('test `cmd`')).toBe(true);
      expect(validator.containsShellMetacharacters('test $(cmd)')).toBe(true);
      expect(validator.containsShellMetacharacters('test > file')).toBe(true);
      expect(validator.containsShellMetacharacters('test < input')).toBe(true);
    });

    it('should allow safe strings', () => {
      expect(validator.containsShellMetacharacters('simple-text')).toBe(false);
      expect(validator.containsShellMetacharacters('feat: add new feature')).toBe(false);
      expect(validator.containsShellMetacharacters('hello world')).toBe(false);
    });
  });

  describe('sanitizeArguments', () => {
    it('should remove null bytes', () => {
      const sanitized = validator.sanitizeArguments(['test\0file']);
      expect(sanitized[0]).toBe('testfile');
    });

    it('should escape quotes', () => {
      const sanitized = validator.sanitizeArguments(['test"quote']);
      expect(sanitized[0]).toBe('test\\"quote');
    });

    it('should remove newlines and carriage returns', () => {
      const sanitized = validator.sanitizeArguments(['test\nline\rbreak']);
      expect(sanitized[0]).toBe('testlinebreak');
    });
  });

  describe('validateNpmCommand', () => {
    it('should accept valid npm commands', () => {
      expect(validator.validateNpmCommand(['install'])).toBe(true);
      expect(validator.validateNpmCommand(['run', 'test'])).toBe(true);
      expect(validator.validateNpmCommand(['list'])).toBe(true);
    });

    it('should validate package names in install', () => {
      expect(validator.validateNpmCommand(['install', 'jest'])).toBe(true);
      expect(validator.validateNpmCommand(['install', '@types/jest'])).toBe(true);
      expect(validator.validateNpmCommand(['install', '--save-dev', 'eslint'])).toBe(true);
    });

    it('should reject invalid npm commands', () => {
      expect(validator.validateNpmCommand(['hack'])).toBe(false);
      expect(validator.validateNpmCommand([])).toBe(false);
    });
  });

  describe('validateGitCommand', () => {
    it('should accept valid git commands', () => {
      expect(validator.validateGitCommand(['status'])).toBe(true);
      expect(validator.validateGitCommand(['log'])).toBe(true);
      expect(validator.validateGitCommand(['add', '.'])).toBe(true);
    });

    it('should validate commit messages', () => {
      expect(validator.validateGitCommand(['commit', '-m', 'safe message'])).toBe(true);
      expect(validator.validateGitCommand(['commit', '-m', 'test; danger'])).toBe(false);
    });

    it('should reject invalid git commands', () => {
      expect(validator.validateGitCommand(['push', '--force'])).toBe(false);
      expect(validator.validateGitCommand([])).toBe(false);
    });
  });

  describe('hashSensitiveData', () => {
    it('should create consistent hashes', () => {
      const hash1 = validator.hashSensitiveData('sensitive');
      const hash2 = validator.hashSensitiveData('sensitive');
      expect(hash1).toBe(hash2);
      expect(hash1).toMatch(/^[a-f0-9]{64}$/);
    });

    it('should create different hashes for different data', () => {
      const hash1 = validator.hashSensitiveData('data1');
      const hash2 = validator.hashSensitiveData('data2');
      expect(hash1).not.toBe(hash2);
    });
  });
});