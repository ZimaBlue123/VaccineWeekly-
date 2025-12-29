import React, { useState, useEffect, useCallback, useRef } from 'react';
import { BotStatus, LogEntry } from './types';
import { generateWeeklyReport } from './services/geminiService';
import { sendToWeCom } from './services/wecomService';
import { WECOM_WEBHOOK_DEFAULT } from './constants';
import LogViewer from './components/LogViewer';
import ReportPreview from './components/ReportPreview';

// Helper for formatted time
const getTime = () => new Date().toLocaleTimeString('en-GB', { hour12: false });

const App: React.FC = () => {
  // Config State
  const [apiKey, setApiKey] = useState<string>(process.env.API_KEY || '');
  const [webhookUrl, setWebhookUrl] = useState<string>(WECOM_WEBHOOK_DEFAULT);
  const [autoMode, setAutoMode] = useState<boolean>(true);
  const [requireConfirmation, setRequireConfirmation] = useState<boolean>(true);
  
  // Runtime State
  const [status, setStatus] = useState<BotStatus>(BotStatus.WAITING);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [lastReport, setLastReport] = useState<string>('');
  const [countDown, setCountDown] = useState<string>('--:--:--');
  
  // Robust Scheduling Refs
  const lastRunDateRef = useRef<string>('');

  // Logger
  const addLog = useCallback((message: string, type: LogEntry['type'] = 'info') => {
    setLogs(prev => [...prev, {
      id: Math.random().toString(36).substring(7),
      timestamp: getTime(),
      message,
      type
    }]);
  }, []);

  // --- Step 2: Send Phase ---
  const executeSend = useCallback(async (content: string) => {
    try {
      setStatus(BotStatus.SENDING);
      addLog(`Sending report to WeCom...`, 'info');
      
      await sendToWeCom(webhookUrl, content);
      addLog("Successfully pushed to Enterprise WeChat.", 'success');
      
      setStatus(BotStatus.COMPLETED);
      addLog("Workflow complete. Resetting for next cycle.", 'success');

      // Reset to waiting after a delay
      setTimeout(() => setStatus(BotStatus.WAITING), 60000);
    } catch (error: any) {
      // Critical UX Fix: If send fails, revert to REVIEWING so user can retry immediately
      // instead of getting stuck in ERROR state without a send button.
      setStatus(BotStatus.REVIEWING);
      addLog(`Send Failed: ${error.message}. Please click 'Approve & Send' to retry.`, 'error');
      alert(`Failed to send report: ${error.message}\n\nPlease check your network or webhook URL and try again.`);
    }
  }, [webhookUrl, addLog]);

  // --- Step 1: Generation Phase ---
  const startGeneration = useCallback(async () => {
    if (status === BotStatus.SEARCHING || status === BotStatus.GENERATING) return;

    if (!apiKey) {
      addLog("API Key missing. Cannot execute workflow.", 'error');
      setStatus(BotStatus.ERROR);
      setTimeout(() => setStatus(BotStatus.WAITING), 5000); 
      return;
    }

    try {
      setStatus(BotStatus.SEARCHING);
      addLog("Starting workflow: Scanning data sources...", 'info');

      // Generate Report
      setStatus(BotStatus.GENERATING);
      addLog("Analysing clinical trials with Gemini 2.5...", 'info');
      
      const reportContent = await generateWeeklyReport(apiKey);
      setLastReport(reportContent);
      addLog("Report generated. Preparing for review.", 'success');

      if (requireConfirmation) {
        setStatus(BotStatus.REVIEWING);
        addLog("Paused for manual review. Please approve to send.", 'warning');
      } else {
        // Auto-send if confirmation is disabled
        await executeSend(reportContent);
      }

    } catch (error: any) {
      setStatus(BotStatus.ERROR);
      addLog(`Generation Error: ${error.message}`, 'error');
      // Auto-recover for scheduler
      setTimeout(() => setStatus(BotStatus.WAITING), 60000); 
    }
  }, [apiKey, status, requireConfirmation, executeSend, addLog]);

  // Scheduler Effect (Friday 16:30)
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const day = now.getDay(); // 5 is Friday
      const hour = now.getHours();
      const minute = now.getMinutes();
      const dateKey = now.toLocaleDateString('en-GB');

      // UI Countdown
      const isFriday = day === 5;
      const isTimeWindow = hour === 16 && minute === 30;
      
      let nextRunText = "Next run: Friday 16:30";
      if (isFriday) {
          if (hour < 16 || (hour === 16 && minute < 30)) {
             const diffMins = (16 * 60 + 30) - (hour * 60 + minute);
             nextRunText = diffMins < 60 ? `Starts in ${diffMins} mins` : "Today at 16:30";
          } else if (hour > 16 || (hour === 16 && minute > 30)) {
             nextRunText = "Next run: Next Friday";
          } else {
             nextRunText = "Running Scheduled Task...";
          }
      }
      setCountDown(nextRunText);

      // Trigger Logic
      if (
        autoMode && 
        isFriday && 
        isTimeWindow && 
        lastRunDateRef.current !== dateKey && 
        status === BotStatus.WAITING
      ) {
        addLog(`Auto-Scheduler triggered for ${dateKey}`, 'warning');
        lastRunDateRef.current = dateKey;
        startGeneration();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [autoMode, status, startGeneration, addLog]);

  const handleApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setApiKey(e.target.value);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-6 md:p-12">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <header className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-800 tracking-tight">
                Vaccine<span className="text-blue-600">Weekly</span>
              </h1>
              <p className="text-slate-500 mt-1">Automated Clinical Trial Intelligence & Reporting</p>
            </div>
            <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm">
              <div className={`w-3 h-3 rounded-full ${autoMode ? 'bg-green-500 animate-pulse' : 'bg-slate-300'}`}></div>
              <div className="text-sm font-medium text-slate-600">
                {autoMode ? 'Auto-Pilot Active' : 'Manual Mode'}
              </div>
            </div>
          </div>
          <div className="mt-4 bg-amber-50 border border-amber-200 rounded-md p-3 flex items-start gap-2">
            <svg className="w-5 h-5 text-amber-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div className="text-sm text-amber-800">
              <strong>Keep this tab open.</strong> The scheduler relies on the browser being active. 
              Running strictly at <strong>16:30 on Fridays</strong>.
            </div>
          </div>
        </header>

        {/* Configuration Panel */}
        <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4 flex justify-between">
            <span>Configuration</span>
          </h2>
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Google Gemini API Key</label>
              <input 
                type="password" 
                value={apiKey}
                onChange={handleApiKeyChange}
                placeholder="Enter AI Studio Key..."
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">WeCom Webhook URL</label>
              <input 
                type="text" 
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 outline-none font-mono text-xs"
              />
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-3">
             <input 
               type="checkbox" 
               id="confirmToggle"
               checked={requireConfirmation}
               onChange={(e) => setRequireConfirmation(e.target.checked)}
               className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 border-gray-300"
             />
             <label htmlFor="confirmToggle" className="text-sm text-slate-700 select-none">
               Require Manual Confirmation before sending (Recommended)
             </label>
          </div>
        </section>

        {/* Status & Control */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* Status Card */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 col-span-2 flex flex-col justify-between relative overflow-hidden">
             {/* Status Badge */}
             <div className="flex justify-between items-start z-10">
               <div>
                  <h3 className="text-lg font-semibold text-slate-800">System Status</h3>
                  <p className="text-sm text-slate-500 mt-1">{countDown}</p>
               </div>
               <span className={`px-3 py-1 rounded-full text-xs font-bold transition-colors duration-300
                 ${status === BotStatus.WAITING ? 'bg-slate-100 text-slate-600' : ''}
                 ${status === BotStatus.SEARCHING ? 'bg-blue-100 text-blue-600' : ''}
                 ${status === BotStatus.GENERATING ? 'bg-purple-100 text-purple-600' : ''}
                 ${status === BotStatus.REVIEWING ? 'bg-amber-100 text-amber-700 animate-pulse' : ''}
                 ${status === BotStatus.SENDING ? 'bg-orange-100 text-orange-600' : ''}
                 ${status === BotStatus.COMPLETED ? 'bg-green-100 text-green-600' : ''}
                 ${status === BotStatus.ERROR ? 'bg-red-100 text-red-600' : ''}
               `}>
                 {status.replace('_', ' ')}
               </span>
             </div>
             
             {/* Action Buttons */}
             <div className="mt-6 flex gap-3 z-10">
                {status === BotStatus.REVIEWING ? (
                  <>
                    <button
                      onClick={() => executeSend(lastReport)}
                      className="px-6 py-2 rounded-lg font-medium text-white bg-green-600 hover:bg-green-700 shadow-md hover:shadow-lg transition-all flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                      Approve & Send
                    </button>
                    <button
                      onClick={startGeneration}
                      className="px-4 py-2 rounded-lg font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition-all flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                      Regenerate
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={startGeneration}
                      disabled={status !== BotStatus.WAITING && status !== BotStatus.COMPLETED && status !== BotStatus.ERROR}
                      className={`px-6 py-2 rounded-lg font-medium text-white transition-all
                        ${status === BotStatus.WAITING || status === BotStatus.COMPLETED || status === BotStatus.ERROR
                          ? 'bg-blue-600 hover:bg-blue-700 shadow-md hover:shadow-lg' 
                          : 'bg-slate-300 cursor-not-allowed'}
                      `}
                    >
                      {status === BotStatus.SEARCHING || status === BotStatus.GENERATING ? 'Processing...' : 'Run Now (Manual)'}
                    </button>
                    <button
                      onClick={() => setAutoMode(!autoMode)}
                      className={`px-6 py-2 rounded-lg font-medium border transition-colors
                        ${autoMode 
                          ? 'text-slate-700 bg-slate-100 hover:bg-slate-200 border-slate-200' 
                          : 'text-red-700 bg-red-50 hover:bg-red-100 border-red-200'
                        }`}
                    >
                      {autoMode ? 'Disable Timer' : 'Enable Timer'}
                    </button>
                  </>
                )}
             </div>

             {/* Review Hint Background */}
             {status === BotStatus.REVIEWING && (
               <div className="absolute inset-0 bg-amber-50/50 pointer-events-none border-2 border-amber-200 rounded-xl"></div>
             )}
          </div>

          {/* Quick Stats */}
          <div className="bg-gradient-to-br from-indigo-600 to-blue-700 p-6 rounded-xl shadow-md text-white flex flex-col justify-between">
             <div>
               <div className="text-indigo-100 text-sm font-medium mb-2">Next Scheduled Run</div>
               <div className="text-4xl font-bold mb-1">Friday</div>
               <div className="text-2xl opacity-90">16:30 PM</div>
             </div>
             <div className="mt-4 pt-4 border-t border-white/20 text-xs text-indigo-200">
               Source: NMPA, CDE, FDA, WHO
             </div>
          </div>
        </div>

        {/* Logs */}
        <LogViewer logs={logs} />

        {/* Preview */}
        {lastReport && (
          <div className={status === BotStatus.REVIEWING ? "ring-4 ring-amber-300 rounded-xl transition-all" : ""}>
            <ReportPreview content={lastReport} />
          </div>
        )}

      </div>
    </div>
  );
};

export default App;