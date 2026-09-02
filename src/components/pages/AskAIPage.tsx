import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../../types';
import { aiService } from '../../services/AIService';
import { optimizeImageForAI } from '../../lib/imageOptimizer';
import { 
  MessageSquare, 
  Send, 
  Image as ImageIcon, 
  Sparkles, 
  Bot, 
  User, 
  Database, 
  Info, 
  X, 
  RefreshCw,
  HelpCircle,
  ShieldAlert,
  ChevronRight,
  Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AskAIPageProps {
  isDemoMode: boolean;
}

export const AskAIPage: React.FC<AskAIPageProps> = ({ isDemoMode }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      sender: 'ai',
      text: 'Hi! 👋 How can I help you sort better today? You can ask me any waste disposal question or upload a photo of an item you want to identify.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      ragSources: ['EcoSort Global Segregation Guidelines'],
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showRagDrawer, setShowRagDrawer] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const quickQuestions = [
    'Where should I dispose of a battery?',
    'What about a broken mobile charger?',
    'Is banana peel recyclable?',
    'What should I do with a pizza box?',
    'Where should I dispose of an old phone?',
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isSending]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || inputText;
    if (!query.trim() && !selectedImage) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      imageAttachment: selectedImage || undefined,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    const currentImg = selectedImage;
    setSelectedImage(null);
    setIsSending(true);

    try {
      const response = await aiService.sendChatMessage(
        query,
        currentImg || undefined,
        'image/jpeg'
      );

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: response.answer,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        ragSources: response.ragSources,
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      const errorMsg: ChatMessage = {
        id: `ai-err-${Date.now()}`,
        sender: 'ai',
        text: '⚠️ EcoSort AI encountered a temporary network issue. Please ensure items are clean and dry, and check municipal drop-off centers.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsSending(false);
    }
  };

  const handleImageAttach = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const optimized = await optimizeImageForAI(file, 1024, 0.85);
        setSelectedImage(optimized.dataUrl);
      } catch (err) {
        const reader = new FileReader();
        reader.onload = () => {
          setSelectedImage(reader.result as string);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header & RAG Architecture Pill */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">🌿</span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-['Space_Grotesk',sans-serif]">
              Ask EcoSort AI
            </h1>
          </div>
          <p className="text-slate-500 text-sm">
            Your personal waste-sorting and circular economy assistant.
          </p>
        </div>

        {/* RAG Architecture Drawer Trigger */}
        <button
          id="btn-toggle-rag-info"
          onClick={() => setShowRagDrawer(!showRagDrawer)}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 transition-colors"
        >
          <Layers className="w-3.5 h-3.5 text-emerald-600" />
          <span>RAG Pipeline</span>
          <ChevronRight
            className={`w-3.5 h-3.5 transition-transform ${showRagDrawer ? 'rotate-90' : ''}`}
          />
        </button>
      </div>

      {/* RAG ARCHITECTURE EXPLAINER PANEL (When toggled) */}
      <AnimatePresence>
        {showRagDrawer && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-800 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-emerald-400 flex items-center gap-1.5 uppercase tracking-wider">
                  <Database className="w-3.5 h-3.5" />
                  RAG Architecture & Knowledge Pipeline
                </span>
                <span className="text-slate-400">Context Grounded AI</span>
              </div>

              {/* Step diagram */}
              <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-center py-2">
                <div className="p-2 rounded-lg bg-white/5 border border-white/10">
                  <div className="font-bold text-slate-200">1. Question</div>
                  <div className="text-[10px] text-slate-400">User Input</div>
                </div>
                <div className="p-2 rounded-lg bg-white/5 border border-white/10">
                  <div className="font-bold text-slate-200">2. Query</div>
                  <div className="text-[10px] text-slate-400">Processing</div>
                </div>
                <div className="p-2 rounded-lg bg-emerald-950/80 border border-emerald-500/40 text-emerald-200">
                  <div className="font-bold">3. Knowledge</div>
                  <div className="text-[10px]">Vector / Docs</div>
                </div>
                <div className="p-2 rounded-lg bg-white/5 border border-white/10">
                  <div className="font-bold text-slate-200">4. Retrieve</div>
                  <div className="text-[10px] text-slate-400">Relevant Context</div>
                </div>
                <div className="p-2 rounded-lg bg-emerald-950/80 border border-emerald-500/40 text-emerald-200">
                  <div className="font-bold">5. Model</div>
                  <div className="text-[10px]">Gemini 3.7 Flash</div>
                </div>
                <div className="p-2 rounded-lg bg-white/5 border border-white/10">
                  <div className="font-bold text-slate-200">6. Answer</div>
                  <div className="text-[10px] text-slate-400">Transparent Result</div>
                </div>
              </div>

              <div className="text-slate-400 flex items-center gap-2 pt-1 border-t border-white/10 text-[11px]">
                <Info className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>
                  Grounds answers in verified municipal guidelines, resin standards, and hazardous precautions.
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick Question Buttons */}
      <div className="space-y-1.5">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
          <HelpCircle className="w-3.5 h-3.5 text-emerald-600" />
          Common Sorting Inquiries
        </span>
        <div className="flex flex-wrap gap-2">
          {quickQuestions.map((q, idx) => (
            <button
              key={idx}
              id={`quick-question-${idx}`}
              onClick={() => handleSendMessage(q)}
              className="px-3 py-1.5 rounded-xl bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-900 text-xs font-medium border border-slate-200 hover:border-emerald-300 shadow-xs transition-all active:scale-95"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Messages Container */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-4 sm:p-6 min-h-[420px] max-h-[560px] overflow-y-auto flex flex-col space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-3 ${
              msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'
            }`}
          >
            {/* Avatar */}
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-sm shadow-xs ${
                msg.sender === 'user'
                  ? 'bg-slate-900 text-white'
                  : 'bg-gradient-to-br from-emerald-600 to-emerald-800 text-white'
              }`}
            >
              {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>

            {/* Message Bubble */}
            <div
              className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 text-sm leading-relaxed space-y-2 ${
                msg.sender === 'user'
                  ? 'bg-slate-900 text-white rounded-tr-xs shadow-xs'
                  : 'bg-slate-50 border border-slate-200/70 text-slate-800 rounded-tl-xs shadow-xs'
              }`}
            >
              {/* Image attachment if user uploaded */}
              {msg.imageAttachment && (
                <div className="mb-2 rounded-xl overflow-hidden border border-white/20 max-w-[200px]">
                  <img
                    src={msg.imageAttachment}
                    alt="Attached waste preview"
                    className="w-full h-auto object-cover"
                  />
                </div>
              )}

              {/* Message text formatted */}
              <div className="whitespace-pre-wrap">{msg.text}</div>

              {/* RAG sources pill if present */}
              {msg.ragSources && msg.ragSources.length > 0 && (
                <div className="pt-2 border-t border-slate-200/60 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500">
                  <span className="font-semibold text-emerald-700">Source:</span>
                  {msg.ragSources.map((source, sIdx) => (
                    <span
                      key={sIdx}
                      className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200/60 font-medium"
                    >
                      {source}
                    </span>
                  ))}
                </div>
              )}

              <div
                className={`text-[10px] text-right font-medium ${
                  msg.sender === 'user' ? 'text-slate-400' : 'text-slate-400'
                }`}
              >
                {msg.timestamp}
              </div>
            </div>
          </div>
        ))}

        {/* Thinking Indicator */}
        {isSending && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-700 text-white flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs text-slate-500 flex items-center gap-2">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-600" />
              <span>EcoSort AI is consulting knowledge base...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Image Preview attachment box before sending */}
      {selectedImage && (
        <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src={selectedImage}
              alt="Ready to analyze"
              className="w-12 h-12 rounded-xl object-cover border border-emerald-300"
            />
            <span className="text-xs font-semibold text-emerald-900">
              Image attached for multimodal analysis
            </span>
          </div>
          <button
            onClick={() => setSelectedImage(null)}
            className="p-1 rounded-full text-slate-400 hover:text-slate-600 bg-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Input Box with Attachment Support */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="relative flex items-center gap-2 bg-white p-2 rounded-2xl border border-slate-300 shadow-xs focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-100 transition-all"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageAttach}
          className="hidden"
          id="chat-image-input"
        />

        <button
          type="button"
          id="btn-attach-image"
          onClick={() => fileInputRef.current?.click()}
          className="p-2.5 rounded-xl text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 transition-colors shrink-0"
          title="Attach waste photo"
        >
          <ImageIcon className="w-5 h-5" />
        </button>

        <input
          type="text"
          id="chat-text-input"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Ask about any waste or material (e.g., polystyrene, styrofoam, paint cans)..."
          className="flex-1 bg-transparent text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none px-2 py-1.5"
        />

        <button
          type="submit"
          id="btn-send-chat"
          disabled={(!inputText.trim() && !selectedImage) || isSending}
          className="p-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-200 disabled:text-slate-400 text-white shadow-xs transition-all shrink-0 active:scale-95"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
