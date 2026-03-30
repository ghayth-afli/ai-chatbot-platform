/**
 * React hook for fetching and managing user summaries.
 *
 * Usage:
 *   const { summaries, loading, error } = useUserSummaries(userId);
 */

import { useState, useEffect } from "react";
import axios from "axios";

export const useUserSummaries = (userId) => {
  const [summaries, setSummaries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [cache, setCache] = useState({});
  const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  useEffect(() => {
    if (!userId) {
      setSummaries([]);
      return;
    }

    // Check cache first
    const cachedData = cache[userId];
    if (cachedData && Date.now() - cachedData.timestamp < CACHE_TTL) {
      setSummaries(cachedData.summaries);
      return;
    }

    fetchSummaries();
  }, [userId]);

  const fetchSummaries = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(
        `/api/ai/users/${userId}/profile/summary`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
            "Content-Type": "application/json",
          },
        },
      );

      const data = response.data.results || [];
      setSummaries(data);

      // Cache results
      setCache({
        ...cache,
        [userId]: {
          summaries: data,
          timestamp: Date.now(),
        },
      });
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to load summaries");
      setSummaries([]);
    } finally {
      setLoading(false);
    }
  };

  return {
    summaries,
    loading,
    error,
    refetch: fetchSummaries,
  };
};

export default useUserSummaries;
