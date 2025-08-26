/**
 * Tests for Serena MCP Integration
 */

const { serenaIntegration } = require('../../src/core/integrations/serena-integration');
const { mcpServerManager } = require('../../src/core/mcp/mcp-resilience-system');

// Mock the MCP server manager
jest.mock('../../src/core/mcp/mcp-resilience-system');

describe('Serena Integration', () => {
  afterEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    serenaIntegration.initialized = false;
    serenaIntegration.server = null;
  });

  describe('Initialization', () => {
    it('should initialize successfully when Serena is available', async () => {
      mcpServerManager.getServer.mockResolvedValue({
        execute: jest.fn(),
        fallbackType: null
      });

      const result = await serenaIntegration.initialize();
      
      expect(result).toBe(true);
      expect(serenaIntegration.initialized).toBe(true);
      expect(mcpServerManager.getServer).toHaveBeenCalledWith('serena');
    });

    it('should handle fallback when Serena is unavailable', async () => {
      mcpServerManager.getServer.mockResolvedValue({
        execute: jest.fn(),
        fallbackType: 'basic-code-search'
      });

      const result = await serenaIntegration.initialize();
      
      expect(result).toBe(true);
      expect(serenaIntegration.initialized).toBe(true);
    });

    it('should handle initialization errors', async () => {
      mcpServerManager.getServer.mockRejectedValue(new Error('Connection failed'));

      await expect(serenaIntegration.initialize()).rejects.toThrow('SERENA_INIT_FAILED');
    });
  });

  describe('Semantic Search', () => {
    beforeEach(async () => {
      mcpServerManager.getServer.mockResolvedValue({
        execute: jest.fn(),
        fallbackType: null
      });
      await serenaIntegration.initialize();
    });

    it('should perform semantic search', async () => {
      const mockResults = [
        { file: '/src/auth.js', line: 10, match: 'authenticate()' },
        { file: '/src/user.js', line: 25, match: 'validateAuth()' }
      ];
      
      serenaIntegration.server.execute.mockResolvedValue({
        data: mockResults
      });

      const results = await serenaIntegration.semanticSearch('authentication');
      
      expect(results).toEqual(mockResults);
      expect(serenaIntegration.server.execute).toHaveBeenCalledWith('semantic-search', {
        query: 'authentication',
        workspace: process.cwd(),
        language: undefined,
        limit: 20
      });
    });

    it('should handle search with options', async () => {
      serenaIntegration.server.execute.mockResolvedValue({ data: [] });

      await serenaIntegration.semanticSearch('test', {
        language: 'javascript',
        limit: 5,
        workspace: '/custom/path'
      });
      
      expect(serenaIntegration.server.execute).toHaveBeenCalledWith('semantic-search', {
        query: 'test',
        workspace: '/custom/path',
        language: 'javascript',
        limit: 5
      });
    });

    it('should fallback on error', async () => {
      serenaIntegration.server.execute.mockRejectedValue(new Error('Search failed'));

      const result = await serenaIntegration.semanticSearch('test');
      
      expect(result.fallback).toBe(true);
      expect(result.matches).toEqual([]);
    });
  });

  describe('Find References', () => {
    beforeEach(async () => {
      mcpServerManager.getServer.mockResolvedValue({
        execute: jest.fn(),
        fallbackType: null
      });
      await serenaIntegration.initialize();
    });

    it('should find symbol references', async () => {
      const mockReferences = [
        { file: '/src/module1.js', line: 15, column: 10 },
        { file: '/src/module2.js', line: 30, column: 5 }
      ];
      
      serenaIntegration.server.execute.mockResolvedValue({
        data: mockReferences
      });

      const references = await serenaIntegration.findReferences(
        'myFunction',
        '/src/main.js',
        { line: 10, column: 5 }
      );
      
      expect(references).toEqual(mockReferences);
      expect(serenaIntegration.server.execute).toHaveBeenCalledWith('find-references', {
        symbol: 'myFunction',
        file: '/src/main.js',
        line: 10,
        column: 5
      });
    });
  });

  describe('Code Editing', () => {
    beforeEach(async () => {
      mcpServerManager.getServer.mockResolvedValue({
        execute: jest.fn(),
        fallbackType: null
      });
      await serenaIntegration.initialize();
    });

    it('should edit code successfully', async () => {
      const edits = [
        { range: { start: { line: 1, column: 0 }, end: { line: 1, column: 10 } }, newText: 'updated' }
      ];
      
      serenaIntegration.server.execute.mockResolvedValue({
        data: { success: true }
      });

      const result = await serenaIntegration.editCode('/src/file.js', edits);
      
      expect(result.success).toBe(true);
      expect(serenaIntegration.server.execute).toHaveBeenCalledWith('code-edit', {
        file: '/src/file.js',
        edits: edits
      });
    });

    it('should throw error on edit failure', async () => {
      serenaIntegration.server.execute.mockRejectedValue(new Error('Edit failed'));

      await expect(
        serenaIntegration.editCode('/src/file.js', [])
      ).rejects.toThrow('SERENA_EDIT_FAILED');
    });
  });

  describe('Symbol Renaming', () => {
    beforeEach(async () => {
      mcpServerManager.getServer.mockResolvedValue({
        execute: jest.fn(),
        fallbackType: null
      });
      await serenaIntegration.initialize();
    });

    it('should rename symbol across codebase', async () => {
      serenaIntegration.server.execute.mockResolvedValue({
        data: { filesModified: 5 }
      });

      const result = await serenaIntegration.renameSymbol(
        'oldName',
        'newName',
        '/src/main.js',
        { line: 10, column: 5 }
      );
      
      expect(result.filesModified).toBe(5);
      expect(serenaIntegration.server.execute).toHaveBeenCalledWith('rename-symbol', {
        oldName: 'oldName',
        newName: 'newName',
        file: '/src/main.js',
        line: 10,
        column: 5
      });
    });
  });

  describe('Status', () => {
    it('should return correct status when not initialized', () => {
      const status = serenaIntegration.getStatus();
      
      expect(status).toEqual({
        initialized: false,
        serverAvailable: false,
        usingFallback: false,
        capabilities: serenaIntegration.capabilities
      });
    });

    it('should return correct status when using fallback', async () => {
      mcpServerManager.getServer.mockResolvedValue({
        execute: jest.fn(),
        fallbackType: 'basic-code-search'
      });
      await serenaIntegration.initialize();

      const status = serenaIntegration.getStatus();
      
      expect(status).toEqual({
        initialized: true,
        serverAvailable: false,
        usingFallback: true,
        capabilities: serenaIntegration.capabilities
      });
    });
  });
});