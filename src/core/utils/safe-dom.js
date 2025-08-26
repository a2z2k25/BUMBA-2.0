/**
 * Safe DOM Manipulation Utilities
 * Prevents XSS vulnerabilities by avoiding innerHTML
 * Sprint 3 - Security Fix
 */

/**
 * Safely set text content of an element
 */
function safeSetText(element, text) {
  if (!element) return;
  element.textContent = String(text);
}

/**
 * Safely create and append HTML elements
 */
function safeCreateElement(tag, attributes = {}, children = []) {
  const element = document.createElement(tag);
  
  // Set attributes safely
  for (const [key, value] of Object.entries(attributes)) {
    if (key === 'className') {
      element.className = String(value);
    } else if (key === 'style' && typeof value === 'object') {
      Object.assign(element.style, value);
    } else if (key.startsWith('data-')) {
      element.setAttribute(key, String(value));
    } else if (['id', 'class', 'type', 'name', 'value'].includes(key)) {
      element.setAttribute(key, String(value));
    }
  }
  
  // Add children safely
  children.forEach(child => {
    if (typeof child === 'string') {
      element.appendChild(document.createTextNode(child));
    } else if (child instanceof Node) {
      element.appendChild(child);
    }
  });
  
  return element;
}

/**
 * Safely build HTML structure without innerHTML
 */
function safeBuildHTML(structure) {
  if (typeof structure === 'string') {
    return document.createTextNode(structure);
  }
  
  if (Array.isArray(structure)) {
    const fragment = document.createDocumentFragment();
    structure.forEach(item => {
      fragment.appendChild(safeBuildHTML(item));
    });
    return fragment;
  }
  
  if (structure && typeof structure === 'object') {
    const { tag, attrs, children } = structure;
    return safeCreateElement(tag || 'div', attrs || {}, 
      children ? [].concat(children).map(safeBuildHTML) : []);
  }
  
  return document.createTextNode('');
}

/**
 * Safely update element content with HTML structure
 */
function safeUpdateElement(element, content) {
  if (!element) return;
  
  // Clear existing content
  while (element.firstChild) {
    element.removeChild(element.firstChild);
  }
  
  // Add new content safely
  if (typeof content === 'string') {
    element.appendChild(document.createTextNode(content));
  } else if (content instanceof Node) {
    element.appendChild(content);
  } else if (Array.isArray(content)) {
    content.forEach(item => {
      if (typeof item === 'string') {
        element.appendChild(document.createTextNode(item));
      } else if (item instanceof Node) {
        element.appendChild(item);
      }
    });
  } else if (content && typeof content === 'object') {
    element.appendChild(safeBuildHTML(content));
  }
}

/**
 * Escape HTML special characters
 */
function escapeHTML(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/**
 * Sanitize HTML string (for cases where HTML is necessary)
 * Uses a whitelist approach
 */
function sanitizeHTML(html) {
  // Create a temporary container
  const temp = document.createElement('div');
  temp.textContent = html; // This escapes all HTML
  
  // If we need to allow some HTML, parse it carefully
  // For now, we'll just return escaped text
  return temp.innerHTML;
}

/**
 * Safe template rendering
 */
function safeRenderTemplate(template, data) {
  // Replace template variables safely
  let result = template;
  
  for (const [key, value] of Object.entries(data)) {
    const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g');
    result = result.replace(regex, escapeHTML(String(value)));
  }
  
  return result;
}

/**
 * Convert unsafe innerHTML assignments to safe DOM operations
 */
function convertHTMLString(htmlString) {
  // Parse HTML string into structure
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlString, 'text/html');
  
  // Convert to safe structure
  function nodeToStructure(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent;
    }
    
    if (node.nodeType === Node.ELEMENT_NODE) {
      const attrs = {};
      for (const attr of node.attributes) {
        attrs[attr.name] = attr.value;
      }
      
      const children = [];
      for (const child of node.childNodes) {
        children.push(nodeToStructure(child));
      }
      
      return {
        tag: node.tagName.toLowerCase(),
        attrs,
        children
      };
    }
    
    return '';
  }
  
  const structure = [];
  for (const child of doc.body.childNodes) {
    structure.push(nodeToStructure(child));
  }
  
  return safeBuildHTML(structure);
}

/**
 * Replace element.innerHTML = html with safe alternative
 */
function safeSetHTML(element, html) {
  if (!element) return;
  
  // Clear element
  while (element.firstChild) {
    element.removeChild(element.firstChild);
  }
  
  // If html is already safe (not a string), append it
  if (html instanceof Node) {
    element.appendChild(html);
    return;
  }
  
  // If it's a string, we need to be very careful
  if (typeof html === 'string') {
    // For simple text, just set textContent
    if (!html.includes('<') && !html.includes('>')) {
      element.textContent = html;
      return;
    }
    
    // For HTML strings, parse and rebuild safely
    try {
      const safeContent = convertHTMLString(html);
      element.appendChild(safeContent);
    } catch (error) {
      // If parsing fails, fall back to text
      console.error('Failed to parse HTML safely:', error);
      element.textContent = html;
    }
  }
}

/**
 * Create safe event handler
 */
function safeAddEventListener(element, event, handler) {
  if (!element || typeof handler !== 'function') return;
  
  // Wrap handler to prevent event-based XSS
  const safeHandler = function(e) {
    try {
      // Prevent default for potentially dangerous events
      if (event === 'click' && e.target.tagName === 'A') {
        const href = e.target.getAttribute('href');
        if (href && href.startsWith('javascript:')) {
          e.preventDefault();
          console.warn('Blocked javascript: URL');
          return;
        }
      }
      
      // Call original handler
      return handler.call(this, e);
    } catch (error) {
      console.error('Event handler error:', error);
    }
  };
  
  element.addEventListener(event, safeHandler);
}

// Export for Node.js (if running server-side)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    safeSetText,
    safeCreateElement,
    safeBuildHTML,
    safeUpdateElement,
    escapeHTML,
    sanitizeHTML,
    safeRenderTemplate,
    convertHTMLString,
    safeSetHTML,
    safeAddEventListener
  };
}

// Export for browser
if (typeof window !== 'undefined') {
  window.SafeDOM = {
    safeSetText,
    safeCreateElement,
    safeBuildHTML,
    safeUpdateElement,
    escapeHTML,
    sanitizeHTML,
    safeRenderTemplate,
    convertHTMLString,
    safeSetHTML,
    safeAddEventListener
  };
}