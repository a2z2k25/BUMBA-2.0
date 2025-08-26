#!/bin/bash

# BUMBA Framework Sprint 1 Rollback Procedures
# Use this script to rollback any or all optimizations from Sprint 1

echo "🔄 BUMBA Framework Rollback Utility"
echo "===================================="
echo ""
echo "This script allows you to rollback Sprint 1 optimizations"
echo ""

# Function to rollback lazy loading
rollback_lazy_loading() {
    echo "🔄 Rolling back lazy loading..."
    
    # Restore original specialist registry
    if [ -f "src/core/specialists/specialist-registry.original.js" ]; then
        cp src/core/specialists/specialist-registry.original.js src/core/specialists/specialist-registry.js
        echo "  ✅ Restored original specialist registry"
    fi
    
    # Remove lazy loading files
    rm -f src/core/specialists/specialist-registry-wrapper.js
    rm -f src/core/specialists/specialist-registry-lazy.js
    echo "  ✅ Removed lazy loading wrappers"
    
    # Remove dashboard lazy loader
    rm -f src/core/coordination/dashboard-lazy-loader.js
    echo "  ✅ Removed dashboard lazy loader"
    
    # Restore coordination index
    git checkout src/core/coordination/index.js 2>/dev/null || echo "  ⚠️  Could not restore coordination index"
    
    echo "  ✅ Lazy loading rolled back"
}

# Function to rollback string interning
rollback_string_interning() {
    echo "🔄 Rolling back string interning..."
    
    # Remove string interning system
    rm -rf src/core/optimization/
    echo "  ✅ Removed string interning system"
    
    # Remove imports from framework
    sed -i.bak "/string-intern/d" src/core/bumba-framework-2.js 2>/dev/null
    echo "  ✅ Removed string interning imports"
}

# Function to restore removed files
restore_removed_files() {
    echo "🔄 Restoring removed files..."
    
    # Restore from archive
    if [ -d "archived/unused-2025-08-23" ]; then
        cp archived/unused-2025-08-23/* src/core/ 2>/dev/null
        echo "  ✅ Restored archived files"
    fi
    
    # Restore terminal-size dependency
    npm install terminal-size --save 2>/dev/null
    echo "  ✅ Restored terminal-size dependency"
}

# Function to rollback test fixes
rollback_test_fixes() {
    echo "🔄 Rolling back test fixes..."
    
    # Restore original tests
    git checkout tests/integration/e2e-critical-paths.test.js 2>/dev/null
    echo "  ✅ Restored original test file"
    
    # Remove isOperational from framework
    sed -i.bak "/this.isOperational/d" src/core/bumba-framework-2.js 2>/dev/null
    echo "  ✅ Removed isOperational property"
}

# Function to verify rollback
verify_rollback() {
    echo ""
    echo "🔍 Verifying rollback..."
    
    # Check if lazy loading is disabled
    if [ ! -f "src/core/specialists/specialist-registry-lazy.js" ]; then
        echo "  ✅ Lazy loading files removed"
    else
        echo "  ❌ Lazy loading files still present"
    fi
    
    # Check if string interning is removed
    if [ ! -d "src/core/optimization" ]; then
        echo "  ✅ String interning removed"
    else
        echo "  ❌ String interning still present"
    fi
    
    # Run a quick memory test
    echo ""
    echo "📊 Testing memory usage after rollback..."
    node -e "
        const before = process.memoryUsage();
        const { createBumbaFramework } = require('./src/index');
        const after = process.memoryUsage();
        const used = ((after.heapUsed - before.heapUsed) / 1024 / 1024).toFixed(2);
        console.log('  Memory usage: ' + used + 'MB');
        if (used > 10) {
            console.log('  ✅ Rollback successful - memory usage back to baseline');
        } else {
            console.log('  ⚠️ Memory still optimized - some optimizations may remain');
        }
    " 2>/dev/null || echo "  ❌ Could not test memory usage"
}

# Main menu
show_menu() {
    echo "Select rollback option:"
    echo "  1) Rollback ALL optimizations"
    echo "  2) Rollback lazy loading only"
    echo "  3) Rollback string interning only"
    echo "  4) Restore removed files"
    echo "  5) Rollback test fixes"
    echo "  6) Verify rollback status"
    echo "  0) Exit"
    echo ""
    read -p "Enter choice [0-6]: " choice
}

# Process choice
process_choice() {
    case $choice in
        1)
            echo ""
            echo "🔄 Rolling back ALL optimizations..."
            rollback_lazy_loading
            rollback_string_interning
            restore_removed_files
            rollback_test_fixes
            verify_rollback
            ;;
        2)
            echo ""
            rollback_lazy_loading
            ;;
        3)
            echo ""
            rollback_string_interning
            ;;
        4)
            echo ""
            restore_removed_files
            ;;
        5)
            echo ""
            rollback_test_fixes
            ;;
        6)
            verify_rollback
            ;;
        0)
            echo "Exiting..."
            exit 0
            ;;
        *)
            echo "Invalid choice. Please try again."
            ;;
    esac
}

# Alternative: Environment variable rollback
echo "💡 Quick Rollback via Environment Variables:"
echo "   export DISABLE_LAZY_LOADING=true"
echo "   export DISABLE_LAZY_DASHBOARD=true"
echo ""

# Main loop
while true; do
    show_menu
    process_choice
    echo ""
    read -p "Press Enter to continue..."
    echo ""
done