/**
 * Security and CSP-compliant JavaScript utilities
 * All functionality moved from inline scripts to external files
 */

(function() {
  'use strict';

  // Global security utilities
  window.SecurityUtils = {
    /**
     * Initialize CSP-compliant event listeners
     */
    init: function() {
      this.initPasswordToggle();
      this.initFormValidation();
      this.initCSRFTokens();
      this.initSecurityHeaders();
    },

    /**
     * Password visibility toggle (replaces inline onclick handlers)
     */
    initPasswordToggle: function() {
      document.addEventListener('click', function(e) {
        if (e.target.matches('[data-password-toggle]')) {
          e.preventDefault();
          const button = e.target;
          const input = button.parentElement.querySelector('input[type="password"], input[type="text"]');
          
          if (input) {
            const isPassword = input.type === 'password';
            input.type = isPassword ? 'text' : 'password';
            
            // Update button icon
            const icon = button.querySelector('svg');
            if (icon) {
              if (isPassword) {
                // Show eye-off icon
                icon.innerHTML = '<path d="M9.88 9.88a3 3 0 1 0 4.24 4.24m-4.24-4.24L3 3m6.88 6.88L21 21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>';
              } else {
                // Show eye icon
                icon.innerHTML = '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2"/>';
              }
            }
            
            // Update aria-label
            button.setAttribute('aria-label', isPassword ? 'Hide password' : 'Show password');
          }
        }
      });
    },

    /**
     * Form validation (replaces inline validation)
     */
    initFormValidation: function() {
      document.addEventListener('submit', function(e) {
        const form = e.target;
        if (form.matches('[data-validate]')) {
          e.preventDefault();
          
          // Basic validation
          const requiredFields = form.querySelectorAll('[required]');
          let isValid = true;
          
          requiredFields.forEach(function(field) {
            if (!field.value.trim()) {
              field.classList.add('border-red-500');
              isValid = false;
            } else {
              field.classList.remove('border-red-500');
            }
          });
          
          if (isValid) {
            // Submit form
            form.submit();
          }
        }
      });
    },

    /**
     * CSRF token management
     */
    initCSRFTokens: function() {
      // Auto-add CSRF tokens to forms
      document.addEventListener('submit', function(e) {
        const form = e.target;
        if (form.method.toLowerCase() === 'post' && !form.querySelector('[name="csrf_token"]')) {
          const csrfToken = document.querySelector('meta[name="csrf-token"]');
          if (csrfToken) {
            const input = document.createElement('input');
            input.type = 'hidden';
            input.name = 'csrf_token';
            input.value = csrfToken.content;
            form.appendChild(input);
          }
        }
      });
    },

    /**
     * Security headers and CSP compliance
     */
    initSecurityHeaders: function() {
      // Ensure all external links open in new tab with security attributes
      document.addEventListener('click', function(e) {
        if (e.target.matches('a[href^="http"]')) {
          e.target.setAttribute('rel', 'noopener noreferrer');
          e.target.setAttribute('target', '_blank');
        }
      });
    },

    /**
     * Safe JSON parsing (replaces eval)
     */
    safeJSONParse: function(jsonString) {
      try {
        return JSON.parse(jsonString);
      } catch (e) {
        console.error('Invalid JSON:', e);
        return null;
      }
    },

    /**
     * Safe URL validation
     */
    isValidURL: function(string) {
      try {
        new URL(string);
        return true;
      } catch (_) {
        return false;
      }
    },

    /**
     * XSS prevention - sanitize user input
     */
    sanitizeInput: function(input) {
      const div = document.createElement('div');
      div.textContent = input;
      return div.innerHTML;
    }
  };

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      window.SecurityUtils.init();
    });
  } else {
    window.SecurityUtils.init();
  }

})();
