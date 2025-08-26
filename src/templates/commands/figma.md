# BUMBA Figma Integration Commands

## Complete Design-to-Development Workflow

### /bumba:figma - Comprehensive Figma Integration

---

allowed-tools: all
description: Professional Figma integration supporting both Dev Mode MCP and Context API workflows

---

# 🏁 /bumba:figma ARGUMENTS$

**Professional Figma Integration for Seamless Design-to-Code Workflows**

## Dual-Mode Figma Integration

```bash
# Intelligent Figma mode detection
FIGMA_MODE=$(detect_figma_context "$ARGUMENTS$")
DEV_MODE_AVAILABLE=$(check_figma_devmode_connection)
CONTEXT_API_AVAILABLE=$(check_figma_api_key)

case $FIGMA_MODE in
  "dev-mode")
    activate_figma_devmode_integration
    enable_direct_figma_connection
    setup_selection_based_workflows
    ;;
  "context-api")
    activate_figma_context_integration
    enable_api_based_workflows
    setup_layout_analysis_tools
    ;;
  "hybrid-mode")
    activate_comprehensive_figma_integration
    enable_full_design_development_pipeline
    ;;
esac
```

## Dev Mode MCP Workflows (Recommended)

```bash
# Direct connection to Figma Desktop App
figma_devmode_workflows() {
  # Selection-based workflow
  if [[ "$ARGUMENTS$" == *"selection"* || "$ARGUMENTS$" == *"current"* ]]; then
    echo "🏁 BUMBA connecting to current Figma selection..."
    figma-devmode get-current-selection
    figma-devmode extract-design-specs
    figma-devmode generate-component-code
  fi

  # Link-based workflow
  if [[ "$ARGUMENTS$" =~ figma\.com ]]; then
    echo "🏁 BUMBA analyzing Figma design from URL..."
    FIGMA_URL="$ARGUMENTS$"
    figma-devmode analyze-url "$FIGMA_URL"
    figma-devmode extract-node-context
    figma-devmode generate-implementation
  fi

  # Component generation
  figma-devmode create-react-components
  figma-devmode export-design-tokens
  figma-devmode optimize-assets

  # Quality integration
  validate_generated_components_quality
  apply_accessibility_standards
  optimize_responsive_design
}
```

## Context API Workflows (Backup/Alternative)

```bash
# API-based Figma integration
figma_context_workflows() {
  # Layout analysis and extraction
  figma-context extract-layout-information "$ARGUMENTS$"
  figma-context analyze-component-hierarchy
  figma-context extract-design-tokens

  # Asset processing
  figma-context optimize-exported-images
  figma-context create-asset-library
  figma-context validate-design-consistency

  # Code generation
  figma-context generate-component-structure
  figma-context create-styling-system
  figma-context implement-responsive-design
}
```

## BUMBA Intelligence Layer

```bash
# Intelligent design analysis (unique to BUMBA)
bumba_figma_intelligence() {
  # Automated design quality assessment
  analyze_design_system_consistency
  validate_accessibility_compliance
  assess_responsive_design_readiness
  detect_component_reusability_patterns

  # Strategic design recommendations
  strategic-analysis evaluate-design-scalability
  strategic-analysis recommend-component-architecture
  strategic-analysis optimize-design-system
  strategic-analysis suggest-performance-improvements

  # Professional workflow integration
  coordinate_design_development_handoff
  synchronize_design_tokens_with_codebase
  maintain_design_code_consistency
  generate_professional_documentation
}
```

## Setup Verification

```bash
# BUMBA setup validation
verify_figma_setup() {
  echo "🏁 BUMBA Figma Setup Validation..."

  # Check Dev Mode MCP availability
  if figma-devmode health-check 2>/dev/null; then
    echo "🏁 Figma Dev Mode MCP: Connected"
    echo "🏁 Figma Desktop App: Running"
    DEV_MODE_STATUS="active"
  else
    echo "🏁 Figma Dev Mode MCP: Not available"
    echo "🏁 Setup required: Enable Dev Mode MCP in Figma Preferences"
    DEV_MODE_STATUS="inactive"
  fi

  # Check Context API availability
  if [[ -n "$FIGMA_API_KEY" ]] && figma-context health-check 2>/dev/null; then
    echo "🏁 Figma Context API: Connected"
    echo "🏁 API Key: Configured"
    CONTEXT_API_STATUS="active"
  else
    echo "🏁 Figma Context API: Not available"
    echo "🏁 Setup required: Set FIGMA_API_KEY environment variable"
    CONTEXT_API_STATUS="inactive"
  fi

  # Recommend best approach
  if [[ "$DEV_MODE_STATUS" == "active" ]]; then
    echo "🏁🏁 Recommended: Use Dev Mode MCP for best experience"
  elif [[ "$CONTEXT_API_STATUS" == "active" ]]; then
    echo "🏁 Using: Context API as backup option"
  else
    echo "🏁 Setup required: Configure at least one Figma integration"
  fi
}
```

## Examples

```bash
# Dev Mode MCP Examples (Recommended)
/bumba:figma implement current selection
/bumba:figma analyze selection for responsive design
/bumba:figma generate component from https://figma.com/design/...
/bumba:figma extract tokens from current frame
/bumba:figma create design system from selection

# Context API Examples (Alternative)
/bumba:figma analyze layout https://figma.com/file/...
/bumba:figma extract components with api
/bumba:figma generate tokens from design file
/bumba:figma optimize assets for web deployment

# Hybrid Examples (Best of both)
/bumba:figma setup verification
/bumba:figma compare dev-mode vs api results
/bumba:figma validate design implementation
```

## Success Criteria

- **Seamless Connection**: Direct integration with Figma workspace
- **Professional Output**: Production-ready components and assets
- **Design Fidelity**: Pixel-perfect implementation from designs
- **Performance Optimized**: Web-ready assets with proper optimization
- **Accessibility Compliant**: WCAG guidelines automatically applied
- **Documentation Generated**: Professional handoff documentation

---

**BUMBA Figma Integration**: The most comprehensive design-to-development workflow available for Claude Code, supporting both cutting-edge Dev Mode MCP and reliable Context API approaches.
