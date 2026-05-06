import { Outlet, useNavigate, useLocation } from "react-router";
import { Toaster } from "sonner";
import BottomNav, { TabType } from "../components/BottomNav";

export default function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const getActiveTab = (): TabType => {
    if (location.pathname === "/app") return "home";
    if (location.pathname.includes("clients")) return "clients";
    if (location.pathname.includes("orders")) return "orders";
    if (location.pathname.includes("new-order")) return "new-order";
    if (location.pathname.includes("settings")) return "settings";
    return "home";
  };

  const handleTabChange = (tab: TabType) => {
    navigate(`/app/${tab === "home" ? "" : tab}`);
  };

  return (
    <div className="min-h-screen bg-[#F7F5F0] flex flex-col">

      <Toaster position="top-center" richColors />

      {/* Main Content */}
      <main className="flex-1 w-full max-w-screen-xl mx-auto px-4 pb-24 pt-4">
        <div className="bg-white rounded-2xl shadow-sm p-4 min-h-[80vh]">
          <Outlet />
        </div>
      </main>

      {/* Bottom Nav */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-md">
        <BottomNav
          activeTab={getActiveTab()}
          onTabChange={handleTabChange}
        />
      </div>

    </div>
  );
}
