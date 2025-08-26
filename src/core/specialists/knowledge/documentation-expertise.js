/**
 * BUMBA Documentation Specialists Expertise
 * Sprint 26: Comprehensive documentation expertise
 * Covers: Technical Writer, API Documentation, Developer Docs, User Guides
 */

const documentationExpertise = {
  getTechnicalWriterExpertise() {
    return {
      core: {
        writing: 'Technical writing, documentation standards, style guides',
        formats: 'Markdown, reStructuredText, AsciiDoc, DITA, DocBook',
        tools: 'MkDocs, Sphinx, GitBook, Docusaurus, ReadTheDocs',
        publishing: 'Static site generators, CI/CD for docs, versioning'
      },
      capabilities: [
        'Write comprehensive technical documentation',
        'Create API documentation with OpenAPI/Swagger',
        'Develop user guides and tutorials',
        'Build knowledge bases and wikis',
        'Create developer documentation portals',
        'Write release notes and changelogs',
        'Develop training materials',
        'Create architecture documentation',
        'Write installation and deployment guides',
        'Develop troubleshooting documentation',
        'Create code documentation and comments',
        'Build documentation style guides',
        'Implement docs-as-code workflows',
        'Create interactive documentation',
        'Develop video documentation',
        'Write security documentation'
      ],
      bestPractices: [
        'Follow documentation style guides (Microsoft, Google, etc.)',
        'Use clear and concise language',
        'Include code examples and samples',
        'Maintain version-controlled documentation',
        'Implement continuous documentation updates',
        'Use diagrams and visual aids',
        'Create searchable documentation',
        'Include prerequisites and requirements',
        'Provide step-by-step instructions',
        'Add troubleshooting sections',
        'Use consistent terminology',
        'Implement peer review processes',
        'Test documentation accuracy',
        'Gather user feedback',
        'Keep documentation up-to-date'
      ],
      codePatterns: {
        apiDocumentation: `
openapi: 3.0.0
info:
  title: Product API
  version: 1.0.0
  description: |
    # Product Management API
    
    This API provides endpoints for managing products in the system.
    
    ## Authentication
    All endpoints require Bearer token authentication.
    
    ## Rate Limiting
    - 100 requests per minute per API key
    - 429 status code when limit exceeded
    
  contact:
    email: api-support@example.com
  license:
    name: MIT
    url: https://opensource.org/licenses/MIT

servers:
  - url: https://api.example.com/v1
    description: Production server
  - url: https://staging-api.example.com/v1
    description: Staging server

paths:
  /products:
    get:
      summary: List all products
      description: |
        Returns a paginated list of products.
        
        ## Filtering
        Use query parameters to filter results.
        
        ## Sorting
        Use \`sort\` parameter with field names.
      operationId: listProducts
      tags:
        - Products
      parameters:
        - name: page
          in: query
          description: Page number
          schema:
            type: integer
            default: 1
        - name: limit
          in: query
          description: Items per page
          schema:
            type: integer
            default: 20
            maximum: 100
      responses:
        '200':
          description: Successful response
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ProductList'`,
        markdownGuide: `
# Project Name

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)]()
[![Documentation](https://img.shields.io/badge/docs-latest-blue)]()
[![License](https://img.shields.io/badge/license-MIT-green)]()

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Configuration](#configuration)
- [API Reference](#api-reference)
- [Examples](#examples)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

## Overview

Brief description of what this project does and its main benefits.

### Key Features

- 🟡 Feature 1: Description
- 🟢 Feature 2: Description
- 🔧 Feature 3: Description
- 📊 Feature 4: Description

## Installation

### Prerequisites

- Node.js >= 16.0.0
- npm >= 8.0.0
- PostgreSQL >= 13

### Steps

1. Clone the repository:
   \`\`\`bash
   git clone https://github.com/username/project.git
   cd project
   \`\`\`

2. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

3. Configure environment:
   \`\`\`bash
   cp .env.example .env
   # Edit .env with your settings
   \`\`\`

4. Initialize database:
   \`\`\`bash
   npm run db:migrate
   npm run db:seed
   \`\`\`

## Quick Start

\`\`\`javascript
const SDK = require('project-sdk');

// Initialize
const client = new SDK({
  apiKey: 'your-api-key',
  environment: 'production'
});

// Basic usage
async function example() {
  try {
    const result = await client.products.list();
    console.log(result);
  } catch (error) {
    console.error('Error:', error);
  }
}
\`\`\``,
        interactiveDocs: `
<!-- Interactive API Explorer -->
<!DOCTYPE html>
<html>
<head>
  <title>API Documentation</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist/swagger-ui.css">
</head>
<body>
  <div id="swagger-ui"></div>
  
  <script src="https://unpkg.com/swagger-ui-dist/swagger-ui-bundle.js"></script>
  <script>
    window.onload = function() {
      SwaggerUIBundle({
        url: "/api/openapi.json",
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIBundle.SwaggerUIStandalonePreset
        ],
        plugins: [
          SwaggerUIBundle.plugins.DownloadUrl
        ],
        layout: "StandaloneLayout",
        tryItOutEnabled: true,
        requestInterceptor: (req) => {
          req.headers['Authorization'] = 'Bearer ' + getApiToken();
          return req;
        }
      });
    };
  </script>
</body>
</html>`
      }
    };
  },

  getAPIDocumentationExpertise() {
    return {
      core: {
        specifications: 'OpenAPI 3.0, Swagger, RAML, API Blueprint',
        tools: 'Swagger UI, Redoc, Postman, Insomnia',
        formats: 'JSON Schema, GraphQL Schema, Protocol Buffers',
        standards: 'REST, GraphQL, gRPC, WebSocket documentation'
      },
      capabilities: [
        'Design OpenAPI specifications',
        'Create interactive API documentation',
        'Generate client SDKs from specs',
        'Document GraphQL schemas',
        'Create API testing collections',
        'Write authentication guides',
        'Document rate limiting',
        'Create webhook documentation',
        'Write error handling guides',
        'Document API versioning',
        'Create code examples in multiple languages',
        'Build API reference documentation',
        'Write integration guides',
        'Create API changelogs',
        'Document security requirements'
      ]
    };
  },

  getDeveloperDocsExpertise() {
    return {
      core: {
        platforms: 'GitHub Pages, ReadTheDocs, Docusaurus, MkDocs',
        languages: 'Multiple programming language examples',
        tools: 'JSDoc, Doxygen, Sphinx, YARD',
        workflows: 'Docs-as-code, CI/CD integration, automated generation'
      },
      capabilities: [
        'Create getting started guides',
        'Write architecture documentation',
        'Document coding standards',
        'Create contribution guidelines',
        'Write deployment documentation',
        'Document debugging procedures',
        'Create performance guides',
        'Write security documentation',
        'Document testing procedures',
        'Create migration guides',
        'Write SDK documentation',
        'Document CLI tools',
        'Create configuration guides',
        'Write troubleshooting guides',
        'Document best practices'
      ]
    };
  }
};

module.exports = documentationExpertise;