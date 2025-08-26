---
allowed-tools: all
description: Designer-focused workflows with Figma integration and visual tools
---

# 🏁 /bumba:design ARGUMENTS$

**Professional Designer Workflows with Tool Integration**

## Mission

Seamless design-to-development workflows combining Figma integration, visual documentation, and intelligent UI generation for production-ready design systems.

## Designer Workflow Engine

```bash
# Detect design workflow type
WORKFLOW_TYPE=$(analyze_design_request "$ARGUMENTS$")
FIGMA_INTEGRATION=$(check_figma_availability)
VISUAL_TOOLS=$(initialize_visual_capture)

# Activate appropriate design tools
case $WORKFLOW_TYPE in
  "figma-to-code") activate_figma_devmode ;;
  "asset-generation") activate_visual_capture ;;
  "ui-component") activate_ui_generation ;;
  "design-system") activate_comprehensive_workflow ;;
esac
```

## Phase 1: Design Analysis & Extraction

- **Figma Integration**: Direct workspace access and component extraction
- **Visual Analysis**: Screenshot analysis and design pattern recognition
- **Component Mapping**: Design system component identification
- **Responsive Planning**: Breakpoint analysis and layout strategy

## Phase 2: Asset Processing & Optimization

- **Asset Optimization**: Image compression and format optimization
- **Color Extraction**: Palette generation and CSS variable creation
- **Typography Mapping**: Font stack analysis and web font integration
- **Icon Processing**: SVG optimization and icon system generation

## Phase 3: Code Generation & Implementation

- **Component Generation**: React/Vue/Angular component creation
- **Styling Systems**: CSS/SCSS/Tailwind implementation
- **Responsive Implementation**: Mobile-first responsive design
- **Design Token Integration**: Systematic design token application

## Phase 4: Quality Assurance & Documentation

- **Visual Regression**: Compare generated components with designs
- **Accessibility Validation**: WCAG compliance verification
- **Performance Optimization**: Asset loading and rendering optimization
- **Design Documentation**: Component usage and style guide generation

## Examples

```bash
/bumba:design convert Figma component to React with TypeScript
/bumba:design create responsive landing page from mockup
/bumba:design extract design tokens from design system
/bumba:design generate component library with Storybook
/bumba:design optimize design assets for web performance
```

**Success Criteria**: Pixel-perfect implementation with optimized assets, responsive design, accessibility compliance, and maintainable code structure.
