/**
 * Mock for @notionhq/client
 * Used for testing without actual Notion API calls
 */

class MockClient {
  constructor(options = {}) {
    this.auth = options.auth || 'mock-token';
    this.pages = {
      create: jest.fn().mockResolvedValue({ id: 'mock-page-id' }),
      retrieve: jest.fn().mockResolvedValue({ id: 'mock-page-id', properties: {} }),
      update: jest.fn().mockResolvedValue({ id: 'mock-page-id' })
    };
    this.databases = {
      create: jest.fn().mockResolvedValue({ id: 'mock-db-id' }),
      query: jest.fn().mockResolvedValue({ results: [] }),
      retrieve: jest.fn().mockResolvedValue({ id: 'mock-db-id' }),
      update: jest.fn().mockResolvedValue({ id: 'mock-db-id' })
    };
    this.blocks = {
      children: {
        list: jest.fn().mockResolvedValue({ results: [] }),
        append: jest.fn().mockResolvedValue({ results: [] })
      }
    };
    this.users = {
      me: jest.fn().mockResolvedValue({ id: 'mock-user-id', name: 'Mock User' })
    };
  }
}

module.exports = {
  Client: MockClient
};