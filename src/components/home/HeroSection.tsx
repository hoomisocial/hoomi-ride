import heroRider from "@/assets/hero-rider.png";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-primary via-primary to-warning/80 pb-6">
      <div className="relative mx-auto flex h-64 items-end justify-center">
        <img
          src={heroRider}
          alt="Hoomi Rider"
          className="h-full w-auto object-contain"
        />
      </div>
    </section>
  );
}
