import { useState, useCallback } from 'react';

export function useAlert(duration = 5000) {
  const [alert, setAlert] = useState(null);

  const showAlert = useCallback((msg, type = 'error') => {
    setAlert({ msg, type });
    setTimeout(() => setAlert(null), duration);
  }, [duration]);

  const clearAlert = useCallback(() => setAlert(null), []);

  return { alert, showAlert, clearAlert };
}
