import { Bike, Package, CheckCircle } from "lucide-react";

interface OrderCardProps {
  type: "transport" | "delivery";
  date: string;
  destination: string;
  status: "completed" | "ongoing" | "cancelled";
  price: number;
  onReorder: () => void;
}

export function OrderCard({
  type,
  date,
  destination,
  status,
  price,
  onReorder,
}: OrderCardProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="card-shadow flex items-center gap-3 rounded-2xl bg-card p-4">
      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10">
        {type === "transport" ? (
          <Bike className="h-6 w-6 text-primary" />
        ) : (
          <Package className="h-6 w-6 text-primary" />
        )}
      </div>
      
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-foreground truncate">{destination}</p>
        <div className="flex items-center gap-1 text-sm">
          {status === "completed" && (
            <>
              <CheckCircle className="h-4 w-4 text-success" />
              <span className="text-success">Perjalanan selesai</span>
            </>
          )}
        </div>
      </div>
      
      <div className="flex flex-col items-end gap-2">
        <p className="font-bold text-foreground">{formatPrice(price)}</p>
        <button
          onClick={onReorder}
          className="rounded-full bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground"
        >
          Order Lagi
        </button>
      </div>
    </div>
  );
}
