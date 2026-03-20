import { useState, useEffect, useCallback } from 'react';
import { getStats } from '../api/client.js';

export function useStats() {
  const [stats, setStats] = useState({
    total: 0,
    uncategorized: 0,
    totalSpend: 0,
    sources: [],
    topCategories: [],
  });

  const refreshStats = useCallback(async () => {
    try {
      const data = await getStats();
      setStats(data);
    } catch (e) {
      console.error('Failed to load stats:', e);
    }
  }, []);

  useEffect(() => { refreshStats(); }, [refreshStats]);

  return { stats, refreshStats };
}
