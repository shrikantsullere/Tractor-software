import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Tractor, 
  MapPin, 
  Clock, 
  ShieldCheck, 
  Search, 
  DollarSign, 
  CreditCard, 
  WifiOff, 
  BarChart3, 
  Smartphone, 
  CheckCircle2, 
  Menu, 
  X, 
  ChevronRight, 
  ArrowRight, 
  Users, 
  Settings, 
  Bell, 
  PhoneCall, 
  Navigation 
} from 'lucide-react';
import useScrollLock from '../hooks/useScrollLock';
import { formatCurrency } from '../lib/format';

const LandingPage = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();
  const { isAuthenticated, role } = useAuth();

  // Unified scroll lock
  useScrollLock(isContactModalOpen);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Home', href: '#' },
    { name: 'How It Works', href: '#how-it-works' },
    { name: 'Features', href: '#features' },
    { name: 'Pricing', href: '#pricing' },
    { name: 'Contact', href: '#contact' },
  ];

  const fadeIn = {
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.6 }
  };

  const staggerContainer = {
    initial: {},
    whileInView: {
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const handleBookClick = () => {
    if (isAuthenticated && role) {
      navigate(`/${role}`);
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen bg-white text-[#1F2937] font-sans selection:bg-[#2E7D32] selection:text-white overflow-x-hidden">
      {/* 1. NAVBAR */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? 'bg-white shadow-md' : 'bg-transparent py-4'}`}>
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center bg-white rounded-b-2xl shadow-sm md:shadow-none md:bg-transparent">
          <div className="flex items-center space-x-3 py-4">
            <img src="/tractorlink-logo.png" alt="TractorLink Logo" className="w-12 h-12 object-contain" />
            <span className="text-2xl font-black text-[#1A2218] tracking-tight uppercase">
              Tractor <span className="text-accent">Link</span>
            </span>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
                {navLinks.map((link) => (
                  <a 
                    key={link.name} 
                    href={link.href} 
                    className="text-sm font-medium hover:text-[#2E7D32] transition-colors"
                    onClick={(e) => {
                      if (link.name === 'Contact') {
                        e.preventDefault();
                        setIsContactModalOpen(true);
                      }
                    }}
                  >
                    {link.name}
                  </a>
                ))}
            <button 
              className="bg-[#FF9800] text-white px-6 py-3 rounded-xl font-semibold hover:bg-opacity-90 transition-all transform hover:scale-105 active:scale-95 shadow-md"
              onClick={handleBookClick}
            >
              Book Tractor
            </button>
          </div>

          {/* Mobile Menu Toggle */}
          <button 
            className="md:hidden p-2 text-[#1F2937]"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>

        {/* Mobile Dropdown */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-white border-t border-[#F5F5F5] overflow-hidden px-6 pb-8 shadow-xl"
            >
              <div className="flex flex-col space-y-4 pt-6">
                {navLinks.map((link) => (
                  <a 
                    key={link.name} 
                    href={link.href} 
                    className="text-lg font-medium py-2 border-b border-[#F5F5F5]"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {link.name}
                  </a>
                ))}
                <button 
                  className="bg-[#FF9800] text-white w-full py-4 rounded-xl font-bold mt-4 shadow-lg active:scale-95 transition-transform"
                  onClick={handleBookClick}
                >
                  Book Tractor
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* 2. HERO SECTION */}
      <section className="pt-32 pb-20 md:pt-48 md:pb-32 px-6 relative overflow-hidden bg-white">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="text-left"
          >
            <span className="inline-block py-2 px-4 bg-primary/10 text-primary rounded-full text-xs font-bold uppercase tracking-wider mb-6">
              Empowering African Agriculture
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-7xl font-extrabold text-[#1A2218] leading-[1.1] mb-6">
              Book Tractors in Minutes. <br />
              <span className="text-accent">No Middlemen.</span>
            </h1>
            <p className="text-lg md:text-xl text-[#1A2218]/80 mb-10 max-w-lg leading-relaxed">
              Transparent pricing, real-time tracking, and reliable farm services powered by Freeway Agro.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <button 
                className="bg-accent text-white px-8 py-4 rounded-2xl font-bold text-lg hover:opacity-90 shadow-xl transition-all hover:translate-y-[-2px] flex items-center justify-center gap-2 group"
                onClick={handleBookClick}
              >
                Book Now <ArrowRight className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
            
            <div className="mt-12 flex items-center gap-6">
              <div className="flex -space-x-4">
                {[1,2,3,4].map(i => (
                  <div key={i} className="w-12 h-12 rounded-full border-4 border-white bg-[#F5F5F5] flex items-center justify-center overflow-hidden">
                    <img src={`https://i.pravatar.cc/150?u=tractor${i}`} alt="user" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
              <div className="text-sm">
                <p className="font-bold text-[#1A2218]">5,000+ Farmers</p>
                <p className="text-[#1A2218]/60">Trust Freeway Agro daily</p>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="relative"
          >
            <motion.div 
              animate={{ y: [0, -20, 0] }}
              transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
              className="relative z-10"
            >
              <div className="bg-white p-4 rounded-[2rem] shadow-2xl relative overflow-hidden border border-[#F5F5F5]">
                <div className="bg-[#F5F5F5] rounded-3xl overflow-hidden aspect-square flex items-center justify-center p-0">
                  <img 
                    src="/hero-tractor.png" 
                    alt="TractorLink Illustration" 
                    className="w-full h-full object-cover transform hover:scale-110 transition-transform duration-700" 
                  />
                  
                  {/* Floating Map Pin Overlay */}
                  <motion.div 
                    animate={{ y: [0, -10, 0] }}
                    transition={{ repeat: Infinity, duration: 2, delay: 0.5 }}
                    className="absolute top-8 right-8 bg-white p-3 rounded-2xl shadow-2xl border border-gray-100 flex items-center gap-2 z-20"
                  >
                    <MapPin size={22} className="text-primary" />
                    <span className="text-xs font-extrabold tracking-tight">Active Tracking</span>
                  </motion.div>
                </div>
              </div>
            </motion.div>
            
            {/* Background elements */}
            <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-accent/5 rounded-full blur-3xl -z-0"></div>
            <div className="absolute -top-10 -left-10 w-64 h-64 bg-primary/5 rounded-full blur-3xl -z-0"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-white -z-10"></div>
          </motion.div>
        </div>
      </section>

      {/* 3. HOW IT WORKS */}
      <section id="how-it-works" className="py-24 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold text-[#1A2218] mb-4">How It Works</h2>
            <p className="text-[#1A2218]/60 max-w-2xl mx-auto">Simplify your farm management with our 4-step seamless process.</p>
          </div>

          <motion.div 
            variants={staggerContainer}
            initial="initial"
            whileInView="whileInView"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
          >
            {[
              { icon: <Search />, title: "Book Service", desc: "Select your desired farm operation and tractor type." },
              { icon: <DollarSign />, title: "Get Instant Price", desc: "See transparent pricing based on size and location." },
              { icon: <Settings />, title: "Admin Dispatch", desc: "We match the best available operator for your job." },
              { icon: <CheckCircle2 />, title: "Job Completed", desc: "Track progress and pay once the job is certified." }
            ].map((step, idx) => (
              <motion.div 
                key={idx}
                variants={fadeIn}
                whileHover={{ y: -8 }}
                className="bg-white p-6 rounded-2xl group transition-all duration-300 hover:shadow-xl border border-gray-100 hover:border-primary/10"
              >
                <div className="w-12 h-12 bg-white rounded-xl shadow-md flex items-center justify-center text-primary mb-4 group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                  {React.cloneElement(step.icon, { size: 24 })}
                </div>
                <h3 className="text-lg font-bold mb-2">{step.title}</h3>
                <p className="text-sm text-[#1F2937]/70 leading-relaxed">{step.desc}</p>
                <div className="mt-4 flex items-center text-primary font-bold text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                  Step {idx + 1} <ChevronRight size={14} />
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* 4. FEATURES SECTION */}
      <section id="features" className="py-24 px-6 bg-white border-y border-gray-100">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold text-[#1A2218] mb-4">Powerful Features</h2>
            <p className="text-[#1A2218]/60 max-w-2xl mx-auto">Designed to improve efficiency and yield for every farm.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: <Navigation />, title: "Real-time Tracking", desc: "Know exactly where your tractor is and when it will arrive at your farm." },
              { icon: <CreditCard />, title: "Transparent Pricing", desc: "No hidden costs. Pricing based on distance, hectares, and fuel consumption." },
              { icon: <WifiOff />, title: "Offline Booking", desc: "Book services via USSD even without internet connectivity in rural areas." },
              { icon: <ShieldCheck />, title: "Operator Verified", desc: "All operators are vetted and jobs are monitored for quality assurance." },
              { icon: <ShieldCheck />, title: "Secure Payments", desc: "Multiple payment options including Mobile Money and card payments." },
              { icon: <BarChart3 />, title: "Data-Driven Analytics", desc: "Access comprehensive analytics to optimize your farm's productivity." }
            ].map((feature, idx) => (
              <motion.div 
                key={idx}
                variants={fadeIn}
                whileHover={{ scale: 1.02 }}
                className="bg-white p-10 rounded-2xl shadow-md flex flex-col items-start hover:shadow-2xl transition-all duration-500"
              >
                <div className="p-4 bg-primary/5 rounded-2xl text-primary mb-6">
                  {React.cloneElement(feature.icon, { size: 32 })}
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-[#1F2937]/70 leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. PRICING EXPLANATION */}
      <section id="pricing" className="py-24 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold text-[#1A2218] mb-4">Simple, Fair Pricing</h2>
            <p className="text-[#1A2218]/60 max-w-2xl mx-auto">We use a transparent formula to ensure you get the best value.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div {...fadeIn} className="bg-white p-10 rounded-[2rem] border-2 border-dashed border-[#2E7D32]/20 shadow-sm">
              <div className="space-y-6">
                <div className="flex justify-between items-center p-4 bg-white rounded-xl shadow-sm">
                  <span className="font-medium text-[#1F2937]/70">Base Price (5 ha)</span>
                  <span className="font-bold text-primary">{formatCurrency(125000)}</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-white rounded-xl shadow-sm">
                  <span className="font-medium text-[#1F2937]/70">Distance Charge (10 km)</span>
                  <span className="font-bold text-[#1F2937]">{formatCurrency(5000)}</span>
                </div>
                <div className="h-px bg-gray-200"></div>
                <div className="flex justify-between items-center p-6 bg-accent text-white rounded-2xl shadow-xl">
                  <span className="text-xl font-bold">Total Amount</span>
                  <span className="text-3xl font-extrabold text-white">{formatCurrency(130000)}</span>
                </div>
                <div className="flex justify-center">
                  <span className="inline-block py-2 px-4 bg-primary/10 text-primary rounded-full text-[10px] font-bold uppercase tracking-widest mt-4">
                    Quote valid for 48 hours
                  </span>
                </div>
              </div>
            </motion.div>

            <motion.div {...fadeIn} className="space-y-8">
              <h3 className="text-2xl md:text-3xl font-bold leading-tight">No Surprises. <br />Pay Only for What You Use.</h3>
              <ul className="space-y-6">
                {[
                  "Dynamic GPS-based calculation", 
                  "Fuel efficiency adjustments included",
                  "Verified hectare measurement",
                  "Lower rates for community group bookings"
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-4">
                    <div className="mt-1 bg-primary rounded-full p-1 text-white">
                      <CheckCircle2 size={16} />
                    </div>
                    <span className="text-lg text-[#1F2937]/80">{item}</span>
                  </li>
                ))}
              </ul>
              <button onClick={handleBookClick} className="bg-accent text-white px-8 py-4 rounded-xl font-bold shadow-lg hover:opacity-90 transition-all">
                Check My Price
              </button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 6. LIVE TRACKING PREVIEW */}
      <section className="py-24 px-6 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div {...fadeIn}>
            <h2 className="text-3xl md:text-4xl font-extrabold text-[#1A2218] mb-6">Track Your Tractor in Real-Time</h2>
            <p className="text-lg text-[#1F2937]/70 leading-relaxed mb-8">
              Experience total peace of mind. Our live GPS tracking shows you exactly where the operator is, their current speed, and estimated arrival time.
            </p>
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 border rounded-2xl border-gray-100 shadow-sm">
                <Bell className="text-accent" />
                <span className="font-medium text-sm">Arrival notification at 5km mark</span>
              </div>
              <div className="flex items-center gap-4 p-4 border rounded-2xl border-gray-100 shadow-sm">
                <Navigation className="text-primary" />
                <span className="font-medium text-sm">Real-time route optimization</span>
              </div>
            </div>
          </motion.div>

          <motion.div 
             initial={{ opacity: 0, x: 50 }}
             whileInView={{ opacity: 1, x: 0 }}
             transition={{ duration: 0.8 }}
             className="relative"
          >
            <div className="bg-[#1F2937] p-4 rounded-[2.5rem] shadow-2xl aspect-square md:aspect-video w-full overflow-hidden relative">
               {/* Map Mockup */}
               <div className="absolute inset-0 bg-[#F5F5F5] overflow-hidden">
                 <div className="w-full h-full opacity-30 pointer-events-none" style={{ backgroundImage: 'linear-gradient(#ddd 1px, transparent 1px), linear-gradient(90deg, #ddd 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
                 
                 {/* Track line */}
                 <svg className="absolute inset-0 w-full h-full">
                    <path d="M 50 150 Q 150 150 250 250 T 450 300" fill="none" stroke="#2E7D32" strokeWidth="4" strokeDasharray="8 4" />
                 </svg>

                 {/* Tractor Dot */}
                 <motion.div 
                   animate={{ 
                     x: [50, 150, 250, 450],
                     y: [150, 150, 250, 300]
                   }}
                   transition={{ repeat: Infinity, duration: 10, ease: "linear" }}
                   className="absolute bg-[#2E7D32] p-2 rounded-full shadow-lg z-10"
                 >
                   <Tractor size={20} className="text-white" />
                   <div className="absolute top-0 right-0 -mr-1 -mt-1 w-3 h-3 bg-red-500 rounded-full animate-ping"></div>
                 </motion.div>

                 {/* Destination marker */}
                 <div className="absolute right-10 bottom-20 text-red-500">
                    <MapPin size={32} fill="currentColor" />
                    <div className="bg-white px-2 py-1 rounded text-[10px] font-bold shadow-md absolute -bottom-6 -left-4 w-24 text-center">Your Farm</div>
                 </div>
               </div>

               {/* Overlay items */}
               <div className="absolute top-8 left-8 bg-white p-4 rounded-2xl shadow-xl border border-gray-100 flex items-center gap-4">
                  <div className="w-10 h-10 bg-[#F5F5F5] rounded-full overflow-hidden">
                     <img src="https://i.pravatar.cc/150?u=driver" alt="driver" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <p className="text-xs font-bold">Musa Ibrahim</p>
                    <p className="text-[10px] text-gray-500">Arriving in 14 mins</p>
                  </div>
                  <div className="ml-4 p-2 bg-primary/10 rounded-full text-primary">
                    <PhoneCall size={16} />
                  </div>
               </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 7. ADMIN POWER SECTION */}
      <section className="py-24 px-6 bg-white border-y border-gray-100">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div {...fadeIn} className="order-2 lg:order-1 grid grid-cols-2 gap-4">
              {[
                { title: "Smart Dispatch", icon: <Settings />, color: "bg-primary/5 text-primary" },
                { title: "Fuel Logic", icon: <DollarSign />, color: "bg-accent/10 text-accent" },
                { title: "Analytics", icon: <BarChart3 />, color: "bg-primary/10 text-primary" },
                { title: "Alerts", icon: <Bell />, color: "bg-accent/5 text-accent" }
              ].map((item, idx) => (
                <div key={idx} className="bg-white p-6 rounded-[2rem] shadow-sm hover:shadow-lg transition-all border border-gray-100">
                  <div className={`w-12 h-12 ${item.color} rounded-2xl flex items-center justify-center mb-4`}>
                    {React.cloneElement(item.icon, { size: 24 })}
                  </div>
                  <h4 className="font-bold text-sm">{item.title}</h4>
                </div>
              ))}
            </motion.div>

            <motion.div {...fadeIn} className="order-1 lg:order-2">
              <h2 className="text-3xl md:text-4xl font-extrabold text-[#1A2218] mb-6">Centralized Admin Power</h2>
              <p className="text-lg text-[#1F2937]/70 leading-relaxed mb-8">
                Our backend does the heavy lifting. From automated dispatch to real-time fuel price monitoring, everything is built to ensure a smooth logistics chain.
              </p>
              <div className="space-y-4">
                <p className="flex items-center gap-3 text-[#1F2937]/80 font-medium">
                  <span className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white text-[10px]">1</span>
                  AI-driven operator matching logic
                </p>
                <p className="flex items-center gap-3 text-[#1F2937]/80 font-medium">
                  <span className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white text-[10px]">2</span>
                  Detailed maintenance and repair logs
                </p>
                <p className="flex items-center gap-3 text-[#1F2937]/80 font-medium">
                  <span className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white text-[10px]">3</span>
                  Daily fuel rate adjustments for fair pricing
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 8. MULTI-ACCESS SECTION */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold mb-4">Available Everywhere</h2>
            <p className="text-[#1F2937]/60">Access TractorLink however you prefer.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { title: "Mobile App", desc: "For modern smartphone users. Available on iOS & Android.", icon: <Smartphone />, badge: "Recommended" },
              { title: "USSD Hub", desc: "No internet? Just dial *347*10# for quick booking.", icon: <WifiOff />, badge: "Offline Enabled" },
              { title: "Operator App", desc: "Dedicated tools for our fleet owners and tractor drivers.", icon: <Tractor />, badge: "Professional" }
            ].map((item, idx) => (
              <motion.div 
                key={idx} 
                {...fadeIn}
                whileHover={{ y: -5 }}
                className="p-8 rounded-3xl border border-gray-100 shadow-sm bg-white hover:shadow-xl transition-all relative overflow-hidden"
              >
                <div className="absolute top-4 right-4 bg-gray-100 text-[10px] font-bold py-1 px-3 rounded-full text-gray-500">{item.badge}</div>
                <div className="w-14 h-14 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mb-6">
                  {React.cloneElement(item.icon, { size: 30 })}
                </div>
                <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                <p className="text-[#1F2937]/70 mb-6">{item.desc}</p>
                <button className="text-accent font-bold flex items-center gap-2 group">
                  Learn More <ArrowRight className="group-hover:translate-x-1 transition-transform" />
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 9. TRUST / BENEFITS SECTION */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-3xl mx-auto text-center">
          <div className="flex justify-center mb-8">
             <ShieldCheck size={64} className="text-primary" />
          </div>
          <h2 className="text-3xl md:text-4xl font-extrabold mb-8">Built for Trust in Agriculture</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
            <div className="flex gap-4">
              <CheckCircle2 className="text-primary flex-shrink-0" />
              <div>
                <h4 className="font-bold mb-1">No Middlemen</h4>
                <p className="text-sm text-[#1F2937]/70">You connect directly with verified operators, no extra commissions.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <CheckCircle2 className="text-primary flex-shrink-0" />
              <div>
                <h4 className="font-bold mb-1">Fair Pricing</h4>
                <p className="text-sm text-[#1F2937]/70">Automated quotes mean you never get overcharged based on your profile.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <CheckCircle2 className="text-primary flex-shrink-0" />
              <div>
                <h4 className="font-bold mb-1">Reliable Operators</h4>
                <p className="text-sm text-[#1F2937]/70">Our community rating system ensures only the best stay in the network.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <CheckCircle2 className="text-primary flex-shrink-0" />
              <div>
                <h4 className="font-bold mb-1">Built for Rural Africa</h4>
                <p className="text-sm text-[#1F2937]/70">Optimized for low-bandwidth environments and vernacular support.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 10. FINAL CTA SECTION */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto bg-accent rounded-[3rem] p-12 md:p-20 text-center relative overflow-hidden shadow-2xl">
          {/* Decorative circles */}
          <div className="absolute -top-10 -left-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
          <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-primary/20 rounded-full blur-2xl"></div>
          
          <motion.div {...fadeIn}>
            <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-8">Start Booking Tractors Today</h2>
            <p className="text-white/80 text-lg mb-12 max-w-xl mx-auto">
              Join thousands of farmers across the country who are increasing their yields with Freeway Agro technology.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-6">
              <button 
                className="bg-white text-accent px-10 py-5 rounded-2xl font-bold text-lg hover:bg-white/90 shadow-xl transition-all transform hover:scale-105 active:scale-95"
                onClick={handleBookClick}
              >
                Book My First Tractor
              </button>
              <button 
                className="border-2 border-white/30 text-white px-10 py-5 rounded-2xl font-bold text-lg hover:bg-white/10 transition-all"
                onClick={() => setIsContactModalOpen(true)}
              >
                Contact Support
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 11. CONTACT MODAL */}
      <AnimatePresence>
        {isContactModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsContactModalOpen(false)}
              className="absolute inset-0 bg-[#1A2218]/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white w-full max-w-[400px] rounded-2xl md:rounded-[2.5rem] shadow-2xl overflow-hidden border border-gray-100 my-auto"
            >
              <div className="p-8 md:p-12">
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <h2 className="text-3xl font-black text-[#1A2218] mb-2 uppercase">Contact Us</h2>
                    <p className="text-sm text-[#1F2937]/60">Send us a message and we'll get back to you shortly.</p>
                  </div>
                  <button 
                    onClick={() => setIsContactModalOpen(false)}
                    className="p-2 bg-gray-100 rounded-full text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <X size={24} />
                  </button>
                </div>

                <form className="space-y-5" onSubmit={(e) => { e.preventDefault(); setIsContactModalOpen(false); alert('Message sent successfully!'); }}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-[#1A2218]">Full Name</label>
                      <input 
                        type="text" 
                        required 
                        className="w-full px-5 py-4 bg-[#F9FAFB] border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all text-sm font-medium"
                        placeholder="John Doe"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-[#1A2218]">Email Address</label>
                      <input 
                        type="email" 
                        required 
                        className="w-full px-5 py-4 bg-[#F9FAFB] border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all text-sm font-medium"
                        placeholder="john@example.com"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-[#1A2218]">Subject</label>
                    <select className="w-full px-5 py-4 bg-[#F9FAFB] border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all text-sm font-medium">
                      <option>Tractor Booking</option>
                      <option>Partnership Inquiry</option>
                      <option>Technical Support</option>
                      <option>Other</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-[#1A2218]">Your Message</label>
                    <textarea 
                      required 
                      rows="4"
                      className="w-full px-5 py-4 bg-[#F9FAFB] border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all text-sm font-medium resize-none"
                      placeholder="How can we help you?"
                    ></textarea>
                  </div>
                  <button 
                    type="submit"
                    className="w-full bg-accent text-white py-5 rounded-2xl font-black uppercase tracking-widest text-sm hover:opacity-90 shadow-xl shadow-accent/20 transition-all active:scale-95"
                  >
                    Send Message
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 12. FOOTER */}
      <footer className="py-16 px-6 bg-white border-t border-gray-100">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 pb-12 border-b border-gray-100">
            <div>
              <div className="flex items-center space-x-3 mb-6">
                <img src="/tractorlink-logo.png" alt="TractorLink Logo" className="w-10 h-10 object-contain" />
                <span className="text-xl font-black text-[#1A2218] tracking-tight uppercase">
                  Tractor <span className="text-accent">Link</span>
                </span>
              </div>
              <p className="text-sm text-[#1F2937]/50 max-w-xs">
                A Freeway Agro subsidiary powering the future of precision agriculture in Africa.
              </p>
            </div>
            
            <div className="flex flex-wrap gap-x-12 gap-y-6">
              <div className="flex flex-col space-y-3">
                <h5 className="font-bold text-sm">Company</h5>
                <a href="#" className="text-sm text-[#1F2937]/60 hover:text-primary">About Freeway Agro</a>
                <a href="#" className="text-sm text-[#1F2937]/60 hover:text-primary">Our History</a>
              </div>
              <div className="flex flex-col space-y-3">
                <h5 className="font-bold text-sm">Legal</h5>
                <a href="#" className="text-sm text-[#1F2937]/60 hover:text-primary">Terms of Service</a>
                <a href="#" className="text-sm text-[#1F2937]/60 hover:text-primary">Privacy Policy</a>
              </div>
              <div className="flex flex-col space-y-3">
                <h5 className="font-bold text-sm">Contact</h5>
                <a href="mailto:support@freewayagro.com" className="text-sm text-[#1F2937]/60 hover:text-primary">Support@freewayagro.com</a>
                <a href="tel:+2340000000" className="text-sm text-[#1F2937]/60 hover:text-primary">+234 800 TRACTOR</a>
              </div>
            </div>
          </div>
          
          <div className="pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-xs text-[#1A2218]/40">
              © 2026 Freeway Agro. All rights reserved.
            </p>
            <div className="flex items-center gap-4">
               {/* Minimal icons placeholder */}
               <div className="w-8 h-8 rounded-full bg-[#F5F5F5] flex items-center justify-center text-[#1F2937]/40 hover:text-primary transition-colors cursor-pointer"><Settings size={14} /></div>
               <div className="w-8 h-8 rounded-full bg-[#F5F5F5] flex items-center justify-center text-[#1F2937]/40 hover:text-primary transition-colors cursor-pointer"><Users size={14} /></div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
