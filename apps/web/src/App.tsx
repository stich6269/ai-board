import * as React from "react";
import { BrowserRouter, Routes, Route, Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Settings,
  ScrollText,
  Menu,
  Activity,
  Search,
  Bell,
  Share2,
  FileUp,
  HelpCircle,
  Users,
  ChevronRight,
  Plus
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

import Scanner from "./pages/Scanner";
import SettingsPage from "./pages/Settings";
import Logs from "./pages/Logs";

const NavItem = ({ to, icon: Icon, label, badge }: { to: string, icon: React.ComponentType<{ className?: string }>, label: string, badge?: string }) => {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <Link
      to={to}
      className={cn(
        "flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all text-sm group",
        isActive
          ? "bg-white text-primary shadow-sm ring-1 ring-border"
          : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
      )}
    >
      <Icon className={cn("h-4 w-4 transition-colors", isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
      <span className="flex-1 font-medium">{label}</span>
      {badge && (
        <span className="text-[10px] font-bold bg-green-100 text-green-600 px-1.5 py-0.5 rounded-full">
          {badge}
        </span>
      )}
    </Link>
  );
};

const Sidebar = () => (
  <div className="flex flex-col h-full bg-[#f8f9fa] border-r">
    {/* Branding */}
    <div className="p-6">
      <Link to="/" className="flex items-center gap-2.5 font-bold text-xl tracking-tight">
        <div className="bg-black text-white p-1.5 rounded-lg">
          <Activity className="h-5 w-5" />
        </div>
        <span>KrafUI</span>
      </Link>
    </div>

    {/* Navigation */}
    <div className="flex-1 px-4 py-2 space-y-6 overflow-y-auto">
      <div className="space-y-1">
        <NavItem to="/" icon={LayoutDashboard} label="Dashboard" />
        <NavItem to="/" icon={Users} label="Scanner" />
        <NavItem to="/logs" icon={ScrollText} label="Logs" />
      </div>

      <div>
        <div className="flex items-center justify-between px-3 mb-2">
          <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Settings</span>
          <Plus className="h-3 w-3 text-muted-foreground cursor-pointer hover:text-foreground" />
        </div>
        <div className="space-y-1">
          <NavItem to="/settings" icon={Settings} label="Global Settings" />
          <NavItem to="/help" icon={HelpCircle} label="Help Center" />
        </div>
      </div>
    </div>

    {/* Footer */}
    <div className="p-4 mt-auto space-y-4">
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-border/50">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold">Cloud Storage</span>
          <span className="text-xs text-muted-foreground">90%</span>
        </div>
        <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden mb-3">
          <div className="h-full bg-black rounded-full" style={{ width: "90%" }} />
        </div>
        <div className="text-[11px] text-muted-foreground mb-3">
          1.8 GB of 2 GB used
        </div>
        <Button variant="outline" size="sm" className="w-full text-xs font-bold rounded-xl h-8">
          Upgrade Plan
        </Button>
      </div>

      <Separator />

      <div className="flex items-center gap-3 px-2 py-1 group cursor-pointer">
        <Avatar className="h-9 w-9 border border-border">
          <AvatarImage src="https://github.com/shadcn.png" />
          <AvatarFallback>JW</AvatarFallback>
        </Avatar>
        <div className="flex-1 overflow-hidden">
          <p className="text-sm font-bold truncate">Janson Williams</p>
          <p className="text-[11px] text-muted-foreground truncate">williams@mesh.c...</p>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
      </div>
    </div>
  </div>
);

const Header = () => (
  <header className="flex h-16 items-center gap-4 px-8 bg-white/80 backdrop-blur-md sticky top-0 z-10">
    <div className="flex-1 flex items-center gap-4">
      <h2 className="text-xl font-bold tracking-tight">Dashboard</h2>
      <Button variant="ghost" size="sm" className="hidden md:flex gap-2 text-xs font-bold px-3 h-8 bg-black text-white hover:bg-black/90 rounded-xl">
        <Activity className="h-3 w-3" />
        Ask AI
      </Button>
      <Button variant="outline" size="sm" className="hidden md:flex text-xs font-bold px-3 h-8 rounded-xl border-border/50">
        Customize Widget
      </Button>
    </div>

    <div className="flex items-center gap-4">
      <div className="relative hidden lg:block w-72">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          placeholder="Search everything"
          className="pl-9 h-9 bg-[#f8f9fa] border-none rounded-xl text-xs font-medium focus-visible:ring-1 focus-visible:ring-border"
        />
      </div>

      <div className="flex items-center gap-1.5">
        <div className="flex items-center gap-1 px-2 py-1.5 text-[11px] font-bold text-green-500">
          <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
          Last updated now
        </div>
        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-[#f8f9fa]">
          <Bell className="h-4 w-4 text-muted-foreground" />
        </Button>
        <Button variant="outline" size="sm" className="hidden sm:flex gap-2 text-xs font-bold px-4 h-9 rounded-xl border-border/50">
          <Share2 className="h-3.5 w-3.5" />
          Share
        </Button>
        <Button variant="outline" size="sm" className="hidden sm:flex gap-2 text-xs font-bold px-4 h-9 bg-white text-foreground hover:bg-muted rounded-xl shadow-sm">
          <FileUp className="h-3.5 w-3.5" />
          Imports
        </Button>
        <Button size="sm" className="hidden sm:flex gap-2 text-xs font-bold px-4 h-9 bg-black text-white hover:bg-black/90 rounded-xl shadow-md">
          <FileUp className="h-3.5 w-3.5 rotate-180" />
          Exports
        </Button>
      </div>

      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="lg:hidden h-9 w-9 rounded-xl">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[280px] p-0 border-r-0">
          <Sidebar />
        </SheetContent>
      </Sheet>
    </div>
  </header>
);

function App() {
  return (
    <BrowserRouter>
      <div className="flex min-h-screen w-full bg-[#fcfcfc]">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block w-[280px] shrink-0 h-screen sticky top-0">
          <Sidebar />
        </aside>

        {/* Main Content */}
        <div className="flex flex-col flex-1 min-w-0">
          <Header />
          <main className="flex-1 p-8">
            <div className="max-w-[1400px] mx-auto">
              <Routes>
                <Route path="/" element={<Scanner />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/logs" element={<Logs />} />
              </Routes>
            </div>
          </main>
        </div>
      </div>
    </BrowserRouter>
  )
}

export default App;
