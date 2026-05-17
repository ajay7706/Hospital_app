import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  Mic, 
  MicOff, 
  Send, 
  Bot, 
  User, 
  Sparkles, 
  Calendar, 
  Activity, 
  Heart, 
  AlertTriangle, 
  HelpCircle,
  Stethoscope,
  Volume2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/layout/Navbar";
import { SEO } from "@/components/SEO";

// Define Message interface
interface Message {
  id: string;
  sender: "user" | "ai";
  text: string;
  timestamp: Date;
}

const ClinozaAI: React.FC = () => {
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // State variables
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speechLanguage, setSpeechLanguage] = useState<"hi-IN" | "en-US">("hi-IN");
  const [sessionId] = useState(() => `sess_${Math.random().toString(36).substr(2, 9)}`);
  const [recognition, setRecognition] = useState<any>(null);
  const [userInitial, setUserInitial] = useState("U");

  // Fetch logged in user details for avatar initial
  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        const name = parsed.name || parsed.email || "U";
        setUserInitial(name.charAt(0).toUpperCase());
      } catch (e) {
        setUserInitial("U");
      }
    }
  }, []);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      
      rec.onstart = () => {
        setIsListening(true);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      rec.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);
      };

      rec.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setInputText((prev) => {
            const separator = prev.trim() ? " " : "";
            return prev + separator + transcript;
          });
        }
      };

      setRecognition(rec);
    }
  }, []);

  // Set recognition language when selection changes
  useEffect(() => {
    if (recognition) {
      recognition.lang = speechLanguage;
    }
  }, [speechLanguage, recognition]);

  // Send default welcome message on mount
  useEffect(() => {
    const welcomeMsg: Message = {
      id: "welcome",
      sender: "ai",
      text: `Namaste 👋
Main Clinoza AI hoon, aapka dedicated aur supportive healthcare assistant. Main aapki health problem Hindi, Hinglish ya English me aasan shabdo me samajhne me help kar sakta hoon!

Aap apni health pareshani (symptoms) niche box me type karke ya voice microphone 🎙️ button daba kar bata sakte hain. 

Main aapko:
• **Doctor Suggestions**: Symptoms ke basis par kaun se specialist se milein.
• **Basic Healthcare Guidance**: Primary self-care tips aur aasan parhez.
• **Hospital Recommendations**: Aapki details ke mutabik suggestions.

Kripya apna symptom niche share karein!`,
      timestamp: new Date()
    };
    
    // Check if we have saved history in local storage or start fresh
    const stored = localStorage.getItem(`clinoza_ai_history_${sessionId}`);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.length > 0) {
          const loaded = parsed.map((m: any) => ({
            ...m,
            timestamp: new Date(m.timestamp)
          }));
          setMessages(loaded);
          return;
        }
      } catch (e) {
        console.error("Error loading chat history from localstorage:", e);
      }
    }
    
    setMessages([welcomeMsg]);
  }, []);

  // Save history to LocalStorage
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(`clinoza_ai_history_${sessionId}`, JSON.stringify(messages));
    }
  }, [messages, sessionId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Handle Voice Input Toggle
  const toggleListening = () => {
    if (!recognition) {
      alert("Voice input is not supported in this browser. Please try Chrome or Safari.");
      return;
    }

    if (isListening) {
      recognition.stop();
    } else {
      try {
        recognition.start();
      } catch (err) {
        console.error("Speech recognition start failed:", err);
      }
    }
  };

  // Quick Suggestion handler
  const handleSuggestionClick = (suggestion: string) => {
    let messageText = suggestion;
    if (suggestion === "Book Appointment") {
      messageText = "I want to book an appointment / Mujhe appointment book karna hai";
    } else if (suggestion === "Fever") {
      messageText = "Mujhe bukhar hai / I have a fever";
    } else if (suggestion === "Headache") {
      messageText = "Mera sir dard kar raha hai / I have a headache";
    } else if (suggestion === "Skin Problem") {
      messageText = "Skin allergy / Skin problem doctor consultation";
    } else if (suggestion === "Heart Problem") {
      messageText = "Heart patient consultation / Chest pain checkup";
    }
    
    sendMessage(messageText);
  };

  // Dynamic API Base URL Selector
  const getApiBase = () => {
    if (
      window.location.hostname === "localhost" || 
      window.location.hostname === "127.0.0.1" || 
      window.location.hostname.includes("192.168.")
    ) {
      return "http://localhost:5000";
    }
    return import.meta.env.VITE_API_BASE || "http://localhost:5000";
  };

  const BASE_URL = getApiBase();

  // Send message
  const sendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text) return;

    if (!textToSend) {
      setInputText("");
    }

    // Add user message to state
    const userMsg: Message = {
      id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      sender: "user",
      text,
      timestamp: new Date()
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    try {
      const recentHistory = messages.slice(-6).map(m => ({
        sender: m.sender,
        text: m.text
      }));

      const response = await fetch(`${BASE_URL}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: text,
          sessionId,
          history: recentHistory
        })
      });

      const data = await response.json();
      
      if (data.success && data.reply) {
        const aiMsg: Message = {
          id: `ai_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          sender: "ai",
          text: data.reply,
          timestamp: new Date()
        };
        setMessages((prev) => [...prev, aiMsg]);
      } else {
        throw new Error(data.msg || "Invalid API response");
      }
    } catch (error) {
      console.error("AI Chat Error:", error);
      const errorMsg: Message = {
        id: `ai_err_${Date.now()}`,
        sender: "ai",
        text: "Apologies, main abhi response generate nahi kar pa raha hoon. Kripya thodi der baad dobara koshish karein ya seedhe aasan shabdo me apni samasya batayein.",
        timestamp: new Date()
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      sendMessage();
    }
  };

  // Inline bold text formatter (**bold**)
  const parseInlineMarkdown = (text: string) => {
    if (!text.includes("**")) return text;
    const parts = text.split("**");
    return parts.map((part, idx) => 
      idx % 2 === 1 ? (
        <strong key={idx} className="font-extrabold text-slate-900 dark:text-white">{part}</strong>
      ) : (
        part
      )
    );
  };

  // Custom high-performance ChatGPT style markdown renderer
  const renderMessageContent = (text: string) => {
    const lines = text.split("\n");
    return lines.map((line, index) => {
      // 1. Emergency Alert Panels (🚨)
      if (line.includes("🚨") || line.includes("EMERGENCY")) {
        return (
          <div key={index} className="bg-red-50/80 dark:bg-red-950/20 border border-red-200/80 dark:border-red-900/50 p-4 rounded-xl my-4 shadow-sm flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5 animate-pulse" />
            <div className="flex-1 text-red-800 dark:text-red-300 font-semibold text-sm sm:text-base leading-relaxed">
              {line.replace(/🚨/g, "").replace(/\*\*/g, "").trim()}
            </div>
          </div>
        );
      }

      // 2. Main Headings (### or ## or #)
      if (line.startsWith("###") || line.startsWith("##") || line.startsWith("#")) {
        const title = line.replace(/^[#\s]+/, "").replace(/\*\*/g, "").trim();
        return (
          <h2 key={index} className="text-base sm:text-lg font-black text-primary dark:text-blue-400 mt-5 mb-2 first:mt-0 leading-tight">
            {title}
          </h2>
        );
      }

      // Treat bold titles (like "**Basic Healthcare Guidance:**") as subheaders
      if (line.trim().startsWith("**") && (line.trim().endsWith(":") || line.trim().endsWith("**"))) {
        const title = line.replace(/\*\*/g, "").replace(/:$/, "").trim();
        return (
          <h2 key={index} className="text-base sm:text-lg font-black text-primary dark:text-blue-400 mt-5 mb-2 first:mt-0 leading-tight">
            {title}:
          </h2>
        );
      }

      // 3. Bullet points (• or - or *)
      if (line.trim().startsWith("•") || line.trim().startsWith("-") || line.trim().startsWith("*")) {
        const cleanLine = line.trim().substring(1).trim();
        return (
          <li key={index} className="ml-5 list-disc text-sm sm:text-base text-slate-600 dark:text-slate-300 my-1.5 pl-1 leading-relaxed">
            {parseInlineMarkdown(cleanLine)}
          </li>
        );
      }

      // 4. Normal paragraph spacing
      if (line.trim() === "") {
        return <div key={index} className="h-2" />;
      }

      return (
        <p key={index} className="text-sm sm:text-base text-slate-600 dark:text-slate-300 my-2 leading-relaxed">
          {parseInlineMarkdown(line)}
        </p>
      );
    });
  };

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-slate-950 text-foreground overflow-hidden font-sans">
      <SEO 
        title="Clinoza AI – Smart Healthcare Assistant" 
        description="Interact with Clinoza AI to get doctor suggestions, hospital recommendations, and professional healthcare guidance in Hindi, Hinglish, and English." 
      />

      {/* Identical Clinoza Branding Navbar */}
      <Navbar />

      {/* Main Chat Display (ChatGPT Minimalist Layout) */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800 scrollbar-track-transparent">
        <div className="max-w-3xl mx-auto space-y-6">
          <AnimatePresence initial={false}>
            {messages.map((msg) => {
              const isAI = msg.sender === "ai";
              
              if (isAI) {
                // AI Message Layout: Transparent background, left-aligned, sitting directly in flow
                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="flex gap-4 items-start py-6 border-b border-slate-100 dark:border-slate-900 first:pt-2"
                  >
                    {/* Clinoza Bot Avatar */}
                    <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center text-white shrink-0 shadow-sm">
                      <Bot className="h-5 w-5" />
                    </div>

                    {/* Conversational Text Flow */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          Clinoza AI
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      <div className="text-slate-700 dark:text-slate-200 font-sans tracking-wide">
                        {renderMessageContent(msg.text)}
                      </div>
                    </div>
                  </motion.div>
                );
              } else {
                // User Message Layout: Sleek right-aligned rounded bubble
                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="flex justify-end gap-3 py-3"
                  >
                    <div className="flex flex-col items-end max-w-[80%]">
                      {/* Bubble */}
                      <div className="bg-primary text-white rounded-2xl rounded-tr-none px-4 py-2.5 shadow-sm text-sm sm:text-base leading-relaxed">
                        {msg.text}
                      </div>
                      {/* Timestamp */}
                      <span className="text-[9px] text-slate-400 mt-1 px-1.5 font-medium">
                        {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>

                    {/* User Profile Avatar */}
                    <div className="h-9 w-9 rounded-xl bg-slate-700 dark:bg-slate-600 flex items-center justify-center text-white shrink-0 shadow-sm text-xs font-bold uppercase">
                      {userInitial}
                    </div>
                  </motion.div>
                );
              }
            })}
          </AnimatePresence>

          {/* Typing Animation */}
          {isTyping && (
            <div className="flex gap-4 items-start py-6">
              <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center text-white shrink-0 shadow-sm">
                <Bot className="h-5 w-5" />
              </div>
              <div className="flex items-center gap-1.5 py-2 px-1">
                <span className="w-2 h-2 rounded-full bg-slate-400/80 dark:bg-slate-600 animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-2 h-2 rounded-full bg-slate-400/80 dark:bg-slate-600 animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-2 h-2 rounded-full bg-slate-400/80 dark:bg-slate-600 animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Centered Footer Input Area */}
      <footer className="bg-white dark:bg-slate-950 border-t border-slate-100 dark:border-slate-900 p-3 sm:p-5 shrink-0 z-10">
        <div className="max-w-3xl mx-auto space-y-4">
          
          {/* Quick Suggestion Buttons */}
          <div className="flex items-center gap-2 overflow-x-auto py-1 no-scrollbar scroll-smooth">
            {[
              { label: "Fever", icon: Activity, color: "text-amber-600 bg-amber-50 border-amber-100 dark:bg-amber-950/20 dark:border-amber-900/40" },
              { label: "Headache", icon: HelpCircle, color: "text-violet-600 bg-violet-50 border-violet-100 dark:bg-violet-950/20 dark:border-violet-900/40" },
              { label: "Skin Problem", icon: Stethoscope, color: "text-emerald-600 bg-emerald-50 border-emerald-100 dark:bg-emerald-950/20 dark:border-emerald-900/40" },
              { label: "Heart Problem", icon: Heart, color: "text-rose-600 bg-rose-50 border-rose-100 dark:bg-rose-950/20 dark:border-rose-900/40" },
              { label: "Book Appointment", icon: Calendar, color: "text-blue-600 bg-blue-50 border-blue-100 dark:bg-blue-950/20 dark:border-blue-900/40" },
            ].map((sug, idx) => {
              const Icon = sug.icon;
              return (
                <button
                  key={idx}
                  onClick={() => handleSuggestionClick(sug.label)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[11px] sm:text-xs font-bold transition-all shrink-0 active:scale-95 shadow-sm hover:shadow hover:-translate-y-0.5 ${sug.color}`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {sug.label}
                </button>
              );
            })}
          </div>

          {/* Typing/Voice Action Input Box */}
          <div className="relative flex items-center bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/20 transition-all pr-2">
            
            {/* Listening Indicator overlay */}
            {isListening && (
              <div className="absolute inset-0 bg-primary/5 rounded-2xl pointer-events-none animate-pulse" />
            )}

            {/* Mic Toggle button */}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={toggleListening}
              className={`rounded-xl shrink-0 h-10 w-10 sm:h-11 sm:w-11 transition-all ml-1.5 ${
                isListening 
                  ? "bg-red-500 hover:bg-red-600 text-white animate-pulse" 
                  : "text-slate-400 hover:text-primary hover:bg-slate-200 dark:hover:bg-slate-800"
              }`}
              title={isListening ? "Listening... click to stop" : "Click to speak"}
            >
              {isListening ? (
                <MicOff className="h-5 w-5" />
              ) : (
                <Mic className="h-5 w-5" />
              )}
            </Button>

            {/* Main Text Input */}
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder={isListening ? "Listening... please speak 🎙️" : "Type symptoms (Hindi / Hinglish / English)..."}
              className="flex-1 bg-transparent border-0 outline-none ring-0 focus:ring-0 focus:outline-none py-3.5 px-3 text-xs sm:text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 min-w-0"
              disabled={isListening}
            />

            {/* Send Message button */}
            <Button
              type="button"
              size="icon"
              disabled={!inputText.trim()}
              onClick={() => sendMessage()}
              className={`rounded-xl shrink-0 h-9 w-9 sm:h-10 sm:w-10 transition-all ${
                inputText.trim() 
                  ? "bg-primary hover:bg-primary/90 text-white shadow-sm active:scale-95" 
                  : "bg-slate-200 dark:bg-slate-850 text-slate-400 cursor-not-allowed"
              }`}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>

          {/* Minimalist Language Pill & Disclaimer Control bar */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-[10px] text-slate-400 dark:text-slate-500 pt-1 font-medium px-1">
            <div className="flex items-center gap-1">
              <Volume2 className="h-3.5 w-3.5" />
              <span>Matching user language automatically (Hindi / Hinglish / English).</span>
            </div>
            
            {/* Speech toggle picker */}
            {recognition && (
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-0.5 rounded-lg border border-slate-200/40 dark:border-slate-850 self-start sm:self-auto shadow-sm">
                <button
                  onClick={() => setSpeechLanguage("hi-IN")}
                  className={`text-[9px] font-black px-2 py-0.5 rounded transition-all ${
                    speechLanguage === "hi-IN"
                      ? "bg-primary text-white"
                      : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  }`}
                >
                  HI/HINGLISH
                </button>
                <button
                  onClick={() => setSpeechLanguage("en-US")}
                  className={`text-[9px] font-black px-2 py-0.5 rounded transition-all ${
                    speechLanguage === "en-US"
                      ? "bg-primary text-white"
                      : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  }`}
                >
                  ENGLISH SPEECH
                </button>
              </div>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ClinozaAI;
