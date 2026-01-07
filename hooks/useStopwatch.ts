/**
 * useStopwatch Hook
 * 
 * A hook for tracking recording duration with start/stop/reset functionality.
 * Inspired by contrastio/recorder's stopwatch implementation.
 */

import { useEffect, useRef, useState, useCallback } from 'react';

export interface StopwatchState {
  elapsed: number;
  isRunning: boolean;
  start: () => void;
  stop: () => void;
  reset: () => void;
  formatTime: () => string;
}

const useStopwatch = (): StopwatchState => {
  const [previousDuration, setPreviousDuration] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const [lastTime, setLastTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  
  const requestIdRef = useRef(0);

  const updateTime = useCallback((time: number) => {
    setLastTime(time);
    requestIdRef.current = requestAnimationFrame(updateTime);
  }, []);

  useEffect(() => {
    return () => {
      cancelAnimationFrame(requestIdRef.current);
    };
  }, []);

  const elapsed = isRunning ? previousDuration + lastTime - startTime : previousDuration;

  const start = useCallback(() => {
    const now = performance.now();
    setStartTime(now);
    setLastTime(now);
    setIsRunning(true);
    requestIdRef.current = requestAnimationFrame(updateTime);
  }, [updateTime]);

  const stop = useCallback(() => {
    cancelAnimationFrame(requestIdRef.current);
    setPreviousDuration(prev => prev + performance.now() - startTime);
    setStartTime(0);
    setLastTime(0);
    setIsRunning(false);
  }, [startTime]);

  const reset = useCallback(() => {
    cancelAnimationFrame(requestIdRef.current);
    setPreviousDuration(0);
    setStartTime(0);
    setLastTime(0);
    setIsRunning(false);
  }, []);

  // Format elapsed time as HH:MM:SS or MM:SS
  const formatTime = useCallback(() => {
    const totalSeconds = Math.floor(elapsed / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const parts = [minutes, seconds].map(v => v.toString().padStart(2, '0'));
    
    if (hours > 0) {
      parts.unshift(hours.toString().padStart(2, '0'));
    }

    return parts.join(':');
  }, [elapsed]);

  return {
    elapsed,
    isRunning,
    start,
    stop,
    reset,
    formatTime,
  };
};

export default useStopwatch;
