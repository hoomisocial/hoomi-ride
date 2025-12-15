import { useNavigate } from "react-router-dom";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { Header } from "@/components/layout/Header";
import { PackageDetails } from "@/components/booking/PackageDetails";
import { PaymentSheet } from "@/components/booking/PaymentSheet";

const DeliveryDetails = () => {
  const navigate = useNavigate();

  const handleOrder = () => {
    navigate("/tracking/123");
  };

  return (
    <MobileLayout className="bg-background">
      <Header title="Detail pengiriman paket" />
      
      <div className="py-4">
        <PackageDetails onComplete={(details) => console.log(details)} />
      </div>

      <PaymentSheet
        options={[
          { estimatedTime: "10 - 15 menit", distance: "8.0 km", price: 15000 },
        ]}
        walletBalance={12000}
        onOrder={handleOrder}
      />
    </MobileLayout>
  );
};

export default DeliveryDetails;
