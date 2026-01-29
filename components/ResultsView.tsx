import React from 'react';
import { DestinyAnalysis } from '../types';
import { PillarsDisplay, ElementsRadarChart } from './Visualizations';
import { MapPin, Briefcase, RefreshCw, Star, Info } from 'lucide-react';

interface ResultsViewProps {
  data: DestinyAnalysis;
  onReset: () => void;
}

const ResultsView: React.FC<ResultsViewProps> = ({ data, onReset }) => {
  // Ultra-defensive check
  if (!data) return null;

  return (
    <div className="w-full max-w-4xl animate-fade-in-up">
      
      {/* Header */}
      <div className="text-center mb-10">
        <h2 className="text-3xl md:text-4xl font-bold text-amber-50 font-serif mb-2">命运启示</h2>
        <div className="flex items-center justify-center gap-2 text-slate-400">
           <span className="uppercase tracking-widest text-xs">日主 (本命):</span>
           <span className="font-bold text-amber-400">{data.dayMaster || '未知'}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Pillars Card */}
        <div className="bg-slate-800/50 backdrop-blur-md rounded-2xl p-6 border border-slate-700/50">
          <h3 className="text-lg font-serif text-slate-200 mb-6 flex items-center gap-2">
            <Star className="w-4 h-4 text-amber-500" />
            八字四柱
          </h3>
          <PillarsDisplay pillars={data.pillars || []} />
          <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-800">
            <h4 className="text-sm uppercase tracking-widest text-amber-500/80 mb-2">命理摘要</h4>
            <p className="text-slate-300 text-sm leading-relaxed italic">"{data.summary || '...'}"</p>
          </div>
        </div>

        {/* Elements Card */}
        <div className="bg-slate-800/50 backdrop-blur-md rounded-2xl p-6 border border-slate-700/50">
          <h3 className="text-lg font-serif text-slate-200 mb-2 flex items-center gap-2">
            <Info className="w-4 h-4 text-blue-500" />
            五行能量平衡
          </h3>
          <ElementsRadarChart data={data.fiveElements || []} />
          <div className="mt-4 flex flex-wrap gap-2 justify-center">
             <div className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs">
                喜用 (适合): {data.favorableElements?.join(', ') || '分析中'}
             </div>
             {data.unfavorableElements && data.unfavorableElements.length > 0 && (
                <div className="px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                    忌神 (需补/避): {data.unfavorableElements.join(', ')}
                </div>
             )}
          </div>
        </div>
      </div>

      {/* Recommendations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        {/* Cities */}
        <div className="bg-slate-800/50 backdrop-blur-md rounded-2xl p-6 border border-slate-700/50">
          <h3 className="text-xl font-serif text-slate-100 mb-6 flex items-center gap-3 border-b border-slate-700 pb-4">
            <MapPin className="w-5 h-5 text-emerald-400" />
            宜居城市
          </h3>
          <div className="space-y-4">
            {data.suitableCities?.map((city, idx) => (
              <div key={idx} className="group p-4 rounded-xl bg-slate-900/40 hover:bg-slate-900/60 transition-colors border border-slate-800 hover:border-emerald-500/30">
                <div className="flex justify-between items-start mb-1">
                  <h4 className="font-bold text-slate-200 group-hover:text-emerald-400 transition-colors">{city.title || '城市'}</h4>
                  <span className="text-xs font-mono text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded">契合度: {city.matchScore}%</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">{city.description}</p>
              </div>
            )) || <p className="text-slate-500 text-sm">暂无推荐</p>}
          </div>
        </div>

        {/* Careers */}
        <div className="bg-slate-800/50 backdrop-blur-md rounded-2xl p-6 border border-slate-700/50">
          <h3 className="text-xl font-serif text-slate-100 mb-6 flex items-center gap-3 border-b border-slate-700 pb-4">
            <Briefcase className="w-5 h-5 text-purple-400" />
            适合职业
          </h3>
          <div className="space-y-4">
            {data.suitableCareers?.map((career, idx) => (
              <div key={idx} className="group p-4 rounded-xl bg-slate-900/40 hover:bg-slate-900/60 transition-colors border border-slate-800 hover:border-purple-500/30">
                <div className="flex justify-between items-start mb-1">
                  <h4 className="font-bold text-slate-200 group-hover:text-purple-400 transition-colors">{career.title || '职业'}</h4>
                  <span className="text-xs font-mono text-purple-500 bg-purple-500/10 px-2 py-0.5 rounded">契合度: {career.matchScore}%</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">{career.description}</p>
              </div>
            )) || <p className="text-slate-500 text-sm">暂无推荐</p>}
          </div>
        </div>
      </div>

      <div className="text-center pb-20">
        <button 
          onClick={onReset}
          className="inline-flex items-center gap-2 px-8 py-3 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all border border-slate-600 hover:border-slate-500"
        >
          <RefreshCw className="w-4 h-4" />
          分析其他日期
        </button>
      </div>
    </div>
  );
};

export default ResultsView;