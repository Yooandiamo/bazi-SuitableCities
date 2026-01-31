import React, { useState } from 'react';
import { DestinyAnalysis, CityRecommendation } from '../types';
import { PillarsDisplay, ElementsRadarChart } from './Visualizations';
import { MapPin, RefreshCw, Star, Info, Lock, KeyRound, Sparkles, Quote } from 'lucide-react';
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
  
  // Extract cities
  const cities = data.suitableCities || [];
  const topCity = cities.length > 0 ? cities[0] : null;
  const otherCities = cities.length > 1 ? cities.slice(1) : [];

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

      {/* Paywall Overlay Container for Cities */}
      <div className="relative">
          
        {/* The Locked Content (Blurred) */}
        <div className={`transition-all duration-700 ${isLocked ? 'blur-xl opacity-30 select-none pointer-events-none' : ''}`}>
            
            {/* Top City Hero Card */}
            <div className="mb-8">
                <h3 className="text-center text-xl font-serif text-emerald-400 mb-6 flex items-center justify-center gap-2">
                    <MapPin className="w-5 h-5" /> 发现你的"天选之城"
                </h3>
                
                <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-md rounded-3xl p-8 border border-emerald-500/30 shadow-[0_0_30px_rgba(16,185,129,0.1)] relative overflow-hidden text-center">
                    
                    {/* Decorative bg elements */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>

                    {/* City Icon & Score */}
                    <div className="flex flex-col items-center mb-6">
                        <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-900/50 mb-4 transform rotate-3">
                            <MapPin className="w-10 h-10 text-white" />
                        </div>
                        <div className="text-emerald-400 text-xs font-bold uppercase tracking-widest mb-1 bg-emerald-900/30 px-3 py-1 rounded-full border border-emerald-500/20">
                            契合度
                        </div>
                        <div className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-teal-200">
                             {isLocked ? '88%' : `${topCity?.score}%`}
                        </div>
                    </div>

                    {/* City Name */}
                    <h2 className="text-3xl font-bold text-slate-100 mb-6">
                        {isLocked ? '青岛' : topCity?.name}
                    </h2>

                    {/* Tags */}
                    <div className="flex flex-wrap justify-center gap-2 mb-8">
                         {(isLocked ? ['海滨风情', '啤酒之城', '红瓦绿树'] : (topCity?.tags || []))?.map((tag, i) => (
                             <span key={i} className="px-4 py-1.5 rounded-full bg-slate-700/50 border border-slate-600 text-slate-300 text-sm">
                                 {tag}
                             </span>
                         ))}
                    </div>

                    {/* Description Box */}
                    <div className="bg-slate-900/50 rounded-xl p-6 text-left border border-slate-800/50 relative">
                        <Quote className="absolute top-4 left-4 w-4 h-4 text-emerald-600 opacity-50" />
                        <h4 className="text-emerald-500 font-bold mb-2 pl-6">匹配理由</h4>
                        <p className="text-slate-300 leading-relaxed pl-6 text-sm md:text-base">
                            {isLocked 
                                ? "你和这座城市一样，舒适惬意又充满海洋魅力。海滨风光、文化底蕴都与你追求舒适、热爱自然的性格相契合。这里的水木之气能极大地滋养你的命局..."
                                : topCity?.description}
                        </p>
                    </div>
                </div>
            </div>

            {/* Other Cities Grid */}
            <div className="mb-12">
                 <h3 className="text-lg font-serif text-slate-400 mb-4 text-center">其他适合你的城市</h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(isLocked ? [1, 2, 3, 4] : otherCities).map((city, idx) => {
                        const c = city as CityRecommendation;
                        return (
                            <div key={idx} className="bg-slate-800/30 rounded-xl p-4 border border-slate-700/30 flex justify-between items-center">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                        <h4 className="font-bold text-slate-200 text-lg">{isLocked ? '???' : c.name}</h4>
                                    </div>
                                    <div className="flex gap-2">
                                        {isLocked 
                                          ? <span className="text-xs text-slate-500">隐藏内容</span>
                                          : c.tags?.slice(0, 2).map((t, i) => (
                                            <span key={i} className="text-[10px] text-slate-400 bg-slate-700/50 px-1.5 py-0.5 rounded">{t}</span>
                                          ))
                                        }
                                    </div>
                                </div>
                                <div className="text-right">
                                     <span className="block text-emerald-400 font-bold text-xl">{isLocked ? '??%' : `${c.score}%`}</span>
                                </div>
                            </div>
                        );
                    })}
                 </div>
            </div>

        </div>

        {/* The Unlock Card (Floating on top) */}
        {isLocked && (
            <div className="absolute top-20 left-0 w-full flex justify-center items-start z-20 px-4">
                <div className="bg-slate-900/90 backdrop-blur-xl border border-amber-500/50 rounded-2xl p-8 max-w-md w-full shadow-[0_0_50px_rgba(245,158,11,0.2)] text-center">
                    <div className="w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-amber-500/30">
                        <KeyRound className="w-8 h-8 text-amber-500" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2 font-serif">解锁完整天机报告</h3>
                    <p className="text-slate-400 text-sm mb-6">
                        查看您的 <b>专属本命城市</b>、<b>详细匹配理由</b> 及 <b>其他备选福地</b>。
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