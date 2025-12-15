import heroCover from "@/assets/hero-cover.png";

export function HeroSection() {
  return (
    <section className="relative mx-4 mt-4 overflow-hidden rounded-3xl">
      <img
        src={heroCover}
        alt="Hoomi Rider"
        className="h-64 w-full object-cover"
      />
    </section>
  );
}
