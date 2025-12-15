import { Home, MessageCircle, Bike, History } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

const navItems = [
  { icon: Home, label: "Home", path: "/" },
  { icon: MessageCircle, label: "Chat", path: "/chat" },
  { icon: Bike, label: "Activity", path: "/activity" },
  { icon: History, label: "History", path: "/history" },
];

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-1/2 z-50 w-full max-w-md -translate-x-1/2 border-t border-border bg-card px-2 pb-safe safe-bottom">
      <div className="relative flex items-center justify-around py-2">
        {navItems.map((item, index) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          
          // Center logo button
          if (index === 1) {
            return (
              <div key="center" className="flex items-center gap-6">
                <button
                  onClick={() => navigate(item.path)}
                  className={`flex flex-col items-center gap-1 px-3 py-1 transition-colors ${
                    isActive ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-[10px] font-medium">{item.label}</span>
                </button>
                
                {/* Center Hoomi Button - Talk to Agent */}
                <button
                  onClick={() => navigate("/hoomi-agent")}
                  className="relative -mt-8 flex h-14 w-14 items-center justify-center rounded-full bg-primary btn-shadow transition-transform hover:scale-105 active:scale-95"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-foreground">
                    <span className="text-xl font-bold text-primary">H</span>
                  </div>
                </button>
                
                <button
                  onClick={() => navigate(navItems[2].path)}
                  className={`flex flex-col items-center gap-1 px-3 py-1 transition-colors ${
                    location.pathname === navItems[2].path ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  <Bike className="h-5 w-5" />
                  <span className="text-[10px] font-medium">{navItems[2].label}</span>
                </button>
              </div>
            );
          }
          
          if (index === 2) return null;
          
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center gap-1 px-3 py-1 transition-colors ${
                isActive ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
