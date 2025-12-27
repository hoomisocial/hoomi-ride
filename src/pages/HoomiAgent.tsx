// === ELEVENLABS IMPORT DISABLED - Using Groq + Web Speech API instead ===
// import { useConversation } from "@elevenlabs/react";

import { useState, useCallback, useRef, useEffect } from "react";
import {
  Send,
  Bot,
  Plus,
  Image,
  Camera,
  File,
  X,
  Mic,
  MicOff,
  Loader2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
// === DISABLED - No longer using ElevenLabs voice visualizer ===
// import { VoiceVisualizer } from "@/components/ui/VoiceVisualizer";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";

// Groq API endpoint - using streaming
const GROQ_API_URL = "http://localhost:8000/chat/stream";

interface Attachment {
  id: string;
  name: string;
  type: "image" | "file";
  url: string;
  file: File;
}

interface Message {
  id: string;
  role: "user" | "agent";
  text: string;
  timestamp: Date;
  attachments?: Attachment[];
}

// Web Speech API type declarations
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onstart: ((this: SpeechRecognition, ev: Event) => void) | null;
  onend: ((this: SpeechRecognition, ev: Event) => void) | null;
  onresult:
    | ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => void)
    | null;
  onerror:
    | ((this: SpeechRecognition, ev: Event & { error: string }) => void)
    | null;
}

const HoomiAgent = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // Check auth status (optional - no redirect if not authenticated)
  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        setUser(session.user);
      }
    };
    checkAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Initialize Web Speech API
  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = "id-ID"; // Indonesian, will also work with English

      let finalTranscript = "";

      recognition.onstart = () => {
        setIsListening(true);
        finalTranscript = "";
      };

      recognition.onend = () => {
        setIsListening(false);
        // Auto-send if there's a final transcript
        if (finalTranscript.trim()) {
          // Small delay to ensure state is updated
          setTimeout(() => {
            const sendBtn = document.querySelector(
              "[data-send-btn]"
            ) as HTMLButtonElement;
            if (sendBtn && !sendBtn.disabled) {
              sendBtn.click();
            }
          }, 100);
        }
      };

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let interimTranscript = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            finalTranscript += result[0].transcript;
          } else {
            interimTranscript += result[0].transcript;
          }
        }

        // Show interim results while speaking, final when done
        setInputText(finalTranscript + interimTranscript);
      };

      recognition.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);
        toast({
          variant: "destructive",
          title: "Speech Error",
          description: `Could not recognize speech: ${event.error}`,
        });
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [toast]);

  // === ELEVENLABS CONVERSATION HOOK DISABLED ===
  /*
  const conversation = useConversation({
    onConnect: () => {
      console.log("Connected to Hoomi Agent");
      toast({
        title: "Connected",
        description: "You're now chatting with Hoomi Bot!",
      });
    },
    onDisconnect: () => {
      console.log("Disconnected from Hoomi Agent");
    },
    onMessage: (message: any) => {
      // ElevenLabs message handling...
    },
    onError: (error: any) => {
      console.error("Error:", error);
    },
  });
  */

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Toggle speech recognition
  const toggleListening = useCallback(() => {
    if (!recognitionRef.current) {
      toast({
        variant: "destructive",
        title: "Not Supported",
        description:
          "Speech recognition is not supported in this browser. Please use Chrome.",
      });
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
  }, [isListening, toast]);

  // Send message to Groq API with streaming
  const sendMessage = useCallback(async () => {
    if (!inputText.trim() && attachments.length === 0) return;

    const text = inputText.trim();
    const currentAttachments = [...attachments];

    // Add user message to chat
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      text:
        text ||
        (currentAttachments.length > 0
          ? `Sent ${currentAttachments.length} file(s)`
          : ""),
      timestamp: new Date(),
      attachments:
        currentAttachments.length > 0 ? currentAttachments : undefined,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText("");
    setAttachments([]);
    setIsLoading(true);

    // Create agent message placeholder for streaming
    const agentMessageId = (Date.now() + 1).toString();
    setMessages((prev) => [
      ...prev,
      {
        id: agentMessageId,
        role: "agent",
        text: "",
        timestamp: new Date(),
      },
    ]);

    try {
      // Build message history for context
      const messageHistory = [...messages, userMessage].map((msg) => ({
        role: msg.role === "user" ? "user" : "assistant",
        content: msg.text,
      }));

      // Call Groq API with streaming
      const response = await fetch(GROQ_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ messages: messageHistory }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error("No response body");
      }

      let fullText = "";
      let isFirstChunk = true;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        fullText += chunk;

        // Hide loading indicator on first chunk
        if (isFirstChunk) {
          setIsLoading(false);
          isFirstChunk = false;
        }

        // Update the agent message with accumulated text
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === agentMessageId ? { ...msg, text: fullText } : msg
          )
        );
      }
    } catch (error: any) {
      console.error("Failed to send message:", error);
      // Remove the empty agent message on error
      setMessages((prev) => prev.filter((msg) => msg.id !== agentMessageId));
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to get response from AI.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [inputText, attachments, messages, toast]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/home");
  };

  const handleFileSelect = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "image" | "file"
  ) => {
    const files = e.target.files;
    if (!files) return;

    const newAttachments: Attachment[] = Array.from(files).map((file) => ({
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      name: file.name,
      type: type,
      url: URL.createObjectURL(file),
      file: file,
    }));

    setAttachments((prev) => [...prev, ...newAttachments]);
    setIsUploadOpen(false);

    // Reset input
    e.target.value = "";
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => {
      const attachment = prev.find((a) => a.id === id);
      if (attachment) {
        URL.revokeObjectURL(attachment.url);
      }
      return prev.filter((a) => a.id !== id);
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const userName =
    user?.user_metadata?.name || user?.email?.split("@")[0] || "User";

  return (
    <MobileLayout className="flex flex-col h-full bg-background overflow-hidden">
      {/* Header - Fixed at top */}
      <header className="flex-shrink-0 flex items-center justify-between bg-primary px-4 py-3">
        <button
          onClick={() => navigate("/home")}
          className="text-primary-foreground/80 hover:text-primary-foreground"
        >
          ← Back
        </button>
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-primary-foreground" />
          <h1 className="text-lg font-semibold text-primary-foreground">
            Hoomi Bot
          </h1>
        </div>
        <div className="w-12" /> {/* Spacer for alignment */}
      </header>

      {/* Connection Status - Fixed below header */}
      <div className="flex-shrink-0 flex items-center justify-center gap-2 py-2 bg-success/10">
        <div className="h-2 w-2 rounded-full animate-pulse bg-success" />
        <span className="text-xs font-medium text-success">
          Hi {userName}! Chat with Hoomi
        </span>
      </div>

      {/* Messages - Scrollable area */}
      <div className="flex-1 overflow-y-auto p-4 pb-32">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Bot className="h-8 w-8 text-primary" />
            </div>
            <p className="mt-4 font-medium text-foreground">
              Chat with Hoomi Bot
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Ask about deliveries, track orders, or get help with bookings.
            </p>
          </div>
        )}

        <div className="space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${
                msg.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground"
                }`}
              >
                {msg.role === "agent" && (
                  <div className="mb-1 flex items-center gap-1">
                    <Bot className="h-3 w-3" />
                    <span className="text-xs font-medium opacity-70">
                      Hoomi
                    </span>
                  </div>
                )}
                {msg.attachments && msg.attachments.length > 0 && (
                  <div className="mb-2 flex flex-wrap gap-2">
                    {msg.attachments.map((attachment) => (
                      <div key={attachment.id} className="relative">
                        {attachment.type === "image" ? (
                          <img
                            src={attachment.url}
                            alt={attachment.name}
                            className="h-20 w-20 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="flex items-center gap-2 rounded-lg bg-background/20 px-3 py-2">
                            <File className="h-4 w-4" />
                            <span className="max-w-[100px] truncate text-xs">
                              {attachment.name}
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                {msg.role === "agent" ? (
                  <div className="text-sm prose prose-sm dark:prose-invert max-w-none">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      rehypePlugins={[rehypeRaw]}
                    >
                      {msg.text}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                )}
                <p
                  className={`mt-1 text-[10px] ${
                    msg.role === "user"
                      ? "text-primary-foreground/60"
                      : "text-muted-foreground"
                  }`}
                >
                  {msg.timestamp.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          ))}
        </div>
        <div ref={messagesEndRef} />
      </div>

      {/* Attachment Preview */}
      {attachments.length > 0 && (
        <div className="fixed bottom-[140px] left-0 right-0 z-40 max-w-md mx-auto border-t border-border bg-muted/95 backdrop-blur-sm px-4 py-2">
          <div className="flex flex-wrap gap-2">
            {attachments.map((attachment) => (
              <div key={attachment.id} className="relative">
                {attachment.type === "image" ? (
                  <div className="relative">
                    <img
                      src={attachment.url}
                      alt={attachment.name}
                      className="h-16 w-16 rounded-lg object-cover"
                    />
                    <button
                      onClick={() => removeAttachment(attachment.id)}
                      className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <div className="relative flex items-center gap-2 rounded-lg bg-muted px-3 py-2">
                    <File className="h-4 w-4" />
                    <span className="max-w-[80px] truncate text-xs">
                      {attachment.name}
                    </span>
                    <button
                      onClick={() => removeAttachment(attachment.id)}
                      className="flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-destructive-foreground"
                    >
                      <X className="h-2 w-2" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Listening Indicator */}
      {isListening && (
        <div className="fixed bottom-[90px] left-1/2 -translate-x-1/2 z-40 flex items-center justify-center gap-2 rounded-full bg-destructive/90 backdrop-blur-sm px-4 py-2 shadow-lg">
          <Mic className="h-4 w-4 text-white animate-pulse" />
          <span className="text-sm text-white font-medium">Listening...</span>
        </div>
      )}

      {/* Input - Sticky Bottom */}
      <div className="fixed bottom-0 left-0 right-0 z-50 max-w-md mx-auto bg-card shadow-[0_-2px_10px_rgba(0,0,0,0.1)]">
        <div className="px-4 py-3">
          {/* Hidden file inputs */}
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => handleFileSelect(e, "image")}
          />
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => handleFileSelect(e, "image")}
          />
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => handleFileSelect(e, "file")}
          />

          <div className="flex items-center gap-2">
            <Popover open={isUploadOpen} onOpenChange={setIsUploadOpen}>
              <PopoverTrigger asChild>
                <button className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground hover:bg-muted/80">
                  <Plus className="h-5 w-5" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-48 p-2" side="top" align="start">
                <div className="flex flex-col gap-1">
                  <button
                    onClick={() => {
                      imageInputRef.current?.click();
                    }}
                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-muted"
                  >
                    <Image className="h-4 w-4 text-primary" />
                    <span>Upload Image</span>
                  </button>
                  <button
                    onClick={() => {
                      cameraInputRef.current?.click();
                    }}
                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-muted"
                  >
                    <Camera className="h-4 w-4 text-primary" />
                    <span>Take Photo</span>
                  </button>
                  <button
                    onClick={() => {
                      fileInputRef.current?.click();
                    }}
                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-muted"
                  >
                    <File className="h-4 w-4 text-primary" />
                    <span>Upload File</span>
                  </button>
                </div>
              </PopoverContent>
            </Popover>

            {/* Mic button for speech-to-text */}
            <button
              onClick={toggleListening}
              className={`flex h-10 w-10 items-center justify-center rounded-full transition-all ${
                isListening
                  ? "bg-destructive text-white animate-pulse"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
              title={isListening ? "Stop listening" : "Start voice input"}
            >
              {isListening ? (
                <MicOff className="h-5 w-5" />
              ) : (
                <Mic className="h-5 w-5" />
              )}
            </button>

            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              className="flex-1 rounded-full border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/20"
              disabled={isLoading}
            />
            <button
              data-send-btn
              onClick={sendMessage}
              disabled={
                (!inputText.trim() && attachments.length === 0) || isLoading
              }
              className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
        {/* Safe area spacer for devices with notch */}
        <div className="safe-bottom" />
      </div>
    </MobileLayout>
  );
};

export default HoomiAgent;
