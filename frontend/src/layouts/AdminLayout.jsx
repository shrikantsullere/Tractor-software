import { Outlet, Link, useLocation } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { LayoutDashboard, Compass, Radio, Calendar, Users, Briefcase, ListCollapse, TrendingUp, SettingsIcon, LogOut, ChevronRight, Bell, Tractor, CheckCircle2, AlertCircle, MessageSquare, Truck, Menu, X } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../context/AuthContext';

export default function AdminLayout() {
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 1024);
  const [showNotifications, setShowNotifications] = useState(false);
  const { user, logout } = useAuth();
  const notificationRef = useRef(null);
  const sidebarRef = useRef(null);

  // Only close sidebar when route changes on mobile
  useEffect(() => {
    if (window.innerWidth < 1024) {
      setIsSidebarOpen(false);
    }
  }, [location.pathname]);

  // Handle window resize - keep it simple, true for desktop
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

  const notifications = [
    { id: 1, title: 'New Booking', message: 'Farmer Ramesh booked a Mahindra 575 DI', time: '2 min ago', icon: CheckCircle2, color: 'text-earth-green', unread: true },
    { id: 2, title: 'Low Fuel Alert', message: 'Unit #T24 is below 15% fuel threshold', time: '15 min ago', icon: AlertCircle, color: 'text-red-400', unread: true },
    { id: 3, title: 'Payment Received', message: '₦4,500 received from Sanjay Kumar', time: '1 hour ago', icon: MessageSquare, color: 'text-earth-primary', unread: false },
  ];

  useEffect(() => {
    function handleClickOutside(event) {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const primaryNav = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/admin' },
    { icon: Compass, label: 'Assignments', path: '/admin/assignments' },
    { icon: Radio, label: 'Live Tracking', path: '/admin/tracking' },
  ];

  const managementNav = [
    { icon: Calendar, label: 'Bookings', path: '/admin/bookings' },
    { icon: Users, label: 'Farmers', path: '/admin/farmers' },
    { icon: Briefcase, label: 'Operators', path: '/admin/operators' },
    { icon: Truck, label: 'Fleet (Tractors)', path: '/admin/fleet' },
    { icon: ListCollapse, label: 'Payments', path: '/admin/payments' },
    { icon: TrendingUp, label: 'Reports', path: '/admin/reports' },
  ];

  const renderNavSection = (title, items) => (
    <div className="mb-6">
      <p className={cn("px-4 text-[10px] font-bold text-earth-mut uppercase tracking-widest transition-all duration-300", isSidebarOpen ? "mb-3 opacity-100" : "opacity-0 h-0 overflow-hidden mb-0")}>{title}</p>
      <div className="space-y-1.5 px-2">
        {items.map(item => {
          const isActive = location.pathname === item.path || (item.path.includes('settings') && location.pathname.includes('settings'));
          return (
            <Link key={item.path} to={item.path} title={!isSidebarOpen ? item.label : undefined} className={cn(
              "flex items-center rounded-xl text-[13px] transition-all group font-black uppercase tracking-wide",
              isSidebarOpen ? "px-4 py-3 gap-3.5 mx-2" : "justify-center py-3",
              isActive
                ? "bg-accent text-white shadow-[0_8px_25px_rgba(255,152,0,0.4)] border border-accent/20 scale-[1.02] z-10" 
                : "text-white/70 hover:bg-white/5 hover:text-white border border-transparent"
            )}>
              <item.icon size={isSidebarOpen ? 18 : 22} className={
                isActive ? "text-white shrink-0" : "text-white/50 group-hover:text-white shrink-0"
              } />
              {isSidebarOpen && <span className="whitespace-nowrap">{item.label}</span>}
            </Link>
          )
        })}
      </div>
    </div>
  );

  return (
    <div className="flex bg-earth-main min-h-screen font-sans text-earth-brown selection:bg-earth-primary/30">
      
      {/* Overlay for mobile when sidebar is open */}
      {isSidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40 animate-in fade-in duration-300"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}

      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-40 animate-in fade-in duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Dark Sidebar Section */}
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
              <span className="text-[9px] flex items-center gap-1.5 text-white/70 font-bold uppercase tracking-widest mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse"></span>
                Admin HQ
              </span>
            </div>
          </div>
          <button 
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden p-2 text-white/40 hover:text-white transition-colors shrink-0"
          >
            <X size={20} strokeWidth={2.5} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-6 overflow-x-hidden scrollbar-hide">
          {renderNavSection('Core', primaryNav)}
          {renderNavSection('Management', managementNav)}
          
          <div className="mb-6">
            <p className={cn("px-4 text-[10px] font-bold text-earth-mut uppercase tracking-widest transition-all duration-300", isSidebarOpen ? "mb-3 opacity-100" : "opacity-0 h-0 overflow-hidden mb-0")}>Configuration</p>
            <div className="space-y-1.5 px-2">
               <Link to="/admin/settings/fuel" title={!isSidebarOpen ? "Settings" : undefined} className={cn(
                  "flex items-center rounded-xl text-[13px] transition-all group font-black uppercase tracking-wide",
                  isSidebarOpen ? "px-4 py-3 gap-3.5 mx-2" : "justify-center py-3",
                  location.pathname.includes('/settings')
                    ? "bg-accent text-white shadow-[0_8px_25px_rgba(255,152,0,0.4)] border border-accent/20 scale-[1.02] z-10 " 
                    : "text-white/70 hover:bg-white/5 hover:text-white border border-transparent"
                )}>
                  <SettingsIcon size={isSidebarOpen ? 18 : 22} className={location.pathname.includes('/settings') ? "text-white shrink-0" : "text-white/50 group-hover:text-white shrink-0"} />
                  {isSidebarOpen && <span className="whitespace-nowrap">Settings</span>}
                </Link>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-earth-dark/10">
           <button onClick={logout} className={cn(
             "flex items-center text-white/60 hover:text-white hover:bg-white/5 rounded-xl transition-all w-full group",
             isSidebarOpen ? "px-4 py-3 gap-3.5 font-black text-[13px] uppercase tracking-wide" : "justify-center py-3.5"
           )} title="Sign Out">
             <LogOut size={isSidebarOpen ? 18 : 22} className="shrink-0 text-white/40 group-hover:text-white" />
             {isSidebarOpen && <span>Sign Out</span>}
           </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        
        {/* Dynamic App Header */}
        <header className="h-16 bg-earth-card/80 backdrop-blur-md border-b border-earth-dark/10 flex items-center justify-between px-4 sm:px-6 z-40 shrink-0 shadow-sm sticky top-0">
          <div className="flex items-center gap-3 sm:gap-4">
            <button 
              id="sidebar-toggle"
              onClick={(e) => {
                e.stopPropagation();
                setIsSidebarOpen(!isSidebarOpen);
              }} 
              className="lg:hidden p-2.5 bg-earth-card-alt border border-earth-dark/15 rounded-xl text-earth-sub hover:text-earth-brown transition-all shadow-inner active:scale-95 flex items-center justify-center shrink-0"
            >
              {isSidebarOpen ? <X size={20} strokeWidth={2.5} /> : <Menu size={20} strokeWidth={2.5} />}
            </button>
            
            {/* Breadcrumbs removed for clean header */}
          </div>
          
          <div className="flex items-center gap-4 text-sm relative">
            <div ref={notificationRef} className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className={cn(
                  "relative p-2 bg-earth-card-alt hover:bg-earth-card border transition-all rounded-xl",
                  showNotifications ? "border-earth-primary text-earth-primary shadow-[0_0_15px_rgba(46,125,50,0.2)]" : "border-earth-dark/15 text-earth-sub hover:text-earth-primary"
                )}
              >
                <Bell size={20} strokeWidth={2.5} />
                {notifications.some(n => n.unread) && (
                  <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 rounded-full border-2 border-neutral-900 shadow-sm animate-pulse"></span>
                )}
              </button>

              {/* Notification Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-3 w-[320px] sm:w-[380px] bg-earth-card border border-earth-dark/10 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in duration-200 origin-top-right">
                  <div className="p-4 border-b border-earth-dark/10 flex items-center justify-between bg-earth-card-alt/50">
                    <h3 className="font-black text-xs uppercase tracking-widest text-earth-brown">Notifications</h3>
                    <button className="text-[10px] uppercase font-black text-earth-primary hover:text-earth-brown transition-colors">Mark all read</button>
                  </div>
                  <div className="max-h-[400px] overflow-y-auto scrollbar-hide">
                    {notifications.length > 0 ? notifications.map((n) => (
                      <div key={n.id} className={cn(
                        "p-4 border-b border-earth-dark/10/50 hover:bg-earth-card-alt/50 transition-colors cursor-pointer group",
                        n.unread && "bg-earth-primary/[0.02]"
                      )}>
                        <div className="flex gap-4">
                          <div className={cn("w-10 h-10 rounded-xl bg-earth-card border border-earth-dark/10 flex items-center justify-center shrink-0 group-hover:border-earth-dark/15 transition-colors", n.color)}>
                            <n.icon size={18} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start mb-0.5">
                              <p className="text-sm font-black text-earth-brown group-hover:text-earth-primary transition-colors">{n.title}</p>
                              <span className="text-[10px] font-bold text-earth-mut whitespace-nowrap">{n.time}</span>
                            </div>
                            <p className="text-xs text-earth-sub leading-relaxed line-clamp-2">{n.message}</p>
                          </div>
                        </div>
                      </div>
                    )) : (
                      <div className="p-10 text-center">
                        <p className="text-xs font-bold text-earth-mut uppercase tracking-widest">No new alerts</p>
                      </div>
                    )}
                  </div>
                  <div className="p-3 bg-earth-card-alt/30 text-center">
                    <button className="text-[10px] uppercase font-black text-earth-mut hover:text-earth-brown transition-colors">See all alerts</button>
                  </div>
                </div>
              )}
            </div>
            
            <div className="h-6 w-px bg-earth-card-alt hidden sm:block"></div>
            
            <div className="flex items-center gap-3 cursor-pointer group">
              <div className="text-right hidden lg:block">
                <p className="font-bold text-earth-brown leading-none group-hover:text-earth-primary transition-colors">{user?.name || 'Admin User'}</p>
                <p className="text-[10px] text-earth-mut font-semibold mt-1 tracking-widest uppercase">{user?.email || 'Central Command'}</p>
              </div>
              <div className="w-9 h-9 rounded-full bg-earth-card-alt flex items-center justify-center text-earth-primary font-black border border-earth-dark/15 shadow-sm group-hover:border-earth-primary/50 group-hover:shadow transition-all shrink-0">
                {(user?.name || 'A').charAt(0)}
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden transition-all duration-300 relative scrollbar-hide overscroll-y-none">
          {/* Subtle noise/grid background overlay */}
          <div className="absolute inset-0 pointer-events-none opacity-[0.02]" style={{ backgroundImage: 'radial-gradient(circle at center, white 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
          <div className="p-4 md:p-8 max-w-[1600px] mx-auto min-h-full relative z-10">
            <Outlet />
          </div>
        </div>
      </main>

    </div>
  );
}
