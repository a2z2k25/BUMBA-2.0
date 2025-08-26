const UnifiedSpecialistBase = require('../../unified-specialist-base');
const { logger } = require('../../logging/bumba-logger');

/**
 * Kotlin Specialist
 * Expertise: Kotlin, Android, JVM, Coroutines
 */
class KotlinSpecialist extends UnifiedSpecialistBase {
  constructor(department, context = {}) {
    super({
      id: 'kotlin-specialist',
      name: 'Kotlin Specialist',
      type: 'kotlin-specialist',
      category: 'technical',
      department: department,
      expertise: {
        'kotlin': true,
        'android': true,
        'jvm': true,
        'coroutines': true
      },
      capabilities: [
        'Kotlin',
        'Android Development',
        'JVM',
        'Coroutines',
        'Multiplatform'
      ],
      ...context
    });
    this.displayName = 'Kotlin Specialist';
  }
}

module.exports = KotlinSpecialist;