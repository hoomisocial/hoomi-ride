import { ChevronRight, ChevronUp, Wallet, Banknote, Ticket } from "lucide-react";
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

interface Discount {
  id: string;
  code: string;
  title: string;
  description: string;
  discount: number; // percentage or fixed amount
  type: "percentage" | "fixed";
}

const availableDiscounts: Discount[] = [
  {
    id: "1",
    code: "HOOMI50",
    title: "Diskon 50%",
    description: "Diskon 50% untuk pengguna baru",
    discount: 50,
    type: "percentage"
  },
  {
    id: "2",
    code: "CASHBACK30",
    title: "Cashback 30%",
    description: "Cashback 30% maks Rp 10.000",
    discount: 30,
    type: "percentage"
  },
  {
    id: "3",
    code: "GRATIS5K",
    title: "Potongan Rp 5.000",
    description: "Potongan langsung Rp 5.000",
    discount: 5000,
    type: "fixed"
  }
];

export function PaymentSheet({ options, walletBalance, onOrder }: PaymentSheetProps) {
  const [expanded, setExpanded] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"wallet" | "cash">("wallet");
  const [selectedDiscount, setSelectedDiscount] = useState<Discount | null>(null);
  const selectedOption = options[0];

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const handlePaymentMethodSelect = (method: "wallet" | "cash") => {
    setPaymentMethod(method);
    setExpanded(false);
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
      <div className={`overflow-y-auto transition-all duration-300 ${expanded ? "max-h-[500px]" : "max-h-28"}`}>
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
        
        {/* Payment Method Selection - Shown when expanded */}
        {expanded && (
          <div className="px-4 py-4 space-y-3">
            <h4 className="text-sm font-semibold text-foreground mb-3">Pilih Metode Pembayaran</h4>
            
            <button
              onClick={() => handlePaymentMethodSelect("wallet")}
              className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-colors ${
                paymentMethod === "wallet" 
                  ? "border-primary bg-primary/10" 
                  : "border-border bg-card"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <Wallet className="h-5 w-5 text-primary" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-foreground">Hoomi Wallet</p>
                  <p className="text-sm text-muted-foreground">Saldo: {formatPrice(walletBalance)}</p>
                </div>
              </div>
              {paymentMethod === "wallet" && (
                <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                  <ChevronRight className="h-3 w-3 text-primary-foreground" />
                </div>
              )}
            </button>

            <button
              onClick={() => handlePaymentMethodSelect("cash")}
              className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-colors ${
                paymentMethod === "cash" 
                  ? "border-primary bg-primary/10" 
                  : "border-border bg-card"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <Banknote className="h-5 w-5 text-primary" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-foreground">Cash</p>
                  <p className="text-sm text-muted-foreground">Bayar tunai ke driver</p>
                </div>
              </div>
              {paymentMethod === "cash" && (
                <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                  <ChevronRight className="h-3 w-3 text-primary-foreground" />
                </div>
              )}
            </button>
          </div>
        )}

        {/* Discount Selection - Shown when expanded */}
        {expanded && (
          <div className="px-4 py-4 space-y-3 border-t border-border">
            <h4 className="text-sm font-semibold text-foreground mb-3">Pilih Promo</h4>
            
            {availableDiscounts.map((discount) => (
              <button
                key={discount.id}
                onClick={() => setSelectedDiscount(selectedDiscount?.id === discount.id ? null : discount)}
                className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-colors ${
                  selectedDiscount?.id === discount.id
                    ? "border-primary bg-primary/10" 
                    : "border-border bg-card"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <Ticket className="h-5 w-5 text-primary" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-foreground">{discount.title}</p>
                    <p className="text-sm text-muted-foreground">{discount.description}</p>
                  </div>
                </div>
                {selectedDiscount?.id === discount.id && (
                  <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                    <ChevronRight className="h-3 w-3 text-primary-foreground" />
                  </div>
                )}
              </button>
            ))}

            {/* No discount option */}
            <button
              onClick={() => setSelectedDiscount(null)}
              className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-colors ${
                !selectedDiscount
                  ? "border-primary bg-primary/10" 
                  : "border-border bg-card"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="text-left">
                  <p className="font-semibold text-foreground">Tidak Pakai Promo</p>
                </div>
              </div>
              {!selectedDiscount && (
                <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                  <ChevronRight className="h-3 w-3 text-primary-foreground" />
                </div>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Payment Method Selection - Inline with balance */}
      <div className="px-4 py-2">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center justify-end gap-2 w-full text-right"
        >
          <span className="text-sm text-muted-foreground">
            {paymentMethod === "wallet" ? "Wallet" : "Cash"} :
          </span>
          <span className="font-semibold text-primary">
            {paymentMethod === "wallet" ? formatPrice(walletBalance) : "Tunai"}
          </span>
          <ChevronRight className="h-4 w-4 text-primary" />
        </button>
      </div>

      {/* Action */}
      <div className="flex items-center gap-3 px-4 pb-4">
        {/* Discount Icon */}
        <button 
          onClick={() => setExpanded(!expanded)}
          className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-primary relative"
        >
          <Ticket className="h-5 w-5 text-primary" />
          {selectedDiscount && (
            <div className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full flex items-center justify-center">
              <span className="text-[8px] text-white font-bold">1</span>
            </div>
          )}
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
