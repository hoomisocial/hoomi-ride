import { Phone, MessageCircle, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface DriverInfoProps {
  licensePlate: string;
  vehicleModel: string;
  driverName: string;
  rating: number;
  avatarUrl?: string;
}

export function DriverInfo({
  licensePlate,
  vehicleModel,
  driverName,
  rating,
  avatarUrl,
}: DriverInfoProps) {
  const navigate = useNavigate();

  return (
    <div className="px-4 py-4 rounded-t-3xl bg-card card-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-lg font-bold text-foreground">{licensePlate}</p>
          <p className="text-sm text-muted-foreground">{vehicleModel}</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="font-semibold text-foreground">{driverName}</p>
            <div className="flex items-center justify-end gap-1">
              <Star className="h-4 w-4 fill-warning text-warning" />
              <span className="text-sm font-medium text-foreground">{rating}</span>
            </div>
          </div>
          
          <div className="h-12 w-12 overflow-hidden rounded-full bg-primary/10">
            {avatarUrl ? (
              <img src={avatarUrl} alt={driverName} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-primary/20 text-lg font-bold text-primary">
                {driverName.charAt(0)}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-4 flex items-center gap-3">
        <button className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-primary/20">
          <Phone className="h-5 w-5 text-primary" />
        </button>
        
        <button
          onClick={() => navigate("/chat/driver")}
          className="flex flex-1 items-center rounded-full border border-border bg-card px-4 py-3"
        >
          <span className="flex-1 text-left text-muted-foreground">Kirim pesan ke driver</span>
          <MessageCircle className="h-5 w-5 text-muted-foreground" />
        </button>
      </div>
    </div>
  );
}
