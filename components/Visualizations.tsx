import React from 'react';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Tooltip } from 'recharts';
import { ElementData, Pillar } from '../types';

interface PillarsDisplayProps {
  pillars: Pillar[];
}

interface ElementsChartProps {
  data: ElementData[];
}

export const PillarsDisplay: React.FC<PillarsDisplayProps> = ({ pillars }) => {
  // Safety check
  if (!pillars || pillars.length === 0) {
    return <div className="text-slate-500 text-sm text-center py-4">暂无四柱数据</div>;
  }

  const getElementColor = (element: string) => {
    const el = (element || '').toLowerCase();
    if (el.includes('wood') || el.includes('木')) return 'text-emerald-400';
    if (el.includes('fire') || el.includes('火')) return 'text-red-400';
    if (el.includes('earth') || el.includes('土')) return 'text-amber-400';
    if (el.includes('metal') || el.includes('金')) return 'text-slate-300';
    if (el.includes('water') || el.includes('水')) return 'text-blue-400';
    return 'text-slate-200';
  };

  return (
    <div className="grid grid-cols-4 gap-2 md:gap-4 w-full mb-8">
      {pillars.map((p, idx) => (
        <div key={idx} className="flex flex-col items-center bg-slate-900/40 p-3 md:p-4 rounded-xl border border-slate-700/30 hover:bg-slate-800/40 transition-colors">
          {/* Removed "Pillar" suffix since p.name will be Chinese (e.g., 年柱) */}
          <span className="text-[10px] md:text-xs uppercase tracking-widest text-slate-500 mb-2">{p.name}</span>
          <div className="flex flex-col items-center gap-1">
            <span className={`text-2xl md:text-4xl font-serif font-bold ${getElementColor(p.elementStem)}`} title={`天干: ${p.heavenlyStem} (${p.elementStem})`}>
              {p.heavenlyStem || '-'}
            </span>
            <span className={`text-2xl md:text-4xl font-serif font-bold ${getElementColor(p.elementBranch)}`} title={`地支: ${p.earthlyBranch} (${p.elementBranch})`}>
              {p.earthlyBranch || '-'}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

export const ElementsRadarChart: React.FC<ElementsChartProps> = ({ data }) => {
  // Safety check
  if (!data || data.length === 0) {
    return <div className="text-slate-500 text-sm text-center py-10">暂无五行数据</div>;
  }

  return (
    <div className="w-full h-64 md:h-80 relative">
      <ResponsiveContainer width="100%" height="100%">
        {/* Adjusted cx to 45% to move chart slightly left, avoiding overlap with legend on right */}
        <RadarChart cx="45%" cy="50%" outerRadius="70%" data={data}>
          <PolarGrid stroke="#334155" />
          <PolarAngleAxis 
            dataKey="label" 
            tick={{ fill: '#94a3b8', fontSize: 14, fontWeight: 'bold' }} 
          />
          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
          <Radar
            name="能量强度"
            dataKey="percentage"
            stroke="#d97706"
            strokeWidth={2}
            fill="#d97706"
            fillOpacity={0.4}
          />
          <Tooltip 
            contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', color: '#f1f5f9' }}
            itemStyle={{ color: '#fbbf24' }}
            formatter={(value: number) => [`${value}%`, '能量强度']}
          />
        </RadarChart>
      </ResponsiveContainer>
      <div className="absolute top-2 right-2 flex flex-col gap-1">
        {data.map((d, i) => (
           <div key={i} className="flex items-center gap-2 text-xs">
              <span className={`w-2 h-2 rounded-full 
                ${(d.element?.toLowerCase().includes('wood') || d.label?.includes('木')) ? 'bg-emerald-500' : ''}
                ${(d.element?.toLowerCase().includes('fire') || d.label?.includes('火')) ? 'bg-red-500' : ''}
                ${(d.element?.toLowerCase().includes('earth') || d.label?.includes('土')) ? 'bg-amber-500' : ''}
                ${(d.element?.toLowerCase().includes('metal') || d.label?.includes('金')) ? 'bg-slate-300' : ''}
                ${(d.element?.toLowerCase().includes('water') || d.label?.includes('水')) ? 'bg-blue-500' : ''}
              `}></span>
              <span className="text-slate-400 w-12">{d.label}</span>
              <span className="text-slate-200 font-mono">{d.percentage}%</span>
           </div>
        ))}
      </div>
    </div>
  );
};