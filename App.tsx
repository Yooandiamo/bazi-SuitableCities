import React, { useState } from 'react';
import InputForm from './components/InputForm';
import ResultsView from './components/ResultsView';
import { UserInput, DestinyAnalysis, LoadingState } from './types';
import { getLocalAnalysis, analyzeDestinyAI } from './services/gemini';
import { Loader2 } from 'lucide-react';

const App: React.FC = () => {
  const [loadingState, setLoadingState] = useState<LoadingState>(LoadingState.IDLE);
  const [userInput, setUserInput] = useState<UserInput | null>(null);
  const [analysisResult, setAnalysisResult] = useState<DestinyAnalysis | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Step 1: Handle Initial Form Submit (Free Local Calculation)
  const handleInitialAnalysis = async (input: UserInput) => {
    setUserInput(input);
    setLoadingState(LoadingState.CALCULATING_LOCAL);
    setErrorMsg(null);
    
    // Simulate a brief calculation delay for UX
    setTimeout(() => {
        try {
            const localData = getLocalAnalysis(input);
            setAnalysisResult({
                ...localData,
                isUnlocked: false // Locked by default
            });
            setLoadingState(LoadingState.PREVIEW);
        } catch (err: any) {
            console.error("Local Calc Error:", err);
            setErrorMsg("排盘计算失败，请检查日期格式");
            setLoadingState(LoadingState.ERROR);
        }
    }, 800);
  };

  // Step 2: Handle Unlock (Paid AI Calculation)
  const handleUnlock = async (code: string) => {
    if (!userInput || !analysisResult) return;
    
    setLoadingState(LoadingState.UNLOCKING);
    try {
        // Pass the code to the AI service
        const fullResult = await analyzeDestinyAI(userInput, analysisResult, code);
        setAnalysisResult(fullResult);
        setLoadingState(LoadingState.COMPLETE);
    } catch (err: any) {
        console.error("AI Error:", err);
        const message = err instanceof Error ? err.message : "解锁失败，请稍后重试";
        setErrorMsg(message);
        // If error, go back to PREVIEW state so user can try again, 
        // but showing the error via alert or temporary message would be better.
        // For now, we use the error screen but allow "Retry" to go back.
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
          <InputForm onSubmit={handleInitialAnalysis} isLoading={false} />
        )}

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

        {loadingState === LoadingState.ERROR && (
           <div className="text-center max-w-lg w-full p-8 bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-red-500/30 shadow-2xl">
              <h3 className="text-xl font-bold text-red-400 mb-4">分析中断</h3>
              <div className="bg-red-950/30 p-4 rounded-lg border border-red-900/50 mb-6 text-left">
                  <p className="text-slate-200 text-sm font-mono break-words whitespace-pre-wrap">{errorMsg}</p>
              </div>
              <button 
                onClick={() => {
                    // If we failed during unlocking, go back to preview (blurred result)
                    // If we failed during local calc, go back to idle
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

        {/* Show ResultsView for both PREVIEW (locked) and COMPLETE (unlocked) states, and also UNLOCKING (loading inside modal) */}
        {(loadingState === LoadingState.PREVIEW || loadingState === LoadingState.COMPLETE || loadingState === LoadingState.UNLOCKING) && analysisResult && (
          <ResultsView 
            data={analysisResult} 
            onUnlock={handleUnlock}
            onReset={handleReset}
            isUnlocking={loadingState === LoadingState.UNLOCKING}
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