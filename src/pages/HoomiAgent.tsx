import { useConversation } from "@elevenlabs/react";
import { useState, useCallback, useRef, useEffect } from "react";
import { Send, Bot, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";

interface Message {
  id: string;
  role: "user" | "agent";
  text: string;
  timestamp: Date;
}

const HoomiAgent = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Check auth status (optional - no redirect if not authenticated)
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUser(session.user);
      }
    };
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

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
      console.log("Message:", message);
      if (message.type === "user_transcript") {
        const text = message.user_transcription_event?.user_transcript;
        if (text) {
          setMessages((prev) => [
            ...prev,
            { id: Date.now().toString(), role: "user", text, timestamp: new Date() },
          ]);
        }
      } else if (message.type === "agent_response") {
        const text = message.agent_response_event?.agent_response;
        if (text) {
          setMessages((prev) => [
            ...prev,
            { id: Date.now().toString(), role: "agent", text, timestamp: new Date() },
          ]);
        }
      }
    },
    onError: (error: any) => {
      console.error("Error:", error);
      toast({
        variant: "destructive",
        title: "Connection Error",
        description: "Failed to connect to Hoomi Bot. Please try again.",
      });
      setIsConnecting(false);
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-connect when user is authenticated
  useEffect(() => {
    if (user && conversation.status === "disconnected" && !isConnecting) {
      connectToAgent();
    }
  }, [user]);

  const connectToAgent = async () => {
    setIsConnecting(true);
    try {
      // Request mic permission
      await navigator.mediaDevices.getUserMedia({ audio: true });

      // Get signed URL from our edge function
      const { data, error } = await supabase.functions.invoke("elevenlabs-token");

      if (error) {
        console.error("Token error:", error);
        throw new Error("Failed to get connection token");
      }

      if (!data?.signed_url) {
        console.error("No signed URL received:", data);
        throw new Error("No connection URL received");
      }

      console.log("Got signed URL, connecting...");

      // Connect using the signed URL
      await (conversation as any).startSession({
        signedUrl: data.signed_url,
      });

      setMessages([]);
    } catch (error: any) {
      console.error("Failed to connect:", error);
      toast({
        variant: "destructive",
        title: "Connection Failed",
        description: error.message || "Could not connect to Hoomi Bot.",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleLogout = async () => {
    await conversation.endSession();
    await supabase.auth.signOut();
    navigate("/home");
  };

  const sendMessage = useCallback(() => {
    if (!inputText.trim() || conversation.status !== "connected") return;

    const text = inputText.trim();
    setMessages((prev) => [
      ...prev,
      { id: Date.now().toString(), role: "user", text, timestamp: new Date() },
    ]);

    (conversation as any).sendUserMessage?.(text);
    setInputText("");
  }, [conversation, inputText]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const userName = user?.user_metadata?.name || user?.email?.split("@")[0] || "User";

  return (
    <MobileLayout className="flex flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 flex items-center justify-between bg-primary px-4 py-3">
        <button
          onClick={() => navigate("/home")}
          className="text-primary-foreground/80 hover:text-primary-foreground"
        >
          ← Back
        </button>
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-primary-foreground" />
          <h1 className="text-lg font-semibold text-primary-foreground">Hoomi Bot</h1>
        </div>
        <div className="w-5" /> {/* Spacer for alignment */}
      </header>

      {/* Connection Status */}
      <div className={`flex items-center justify-center gap-2 py-2 ${
        conversation.status === "connected" ? "bg-success/10" : "bg-warning/10"
      }`}>
        <div className={`h-2 w-2 rounded-full ${
          conversation.status === "connected" ? "animate-pulse bg-success" : "bg-warning"
        }`} />
        <span className={`text-xs font-medium ${
          conversation.status === "connected" ? "text-success" : "text-warning"
        }`}>
          {isConnecting ? "Connecting..." : conversation.status === "connected" ? `Hi ${userName}! Chat with Hoomi` : "Disconnected"}
        </span>
        {conversation.status === "disconnected" && !isConnecting && (
          <button
            onClick={connectToAgent}
            className="ml-2 rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground"
          >
            Reconnect
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Bot className="h-8 w-8 text-primary" />
            </div>
            <p className="mt-4 font-medium text-foreground">Chat with Hoomi Bot</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Ask about deliveries, track orders, or get help with bookings.
            </p>
          </div>
        )}

        <div className="space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
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
                    <span className="text-xs font-medium opacity-70">Hoomi</span>
                  </div>
                )}
                <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                <p
                  className={`mt-1 text-[10px] ${
                    msg.role === "user" ? "text-primary-foreground/60" : "text-muted-foreground"
                  }`}
                >
                  {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>
          ))}
        </div>
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-border bg-card p-4 safe-bottom">
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={
              conversation.status === "connected"
                ? "Type a message..."
                : "Connecting..."
            }
            disabled={conversation.status !== "connected"}
            className="flex-1 rounded-full border border-border bg-background px-4 py-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
          />
          <button
            onClick={sendMessage}
            disabled={conversation.status !== "connected" || !inputText.trim()}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground disabled:opacity-50"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
      </div>
    </MobileLayout>
  );
};

export default HoomiAgent;
