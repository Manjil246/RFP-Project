import { Outlet } from "react-router-dom";
import { Sidebar } from "../ui/sidebar";
import { Navbar } from "../ui/navbar";

export function MainLayout() {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden bg-background">
        <Navbar />
        <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-background">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

