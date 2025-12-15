import { ArrowLeft, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface HeaderProps {
  title: string;
  variant?: "back" | "close";
  onBack?: () => void;
  className?: string;
}

export function Header({ title, variant = "back", onBack, className = "" }: HeaderProps) {
  const navigate = useNavigate();
  
  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  return (
    <header className={`sticky top-0 z-50 bg-primary px-4 py-4 ${className}`}>
      <div className="flex items-center gap-3">
        <button
          onClick={handleBack}
          className="flex h-8 w-8 items-center justify-center rounded-full text-primary-foreground transition-colors hover:bg-primary-light"
        >
          {variant === "close" ? (
            <X className="h-5 w-5" />
          ) : (
            <ArrowLeft className="h-5 w-5" />
          )}
        </button>
        <h1 className="text-lg font-semibold text-primary-foreground">{title}</h1>
      </div>
    </header>
  );
}
