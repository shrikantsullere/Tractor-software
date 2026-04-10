import { useState, useRef, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Briefcase, Navigation2, CheckCircle, Fuel, User, LogOut, Tractor, Bell, ChevronRight, Menu, ListCollapse, CheckCircle2, AlertCircle, MessageSquare, X } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

export default function OperatorLayout() {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 1024);
  const [showNotifications, setShowNotifications] = useState(false);
  const sidebarRef = useRef(null);
  const notificationRef = useRef(null);
  const operatorName = user?.name || "Raju";

  const notifications = [
    { id: 1, title: 'New Job Assigned', message: 'Tractor #T24 assigned for Plot 88', time: '5m ago', icon: Briefcase, color: 'text-earth-primary', unread: true },
    { id: 2, title: 'Fuel Alert', message: 'Fuel level dropped below 15%', time: '1h ago', icon: AlertCircle, color: 'text-red-400', unread: true },
    { id: 3, title: 'System Check', message: 'Diagnostic check passed for all units', time: '4h ago', icon: CheckCircle2, color: 'text-earth-green', unread: false },
  ];

  // Only close sidebar when route changes on mobile
  useEffect(() => {
    if (window.innerWidth < 1024) {
      setIsSidebarOpen(false);
    }
  }, [location.pathname]);

  // Handle window resize - forced expanded for desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsSidebarOpen(true);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Handle click outside to close sidebar on mobile
  useEffect(() => {
    function handleClickOutside(event) {
      if (window.innerWidth < 1024 && sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        setIsSidebarOpen(false);
      }
    }
    if (isSidebarOpen && window.innerWidth < 1024) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isSidebarOpen]);

  // Click outside to close notifications
  useEffect(() => {
    function handleClickOutside(event) {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const navItems = [
    { icon: Briefcase, label: 'Jobs', path: '/operator' },
    { icon: Navigation2, label: 'Nav', path: '/operator/navigation' },
    { icon: CheckCircle, label: 'Status', path: '/operator/status' },
    { icon: Fuel, label: 'Fuel', path: '/operator/fuel' },
    { icon: User, label: 'Profile', path: '/operator/profile' },
  ];

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-earth-main font-sans text-earth-brown selection:bg-earth-primary/30 overflow-hidden">
      
      {/* --- SIDEBAR (Mirrors FarmerLayout) --- */}
      <aside 
        ref={sidebarRef}
        className={cn(
          "bg-primary border-r border-primary/10 flex flex-col transition-all duration-300 ease-in-out h-screen fixed lg:sticky top-0 z-50 shadow-2xl overflow-hidden",
          isSidebarOpen ? "w-[240px] translate-x-0" : "w-[240px] -translate-x-[240px]"
        )}
      >
        <div className="h-20 flex items-center justify-between border-b border-white/10 shrink-0 px-4 overflow-hidden">
          <div className="flex items-center gap-2 opacity-100 transition-all min-w-0">
            <img src="/tractorlink-logo.png" alt="TractorLink Logo" className="w-10 h-10 object-contain shrink-0" />
            <div className="flex-1 min-w-0">
              <span className="font-black text-base text-white tracking-tight whitespace-nowrap leading-none block uppercase">Tractor<span className="text-accent">Link</span></span>
              <span className="text-[9px] text-white/70 uppercase tracking-widest font-bold leading-none mt-1">Operator Pro</span>
            </div>
          </div>
          <button 
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden p-2 text-white/40 hover:text-white transition-colors shrink-0"
          >
            <X size={20} strokeWidth={2.5} />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto px-2 py-8 space-y-1.5 scrollbar-hide">
          {navItems.map(item => {
            const isActive = location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path} title={!isSidebarOpen ? item.label : undefined} className={cn(
                "flex items-center rounded-xl text-[13px] font-black transition-all uppercase tracking-wide",
                isSidebarOpen ? "px-4 py-3.5 gap-3.5 mx-2" : "justify-center py-3.5",
                isActive
                  ? "bg-accent text-white shadow-[0_8px_25px_rgba(255,152,0,0.4)] border border-accent/20 scale-[1.02] z-10" 
                  : "text-white/70 hover:bg-white/5 hover:text-white border border-transparent"
              )}>
                <item.icon size={isActive ? 20 : 18} className={isActive ? "text-white" : "text-white/50 group-hover:text-white"} />
                {isSidebarOpen && <span className="whitespace-nowrap">{item.label}</span>}
              </Link>
            )
          })}
        </div>
        
        <div className="p-4 mt-auto border-t border-earth-dark/10 space-y-3">
          <button onClick={logout} className={cn(
             "flex items-center text-white/60 hover:text-white hover:bg-white/5 rounded-xl transition-all w-full group",
             isSidebarOpen ? "px-4 py-3 gap-3.5 font-black text-[13px] uppercase tracking-wide" : "justify-center py-3.5"
           )} title="Sign Out">
            <LogOut size={isSidebarOpen ? 18 : 22} className="shrink-0 text-white/40 group-hover:text-white" />
            {isSidebarOpen && <span className="whitespace-nowrap">Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* --- MAIN CONTENT AREA --- */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden relative">
        
        {/* --- TOP NAVBAR (Mirrors FarmerLayout) --- */}
        <header className="hidden md:flex h-16 bg-earth-card/80 backdrop-blur-md border-b border-earth-dark/10 items-center justify-between px-6 z-20 shrink-0 shadow-sm">
          <div className="flex items-center gap-4">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setIsSidebarOpen(!isSidebarOpen);
              }} 
              className="lg:hidden p-2.5 bg-earth-card-alt border border-earth-dark/15 rounded-xl text-earth-sub hover:text-earth-brown transition-all shadow-inner active:scale-95 flex items-center justify-center shrink-0"
            >
              {isSidebarOpen ? <X size={18} strokeWidth={2.5} /> : <Menu size={18} strokeWidth={2.5} />}
            </button>
            {/* Mission status breadcrumbs removed for clarity */}
          </div>
          
          <div className="flex items-center gap-5 text-sm">
            <div ref={notificationRef} className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className={cn(
                  "relative p-2 transition-colors rounded-full",
                  showNotifications ? "bg-earth-card-alt text-earth-primary" : "text-earth-sub hover:text-earth-primary hover:bg-earth-card-alt"
                )}
              >
                <Bell size={20} strokeWidth={2.5} />
                {notifications.some(n => n.unread) && (
                  <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-neutral-900 shadow-sm"></span>
                )}
              </button>

              {/* Notification Dropdown */}
              <AnimatePresence>
                {showNotifications && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-3 w-[320px] bg-earth-card border border-earth-dark/10 rounded-2xl shadow-2xl z-50 overflow-hidden origin-top-right"
                  >
                    <div className="p-4 border-b border-earth-dark/10 flex items-center justify-between bg-earth-card-alt/50">
                      <h3 className="font-black text-[10px] uppercase tracking-widest text-earth-brown">System Logs</h3>
                      <button onClick={() => setShowNotifications(false)} className="text-earth-mut hover:text-earth-brown"><X size={14} /></button>
                    </div>
                    <div className="max-h-[350px] overflow-y-auto scrollbar-hide">
                      {notifications.map((n) => (
                        <div key={n.id} className={cn(
                          "p-4 border-b border-earth-dark/10/50 hover:bg-earth-card-alt/50 transition-colors cursor-pointer group",
                          n.unread && "bg-earth-primary/[0.02]"
                        )}>
                          <div className="flex gap-4">
                            <div className={cn("w-9 h-9 rounded-xl bg-earth-card border border-earth-dark/10 flex items-center justify-center shrink-0 group-hover:border-earth-dark/15 transition-colors", n.color)}>
                              <n.icon size={16} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-start mb-0.5">
                                <p className="text-xs font-black text-earth-brown group-hover:text-earth-primary transition-colors italic">{n.title}</p>
                                <span className="text-[9px] font-bold text-earth-mut whitespace-nowrap">{n.time}</span>
                              </div>
                              <p className="text-[11px] text-earth-sub leading-tight line-clamp-2 font-medium">{n.message}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="p-3 bg-earth-card-alt/30 text-center">
                      <button className="text-[9px] uppercase font-black text-earth-mut hover:text-earth-brown transition-colors">Clear All Logouts</button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="h-6 w-px bg-earth-card-alt"></div>
            <div className="flex items-center gap-3 cursor-pointer group">
              <div className="text-right hidden sm:block">
                <p className="font-black text-earth-brown leading-none group-hover:text-earth-primary transition-colors italic uppercase text-xs">Op. {operatorName}</p>
                <p className="text-[10px] text-earth-mut font-semibold mt-1 uppercase tracking-widest leading-none">{user?.email || 'Fleet Unit #T24'}</p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-earth-card-alt flex items-center justify-center text-earth-primary font-black border border-earth-dark/15 shadow-sm transition-all group-hover:border-earth-primary/50">
                {operatorName.charAt(0)}
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto overflow-x-hidden relative scrollbar-hide h-full">
            {/* Subtle grid bg consistent with other panels */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.01]" style={{ backgroundImage: 'radial-gradient(circle at center, white 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
            <div className="w-full h-full relative z-10 pb-24 md:pb-0">
               <Outlet />
            </div>
        </div>

        {/* --- MOBILE BOTTOM NAVIGATION --- */}
        <nav 
          className="md:hidden fixed bottom-0 w-full bg-earth-card border-t border-earth-dark/10 flex justify-around pt-3 pb-2 px-1 z-50 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]"
        >
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex flex-col items-center gap-1 min-w-[56px] px-1 py-1 rounded-xl transition-all",
                  isActive ? "text-earth-primary -translate-y-1" : "text-earth-mut hover:text-earth-brown"
                )}
              >
                <div className={cn("transition-transform", isActive ? "drop-shadow-[0_0_8px_rgba(46,125,50,0.5)]" : "")}>
                   <item.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                </div>
                <span className={cn(
                  "text-[9px] tracking-widest uppercase mt-1 transition-all text-center leading-none",
                  isActive ? "font-black" : "font-bold opacity-70"
                )}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>
      </main>

    </div>
  );
}
