'use client';

import { useEffect, useState, useCallback, useRef } from 'react';

export interface LogEntry {
  id: string;
  level: 'log' | 'error' | 'warn' | 'info' | 'debug';
  message: string;
  data?: unknown;
  timestamp: number;
}

interface ConsoleLoggerProps {
  maxLogs?: number;
  enabled?: boolean;
}

/**
 * Console Logger Component
 * Captures and displays console logs in a floating panel
 * Useful for debugging in Base app where console isn't easily accessible
 */
export function ConsoleLogger({ maxLogs = 100, enabled = true }: ConsoleLoggerProps) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const logIdCounter = useRef(0);
  const welcomeLogged = useRef(false);
  const originalConsole = useRef({
    log: console.log,
    error: console.error,
    warn: console.warn,
    info: console.info,
    debug: console.debug,
  });

  // Generate unique ID for each log
  const generateLogId = useCallback(() => {
    return `log-${Date.now()}-${++logIdCounter.current}`;
  }, []);

  // Add log entry - deferred to avoid setState during render
  const addLog = useCallback((level: LogEntry['level'], ...args: unknown[]) => {
    if (!enabled) return;

    // Defer state update to avoid setState during render
    queueMicrotask(() => {
      const message = args
        .map((arg) => {
          if (typeof arg === 'string') return arg;
          try {
            return JSON.stringify(arg, null, 2);
          } catch {
            return String(arg);
          }
        })
        .join(' ');

      const entry: LogEntry = {
        id: generateLogId(),
        level,
        message,
        data: args.length > 1 ? args.slice(1) : undefined,
        timestamp: Date.now(),
      };

      setLogs((prev) => {
        const newLogs = [entry, ...prev].slice(0, maxLogs);
        return newLogs;
      });
    });
  }, [enabled, maxLogs, generateLogId]);

  // Intercept console methods
  useEffect(() => {
    if (!enabled) return;

    // Add a welcome log only once (deferred to avoid setState in effect warning)
    if (!welcomeLogged.current) {
      welcomeLogged.current = true;
      // Defer the setState call to avoid calling setState synchronously in effect
      setTimeout(() => {
        addLog('info', 'Debug console initialized. Tap the bug icon to view logs.');
      }, 0);
    }

    // Override console methods
    console.log = (...args: unknown[]) => {
      originalConsole.current.log(...args);
      addLog('log', ...args);
    };

    console.error = (...args: unknown[]) => {
      originalConsole.current.error(...args);
      addLog('error', ...args);
    };

    console.warn = (...args: unknown[]) => {
      originalConsole.current.warn(...args);
      addLog('warn', ...args);
    };

    console.info = (...args: unknown[]) => {
      originalConsole.current.info(...args);
      addLog('info', ...args);
    };

    console.debug = (...args: unknown[]) => {
      originalConsole.current.debug(...args);
      addLog('debug', ...args);
    };

    // Restore original console on unmount
    return () => {
      console.log = originalConsole.current.log;
      console.error = originalConsole.current.error;
      console.warn = originalConsole.current.warn;
      console.info = originalConsole.current.info;
      console.debug = originalConsole.current.debug;
    };
  }, [enabled, addLog]);

  const getLevelColor = (level: LogEntry['level']) => {
    switch (level) {
      case 'error':
        return 'text-rose-400';
      case 'warn':
        return 'text-amber-400';
      case 'info':
        return 'text-blue-400';
      case 'debug':
        return 'text-purple-400';
      default:
        return 'text-zinc-300';
    }
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  if (!enabled) return null;

  return (
    <>
      {/* Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-4 right-4 z-[9999] bg-zinc-800 hover:bg-zinc-700 text-white px-3 py-2 rounded-lg text-xs font-mono shadow-lg border border-zinc-700 flex items-center gap-2"
          title="Open Debug Console"
        >
          <span>🐛</span>
          <span>Console</span>
          {logs.length > 0 && (
            <span className="bg-rose-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
              {logs.length}
            </span>
          )}
        </button>
      )}

      {/* Console Panel */}
      {isOpen && (
        <div
          className={`fixed ${
            isMinimized ? 'bottom-4 right-4 w-64' : 'bottom-4 right-4 left-4 max-w-2xl h-[50vh]'
          } z-[9999] bg-zinc-900 border border-zinc-700 rounded-lg shadow-2xl flex flex-col overflow-hidden`}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-2 bg-zinc-800 border-b border-zinc-700">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-white">Debug Console</span>
              <span className="text-xs text-zinc-400">({logs.length})</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setLogs([])}
                className="text-xs px-2 py-1 text-zinc-400 hover:text-white hover:bg-zinc-700 rounded"
                title="Clear logs"
              >
                Clear
              </button>
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="text-xs px-2 py-1 text-zinc-400 hover:text-white hover:bg-zinc-700 rounded"
                title={isMinimized ? 'Expand' : 'Minimize'}
              >
                {isMinimized ? '⬆' : '⬇'}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="text-xs px-2 py-1 text-zinc-400 hover:text-white hover:bg-zinc-700 rounded"
                title="Close"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Logs */}
          {!isMinimized && (
            <div className="flex-1 overflow-y-auto p-2 font-mono text-xs">
              {logs.length === 0 ? (
                <div className="text-zinc-500 text-center py-8">No logs yet...</div>
              ) : (
                <div className="space-y-1">
                  {logs.map((log) => (
                    <div
                      key={log.id}
                      className={`p-2 rounded border-l-2 ${
                        log.level === 'error'
                          ? 'bg-rose-500/10 border-rose-500'
                          : log.level === 'warn'
                          ? 'bg-amber-500/10 border-amber-500'
                          : 'bg-zinc-800/50 border-zinc-700'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <span className="text-zinc-500 text-[10px] flex-shrink-0">
                          {formatTime(log.timestamp)}
                        </span>
                        <span
                          className={`font-bold flex-shrink-0 uppercase text-[10px] ${getLevelColor(
                            log.level
                          )}`}
                        >
                          {log.level}
                        </span>
                        <span className={`flex-1 break-words whitespace-pre-wrap ${getLevelColor(log.level)}`}>
                          {log.message}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </>
  );
}
