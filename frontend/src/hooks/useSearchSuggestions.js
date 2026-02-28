import { useState, useRef, useCallback, useEffect } from 'react';
import { suggestAnnouncements } from '../api/api';

const DEBOUNCE_MS = 250;
const MIN_CHARS = 2;

/**
 * Hook for search autocomplete suggestions.
 *
 * Features:
 * - Debounced API calls (250 ms)
 * - AbortController cancels stale requests so only the latest one wins
 * - Clears suggestions automatically when input is too short
 *
 * Returns:
 *   searchTerm, setSearchTerm   – controlled input value
 *   suggestions                 – array of lightweight announcement objects
 *   isLoading                   – true while a request is in-flight
 *   showSuggestions / setShowSuggestions – visibility of the dropdown
 *   clearSearch()               – reset everything (e.g. after navigation)
 */
export default function useSearchSuggestions() {
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const debounceTimer = useRef(null);
  const abortRef = useRef(null);

  // Fetch suggestions with debounce + cancellation
  useEffect(() => {
    const trimmed = searchTerm.trim();

    // Not enough characters → reset immediately
    if (trimmed.length < MIN_CHARS) {
      setSuggestions([]);
      setShowSuggestions(false);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    // Clear previous timer
    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    debounceTimer.current = setTimeout(async () => {
      // Abort any in-flight request
      if (abortRef.current) abortRef.current.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const res = await suggestAnnouncements(trimmed, controller.signal);
        // Only update if this controller wasn't aborted
        if (!controller.signal.aborted) {
          setSuggestions(res.data);
          setShowSuggestions(res.data.length > 0);
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

    // Cleanup on unmount or next keystroke
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [searchTerm]);

  // Cancel in-flight request on unmount
  useEffect(() => {
    return () => {
      if (abortRef.current) abortRef.current.abort();
    };
  }, []);

  const clearSearch = useCallback(() => {
    setSearchTerm('');
    setSuggestions([]);
    setShowSuggestions(false);
    setIsLoading(false);
    if (abortRef.current) abortRef.current.abort();
  }, []);

  return {
    searchTerm,
    setSearchTerm,
    suggestions,
    isLoading,
    showSuggestions,
    setShowSuggestions,
    clearSearch,
  };
}
