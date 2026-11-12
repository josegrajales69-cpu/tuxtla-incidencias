import { useEffect, useRef } from 'react';
export function useDialog<T extends HTMLElement = HTMLElement>(open: boolean, onClose: () => void) {
 const ref = useRef<T>(null);
 const close = useRef(onClose); close.current = onClose;
 useEffect(() => {
  if (!open) return;
  const previous = document.activeElement as HTMLElement | null;
  const sheet = ref.current;
  const controls = () => Array.from(sheet?.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), textarea, select, summary, [tabindex="0"]') || []).filter(el => el.getClientRects().length > 0);
  controls()[0]?.focus();
  const handler = (event: KeyboardEvent) => {
   if (event.key === 'Escape') { event.preventDefault(); close.current(); }
   if (event.key !== 'Tab') return;
   const list=controls(); const first=list[0]; const last=list[list.length-1];
   if (event.shiftKey && document.activeElement===first) {event.preventDefault();last?.focus();}
   else if (!event.shiftKey && document.activeElement===last) {event.preventDefault();first?.focus();}
  };
  document.addEventListener('keydown',handler);
  return () => {document.removeEventListener('keydown',handler);previous?.focus();};
 },[open]);
 return ref;
}
