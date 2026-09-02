import { useEffect, useRef } from 'react';

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])'
].join(', ');

/**
 * Keep keyboard focus inside an open dialog, close it on Escape, and hand
 * focus back to whatever opened it.
 *
 * Without this, tabbing out of a modal lands on the page behind it — the
 * screen reader keeps reading a view the visitor cannot see.
 */
export function useFocusTrap(isOpen: boolean, onClose?: () => void) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const previouslyFocusedRef = useRef<Element | null>(null);

  // Callers pass an inline arrow, so `onClose` is a new function on every
  // parent render. Reading it through a ref keeps the effect below keyed on
  // `isOpen` alone: re-running it would pull focus out of the open dialog and
  // then record an element *inside* the dialog as the one to restore to.
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onCloseRef.current?.();
        return;
      }

      if (event.key !== 'Tab' || !containerRef.current) return;

      const focusable = [...containerRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)]
        .filter(element => element.offsetParent !== null || element === document.activeElement);

      if (focusable.length === 0) {
        event.preventDefault();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    previouslyFocusedRef.current = document.activeElement;

    const container = containerRef.current;
    if (container && !container.contains(document.activeElement)) {
      const firstFocusable = container.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
      (firstFocusable || container).focus?.();
    }

    document.addEventListener('keydown', handleKeyDown, true);

    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
      (previouslyFocusedRef.current as HTMLElement | null)?.focus?.();
    };
  }, [isOpen]);

  return containerRef;
}
