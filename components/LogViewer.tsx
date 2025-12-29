import React, { useEffect, useRef } from 'react';
import { LogEntry } from '../types';

interface LogViewerProps {
  logs: LogEntry[];
}

const LogViewer: React.FC<LogViewerProps> = ({ logs }) => {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  return (
    <div className="bg-slate-900 rounded-lg border border-slate-700 p-4 h-64 flex flex-col font-mono text-sm shadow-inner">
      <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-700">
        <span className="text-slate-400 text-xs uppercase tracking-wider font-semibold">System Logs</span>
        <div className="flex gap-1">
           <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
           <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse delay-75"></div>
           <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse delay-150"></div>
        </div>
      </div>
      <div className="overflow-y-auto flex-1 scrollbar-hide space-y-2">
        {logs.length === 0 && <div className="text-slate-600 italic">No activity recorded...</div>}
        {logs.map((log) => (
          <div key={log.id} className="flex gap-2 animate-in fade-in slide-in-from-left-2 duration-300">
            <span className="text-slate-500 shrink-0">[{log.timestamp}]</span>
            <span className={`
              break-all
              ${log.type === 'info' ? 'text-blue-400' : ''}
              ${log.type === 'success' ? 'text-green-400' : ''}
              ${log.type === 'warning' ? 'text-yellow-400' : ''}
              ${log.type === 'error' ? 'text-red-400 font-bold' : ''}
            `}>
              {log.message}
            </span>
          </div>
        ))}
        <div ref={endRef} />
      </div>
    </div>
  );
};

export default LogViewer;
