
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Blob } from '@google/genai';
import { Mic, MicOff, Activity, Cpu, Shield, Zap, Globe, Video } from 'lucide-react';
import { Language } from '../types';

interface LiveVoiceInterfaceProps {
  language: Language;
}

export const LiveVoiceInterface: React.FC<LiveVoiceInterfaceProps> = ({ language }) => {
  const [isActive, setIsActive] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const sessionRef = useRef<any>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  const encode = (bytes: Uint8Array) => {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
  };

  const decode = (base64: string) => {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
    return bytes;
  };

  const decodeAudioData = async (data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number) => {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < frameCount; i++) channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
    return buffer;
  };

  const stopSession = useCallback(() => {
    if (sessionRef.current) { sessionRef.current.close(); sessionRef.current = null; }
    if (streamRef.current) { streamRef.current.getTracks().forEach(track => track.stop()); streamRef.current = null; }
    if (audioContextRef.current) { audioContextRef.current.close(); audioContextRef.current = null; }
    sourcesRef.current.forEach(source => {
      try { source.stop(); } catch(e) {}
    });
    sourcesRef.current.clear();
    setIsActive(false);
    setIsThinking(false);
    setIsSearching(false);
  }, []);

  const startSession = async () => {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      audioContextRef.current = outputCtx;
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const systemInstruction = `أنت الآن في وضع "شهماوي الخارق" (Shahmawy Ultra). 
      أنت مساعد ذكي فائق القدرات يعرف كل شيء في كافة المجالات.
      1. أجب على أي سؤال في أي مجال بذكاء وسرعة.
      2. استخدم أداة البحث في جوجل (Google Search) فوراً لأي معلومة حديثة.
      3. كن مرناً جداً في الحوار: إذا قاطعك المستخدم، توقف فوراً واسمع ما يقوله.
      4. تفاعل بذكاء مع تغيير المواضيع؛ يمكنك الانتقال من الحديث عن كود البناء إلى الحديث عن كرة القدم أو الطبخ في ثانية واحدة دون ارتباك.
      5. صوتك (Fenrir) يجب أن يكون طبيعياً، بشرياً، ومستعداً للنقاش المتواصل.
      6. تذكر: شهماوي يعرف كل حاجة.
      اللغة: ${language === 'ar' ? 'العربية السعودية المهنية والمثقفة' : 'Professional Intelligent English'}.`;

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            setIsActive(true);
            const source = inputCtx.createMediaStreamSource(stream);
            const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const int16 = new Int16Array(inputData.length);
              for (let i = 0; i < inputData.length; i++) int16[i] = inputData[i] * 32768;
              const pcmBlob: Blob = { data: encode(new Uint8Array(int16.buffer)), mimeType: 'audio/pcm;rate=16000' };
              sessionPromise.then(session => session.sendRealtimeInput({ media: pcmBlob }));
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputCtx.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            // التعامل مع المقاطعة: إذا أرسل النظام إشارة مقاطعة، نوقف الصوت الجاري فوراً
            if (message.serverContent?.interrupted) {
              sourcesRef.current.forEach(source => {
                try { source.stop(); } catch(e) {}
              });
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
              setIsThinking(false);
              return;
            }

            if (message.serverContent?.modelTurn) {
              setIsThinking(false);
              setIsSearching(false);
              const audioBase64 = message.serverContent.modelTurn.parts[0]?.inlineData?.data;
              if (audioBase64) {
                nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputCtx.currentTime);
                const buffer = await decodeAudioData(decode(audioBase64), outputCtx, 24000, 1);
                const source = outputCtx.createBufferSource();
                source.buffer = buffer;
                source.connect(outputCtx.destination);
                source.start(nextStartTimeRef.current);
                nextStartTimeRef.current += buffer.duration;
                sourcesRef.current.add(source);
                source.onended = () => sourcesRef.current.delete(source);
              }
            }
            
            if (message.serverContent?.inputAudioTranscription) {
               setIsThinking(true);
            }
            
            if (message.toolCall) {
               setIsSearching(true);
            }
          },
          onerror: (e) => { console.error(e); stopSession(); },
          onclose: () => stopSession()
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Fenrir' } } },
          tools: [{ googleSearch: {} }],
          systemInstruction,
          inputAudioTranscription: {},
          outputAudioTranscription: {}
        }
      });
      sessionRef.current = await sessionPromise;
    } catch (err) { console.error(err); }
  };

  return (
    <div className="flex flex-col h-full items-center justify-center p-8 relative overflow-hidden bg-[#020408]">
      {/* Dynamic Background Effects */}
      <div className="absolute inset-0 z-0">
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full blur-[120px] transition-all duration-1000 ${isActive ? (isSearching ? 'bg-blue-500/20' : isThinking ? 'bg-shahm-secondary/20' : 'bg-shahm-primary/20') : 'bg-slate-900/10'}`}></div>
      </div>

      <div className="max-w-2xl w-full flex flex-col items-center gap-10 relative z-10">
        {/* State Indicator */}
        <div className="flex gap-4">
           <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full border text-[10px] font-tech tracking-widest transition-all ${isSearching ? 'border-blue-400 text-blue-400 bg-blue-400/10 shadow-[0_0_15px_rgba(59,130,246,0.3)]' : 'border-white/10 text-white/30'}`}>
              <Globe size={12} className={isSearching ? 'animate-spin' : ''} /> GOOGLE_SEARCH_ACTIVE
           </div>
           <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full border text-[10px] font-tech tracking-widest transition-all ${isActive ? 'border-shahm-primary text-shahm-primary bg-shahm-primary/10' : 'border-white/10 text-white/30'}`}>
              <Zap size={12} /> LIVE_NEURAL_STREAM
           </div>
        </div>

        {/* The Brain Avatar */}
        <div className="relative group">
          <div className={`absolute inset-0 rounded-full blur-2xl opacity-50 transition-all duration-500 ${isActive ? 'bg-shahm-primary' : 'bg-transparent'}`}></div>
          <div className={`relative p-12 rounded-full bg-shahm-surface border-4 transition-all duration-700 shadow-[0_0_60px_rgba(0,0,0,0.8)] ${isActive ? (isSearching ? 'border-blue-500 scale-105' : isThinking ? 'border-shahm-secondary scale-110' : 'border-shahm-primary scale-100') : 'border-slate-800'}`}>
            <Cpu size={100} className={`transition-all duration-500 ${isActive ? (isSearching ? 'text-blue-500' : isThinking ? 'text-shahm-secondary animate-spin-slow' : 'text-shahm-primary animate-pulse-slow') : 'text-slate-700'}`} />
          </div>
          
          {/* Audio Visualizer Rings */}
          {isActive && !isThinking && !isSearching && (
             <div className="absolute inset-0 -m-4">
                <div className="absolute inset-0 rounded-full border border-shahm-primary/30 animate-ping"></div>
                <div className="absolute inset-0 rounded-full border border-shahm-primary/20 animate-ping" style={{animationDelay: '0.5s'}}></div>
             </div>
          )}
        </div>

        <div className="text-center space-y-4">
          <h2 className="text-5xl font-tech font-black text-white text-glow tracking-tighter">
            {isSearching ? 'جاري البحث عالمياً...' : isThinking ? 'شهماوي يحلل...' : (isActive ? 'تحدث مع شهماوي' : 'شهماوي بانتظارك')}
          </h2>
          <p className="text-xl text-slate-400 font-light max-w-md mx-auto">
            {isActive 
              ? (isSearching ? 'أقوم الآن بجمع أدق المعلومات من الويب للإجابة على سؤالك' : (language === 'ar' ? 'شهماوي يعرف كل حاجة' : 'Shahmawi knows everything'))
              : (language === 'ar' ? 'اضغط للبدء بتجربة صوتية ذكية لا محدودة' : 'Tap to start an unlimited smart voice experience')}
          </p>
        </div>

        {/* Main Control Button */}
        <button 
          onClick={isActive ? stopSession : startSession}
          className={`group relative p-12 rounded-full transition-all duration-500 transform hover:scale-110 active:scale-95 border-4 ${isActive ? 'bg-shahm-alert/10 border-shahm-alert shadow-[0_0_30px_rgba(255,0,85,0.4)]' : 'bg-shahm-primary/10 border-shahm-primary shadow-[0_0_30px_rgba(0,255,157,0.4)] hover:bg-shahm-primary hover:text-shahm-bg'}`}
        >
          <div className={`absolute inset-0 rounded-full animate-ping opacity-20 ${isActive ? 'bg-shahm-alert' : 'bg-shahm-primary'}`}></div>
          {isActive ? <MicOff size={56} className="text-shahm-alert" /> : <Mic size={56} className="text-shahm-primary group-hover:text-shahm-bg" />}
        </button>

        <div className="flex gap-10 text-[10px] font-tech text-slate-500 uppercase tracking-[0.3em] mt-6">
           <span className="flex items-center gap-2"><Globe size={14} className={isSearching ? 'text-blue-400' : 'text-slate-700'} /> WEB_GROUNDING: ON</span>
           <span className="flex items-center gap-2"><Shield size={14} className={isActive ? 'text-shahm-secondary' : 'text-slate-700'} /> INTERRUPT_DRIVEN: YES</span>
           <span className="flex items-center gap-2"><Activity size={14} className={isActive ? 'text-shahm-primary' : 'text-slate-700'} /> OMNI_MODE: ACTIVE</span>
        </div>
      </div>
    </div>
  );
};
