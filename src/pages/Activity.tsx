import { MobileLayout } from "@/components/layout/MobileLayout";
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";
import { Bike } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Activity = () => {
  const navigate = useNavigate();

  return (
    <MobileLayout className="bg-background">
      <Header title="Activity" />
      
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-16">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
          <Bike className="h-10 w-10 text-primary" />
        </div>
        
        <h2 className="mt-4 text-lg font-semibold text-foreground">No Active Rides</h2>
        <p className="mt-2 text-center text-muted-foreground">
          Book a transport or delivery to see your activity here
        </p>
        
        <button
          onClick={() => navigate("/home")}
          className="btn-shadow mt-6 rounded-full bg-primary px-8 py-3 font-semibold text-primary-foreground"
        >
          Book Now
        </button>
      </div>
      
      <BottomNav />
    </MobileLayout>
  );
};

export default Activity;
