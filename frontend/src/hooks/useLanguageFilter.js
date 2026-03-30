import { useState, useEffect, useCallback, useMemo } from "react";
import { getChatHistory } from "../services/chatAPI";

const DEFAULT_LIMIT = 12;

/**
 * useLanguageFilter
 * Fetches chat history grouped by language with pagination helpers.
 */
export function useLanguageFilter(initialLanguage = "all", options = {}) {
  const limit = useMemo(() => options.limit || DEFAULT_LIMIT, [options.limit]);
  const [language, setLanguage] = useState(initialLanguage);
  const [messages, setMessages] = useState([]);
  const [counts, setCounts] = useState({ all: 0, en: 0, ar: 0 });
  const [offset, setOffset] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchHistory = useCallback(
    async (targetOffset = 0) => {
      setLoading(true);
      setError(null);
      try {
        const response = await getChatHistory({
          language: language === "all" ? null : language,
          limit,
          offset: targetOffset,
        });

        setMessages(response.messages || []);
        setCounts(
          response.language_counts || {
            all: response.count || 0,
            en: 0,
            ar: 0,
          },
        );
        setOffset(response.offset ?? targetOffset);
        setTotal(response.count ?? 0);
      } catch (err) {
        setError(err.message || "Failed to load history");
        setMessages([]);
      } finally {
        setLoading(false);
      }
    },
    [language, limit],
  );

  useEffect(() => {
    fetchHistory(0);
  }, [language, fetchHistory]);

  const nextPage = useCallback(() => {
    if (offset + limit >= total) {
      return;
    }
    fetchHistory(offset + limit);
  }, [fetchHistory, limit, offset, total]);

  const prevPage = useCallback(() => {
    if (offset === 0) {
      return;
    }
    fetchHistory(Math.max(0, offset - limit));
  }, [fetchHistory, limit, offset]);

  const refresh = useCallback(() => {
    fetchHistory(offset);
  }, [fetchHistory, offset]);

  return {
    messages,
    counts,
    language,
    setLanguage,
    loading,
    error,
    pagination: {
      limit,
      offset,
      total,
    },
    nextPage,
    prevPage,
    refresh,
  };
}