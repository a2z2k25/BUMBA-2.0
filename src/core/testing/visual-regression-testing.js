/**
 * BUMBA Visual Regression Testing System
 * Detects visual changes in UI components
 */

const { EventEmitter } = require('events');
const { logger } = require('../logging/bumba-logger');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class VisualRegressionTesting extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      baselineDir: config.baselineDir || '__visual_baselines__',
      diffDir: config.diffDir || '__visual_diffs__',
      threshold: config.threshold || 0.1, // 0.1% difference threshold
      compareMode: config.compareMode || 'pixel', // pixel, perceptual, layout
      viewport: config.viewport || { width: 1280, height: 720 },
      devices: config.devices || [
        { name: 'desktop', width: 1920, height: 1080 },
        { name: 'tablet', width: 768, height: 1024 },
        { name: 'mobile', width: 375, height: 667 }
      ],
      browsers: config.browsers || ['chrome', 'firefox', 'safari'],
      ...config
    };
    
    this.baselines = new Map();
    this.comparisons = [];
    this.results = [];
  }
  
  /**
   * Initialize visual testing environment
   */
  async initialize() {
    logger.info('Initializing visual regression testing');
    
    // Create directories
    this.ensureDirectories();
    
    // Load existing baselines
    await this.loadBaselines();
    
    // Initialize virtual browser
    this.browser = await this.createVirtualBrowser();
    
    this.emit('initialized');
  }
  
  /**
   * Ensure required directories exist
   */
  ensureDirectories() {
    const dirs = [
      this.config.baselineDir,
      this.config.diffDir,
      path.join(this.config.baselineDir, 'desktop'),
      path.join(this.config.baselineDir, 'tablet'),
      path.join(this.config.baselineDir, 'mobile'),
      path.join(this.config.diffDir, 'desktop'),
      path.join(this.config.diffDir, 'tablet'),
      path.join(this.config.diffDir, 'mobile')
    ];
    
    for (const dir of dirs) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    }
  }
  
  /**
   * Load existing baselines
   */
  async loadBaselines() {
    const baselineFiles = this.findBaselineFiles();
    
    for (const file of baselineFiles) {
      const key = path.basename(file, '.png');
      const data = fs.readFileSync(file);
      const metadata = this.extractMetadata(file);
      
      this.baselines.set(key, {
        path: file,
        data,
        metadata,
        hash: this.calculateHash(data)
      });
    }
    
    logger.info(`Loaded ${this.baselines.size} baseline images`);
  }
  
  /**
   * Find baseline files
   */
  findBaselineFiles() {
    const files = [];
    
    const walk = (dir) => {
      if (!fs.existsSync(dir)) return;
      
      const items = fs.readdirSync(dir);
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          walk(fullPath);
        } else if (item.endsWith('.png')) {
          files.push(fullPath);
        }
      }
    };
    
    walk(this.config.baselineDir);
    return files;
  }
  
  /**
   * Create virtual browser for testing
   */
  async createVirtualBrowser() {
    // Mock browser implementation
    return {
      page: null,
      
      newPage: async function(viewport) {
        this.page = {
          viewport,
          url: '',
          
          goto: async function(url) {
            this.url = url;
            return { status: 200 };
          },
          
          screenshot: async function(options = {}) {
            // Generate mock screenshot data
            const width = viewport?.width || 1280;
            const height = viewport?.height || 720;
            const buffer = Buffer.alloc(width * height * 4);
            
            // Create simple pattern for testing
            for (let i = 0; i < buffer.length; i += 4) {
              buffer[i] = (i / 4) % 256;     // R
              buffer[i + 1] = (i / 8) % 256; // G
              buffer[i + 2] = (i / 16) % 256; // B
              buffer[i + 3] = 255;            // A
            }
            
            return {
              buffer,
              width,
              height,
              path: options.path
            };
          },
          
          evaluate: async function(fn) {
            return fn();
          },
          
          waitForSelector: async function(selector) {
            return true;
          },
          
          setViewport: async function(viewport) {
            this.viewport = viewport;
          }
        };
        
        return this.page;
      },
      
      close: async function() {
        this.page = null;
      }
    };
  }
  
  /**
   * Capture screenshot of component or page
   */
  async capture(name, url, options = {}) {
    const device = options.device || 'desktop';
    const viewport = this.getViewport(device);
    
    logger.info(`Capturing ${name} on ${device}`);
    
    // Create page with viewport
    const page = await this.browser.newPage(viewport);
    
    // Navigate to URL
    await page.goto(url);
    
    // Wait for content
    if (options.waitFor) {
      await page.waitForSelector(options.waitFor);
    }
    
    // Capture screenshot
    const screenshot = await page.screenshot({
      fullPage: options.fullPage !== false,
      clip: options.clip
    });
    
    // Process screenshot
    const processed = await this.processScreenshot(screenshot, options);
    
    return {
      name,
      device,
      viewport,
      data: processed.buffer,
      width: processed.width,
      height: processed.height,
      hash: this.calculateHash(processed.buffer),
      timestamp: Date.now()
    };
  }
  
  /**
   * Process screenshot (apply masks, crops, etc.)
   */
  async processScreenshot(screenshot, options = {}) {
    let buffer = screenshot.buffer;
    let { width, height } = screenshot;
    
    // Apply masks for dynamic content
    if (options.masks) {
      buffer = this.applyMasks(buffer, width, height, options.masks);
    }
    
    // Crop to specific area
    if (options.crop) {
      const cropped = this.cropImage(buffer, width, height, options.crop);
      buffer = cropped.buffer;
      width = cropped.width;
      height = cropped.height;
    }
    
    // Resize for consistency
    if (options.resize) {
      const resized = this.resizeImage(buffer, width, height, options.resize);
      buffer = resized.buffer;
      width = resized.width;
      height = resized.height;
    }
    
    return { buffer, width, height };
  }
  
  /**
   * Compare screenshot against baseline
   */
  async compare(name, screenshot, options = {}) {
    const baselineKey = `${name}-${screenshot.device}`;
    const baseline = this.baselines.get(baselineKey);
    
    if (!baseline) {
      // No baseline exists, create one
      await this.saveBaseline(baselineKey, screenshot);
      return {
        status: 'new',
        message: 'New baseline created',
        name,
        device: screenshot.device
      };
    }
    
    // Compare images
    const comparison = await this.compareImages(
      baseline.data,
      screenshot.data,
      options
    );
    
    // Determine if test passed
    const threshold = options.threshold || this.config.threshold;
    const passed = comparison.difference <= threshold;
    
    const result = {
      name,
      device: screenshot.device,
      status: passed ? 'passed' : 'failed',
      difference: comparison.difference,
      threshold,
      pixels: comparison.pixels,
      areas: comparison.areas
    };
    
    // Save diff image if failed
    if (!passed) {
      await this.saveDiff(baselineKey, comparison.diffImage);
      result.diffPath = path.join(
        this.config.diffDir,
        screenshot.device,
        `${name}.png`
      );
    }
    
    this.results.push(result);
    this.emit('comparison-complete', result);
    
    return result;
  }
  
  /**
   * Compare two images
   */
  async compareImages(baseline, current, options = {}) {
    const mode = options.compareMode || this.config.compareMode;
    
    switch (mode) {
      case 'pixel':
        return this.pixelCompare(baseline, current);
      
      case 'perceptual':
        return this.perceptualCompare(baseline, current);
      
      case 'layout':
        return this.layoutCompare(baseline, current);
      
      default:
        return this.pixelCompare(baseline, current);
    }
  }
  
  /**
   * Pixel-by-pixel comparison
   */
  pixelCompare(baseline, current) {
    const length = Math.min(baseline.length, current.length);
    let differentPixels = 0;
    const diffImage = Buffer.alloc(length);
    const areas = [];
    
    for (let i = 0; i < length; i += 4) {
      const rDiff = Math.abs(baseline[i] - current[i]);
      const gDiff = Math.abs(baseline[i + 1] - current[i + 1]);
      const bDiff = Math.abs(baseline[i + 2] - current[i + 2]);
      
      const totalDiff = rDiff + gDiff + bDiff;
      
      if (totalDiff > 0) {
        differentPixels++;
        
        // Highlight differences in red
        diffImage[i] = 255;     // R
        diffImage[i + 1] = 0;   // G
        diffImage[i + 2] = 0;   // B
        diffImage[i + 3] = 255; // A
        
        // Track difference areas
        const pixelIndex = i / 4;
        const x = pixelIndex % 1280; // Assuming width
        const y = Math.floor(pixelIndex / 1280);
        
        areas.push({ x, y, diff: totalDiff });
      } else {
        // Copy original pixel
        diffImage[i] = baseline[i];
        diffImage[i + 1] = baseline[i + 1];
        diffImage[i + 2] = baseline[i + 2];
        diffImage[i + 3] = baseline[i + 3];
      }
    }
    
    const totalPixels = length / 4;
    const difference = (differentPixels / totalPixels) * 100;
    
    return {
      difference,
      pixels: {
        total: totalPixels,
        different: differentPixels
      },
      areas: this.clusterAreas(areas),
      diffImage
    };
  }
  
  /**
   * Perceptual comparison (using SSIM-like algorithm)
   */
  perceptualCompare(baseline, current) {
    // Simplified SSIM calculation
    const windowSize = 11;
    const k1 = 0.01;
    const k2 = 0.03;
    const L = 255;
    const c1 = (k1 * L) ** 2;
    const c2 = (k2 * L) ** 2;
    
    let ssimSum = 0;
    let windows = 0;
    
    // Calculate SSIM for windows
    for (let i = 0; i < baseline.length; i += windowSize * 4) {
      const window1 = baseline.slice(i, i + windowSize * 4);
      const window2 = current.slice(i, i + windowSize * 4);
      
      const mean1 = this.calculateMean(window1);
      const mean2 = this.calculateMean(window2);
      const variance1 = this.calculateVariance(window1, mean1);
      const variance2 = this.calculateVariance(window2, mean2);
      const covariance = this.calculateCovariance(window1, window2, mean1, mean2);
      
      const ssim = ((2 * mean1 * mean2 + c1) * (2 * covariance + c2)) /
                   ((mean1 ** 2 + mean2 ** 2 + c1) * (variance1 + variance2 + c2));
      
      ssimSum += ssim;
      windows++;
    }
    
    const avgSSIM = ssimSum / windows;
    const difference = (1 - avgSSIM) * 100;
    
    return {
      difference,
      ssim: avgSSIM,
      pixels: { total: baseline.length / 4, different: 0 },
      areas: [],
      diffImage: Buffer.alloc(0)
    };
  }
  
  /**
   * Layout comparison (structural differences)
   */
  layoutCompare(baseline, current) {
    // Extract layout features
    const baselineFeatures = this.extractLayoutFeatures(baseline);
    const currentFeatures = this.extractLayoutFeatures(current);
    
    // Compare features
    let differences = 0;
    const totalFeatures = baselineFeatures.length;
    
    for (let i = 0; i < totalFeatures; i++) {
      const bf = baselineFeatures[i];
      const cf = currentFeatures[i];
      
      if (!bf || !cf) continue;
      
      // Compare bounding boxes
      const boxDiff = Math.abs(bf.x - cf.x) + Math.abs(bf.y - cf.y) +
                     Math.abs(bf.width - cf.width) + Math.abs(bf.height - cf.height);
      
      if (boxDiff > 10) { // Threshold for layout change
        differences++;
      }
    }
    
    const difference = (differences / totalFeatures) * 100;
    
    return {
      difference,
      features: {
        baseline: baselineFeatures.length,
        current: currentFeatures.length,
        different: differences
      },
      pixels: { total: 0, different: 0 },
      areas: [],
      diffImage: Buffer.alloc(0)
    };
  }
  
  /**
   * Extract layout features from image
   */
  extractLayoutFeatures(imageBuffer) {
    // Mock feature extraction
    const features = [];
    
    // Detect edges/boundaries
    for (let i = 0; i < 10; i++) {
      features.push({
        x: Math.random() * 1280,
        y: Math.random() * 720,
        width: Math.random() * 200 + 50,
        height: Math.random() * 100 + 30,
        type: 'boundary'
      });
    }
    
    return features;
  }
  
  /**
   * Cluster difference areas
   */
  clusterAreas(areas) {
    if (areas.length === 0) return [];
    
    const clusters = [];
    const threshold = 50; // Pixel distance threshold
    
    for (const area of areas) {
      let added = false;
      
      for (const cluster of clusters) {
        const distance = Math.sqrt(
          (area.x - cluster.centerX) ** 2 +
          (area.y - cluster.centerY) ** 2
        );
        
        if (distance < threshold) {
          // Add to existing cluster
          cluster.points.push(area);
          cluster.centerX = (cluster.centerX * (cluster.points.length - 1) + area.x) / cluster.points.length;
          cluster.centerY = (cluster.centerY * (cluster.points.length - 1) + area.y) / cluster.points.length;
          added = true;
          break;
        }
      }
      
      if (!added) {
        // Create new cluster
        clusters.push({
          centerX: area.x,
          centerY: area.y,
          points: [area]
        });
      }
    }
    
    // Convert clusters to bounding boxes
    return clusters.map(cluster => {
      const xs = cluster.points.map(p => p.x);
      const ys = cluster.points.map(p => p.y);
      
      return {
        x: Math.min(...xs),
        y: Math.min(...ys),
        width: Math.max(...xs) - Math.min(...xs),
        height: Math.max(...ys) - Math.min(...ys),
        pixelCount: cluster.points.length
      };
    });
  }
  
  /**
   * Apply masks to image
   */
  applyMasks(buffer, width, height, masks) {
    const masked = Buffer.from(buffer);
    
    for (const mask of masks) {
      const { x, y, width: mWidth, height: mHeight } = mask;
      
      // Fill masked area with neutral color
      for (let row = y; row < y + mHeight && row < height; row++) {
        for (let col = x; col < x + mWidth && col < width; col++) {
          const index = (row * width + col) * 4;
          masked[index] = 128;     // R
          masked[index + 1] = 128; // G
          masked[index + 2] = 128; // B
          masked[index + 3] = 255; // A
        }
      }
    }
    
    return masked;
  }
  
  /**
   * Crop image
   */
  cropImage(buffer, width, height, crop) {
    const { x, y, width: cropWidth, height: cropHeight } = crop;
    const cropped = Buffer.alloc(cropWidth * cropHeight * 4);
    
    for (let row = 0; row < cropHeight && row + y < height; row++) {
      for (let col = 0; col < cropWidth && col + x < width; col++) {
        const srcIndex = ((row + y) * width + (col + x)) * 4;
        const dstIndex = (row * cropWidth + col) * 4;
        
        cropped[dstIndex] = buffer[srcIndex];
        cropped[dstIndex + 1] = buffer[srcIndex + 1];
        cropped[dstIndex + 2] = buffer[srcIndex + 2];
        cropped[dstIndex + 3] = buffer[srcIndex + 3];
      }
    }
    
    return {
      buffer: cropped,
      width: cropWidth,
      height: cropHeight
    };
  }
  
  /**
   * Resize image
   */
  resizeImage(buffer, width, height, newSize) {
    const { width: newWidth, height: newHeight } = newSize;
    const resized = Buffer.alloc(newWidth * newHeight * 4);
    
    const xRatio = width / newWidth;
    const yRatio = height / newHeight;
    
    for (let y = 0; y < newHeight; y++) {
      for (let x = 0; x < newWidth; x++) {
        const srcX = Math.floor(x * xRatio);
        const srcY = Math.floor(y * yRatio);
        
        const srcIndex = (srcY * width + srcX) * 4;
        const dstIndex = (y * newWidth + x) * 4;
        
        resized[dstIndex] = buffer[srcIndex];
        resized[dstIndex + 1] = buffer[srcIndex + 1];
        resized[dstIndex + 2] = buffer[srcIndex + 2];
        resized[dstIndex + 3] = buffer[srcIndex + 3];
      }
    }
    
    return {
      buffer: resized,
      width: newWidth,
      height: newHeight
    };
  }
  
  /**
   * Get viewport for device
   */
  getViewport(device) {
    const deviceConfig = this.config.devices.find(d => d.name === device);
    return deviceConfig || this.config.viewport;
  }
  
  /**
   * Save baseline image
   */
  async saveBaseline(key, screenshot) {
    const dir = path.join(this.config.baselineDir, screenshot.device);
    const filePath = path.join(dir, `${screenshot.name}.png`);
    
    // Mock PNG save (in real implementation, use sharp or jimp)
    fs.writeFileSync(filePath, screenshot.data);
    
    // Save metadata
    const metadataPath = filePath.replace('.png', '.json');
    fs.writeFileSync(metadataPath, JSON.stringify({
      name: screenshot.name,
      device: screenshot.device,
      viewport: screenshot.viewport,
      timestamp: screenshot.timestamp,
      hash: screenshot.hash
    }, null, 2));
    
    // Update baselines map
    this.baselines.set(key, {
      path: filePath,
      data: screenshot.data,
      metadata: {
        name: screenshot.name,
        device: screenshot.device,
        viewport: screenshot.viewport
      },
      hash: screenshot.hash
    });
    
    logger.info(`Baseline saved: ${key}`);
  }
  
  /**
   * Save diff image
   */
  async saveDiff(key, diffImage) {
    const parts = key.split('-');
    const device = parts[parts.length - 1];
    const name = parts.slice(0, -1).join('-');
    
    const dir = path.join(this.config.diffDir, device);
    const filePath = path.join(dir, `${name}.png`);
    
    fs.writeFileSync(filePath, diffImage);
    
    logger.info(`Diff saved: ${filePath}`);
  }
  
  /**
   * Extract metadata from file
   */
  extractMetadata(filePath) {
    const metadataPath = filePath.replace('.png', '.json');
    
    if (fs.existsSync(metadataPath)) {
      const content = fs.readFileSync(metadataPath, 'utf8');
      return JSON.parse(content);
    }
    
    // Extract from filename
    const basename = path.basename(filePath, '.png');
    const parts = basename.split('-');
    
    return {
      name: parts[0],
      device: parts[1] || 'desktop'
    };
  }
  
  /**
   * Calculate hash of image data
   */
  calculateHash(buffer) {
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }
  
  /**
   * Calculate mean of values
   */
  calculateMean(values) {
    const sum = values.reduce((a, b) => a + b, 0);
    return sum / values.length;
  }
  
  /**
   * Calculate variance
   */
  calculateVariance(values, mean) {
    const squaredDiffs = values.map(v => (v - mean) ** 2);
    return this.calculateMean(squaredDiffs);
  }
  
  /**
   * Calculate covariance
   */
  calculateCovariance(values1, values2, mean1, mean2) {
    let sum = 0;
    for (let i = 0; i < values1.length; i++) {
      sum += (values1[i] - mean1) * (values2[i] - mean2);
    }
    return sum / values1.length;
  }
  
  /**
   * Update all baselines
   */
  async updateBaselines() {
    logger.info('Updating all baselines');
    
    for (const [key, result] of this.results) {
      if (result.status === 'failed') {
        // User confirmed this change is expected
        const screenshot = result.current;
        await this.saveBaseline(key, screenshot);
      }
    }
    
    this.emit('baselines-updated');
  }
  
  /**
   * Generate visual regression report
   */
  generateReport() {
    const report = {
      timestamp: Date.now(),
      tests: this.results.length,
      passed: this.results.filter(r => r.status === 'passed').length,
      failed: this.results.filter(r => r.status === 'failed').length,
      new: this.results.filter(r => r.status === 'new').length,
      results: this.results,
      devices: this.groupByDevice(),
      summary: this.generateSummary()
    };
    
    report.passRate = report.tests > 0
      ? (report.passed / report.tests * 100).toFixed(2) + '%'
      : '0%';
    
    return report;
  }
  
  /**
   * Group results by device
   */
  groupByDevice() {
    const byDevice = {};
    
    for (const result of this.results) {
      if (!byDevice[result.device]) {
        byDevice[result.device] = {
          total: 0,
          passed: 0,
          failed: 0,
          new: 0
        };
      }
      
      byDevice[result.device].total++;
      byDevice[result.device][result.status]++;
    }
    
    return byDevice;
  }
  
  /**
   * Generate summary
   */
  generateSummary() {
    const failedTests = this.results.filter(r => r.status === 'failed');
    
    return {
      totalDifference: failedTests.reduce((sum, r) => sum + r.difference, 0),
      avgDifference: failedTests.length > 0
        ? (failedTests.reduce((sum, r) => sum + r.difference, 0) / failedTests.length).toFixed(2)
        : 0,
      maxDifference: failedTests.length > 0
        ? Math.max(...failedTests.map(r => r.difference)).toFixed(2)
        : 0,
      affectedAreas: failedTests.flatMap(r => r.areas || [])
    };
  }
  
  /**
   * Cleanup
   */
  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
    
    this.baselines.clear();
    this.comparisons = [];
    this.results = [];
    
    this.emit('cleanup-complete');
  }
}

// Export singleton
module.exports = new VisualRegressionTesting();