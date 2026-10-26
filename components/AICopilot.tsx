import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, Send, Wrench } from 'lucide-react';
import { useAction } from 'convex/react';
import { api } from '../convex/_generated/api';
import { useNavigation } from '../context/NavigationContext';
import { ChatMarkdown } from './ChatMarkdown';

export const AICopilot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<{role: 'user' | 'ai', text: string}[]>([
    { role: 'ai', text: "Hey there! I'm your Restoration Copilot. Stuck on a build? Tell me what you're working on." }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(() => {
    const existing = sessionStorage.getItem('crankover_ai_session');
    const id = existing || crypto.randomUUID();
    sessionStorage.setItem('crankover_ai_session', id);
    return id;
  });

  const askAi = useAction(api.ai.askCopilot);
  const { setSearchQuery, navigateTo } = useNavigation();

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isLoading) return;

    const userText = query;
    setMessages(prev => [...prev, { role: 'user', text: userText }]);
    setQuery('');
    setIsLoading(true);

    try {
      const response = await askAi({ message: userText, sessionId, history: messages.slice(1).slice(-6) });
      setMessages(prev => [...prev, { role: 'ai', text: response.text }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'ai', text: "The assistant couldn't connect. Please try again shortly." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="bg-white w-[350px] shadow-2xl rounded-2xl border border-gray-100 overflow-hidden mb-4 flex flex-col"
          >
            <div className="bg-brand-dark p-4 text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-brand-red rounded-lg flex items-center justify-center">
                  <Wrench size={16} />
                </div>
                <div>
                  <h3 className="font-black uppercase text-sm tracking-widest">Build Copilot</h3>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-4 h-[300px] overflow-y-auto flex flex-col gap-4 bg-gray-50">
              {messages.map((m, i) => (
                <div key={i} className={`max-w-[85%] p-3 rounded-xl text-sm ${m.role === 'ai' ? 'bg-white border border-gray-100 text-gray-700 self-start' : 'bg-brand-red text-white self-end'}`}>
                  {m.role === 'ai' ? <ChatMarkdown text={m.text} onSearch={term => { setSearchQuery(term); navigateTo('shop'); setIsOpen(false); }} /> : m.text}
                </div>
              ))}
              {isLoading && (
                <div className="bg-white border border-gray-100 text-gray-400 p-3 rounded-xl text-sm self-start flex gap-1">
                  <span className="animate-bounce">.</span><span className="animate-bounce delay-100">.</span><span className="animate-bounce delay-200">.</span>
                </div>
              )}
            </div>

            <form onSubmit={handleSend} className="p-3 bg-white border-t border-gray-100 flex gap-2">
              <input
                type="text"
                maxLength={2000}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask about a build..."
                className="flex-1 bg-gray-50 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-red"
              />
              <button
                type="submit"
                disabled={isLoading || !query.trim()}
                className="bg-brand-dark text-white p-2 rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-colors"
              >
                <Send size={18} />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {!isOpen && (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen(true)}
          className="bg-brand-red text-white p-4 rounded-full shadow-2xl flex items-center gap-2 group hover:bg-red-700 transition-colors"
        >
          <Sparkles size={24} className="group-hover:animate-pulse" />
          <span className="font-black uppercase text-xs tracking-widest hidden md:block pr-2">Ask AI Expert</span>
        </motion.button>
      )}
    </div>
  );
};
