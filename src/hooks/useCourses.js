import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchCourses } from '../services/api';

export default function useCourses({ loadOnMount = true } = {}) {
  const [courses, setCourses] = useState([]);
  const [status, setStatus] = useState(loadOnMount ? 'loading' : 'idle');
  const [error, setError] = useState(null);
  const controllerRef = useRef(null);

  const loadCourses = useCallback(async () => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    setStatus('loading');
    setError(null);

    try {
      const result = await fetchCourses({ signal: controller.signal });
      if (controller.signal.aborted) return;
      setCourses(result);
      setStatus('success');
    } catch (requestError) {
      if (controller.signal.aborted || requestError.code === 'ABORTED') return;
      setCourses([]);
      setError(requestError);
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    if (loadOnMount) loadCourses();
    return () => controllerRef.current?.abort();
  }, [loadOnMount, loadCourses]);

  return { courses, status, error, retry: loadCourses };
}
