import { useState } from "react";
import { UtensilsCrossed, Shirt, Pill, FileText, BookOpen, HelpCircle, Camera } from "lucide-react";
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
}

export function PackageDetails({ onComplete }: PackageDetailsProps) {
  const [senderName, setSenderName] = useState("");
  const [senderPhone, setSenderPhone] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [selectedWeight, setSelectedWeight] = useState("");

  return (
    <div className="space-y-4 px-4 pb-32">
      {/* Sender Details */}
      <div className="card-shadow rounded-2xl bg-card p-4">
        <h3 className="mb-3 font-semibold text-foreground">Detail Pengirim</h3>
        
        <Input
          placeholder="Nama pengirim"
          value={senderName}
          onChange={(e) => setSenderName(e.target.value)}
          className="mb-3"
        />
        
        <div className="flex gap-2">
          <div className="flex items-center rounded-lg border border-input bg-background px-3 py-2">
            <span className="text-sm text-muted-foreground">+62</span>
          </div>
          <Input
            placeholder="Nomor telepon pengirim"
            value={senderPhone}
            onChange={(e) => setSenderPhone(e.target.value)}
            className="flex-1"
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
                  className={`h-5 w-5 rounded-full border-2 ${
                    selectedType === type.id
                      ? "border-primary bg-primary"
                      : "border-border"
                  }`}
                />
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
                className={`h-5 w-5 rounded-full border-2 ${
                  selectedWeight === weight.id
                    ? "border-primary bg-primary"
                    : "border-border"
                }`}
              />
            </div>
          </button>
        ))}
      </div>

      {/* Photo Upload */}
      <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border bg-muted/30 p-8">
        <Camera className="h-12 w-12 text-muted-foreground/50" />
        <p className="mt-2 text-center text-sm text-muted-foreground">
          Ambil foto paketmu sebelum diserahkan ke kurir
        </p>
      </div>
    </div>
  );
}
