
describe('Specialist System', () => {
  afterEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  const registry = require('../../../src/core/specialists/specialist-registry');

  test('should load all specialists', async () => {
    const specialists = registry.getAllTypes();
    expect(specialists.length).toBe(44);
  });

  test('should get specialist by type', async () => {
    const specialist = registry.getSpecialist('javascript-specialist');
    expect(specialist).toBeDefined();
  });

  test('should find specialists for tasks', async () => {
    const matches = registry.findSpecialistsForTask('Create React component');
    expect(matches.length).toBeGreaterThan(0);
  });
});
