import { ChevronRight, ChevronUp, Wallet } from "lucide-react";
import { useState } from "react";

interface PaymentOption {
  estimatedTime: string;
  distance: string;
  price: number;
}

interface PaymentSheetProps {
  options: PaymentOption[];
  walletBalance: number;
  onOrder: () => void;
}

export function PaymentSheet({ options, walletBalance, onOrder }: PaymentSheetProps) {
  const [expanded, setExpanded] = useState(false);
  const selectedOption = options[0];

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="fixed bottom-0 left-1/2 z-40 w-full max-w-md -translate-x-1/2 rounded-t-3xl bg-card card-shadow slide-up safe-bottom">
      {/* Handle */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full justify-center py-2"
      >
        <div className="h-1 w-10 rounded-full bg-border" />
      </button>

      {/* Header */}
      <div className="px-4 pb-2">
        <h3 className="text-lg font-semibold text-primary">Payment</h3>
      </div>

      {/* Options */}
      <div className={`overflow-hidden transition-all duration-300 ${expanded ? "max-h-60" : "max-h-28"}`}>
        {options.map((option, index) => (
          <div
            key={index}
            className={`flex items-center justify-between border-b border-border px-4 py-3 ${
              index === 0 ? "bg-accent/50" : ""
            }`}
          >
            <div>
              <p className="text-sm text-muted-foreground">
                Estimasi Waktu : {option.estimatedTime}
              </p>
              <p className="text-sm text-muted-foreground">
                Jarak : {option.distance}
              </p>
            </div>
            <p className="text-lg font-bold text-foreground">
              {formatPrice(option.price)}
            </p>
          </div>
        ))}
      </div>

      {/* Wallet */}
      <div className="flex items-center justify-end gap-2 px-4 py-2">
        <span className="text-sm text-muted-foreground">Wallet :</span>
        <span className="font-semibold text-primary">{formatPrice(walletBalance)}</span>
        <ChevronRight className="h-4 w-4 text-primary" />
      </div>

      {/* Action */}
      <div className="flex items-center gap-3 px-4 pb-4">
        <button className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-primary/20">
          <Wallet className="h-5 w-5 text-primary" />
        </button>
        
        <button
          onClick={onOrder}
          className="btn-shadow flex flex-1 items-center justify-between rounded-full bg-primary px-6 py-3"
        >
          <span className="font-semibold text-primary-foreground">Pesan Sekarang</span>
          <div className="flex items-center gap-2">
            <span className="font-bold text-primary-foreground">
              {formatPrice(selectedOption.price)}
            </span>
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-foreground">
              <ChevronRight className="h-4 w-4 text-primary" />
            </div>
          </div>
        </button>
      </div>
    </div>
  );
}
