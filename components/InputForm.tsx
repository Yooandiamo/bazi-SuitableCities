import React, { useState, useEffect, useMemo } from 'react';
import { UserInput } from '../types';
import { Compass, Sparkles, User, UserRound, KeyRound, CalendarDays, Moon, ChevronDown, Clock } from 'lucide-react';
import { CHINA_CITIES, CityInfo } from '../utils/cityData';
import BottomSheetPicker, { PickerColumn } from './BottomSheetPicker';

interface InputFormProps {
  onSubmit: (data: UserInput, accessCode?: string) => void;
  isLoading: boolean;
}

const InputForm: React.FC<InputFormProps> = ({ onSubmit, isLoading }) => {
  const [gender, setGender] = useState<'male' | 'female'>('male');
  
  // Date State
  const [calendarType, setCalendarType] = useState<'solar' | 'lunar'>('solar');
  const [birthDate, setBirthDate] = useState(''); // Used for Solar "YYYY-MM-DD"
  const [birthTime, setBirthTime] = useState(''); // "HH:mm"
  
  // Lunar Date State
  const [lunarYear, setLunarYear] = useState<number>(1990);
  const [lunarMonth, setLunarMonth] = useState<number>(1);
  const [lunarDay, setLunarDay] = useState<number>(1);
  const [isLeapMonth, setIsLeapMonth] = useState<boolean>(false);
  
  // Location State
  const [selectedProvince, setSelectedProvince] = useState<string>('');
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [availableCities, setAvailableCities] = useState<CityInfo[]>([]);
  const [longitude, setLongitude] = useState<number | undefined>(undefined);

  // Access Code State
  const [accessCode, setAccessCode] = useState('');

  // Picker Visibility State
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isTimePickerOpen, setIsTimePickerOpen] = useState(false);

  // Temp State for Pickers
  const [tempYear, setTempYear] = useState(1990);
  const [tempMonth, setTempMonth] = useState(1);
  const [tempDay, setTempDay] = useState(1);
  const [tempHour, setTempHour] = useState(12);
  const [tempMinute, setTempMinute] = useState(0);

  // Initialize Temp State when opening pickers
  const openDatePicker = () => {
    if (calendarType === 'solar') {
        if (birthDate) {
            const [y, m, d] = birthDate.split('-').map(Number);
            setTempYear(y);
            setTempMonth(m);
            setTempDay(d);
        } else {
            const now = new Date();
            setTempYear(now.getFullYear());
            setTempMonth(now.getMonth() + 1);
            setTempDay(now.getDate());
        }
    } else {
        setTempYear(lunarYear);
        setTempMonth(lunarMonth);
        setTempDay(lunarDay);
    }
    setIsDatePickerOpen(true);
  };

  const openTimePicker = () => {
    if (birthTime) {
        const [h, m] = birthTime.split(':').map(Number);
        setTempHour(h);
        setTempMinute(m);
    } else {
        setTempHour(12);
        setTempMinute(0);
    }
    setIsTimePickerOpen(true);
  };

  const handleDateConfirm = () => {
    if (calendarType === 'solar') {
        const dateStr = `${tempYear}-${String(tempMonth).padStart(2, '0')}-${String(tempDay).padStart(2, '0')}`;
        setBirthDate(dateStr);
    } else {
        setLunarYear(tempYear);
        setLunarMonth(tempMonth);
        setLunarDay(tempDay);
    }
    setIsDatePickerOpen(false);
  };

  const handleTimeConfirm = () => {
    const timeStr = `${String(tempHour).padStart(2, '0')}:${String(tempMinute).padStart(2, '0')}`;
    setBirthTime(timeStr);
    setIsTimePickerOpen(false);
  };

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

  // Generate Options
  const yearOptions = useMemo(() => Array.from({ length: 100 }, (_, i) => ({ label: String(2030 - i), value: 2030 - i })), []);
  const monthOptions = useMemo(() => Array.from({ length: 12 }, (_, i) => ({ label: String(i + 1), value: i + 1 })), []);
  
  // Dynamic Day Options based on Year/Month
  const dayOptions = useMemo(() => {
    let daysInMonth = 31;
    if (calendarType === 'solar') {
        daysInMonth = new Date(tempYear, tempMonth, 0).getDate();
    } else {
        daysInMonth = 30; // Simplified for Lunar as per original code
    }
    return Array.from({ length: daysInMonth }, (_, i) => ({ label: String(i + 1), value: i + 1 }));
  }, [tempYear, tempMonth, calendarType]);

  // Ensure tempDay is valid when month changes
  useEffect(() => {
      if (tempDay > dayOptions.length) {
          setTempDay(dayOptions.length);
      }
  }, [dayOptions.length, tempDay]);

  const hourOptions = useMemo(() => Array.from({ length: 24 }, (_, i) => ({ label: String(i).padStart(2, '0'), value: i })), []);
  const minuteOptions = useMemo(() => Array.from({ length: 60 }, (_, i) => ({ label: String(i).padStart(2, '0'), value: i })), []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    let finalBirthDate = birthDate;
    if (calendarType === 'lunar') {
        finalBirthDate = `${lunarYear}-${lunarMonth}-${lunarDay}`;
    }

    if (finalBirthDate && birthTime) {
      onSubmit(
          { 
            gender, 
            birthDate: finalBirthDate, 
            birthTime,
            calendarType,
            isLeapMonth,
            province: selectedProvince,
            city: selectedCity,
            longitude
          }, 
          accessCode 
      );
    }
  };

  // Display Values
  const displayDate = calendarType === 'solar' 
    ? (birthDate || '请选择日期') 
    : `${lunarYear}年 ${lunarMonth}月 ${lunarDay}日`;
  
  const displayTime = birthTime || '请选择时间';

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
        
        {/* Calendar Type Toggle */}
        <div className="flex bg-slate-900/50 p-1 rounded-lg border border-slate-700">
            <button
                type="button"
                onClick={() => setCalendarType('solar')}
                className={`flex-1 py-2 text-sm font-medium rounded-md flex items-center justify-center gap-2 transition-all ${
                    calendarType === 'solar' 
                    ? 'bg-slate-700 text-amber-400 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-300'
                }`}
            >
                <CalendarDays className="w-4 h-4" /> 公历 (阳历)
            </button>
            <button
                type="button"
                onClick={() => setCalendarType('lunar')}
                className={`flex-1 py-2 text-sm font-medium rounded-md flex items-center justify-center gap-2 transition-all ${
                    calendarType === 'lunar' 
                    ? 'bg-slate-700 text-amber-400 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-300'
                }`}
            >
                <Moon className="w-4 h-4" /> 农历 (阴历)
            </button>
        </div>

        {/* Date and Time */}
        <div className="space-y-4">
          {/* Date Input (Custom Trigger) */}
          <div>
            <label className="block text-xs uppercase tracking-widest text-slate-400 mb-2 text-center">
                {calendarType === 'solar' ? '出生日期 (公历)' : '出生日期 (农历)'}
            </label>
            
            <button
                type="button"
                onClick={openDatePicker}
                className="w-full h-12 bg-slate-900/50 border border-slate-700 rounded-lg px-4 text-slate-100 flex items-center justify-between hover:border-amber-500/50 transition-all group"
            >
                <span className={!birthDate && calendarType === 'solar' ? 'text-slate-500' : 'text-slate-100'}>
                    {displayDate}
                </span>
                <ChevronDown className="w-4 h-4 text-slate-500 group-hover:text-amber-500 transition-colors" />
            </button>
            
            {/* Leap Month Checkbox for Lunar */}
            {calendarType === 'lunar' && (
                <div className="flex items-center justify-center mt-2 gap-2">
                    <input 
                        type="checkbox" 
                        id="leapMonth"
                        checked={isLeapMonth}
                        onChange={(e) => setIsLeapMonth(e.target.checked)}
                        className="w-4 h-4 rounded border-slate-600 bg-slate-900 text-amber-500 focus:ring-amber-500 focus:ring-offset-slate-900"
                    />
                    <label htmlFor="leapMonth" className="text-sm text-slate-400 cursor-pointer select-none">
                        是闰月 (例如: 闰四月)
                    </label>
                </div>
            )}
          </div>

          {/* Time Input (Custom Trigger) */}
          <div>
            <label className="block text-xs uppercase tracking-widest text-slate-400 mb-2 text-center">出生时间 (Time)</label>
            <button
                type="button"
                onClick={openTimePicker}
                className="w-full h-12 bg-slate-900/50 border border-slate-700 rounded-lg px-4 text-slate-100 flex items-center justify-between hover:border-amber-500/50 transition-all group"
            >
                <span className={!birthTime ? 'text-slate-500' : 'text-slate-100'}>
                    {displayTime}
                </span>
                <Clock className="w-4 h-4 text-slate-500 group-hover:text-amber-500 transition-colors" />
            </button>
          </div>
        </div>

        {/* Location Selector */}
        <div>
            <label className="block text-xs uppercase tracking-widest text-slate-400 mb-2 text-center">
                出生地点 (Location) <span className="text-slate-600 ml-1 text-[10px] normal-case">用于真太阳时校正</span>
            </label>
            <div className="grid grid-cols-2 gap-4">
                <div className="relative">
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
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                </div>
                <div className="relative">
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
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                </div>
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

        {/* Access Code Input */}
        <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <KeyRound className="h-4 w-4 text-amber-500/70" />
            </div>
            <input
                type="text"
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value)}
                placeholder="在此输入解锁码 (选填)"
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

      {/* Date Picker Modal */}
      <BottomSheetPicker
        isOpen={isDatePickerOpen}
        onClose={() => setIsDatePickerOpen(false)}
        onConfirm={handleDateConfirm}
        title={calendarType === 'solar' ? "选择出生日期 (公历)" : "选择出生日期 (农历)"}
        columns={[
            {
                options: yearOptions,
                value: tempYear,
                onChange: setTempYear,
                suffix: '年'
            },
            {
                options: monthOptions,
                value: tempMonth,
                onChange: setTempMonth,
                suffix: '月'
            },
            {
                options: dayOptions,
                value: tempDay,
                onChange: setTempDay,
                suffix: '日'
            }
        ]}
      />

      {/* Time Picker Modal */}
      <BottomSheetPicker
        isOpen={isTimePickerOpen}
        onClose={() => setIsTimePickerOpen(false)}
        onConfirm={handleTimeConfirm}
        title="选择出生时间"
        columns={[
            {
                options: hourOptions,
                value: tempHour,
                onChange: setTempHour,
                suffix: '时'
            },
            {
                options: minuteOptions,
                value: tempMinute,
                onChange: setTempMinute,
                suffix: '分'
            }
        ]}
      />
    </div>
  );
};

export default InputForm;