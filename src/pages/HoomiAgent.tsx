import { useConversation } from "@elevenlabs/react";
import { useState, useCallback, useRef, useEffect } from "react";
import { Send, Settings, Bot } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { useToast } from "@/hooks/use-toast";

interface Message {
  id: string;
  role: "user" | "agent";
  text: string;
  timestamp: Date;
}

const HoomiAgent = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isConnecting, setIsConnecting] = useState(false);
  const [agentId, setAgentId] = useState("");
  const [showSettings, setShowSettings] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const conversation = useConversation({
    onConnect: () => {
      console.log("Connected to Hoomi Agent");
      setShowSettings(false);
      toast({
        title: "Connected",
        description: "You're now chatting with Hoomi Bot!",
      });
    },
    onDisconnect: () => {
      console.log("Disconnected from Hoomi Agent");
      setShowSettings(true);
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

  const startConversation = useCallback(async () => {
    if (!agentId.trim()) {
      toast({
        variant: "destructive",
        title: "Agent ID Required",
        description: "Please enter your ElevenLabs Agent ID",
      });
      return;
    }

    setIsConnecting(true);
    try {
      // Request mic permission but we'll use text mode
      await navigator.mediaDevices.getUserMedia({ audio: true });

      await (conversation as any).startSession({
        agentId: agentId.trim(),
      });

      setMessages([]);
    } catch (error) {
      console.error("Failed to start conversation:", error);
      toast({
        variant: "destructive",
        title: "Connection Failed",
        description: "Could not connect to Hoomi Bot. Please check your Agent ID.",
      });
    } finally {
      setIsConnecting(false);
    }
  }, [conversation, agentId, toast]);

  const endConversation = useCallback(async () => {
    await conversation.endSession();
    toast({
      title: "Disconnected",
      description: "Chat session ended.",
    });
  }, [conversation, toast]);

  const sendMessage = useCallback(() => {
    if (!inputText.trim() || conversation.status !== "connected") return;

    const text = inputText.trim();
    setMessages((prev) => [
      ...prev,
      { id: Date.now().toString(), role: "user", text, timestamp: new Date() },
    ]);

    // Send text message to agent
    (conversation as any).sendUserMessage?.(text);
    setInputText("");
  }, [conversation, inputText]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <MobileLayout className="flex flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 flex items-center justify-between bg-primary px-4 py-3">
        <button
          onClick={() => navigate(-1)}
          className="text-primary-foreground/80 hover:text-primary-foreground"
        >
          ← Back
        </button>
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-primary-foreground" />
          <h1 className="text-lg font-semibold text-primary-foreground">Hoomi Bot</h1>
        </div>
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="text-primary-foreground/80 hover:text-primary-foreground"
        >
          <Settings className="h-5 w-5" />
        </button>
      </header>

      {/* Settings Panel */}
      {showSettings && (
        <div className="border-b border-border bg-card p-4 fade-in">
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-foreground">ElevenLabs Agent ID</label>
              <input
                type="text"
                value={agentId}
                onChange={(e) => setAgentId(e.target.value)}
                placeholder="Enter your Agent ID"
                className="mt-1 w-full rounded-lg border border-input bg-background px-4 py-2 text-foreground outline-none focus:ring-2 focus:ring-primary/20"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Get your Agent ID from the ElevenLabs dashboard. The agent can use MCP tools to call APIs.
              </p>
            </div>

            {conversation.status === "disconnected" ? (
              <button
                onClick={startConversation}
                disabled={isConnecting || !agentId.trim()}
                className="btn-shadow w-full rounded-lg bg-primary py-3 font-semibold text-primary-foreground disabled:opacity-50"
              >
                {isConnecting ? "Connecting..." : "Connect to Hoomi Bot"}
              </button>
            ) : (
              <button
                onClick={endConversation}
                className="w-full rounded-lg bg-destructive py-3 font-semibold text-destructive-foreground"
              >
                Disconnect
              </button>
            )}
          </div>
        </div>
      )}

      {/* Connection Status */}
      {conversation.status === "connected" && !showSettings && (
        <div className="flex items-center justify-center gap-2 bg-success/10 py-2">
          <div className="h-2 w-2 animate-pulse rounded-full bg-success" />
          <span className="text-xs font-medium text-success">Connected to Hoomi Bot</span>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 && conversation.status === "connected" && (
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

        {messages.length === 0 && conversation.status === "disconnected" && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <Bot className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="mt-4 font-medium text-foreground">Connect to start chatting</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Enter your Agent ID above to begin.
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
                : "Connect to start chatting"
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
