import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { useFocusTrap } from '../hooks/useFocusTrap';

/**
 * Modal - Accessible modal dialog with focus trap
 *
 * Features:
 * - Focus trap (Tab/Shift+Tab cycle within modal)
 * - Escape to close
 * - Focus restoration on close
 * - ARIA attributes
 * - Backdrop click to close (optional)
 */
export default function Modal({
  isOpen,
  onClose,
  children,
  title,
  maxWidth = 'max-w-2xl',
  closeOnBackdrop = true,
}) {
  const modalRef = useRef(null);

  // Focus trap
  useFocusTrap(modalRef, isOpen, onClose);

  // Handle backdrop click
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && closeOnBackdrop) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div
        ref={modalRef}
        className={`bg-white rounded-lg shadow-xl ${maxWidth} w-full max-h-[90vh] flex flex-col`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        {children}
      </div>
    </div>
  );
}

/**
 * ModalHeader - Standard modal header with close button
 */
export function ModalHeader({ title, onClose, children }) {
  return (
    <div className="flex items-center justify-between p-6 border-b">
      <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
      <button
        onClick={onClose}
        className="text-gray-400 hover:text-gray-600 transition-colors"
        aria-label="Close modal"
      >
        <X className="w-6 h-6" />
      </button>
    </div>
  );
}

/**
 * ModalBody - Scrollable modal body
 */
export function ModalBody({ children, className = '' }) {
  return (
    <div className={`flex-1 overflow-y-auto p-6 ${className}`}>
      {children}
    </div>
  );
}

/**
 * ModalFooter - Modal footer with actions
 */
export function ModalFooter({ children, className = '' }) {
  return (
    <div className={`flex items-center justify-end gap-3 p-6 border-t ${className}`}>
      {children}
    </div>
  );
}