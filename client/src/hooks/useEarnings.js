import { useState, useEffect, useCallback } from 'react';
import { getEarnings, createEarning, patchEarning, deleteEarning } from '../api/client.js';

export function useEarnings() {
  const [rows, setRows]       = useState([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setRows(await getEarnings());
    } catch (e) {
      console.error('Failed to load earnings:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const add = useCallback(async () => {
    await createEarning({ date: '', description: '', amount: 0, source: '', notes: '' });
    await refresh();
  }, [refresh]);

  const patch = useCallback(async (id, fields) => {
    await patchEarning(id, fields);
  }, []);

  const remove = useCallback(async (id) => {
    await deleteEarning(id);
    await refresh();
  }, [refresh]);

  return { rows, loading, refresh, add, patch, remove };
}
