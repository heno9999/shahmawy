
import React from 'react';
import ReactMarkdown from 'react-markdown';
import { AlertTriangle, FileText, ExternalLink, Globe, Link as LinkIcon } from 'lucide-react';
import { ChatMessage, Role, Language } from '../types';
import { EstimateWidget, ContractWidget, CodeChatWidget, WriterWidget, GameWidget, AnalyticsWidget } from './Widgets';

interface ChatMessageBubbleProps {
  message: ChatMessage;
  language: Language;
  onAction?: (text: string) => void;
  isGameOver?: boolean;
}

export const ChatMessageBubble: React.FC<ChatMessageBubbleProps> = ({ message, language, onAction, isGameOver }) => {
  const isUser = message.role === Role.USER;
  const time = new Date(message.timestamp).toLocaleTimeString(language === 'ar' ? 'ar-SA' : 'en-US', { hour: '2-digit', minute: '2-digit' });

  const renderContent = () => {
    if (message.data && !message.isError) {
      switch (message.dataType) {
        case 'estimate': return <EstimateWidget data={message.data as any} language={language} onAction={onAction} />;
        case 'contract': return <ContractWidget data={message.data as any} language={language} />;
        case 'code_chat': return <CodeChatWidget data={message.data as any} language={language} />;
        case 'writer': return <WriterWidget data={message.data as any} language={language} onAction={onAction} />;
        case 'game': return <GameWidget data={message.data as any} language={language} onAction={onAction} timestamp={message.timestamp} disabled={isGameOver} />;
        case 'analytics': return <AnalyticsWidget data={message.data as any} language={language} />;
        default: return <pre className="text-sm text-red-400">{JSON.stringify(message.data, null, 2)}</pre>;
      }
    }
    
    return message.isError ? (
      <div className="flex flex-col gap-3 p-5 glass-panel border-shahm-alert border-2 rounded-xl bg-shahm-alert/5">
        <div className="flex items-center gap-3 text-shahm-alert font-bold text-lg font-tech">
          <AlertTriangle size={20} />
          <span>SYSTEM_ERROR: {language === 'ar' ? 'حدث خطأ في معالجة البيانات' : 'DATA_PROCESSING_ERROR'}</span>
        </div>
        <p className="text-sm text-slate-400 font-sans">{message.text}</p>
        <button onClick={() => window.location.reload()} className="mt-2 text-xs text-white bg-shahm-alert px-3 py-1.5 rounded uppercase font-tech w-fit hover:bg-white hover:text-shahm-alert transition-all">
          Reload Core
        </button>
      </div>
    ) : (
      <div className="space-y-6">
        <div className={`prose prose-invert prose-lg prose-p:leading-relaxed prose-pre:bg-black/50 prose-pre:border prose-pre:border-slate-800 font-sans ${language === 'ar' ? 'text-right' : 'text-left'}`} dir={language === 'ar' ? 'rtl' : 'ltr'}>
          <ReactMarkdown>{message.text || ''}</ReactMarkdown>
        </div>
        
        {/* Render Grounding Metadata URLs - Tech Verify UI */}
        {message.groundingMetadata?.groundingChunks && message.groundingMetadata.groundingChunks.length > 0 && (
          <div className="mt-6 pt-6 border-t border-white/10 animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-center gap-3 text-xs font-tech text-shahm-secondary uppercase tracking-[0.2em] mb-4">
              <Globe size={14} className="text-shahm-secondary" />
              <span>{language === 'ar' ? 'التحقق الرقمي والمصادر' : 'Digital Verification & Sources'}</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {message.groundingMetadata.groundingChunks.map((chunk, idx) => (
                chunk.web && (
                  <a 
                    key={idx} 
                    href={chunk.web.uri} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="group relative flex items-center gap-4 p-4 glass-panel rounded-xl border border-white/5 hover:border-shahm-secondary/50 hover:bg-shahm-secondary/5 transition-all duration-300"
                  >
                    <div className="w-10 h-10 rounded-lg bg-shahm-bg border border-white/10 flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:border-shahm-secondary/30 transition-all">
                       <LinkIcon size={18} className="text-slate-500 group-hover:text-shahm-secondary transition-colors" />
                    </div>
                    
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="text-sm font-bold text-white truncate leading-tight mb-1 group-hover:text-shahm-secondary transition-colors">
                        {chunk.web.title}
                      </span>
                      <div className="flex items-center gap-2">
                         <span className="text-[10px] text-slate-500 font-mono truncate max-w-[180px]">
                            {new URL(chunk.web.uri).hostname}
                         </span>
                         <ExternalLink size={10} className="text-slate-600 group-hover:text-shahm-secondary" />
                      </div>
                    </div>
                    
                    <div className="tech-corner tr opacity-0 group-hover:opacity-50 !w-2 !h-2 border-shahm-secondary"></div>
                  </a>
                )
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`flex w-full mb-10 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex flex-col max-w-[95%] md:max-w-[85%] ${isUser ? 'items-end' : 'items-start'}`}>
        <div className="flex items-center gap-2 mb-3 text-xs uppercase tracking-widest text-slate-500 font-tech">
          <span>{isUser ? (language === 'ar' ? 'المشغل' : 'OPERATOR') : 'SHAHM_CORE'}</span>
          <span className="text-slate-700">|</span>
          <span>{time}</span>
        </div>
        {isUser ? (
          <div className="bg-shahm-surface/80 border border-shahm-secondary/30 text-shahm-secondary p-5 rounded-xl rounded-tr-none relative backdrop-blur-sm shadow-lg">
             <div className="absolute w-3 h-3 border-t border-r border-shahm-secondary -top-[1px] -right-[1px]"></div>
             {message.image && (
               <div className="mb-3 rounded-lg overflow-hidden border border-shahm-secondary/20">
                 <img src={message.image} alt="Upload" className="h-24 w-auto object-cover" />
               </div>
             )}
             <p className="text-lg font-sans leading-relaxed">{message.text}</p>
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 w-full">
             {message.image && (
                <div className="mb-6 rounded-2xl overflow-hidden border border-shahm-primary/30 shadow-[0_0_30px_rgba(0,255,157,0.1)] group relative">
                  <img src={message.image} alt="AI Generated" className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-105" />
                </div>
             )}
             {renderContent()}
          </div>
        )}
      </div>
    </div>
  );
};
