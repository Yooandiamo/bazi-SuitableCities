import React, { useState } from 'react';
import { DestinyAnalysis } from '../types';
import { PillarsDisplay, ElementsRadarChart } from './Visualizations';
import { MapPin, Briefcase, RefreshCw, Star, Info, Lock, KeyRound, Sparkles } from 'lucide-react';
import { verifyCode } from '../utils/accessCodes';

interface ResultsViewProps {
  data: DestinyAnalysis;
  onUnlock: (code: string) => void;
  onReset: () => void;
  isUnlocking: boolean;
}

const ResultsView: React.FC<ResultsViewProps> = ({ data, onUnlock, onReset, isUnlocking }) => {
  const [accessCode, setAccessCode] = useState('');
  const [codeError, setCodeError] = useState(false);

  // Is the content locked?
  const isLocked = !data.isUnlocked;

  const handleUnlockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (verifyCode(accessCode)) {
        onUnlock(accessCode);
        setCodeError(false);
    } else {
        setCodeError(true);
    }
  };

  return (
    <div className="w-full max-w-4xl animate-fade-in-up pb-20 relative">
      
      {/* Header */}
      <div className="text-center mb-10">
        <h2 className="text-3xl md:text-4xl font-bold text-amber-50 font-serif mb-2">
            {isLocked ? "天机预览" : "命运启示"}
        </h2>
        <div className="flex items-center justify-center gap-2 text-slate-400">
           <span className="uppercase tracking-widest text-xs">日主 (本命):</span>
           <span className="font-bold text-amber-400">{data.dayMaster || '未知'}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Pillars Card (Always Visible) */}
        <div className="bg-slate-800/50 backdrop-blur-md rounded-2xl p-6 border border-slate-700/50">
          <h3 className="text-lg font-serif text-slate-200 mb-6 flex items-center gap-2">
            <Star className="w-4 h-4 text-amber-500" />
            八字四柱 (基础盘)
          </h3>
          <PillarsDisplay pillars={data.pillars || []} />
          
          {/* Summary Section - BLURRED if locked */}
          <div className="relative mt-4">
              <div className={`p-4 bg-slate-900/50 rounded-lg border border-slate-800 transition-all duration-700 ${isLocked ? 'blur-sm select-none opacity-50' : ''}`}>
                <h4 className="text-sm uppercase tracking-widest text-amber-500/80 mb-2">命理摘要</h4>
                <p className="text-slate-300 text-sm leading-relaxed italic">
                    {isLocked 
                        ? "此处包含基于您五行强弱的个性化命理摘要，解锁后可见。这通常涉及您一生的运势起伏与核心性格特质。" 
                        : `"${data.summary}"`}
                </p>
              </div>
              {isLocked && (
                  <div className="absolute inset-0 flex items-center justify-center">
                      <Lock className="w-6 h-6 text-slate-400 opacity-80" />
                  </div>
              )}
          </div>
        </div>

        {/* Elements Card (Always Visible) */}
        <div className="bg-slate-800/50 backdrop-blur-md rounded-2xl p-6 border border-slate-700/50">
          <h3 className="text-lg font-serif text-slate-200 mb-2 flex items-center gap-2">
            <Info className="w-4 h-4 text-blue-500" />
            五行能量平衡
          </h3>
          <ElementsRadarChart data={data.fiveElements || []} />
          
          {/* Favorable/Unfavorable - BLURRED if locked */}
          <div className="relative mt-4 min-h-[40px]">
             <div className={`flex flex-wrap gap-2 justify-center transition-all duration-700 ${isLocked ? 'blur-md select-none opacity-40' : ''}`}>
                <div className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs">
                    喜用: {data.favorableElements?.join(', ') || '木, 火'}
                </div>
                <div className="px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                    忌神: {data.unfavorableElements?.join(', ') || '金, 水'}
                </div>
             </div>
             {isLocked && (
                  <div className="absolute inset-0 flex items-center justify-center z-10">
                      <span className="text-xs text-slate-300 bg-slate-900/80 px-2 py-1 rounded border border-slate-700 flex items-center gap-1">
                          <Lock className="w-3 h-3" /> 解锁查看喜忌神
                      </span>
                  </div>
              )}
          </div>
        </div>
      </div>

      {/* Paywall Overlay Container for Cities & Careers */}
      <div className="relative">
          
        {/* The Locked Content (Blurred) */}
        <div className={`transition-all duration-700 ${isLocked ? 'blur-xl opacity-30 select-none pointer-events-none' : ''}`}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                {/* Cities */}
                <div className="bg-slate-800/50 backdrop-blur-md rounded-2xl p-6 border border-slate-700/50">
                <h3 className="text-xl font-serif text-slate-100 mb-6 flex items-center gap-3 border-b border-slate-700 pb-4">
                    <MapPin className="w-5 h-5 text-emerald-400" />
                    宜居城市
                </h3>
                <div className="space-y-4">
                    {(isLocked ? [1,2,3] : data.suitableCities)?.map((city, idx) => (
                    <div key={idx} className="p-4 rounded-xl bg-slate-900/40 border border-slate-800">
                        <div className="flex justify-between items-start mb-1">
                        <h4 className="font-bold text-slate-200">{isLocked ? '???' : (city as any).title}</h4>
                        <span className="text-xs font-mono text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded">契合度: {isLocked ? '??' : (city as any).matchScore}%</span>
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed">{isLocked ? '此处包含基于五行互补原理的详细城市推荐理由。' : (city as any).description}</p>
                    </div>
                    ))}
                </div>
                </div>

                {/* Careers */}
                <div className="bg-slate-800/50 backdrop-blur-md rounded-2xl p-6 border border-slate-700/50">
                <h3 className="text-xl font-serif text-slate-100 mb-6 flex items-center gap-3 border-b border-slate-700 pb-4">
                    <Briefcase className="w-5 h-5 text-purple-400" />
                    适合职业
                </h3>
                <div className="space-y-4">
                    {(isLocked ? [1,2,3] : data.suitableCareers)?.map((career, idx) => (
                    <div key={idx} className="p-4 rounded-xl bg-slate-900/40 border border-slate-800">
                        <div className="flex justify-between items-start mb-1">
                        <h4 className="font-bold text-slate-200">{isLocked ? '???' : (career as any).title}</h4>
                        <span className="text-xs font-mono text-purple-500 bg-purple-500/10 px-2 py-0.5 rounded">契合度: {isLocked ? '??' : (career as any).matchScore}%</span>
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed">{isLocked ? '此处包含基于五行生克原理的详细职业发展建议。' : (career as any).description}</p>
                    </div>
                    ))}
                </div>
                </div>
            </div>
        </div>

        {/* The Unlock Card (Floating on top) */}
        {isLocked && (
            <div className="absolute top-10 left-0 w-full flex justify-center items-start z-20 px-4">
                <div className="bg-slate-900/90 backdrop-blur-xl border border-amber-500/50 rounded-2xl p-8 max-w-md w-full shadow-[0_0_50px_rgba(245,158,11,0.2)] text-center">
                    <div className="w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-amber-500/30">
                        <KeyRound className="w-8 h-8 text-amber-500" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2 font-serif">解锁完整天机报告</h3>
                    <p className="text-slate-400 text-sm mb-6">
                        获取包含 <b>喜用神分析</b>、<b>5个宜居城市</b>、<b>5个黄金职业</b> 以及 <b>详细命理建议</b> 的完整报告。
                    </p>
                    
                    <form onSubmit={handleUnlockSubmit} className="space-y-4">
                        <div className="relative">
                            <input 
                                type="text" 
                                value={accessCode}
                                onChange={(e) => {
                                    setAccessCode(e.target.value);
                                    setCodeError(false);
                                }}
                                placeholder="请输入卡密 / 解锁码"
                                className={`w-full h-12 bg-black/50 border ${codeError ? 'border-red-500 animate-shake' : 'border-slate-600'} rounded-lg px-4 text-center text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors uppercase font-mono tracking-widest`}
                            />
                        </div>
                        {codeError && <p className="text-red-400 text-xs">无效的卡密，请重新输入</p>}
                        
                        <button 
                            type="submit"
                            disabled={isUnlocking}
                            className="w-full h-12 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold rounded-lg shadow-lg shadow-orange-900/50 transition-all flex items-center justify-center gap-2"
                        >
                            {isUnlocking ? (
                                <>
                                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                    正在解读天机...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="w-4 h-4" /> 立即解锁
                                </>
                            )}
                        </button>
                    </form>
                    <p className="text-[10px] text-slate-500 mt-4">
                        * 获取方式请联系博主或查看笔记详情
                    </p>
                </div>
            </div>
        )}

      </div>

      <div className="text-center pb-20 mt-8">
        <button 
          onClick={onReset}
          className="inline-flex items-center gap-2 px-8 py-3 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all border border-slate-600 hover:border-slate-500"
        >
          <RefreshCw className="w-4 h-4" />
          重测 / 返回
        </button>
      </div>
    </div>
  );
};

export default ResultsView;