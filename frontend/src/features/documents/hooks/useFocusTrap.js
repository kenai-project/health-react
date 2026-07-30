import { useEffect, useRef } from 'react';

/**
 * useFocusTrap - Trap keyboard focus within a modal
 *
 * Requirements:
 * - Focus moves into the modal when opened
 * - Focus returns to the triggering element when closed
 * - Tab and Shift+Tab cycle within the modal
 * - Escape closes the modal
 * - Background content is not reachable by keyboard
 */
export function useFocusTrap(containerRef, isOpen, onClose) {
  const previousFocusRef = useRef(null);

  // Store the previously focused element when modal opens
  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement;
    }
  }, [isOpen]);

  // Focus the first focusable element when modal opens
  useEffect(() => {
    if (isOpen && containerRef.current) {
      const focusableElements = getFocusableElements(containerRef.current);
      if (focusableElements.length > 0) {
        focusableElements[0].focus();
      }
    }
  }, [isOpen, containerRef]);

  // Handle keyboard events
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }

      if (e.key !== 'Tab') return;

      const focusableElements = getFocusableElements(containerRef.current);
      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (e.shiftKey) {
        // Shift+Tab: if focused on first element, wrap to last
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab: if focused on last element, wrap to first
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose, containerRef]);

  // Restore focus when modal closes
  useEffect(() => {
    if (!isOpen && previousFocusRef.current) {
      previousFocusRef.current.focus();
      previousFocusRef.current = null;
    }
  }, [isOpen]);
}

/**
 * Get all focusable elements within a container
 */
function getFocusableElements(container) {
  if (!container) return [];

  const selector = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ].join(', ');

  return Array.from(container.querySelectorAll(selector)).filter(
    (el) => el.offsetParent !== null // Only visible elements
  );
}