---
allowed-tools: all
description: Intelligent documentation search and retrieval using Ref's token-efficient system
---

# 🏁 /bumba:docs ARGUMENTS$

**Token-Efficient Documentation Intelligence with Ref**

## Mission

Intelligent documentation search and retrieval using Ref's token-efficient system covering 1000s of public repositories and documentation sites, with 60-95% fewer tokens than traditional methods.

## Documentation Coverage

### Public Documentation Sources

- **GitHub Repositories**: 1000+ popular public repos with up-to-date documentation
- **Official Documentation**: Framework docs, API references, language specifications
- **Community Resources**: Tutorials, guides, best practices from authoritative sources
- **Web Fallback**: Smart web search when specific docs aren't in the index

### Private Documentation Sources

- **Private Repositories**: Custom indexing of internal/proprietary documentation
- **PDF Documentation**: Enterprise documentation, standards, internal guides
- **Custom Knowledge Bases**: Organization-specific documentation repositories

## Intelligence Features

```bash
# Token optimization strategies
TOKEN_EFFICIENCY=(
  "smart_chunking"           # Relevant sections only (not entire pages)
  "context_aware_filtering"  # Session-based relevance filtering
  "deep_linking"            # Direct links to specific documentation sections
  "duplicate_prevention"    # Never return repeated results in session
)

# Search optimization
SEARCH_INTELLIGENCE=(
  "semantic_search"         # Understanding intent, not just keywords
  "contextual_refinement"   # Improving searches based on session history
  "progressive_discovery"   # Drilling down from broad to specific
  "cross_reference_linking" # Finding related documentation automatically
)
```

### Advanced Search Capabilities

- **Semantic Search**: Understanding query intent beyond keyword matching
- **Progressive Refinement**: Iterative search improvement based on session context
- **Cross-Reference Discovery**: Finding related documentation across different sources
- **Version-Aware Search**: Accessing documentation for specific library versions

## Search Workflows

```bash
# Intelligent documentation agent
Agent: documentation_intelligence() {
  # Phase 1: Context analysis
  analyze_query_context "$ARGUMENTS$"
  determine_documentation_scope "$ARGUMENTS$"

  # Phase 2: Smart search execution
  execute_semantic_search "$ARGUMENTS$"
  filter_relevant_results "$ARGUMENTS$"

  # Phase 3: Content optimization
  extract_minimal_context "$ARGUMENTS$"
  generate_deep_links "$ARGUMENTS$"

  # Phase 4: Knowledge synthesis
  synthesize_documentation "$ARGUMENTS$"
  provide_implementation_examples "$ARGUMENTS$"
}

# Specialized search functions
ref_search_documentation(query, keywords=[], source="all") {
  # Smart search with session context
  # Returns minimal relevant tokens with deep links
}

ref_read_url(url) {
  # Convert documentation URL to markdown
  # Token-optimized content extraction
}
```

## Integration Points

### Development Workflow

- **Real-time Lookup**: Instant documentation access during coding
- **API Reference**: Quick access to method signatures and examples
- **Best Practices**: Contextual guidance for implementation patterns
- **Error Resolution**: Documentation for debugging and troubleshooting

### BUMBA Intelligence

- **Context Enhancement**: Reducing hallucinations with accurate documentation
- **Implementation Guidance**: Step-by-step tutorials and examples
- **Version Management**: Documentation for specific library versions
- **Dependency Research**: Understanding third-party library capabilities

## Search Optimization

```bash
# Token usage comparison
TRADITIONAL_APPROACH=(
  "Context7: 10k tokens per library"
  "Multiple libraries: 20k+ tokens"
  "Full page retrieval: Often irrelevant content"
)

REF_OPTIMIZATION=(
  "Average: 60% fewer tokens than Context7"
  "Best case: 95% reduction (500 vs 10,000 tokens)"
  "Smart chunking: Only relevant sections"
  "Session awareness: No duplicate content"
)
```

## Examples

```bash
/bumba:docs React hooks best practices and examples
/bumba:docs NextJS 14 app router configuration
/bumba:docs TypeScript advanced generic patterns
/bumba:docs AWS SDK v3 S3 operations with error handling
/bumba:docs Docker compose production deployment strategies
/bumba:docs FastAPI authentication middleware implementation
/bumba:docs Prisma database migrations and schema management
/bumba:docs Vue 3 composition API reactive patterns
```

## Advanced Documentation Queries

```bash
# Specific implementation patterns
/bumba:docs implement JWT refresh token rotation in Express
/bumba:docs setup Redis caching for GraphQL queries
/bumba:docs configure Webpack 5 module federation

# Troubleshooting and debugging
/bumba:docs debug React hydration mismatch errors
/bumba:docs resolve TypeScript strict mode compilation issues
/bumba:docs fix CORS issues in production deployment

# Version-specific queries
/bumba:docs React 18 concurrent features migration guide
/bumba:docs Node.js 20 native test runner usage
/bumba:docs Python 3.12 type hints new features
```

## Private Documentation Setup

```bash
# Custom repository indexing
/bumba:docs index private repo "github.com/company/internal-docs"
/bumba:docs index pdf documentation "/path/to/company-standards.pdf"
/bumba:docs search private "internal API authentication patterns"
```

**Success Criteria**: Accurate, token-efficient documentation retrieval with deep links for verification, comprehensive coverage of query intent, and minimal context pollution for optimal AI performance.
