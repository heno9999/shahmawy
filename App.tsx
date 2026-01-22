
import React, { useState, useRef, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { 
  LayoutGrid, 
  Scale, 
  Calculator, 
  Menu, X, Send, 
  Image as ImageIcon, Cpu, ArrowRight, Activity, Zap,
  BookOpen, PenTool, Gamepad2, Settings, Globe, FileText,
  BarChart2, Upload, Clock, Timer, Search, GraduationCap,
  Shield, Mic, MessageSquare, Lock, Key
} from 'lucide-react';
import { ChatMessage, Role, AppMode, View, Language } from './types';
import { sendMessageToGemini } from './services/geminiService';
import { ChatMessageBubble } from './components/ChatMessageBubble';
import { LiveVoiceInterface } from './components/LiveVoiceInterface';

// --- Configuration ---

interface ToolConfig {
  mode: AppMode;
  title: { ar: string; en: string };
  subtitle: { ar: string; en: string };
  description: { ar: string; en: string };
  icon: React.ReactNode;
  color: string;
  borderColor: string;
  shadowColor: string;
  quickActions: { ar: string[]; en: string[] };
}

const TOOLS: Record<string, ToolConfig> = {
  [AppMode.ESTIMATION]: {
    mode: AppMode.ESTIMATION,
    title: { ar: 'خبير التسعير', en: 'Pricing Expert' }, 
    subtitle: { ar: 'التكلفة والمواصفات', en: 'Cost & Specs' },
    description: {
      ar: 'محرك تسعير ذكي مرتبط بكود البناء السعودي. احصل على بطاقات تسعير ومواصفات دقيقة.',
      en: 'Intelligent pricing engine linked to Saudi Building Code. Get accurate pricing cards and specifications.'
    },
    icon: <Calculator className="w-6 h-6" />,
    color: 'text-shahm-primary',
    borderColor: 'border-shahm-primary',
    shadowColor: 'shadow-shahm-primary/20',
    quickActions: {
      ar: ["سعر متر اللياسة", "مواصفات العزل المائي", "تكلفة القواعد الشريطية"],
      en: ["Plastering cost per m2", "Waterproofing specs", "Strip footing cost"]
    }
  },
  [AppMode.CONTRACTS]: {
    mode: AppMode.CONTRACTS,
    title: { ar: 'رادار العقود', en: 'Contract Radar' },
    subtitle: { ar: 'تحليل المخاطر', en: 'Risk Analyzer' },
    description: {
      ar: 'تحليل العقود وتحديد المخاطر القانونية والمالية مع توصيات فورية.',
      en: 'Analyze contracts and identify legal and financial risks with instant recommendations.'
    },
    icon: <Scale className="w-6 h-6" />,
    color: 'text-shahm-secondary',
    borderColor: 'border-shahm-secondary',
    shadowColor: 'shadow-shahm-secondary/20',
    quickActions: {
      ar: [], 
      en: []
    }
  },
  [AppMode.CODE_CHAT]: {
    mode: AppMode.CODE_CHAT,
    title: { ar: 'دردش مع الكود', en: 'Chat with Code' },
    subtitle: { ar: 'كود البناء ومستدام', en: 'SBC & Mostadam RAG' },
    description: {
      ar: 'نظام RAG ذكي للبحث في الكود السعودي للبناء (SBC) ونظام الاستدامة "مستدام".',
      en: 'Smart RAG system to search Saudi Building Code (SBC) and "Mostadam" sustainability system.'
    },
    icon: <BookOpen className="w-6 h-6" />,
    color: 'text-amber-400',
    borderColor: 'border-amber-400',
    shadowColor: 'shadow-amber-400/20',
    quickActions: {
      ar: ["اشتراطات الدرج SBC 201", "نسب العزل الحراري في الرياض", "نظام مستدام للمباني السكنية"],
      en: ["Staircase requirements SBC 201", "Thermal insulation in Riyadh", "Mostadam for residential"]
    }
  },
  [AppMode.WRITER]: {
    mode: AppMode.WRITER,
    title: { ar: 'خدمة اكتبلي', en: 'Smart Writer' },
    subtitle: { ar: 'كاتب ذكي', en: 'Professional Writer' },
    description: {
      ar: 'مساعد كتابة ذكي لصياغة الإيميلات، الخطابات الرسمية، وطلبات العمل باحترافية.',
      en: 'Smart writing assistant to draft emails, official letters, and work requests professionally.'
    },
    icon: <PenTool className="w-6 h-6" />,
    color: 'text-shahm-purple',
    borderColor: 'border-shahm-purple',
    shadowColor: 'shadow-shahm-purple/20',
    quickActions: {
      ar: ["إيميل طلب تمديد مشروع", "خطاب تغطية لوظيفة مهندس", "اعتذار رسمي لعميل"],
      en: ["Project extension email", "Engineer cover letter", "Formal apology to client"]
    }
  },
  [AppMode.GAME]: {
    mode: AppMode.GAME,
    title: { ar: 'العب مع شهماوي', en: 'Play with Shahmawi' },
    subtitle: { ar: 'وضع التحدي', en: 'Challenge Mode' },
    description: {
      ar: 'تحدى نفسك في المعلومات الهندسية والثقافة العامة مع شخصية شهماوي المرحة. لديك 5 دقائق لجمع أكبر عدد من النقاط!',
      en: 'Challenge yourself in engineering knowledge with Shahmawi. You have 5 minutes to get the max XP!'
    },
    icon: <Gamepad2 className="w-6 h-6" />,
    color: 'text-shahm-alert',
    borderColor: 'border-shahm-alert',
    shadowColor: 'shadow-shahm-alert/20',
    quickActions: {
      ar: ["معلومات عامة (General)", "مدني (Civil)", "معماري (Architecture)", "كهرباء (Electrical)", "ميكانيكا (Mechanical)"],
      en: ["General Knowledge", "Civil", "Architecture", "Electrical", "Mechanical"]
    }
  },
  [AppMode.LIVE_VOICE]: {
    mode: AppMode.LIVE_VOICE,
    title: { ar: 'كلم شهماوي', en: 'Talk to Shahmawi' },
    subtitle: { ar: 'محادثة صوتية فورية', en: 'Live Voice Chat' }, 
    description: {
      ar: 'تحدث مباشرة مع شهماوي صوتاً وصورة. اسأله عن أي شيء في الهندسة أو الثقافة العامة وسيجيبك فوراً.',
      en: 'Talk directly to Shahmawi. Ask him anything about engineering or general knowledge and he will answer instantly.'
    },
    icon: <Mic className="w-6 h-6" />,
    color: 'text-shahm-primary',
    borderColor: 'border-shahm-primary',
    shadowColor: 'shadow-shahm-primary/20',
    quickActions: {
      ar: [],
      en: []
    }
  }
};

const GLOBAL_SEARCH_CONFIG: ToolConfig = {
  mode: AppMode.GLOBAL_SEARCH,
  title: { ar: 'المساعد العالمي', en: 'Global Assistant' },
  subtitle: { ar: 'بحث وناقش', en: 'Search & Discuss' },
  description: { ar: 'ابحث في الويب عن أي معلومة وناقشها مع الذكاء الاصطناعي المركزي.', en: 'Search the web for any info and discuss it with Central AI.' },
  icon: <Search className="w-6 h-6" />,
  color: 'text-white',
  borderColor: 'border-shahm-primary',
  shadowColor: 'shadow-shahm-primary/20',
  quickActions: { ar: [], en: [] }
};

const GAME_DURATION = 300; 

const App: React.FC = () => {
  const [hasApiKey, setHasApiKey] = useState<boolean | null>(null);
  const [currentView, setCurrentView] = useState<View>(View.DASHBOARD);
  const [activeMode, setActiveMode] = useState<AppMode>(AppMode.ESTIMATION);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [language, setLanguage] = useState<Language>('ar');
  const [initialSearch, setInitialSearch] = useState<string | null>(null);
  
  const [gameTimeLeft, setGameTimeLeft] = useState(GAME_DURATION);
  const [isGameActive, setIsGameActive] = useState(false);
  
  const [chatHistories, setChatHistories] = useState<Record<string, ChatMessage[]>>({
    [AppMode.ESTIMATION]: [],
    [AppMode.CONTRACTS]: [],
    [AppMode.CODE_CHAT]: [],
    [AppMode.WRITER]: [],
    [AppMode.GAME]: [],
    [AppMode.LIVE_VOICE]: [],
    [AppMode.GLOBAL_SEARCH]: [],
  });

  useEffect(() => {
    const checkKey = async () => {
      if (window.aistudio) {
        const selected = await window.aistudio.hasSelectedApiKey();
        setHasApiKey(selected);
      } else {
        setHasApiKey(true); // Fallback for environments without the global object
      }
    };
    checkKey();
  }, []);

  const handleSelectKey = async () => {
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
      setHasApiKey(true); // Assume success per instructions
    }
  };

  const handleNavigate = (mode: AppMode, initialMessage?: string) => {
    setActiveMode(mode);
    setCurrentView(View.TOOL);
    setIsSidebarOpen(false);
    
    if (initialMessage) {
      setInitialSearch(initialMessage);
      setChatHistories(prev => ({ ...prev, [mode]: [] }));
    } else {
      setInitialSearch(null);
    }
    
    if (mode === AppMode.GAME) {
      setGameTimeLeft(GAME_DURATION);
      setIsGameActive(false);
    }
  };

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'ar' ? 'en' : 'ar');
  };

  const getCurrentGameXP = () => {
    if (activeMode !== AppMode.GAME) return 0;
    const history = chatHistories[AppMode.GAME];
    if (history.length === 0) return 0;
    for (let i = history.length - 1; i >= 0; i--) {
      const msg = history[i];
      if (msg.role === Role.MODEL && msg.dataType === 'game' && msg.data) {
        return (msg.data as any).total_score || 0;
      }
    }
    return 0;
  };

  const gameXP = getCurrentGameXP();

  useEffect(() => {
    if (activeMode === AppMode.GAME && chatHistories[AppMode.GAME].length > 0 && gameTimeLeft > 0 && !isGameActive) {
      const lastMsg = chatHistories[AppMode.GAME][chatHistories[AppMode.GAME].length - 1];
      if (!lastMsg.text?.includes("GAME OVER")) {
         setIsGameActive(true);
      }
    }
    let interval: any;
    if (activeMode === AppMode.GAME && isGameActive && gameTimeLeft > 0) {
      interval = setInterval(() => setGameTimeLeft((prev) => prev - 1), 1000);
    } else if (gameTimeLeft === 0 && isGameActive) {
      setIsGameActive(false);
      triggerGameOver();
    }
    return () => clearInterval(interval);
  }, [activeMode, isGameActive, gameTimeLeft, chatHistories]);

  const triggerGameOver = async () => {
    const finalXP = getCurrentGameXP();
    const systemMessage = `SYSTEM_EVENT: GAME_TIMER_EXPIRED. Final Score: ${finalXP}.`;
    const currentHistory = chatHistories[AppMode.GAME];
    try {
      const response = await sendMessageToGemini(currentHistory, "انتهى الوقت!", AppMode.GAME, language, undefined, systemMessage);
      setChatHistories(prev => ({
        ...prev,
        [AppMode.GAME]: [...prev[AppMode.GAME], {
          id: Date.now().toString(),
          role: Role.MODEL,
          text: response.text,
          data: response.data,
          dataType: response.dataType as any,
          timestamp: Date.now(),
          isError: response.isError
        }]
      }));
    } catch (e) { console.error(e); }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const isGameOver = activeMode === AppMode.GAME && gameTimeLeft === 0;

  if (hasApiKey === false) {
    return (
      <div className="h-screen w-full bg-shahm-bg flex items-center justify-center p-6 relative overflow-hidden">
        <div className="cyber-grid"></div>
        <div className="relative z-10 max-w-lg w-full glass-panel border-shahm-primary p-12 rounded-3xl text-center flex flex-col items-center gap-8 shadow-[0_0_50px_rgba(0,255,157,0.1)]">
           <div className="p-6 rounded-full bg-shahm-primary/10 border border-shahm-primary animate-pulse">
              <Lock size={64} className="text-shahm-primary" />
           </div>
           <div>
              <h1 className="text-4xl font-tech font-bold text-white mb-4 tracking-tighter uppercase">{language === 'ar' ? 'تهيئة النظام' : 'SYSTEM INITIALIZATION'}</h1>
              <p className="text-slate-400 text-lg leading-relaxed">
                {language === 'ar' 
                  ? 'يتطلب الوصول إلى "شهماوي" تفعيل مفتاح البرمجة الخاص بك من مشروع مدفوع لتفعيل خدمات البحث والذكاء الفائق.'
                  : 'Access to Shahmawi requires selecting an API key from a paid project to enable search and ultra-intelligence services.'}
              </p>
           </div>
           <a 
              href="https://ai.google.dev/gemini-api/docs/billing" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-shahm-secondary text-sm hover:underline font-mono"
           >
              ai.google.dev/gemini-api/docs/billing
           </a>
           <button 
             onClick={handleSelectKey}
             className="w-full py-4 bg-shahm-primary text-shahm-bg font-tech font-bold rounded-xl hover:bg-white transition-all transform hover:scale-105 active:scale-95 flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(0,255,157,0.4)]"
           >
             <Key size={20} />
             {language === 'ar' ? 'تفعيل مفتاح الدخول' : 'ACTIVATE ACCESS KEY'}
           </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex h-screen bg-shahm-bg text-slate-300 font-sans overflow-hidden selection:bg-shahm-primary selection:text-black ${language === 'ar' ? 'dir-rtl' : 'dir-ltr'}`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="cyber-grid"></div>
      <div className="absolute inset-0 bg-gradient-to-b from-shahm-primary/5 to-transparent pointer-events-none z-0"></div>

      <aside className={`fixed inset-y-0 ${language === 'ar' ? 'right-0 border-l' : 'left-0 border-r'} z-50 w-80 glass-panel border-shahm-primary/20 transform transition-transform duration-300 md:relative md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : (language === 'ar' ? 'translate-x-full' : '-translate-x-full')} flex flex-col`}>
          <div className="h-24 flex items-center justify-between px-6 border-b border-shahm-primary/20 relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-transparent via-shahm-primary/5 to-transparent animate-scanline pointer-events-none"></div>
             <div className="flex items-center gap-4 text-shahm-primary">
               <div className="relative">
                 <Cpu className="animate-pulse-slow" size={32} />
                 <span className="absolute inset-0 animate-ping opacity-20 bg-shahm-primary rounded-full"></span>
               </div>
               <div className="flex flex-col">
                  <span className="font-tech font-bold text-2xl tracking-wider text-glow uppercase">SHAHMAWY</span>
                  <span className="text-xs text-shahm-secondary font-mono tracking-[0.2em]">CORE SYSTEM</span>
               </div>
             </div>
             <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-slate-400 hover:text-white">
               <X size={28} />
             </button>
          </div>
          <nav className="flex-1 p-5 space-y-3 overflow-y-auto custom-scroll relative z-10">
            <button 
              onClick={() => setCurrentView(View.DASHBOARD)}
              className={`w-full flex items-center gap-5 px-5 py-5 rounded-xl border transition-all duration-300 group ${currentView === View.DASHBOARD ? 'bg-shahm-primary/10 border-shahm-primary text-shahm-primary box-glow' : 'border-transparent hover:bg-shahm-surface hover:border-shahm-primary/30 text-slate-400 hover:text-white'}`}
            >
              <LayoutGrid size={24} className={currentView === View.DASHBOARD ? "animate-pulse" : "group-hover:text-shahm-primary"} />
              <span className="font-bold tracking-wide text-lg">{language === 'ar' ? 'لوحة القيادة' : 'Dashboard'}</span>
            </button>
            <div className="pt-8 pb-3 px-2 flex items-center justify-between text-sm text-shahm-secondary/70 font-tech uppercase tracking-widest border-b border-shahm-border/50 mb-3">
              <span>{language === 'ar' ? 'الوحدات' : 'Modules'}</span>
              <Settings size={14} />
            </div>
            {Object.values(TOOLS).map((tool) => (
              <button
                key={tool.mode}
                onClick={() => handleNavigate(tool.mode)}
                className={`w-full flex items-center gap-5 px-5 py-4 rounded-xl border transition-all duration-300 relative overflow-hidden group ${currentView === View.TOOL && activeMode === tool.mode ? `bg-shahm-surface ${tool.borderColor} text-white box-glow` : 'border-transparent hover:bg-shahm-surface hover:border-white/10 text-slate-400'}`}
              >
                <div className={`${currentView === View.TOOL && activeMode === tool.mode ? tool.color : 'text-slate-600 group-hover:text-white'} transition-colors`}>
                  {React.cloneElement(tool.icon as React.ReactElement, { size: 24 })}
                </div>
                <div className={`flex flex-col ${language === 'ar' ? 'items-start' : 'items-end'} relative z-10 w-full`}>
                  <span className="font-bold text-base text-white group-hover:text-white">{tool.title[language]}</span>
                  <span className="text-xs text-slate-500 font-tech tracking-wider uppercase group-hover:text-shahm-primary/70">{tool.subtitle[language]}</span>
                </div>
              </button>
            ))}
          </nav>
      </aside>

      <main className="flex-1 flex flex-col relative overflow-hidden z-10">
        <header className="h-24 flex items-center justify-between px-10 border-b border-shahm-primary/20 bg-shahm-bg/60 backdrop-blur-md">
          <div className="flex items-center gap-5">
            <button onClick={() => setIsSidebarOpen(true)} className="md:hidden text-shahm-primary hover:text-white transition-colors">
              <Menu size={28} />
            </button>
            <h2 className="font-tech text-2xl text-white tracking-wide flex items-center gap-4">
              {currentView === View.DASHBOARD ? (
                 <span className="text-glow flex items-center gap-3 animate-pulse"><Activity className="text-shahm-primary" size={28} /> Powered by Google</span>
              ) : (
                <>
                  <span className={`${activeMode === AppMode.GLOBAL_SEARCH ? GLOBAL_SEARCH_CONFIG.color : TOOLS[activeMode].color} animate-pulse`}>
                    {React.cloneElement((activeMode === AppMode.GLOBAL_SEARCH ? GLOBAL_SEARCH_CONFIG.icon : TOOLS[activeMode].icon) as React.ReactElement, { size: 28 })}
                  </span>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-3">
                      <span className="text-glow leading-none">{(activeMode === AppMode.GLOBAL_SEARCH ? GLOBAL_SEARCH_CONFIG.subtitle[language] : TOOLS[activeMode].subtitle[language]).toUpperCase()}</span>
                      {activeMode === AppMode.GAME && (
                        <div className={`flex items-center gap-2 px-3 py-1 rounded-md border text-sm font-mono ${gameTimeLeft < 30 ? 'bg-red-900/50 border-red-500 text-red-500 animate-pulse' : 'bg-black/40 border-shahm-primary/30 text-shahm-primary'}`}>
                          <Timer size={14} />
                          <span>{formatTime(gameTimeLeft)}</span>
                        </div>
                      )}
                    </div>
                    {activeMode === AppMode.GAME && (
                      <span className="text-xs font-mono text-white/70 tracking-widest bg-white/10 px-2 py-0.5 rounded mt-1 w-fit">XP: <span className="text-shahm-primary font-bold">{gameXP}</span></span>
                    )}
                  </div>
                </>
              )}
            </h2>
          </div>
          <div className="flex items-center gap-5">
             <button onClick={toggleLanguage} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-shahm-surface border border-shahm-primary/30 text-shahm-primary text-sm hover:bg-shahm-primary/10 transition-colors">
                <Globe size={16} />
                <span className="font-bold font-mono">{language.toUpperCase()}</span>
             </button>
          </div>
        </header>

        <div className="flex-1 overflow-hidden relative">
          {currentView === View.DASHBOARD ? (
            <DashboardView onSelectTool={handleNavigate} language={language} />
          ) : (
            <ToolInterface 
              mode={activeMode} 
              history={chatHistories[activeMode]} 
              setHistory={(h) => setChatHistories(prev => ({...prev, [activeMode]: h}))} 
              language={language}
              isGameOver={isGameOver}
              initialSearchQuery={initialSearch}
              onQueryConsumed={() => setInitialSearch(null)}
            />
          )}
        </div>
      </main>
    </div>
  );
};

// --- Sub-Components ---

const DashboardView: React.FC<{ onSelectTool: (mode: AppMode, q?: string) => void, language: Language }> = ({ onSelectTool, language }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    onSelectTool(AppMode.GLOBAL_SEARCH, searchQuery);
  };

  return (
    <div className="h-full p-8 md:p-12 overflow-y-auto custom-scroll relative">
      <div className="max-w-7xl mx-auto flex flex-col justify-center min-h-[70vh]">
        <div className="text-center mb-12 relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-shahm-primary/20 rounded-full blur-[120px] pointer-events-none"></div>
          <div className="inline-block p-8 rounded-full bg-shahm-surface border border-shahm-primary/50 mb-10 animate-float box-glow relative z-10">
             <Cpu size={80} className="text-shahm-primary animate-pulse-slow" />
          </div>
          <h1 className="text-6xl md:text-8xl font-bold text-white mb-8 font-tech tracking-tighter text-glow uppercase">SHAHMAWY</h1>
          <p className="text-slate-400 text-2xl font-light tracking-wide max-w-3xl mx-auto">
            {language === 'ar' ? 'نظام الذكاء الاصطناعي المركزي لشركة شهم. اختر وحدة للبدء.' : 'Central AI System for Shahm Contracting. Select a module.'}
          </p>
        </div>

        <div className="max-w-2xl mx-auto w-full mb-16 relative z-20">
          <form onSubmit={handleSearchSubmit} className="relative group">
            <div className="absolute inset-0 bg-shahm-primary/10 rounded-2xl blur-xl group-focus-within:bg-shahm-primary/20 transition-all"></div>
            <div className="relative bg-shahm-surface border border-shahm-primary/30 rounded-2xl p-1 flex items-center transition-all group-focus-within:border-shahm-primary group-focus-within:shadow-[0_0_20px_rgba(0,255,157,0.2)]">
               <div className="p-4 text-shahm-primary"><Search size={24} /></div>
               <input 
                 type="text" 
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
                 placeholder={language === 'ar' ? 'ابحث في الويب عن أي معلومة...' : 'Search the web for any info...'}
                 className="flex-1 bg-transparent border-none outline-none text-white text-xl p-4 font-sans tracking-tight"
               />
               <button type="submit" className="p-4 bg-shahm-primary text-shahm-bg rounded-xl hover:bg-white transition-all">
                 <ArrowRight size={24} className={language === 'ar' ? 'rotate-180' : ''} />
               </button>
            </div>
          </form>
          <div className="flex justify-center gap-4 mt-4 text-xs font-tech text-slate-500 uppercase tracking-widest">
             <span className="flex items-center gap-1"><Zap size={10} className="text-shahm-primary" /> SEARCH_GROUNDING: ACTIVE</span>
             <span className="flex items-center gap-1"><Shield size={10} className="text-shahm-secondary" /> DATA_INTEGRITY: HIGH</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 relative z-10">
          {Object.values(TOOLS).map((tool) => (
            <div key={tool.mode} onClick={() => onSelectTool(tool.mode as AppMode)} className={`group glass-panel rounded-2xl p-8 relative overflow-hidden cursor-pointer transition-all duration-500 hover:-translate-y-2 box-glow-hover border border-white/5 hover:${tool.borderColor}`}>
              <div className="tech-corner tl group-hover:border-shahm-primary"></div>
              <div className="tech-corner tr group-hover:border-shahm-primary"></div>
              <div className="tech-corner bl group-hover:border-shahm-primary"></div>
              <div className="tech-corner br group-hover:border-shahm-primary"></div>
              <div className="flex items-center gap-5 mb-6 relative z-10">
                <div className={`p-4 rounded-xl bg-shahm-bg/50 border border-white/10 ${tool.color} group-hover:scale-110 transition-transform`}>
                  {React.cloneElement(tool.icon as React.ReactElement, { size: 32 })}
                </div>
                <h3 className="text-2xl font-bold text-white tracking-wide">{tool.title[language]}</h3>
              </div>
              <p className="text-base text-slate-400 mb-8 leading-relaxed min-h-[56px] relative z-10 group-hover:text-slate-200 transition-colors">{tool.description[language]}</p>
              <div className="flex items-center justify-between border-t border-white/10 pt-5 relative z-10">
                 <span className="text-xs font-tech text-shahm-secondary opacity-70 group-hover:opacity-100 transition-opacity">INITIALIZE_APP</span>
                 <ArrowRight size={20} className={`text-slate-600 group-hover:${tool.color} transition-all transform group-hover:translate-x-2 ${language === 'ar' ? 'rotate-180' : ''}`} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

interface ToolInterfaceProps {
  mode: AppMode;
  history: ChatMessage[];
  setHistory: (history: ChatMessage[]) => void;
  language: Language;
  isGameOver?: boolean;
  initialSearchQuery?: string | null;
  onQueryConsumed?: () => void;
}

const ToolInterface: React.FC<ToolInterfaceProps> = ({ mode, history, setHistory, language, isGameOver, initialSearchQuery, onQueryConsumed }) => {
  const [input, setInput] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const triggerLock = useRef<string | null>(null);

  const toolConfig = mode === AppMode.GLOBAL_SEARCH ? GLOBAL_SEARCH_CONFIG : TOOLS[mode];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history, mode]);

  useEffect(() => {
    if (initialSearchQuery && !isLoading && history.length === 0 && triggerLock.current !== initialSearchQuery) {
      triggerLock.current = initialSearchQuery;
      handleSend(initialSearchQuery);
      onQueryConsumed?.();
    }
  }, [initialSearchQuery, mode, history.length]);

  const handleSend = async (overrideText?: string, hiddenData?: string) => {
    const textToSend = overrideText || input;
    if ((!textToSend.trim() && !selectedImage) || isLoading) return;
    
    const newMessage: ChatMessage = { id: Date.now().toString(), role: Role.USER, text: textToSend, image: selectedImage || undefined, timestamp: Date.now() };
    const updatedHistory = [...history, newMessage];
    setHistory(updatedHistory);
    setInput('');
    const tempImage = selectedImage;
    setSelectedImage(null);
    setIsLoading(true);

    let effectiveHiddenData = hiddenData;
    if (mode === AppMode.GAME) effectiveHiddenData = (hiddenData ? hiddenData + "\n" : "") + `SESSION_SEED: ${Math.random().toString(36).substring(7)}`;

    try {
      const response = await sendMessageToGemini(updatedHistory, newMessage.text || '', mode, language, tempImage || undefined, effectiveHiddenData);
      setHistory([...updatedHistory, {
        id: (Date.now() + 1).toString(),
        role: Role.MODEL,
        text: response.text,
        image: response.generatedImage, 
        data: response.data,
        dataType: response.dataType as any,
        timestamp: Date.now(),
        isError: response.isError,
        groundingMetadata: response.groundingMetadata
      }]);
    } catch (error: any) {
      // Handle the "Requested entity was not found" error by prompting for key re-selection
      if (error?.message?.includes("Requested entity was not found") && window.aistudio) {
        await window.aistudio.openSelectKey();
      }
      setHistory([...updatedHistory, { id: (Date.now() + 1).toString(), role: Role.MODEL, text: language === 'ar' ? 'عذراً، حدث خطأ في النظام.' : 'Sorry, a system error occurred.', isError: true, timestamp: Date.now() }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setSelectedImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  if (mode === AppMode.LIVE_VOICE) {
    return <LiveVoiceInterface language={language} />;
  }

  return (
    <div className="flex flex-col h-full bg-transparent relative z-10">
      <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scroll relative">
        <div className="max-w-5xl mx-auto min-h-full flex flex-col justify-end">
          {history.length === 0 && !isLoading && (
             <div className="text-center text-slate-500 my-auto pb-20 animate-in fade-in zoom-in duration-700">
                <div className={`inline-block p-8 rounded-full bg-shahm-surface border ${toolConfig.borderColor} mb-8 shadow-[0_0_40px_rgba(0,0,0,0.5)] relative`}>
                   <div className="absolute inset-0 bg-current opacity-10 blur-xl rounded-full text-inherit"></div>
                   <div className={toolConfig.color}>
                      {React.cloneElement(toolConfig.icon as React.ReactElement, { size: 48 })}
                   </div>
                </div>
                <h3 className="text-4xl font-bold text-white mb-4 font-tech uppercase tracking-tighter">{toolConfig.title[language]}</h3>
                <p className="max-w-lg mx-auto text-lg text-slate-400 leading-relaxed bg-shahm-surface/50 p-6 rounded-xl border border-white/5">{toolConfig.description[language]}</p>
             </div>
          )}
          {history.map((msg) => (
            <ChatMessageBubble key={msg.id} message={msg} language={language} onAction={handleSend} isGameOver={isGameOver} />
          ))}
          {isLoading && (
            <div className={`flex items-center gap-3 text-base animate-pulse font-tech px-6 mb-10 ${toolConfig.color}`}>
               <div className="flex gap-1.5"><span className="w-2 h-2 bg-current rounded-full animate-bounce"></span><span className="w-2 h-2 bg-current rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></span><span className="w-2 h-2 bg-current rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></span></div>
               <span>PROCESSING DATA STREAM...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>
      <div className="p-6 md:p-8 border-t border-shahm-primary/20 bg-shahm-surface/80 backdrop-blur-lg relative z-20">
        <div className="max-w-5xl mx-auto flex flex-col gap-5">
          {!input && !isLoading && !selectedImage && !isGameOver && toolConfig.quickActions[language].length > 0 && (
            <div className="flex gap-4 overflow-x-auto pb-3 custom-scroll">
              {toolConfig.quickActions[language].map((action, idx) => (
                <button key={idx} onClick={() => handleSend(action)} className="whitespace-nowrap px-5 py-3 bg-shahm-bg border border-shahm-border hover:border-shahm-primary/50 rounded-xl text-sm text-slate-300 hover:text-white hover:bg-shahm-surface transition-all flex items-center gap-2.5 shadow-sm group">
                  <span className="w-1.5 h-1.5 rounded-full bg-shahm-primary opacity-50 group-hover:opacity-100"></span>{action}
                </button>
              ))}
            </div>
          )}
          {selectedImage && (
             <div className="inline-flex items-center gap-3 bg-shahm-surface px-4 py-3 rounded-xl text-sm text-shahm-primary w-fit border border-shahm-primary/30 animate-in fade-in slide-in-from-bottom-2 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                {selectedImage.startsWith('data:application/pdf') ? <FileText size={18} /> : <ImageIcon size={18} />}
                <span className="font-mono">{selectedImage.startsWith('data:application/pdf') ? 'PDF_BUFFER_LOADED' : 'IMAGE_BUFFER_LOADED'}</span>
                <button onClick={() => setSelectedImage(null)} className="text-shahm-alert hover:text-white font-bold ml-3 p-1">×</button>
             </div>
          )}
          <div className="flex gap-4 relative items-end">
             <input type="file" hidden ref={fileInputRef} onChange={handleFileUpload} accept={mode === AppMode.CONTRACTS ? "image/*,application/pdf" : "image/*"} disabled={isGameOver} />
             <button onClick={() => fileInputRef.current?.click()} disabled={isGameOver} className={`p-5 rounded-2xl bg-shahm-bg border border-shahm-border text-slate-400 hover:text-shahm-secondary hover:border-shahm-secondary hover:shadow-[0_0_15px_rgba(6,182,212,0.2)] transition-all ${selectedImage ? 'text-shahm-secondary border-shahm-secondary shadow-[0_0_15px_rgba(6,182,212,0.2)]' : ''} ${isGameOver ? 'opacity-50 cursor-not-allowed' : ''}`}>
               {mode === AppMode.CONTRACTS ? <FileText size={24} /> : <ImageIcon size={24} />}
             </button>
             <div className="flex-1 bg-shahm-bg border border-shahm-border focus-within:border-shahm-primary focus-within:shadow-[0_0_20px_rgba(16,185,129,0.2)] transition-all rounded-2xl overflow-hidden relative">
                <textarea 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }}}
                  placeholder={language === 'ar' ? 'اكتب رسالتك...' : 'Type your message...'}
                  disabled={isGameOver}
                  className={`w-full bg-transparent border-none outline-none text-white resize-none max-h-40 p-5 text-lg leading-relaxed placeholder:text-slate-600 font-sans ${isGameOver ? 'cursor-not-allowed opacity-50' : ''}`}
                  rows={1}
                />
             </div>
             <button onClick={() => handleSend()} disabled={isLoading || (!input.trim() && !selectedImage) || isGameOver} className={`p-5 rounded-2xl font-bold transition-all flex items-center justify-center ${(!input.trim() && !selectedImage) || isGameOver ? 'bg-shahm-surface text-slate-700 border border-shahm-border cursor-not-allowed' : 'bg-shahm-primary text-shahm-bg hover:bg-emerald-400 hover:shadow-[0_0_25px_rgba(16,185,129,0.5)] transform hover:scale-105'}`}>
               <Send size={24} />
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
