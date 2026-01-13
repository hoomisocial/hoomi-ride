import { useState } from "react";
import {
  UtensilsCrossed,
  Shirt,
  Pill,
  FileText,
  BookOpen,
  HelpCircle,
  Camera,
} from "lucide-react";
import { Input } from "@/components/ui/input";

const packageTypes = [
  { id: "food", label: "Makanan", icon: UtensilsCrossed },
  { id: "clothes", label: "Baju", icon: Shirt },
  { id: "medicine", label: "Obat-obatan", icon: Pill },
  { id: "documents", label: "Dokumen", icon: FileText },
  { id: "books", label: "Buku", icon: BookOpen },
  { id: "other", label: "Lainnya", icon: HelpCircle },
];

const weightOptions = [
  { id: "small", label: "Kecil", max: "Maks. 5kg" },
  { id: "medium", label: "Sedang", max: "Maks. 20kg" },
  { id: "large", label: "Besar", max: "Maks. 100kg" },
];

interface PackageDetailsProps {
  onComplete: (details: PackageInfo) => void;
}

interface PackageInfo {
  senderName: string;
  senderPhone: string;
  packageType: string;
  weight: string;
  dimensions: string;
  description: string;
}

export function PackageDetails({ onComplete }: PackageDetailsProps) {
  const [senderName, setSenderName] = useState("");
  const [senderPhone, setSenderPhone] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [selectedWeight, setSelectedWeight] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-4 px-4 pb-64">
      {/* Sender Details */}
      <div className="card-shadow rounded-2xl bg-card p-4">
        <h3 className="mb-3 font-semibold text-foreground">Detail Pengirim</h3>

        <Input
          placeholder="Nama pengirim"
          value={senderName}
          onChange={(e) => setSenderName(e.target.value)}
          className="mb-3 bg-white"
        />

        <div className="flex gap-2">
          <Input value="+62" disabled className="w-14 text-center" />
          <Input
            type="tel"
            placeholder="Nomor telepon pengirim"
            value={senderPhone}
            onChange={(e) => {
              const value = e.target.value.replace(/[^0-9]/g, "");
              setSenderPhone(value);
            }}
            className="flex-1 bg-white"
            maxLength={13}
          />
        </div>

        <div className="mt-3 flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Simpan alamat?</span>
          <button className="rounded-full bg-accent px-3 py-1 text-sm font-medium text-primary">
            Simpan
          </button>
        </div>
      </div>

      {/* Package Type */}
      <div className="card-shadow rounded-2xl bg-card p-4">
        <h3 className="mb-3 font-semibold text-foreground">Jenis Paket</h3>

        <div className="space-y-2">
          {packageTypes.map((type) => {
            const Icon = type.icon;
            return (
              <button
                key={type.id}
                onClick={() => setSelectedType(type.id)}
                className="flex w-full items-center justify-between py-2"
              >
                <div className="flex items-center gap-3">
                  <Icon className="h-5 w-5 text-foreground" />
                  <span className="text-foreground">{type.label}</span>
                </div>
                <div
                  className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${
                    selectedType === type.id
                      ? "border-primary"
                      : "border-border"
                  }`}
                >
                  {selectedType === type.id && (
                    <div className="h-2.5 w-2.5 rounded-full bg-primary" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Weight */}
      <div className="space-y-2">
        <h3 className="font-semibold text-foreground">Pilih Berat Paketmu</h3>

        {weightOptions.map((weight) => (
          <button
            key={weight.id}
            onClick={() => setSelectedWeight(weight.id)}
            className={`card-shadow flex w-full items-center justify-between rounded-xl bg-card p-4 ${
              selectedWeight === weight.id ? "ring-2 ring-primary" : ""
            }`}
          >
            <span className="font-medium text-foreground">{weight.label}</span>
            <div className="flex items-center gap-3">
              <span className="text-muted-foreground">{weight.max}</span>
              <div
                className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${
                  selectedWeight === weight.id
                    ? "border-primary"
                    : "border-border"
                }`}
              >
                {selectedWeight === weight.id && (
                  <div className="h-2.5 w-2.5 rounded-full bg-primary" />
                )}
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Photo Upload */}
      <div className="space-y-3">
        <input
          type="file"
          id="package-photo"
          accept="image/*"
          onChange={handleImageSelect}
          className="hidden"
        />
        
        {!selectedImage ? (
          <label
            htmlFor="package-photo"
            className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border bg-muted/30 p-8 cursor-pointer hover:bg-muted/50 transition-colors"
          >
            <Camera className="h-12 w-12 text-muted-foreground/50" />
            <p className="mt-2 text-center text-sm text-muted-foreground">
              Ambil foto paketmu sebelum diserahkan ke kurir
            </p>
            <p className="mt-1 text-center text-xs text-muted-foreground/70">
              Klik untuk membuka kamera atau galeri
            </p>
          </label>
        ) : (
          <div className="relative rounded-2xl overflow-hidden">
            <img
              src={selectedImage}
              alt="Package preview"
              className="w-full h-64 object-cover rounded-2xl"
            />
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
            <label
              htmlFor="package-photo"
              className="absolute bottom-2 right-2 bg-primary text-primary-foreground rounded-full px-4 py-2 text-sm font-medium cursor-pointer hover:bg-primary/90 transition-colors"
            >
              Ganti Foto
            </label>
          </div>
        )}
      </div>
    </div>
  );
}
