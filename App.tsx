import React, { useState } from 'react';
import InputForm from './components/InputForm';
import ResultsView from './components/ResultsView';
import { UserInput, DestinyAnalysis, LoadingState } from './types';
import { getLocalAnalysis, analyzeDestinyAI } from './services/gemini';
import { Loader2 } from 'lucide-react';
import { verifyCode } from './utils/accessCodes';

const App: React.FC = () => {
  const [loadingState, setLoadingState] = useState<LoadingState>(LoadingState.IDLE);
  const [userInput, setUserInput] = useState<UserInput | null>(null);
  const [analysisResult, setAnalysisResult] = useState<DestinyAnalysis | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Handle Form Submit
  const handleAnalysisStart = async (input: UserInput, accessCode?: string) => {
    setUserInput(input);
    setErrorMsg(null);
    
    // 1. Always do local calculation first (fast)
    let localData;
    try {
        localData = getLocalAnalysis(input);
    } catch (err: any) {
        console.error("Local Calc Error:", err);
        setErrorMsg("排盘计算失败，请检查日期格式");
        setLoadingState(LoadingState.ERROR);
        return;
    }

    // 2. Check if user provided an access code upfront
    const hasCode = accessCode && accessCode.trim().length > 0;

    if (hasCode) {
        // --- DIRECT UNLOCK MODE ---
        // Validate strictly before even showing "Calculating" to give instant feedback
        if (!verifyCode(accessCode!)) {
            // Optional: Handle invalid code UI feedback here if desired
        }

        setLoadingState(LoadingState.UNLOCKING); // Show full screen "Interpreting..." state
        
        // Use the local data to seed the result while we fetch AI
        setAnalysisResult({
            ...localData,
            isUnlocked: false 
        });

        try {
            const fullResult = await analyzeDestinyAI(input, localData, accessCode!);
            setAnalysisResult(fullResult);
            setLoadingState(LoadingState.COMPLETE);
        } catch (err: any) {
            console.error("Direct Unlock Error:", err);
            // If direct unlock fails, fall back to PREVIEW state so they can see the basic chart 
            // and try entering the code again in the results view.
            setAnalysisResult({
                ...localData,
                isUnlocked: false
            });
            setErrorMsg(err.message || "解锁失败，请检查卡密");
            setLoadingState(LoadingState.PREVIEW);
        }

    } else {
        // --- PREVIEW MODE (Old Behavior) ---
        setLoadingState(LoadingState.CALCULATING_LOCAL);
        
        setTimeout(() => {
            setAnalysisResult({
                ...localData,
                isUnlocked: false // Locked by default
            });
            setLoadingState(LoadingState.PREVIEW);
        }, 800);
    }
  };

  // Handle Unlock from the Results Page (if they didn't enter code initially)
  const handleUnlock = async (code: string) => {
    if (!userInput || !analysisResult) return;
    
    // Change to UPGRADING to keep ResultsView visible but show spinner on button
    setLoadingState(LoadingState.UPGRADING);
    try {
        const fullResult = await analyzeDestinyAI(userInput, analysisResult, code);
        setAnalysisResult(fullResult);
        setLoadingState(LoadingState.COMPLETE);
    } catch (err: any) {
        console.error("AI Error:", err);
        const message = err instanceof Error ? err.message : "解锁失败，请稍后重试";
        setErrorMsg(message);
        // On error, go back to PREVIEW so they can retry
        setLoadingState(LoadingState.PREVIEW);
        // Note: We might want a dedicated Error toast instead of full screen error, 
        // but for now relying on existing error state handling or adding alert could work.
        // Given current structure, let's trigger the Error Screen if it fails, 
        // or just revert to PREVIEW and maybe show alert? 
        // Let's set to ERROR state to be safe and visible.
        setLoadingState(LoadingState.ERROR);
    }
  };

  const handleReset = () => {
    setAnalysisResult(null);
    setUserInput(null);
    setLoadingState(LoadingState.IDLE);
    setErrorMsg(null);
  };

  return (
    <div className="min-h-screen bg-[#0f172a] bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] text-slate-100 flex flex-col items-center">
      
      {/* Background ambient light */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
         <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-900/20 rounded-full blur-[120px] animate-pulse"></div>
         <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-amber-900/20 rounded-full blur-[120px] animate-pulse delay-1000"></div>
      </div>

      <header className="w-full p-6 z-10 flex justify-between items-center max-w-6xl mx-auto">
        <h1 className="font-serif text-xl tracking-widest font-bold text-amber-500/80">命运罗盘</h1>
        <div className="text-xs text-slate-500">五行八字指南</div>
      </header>

      <main className="flex-grow w-full px-4 py-8 flex flex-col items-center justify-center relative z-10">
        
        {loadingState === LoadingState.IDLE && (
          <InputForm onSubmit={handleAnalysisStart} isLoading={false} />
        )}

        {/* Loading State for PREVIEW generation */}
        {(loadingState === LoadingState.CALCULATING_LOCAL) && (
          <div className="text-center p-12 bg-slate-800/30 backdrop-blur-md rounded-2xl border border-slate-700/30">
             <div className="relative w-24 h-24 mx-auto mb-6">
                <div className="absolute inset-0 border-t-4 border-amber-500 rounded-full animate-spin"></div>
                <div className="absolute inset-2 border-r-4 border-purple-500 rounded-full animate-spin reverse animation-delay-500"></div>
                <div className="absolute inset-4 border-b-4 border-emerald-500 rounded-full animate-spin delay-200"></div>
             </div>
             <h3 className="text-xl font-serif mb-2">正在推演天机</h3>
             <p className="text-slate-400 text-sm animate-pulse">真太阳时校正中... 基础排盘中...</p>
          </div>
        )}

        {/* Loading State for AI UNLOCKING (Direct Full Screen) */}
        {(loadingState === LoadingState.UNLOCKING) && (
           <div className="text-center p-12 bg-slate-800/30 backdrop-blur-md rounded-2xl border border-amber-500/30">
              <div className="relative w-24 h-24 mx-auto mb-6">
                 <div className="absolute inset-0 border-t-4 border-amber-500 rounded-full animate-spin"></div>
                 <div className="absolute inset-0 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
                 </div>
              </div>
              <h3 className="text-xl font-serif mb-2 text-amber-400">正在连通天机</h3>
              <p className="text-slate-400 text-sm animate-pulse">深度分析命局... 寻找本命城市...</p>
           </div>
        )}

        {/* Error State */}
        {loadingState === LoadingState.ERROR && (
           <div className="text-center max-w-lg w-full p-8 bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-red-500/30 shadow-2xl">
              <h3 className="text-xl font-bold text-red-400 mb-4">分析中断</h3>
              <div className="bg-red-950/30 p-4 rounded-lg border border-red-900/50 mb-6 text-left">
                  <p className="text-slate-200 text-sm font-mono break-words whitespace-pre-wrap">{errorMsg}</p>
              </div>
              <button 
                onClick={() => {
                    if (analysisResult) {
                        setLoadingState(LoadingState.PREVIEW);
                    } else {
                        setLoadingState(LoadingState.IDLE);
                    }
                }}
                className="px-8 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white transition-colors border border-slate-600"
              >
                返回重试
              </button>
           </div>
        )}

        {/* Show ResultsView for PREVIEW, UPGRADING, and COMPLETE states */}
        {(loadingState === LoadingState.PREVIEW || loadingState === LoadingState.COMPLETE || loadingState === LoadingState.UPGRADING) && analysisResult && (
          <ResultsView 
            data={analysisResult} 
            onUnlock={handleUnlock}
            onReset={handleReset}
            isUnlocking={loadingState === LoadingState.UPGRADING}
          />
        )}

      </main>

      <footer className="w-full p-6 text-center text-slate-600 text-xs z-10 border-t border-slate-800/50">
        <p>结果仅供娱乐与参考。</p>
      </footer>
    </div>
  );
};

export default App;