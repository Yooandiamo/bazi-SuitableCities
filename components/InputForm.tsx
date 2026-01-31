import React, { useState, useEffect } from 'react';
import { UserInput } from '../types';
import { Compass, Sparkles, User, UserRound, KeyRound } from 'lucide-react';
import { CHINA_CITIES, CityInfo } from '../utils/cityData';

interface InputFormProps {
  onSubmit: (data: UserInput, accessCode?: string) => void;
  isLoading: boolean;
}

const InputForm: React.FC<InputFormProps> = ({ onSubmit, isLoading }) => {
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [birthDate, setBirthDate] = useState('');
  const [birthTime, setBirthTime] = useState('');
  
  // Location State
  const [selectedProvince, setSelectedProvince] = useState<string>('');
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [availableCities, setAvailableCities] = useState<CityInfo[]>([]);
  const [longitude, setLongitude] = useState<number | undefined>(undefined);

  // Access Code State
  const [accessCode, setAccessCode] = useState('');

  // Update cities when province changes
  useEffect(() => {
    if (selectedProvince) {
      const provinceData = CHINA_CITIES.find(p => p.name === selectedProvince);
      if (provinceData) {
        setAvailableCities(provinceData.cities);
        // Default to first city if current city is invalid for new province
        if (provinceData.cities.length > 0) {
            setSelectedCity(provinceData.cities[0].name);
            setLongitude(provinceData.cities[0].lng);
        }
      }
    } else {
        setAvailableCities([]);
        setSelectedCity('');
        setLongitude(undefined);
    }
  }, [selectedProvince]);

  // Update longitude when city changes
  useEffect(() => {
    if (selectedCity && availableCities.length > 0) {
        const cityData = availableCities.find(c => c.name === selectedCity);
        if (cityData) {
            setLongitude(cityData.lng);
        }
    }
  }, [selectedCity, availableCities]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (birthDate && birthTime) {
      onSubmit(
          { 
            gender, 
            birthDate, 
            birthTime,
            province: selectedProvince,
            city: selectedCity,
            longitude
          }, 
          accessCode // Pass the code if entered
      );
    }
  };

  return (
    <div className="w-full max-w-md p-8 bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl"></div>
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl"></div>

      <div className="relative z-10 text-center mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-900 border border-amber-500/30 mb-4 shadow-lg shadow-amber-500/10">
          <Compass className="w-8 h-8 text-amber-500" />
        </div>
        <h2 className="text-2xl font-bold text-amber-50 tracking-wider font-serif">宜居城市分析</h2>
        <p className="text-slate-400 text-sm mt-2 font-light">
            输入出生信息，探寻你的本命磁场
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
        
        {/* Date and Time */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs uppercase tracking-widest text-slate-400 mb-2 text-center">出生日期 (Date)</label>
            <input
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              className="w-full h-12 bg-slate-900/50 border border-slate-700 rounded-lg px-4 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all [color-scheme:dark] text-center appearance-none"
              required
            />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-widest text-slate-400 mb-2 text-center">出生时间 (Time)</label>
            <input
              type="time"
              value={birthTime}
              onChange={(e) => setBirthTime(e.target.value)}
              className="w-full h-12 bg-slate-900/50 border border-slate-700 rounded-lg px-4 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all [color-scheme:dark] text-center appearance-none"
              required
            />
          </div>
        </div>

        {/* Location Selector */}
        <div>
            <label className="block text-xs uppercase tracking-widest text-slate-400 mb-2 text-center">
                出生地点 (Location) <span className="text-slate-600 ml-1 text-[10px] normal-case">用于真太阳时校正</span>
            </label>
            <div className="grid grid-cols-2 gap-4">
                <select 
                    value={selectedProvince}
                    onChange={(e) => setSelectedProvince(e.target.value)}
                    className="w-full h-12 bg-slate-900/50 border border-slate-700 rounded-lg px-4 text-slate-100 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 appearance-none text-center"
                    required
                >
                    <option value="" disabled>省份/地区</option>
                    {CHINA_CITIES.map((p) => (
                        <option key={p.name} value={p.name}>{p.name}</option>
                    ))}
                </select>
                <select 
                    value={selectedCity}
                    onChange={(e) => setSelectedCity(e.target.value)}
                    className="w-full h-12 bg-slate-900/50 border border-slate-700 rounded-lg px-4 text-slate-100 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 appearance-none text-center"
                    required
                    disabled={!selectedProvince}
                >
                    <option value="" disabled>城市</option>
                    {availableCities.map((c) => (
                        <option key={c.name} value={c.name}>{c.name}</option>
                    ))}
                </select>
            </div>
        </div>

        {/* Gender */}
        <div>
           <label className="block text-xs uppercase tracking-widest text-slate-400 mb-3 text-center">性别 (Gender)</label>
           <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setGender('male')}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${
                  gender === 'male' 
                    ? 'bg-slate-700/80 border-amber-500 text-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.2)]' 
                    : 'bg-slate-900/50 border-slate-700 text-slate-500 hover:bg-slate-800'
                }`}
              >
                 <User className="w-5 h-5 mb-1" />
                 <span className="font-serif font-bold text-sm">乾造 (男)</span>
              </button>
              <button
                type="button"
                onClick={() => setGender('female')}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${
                  gender === 'female' 
                    ? 'bg-slate-700/80 border-amber-500 text-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.2)]' 
                    : 'bg-slate-900/50 border-slate-700 text-slate-500 hover:bg-slate-800'
                }`}
              >
                 <UserRound className="w-5 h-5 mb-1" />
                 <span className="font-serif font-bold text-sm">坤造 (女)</span>
              </button>
           </div>
        </div>

        {/* Access Code Input (New) */}
        <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <KeyRound className="h-4 w-4 text-amber-500/70" />
            </div>
            <input
                type="text"
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value)}
                placeholder="在此输入解锁码"
                className="w-full h-12 bg-black/40 border border-slate-600 rounded-lg pl-10 pr-4 text-white placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 transition-all font-mono tracking-wide"
            />
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
              {accessCode.trim().length > 0 ? "立即解锁天机" : "开始免费排盘"}
              <Sparkles className="w-4 h-4 group-hover:rotate-12 transition-transform" />
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default InputForm;