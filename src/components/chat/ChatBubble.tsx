import { Check, CheckCheck } from "lucide-react";

interface ChatBubbleProps {
  message: string;
  time: string;
  isOwn: boolean;
  isRead?: boolean;
}

export function ChatBubble({ message, time, isOwn, isRead = false }: ChatBubbleProps) {
  return (
    <div className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-2 ${
          isOwn
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-foreground"
        }`}
      >
        <p className="text-sm">{message}</p>
        <div className={`mt-1 flex items-center justify-end gap-1 ${
          isOwn ? "text-primary-foreground/70" : "text-muted-foreground"
        }`}>
          <span className="text-[10px]">{time}</span>
          {isOwn && (
            isRead ? (
              <CheckCheck className="h-3 w-3" />
            ) : (
              <Check className="h-3 w-3" />
            )
          )}
        </div>
      </div>
    </div>
  );
}
