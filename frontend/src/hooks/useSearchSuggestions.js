import { useState, useRef, useCallback, useEffect } from 'react';
import { suggestAnnouncements } from '../api/api';

const DEBOUNCE_MS = 250;
const MIN_CHARS = 2;
const MAX_RECENT = 5;
const RECENT_KEY = 'hobbiz_recent_searches';

function loadRecent() {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY)) || [];
  } catch {
    return [];
  }
}

function saveRecent(list) {
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(list.slice(0, MAX_RECENT)));
  } catch { /* quota exceeded – ignore */ }
}

export default function useSearchSuggestions() {
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [recentSearches, setRecentSearches] = useState(loadRecent);
  // true once a fetch completes with 0 results (distinct from "haven't searched yet")
  const [noResults, setNoResults] = useState(false);

  const debounceTimer = useRef(null);
  const abortRef = useRef(null);

  // Fetch suggestions with debounce + cancellation
  useEffect(() => {
    const trimmed = searchTerm.trim();

    if (trimmed.length < MIN_CHARS) {
      setSuggestions([]);
      setNoResults(false);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setNoResults(false);

    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    debounceTimer.current = setTimeout(async () => {
      if (abortRef.current) abortRef.current.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const res = await suggestAnnouncements(trimmed, controller.signal);
        if (!controller.signal.aborted) {
          setSuggestions(res.data);
          setNoResults(res.data.length === 0);
          setShowSuggestions(true);
          setIsLoading(false);
        }
      } catch (err) {
        if (err.name !== 'CanceledError' && err.code !== 'ERR_CANCELED') {
          console.error('Eroare la sugestii:', err);
          setSuggestions([]);
          setIsLoading(false);
        }
      }
    }, DEBOUNCE_MS);

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [searchTerm]);

  // Reset highlighted index whenever suggestions change
  useEffect(() => { setActiveIndex(-1); }, [suggestions]);

  // Cancel in-flight request on unmount
  useEffect(() => {
    return () => {
      if (abortRef.current) abortRef.current.abort();
    };
  }, []);

  const addRecentSearch = useCallback((term) => {
    const trimmed = term.trim();
    if (!trimmed) return;
    setRecentSearches((prev) => {
      const next = [trimmed, ...prev.filter((t) => t !== trimmed)].slice(0, MAX_RECENT);
      saveRecent(next);
      return next;
    });
  }, []);

  const removeRecentSearch = useCallback((term) => {
    setRecentSearches((prev) => {
      const next = prev.filter((t) => t !== term);
      saveRecent(next);
      return next;
    });
  }, []);

  const clearAllRecent = useCallback(() => {
    setRecentSearches([]);
    saveRecent([]);
  }, []);

  const clearSearch = useCallback(() => {
    setSearchTerm('');
    setSuggestions([]);
    setShowSuggestions(false);
    setIsLoading(false);
    setActiveIndex(-1);
    setNoResults(false);
    if (abortRef.current) abortRef.current.abort();
  }, []);

  return {
    searchTerm,
    setSearchTerm,
    suggestions,
    isLoading,
    showSuggestions,
    setShowSuggestions,
    activeIndex,
    setActiveIndex,
    noResults,
    recentSearches,
    addRecentSearch,
    removeRecentSearch,
    clearAllRecent,
    clearSearch,
  };
}
