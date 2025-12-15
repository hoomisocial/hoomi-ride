import { useRef } from "react";

const promos = [
  {
    id: 1,
    title: "DISKON 50%",
    subtitle: "Hanya Perjalananmu",
    gradient: "from-primary to-primary-dark",
  },
  {
    id: 2,
    title: "CASHBACK 30%",
    subtitle: "Bayar Pakai Hoomi Wallet",
    gradient: "from-warning to-orange-500",
  },
  {
    id: 3,
    title: "Ajak Teman",
    subtitle: "Dapat Saldo Gratis",
    gradient: "from-success to-emerald-500",
  },
];

export function PromoSlider() {
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <section className="mt-4">
      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto px-4 pb-2 scrollbar-none"
        style={{ scrollSnapType: "x mandatory" }}
      >
        {promos.map((promo) => (
          <div
            key={promo.id}
            className={`flex-shrink-0 rounded-2xl bg-gradient-to-br ${promo.gradient} p-4 text-primary-foreground`}
            style={{ scrollSnapAlign: "start", width: "75%" }}
          >
            <p className="text-xs font-medium opacity-80">{promo.subtitle}</p>
            <p className="mt-1 text-xl font-bold">{promo.title}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
