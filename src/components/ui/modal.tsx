'use client';

import { useEffect, useRef, type KeyboardEvent, type ReactNode } from 'react';

/**
 * Shared modal shell: backdrop, dialog with a titled header and × close,
 * Escape-to-close, and a Tab focus trap. Callers own their open state and
 * are expected to restore focus to their trigger in `onClose`.
 */
export function Modal({
  title,
  onClose,
  onKeyDown,
  children,
}: {
  title: string;
  onClose: () => void;
  /** Called for keys the modal itself does not handle (Escape, Tab). */
  onKeyDown?: (event: KeyboardEvent<HTMLDivElement>) => void;
  children: ReactNode;
}): ReactNode {
  const modalRef = useRef<HTMLDivElement>(null);

  // Escape must close the modal even when focus has left it (e.g. after
  // clicking non-interactive text), so listen at the document level.
  useEffect(() => {
    function onDocumentKeyDown(event: globalThis.KeyboardEvent): void {
      if (event.key === 'Escape') {
        onClose();
      }
    }
    document.addEventListener('keydown', onDocumentKeyDown);
    return () => document.removeEventListener('keydown', onDocumentKeyDown);
  }, [onClose]);

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>): void {
    if (event.key === 'Tab') {
      const focusables = Array.from(
        modalRef.current?.querySelectorAll<HTMLElement>(
          'button:not(:disabled), input',
        ) ?? [],
      );
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (first === undefined || last === undefined) {
        return;
      }
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
      return;
    }
    onKeyDown?.(event);
  }

  return (
    <div
      className="modal-backdrop"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
      onKeyDown={handleKeyDown}
    >
      <div
        ref={modalRef}
        className="modal-panel"
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="modal-header">
          <h2 className="m-0 font-serif text-[1.3rem]">{title}</h2>
          <button
            type="button"
            className="modal-close"
            aria-label="Close"
            onClick={onClose}
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
