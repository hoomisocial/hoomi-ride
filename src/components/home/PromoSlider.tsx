import { useRef, useState } from "react";
import carousel1 from "@/assets/carousel-1.png";
import carousel2 from "@/assets/carousel-2.png";
import carousel3 from "@/assets/carousel-3.png";
import carousel4 from "@/assets/carousel-4.png";

const promos = [
  {
    id: 1,
    image: carousel1,
    alt: "Promo Diskon 50%",
  },
  {
    id: 2,
    image: carousel2,
    alt: "Ajak Teman, Dapat Saldo Gratis!",
  },
  {
    id: 3,
    image: carousel3,
    alt: "Cashback 30%",
  },
  {
    id: 4,
    image: carousel4,
    alt: "Flash Sale!",
  },
];

export function PromoSlider() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - scrollRef.current.offsetLeft);
    setScrollLeft(scrollRef.current.scrollLeft);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 2; // Scroll speed multiplier
    scrollRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!scrollRef.current) return;
    setStartX(e.touches[0].pageX - scrollRef.current.offsetLeft);
    setScrollLeft(scrollRef.current.scrollLeft);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!scrollRef.current) return;
    const x = e.touches[0].pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    scrollRef.current.scrollLeft = scrollLeft - walk;
  };

  return (
    <section className="mt-4">
      <div
        ref={scrollRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        className="flex gap-3 overflow-x-scroll mx-4 px-4 pb-2 cursor-grab active:cursor-grabbing [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
        style={{
          scrollSnapType: "x mandatory",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {promos.map((promo) => (
          <div
            key={promo.id}
            className="flex-shrink-0 rounded-2xl overflow-hidden"
            style={{
              scrollSnapAlign: "start",
              width: "280px",
              height: "140px",
            }}
          >
            <img
              src={promo.image}
              alt={promo.alt}
              className="w-full h-full object-cover pointer-events-none select-none"
              draggable={false}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
