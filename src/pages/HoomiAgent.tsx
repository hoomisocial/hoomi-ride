import { useConversation } from "@elevenlabs/react";
import { useState, useCallback } from "react";
import { Mic, Phone, PhoneOff, Volume2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { useToast } from "@/hooks/use-toast";

const HoomiAgent = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isConnecting, setIsConnecting] = useState(false);
  const [agentId, setAgentId] = useState("");
  const [showAgentInput, setShowAgentInput] = useState(true);
  const [transcript, setTranscript] = useState<Array<{ role: string; text: string }>>([]);

  const conversation = useConversation({
    onConnect: () => {
      console.log("Connected to Hoomi Agent");
      toast({
        title: "Connected",
        description: "You're now talking to Hoomi Bot!",
      });
    },
    onDisconnect: () => {
      console.log("Disconnected from Hoomi Agent");
      setShowAgentInput(true);
    },
    onMessage: (message: any) => {
      console.log("Message:", message);
      if (message.type === "user_transcript") {
        setTranscript((prev) => [
          ...prev,
          { role: "user", text: message.user_transcription_event?.user_transcript || "" },
        ]);
      } else if (message.type === "agent_response") {
        setTranscript((prev) => [
          ...prev,
          { role: "agent", text: message.agent_response_event?.agent_response || "" },
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
      await navigator.mediaDevices.getUserMedia({ audio: true });

      await (conversation as any).startSession({
        agentId: agentId.trim(),
      });

      setShowAgentInput(false);
      setTranscript([]);
    } catch (error) {
      console.error("Failed to start conversation:", error);
      toast({
        variant: "destructive",
        title: "Microphone Access Required",
        description: "Please enable microphone access to talk to Hoomi Bot.",
      });
    } finally {
      setIsConnecting(false);
    }
  }, [conversation, agentId, toast]);

  const endConversation = useCallback(async () => {
    await conversation.endSession();
    toast({
      title: "Call Ended",
      description: "Thanks for talking to Hoomi Bot!",
    });
  }, [conversation, toast]);

  return (
    <MobileLayout className="bg-gradient-to-b from-primary to-primary-dark">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4">
        <button
          onClick={() => navigate(-1)}
          className="text-primary-foreground/80 hover:text-primary-foreground"
        >
          ← Back
        </button>
        <h1 className="text-lg font-semibold text-primary-foreground">Hoomi Bot</h1>
        <div className="w-12" />
      </div>

      {/* Main Content */}
      <div className="flex flex-1 flex-col items-center px-4 pt-8">
        {/* Avatar */}
        <div className="relative">
          <div
            className={`flex h-32 w-32 items-center justify-center rounded-full bg-primary-foreground/20 ${
              conversation.isSpeaking ? "animate-pulse" : ""
            }`}
          >
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary-foreground">
              <span className="text-5xl font-bold text-primary">H</span>
            </div>
          </div>

          {/* Speaking indicator */}
          {conversation.status === "connected" && (
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2">
              <div className="flex items-center gap-1 rounded-full bg-card px-3 py-1">
                {conversation.isSpeaking ? (
                  <>
                    <Volume2 className="h-4 w-4 text-success animate-pulse" />
                    <span className="text-xs font-medium text-success">Speaking</span>
                  </>
                ) : (
                  <>
                    <Mic className="h-4 w-4 text-primary" />
                    <span className="text-xs font-medium text-primary">Listening</span>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Status Text */}
        <p className="mt-8 text-center text-primary-foreground/80">
          {conversation.status === "connected"
            ? conversation.isSpeaking
              ? "Hoomi is speaking..."
              : "Hoomi is listening..."
            : "Connect to talk with Hoomi Bot"}
        </p>

        {/* Agent ID Input */}
        {showAgentInput && (
          <div className="mt-6 w-full max-w-xs space-y-4">
            <input
              type="text"
              value={agentId}
              onChange={(e) => setAgentId(e.target.value)}
              placeholder="Enter ElevenLabs Agent ID"
              className="w-full rounded-xl border-0 bg-primary-foreground/10 px-4 py-3 text-center text-primary-foreground placeholder:text-primary-foreground/50 outline-none focus:ring-2 focus:ring-primary-foreground/30"
            />
            <p className="text-center text-xs text-primary-foreground/60">
              Get your Agent ID from the ElevenLabs dashboard
            </p>
          </div>
        )}

        {/* Transcript */}
        {transcript.length > 0 && (
          <div className="mt-6 w-full max-w-sm space-y-2 overflow-y-auto max-h-48">
            {transcript.slice(-4).map((msg, index) => (
              <div
                key={index}
                className={`rounded-xl px-4 py-2 text-sm ${
                  msg.role === "user"
                    ? "bg-primary-foreground/10 text-primary-foreground ml-8"
                    : "bg-primary-foreground/20 text-primary-foreground mr-8"
                }`}
              >
                <span className="text-xs font-medium opacity-70">
                  {msg.role === "user" ? "You" : "Hoomi"}:
                </span>{" "}
                {msg.text}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Call Button */}
      <div className="flex flex-col items-center gap-4 px-4 pb-12 pt-8">
        {conversation.status === "disconnected" ? (
          <button
            onClick={startConversation}
            disabled={isConnecting}
            className="flex h-20 w-20 items-center justify-center rounded-full bg-success text-success-foreground shadow-lg transition-transform hover:scale-105 active:scale-95 disabled:opacity-50"
          >
            {isConnecting ? (
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-success-foreground/30 border-t-success-foreground" />
            ) : (
              <Phone className="h-8 w-8" />
            )}
          </button>
        ) : (
          <button
            onClick={endConversation}
            className="flex h-20 w-20 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow-lg transition-transform hover:scale-105 active:scale-95"
          >
            <PhoneOff className="h-8 w-8" />
          </button>
        )}
        <p className="text-sm text-primary-foreground/60">
          {conversation.status === "disconnected"
            ? isConnecting
              ? "Connecting..."
              : "Tap to call Hoomi"
            : "Tap to end call"}
        </p>
      </div>
    </MobileLayout>
  );
};

export default HoomiAgent;
