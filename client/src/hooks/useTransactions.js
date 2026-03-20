import { useState, useEffect, useCallback, useRef } from 'react';
import { getTransactions } from '../api/client.js';

export function useTransactions() {
  const [rows, setRows]       = useState([]);
  const [total, setTotal]     = useState(0);
  const [page, setPage]       = useState(1);
  const [pages, setPages]     = useState(1);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    source: '',
    category: '',
    sort: 'date',
    asc: false,
  });

  // Use refs so load() never goes stale without re-creating itself
  const filtersRef = useRef(filters);
  const pageRef    = useRef(page);
  const debounceRef = useRef(null);
  filtersRef.current = filters;
  pageRef.current    = page;

  const load = useCallback(async (overridePage) => {
    setLoading(true);
    try {
      const p = overridePage ?? pageRef.current;
      const data = await getTransactions({ ...filtersRef.current, page: p, limit: 50 });
      setRows(data.rows);
      setTotal(data.total);
      setPages(data.pages);
      setPage(p);
    } catch (e) {
      console.error('Failed to load transactions:', e);
    } finally {
      setLoading(false);
    }
  }, []); // stable — reads from refs

  // Reload when filters change; debounce only the search field
  useEffect(() => {
    clearTimeout(debounceRef.current);
    const delay = filters.search ? 350 : 0;
    debounceRef.current = setTimeout(() => load(1), delay);
    return () => clearTimeout(debounceRef.current);
  }, [filters, load]);

  const updateFilter = useCallback((key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const toggleSort = useCallback((key) => {
    setFilters(prev => ({
      ...prev,
      sort: key,
      asc: prev.sort === key ? !prev.asc : false,
    }));
  }, []);

  const goToPage = useCallback((p) => load(p), [load]);
  const refresh  = useCallback(() => load(pageRef.current), [load]);

  return { rows, total, page, pages, loading, filters, updateFilter, toggleSort, goToPage, refresh };
}
