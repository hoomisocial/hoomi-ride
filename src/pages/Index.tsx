import { X } from "lucide-react";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { BottomNav } from "@/components/layout/BottomNav";
import { HeroSection } from "@/components/home/HeroSection";
import { ServiceButtons } from "@/components/home/ServiceButtons";
import { PromoSlider } from "@/components/home/PromoSlider";
import { ActiveOrder } from "@/components/home/ActiveOrder";
import { RecentHistory } from "@/components/home/RecentHistory";

const Index = () => {
  return (
    <MobileLayout>
      {/* Close button */}
      <button className="absolute left-4 top-4 z-50 flex h-8 w-8 items-center justify-center rounded-full text-primary-foreground/80 hover:bg-primary-light">
        <X className="h-5 w-5" />
      </button>

      <HeroSection />
      <ServiceButtons />
      <PromoSlider />
      <ActiveOrder hasActiveOrder />
      <RecentHistory />
      <BottomNav />
    </MobileLayout>
  );
};

export default Index;
