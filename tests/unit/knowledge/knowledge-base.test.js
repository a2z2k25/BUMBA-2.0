/**
 * BUMBA Knowledge Base System Tests
 */

const { KnowledgeBase } = require('../../../src/core/knowledge/knowledge-base');
const fs = require('fs').promises;
const path = require('path');

// Mock dependencies
jest.mock('fs').promises;
jest.mock('../../../src/core/logging/bumba-logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  }
}));

jest.mock('../../../src/core/config/bumba-config', () => ({
  getInstance: jest.fn(() => ({
    get: jest.fn(),
    getSection: jest.fn()
  }))
}));

describe('KnowledgeBase', () => {
  let knowledgeBase;
  let mockFs;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock file system
    mockFs = {
      mkdir: jest.fn().mockResolvedValue(),
      readdir: jest.fn().mockResolvedValue([]),
      readFile: jest.fn(),
      writeFile: jest.fn().mockResolvedValue(),
      unlink: jest.fn().mockResolvedValue()
    };
    
    fs.mkdir = mockFs.mkdir;
    fs.readdir = mockFs.readdir;
    fs.readFile = mockFs.readFile;
    fs.writeFile = mockFs.writeFile;
    fs.unlink = mockFs.unlink;
    
    knowledgeBase = new KnowledgeBase({
      autoSave: false // Disable auto-save for tests
    });
  });
  
  afterEach(() => {
    if (knowledgeBase) {
      knowledgeBase.destroy();
    }
  });
  
  describe('Initialization', () => {
    it('should initialize knowledge base', async () => {
      expect(knowledgeBase.entries.size).toBe(0);
      expect(knowledgeBase.categories.size).toBe(0);
      expect(knowledgeBase.tags.size).toBe(0);
    });
    
    it('should create base directory on initialization', async () => {
      await knowledgeBase.initialize();
      expect(mockFs.mkdir).toHaveBeenCalled();
    });
    
    it('should load configuration from environment variables', () => {
      process.env.BUMBA_KNOWLEDGE_BASE_PATH = '/test/path';
      process.env.BUMBA_KNOWLEDGE_MAX_ENTRIES = '5000';
      
      const kb = new KnowledgeBase();
      
      expect(kb.config.basePath).toBe('/test/path');
      expect(kb.config.maxEntries).toBe(5000);
      
      delete process.env.BUMBA_KNOWLEDGE_BASE_PATH;
      delete process.env.BUMBA_KNOWLEDGE_MAX_ENTRIES;
    });
  });
  
  describe('Adding Entries', () => {
    it('should add a knowledge entry', async () => {
      const entry = {
        title: 'Test Entry',
        content: 'Test content',
        category: 'test',
        tags: ['test', 'example']
      };
      
      const result = await knowledgeBase.add(entry);
      
      expect(result.id).toBeDefined();
      expect(result.title).toBe('Test Entry');
      expect(result.created).toBeDefined();
      expect(result.version).toBe(1);
      expect(knowledgeBase.entries.size).toBe(1);
    });
    
    it('should validate entry before adding', async () => {
      await expect(knowledgeBase.add(null)).rejects.toThrow('Entry must be an object');
      await expect(knowledgeBase.add({})).rejects.toThrow('Entry must have title or content');
    });
    
    it('should update categories when adding entry', async () => {
      const entry = {
        title: 'Test',
        category: 'documentation'
      };
      
      await knowledgeBase.add(entry);
      
      expect(knowledgeBase.categories.has('documentation')).toBe(true);
      expect(knowledgeBase.categories.get('documentation').size).toBe(1);
    });
    
    it('should update tags when adding entry', async () => {
      const entry = {
        title: 'Test',
        tags: ['api', 'reference']
      };
      
      await knowledgeBase.add(entry);
      
      expect(knowledgeBase.tags.has('api')).toBe(true);
      expect(knowledgeBase.tags.has('reference')).toBe(true);
    });
    
    it('should index entry when added', async () => {
      const entry = {
        title: 'Test',
        type: 'guide',
        author: 'system'
      };
      
      const result = await knowledgeBase.add(entry);
      
      expect(knowledgeBase.index.byId.has(result.id)).toBe(true);
      expect(knowledgeBase.index.byType.has('guide')).toBe(true);
      expect(knowledgeBase.index.byAuthor.has('system')).toBe(true);
    });
  });
  
  describe('Getting Entries', () => {
    beforeEach(async () => {
      await knowledgeBase.add({
        id: 'test-1',
        title: 'Test Entry 1',
        content: 'Content 1'
      });
    });
    
    it('should get entry by ID', () => {
      const entry = knowledgeBase.get('test-1');
      
      expect(entry).toBeDefined();
      expect(entry.title).toBe('Test Entry 1');
      expect(knowledgeBase.stats.cacheHits).toBe(1);
    });
    
    it('should return undefined for non-existent entry', () => {
      const entry = knowledgeBase.get('non-existent');
      
      expect(entry).toBeUndefined();
      expect(knowledgeBase.stats.cacheMisses).toBe(1);
    });
  });
  
  describe('Updating Entries', () => {
    let entryId;
    
    beforeEach(async () => {
      const entry = await knowledgeBase.add({
        title: 'Original Title',
        content: 'Original content'
      });
      entryId = entry.id;
    });
    
    it('should update an existing entry', async () => {
      const updated = await knowledgeBase.update(entryId, {
        title: 'Updated Title',
        content: 'Updated content'
      });
      
      expect(updated.title).toBe('Updated Title');
      expect(updated.content).toBe('Updated content');
      expect(updated.version).toBe(2);
      expect(updated.created).toBeDefined();
      expect(updated.updated).toBeDefined();
    });
    
    it('should throw error when updating non-existent entry', async () => {
      await expect(knowledgeBase.update('non-existent', {}))
        .rejects.toThrow('Knowledge entry not found');
    });
  });
  
  describe('Deleting Entries', () => {
    let entryId;
    
    beforeEach(async () => {
      const entry = await knowledgeBase.add({
        title: 'To Delete',
        category: 'test',
        tags: ['delete', 'test']
      });
      entryId = entry.id;
    });
    
    it('should delete an existing entry', async () => {
      const result = await knowledgeBase.delete(entryId);
      
      expect(result).toBe(true);
      expect(knowledgeBase.entries.has(entryId)).toBe(false);
      expect(knowledgeBase.stats.totalEntries).toBe(0);
    });
    
    it('should remove entry from categories and tags', async () => {
      await knowledgeBase.delete(entryId);
      
      const categoryEntries = knowledgeBase.categories.get('test');
      expect(categoryEntries).toBeDefined();
      expect(categoryEntries.has(entryId)).toBe(false);
    });
    
    it('should return false when deleting non-existent entry', async () => {
      const result = await knowledgeBase.delete('non-existent');
      expect(result).toBe(false);
    });
  });
  
  describe('Querying', () => {
    beforeEach(async () => {
      // Add test entries
      await knowledgeBase.add({
        title: 'API Guide',
        category: 'documentation',
        type: 'guide',
        tags: ['api', 'reference'],
        author: 'system'
      });
      
      await knowledgeBase.add({
        title: 'User Manual',
        category: 'documentation',
        type: 'manual',
        tags: ['user', 'guide'],
        author: 'admin'
      });
      
      await knowledgeBase.add({
        title: 'Code Example',
        category: 'examples',
        type: 'code',
        tags: ['code', 'example'],
        author: 'system'
      });
    });
    
    it('should query by category', () => {
      const results = knowledgeBase.query({ category: 'documentation' });
      
      expect(results.length).toBe(2);
      expect(results[0].category).toBe('documentation');
      expect(results[1].category).toBe('documentation');
    });
    
    it('should query by tags', () => {
      const results = knowledgeBase.query({ tags: ['api'] });
      
      expect(results.length).toBe(1);
      expect(results[0].title).toBe('API Guide');
    });
    
    it('should query by type', () => {
      const results = knowledgeBase.query({ type: 'guide' });
      
      expect(results.length).toBe(1);
      expect(results[0].type).toBe('guide');
    });
    
    it('should query by author', () => {
      const results = knowledgeBase.query({ author: 'system' });
      
      expect(results.length).toBe(2);
    });
    
    it('should perform full-text search', () => {
      const results = knowledgeBase.query({ search: 'guide' });
      
      expect(results.length).toBe(2);
    });
    
    it('should limit query results', () => {
      const results = knowledgeBase.query({ limit: 2 });
      
      expect(results.length).toBe(2);
    });
    
    it('should cache query results', () => {
      const query = { category: 'documentation' };
      
      knowledgeBase.query(query);
      expect(knowledgeBase.stats.cacheMisses).toBe(1);
      
      knowledgeBase.query(query);
      expect(knowledgeBase.stats.cacheHits).toBe(1);
    });
  });
  
  describe('Related Entries', () => {
    let entry1Id, entry2Id, entry3Id;
    
    beforeEach(async () => {
      const entry1 = await knowledgeBase.add({
        title: 'Entry 1',
        relatedTo: []
      });
      entry1Id = entry1.id;
      
      const entry2 = await knowledgeBase.add({
        title: 'Entry 2',
        relatedTo: [entry1Id]
      });
      entry2Id = entry2.id;
      
      const entry3 = await knowledgeBase.add({
        title: 'Entry 3',
        relatedTo: [entry2Id]
      });
      entry3Id = entry3.id;
      
      // Update relationships
      knowledgeBase.relationships.set(entry2Id, new Set([entry1Id]));
      knowledgeBase.relationships.set(entry3Id, new Set([entry2Id]));
    });
    
    it('should get directly related entries', () => {
      const related = knowledgeBase.getRelated(entry2Id, 1);
      
      expect(related.length).toBe(1);
      expect(related[0].id).toBe(entry1Id);
    });
    
    it('should get related entries with depth', () => {
      const related = knowledgeBase.getRelated(entry3Id, 2);
      
      expect(related.length).toBe(2);
      const ids = related.map(e => e.id);
      expect(ids).toContain(entry1Id);
      expect(ids).toContain(entry2Id);
    });
    
    it('should return empty array for entry with no relations', () => {
      const related = knowledgeBase.getRelated(entry1Id, 1);
      expect(related.length).toBe(0);
    });
  });
  
  describe('Persistence', () => {
    it('should save entry to disk when auto-save is enabled', async () => {
      knowledgeBase.config.autoSave = true;
      
      const entry = await knowledgeBase.add({
        title: 'Test Save',
        content: 'Save content'
      });
      
      expect(mockFs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining(`${entry.id}.json`),
        expect.any(String)
      );
    });
    
    it('should load entries from disk', async () => {
      mockFs.readdir.mockResolvedValue(['entry1.json', 'entry2.json']);
      mockFs.readFile.mockResolvedValue(JSON.stringify({
        id: 'entry1',
        title: 'Loaded Entry',
        content: 'Loaded content'
      }));
      
      await knowledgeBase.loadFromDisk();
      
      expect(mockFs.readdir).toHaveBeenCalled();
      expect(mockFs.readFile).toHaveBeenCalledTimes(2);
    });
    
    it('should delete entry from disk', async () => {
      knowledgeBase.config.autoSave = true;
      
      const entry = await knowledgeBase.add({
        title: 'To Delete'
      });
      
      await knowledgeBase.delete(entry.id);
      
      expect(mockFs.unlink).toHaveBeenCalledWith(
        expect.stringContaining(`${entry.id}.json`)
      );
    });
    
    it('should save all entries to disk', async () => {
      await knowledgeBase.add({ title: 'Entry 1' });
      await knowledgeBase.add({ title: 'Entry 2' });
      
      const saved = await knowledgeBase.saveAll();
      
      expect(saved).toBe(2);
      expect(mockFs.writeFile).toHaveBeenCalledTimes(2);
    });
  });
  
  describe('Statistics', () => {
    it('should track knowledge base statistics', async () => {
      await knowledgeBase.add({
        title: 'Test',
        category: 'test',
        tags: ['tag1', 'tag2']
      });
      
      const stats = knowledgeBase.getStats();
      
      expect(stats.totalEntries).toBe(1);
      expect(stats.categoriesCount).toBe(1);
      expect(stats.tagsCount).toBe(2);
      expect(stats.queriesExecuted).toBe(0);
    });
  });
  
  describe('Cleanup', () => {
    it('should clear all knowledge', async () => {
      await knowledgeBase.add({ title: 'Entry 1' });
      await knowledgeBase.add({ title: 'Entry 2' });
      
      await knowledgeBase.clear();
      
      expect(knowledgeBase.entries.size).toBe(0);
      expect(knowledgeBase.categories.size).toBe(0);
      expect(knowledgeBase.tags.size).toBe(0);
      expect(knowledgeBase.stats.totalEntries).toBe(0);
    });
    
    it('should destroy knowledge base properly', () => {
      knowledgeBase.destroy();
      
      expect(knowledgeBase.entries.size).toBe(0);
      expect(knowledgeBase.queryCache.size).toBe(0);
    });
  });
});