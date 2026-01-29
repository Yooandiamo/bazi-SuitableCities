import React, { useState } from 'react';
import { UserInput } from '../types';
import { Compass, Sparkles, User, UserRound } from 'lucide-react';

interface InputFormProps {
  onSubmit: (data: UserInput) => void;
  isLoading: boolean;
}

const InputForm: React.FC<InputFormProps> = ({ onSubmit, isLoading }) => {
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [birthDate, setBirthDate] = useState('');
  const [birthTime, setBirthTime] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (birthDate && birthTime) {
      onSubmit({ gender, birthDate, birthTime });
    }
  };

  return (
    <div className="w-full max-w-md p-8 bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl"></div>
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl"></div>

      <div className="relative z-10 text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-900 border border-amber-500/30 mb-4 shadow-lg shadow-amber-500/10">
          <Compass className="w-8 h-8 text-amber-500" />
        </div>
        <h2 className="text-2xl font-bold text-amber-50 tracking-wider font-serif">五行八字分析</h2>
        <p className="text-slate-400 text-sm mt-2 font-light">输入您的出生信息，探索五行归属与人生方向</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs uppercase tracking-widest text-slate-400 mb-2">出生日期 (Date)</label>
            <input
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-3 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all [color-scheme:dark]"
              required
            />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-widest text-slate-400 mb-2">出生时间 (Time)</label>
            <input
              type="time"
              value={birthTime}
              onChange={(e) => setBirthTime(e.target.value)}
              className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-3 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all [color-scheme:dark]"
              required
            />
          </div>
        </div>

        <div>
           <label className="block text-xs uppercase tracking-widest text-slate-400 mb-3">性别 (Gender)</label>
           <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setGender('male')}
                className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all ${
                  gender === 'male' 
                    ? 'bg-slate-700/80 border-amber-500 text-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.2)]' 
                    : 'bg-slate-900/50 border-slate-700 text-slate-500 hover:bg-slate-800'
                }`}
              >
                 <User className="w-6 h-6 mb-2" />
                 <span className="font-serif font-bold">乾造 (男)</span>
              </button>
              <button
                type="button"
                onClick={() => setGender('female')}
                className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all ${
                  gender === 'female' 
                    ? 'bg-slate-700/80 border-amber-500 text-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.2)]' 
                    : 'bg-slate-900/50 border-slate-700 text-slate-500 hover:bg-slate-800'
                }`}
              >
                 <UserRound className="w-6 h-6 mb-2" />
                 <span className="font-serif font-bold">坤造 (女)</span>
              </button>
           </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className={`w-full py-4 rounded-lg font-bold tracking-widest transition-all duration-500 flex items-center justify-center gap-2 group
            ${isLoading 
              ? 'bg-slate-700 cursor-not-allowed text-slate-400' 
              : 'bg-gradient-to-r from-amber-600 to-orange-700 hover:from-amber-500 hover:to-orange-600 text-white shadow-lg shadow-orange-900/50'
            }`}
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></span>
              <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-100"></span>
              <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-200"></span>
            </span>
          ) : (
            <>
              开始排盘分析
              <Sparkles className="w-4 h-4 group-hover:rotate-12 transition-transform" />
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default InputForm;