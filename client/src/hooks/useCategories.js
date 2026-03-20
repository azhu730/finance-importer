import { useState, useEffect, useCallback } from 'react';
import { getCategories, createCategory, deleteCategory } from '../api/client.js';

export function useCategories() {
  const [groups, setGroups]   = useState({});
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setGroups(await getCategories());
    } catch (e) {
      console.error('Failed to load categories:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const add = useCallback(async (category, subCategory) => {
    await createCategory(category, subCategory);
    await refresh();
  }, [refresh]);

  const remove = useCallback(async (category, subCategory) => {
    await deleteCategory(category, subCategory);
    await refresh();
  }, [refresh]);

  const names = Object.keys(groups).sort();

  return { groups, names, loading, refresh, add, remove };
}
