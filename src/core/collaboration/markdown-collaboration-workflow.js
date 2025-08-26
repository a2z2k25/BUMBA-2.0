/**
 * BUMBA Markdown Collaboration Workflow
 * Enables multi-agent collaborative documentation creation
 * Departments work in parallel on sections then merge intelligently
 */

const fs = require('fs').promises;
const path = require('path');
const { RealtimeCoordinationManager } = require('./realtime-coordination-hooks');

class MarkdownCollaborationWorkflow {
  constructor() {
    this.realtimeManager = RealtimeCoordinationManager.getInstance();
    this.activeDocuments = new Map();
    this.templates = this.loadTemplates();
    this.sectionAssignments = new Map();
  }

  /**
   * Load markdown templates for different document types
   */
  loadTemplates() {
    return {
      'technical-spec': {
        sections: [
          { name: 'Overview', department: 'product', priority: 1 },
          { name: 'Requirements', department: 'product', priority: 2 },
          { name: 'Architecture', department: 'backend', priority: 3 },
          { name: 'API Design', department: 'backend', priority: 4 },
          { name: 'UI/UX Design', department: 'design', priority: 5 },
          { name: 'Components', department: 'design', priority: 6 },
          { name: 'Security', department: 'backend', priority: 7 },
          { name: 'Testing Strategy', department: 'backend', priority: 8 },
          { name: 'Deployment', department: 'backend', priority: 9 }
        ]
      },
      'feature-doc': {
        sections: [
          { name: 'Feature Overview', department: 'product', priority: 1 },
          { name: 'User Stories', department: 'product', priority: 2 },
          { name: 'User Experience', department: 'design', priority: 3 },
          { name: 'Technical Implementation', department: 'backend', priority: 4 },
          { name: 'Edge Cases', department: 'backend', priority: 5 },
          { name: 'Metrics', department: 'product', priority: 6 }
        ]
      },
      'api-doc': {
        sections: [
          { name: 'API Overview', department: 'backend', priority: 1 },
          { name: 'Authentication', department: 'backend', priority: 2 },
          { name: 'Endpoints', department: 'backend', priority: 3 },
          { name: 'Request/Response', department: 'backend', priority: 4 },
          { name: 'Error Handling', department: 'backend', priority: 5 },
          { name: 'Rate Limiting', department: 'backend', priority: 6 },
          { name: 'Examples', department: 'backend', priority: 7 },
          { name: 'SDK Usage', department: 'design', priority: 8 }
        ]
      },
      'design-system': {
        sections: [
          { name: 'Design Principles', department: 'design', priority: 1 },
          { name: 'Color Palette', department: 'design', priority: 2 },
          { name: 'Typography', department: 'design', priority: 3 },
          { name: 'Components', department: 'design', priority: 4 },
          { name: 'Patterns', department: 'design', priority: 5 },
          { name: 'Accessibility', department: 'design', priority: 6 },
          { name: 'Implementation Guide', department: 'backend', priority: 7 }
        ]
      },
      'project-plan': {
        sections: [
          { name: 'Executive Summary', department: 'product', priority: 1 },
          { name: 'Goals & Objectives', department: 'product', priority: 2 },
          { name: 'Timeline', department: 'product', priority: 3 },
          { name: 'Technical Approach', department: 'backend', priority: 4 },
          { name: 'Design Approach', department: 'design', priority: 5 },
          { name: 'Risks & Mitigations', department: 'product', priority: 6 },
          { name: 'Success Metrics', department: 'product', priority: 7 }
        ]
      }
    };
  }

  /**
   * Start collaborative documentation workflow
   */
  async startCollaborativeDocumentation(config) {
    const {
      title,
      type = 'technical-spec',
      topic,
      departments = ['product', 'design', 'backend'],
      outputPath = './docs',
      customSections = null
    } = config;

    const docId = `doc-${Date.now()}`;
    const template = customSections || this.templates[type];
    
    if (!template) {
      throw new Error(`Unknown document type: ${type}`);
    }

    // Initialize document
    const document = {
      id: docId,
      title,
      type,
      topic,
      departments,
      outputPath,
      sections: template.sections || template,
      drafts: new Map(),
      status: 'initializing',
      startTime: Date.now()
    };

    this.activeDocuments.set(docId, document);

    // Start real-time collaboration
    const collaborationId = `md-${docId}`;
    const collaboration = this.realtimeManager.monitor.startCollaboration(collaborationId, {
      type: 'parallel',
      departments,
      tasks: document.sections.map(s => s.name)
    });

    document.collaborationId = collaborationId;

    // Assign sections to departments
    await this.assignSections(document);

    // Start parallel drafting
    await this.startParallelDrafting(document);

    return docId;
  }

  /**
   * Assign document sections to departments
   */
  async assignSections(document) {
    const assignments = new Map();
    
    document.sections.forEach(section => {
      const dept = section.department;
      if (!assignments.has(dept)) {
        assignments.set(dept, []);
      }
      assignments.get(dept).push(section);
    });

    document.assignments = assignments;
    this.sectionAssignments.set(document.id, assignments);

    // Notify departments of their assignments
    for (const [dept, sections] of assignments) {
      this.realtimeManager.monitor.emitter.sendToChannel(
        `collab-${document.collaborationId}`,
        {
          type: 'sections:assigned',
          department: dept,
          sections: sections.map(s => s.name),
          documentId: document.id
        }
      );
    }

    return assignments;
  }

  /**
   * Get section guidelines for a department
   */
  getSectionGuidelines(sectionName, department, topic) {
    const guidelines = {
      'Overview': `Provide a clear, concise overview of ${topic}. Include purpose, scope, and key benefits.`,
      'Requirements': `List functional and non-functional requirements for ${topic}. Use clear, testable statements.`,
      'Architecture': `Describe the technical architecture for ${topic}. Include diagrams, components, and data flow.`,
      'API Design': `Define RESTful API endpoints, request/response formats, and authentication for ${topic}.`,
      'UI/UX Design': `Describe user interface and experience design for ${topic}. Include wireframes and user flows.`,
      'Components': `List UI components needed for ${topic}. Include props, states, and interactions.`,
      'Security': `Detail security measures, authentication, authorization, and data protection for ${topic}.`,
      'Testing Strategy': `Outline testing approach including unit, integration, and e2e tests for ${topic}.`,
      'Deployment': `Describe deployment strategy, environments, and CI/CD pipeline for ${topic}.`,
      'User Stories': `Write user stories in "As a... I want... So that..." format for ${topic}.`,
      'User Experience': `Detail the user journey, interactions, and experience design for ${topic}.`,
      'Technical Implementation': `Provide detailed technical implementation plan for ${topic}.`,
      'Edge Cases': `Identify and document edge cases and error scenarios for ${topic}.`,
      'Metrics': `Define success metrics and KPIs for ${topic}.`
    };

    return guidelines[sectionName] || `Write a comprehensive section about ${sectionName} for ${topic}.`;
  }

  /**
   * Start parallel drafting by all departments
   */
  async startParallelDrafting(document) {
    const draftPromises = [];

    for (const [dept, sections] of document.assignments) {
      const promise = this.createDepartmentDraft(document, dept, sections);
      draftPromises.push(promise);
    }

    // Wait for all drafts to complete
    const drafts = await Promise.all(draftPromises);
    
    // Store drafts
    drafts.forEach(draft => {
      document.drafts.set(draft.department, draft);
    });

    document.status = 'drafting-complete';
    return drafts;
  }

  /**
   * Create draft for a specific department
   */
  async createDepartmentDraft(document, department, sections) {
    const draft = {
      department,
      sections: [],
      createdAt: Date.now()
    };

    for (const section of sections) {
      const content = await this.generateSectionContent(
        section.name,
        department,
        document.topic
      );

      draft.sections.push({
        name: section.name,
        content,
        priority: section.priority
      });

      // Report progress
      this.realtimeManager.monitor.reportTaskComplete(
        document.collaborationId,
        `${department}-${document.collaborationId}`,
        section.name,
        { linesWritten: content.split('\n').length }
      );
    }

    return draft;
  }

  /**
   * Generate section content (simulated - would call actual agent)
   */
  async generateSectionContent(sectionName, department, topic) {
    const guidelines = this.getSectionGuidelines(sectionName, department, topic);
    
    // Simulate content generation with department-specific style
    const styles = {
      'product': {
        prefix: '🟢',
        tone: 'strategic and business-focused'
      },
      'design': {
        prefix: '🟢',
        tone: 'user-centric and visual'
      },
      'backend': {
        prefix: '🟢',
        tone: 'technical and detailed'
      }
    };

    const style = styles[department] || styles.product;
    
    return `## ${style.prefix} ${sectionName}\n\n` +
           `*Generated by ${department} department*\n\n` +
           `${guidelines}\n\n` +
           '### Details\n\n' +
           `This section covers ${sectionName.toLowerCase()} aspects of ${topic} ` +
           `from a ${style.tone} perspective.\n\n` +
           '- Key Point 1\n' +
           '- Key Point 2\n' +
           '- Key Point 3\n\n' +
           '### Implementation Notes\n\n' +
           `Specific implementation details for ${sectionName} will be added here.\n`;
  }

  /**
   * Get document status
   */
  getDocumentStatus(docId) {
    const document = this.activeDocuments.get(docId);
    if (!document) {return null;}

    return {
      id: document.id,
      title: document.title,
      status: document.status,
      progress: this.calculateProgress(document),
      departments: document.departments,
      sectionsComplete: this.countCompleteSections(document),
      totalSections: document.sections.length,
      duration: Date.now() - document.startTime
    };
  }

  /**
   * Calculate document progress
   */
  calculateProgress(document) {
    if (!document.drafts.size) {return 0;}
    
    let completedSections = 0;
    document.drafts.forEach(draft => {
      completedSections += draft.sections.length;
    });
    
    return Math.round((completedSections / document.sections.length) * 100);
  }

  /**
   * Count complete sections
   */
  countCompleteSections(document) {
    let count = 0;
    document.drafts.forEach(draft => {
      count += draft.sections.length;
    });
    return count;
  }

  /**
   * Preview document (before merge)
   */
  async previewDocument(docId) {
    const document = this.activeDocuments.get(docId);
    if (!document) {return null;}

    const preview = [];
    preview.push(`# ${document.title}\n`);
    preview.push(`*Collaborative document about ${document.topic}*\n`);
    preview.push(`*Status: ${document.status}*\n\n`);
    preview.push('---\n\n');

    // Add sections in priority order
    const allSections = [];
    document.drafts.forEach(draft => {
      allSections.push(...draft.sections);
    });
    
    allSections.sort((a, b) => a.priority - b.priority);
    
    allSections.forEach(section => {
      preview.push(section.content);
      preview.push('\n---\n\n');
    });

    return preview.join('');
  }
}

module.exports = MarkdownCollaborationWorkflow;