/**
 * BUMBA Vision Module
 * Visual understanding and implementation capabilities
 */

const VisionAnalyzer = require('./vision-analyzer');
const VisualCommands = require('./visual-commands');
const VisualFeedback = require('./visual-feedback');

/**
 * Initialize vision module
 * @returns {Object} Vision module interface
 */
function initializeVision() {
  const analyzer = new VisionAnalyzer();
  const commands = new VisualCommands();
  const feedback = new VisualFeedback();
  
  return {
    analyzer,
    commands,
    feedback,
    
    // Convenience methods
    analyze: (imagePath) => analyzer.analyzeImage(imagePath),
    implement: (imagePath, options) => commands.implementFromImage(imagePath, options),
    compare: (imagePath, implementation) => commands.compareImplementation(imagePath, implementation),
    getFeedback: (implementation) => feedback.generateFeedback(implementation)
  };
}

module.exports = {
  VisionAnalyzer,
  VisualCommands,
  VisualFeedback,
  initialize: initializeVision
};