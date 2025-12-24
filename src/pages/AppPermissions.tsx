import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { MapPin, Mic, User, Shield, Check } from "lucide-react";
import hoomiLogo from "@/assets/hoomi-logo.png";

interface Permission {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  required: boolean;
}

const permissions: Permission[] = [
  {
    id: "location",
    name: "Location Access",
    description: "To show nearby drivers and delivery tracking",
    icon: <MapPin className="h-5 w-5" />,
    required: true,
  },
  {
    id: "microphone",
    name: "Microphone Access",
    description: "For voice commands with Hoomi Agent",
    icon: <Mic className="h-5 w-5" />,
    required: false,
  },
  {
    id: "profile",
    name: "Profile Information",
    description: "Your name and contact details",
    icon: <User className="h-5 w-5" />,
    required: true,
  },
];

const AppPermissions = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isAuthorizing, setIsAuthorizing] = useState(false);
  const [grantedPermissions, setGrantedPermissions] = useState<Set<string>>(new Set());

  // Check for auth token from parent app (via URL params or postMessage)
  useEffect(() => {
    const token = searchParams.get("token");
    const userId = searchParams.get("user_id");
    
    if (token && userId) {
      // Store auth info from parent app
      sessionStorage.setItem("mini_app_token", token);
      sessionStorage.setItem("mini_app_user_id", userId);
    }

    // Listen for postMessage from parent app
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === "AUTH_TOKEN") {
        sessionStorage.setItem("mini_app_token", event.data.token);
        sessionStorage.setItem("mini_app_user_id", event.data.userId);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [searchParams]);

  const togglePermission = (permissionId: string) => {
    const permission = permissions.find((p) => p.id === permissionId);
    if (permission?.required) return; // Can't toggle required permissions

    setGrantedPermissions((prev) => {
      const next = new Set(prev);
      if (next.has(permissionId)) {
        next.delete(permissionId);
      } else {
        next.add(permissionId);
      }
      return next;
    });
  };

  const handleAuthorize = async () => {
    setIsAuthorizing(true);

    // Simulate authorization process
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Store granted permissions
    const allGranted = [...grantedPermissions, ...permissions.filter((p) => p.required).map((p) => p.id)];
    sessionStorage.setItem("granted_permissions", JSON.stringify(allGranted));
    sessionStorage.setItem("app_authorized", "true");

    // Navigate to main app
    navigate("/");
  };

  const requiredCount = permissions.filter((p) => p.required).length;
  const allRequiredGranted = true; // Required permissions are always granted

  return (
    <MobileLayout className="flex flex-col bg-gradient-to-b from-primary to-primary-dark">
      {/* Header */}
      <div className="flex flex-col items-center pt-12 pb-6">
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary-foreground shadow-lg">
          <img src={hoomiLogo} alt="Hoomi" className="h-12 w-12 object-contain" />
        </div>
        <h1 className="mt-4 text-2xl font-bold text-primary-foreground">Hoomi Delivery</h1>
        <p className="mt-1 text-sm text-primary-foreground/70">Mini Program</p>
      </div>

      {/* Permissions Card */}
      <div className="flex-1 rounded-t-3xl bg-card p-6">
        <div className="mb-6">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">App Permissions</h2>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            This app needs the following permissions to work properly
          </p>
        </div>

        {/* Permission List */}
        <div className="space-y-3">
          {permissions.map((permission) => {
            const isGranted = permission.required || grantedPermissions.has(permission.id);
            
            return (
              <button
                key={permission.id}
                onClick={() => togglePermission(permission.id)}
                disabled={permission.required}
                className={`flex w-full items-center gap-4 rounded-xl border p-4 transition-all ${
                  isGranted
                    ? "border-primary/30 bg-primary/5"
                    : "border-border bg-background hover:border-primary/20"
                } ${permission.required ? "cursor-default" : "cursor-pointer"}`}
              >
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full ${
                    isGranted ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {permission.icon}
                </div>
                <div className="flex-1 text-left">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground">{permission.name}</span>
                    {permission.required && (
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                        Required
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{permission.description}</p>
                </div>
                <div
                  className={`flex h-6 w-6 items-center justify-center rounded-full border-2 ${
                    isGranted ? "border-primary bg-primary" : "border-muted-foreground/30"
                  }`}
                >
                  {isGranted && <Check className="h-4 w-4 text-primary-foreground" />}
                </div>
              </button>
            );
          })}
        </div>

        {/* Info */}
        <div className="mt-6 rounded-xl bg-muted/50 p-4">
          <p className="text-xs text-muted-foreground">
            By continuing, you agree to share the selected information with Hoomi Delivery. 
            You can manage these permissions anytime in settings.
          </p>
        </div>

        {/* Authorize Button */}
        <button
          onClick={handleAuthorize}
          disabled={!allRequiredGranted || isAuthorizing}
          className="btn-shadow mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-4 font-semibold text-primary-foreground disabled:opacity-50"
        >
          {isAuthorizing ? (
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
          ) : (
            <>
              <Shield className="h-5 w-5" />
              Authorize & Continue
            </>
          )}
        </button>

        {/* Cancel */}
        <button
          onClick={() => window.close()}
          className="mt-3 w-full py-2 text-sm text-muted-foreground hover:text-foreground"
        >
          Cancel
        </button>
      </div>
    </MobileLayout>
  );
};

export default AppPermissions;
