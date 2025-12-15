import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { ChatBubble } from "@/components/chat/ChatBubble";
import { ChatInput } from "@/components/chat/ChatInput";

const initialMessages = [
  { id: 1, message: "Saya menuju lokasi.", time: "10:23 AM", isOwn: false },
  { id: 2, message: "Saya menuju lokasi.", time: "10:23 AM", isOwn: true, isRead: true },
];

const Chat = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState(initialMessages);

  const handleSend = (text: string) => {
    const newMessage = {
      id: Date.now(),
      message: text,
      time: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
      isOwn: true,
      isRead: false,
    };
    setMessages([...messages, newMessage]);
  };

  return (
    <MobileLayout className="bg-card">
      {/* Header */}
      <header className="sticky top-0 z-50 flex items-center gap-3 bg-primary px-4 py-3">
        <button
          onClick={() => navigate(-1)}
          className="flex h-8 w-8 items-center justify-center rounded-full text-primary-foreground transition-colors hover:bg-primary-light"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        
        <div className="h-10 w-10 overflow-hidden rounded-full bg-primary-foreground/20">
          <div className="flex h-full w-full items-center justify-center text-lg font-bold text-primary-foreground">
            B
          </div>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 space-y-4 p-4 pb-24">
        {messages.map((msg) => (
          <ChatBubble
            key={msg.id}
            message={msg.message}
            time={msg.time}
            isOwn={msg.isOwn}
            isRead={msg.isRead}
          />
        ))}
      </div>

      <ChatInput onSend={handleSend} />
    </MobileLayout>
  );
};

export default Chat;
