# 🏁 BUMBA UI Component Generation Command

You are creating intelligent UI components using BUMBA's design-to-code capabilities.

## UI Development Context

**Component**: `{{UI_COMPONENT}}`
**Framework**: `{{UI_FRAMEWORK}}`
**Design System**: Follow established patterns and accessibility standards
**Focus**: Professional, accessible, and maintainable UI components

## UI Generation Protocol

### 1. Component Analysis

- **Requirements Definition**: Understand component purpose and functionality
- **Design System Integration**: Align with existing design tokens and patterns
- **Accessibility Requirements**: Ensure WCAG 2.1 AA compliance
- **Responsive Design**: Plan for mobile, tablet, and desktop layouts

### 2. Component Architecture

- **State Management**: Define component state and data flow
- **Props Interface**: Design clean, typed component API
- **Event Handling**: Implement user interactions and callbacks
- **Performance Optimization**: Lazy loading, memoization, and optimization

### 3. Implementation Approach

- **Semantic HTML**: Use proper HTML5 elements and structure
- **CSS Architecture**: Modular, maintainable styling approach
- **JavaScript Logic**: Clean, testable component behavior
- **Framework Integration**: Platform-specific best practices

## Component Categories

### Layout Components

- **Containers**: Grid systems, flex layouts, and responsive containers
- **Navigation**: Headers, sidebars, breadcrumbs, and pagination
- **Structure**: Cards, panels, sections, and organizational elements

### Interactive Components

- **Forms**: Input fields, validation, and form handling
- **Buttons**: Primary, secondary, icon, and specialized button variants
- **Controls**: Sliders, toggles, dropdowns, and selection components

### Data Display

- **Tables**: Data grids, sorting, filtering, and pagination
- **Charts**: Visualizations, graphs, and data representations
- **Lists**: Item displays, search results, and content organization

### Feedback Components

- **Notifications**: Alerts, toasts, banners, and status messages
- **Loading**: Spinners, progress bars, and loading states
- **Modals**: Dialogs, overlays, and focused interactions

## Quality Standards

### Code Quality

```typescript
// Example: Typed React component with proper patterns
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'danger';
  size: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  onClick: (event: MouseEvent) => void;
  children: ReactNode;
}

export const Button: FC<ButtonProps> = ({
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  onClick,
  children,
  ...props
}) => {
  // Implementation with proper accessibility
  return (
    <button
      className={clsx(
        'btn',
        `btn--${variant}`,
        `btn--${size}`,
        { 'btn--loading': loading }
      )}
      disabled={disabled || loading}
      onClick={onClick}
      aria-label={loading ? 'Loading...' : undefined}
      {...props}
    >
      {loading ? <Spinner /> : children}
    </button>
  );
};
```

### Accessibility Standards

- **Keyboard Navigation**: Full keyboard accessibility support
- **Screen Reader Support**: Proper ARIA labels and descriptions
- **Color Contrast**: Meet WCAG contrast ratio requirements
- **Focus Management**: Visible focus indicators and logical tab order

### Design System Integration

- **Design Tokens**: Use consistent colors, spacing, and typography
- **Component Variants**: Support design system component variations
- **Responsive Patterns**: Follow established breakpoint and layout patterns
- **Brand Consistency**: Maintain visual identity and style guidelines

## Testing Integration

### Component Testing

```typescript
// Example: Comprehensive component tests
describe('Button Component', () => {
  it('renders with correct variant classes', () => {
    render(<Button variant="primary">Click me</Button>);
    expect(screen.getByRole('button')).toHaveClass('btn--primary');
  });

  it('handles click events correctly', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('supports loading state', () => {
    render(<Button loading onClick={vi.fn()}>Click me</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
    expect(screen.getByLabelText('Loading...')).toBeInTheDocument();
  });
});
```

### Visual Testing

- **Storybook Integration**: Component documentation and visual testing
- **Snapshot Testing**: Prevent unintended visual regressions
- **Cross-browser Testing**: Ensure compatibility across platforms
- **Responsive Testing**: Verify components at different screen sizes

## Documentation Generation

Each component should include:

- **Usage Examples**: Clear implementation examples and patterns
- **Props Documentation**: Complete API reference with types
- **Accessibility Notes**: Screen reader support and keyboard navigation
- **Design Guidelines**: When and how to use the component

## Quality Gates

- 🏁 Component follows established design system patterns
- 🏁 Full accessibility support with WCAG 2.1 AA compliance
- 🏁 Comprehensive test coverage including edge cases
- 🏁 Responsive design tested across breakpoints
- 🏁 Performance optimized with proper React patterns
- 🏁 Documentation complete with usage examples

---

**Build beautiful, accessible UI components with BUMBA's intelligent generation! 🏁**
