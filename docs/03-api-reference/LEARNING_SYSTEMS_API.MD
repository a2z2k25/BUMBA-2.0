# BUMBA Learning Systems API Documentation

## Table of Contents
1. [OptimizationEngine](#optimizationengine)
2. [MLLearningSystem](#mllearningsystem)
3. [HumanLearningModule](#humanlearningmodule)
4. [DataCollectionService](#datacollectionservice)
5. [ModelTrainingService](#modeltrainingservice)
6. [AdaptiveTransferService](#adaptivetransferservice)

---

## OptimizationEngine

The OptimizationEngine provides continuous learning and optimization capabilities for the BUMBA framework.

### Installation
```javascript
const { OptimizationEngine, OptimizationStrategy } = require('./src/core/learning/optimization-engine');
const engine = new OptimizationEngine();
```

### Methods

#### optimize(data, options)
Main optimization method that processes data and applies optimizations.

**Parameters:**
- `data` (Object): Data to optimize
  - `id` (String): Optional identifier
  - `type` (String): Type of optimization
  - `metrics` (Object): Performance metrics
- `options` (Object): Optional optimization settings

**Returns:** Promise<Object>
- `learningResult`: Results from learning process
- `appliedOptimizations`: List of applied optimizations
- `success`: Boolean indicating success

**Example:**
```javascript
const result = await engine.optimize({
  type: 'performance',
  metrics: { speed: 0.8, accuracy: 0.9 }
});
```

#### learnFromExecution(executionData, context)
Learn from execution data to improve future performance.

**Parameters:**
- `executionData` (Object): Execution details
  - `id` (String): Execution identifier
  - `type` (String): Execution type
  - `duration` (Number): Execution time in ms
  - `quality_score` (Number): Quality score (0-1)
- `context` (Object): Additional context

**Returns:** Promise<Object>
- `learning_insights`: Extracted insights
- `performance_analysis`: Performance patterns
- `optimization_recommendations`: Suggested optimizations

### Enums

#### OptimizationStrategy
```javascript
{
  PERFORMANCE: 'performance',
  EFFICIENCY: 'efficiency',
  QUALITY: 'quality',
  COST: 'cost',
  BALANCED: 'balanced',
  ADAPTIVE: 'adaptive'
}
```

---

## MLLearningSystem

Machine learning system for adaptive agent intelligence.

### Installation
```javascript
const { MLLearningSystem, ModelType, LearningStrategy } = require('./src/core/learning/ml-learning-system');
const mlSystem = new MLLearningSystem();
```

### Methods

#### train(data)
Train the ML models with provided data.

**Parameters:**
- `data` (Array|Object): Training data

**Returns:** Promise<Object>
- Training results with metrics

**Example:**
```javascript
await mlSystem.train([
  { input: [1, 2], output: 3 },
  { input: [2, 3], output: 5 }
]);
```

#### learnFromInteraction(interaction)
Learn from agent interactions to improve behavior.

**Parameters:**
- `interaction` (Object):
  - `agentId` (String): Agent identifier
  - `taskType` (String): Type of task
  - `input` (Any): Task input
  - `actions` (Array): Actions taken
  - `output` (Any): Task output
  - `feedback` (Object): Feedback received
  - `performance` (Object): Performance metrics

**Example:**
```javascript
await mlSystem.learnFromInteraction({
  agentId: 'agent-1',
  taskType: 'classification',
  input: { data: 'sample' },
  actions: ['classify'],
  output: { class: 'A' },
  feedback: { score: 0.95 },
  performance: { speed: 100, accuracy: 0.95 }
});
```

#### predictOptimalActions(context)
Predict optimal actions for a given context.

**Parameters:**
- `context` (Object):
  - `agentId` (String): Agent identifier
  - `taskType` (String): Task type
  - `currentState` (Object): Current state
  - `availableActions` (Array): Available actions

**Returns:** Promise<Object>
- `actions`: Predicted optimal actions
- `confidence`: Confidence score
- `reasoning`: Explanation of predictions

#### detectAnomalies(agentId, behavior)
Detect anomalous behavior patterns.

**Parameters:**
- `agentId` (String): Agent identifier
- `behavior` (Object): Behavior to analyze

**Returns:** Promise<Object>
- `isAnomaly`: Boolean indicating anomaly
- `score`: Anomaly score (0-1)
- `explanation`: Explanation of detection

#### transferLearning(sourceAgentId, targetAgentId, options)
Transfer learning between agents.

**Parameters:**
- `sourceAgentId` (String): Source agent
- `targetAgentId` (String): Target agent
- `options` (Object): Transfer options
  - `transferPatterns` (Boolean): Transfer patterns
  - `transferBehaviors` (Boolean): Transfer behaviors
  - `transferRL` (Boolean): Transfer RL knowledge

### Enums

#### ModelType
```javascript
{
  CLASSIFICATION: 'classification',
  REGRESSION: 'regression',
  CLUSTERING: 'clustering',
  REINFORCEMENT: 'reinforcement',
  DEEP_LEARNING: 'deep_learning',
  ENSEMBLE: 'ensemble'
}
```

#### LearningStrategy
```javascript
{
  SUPERVISED: 'supervised',
  UNSUPERVISED: 'unsupervised',
  SEMI_SUPERVISED: 'semi_supervised',
  REINFORCEMENT: 'reinforcement',
  TRANSFER: 'transfer',
  ONLINE: 'online'
}
```

---

## HumanLearningModule

Captures and learns from human feedback and preferences.

### Installation
```javascript
const { HumanLearningModule, LearningStyle, KnowledgeLevel } = require('./src/core/learning/human-learning-module');
const humanModule = HumanLearningModule.getInstance();
```

### Methods

#### learn(feedback, context)
Main learning method for processing feedback.

**Parameters:**
- `feedback` (Object|String): User feedback
- `context` (Object): Context information

**Returns:** Promise<Object>
- `preference`: Captured preference
- `feedback`: Processed feedback
- `adapted`: Whether behavior was adapted

**Example:**
```javascript
const result = await humanModule.learn(
  'I prefer concise error messages',
  { sessionId: 'session-1', projectPath: '/project' }
);
```

#### capturePreferences(feedback, context)
Capture user preferences from feedback.

**Parameters:**
- `feedback` (Object): Feedback data
  - `content` (String): Feedback content
  - `explicit` (Boolean): Whether explicitly stated
- `context` (Object): Context information

**Returns:** Promise<Object>
- Captured preference with confidence score

#### personalizeResponses(userProfile)
Generate personalized response configuration.

**Parameters:**
- `userProfile` (Object): Optional user profile

**Returns:** Promise<Object>
- `style`: Response style
- `preferences`: User preferences
- `adaptations`: Active adaptations
- `codeStyle`: Code style preferences
- `communicationStyle`: Communication preferences

#### processFeedback(feedback)
Process explicit user feedback.

**Parameters:**
- `feedback` (Object): Feedback to process

**Returns:** Promise<Object>
- Processed feedback with sentiment analysis

### Enums

#### LearningStyle
```javascript
{
  VISUAL: 'visual',
  AUDITORY: 'auditory',
  KINESTHETIC: 'kinesthetic',
  READING_WRITING: 'reading_writing',
  MULTIMODAL: 'multimodal'
}
```

#### KnowledgeLevel
```javascript
{
  BEGINNER: 'beginner',
  INTERMEDIATE: 'intermediate',
  ADVANCED: 'advanced',
  EXPERT: 'expert',
  MASTER: 'master'
}
```

---

## DataCollectionService

Centralized service for collecting, validating, and storing learning data.

### Installation
```javascript
const { DataCollectionService } = require('./src/core/learning/data-collection-service');
const dataService = DataCollectionService.getInstance();
```

### Methods

#### collectInteraction(data)
Collect interaction data.

**Parameters:**
- `data` (Object): Interaction data
  - `agentId` (String): Agent identifier
  - `taskType` (String): Task type
  - `input` (Any): Input data
  - `output` (Any): Output data

**Returns:** Promise<Object>
- Enriched interaction data with ID and timestamp

#### collectPattern(pattern)
Collect pattern data.

**Parameters:**
- `pattern` (Object): Pattern data
  - `type` (String): Pattern type
  - `occurrences` (Number): Number of occurrences
  - `successRate` (Number): Success rate (0-1)

**Returns:** Promise<Object>
- Pattern with calculated confidence

#### collectPerformance(metrics)
Collect performance metrics.

**Parameters:**
- `metrics` (Object): Performance metrics

**Returns:** Promise<Object>
- Enriched metrics with calculations

#### collectFeedback(feedback)
Collect user feedback.

**Parameters:**
- `feedback` (Object): Feedback data

**Returns:** Promise<Object>
- Processed feedback with sentiment

#### queryData(query)
Query collected data.

**Parameters:**
- `query` (Object):
  - `type` (String): Data type to query
  - `filter` (Object): Filter criteria
  - `sortBy` (String): Sort field
  - `limit` (Number): Result limit
  - `includeStored` (Boolean): Include stored data

**Returns:** Promise<Array>
- Matching data items

#### aggregateData(aggregation)
Aggregate data for analysis.

**Parameters:**
- `aggregation` (Object):
  - `type` (String): Data type
  - `groupBy` (String): Grouping field
  - `metrics` (Array): Metrics to calculate
  - `timeRange` (Object): Time range filter

**Returns:** Promise<Object>
- Aggregated results

#### exportForTraining(options)
Export data for model training.

**Parameters:**
- `options` (Object):
  - `types` (Array): Data types to export
  - `format` (String): Export format (json, csv, tensorflow)
  - `includeMetadata` (Boolean): Include metadata

**Returns:** Promise<Object>
- Exported data in specified format

---

## ModelTrainingService

Advanced model training and optimization service.

### Installation
```javascript
const { ModelTrainingService } = require('./src/core/learning/model-training-service');
const trainingService = ModelTrainingService.getInstance();
```

### Methods

#### trainModel(config)
Train a new model.

**Parameters:**
- `config` (Object):
  - `data` (Array): Training data
  - `modelType` (String): Type of model
  - `modelConfig` (Object): Model configuration
  - Additional training parameters

**Returns:** Promise<Object>
- `jobId`: Training job ID
- `modelId`: Trained model ID
- `metrics`: Training metrics
- `success`: Success status

**Example:**
```javascript
const result = await trainingService.trainModel({
  data: trainingData,
  modelType: 'neural_network',
  modelConfig: {
    layers: [
      { units: 128, activation: 'relu' },
      { units: 64, activation: 'relu' },
      { units: 10, activation: 'softmax' }
    ]
  }
});
```

#### fineTuneModel(modelId, config)
Fine-tune an existing model.

**Parameters:**
- `modelId` (String): Model to fine-tune
- `config` (Object): Fine-tuning configuration

**Returns:** Promise<Object>
- Fine-tuned model details

#### optimizeHyperparameters(config)
Optimize model hyperparameters.

**Parameters:**
- `config` (Object):
  - `searchSpace` (Object): Hyperparameter search space
  - `trials` (Number): Number of trials
  - Training data and configuration

**Returns:** Promise<Object>
- `bestHyperparameters`: Optimal hyperparameters
- `bestMetrics`: Best performance metrics
- `allTrials`: All trial results

#### createEnsemble(modelIds, config)
Create an ensemble from multiple models.

**Parameters:**
- `modelIds` (Array): Model IDs to ensemble
- `config` (Object):
  - `weights` (Array): Model weights
  - `votingStrategy` (String): Voting strategy

**Returns:** Promise<Object>
- Ensemble model details

#### compressModel(modelId, config)
Compress a model for deployment.

**Parameters:**
- `modelId` (String): Model to compress
- `config` (Object):
  - `method` (String): Compression method (pruning, quantization, distillation)
  - `ratio` (Number): Compression ratio

**Returns:** Promise<Object>
- Compressed model details with size reduction stats

---

## AdaptiveTransferService

Advanced capabilities for adaptive learning and knowledge transfer.

### Installation
```javascript
const { AdaptiveTransferService } = require('./src/core/learning/adaptive-transfer-service');
const adaptiveService = AdaptiveTransferService.getInstance();
```

### Methods

#### adaptBehavior(agentId, context)
Adapt agent behavior based on context.

**Parameters:**
- `agentId` (String): Agent identifier
- `context` (Object):
  - `recentPerformance` (Number): Recent performance score
  - `isNewEnvironment` (Boolean): New environment flag
  - `errorRate` (Number): Error rate

**Returns:** Promise<Object>
- `adapted`: Whether adaptation occurred
- `strategy`: Adaptation strategy used
- `improvements`: Expected improvements

#### transferKnowledge(sourceAgentId, targetAgentId, options)
Transfer knowledge between agents.

**Parameters:**
- `sourceAgentId` (String): Source agent
- `targetAgentId` (String): Target agent
- `options` (Object): Transfer options

**Returns:** Promise<Object>
- `transferred`: Success status
- `knowledgeItems`: Number of items transferred
- `improvement`: Expected improvement

#### metaLearn(agentId, learningHistory)
Perform meta-learning to improve learning.

**Parameters:**
- `agentId` (String): Agent identifier
- `learningHistory` (Array): Historical learning data

**Returns:** Promise<Object>
- `metaKnowledge`: Extracted meta-knowledge
- `patternsAnalyzed`: Number of patterns analyzed

#### curriculumLearning(agentId, tasks)
Set up curriculum learning.

**Parameters:**
- `agentId` (String): Agent identifier
- `tasks` (Array): Tasks to learn

**Returns:** Promise<Object>
- `schedule`: Learning schedule
- `firstTask`: First task to start

#### fewShotLearning(agentId, examples, targetTask)
Learn from minimal examples.

**Parameters:**
- `agentId` (String): Agent identifier
- `examples` (Array): Example input-output pairs (minimum 3)
- `targetTask` (Object): Target task description

**Returns:** Promise<Object>
- `model`: Few-shot model
- `testAccuracy`: Test accuracy

#### reinforcementUpdate(agentId, state, action, reward, nextState)
Update reinforcement learning model.

**Parameters:**
- `agentId` (String): Agent identifier
- `state` (Object): Current state
- `action` (String): Action taken
- `reward` (Number): Reward received
- `nextState` (Object): Next state

**Returns:** Promise<Object>
- `newQValue`: Updated Q-value
- `totalReward`: Cumulative reward

#### multiTaskLearning(agentId, tasks)
Train on multiple tasks simultaneously.

**Parameters:**
- `agentId` (String): Agent identifier
- `tasks` (Array): Tasks to learn

**Returns:** Promise<Object>
- `model`: Multi-task model
- `evaluations`: Performance on each task

---

## Error Handling

All methods return promises that may reject with errors. Common error types:

- `ValidationError`: Invalid input parameters
- `ResourceError`: Resource not available
- `TrainingError`: Training process failed
- `TransferError`: Knowledge transfer failed

Example error handling:
```javascript
try {
  const result = await engine.optimize(data);
} catch (error) {
  if (error.name === 'ValidationError') {
    console.error('Invalid input:', error.message);
  } else {
    console.error('Optimization failed:', error);
  }
}
```

## Best Practices

1. **Initialize Once**: Use singleton pattern for services
2. **Batch Operations**: Collect data in batches for efficiency
3. **Monitor Performance**: Track metrics and adapt accordingly
4. **Clean Old Data**: Regularly cleanup old learning data
5. **Validate Inputs**: Always validate data before processing
6. **Handle Errors**: Implement proper error handling
7. **Use Appropriate Strategies**: Choose the right learning strategy for your use case

## Performance Considerations

- Data collection buffers are flushed every 30 seconds by default
- Training jobs run asynchronously to avoid blocking
- Model compression can reduce size by 50-90%
- Knowledge transfer has configurable thresholds
- Online learning processes streaming data efficiently

---

*Last Updated: 2025-08-17*
*BUMBA Learning Systems v1.0.0*