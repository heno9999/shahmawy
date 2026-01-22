
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { ChatMessage, AppMode, Role, Language, GroundingMetadata } from "../types";

// --- Schemas ---

const estimateSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    item_name: { type: Type.STRING },
    sbc_code: { type: Type.STRING },
    unit: { type: Type.STRING },
    price_range: {
      type: Type.OBJECT,
      properties: {
        min: { type: Type.NUMBER },
        max: { type: Type.NUMBER },
        currency: { type: Type.STRING }
      }
    },
    specs: { type: Type.ARRAY, items: { type: Type.STRING } },
    hazards: { type: Type.ARRAY, items: { type: Type.STRING } },
  },
  required: ["item_name", "price_range", "specs"]
};

const contractSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    risk_score: { type: Type.NUMBER },
    risk_level: { type: Type.STRING, enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] },
    summary: { type: Type.STRING },
    flagged_clauses: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          clause: { type: Type.STRING },
          issue: { type: Type.STRING },
          recommendation: { type: Type.STRING },
          severity: { type: Type.STRING, enum: ['High', 'Medium', 'Low'] }
        }
      }
    }
  },
  required: ["risk_score", "risk_level", "flagged_clauses", "summary"]
};

const codeChatSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    topic: { type: Type.STRING },
    answer_summary: { type: Type.STRING },
    references: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          code_source: { type: Type.STRING, enum: ['SBC', 'MOSTADAM', 'GENERAL'] },
          section_number: { type: Type.STRING },
          text: { type: Type.STRING }
        }
      }
    },
    compliance_check: { type: Type.STRING, enum: ['COMPLIANT', 'NON_COMPLIANT', 'NEEDS_REVIEW'] }
  },
  required: ["topic", "answer_summary", "references"]
};

const writerSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    type: { type: Type.STRING, enum: ['Email', 'Letter', 'Request', 'Memo'] },
    subject: { type: Type.STRING },
    content: { type: Type.STRING },
    tone: { type: Type.STRING },
    key_points: { type: Type.ARRAY, items: { type: Type.STRING } }
  },
  required: ["subject", "content", "type"]
};

const gameSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    shahmawi_mood: { type: Type.STRING, enum: ['HAPPY', 'ANGRY', 'SARCASTIC', 'IMPRESSED'] },
    message: { type: Type.STRING },
    current_rank: { type: Type.STRING, enum: ['Trainee', 'Site Engineer', 'Project Manager', 'CEO', 'Legend'] },
    total_score: { type: Type.NUMBER },
    streak_count: { type: Type.NUMBER },
    question: { type: Type.STRING },
    difficulty: { type: Type.STRING, enum: ['EASY', 'MEDIUM', 'HARD', 'EXPERT'] },
    options: { type: Type.ARRAY, items: { type: Type.STRING } },
    correct_answer: { type: Type.STRING },
    is_rank_up: { type: Type.BOOLEAN }
  },
  required: ["message", "shahmawi_mood", "current_rank", "total_score", "streak_count", "difficulty"]
};

export const sendMessageToGemini = async (
  history: ChatMessage[],
  newMessage: string,
  mode: AppMode,
  language: Language,
  image?: string,
  hiddenContext?: string
): Promise<{ text: string; data?: any; dataType?: string; generatedImage?: string; isError?: boolean; groundingMetadata?: GroundingMetadata }> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    // استخدام gemini-3-flash-preview لجميع الأنماط لضمان أقصى سرعة استجابة
    let modelName = 'gemini-3-flash-preview'; 
    let systemInstruction = '';
    let responseSchema: Schema | undefined;
    let dataType = '';
    let responseMimeType: string | undefined = "application/json";
    let tools: any[] | undefined = undefined;

    const now = new Date();
    const currentDateTimeStr = now.toLocaleString('ar-SA', { 
      timeZone: 'Asia/Riyadh',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      weekday: 'long'
    });

    const langInstruction = language === 'ar' ? 'Answer strictly in Arabic.' : 'Answer strictly in English.';

    switch (mode) {
      case AppMode.GLOBAL_SEARCH:
        tools = [{ googleSearch: {} }];
        responseMimeType = undefined;
        systemInstruction = `You are the Shahmawy Central Global Assistant. 
        CRITICAL TEMPORAL CONTEXT: Today is ${currentDateTimeStr}.
        Use Google Search to provide up-to-date and accurate information. 
        Current location: Saudi Arabia. ${langInstruction}`;
        break;
      case AppMode.ESTIMATION:
        dataType = 'estimate';
        responseSchema = estimateSchema;
        tools = [{ googleSearch: {} }]; 
        systemInstruction = `You are a Pricing Expert AI for Shahm Contracting. Provide accurate cost estimates in SAR. 
        Use Google Search to verify current market prices in Saudi Arabia and relevant Saudi Building Code (SBC) cost references. ${langInstruction}`;
        break;
      case AppMode.CONTRACTS:
        dataType = 'contract'; 
        responseSchema = contractSchema;
        systemInstruction = `You are a Senior Construction Legal Consultant for Shahm Contracting. Analyze contracts and identify risks based on Saudi law and international FIDIC standards.
        ALWAYS return valid JSON according to the schema. ${langInstruction}`;
        break;
      case AppMode.CODE_CHAT:
        dataType = 'code_chat';
        responseSchema = codeChatSchema;
        tools = [{ googleSearch: {} }]; 
        systemInstruction = `You are an Expert Consultant in the Saudi Building Code (SBC) and 'Mostadam'. 
        Use Google Search to find the latest updates, circulars, and specific requirements from official Saudi authorities (MOMRAH, SBCNC). 
        Be extremely precise with section numbers. ${langInstruction}`;
        break;
      case AppMode.WRITER:
        dataType = 'writer';
        responseSchema = writerSchema;
        systemInstruction = `You are a Senior Corporate Communications Director at Shahm Contracting. Write professional business documents. ${langInstruction}`;
        break;
      case AppMode.GAME:
        dataType = 'game';
        responseSchema = gameSchema;
        systemInstruction = `You are 'Shahmawi' (شهماوي), a legendary Site Manager. Run a High-Stakes Quiz. ${langInstruction}`;
        break;
      case AppMode.LIVE_VOICE:
        return { text: "Live Voice Mode Active" };
    }

    const contents: any[] = history.map(msg => {
      const parts: any[] = [];
      if (msg.role === Role.USER && msg.image) {
        const matches = msg.image.match(/^data:(.+);base64,(.+)$/);
        if (matches) parts.push({ inlineData: { mimeType: matches[1], data: matches[2] } });
      }
      if (msg.text) parts.push({ text: msg.text });
      return { role: msg.role === Role.USER ? 'user' : 'model', parts };
    });

    const currentParts: any[] = [];
    if (image) {
      const matches = image.match(/^data:(.+);base64,(.+)$/);
      if (matches) currentParts.push({ inlineData: { mimeType: matches[1], data: matches[2] } });
    }
    currentParts.push({ text: hiddenContext ? `${newMessage}\n\nDATA CONTEXT:\n${hiddenContext}` : newMessage });
    contents.push({ role: 'user', parts: currentParts });

    const config: any = {
      systemInstruction,
      temperature: mode === AppMode.GAME ? 1.0 : 0.1,
      tools,
      responseMimeType,
      responseSchema,
      // تعطيل التفكير العميق لزيادة السرعة في المهام العادية
      thinkingConfig: { thinkingBudget: 0 }
    };

    const response = await ai.models.generateContent({
      model: modelName,
      contents,
      config
    });

    let generatedText = response.text || "";
    let groundingMetadata: GroundingMetadata | undefined = response.candidates?.[0]?.groundingMetadata;

    if (responseMimeType === "application/json") {
      try {
        let jsonString = generatedText.trim();
        const firstBrace = jsonString.indexOf('{');
        const lastBrace = jsonString.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1) {
          jsonString = jsonString.substring(firstBrace, lastBrace + 1);
        }
        const parsedData = JSON.parse(jsonString);
        return { text: generatedText, data: parsedData, dataType, groundingMetadata };
      } catch (e) {
        return { text: generatedText, isError: true, groundingMetadata };
      }
    }

    return { text: generatedText, groundingMetadata };

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    return { text: language === 'ar' ? "عذراً، حدث خطأ في النظام. يرجى المحاولة مرة أخرى." : "System Error. Please try again.", isError: true };
  }
};
