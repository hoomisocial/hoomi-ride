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
