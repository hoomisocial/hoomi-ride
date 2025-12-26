import { useConversation } from "@elevenlabs/react";
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
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { VoiceVisualizer } from "@/components/ui/VoiceVisualizer";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

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

const HoomiAgent = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isMutedRef = useRef(false);

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
      console.log("Full message received:", JSON.stringify(message, null, 2));

      // ElevenLabs sends messages in format: { source: "ai"|"user", role: "agent"|"user", message: "text" }
      if (message.message && message.role) {
        const text = message.message;
        const role = message.role === "agent" ? "agent" : "user";

        // Skip agent messages when muted
        if (role === "agent" && isMutedRef.current) {
          console.log("Agent message ignored (muted):", text);
          return;
        }

        console.log(`${role} message:`, text);

        setMessages((prev) => [
          ...prev,
          { id: Date.now().toString(), role, text, timestamp: new Date() },
        ]);
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

  // Reset mute state when disconnected
  useEffect(() => {
    if (conversation.status === "disconnected") {
      setIsMuted(false);
      isMutedRef.current = false;
    }
  }, [conversation.status]);

  const connectToAgent = async () => {
    setIsConnecting(true);
    try {
      // Request mic permission
      await navigator.mediaDevices.getUserMedia({ audio: true });

      // Get signed URL from our edge function
      const { data, error } = await supabase.functions.invoke(
        "elevenlabs-token"
      );

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
    if (!inputText.trim() && attachments.length === 0) return;

    const text = inputText.trim();
    const currentAttachments = [...attachments];

    setMessages((prev) => [
      ...prev,
      {
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
      },
    ]);

    if (conversation.status === "connected" && text) {
      (conversation as any).sendUserMessage?.(text);
    }

    setInputText("");
    setAttachments([]);
  }, [conversation, inputText, attachments]);

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

  const toggleMute = useCallback(() => {
    if (conversation.status === "connected") {
      const newMutedState = !isMuted;
      setIsMuted(newMutedState);
      isMutedRef.current = newMutedState; // Sync ref for callback

      try {
        if (newMutedState) {
          // Mute: Stop audio playback and pause conversation
          if ((conversation as any).stopAudio) {
            (conversation as any).stopAudio();
          }
          if ((conversation as any).setVolume) {
            (conversation as any).setVolume(0);
          }
          // Also mute microphone input
          if ((conversation as any).setMuted) {
            (conversation as any).setMuted(true);
          }
        } else {
          // Unmute: Resume audio and microphone
          if ((conversation as any).setVolume) {
            (conversation as any).setVolume(1);
          }
          if ((conversation as any).setMuted) {
            (conversation as any).setMuted(false);
          }
        }

        toast({
          title: newMutedState ? "Conversation Paused" : "Conversation Resumed",
          description: newMutedState
            ? "AI is muted and won't respond"
            : "You can talk with AI now",
        });
      } catch (error) {
        console.error("Error toggling mute:", error);
        // Fallback: just set state without API calls
        toast({
          title: newMutedState ? "Microphone Muted" : "Microphone Unmuted",
          description: newMutedState
            ? "You won't be heard"
            : "You can speak now",
        });
      }
    }
  }, [conversation, isMuted, toast]);

  const userName =
    user?.user_metadata?.name || user?.email?.split("@")[0] || "User";

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
          <h1 className="text-lg font-semibold text-primary-foreground">
            Hoomi Bot
          </h1>
        </div>
        <button
          onClick={toggleMute}
          disabled={conversation.status !== "connected"}
          className={`rounded-full p-2 transition-all ${
            conversation.status !== "connected"
              ? "opacity-50 cursor-not-allowed"
              : isMuted
              ? "bg-destructive/20 text-destructive hover:bg-destructive/30"
              : "bg-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/30"
          }`}
          title={isMuted ? "Unmute Microphone" : "Mute Microphone"}
        >
          {isMuted ? (
            <MicOff className="h-5 w-5" />
          ) : (
            <Mic className="h-5 w-5" />
          )}
        </button>
      </header>

      {/* Connection Status */}
      <div
        className={`flex items-center justify-center gap-2 py-2 ${
          conversation.status === "connected"
            ? "bg-success/10"
            : "bg-warning/10"
        }`}
      >
        <div
          className={`h-2 w-2 rounded-full ${
            conversation.status === "connected"
              ? "animate-pulse bg-success"
              : "bg-warning"
          }`}
        />
        <span
          className={`text-xs font-medium ${
            conversation.status === "connected"
              ? "text-success"
              : "text-warning"
          }`}
        >
          {isConnecting
            ? "Connecting..."
            : conversation.status === "connected"
            ? `Hi ${userName}! Chat with Hoomi`
            : "Disconnected"}
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
                <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
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

      {/* Floating Voice Visualizer */}
      {conversation.status === "connected" && !isMuted && (
        <div className="fixed bottom-[90px] left-1/2 -translate-x-1/2 z-40 flex items-center justify-center gap-2 rounded-full bg-primary/90 backdrop-blur-sm px-4 py-2 shadow-lg">
          <Mic className="h-4 w-4 text-primary-foreground" />
          <VoiceVisualizer
            isActive={true}
            barCount={5}
            className="text-primary-foreground"
            getInputVolume={() => (conversation as any).getInputVolume?.() ?? 0}
            getInputByteFrequencyData={() =>
              (conversation as any).getInputByteFrequencyData?.() ?? null
            }
          />
        </div>
      )}

      {/* Input - Sticky Bottom */}
      <div className="fixed bottom-0 left-0 right-0 z-50 max-w-md mx-auto border-t border-border bg-card p-4 safe-bottom">
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

          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className="flex-1 rounded-full border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/20"
          />
          <button
            onClick={sendMessage}
            disabled={!inputText.trim() && attachments.length === 0}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground disabled:opacity-50"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
      </div>
    </MobileLayout>
  );
};

export default HoomiAgent;
