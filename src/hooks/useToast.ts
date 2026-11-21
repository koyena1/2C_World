import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Local toast state with auto-dismiss.
 * @param duration ms before the toast hides; 0 keeps it until `hideToast` is called.
 */
export const useToast = (duration = 3500) => {
  const [message, setMessage] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = () => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  };

  const hideToast = useCallback(() => {
    clearTimer();
    setMessage(null);
  }, []);

  const showToast = useCallback(
    (next: string) => {
      clearTimer();
      setMessage(next);
      if (duration > 0) {
        timer.current = setTimeout(() => {
          timer.current = null;
          setMessage(null);
        }, duration);
      }
    },
    [duration]
  );

  useEffect(() => clearTimer, []);

  return { message, showToast, hideToast };
};
