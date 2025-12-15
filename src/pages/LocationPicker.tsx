import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, Clock } from "lucide-react";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { Header } from "@/components/layout/Header";
import { MapPlaceholder } from "@/components/tracking/MapPlaceholder";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const savedAddresses = [
  { id: "1", name: "Alamat", detail: "Detail Alamat" },
  { id: "2", name: "Alamat", detail: "Detail Alamat" },
];

const LocationPicker = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [phone, setPhone] = useState("");
  const [addressDetail, setAddressDetail] = useState("");

  const handleConfirm = () => {
    navigate(-1);
  };

  return (
    <MobileLayout className="bg-background">
      <Header title="Delivery" />
      
      {/* Search */}
      <div className="px-4 py-3">
        <div className="card-shadow flex items-center gap-3 rounded-xl bg-card p-3">
          <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-primary">
            <div className="h-2 w-2 rounded-full bg-primary" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Alamat"
            className="flex-1 bg-transparent text-foreground outline-none placeholder:text-muted-foreground"
          />
        </div>
        
        {/* Saved Addresses */}
        <div className="mt-3 space-y-2">
          {savedAddresses.map((addr) => (
            <button
              key={addr.id}
              className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left hover:bg-muted"
            >
              <Clock className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium text-foreground">{addr.name}</p>
                <p className="text-sm text-muted-foreground">{addr.detail}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Map */}
      <MapPlaceholder />

      {/* Address Form */}
      <div className="card-shadow rounded-t-3xl bg-card p-4">
        <h3 className="mb-4 text-lg font-semibold text-foreground">Detail Alamat</h3>
        
        <div className="space-y-3">
          <Input
            placeholder="Nama penerima"
            value={recipientName}
            onChange={(e) => setRecipientName(e.target.value)}
          />
          
          <Input
            placeholder="Nomor telepon"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          
          <Textarea
            placeholder="Detail alamat"
            value={addressDetail}
            onChange={(e) => setAddressDetail(e.target.value)}
            className="min-h-[80px]"
          />
        </div>

        <button
          onClick={handleConfirm}
          className="btn-shadow mt-4 w-full rounded-full bg-primary py-4 text-center font-semibold text-primary-foreground"
        >
          Confirm
        </button>
      </div>
    </MobileLayout>
  );
};

export default LocationPicker;
