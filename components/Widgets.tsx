import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, Shield, Book, Star, 
  Copy, Check, Send, Trophy, Smile, Frown,
  Scale, FileText, Code, Zap, Palette,
  Flame, Crown, Medal, User, Lightbulb, Skull,
  PieChart as PieIcon, BarChart2, TrendingUp,
  Activity, Mail, Paperclip, Clock,
  AlertOctagon, CheckCircle2, Gavel,
  Target, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import { EstimateData, ContractAnalysisData, CodeChatData, WriterData, GameData, AnalyticsData, Language } from '../types';
import { 
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend 
} from 'recharts';
import ReactMarkdown from 'react-markdown';

// --- Sound Effects Utility ---
const playSound = (type: 'success' | 'error' | 'rankup' | 'click') => {
  const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioContext) return;
  
  const ctx = new AudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  
  osc.connect(gain);
  gain.connect(ctx.destination);
  
  const now = ctx.currentTime;
  
  if (type === 'success') {
    osc.type = 'sine';
    osc.frequency.setValueAtTime(523.25, now); 
    osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.1);
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
    osc.start(now);
    osc.stop(now + 0.5);
  } else if (type === 'error') {
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.linearRampToValueAtTime(100, now + 0.3);
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.linearRampToValueAtTime(0.01, now + 0.3);
    osc.start(now);
    osc.stop(now + 0.3);
  } else if (type === 'rankup') {
    osc.type = 'triangle';
    gain.gain.setValueAtTime(0.15, now);
    osc.frequency.setValueAtTime(261.63, now);
    osc.frequency.setValueAtTime(329.63, now + 0.15);
    osc.frequency.setValueAtTime(392.00, now + 0.30);
    osc.frequency.setValueAtTime(523.25, now + 0.45);
    gain.gain.linearRampToValueAtTime(0, now + 1.2);
    osc.start(now);
    osc.stop(now + 1.2);
  } else if (type === 'click') {
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, now);
    gain.gain.setValueAtTime(0.05, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    osc.start(now);
    osc.stop(now + 0.1);
  }
}

// --- Neon Card Container ---
interface NeonCardProps {
  children?: React.ReactNode;
  borderColor?: string;
  title?: string;
  icon?: React.ReactNode;
  glowColor?: string;
  className?: string;
}

const NeonCard = ({ children, borderColor = 'border-shahm-primary', title, icon, glowColor = 'shadow-shahm-primary/10', className = '' }: NeonCardProps) => (
  // Removed hardcoded max-w-md to allow overriding via className
  <div className={`glass-panel border ${borderColor} rounded-2xl overflow-hidden w-full shadow-lg ${glowColor} animate-in fade-in zoom-in duration-500 relative group ${className || 'max-w-md'}`}>
    {/* Tech Corners */}
    <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-white/50 opacity-50 group-hover:opacity-100 transition-opacity"></div>
    <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-white/50 opacity-50 group-hover:opacity-100 transition-opacity"></div>
    <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-white/50 opacity-50 group-hover:opacity-100 transition-opacity"></div>
    <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-white/50 opacity-50 group-hover:opacity-100 transition-opacity"></div>
    
    {(title || icon) && (
      <div className="p-4 border-b border-white/10 bg-white/5 flex items-center justify-between">
         <div className="flex items-center gap-3 font-tech font-bold text-base tracking-wider">
            {React.cloneElement(icon as React.ReactElement, { size: 18 })}
            <span>{title}</span>
         </div>
         <div className="w-2.5 h-2.5 bg-current rounded-full animate-pulse"></div>
      </div>
    )}
    <div className="p-0">{children}</div>
  </div>
);

// --- Helper Components ---
const CopyButton = ({ text, language }: { text: string, language: Language }) => {
  const [copied, setCopied] = React.useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={handleCopy} className="text-xs uppercase flex items-center gap-1.5 text-shahm-secondary hover:text-white transition-colors border border-shahm-secondary/30 px-3 py-1.5 rounded hover:bg-shahm-secondary/10">
      {copied ? <Check size={12} /> : <Copy size={12} />}
      {copied ? (language === 'ar' ? 'تم النسخ' : 'COPIED') : (language === 'ar' ? 'نسخ' : 'COPY')}
    </button>
  );
};

// --- Custom Tooltip for Charts ---
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-shahm-bg border border-white/10 p-3 rounded-lg shadow-xl text-xs backdrop-blur-md z-50">
        <p className="font-bold text-white mb-2 font-tech">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 mb-1">
             <span className="w-2 h-2 rounded-full" style={{backgroundColor: entry.color || entry.fill}}></span>
             <span className="text-slate-300">{entry.name}:</span>
             <span className="font-bold font-mono text-white">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

// --- 1. Estimate Widget ---
export const EstimateWidget: React.FC<{ data: EstimateData, language: Language, onAction?: (text: string) => void }> = ({ data, language, onAction }) => {
  return (
    <NeonCard 
      borderColor="border-shahm-primary" 
      glowColor="shadow-[0_0_20px_rgba(16,185,129,0.15)]"
      title={language === 'ar' ? "خبير التسعير" : "PRICING EXPERT"}
      icon={<Zap className="text-shahm-primary"/>}
      className="max-w-md"
    >
      <div className="p-5">
        <div className="flex justify-between items-start mb-6">
           <div>
             <span className="text-[10px] bg-shahm-primary/10 text-shahm-primary px-2 py-1 rounded border border-shahm-primary/30 mb-2 inline-block font-tech">{data.sbc_code || 'SBC-GEN'}</span>
             <h3 className="text-2xl font-bold text-white leading-tight">{data.item_name}</h3>
           </div>
           <div className="text-right">
             <div className="text-3xl font-bold text-shahm-primary font-tech text-glow">
               {data.price_range.min}-{data.price_range.max}
             </div>
             <div className="text-xs text-slate-400 font-mono tracking-wider mt-1">{data.price_range.currency} / {data.unit}</div>
           </div>
        </div>

        <div className="space-y-4">
          <div className="bg-shahm-bg/60 p-4 rounded-xl border border-white/5">
            <h4 className="text-xs font-bold text-shahm-secondary mb-3 uppercase tracking-widest border-b border-white/5 pb-2">
              {language === 'ar' ? "المواصفات الفنية" : "Technical Specs"}
            </h4>
            <ul className="text-sm text-slate-300 space-y-2">
               {data.specs.map((spec, i) => (
                 <li key={i} className="flex items-start gap-2">
                   <span className="w-1.5 h-1.5 bg-shahm-primary rounded-full mt-1.5 shrink-0"></span>
                   {spec}
                 </li>
               ))}
            </ul>
          </div>

          {data.hazards.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-2 custom-scroll">
              {data.hazards.map((h, i) => (
                <span key={i} className="whitespace-nowrap text-[10px] bg-shahm-alert/10 text-shahm-alert border border-shahm-alert/30 px-2 py-1 rounded flex items-center gap-1 font-bold">
                   <AlertTriangle size={10} /> {h}
                </span>
              ))}
            </div>
          )}
        </div>
        
        <div className="mt-5 pt-4 border-t border-white/10 text-center">
           <button 
             onClick={() => onAction?.(language === 'ar' ? `اعتمد هذا السعر: ${data.item_name}` : `Approve price for: ${data.item_name}`)}
             className="text-xs text-shahm-primary hover:text-white transition-colors font-tech uppercase tracking-wider hover:underline font-bold"
           >
             {language === 'ar' ? "+ إضافة إلى جدول الكميات" : "+ Add to BOQ"}
           </button>
        </div>
      </div>
    </NeonCard>
  );
};

// --- 2. Contract Widget (PROFESSIONAL REDESIGN) ---
export const ContractWidget: React.FC<{ data: ContractAnalysisData, language: Language }> = ({ data, language }) => {
  const isHighRisk = data.risk_level === 'HIGH' || data.risk_level === 'CRITICAL';
  
  const getRiskColor = (level: string) => {
    switch(level) {
      case 'LOW': return 'text-emerald-400 border-emerald-400 bg-emerald-400/10';
      case 'MEDIUM': return 'text-yellow-400 border-yellow-400 bg-yellow-400/10';
      case 'HIGH': return 'text-orange-500 border-orange-500 bg-orange-500/10';
      case 'CRITICAL': return 'text-shahm-alert border-shahm-alert bg-shahm-alert/10';
      default: return 'text-slate-400';
    }
  };

  return (
    <NeonCard 
      borderColor={isHighRisk ? "border-shahm-alert" : "border-shahm-secondary"}
      glowColor={isHighRisk ? "shadow-[0_0_20px_rgba(255,0,85,0.2)]" : "shadow-[0_0_20px_rgba(6,182,212,0.15)]"}
      title={language === 'ar' ? "رادار تحليل العقود" : "CONTRACT RISK RADAR"}
      icon={<Gavel className={isHighRisk ? "text-shahm-alert" : "text-shahm-secondary"}/>}
      className="max-w-2xl w-full"
    >
      <div className="p-6">
        {/* Top Section: Score and Status */}
        <div className="flex flex-col md:flex-row gap-6 mb-8 items-center md:items-start">
           
           {/* Risk Gauge */}
           <div className="relative w-32 h-32 shrink-0 flex items-center justify-center">
               <div className={`absolute inset-0 rounded-full border-4 opacity-20 ${getRiskColor(data.risk_level).split(' ')[1]}`}></div>
               <svg className="w-full h-full transform -rotate-90 drop-shadow-lg">
                 <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-black/20" />
                 <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="6" fill="transparent" 
                         strokeDasharray={365} strokeDashoffset={365 - (365 * data.risk_score) / 100} 
                         className={`${isHighRisk ? 'text-shahm-alert' : 'text-shahm-secondary'} transition-all duration-1000`} 
                         strokeLinecap="round"
                 />
               </svg>
               <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-bold font-tech text-white text-glow">{data.risk_score}</span>
                  <span className="text-[10px] uppercase text-slate-500">Risk Score</span>
               </div>
           </div>

           {/* Executive Summary */}
           <div className="flex-1">
              <div className="flex items-center justify-between mb-3">
                 <span className={`px-3 py-1 rounded text-xs font-bold border uppercase tracking-widest ${getRiskColor(data.risk_level)}`}>
                    {data.risk_level} RISK
                 </span>
                 <div className="flex gap-2">
                    <span className="w-2 h-2 rounded-full bg-shahm-alert animate-pulse"></span>
                    <span className="text-[10px] text-slate-500 font-mono">AI_LEGAL_SCAN_COMPLETE</span>
                 </div>
              </div>
              <h4 className="text-sm font-bold text-white mb-2 font-tech uppercase border-b border-white/10 pb-1">
                 {language === 'ar' ? "الملخص التنفيذي" : "Executive Summary"}
              </h4>
              <p className="text-sm text-slate-300 leading-relaxed text-justify bg-white/5 p-3 rounded-lg border-l-2 border-slate-500">
                {data.summary}
              </p>
           </div>
        </div>

        {/* Flagged Clauses Section */}
        <div className="space-y-4">
           <div className="flex items-center gap-2 mb-2">
              <AlertOctagon size={16} className="text-shahm-alert" />
              <h4 className="font-bold text-white text-sm uppercase tracking-wider">
                 {language === 'ar' ? `البنود الخطرة (${data.flagged_clauses.length})` : `Flagged Clauses (${data.flagged_clauses.length})`}
              </h4>
           </div>
           
           {data.flagged_clauses.length === 0 ? (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg flex items-center gap-3 text-emerald-400">
                 <CheckCircle2 size={24} />
                 <span className="font-bold">{language === 'ar' ? "العقد نظيف وسليم قانونياً." : "Contract looks clean and legally sound."}</span>
              </div>
           ) : (
              data.flagged_clauses.map((item, i) => (
                <div key={i} className="group bg-shahm-bg border border-white/10 hover:border-shahm-alert/50 transition-all rounded-xl overflow-hidden relative">
                   <div className={`absolute left-0 top-0 bottom-0 w-1 ${item.severity === 'High' ? 'bg-shahm-alert' : 'bg-yellow-500'}`}></div>
                   <div className="p-4 pl-5">
                      <div className="flex items-start justify-between mb-3">
                         <h5 className="font-bold text-slate-200 text-sm md:text-base pr-4">"{item.clause}"</h5>
                         {item.severity && (
                            <span className={`text-[10px] px-2 py-0.5 rounded border uppercase ${item.severity === 'High' ? 'text-shahm-alert border-shahm-alert/30 bg-shahm-alert/5' : 'text-yellow-500 border-yellow-500/30 bg-yellow-500/5'}`}>
                               {item.severity}
                            </span>
                         )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs md:text-sm">
                         <div className="bg-shahm-alert/5 p-2 rounded border border-shahm-alert/10">
                            <span className="block text-[10px] text-shahm-alert font-bold uppercase mb-1">{language === 'ar' ? "المشكلة:" : "ISSUE:"}</span>
                            <span className="text-slate-300">{item.issue}</span>
                         </div>
                         <div className="bg-shahm-primary/5 p-2 rounded border border-shahm-primary/10">
                            <span className="block text-[10px] text-shahm-primary font-bold uppercase mb-1">{language === 'ar' ? "التوصية:" : "RECOMMENDATION:"}</span>
                            <span className="text-slate-300">{item.recommendation}</span>
                         </div>
                      </div>
                   </div>
                </div>
              ))
           )}
        </div>
      </div>
    </NeonCard>
  );
};

// --- 3. Code Chat Widget ---
export const CodeChatWidget: React.FC<{ data: CodeChatData, language: Language }> = ({ data, language }) => {
  return (
    <NeonCard 
      borderColor="border-amber-400" 
      glowColor="shadow-[0_0_20px_rgba(251,191,36,0.15)]"
      title={language === 'ar' ? "قاعدة المعرفة" : "KNOWLEDGE BASE"}
      icon={<Book className="text-amber-400"/>}
      className="max-w-md"
    >
      <div className="p-5">
        <div className="mb-5">
           <h3 className="font-bold text-white text-xl mb-2">{data.topic}</h3>
           <span className="text-[10px] text-amber-400/80 font-mono tracking-wider border border-amber-400/20 px-2 py-0.5 rounded">RAG SYSTEM ACTIVE</span>
        </div>
        
        <div className="p-4 bg-shahm-bg/50 rounded-xl border border-amber-400/20 mb-5 text-sm text-slate-200 leading-relaxed">
           {data.answer_summary}
        </div>
        
        <div className="space-y-3">
           {data.references.map((ref, i) => (
              <div key={i} className="relative group overflow-hidden bg-black/40 p-3 rounded border-l-4 border-amber-400">
                 <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-bold text-amber-400 uppercase">{ref.code_source}</span>
                    <span className="text-[10px] font-mono text-slate-500">REF: {ref.section_number}</span>
                 </div>
                 <p className="text-xs text-slate-400 italic font-serif">"{ref.text}"</p>
              </div>
           ))}
        </div>

        <div className={`mt-5 py-2 text-center text-xs font-bold font-tech uppercase tracking-widest rounded border ${
          data.compliance_check === 'COMPLIANT' ? 'bg-shahm-primary/10 text-shahm-primary border-shahm-primary/30' :
          data.compliance_check === 'NON_COMPLIANT' ? 'bg-shahm-alert/10 text-shahm-alert border-shahm-alert/30' :
          'bg-yellow-400/10 text-yellow-400 border-yellow-400/30'
        }`}>
          {language === 'ar' ? 'الحالة: ' : 'Status: '} {data.compliance_check}
        </div>
      </div>
    </NeonCard>
  );
};

// --- 4. Writer Widget (Redesigned for Professional Look) ---
export const WriterWidget: React.FC<{ data: WriterData, language: Language, onAction?: (text: string) => void }> = ({ data, language, onAction }) => {
  return (
    <NeonCard 
      borderColor="border-shahm-purple" 
      glowColor="shadow-[0_0_20px_rgba(188,19,254,0.15)]"
      title={language === 'ar' ? "منشئ الوثائق الذكي" : "SMART DOC GENERATOR"}
      icon={<FileText className="text-shahm-purple"/>}
      className="max-w-3xl w-full" // Significantly wider
    >
      {/* Document Header Panel */}
      <div className="bg-shahm-surface border-b border-white/10 p-5 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
         <div className="space-y-2">
            <div className="flex items-center gap-3">
               <span className="text-slate-500 w-16 uppercase text-[10px] tracking-widest">{language === 'ar' ? "إلى:" : "TO:"}</span>
               <span className="text-white bg-white/5 px-2 py-0.5 rounded flex-1">...</span>
            </div>
            <div className="flex items-center gap-3">
               <span className="text-slate-500 w-16 uppercase text-[10px] tracking-widest">{language === 'ar' ? "من:" : "FROM:"}</span>
               <span className="text-shahm-purple font-bold flex-1">Shahm AI System</span>
            </div>
            <div className="flex items-center gap-3">
               <span className="text-slate-500 w-16 uppercase text-[10px] tracking-widest">{language === 'ar' ? "الموضوع:" : "SUBJECT:"}</span>
               <span className="text-white font-bold flex-1 border-b border-white/10 pb-0.5">{data.subject}</span>
            </div>
         </div>
         
         <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
               <Clock size={12} />
               {new Date().toLocaleDateString()}
            </div>
            <div className="flex items-center gap-2">
               <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider ${
                  data.tone === 'Formal' ? 'bg-blue-500/10 text-blue-400' : 'bg-shahm-purple/10 text-shahm-purple'
               }`}>
                  {data.tone} Tone
               </span>
               <span className="text-[10px] bg-white/5 text-slate-300 px-2 py-1 rounded uppercase tracking-wider border border-white/10">
                  {data.type}
               </span>
            </div>
            <div className="flex items-center gap-2 mt-auto">
               <button className="text-slate-500 hover:text-white transition-colors"><Paperclip size={14} /></button>
            </div>
         </div>
      </div>
      
      {/* Document Body - Enhanced for readability and Markdown */}
      <div className="bg-[#0f151f] p-8 md:p-10 min-h-[300px] text-slate-200 leading-relaxed relative group">
         <div className={`prose prose-invert prose-sm md:prose-base max-w-none font-serif ${language === 'ar' ? 'text-right' : 'text-left'}`}>
            <ReactMarkdown>{data.content}</ReactMarkdown>
         </div>
         
         {/* Watermark/Signature */}
         <div className="mt-12 pt-6 border-t border-dashed border-white/10 flex justify-between items-end opacity-50 hover:opacity-100 transition-opacity">
            <div className="text-[10px] font-mono text-slate-500">
               GENERATED_BY_SHAHM_CORE_V2.4<br/>
               ID: {Date.now().toString().slice(-6)}
            </div>
            <div className="font-tech text-shahm-purple/50 text-xl tracking-widest">SHAHM</div>
         </div>
      </div>
      
      {/* Footer Actions */}
      <div className="bg-shahm-surface border-t border-white/10 p-4 flex justify-between items-center">
         <CopyButton text={`${data.subject}\n\n${data.content}`} language={language} />
         
         <button 
           onClick={() => onAction?.(language === 'ar' ? `اعتمد هذا النص: ${data.subject}` : `Approve text: ${data.subject}`)}
           className="flex items-center gap-2 bg-shahm-purple text-white px-6 py-2 rounded-lg hover:bg-fuchsia-500 transition-colors shadow-lg shadow-shahm-purple/20 font-bold text-sm"
         >
            {language === 'ar' ? "إرسال / اعتماد" : "APPROVE & SEND"} <Send size={14} />
         </button>
      </div>
    </NeonCard>
  );
};

// --- 5. Game Widget ---
export const GameWidget: React.FC<{ data: GameData, language: Language, onAction?: (text: string) => void, timestamp?: number, disabled?: boolean }> = ({ data, language, onAction, timestamp, disabled }) => {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isRevealed, setIsRevealed] = useState(false);

  const isHappy = data.shahmawi_mood === 'HAPPY' || data.shahmawi_mood === 'IMPRESSED';
  const isAngry = data.shahmawi_mood === 'ANGRY';
  
  const borderColor = isHappy ? 'border-shahm-primary' : isAngry ? 'border-shahm-alert' : 'border-yellow-400';
  const textColor = isHappy ? 'text-shahm-primary' : isAngry ? 'text-shahm-alert' : 'text-yellow-400';
  const moodIcon = isHappy ? <Smile size={40} className={textColor} /> : isAngry ? <Skull size={40} className={textColor} /> : <Frown size={40} className={textColor} />;

  // Reset state when question changes
  useEffect(() => {
    setSelectedOption(null);
    setIsRevealed(false);
  }, [data.question]);

  // Handle sound effects from AI response (Rank up / Mood)
  useEffect(() => {
    if (timestamp && Date.now() - timestamp < 2000 && !isRevealed) {
      if (data.is_rank_up) {
        playSound('rankup');
      } else if (data.shahmawi_mood === 'HAPPY' || data.shahmawi_mood === 'IMPRESSED') {
        playSound('success');
      } else if (data.shahmawi_mood === 'ANGRY' || data.shahmawi_mood === 'SARCASTIC') {
        playSound('error');
      }
    }
  }, [timestamp, data.is_rank_up, data.shahmawi_mood, isRevealed]);

  const handleOptionClick = (option: string) => {
    if (isRevealed || disabled) return; // Prevent multiple clicks

    setSelectedOption(option);
    setIsRevealed(true);
    playSound('click');

    // Visual Delay logic before sending to AI
    setTimeout(() => {
      onAction?.(option);
    }, 1500);
  };

  const getRankIcon = (rank: string) => {
    switch(rank) {
      case 'Trainee': return <User size={14} />;
      case 'Site Engineer': return <Code size={14} />;
      case 'Project Manager': return <Medal size={14} />;
      case 'CEO': return <Crown size={14} />;
      case 'Legend': return <Trophy size={14} />;
      default: return <User size={14} />;
    }
  };

  return (
    <NeonCard 
      borderColor={borderColor}
      glowColor={isHappy ? 'shadow-shahm-primary/20' : 'shadow-shahm-alert/20'}
      title=""
      className="!p-0 border-2 max-w-md"
    >
      {/* Game Header HUD */}
      <div className="bg-black/40 p-3 border-b border-white/10 flex items-center justify-between">
         <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-full border ${borderColor} bg-shahm-bg`}>
               {getRankIcon(data.current_rank)}
            </div>
            <div>
               <div className="text-[8px] uppercase text-slate-500 font-tech tracking-wider">{language === 'ar' ? "الرتبة الحالية" : "Current Rank"}</div>
               <div className={`font-bold ${textColor} text-xs leading-none`}>{data.current_rank}</div>
            </div>
         </div>

         <div className="flex items-center gap-3">
             {/* Streak */}
             <div className="flex flex-col items-center">
                <div className="flex items-center gap-0.5 text-orange-500 animate-pulse">
                   <Flame size={12} fill="currentColor" />
                   <span className="font-tech font-bold text-base">{data.streak_count}x</span>
                </div>
                <span className="text-[8px] uppercase text-slate-600">Streak</span>
             </div>
             
             {/* Score */}
             <div className="text-right">
                <div className="font-tech font-bold text-lg text-white text-glow">{data.total_score}</div>
                <span className="text-[8px] uppercase text-slate-600 block -mt-1">XP Points</span>
             </div>
         </div>
      </div>

      {/* Shahmawi Feedback Area */}
      <div className="p-4 text-center relative overflow-hidden">
         <div className={`absolute top-0 left-0 w-full h-1 ${isHappy ? 'bg-gradient-to-r from-transparent via-shahm-primary to-transparent' : 'bg-gradient-to-r from-transparent via-shahm-alert to-transparent'}`}></div>
         
         <div className="flex justify-center mb-3">
            <div className={`w-16 h-16 rounded-full border-2 ${borderColor} flex items-center justify-center bg-shahm-bg box-glow shadow-inner`}>
                {moodIcon}
            </div>
         </div>

         <p className={`text-lg font-bold mb-2 ${textColor} font-sans leading-relaxed`}>
           "{data.message}"
         </p>
         
         {data.streak_count > 2 && (
            <div className="inline-block px-2 py-0.5 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-500 text-[10px] font-bold uppercase tracking-widest animate-bounce mt-1">
               {language === 'ar' ? "أداء خرافي!" : "ON FIRE!"}
            </div>
         )}
      </div>

      {/* Question Area */}
      {data.question && (
         <div className="p-4 bg-shahm-bg border-t border-white/10 relative">
             <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-tech text-slate-500 uppercase tracking-widest border border-white/10 px-2 py-1 rounded">
                   {language === 'ar' ? "سؤال التحدي" : "Mission Brief"}
                </span>
                <span className={`text-[10px] font-bold px-2 py-1 rounded ${
                  data.difficulty === 'EXPERT' ? 'bg-red-900 text-red-200' :
                  data.difficulty === 'HARD' ? 'bg-orange-900 text-orange-200' :
                  'bg-green-900 text-green-200'
                }`}>
                   {data.difficulty}
                </span>
             </div>

             <h4 className="text-base font-bold text-white leading-relaxed mb-4 text-right" dir="auto">
                {data.question}
             </h4>
             
             <div className="grid grid-cols-1 gap-2">
                {data.options?.map((opt, i) => {
                   const isSelected = selectedOption === opt;
                   const isCorrect = data.correct_answer === opt;
                   
                   let buttonClass = "bg-shahm-surface border-shahm-border text-slate-200"; // Default
                   
                   if (isRevealed) {
                      if (isCorrect) {
                         buttonClass = "bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)]";
                      } else if (isSelected) {
                         buttonClass = "bg-red-500/20 border-red-500 text-red-400";
                      } else {
                         buttonClass = "bg-shahm-surface/30 border-shahm-border/30 text-slate-600"; // Dimmed
                      }
                   } else if (disabled) {
                      buttonClass = "bg-shahm-surface/50 border-shahm-border/30 text-slate-500 opacity-50 cursor-not-allowed grayscale";
                   } else {
                      buttonClass += " hover:border-shahm-primary/50 hover:bg-shahm-primary/5 hover:text-white";
                   }

                   return (
                     <button 
                        key={i} 
                        onClick={() => handleOptionClick(opt)}
                        disabled={isRevealed || disabled}
                        className={`group relative overflow-hidden w-full text-right p-3 rounded-xl border transition-all active:scale-98 ${buttonClass}`}
                     >
                        <div className="relative flex items-center justify-between">
                           <span className="font-bold text-xs transition-colors">{opt}</span>
                           <span className="font-mono text-[10px] opacity-70">[{String.fromCharCode(65+i)}]</span>
                        </div>
                        {/* Reveal Animation Icon */}
                        {isRevealed && isSelected && (
                           <div className="absolute top-1/2 left-4 -translate-y-1/2">
                              {isCorrect ? <CheckCircle2 size={16} className="text-emerald-500" /> : <AlertTriangle size={16} className="text-red-500" />}
                           </div>
                        )}
                     </button>
                   );
                })}
             </div>
         </div>
      )}
    </NeonCard>
  );
};

// --- 6. Analytics Widget (REDESIGNED for Clarity & Style) ---
// Using Shahm's theme colors instead of random ones
const CHART_COLORS = ['#00ff9d', '#00f3ff', '#bc13fe', '#ff0055', '#fbbf24'];

export const AnalyticsWidget: React.FC<{ data: AnalyticsData, language: Language }> = ({ data, language }) => {
  return (
    <NeonCard
      borderColor="border-shahm-purple"
      glowColor="shadow-[0_0_30px_rgba(188,19,254,0.1)]"
      title="" // Custom header inside
      className="w-full max-w-3xl" // Much wider for better chart visibility
    >
      <div className="p-6 md:p-8">
        
        {/* Header Section */}
        <div className="flex justify-between items-start mb-8 border-b border-white/10 pb-6">
           <div>
              <div className="flex items-center gap-2 mb-2">
                 <div className="px-2 py-0.5 rounded bg-shahm-purple/10 border border-shahm-purple/30 text-[10px] text-shahm-purple font-mono uppercase tracking-widest">
                    Business Intelligence
                 </div>
                 <div className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] text-slate-400 font-mono">
                    {new Date().toLocaleDateString()}
                 </div>
              </div>
              <h3 className="text-2xl md:text-3xl font-bold text-white leading-tight">{data.report_title}</h3>
           </div>
           <div className="hidden md:block p-3 bg-gradient-to-br from-shahm-purple/20 to-transparent rounded-2xl border border-shahm-purple/30 shadow-[0_0_15px_rgba(188,19,254,0.15)]">
              <BarChart2 className="text-shahm-purple" size={32} />
           </div>
        </div>

        {/* KPI Grid - Top Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
           
           {/* KPI 1: Total Value */}
           <div className="relative group overflow-hidden bg-gradient-to-br from-white/5 to-transparent p-5 rounded-2xl border border-white/10 hover:border-shahm-primary/50 transition-colors">
               <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Target size={40} />
               </div>
               <span className="text-xs text-slate-400 uppercase tracking-wider font-bold block mb-1">
                  {language === 'ar' ? "القيمة الإجمالية" : "Total Value"}
               </span>
               <span className="text-2xl font-tech font-bold text-white group-hover:text-shahm-primary transition-colors text-glow">
                  {data.kpis.total_spend_or_value}
               </span>
           </div>

           {/* KPI 2: Efficiency */}
           <div className="relative group overflow-hidden bg-gradient-to-br from-white/5 to-transparent p-5 rounded-2xl border border-white/10 hover:border-shahm-secondary/50 transition-colors">
               <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Activity size={40} />
               </div>
               <span className="text-xs text-slate-400 uppercase tracking-wider font-bold block mb-1">
                  {language === 'ar' ? "كفاءة الأداء" : "Efficiency Rate"}
               </span>
               <div className="flex items-center gap-2">
                  <span className={`text-2xl font-tech font-bold ${data.kpis.efficiency_score > 80 ? 'text-emerald-400' : 'text-yellow-400'}`}>
                     {data.kpis.efficiency_score}%
                  </span>
                  {data.kpis.efficiency_score > 80 ? <ArrowUpRight size={16} className="text-emerald-400" /> : <ArrowDownRight size={16} className="text-yellow-400" />}
               </div>
           </div>

           {/* KPI 3: Alert / Status (Dynamic) */}
           <div className={`relative overflow-hidden p-5 rounded-2xl border transition-colors ${data.kpis.main_alert ? 'bg-gradient-to-br from-shahm-alert/10 to-transparent border-shahm-alert/30' : 'bg-gradient-to-br from-shahm-purple/10 to-transparent border-shahm-purple/30'}`}>
               <div className="absolute top-0 right-0 p-3 opacity-10">
                  {data.kpis.main_alert ? <AlertTriangle size={40} /> : <CheckCircle2 size={40} />}
               </div>
               <span className={`text-xs uppercase tracking-wider font-bold block mb-1 ${data.kpis.main_alert ? 'text-shahm-alert' : 'text-shahm-purple'}`}>
                  {data.kpis.main_alert ? (language === 'ar' ? "تنبيه هام" : "Critical Alert") : (language === 'ar' ? "الحالة" : "System Status")}
               </span>
               <span className="text-sm font-bold text-white leading-tight block mt-1">
                  {data.kpis.main_alert || (language === 'ar' ? "النظام يعمل بكفاءة عالية" : "Operational Optimal")}
               </span>
           </div>
        </div>

        {/* Chart Section - Taller and Cleaner */}
        <div className="bg-black/20 rounded-2xl p-4 border border-white/5 mb-8 h-80 relative">
           <div className="absolute top-4 left-4 z-10">
              <span className="text-[10px] bg-white/5 px-2 py-1 rounded text-slate-400 border border-white/5">
                 DATA_VISUALIZATION_V2
              </span>
           </div>
           <ResponsiveContainer width="100%" height="100%">
              {data.chart_type === 'PIE' ? (
                <PieChart>
                  <Pie
                    data={data.chart_data}
                    cx="50%"
                    cy="50%"
                    innerRadius={60} // Donut chart looks more modern
                    outerRadius={100}
                    paddingAngle={4}
                    dataKey="value"
                    stroke="none"
                  >
                    {data.chart_data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend 
                    verticalAlign="middle" 
                    align="right" 
                    layout="vertical"
                    iconSize={8}
                    wrapperStyle={{ fontSize: '12px', fontFamily: 'monospace' }} 
                  />
                </PieChart>
              ) : (
                <BarChart data={data.chart_data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                   <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                   <XAxis dataKey="name" tick={{fill: '#94a3b8', fontSize: 11}} axisLine={false} tickLine={false} dy={10} />
                   <YAxis tick={{fill: '#94a3b8', fontSize: 11}} axisLine={false} tickLine={false} />
                   <Tooltip content={<CustomTooltip />} cursor={{fill: 'rgba(255,255,255,0.05)'}} />
                   <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                      {data.chart_data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                   </Bar>
                </BarChart>
              )}
           </ResponsiveContainer>
        </div>

        {/* Insights Section - List Style */}
        <div className="bg-shahm-purple/5 border border-shahm-purple/10 rounded-2xl p-6">
           <h4 className="text-sm font-bold text-shahm-purple mb-4 flex items-center gap-2 uppercase tracking-widest">
              <Lightbulb size={16} />
              {language === 'ar' ? "تحليل وتوصيات الذكاء الاصطناعي" : "AI Generated Insights"}
           </h4>
           <div className="space-y-3">
              {data.ai_insights.map((insight, i) => (
                 <div key={i} className="flex items-start gap-3 text-sm text-slate-300 group">
                    <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-shahm-purple/50 group-hover:bg-shahm-purple transition-colors shrink-0"></div>
                    <span className="leading-relaxed">{insight}</span>
                 </div>
              ))}
           </div>
        </div>

      </div>
    </NeonCard>
  );
};