import { ChevronRight } from "lucide-react";

interface StatusBannerProps {
  message: string;
  eta?: string;
}

export function StatusBanner({ message, eta }: StatusBannerProps) {
  return (
    <div className="mx-4 flex items-center justify-between rounded-2xl bg-primary px-4 py-3">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-foreground/20">
          <ChevronRight className="h-4 w-4 text-primary-foreground" />
          <ChevronRight className="-ml-2 h-4 w-4 text-primary-foreground" />
        </div>
        <span className="font-medium text-primary-foreground">{message}</span>
      </div>
      
      {eta && (
        <span className="rounded-full bg-primary-foreground/20 px-3 py-1 text-sm font-medium text-primary-foreground">
          {eta}
        </span>
      )}
    </div>
  );
}
