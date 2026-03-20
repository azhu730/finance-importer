import { useState, useEffect, useCallback } from 'react';
import { getMappings, saveMapping, deleteMapping } from '../api/client.js';

export function useMappings() {
  const [upstreams, setUpstreams] = useState([]);
  const [saved, setSaved]         = useState({});
  const [loading, setLoading]     = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getMappings();
      setUpstreams(data.upstreams);
      setSaved(data.saved);
    } catch (e) {
      console.error('Failed to load mappings:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const save = useCallback(async (upstreamKey, category, subCategory) => {
    await saveMapping(upstreamKey, category, subCategory);
    await refresh();
  }, [refresh]);

  const remove = useCallback(async (key) => {
    await deleteMapping(key);
    await refresh();
  }, [refresh]);

  const unmappedCount = upstreams.filter(u => !saved[u.toLowerCase().trim()]).length;

  return { upstreams, saved, loading, unmappedCount, refresh, save, remove };
}
