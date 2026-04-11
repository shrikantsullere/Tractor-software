import { useState, useEffect } from 'react';
import { CreditCard, Wallet, Building, ArrowUpRight, Download, X, CheckCircle, Clock, ShieldCheck, ChevronRight, Smartphone } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useBookings } from '../../context/BookingContext';
import { api } from '../../lib/api';
import { Badge } from '../../components/ui/Badge';
import { cn } from '../../lib/utils';
import { formatCurrency } from '../../lib/format';
import useScrollLock from '../../hooks/useScrollLock';

export default function Payments() {
  const { fetchBookings } = useBookings();
  const [pendingData, setPendingData] = useState({ bookings: [], totalOutstanding: 0 });
  const [isLoading, setIsLoading] = useState(true);
  
  const [selectedTx, setSelectedTx] = useState(null);
  const [paymentPortal, setPaymentPortal] = useState({ open: false, type: '', amount: 0, targetId: null });
  const [paymentStep, setPaymentStep] = useState('method'); // method | processing | success

  // Lock background scroll when any modal is open
  useScrollLock(selectedTx || paymentPortal.open);

  const fetchPending = async () => {
    try {
      setIsLoading(true);
      const result = await api.payments.getPending();
      if (result.success) {
        setPendingData(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch pending bookings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const handlePayFull = () => {
    setPaymentPortal({ open: true, type: 'Full Settlement', amount: pendingData.totalOutstanding, targetId: 'ALL' });
    setPaymentStep('method');
  };

  const startPayment = async () => {
    try {
      setPaymentStep('processing');
      
      if (paymentPortal.targetId === 'ALL') {
        await api.payments.settleAll();
      } else {
        await api.payments.payBooking({
          bookingId: paymentPortal.targetId,
          amount: paymentPortal.amount,
          method: 'card' // Default for now
        });
      }
      
      // Refresh both local and global booking state
      await fetchPending();
      await fetchBookings();
      
      setPaymentStep('success');
    } catch (error) {
      alert(error.message || 'Payment failed');
      setPaymentStep('method');
    }
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 md:space-y-7 max-w-6xl mx-auto relative pb-24 md:pb-8">
      {/* Compact Header */}
      <header className="border-b border-earth-dark/10 pb-5 flex flex-col sm:flex-row justify-between sm:items-end gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-black tracking-tight text-earth-brown uppercase italic">Finance & Ledger</h1>
          <p className="text-[9px] text-earth-mut font-black uppercase tracking-widest mt-1">Real-time payment tracking & settlements</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
        
        {/* Left Column: Balance & Methods */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-6">
          {/* Balance Card - More Compact */}
          <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
            <Card className="bg-earth-dark text-earth-main border-earth-dark/10 shadow-xl relative overflow-hidden rounded-3xl group border-l-2 border-l-earth-primary">
              <div className="absolute top-0 right-0 p-6 opacity-[0.02] transform translate-x-4 -translate-y-4 group-hover:scale-110 transition-transform duration-700">
                <Wallet size={120} />
              </div>
              <CardContent className="p-6 md:p-8 relative z-10">
                <p className="text-earth-mut text-[9px] font-black tracking-widest uppercase mb-2">Total Outstanding</p>
                <div className="flex items-baseline gap-1.5 mb-6">
                  <h2 className="text-4xl md:text-5xl font-black tracking-tighter text-earth-main tabular-nums">{formatCurrency(pendingData.totalOutstanding)}</h2>
                </div>
                <Button 
                  onClick={handlePayFull}
                  disabled={pendingData.totalOutstanding <= 0 || isLoading}
                  className="w-full bg-accent text-white hover:opacity-90 h-12 font-black uppercase tracking-widest text-[9px] rounded-xl shadow-lg shadow-accent/20 active:scale-95 transition-all"
                >
                  {isLoading ? 'Loading...' : 'Settle All Dues'}
                </Button>
                <div className="text-[8px] text-center text-earth-mut font-bold uppercase tracking-widest mt-4 flex items-center justify-center gap-2">
                   <ShieldCheck size={12} className="text-earth-green/50" /> Secure Gateway Active
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Payment Methods - Compact */}
          <div className="space-y-3">
            <h3 className="font-black text-[9px] text-earth-mut uppercase tracking-widest px-1">Saved Gateways</h3>
            <div className="grid grid-cols-1 gap-2">
              {[
                { label: 'Cloud Payments', sub: 'VISA, MC, RUPAY', icon: CreditCard, color: 'text-blue-500/70' },
                { label: 'UPI Instant Hub', sub: 'GPAY, AMAZON PAY', icon: Smartphone, color: 'text-earth-green/70' },
                { label: 'Net Banking', sub: 'ALL MAJOR BANKS', icon: Building, color: 'text-orange-500/70' }
              ].map((m, i) => (
                <Card key={i} className="bg-earth-card/50 border border-earth-dark/10 hover:border-earth-dark/15 cursor-pointer transition-all group rounded-2xl active:scale-[0.98]">
                  <CardContent className="p-3.5 flex items-center gap-3.5">
                    <div className={cn("w-9 h-9 rounded-xl bg-earth-main border border-earth-dark/10 flex items-center justify-center shrink-0 group-hover:scale-105 transition-all", m.color)}>
                      <m.icon size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-black text-[10px] text-earth-brown uppercase tracking-wide">{m.label}</h4>
                      <p className="text-[8px] uppercase font-bold tracking-widest text-earth-mut mt-0.5 truncate">{m.sub}</p>
                    </div>
                    <ChevronRight size={14} className="text-earth-mut group-hover:text-earth-primary transition-colors" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Actions Log */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-5">
          <div className="flex justify-between items-center mb-1 px-1">
            <h3 className="font-black text-[9px] text-earth-mut uppercase tracking-widest">Pending & Recent Actions</h3>
          </div>
          
          <div className="space-y-4">
            {isLoading ? (
              <div className="py-20 text-center">
                <Clock className="animate-spin mx-auto text-earth-primary mb-4" size={32} />
                <p className="text-[10px] font-black uppercase text-earth-mut">Syncing with Ledger...</p>
              </div>
            ) : pendingData.bookings.length > 0 ? pendingData.bookings.map((booking, idx) => {
              return (
                <motion.div 
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  key={booking.id} 
                  className="bg-white rounded-[2rem] shadow-[0_10px_35px_rgba(0,0,0,0.05)] flex flex-col sm:flex-row justify-between sm:items-center p-5 md:p-6 hover:shadow-[0_15px_45px_rgba(0,0,0,0.08)] transition-all group relative border-none"
                >
                  <div className="flex items-center gap-4 cursor-pointer flex-1" onClick={() => setSelectedTx(booking)}>
                    <div className="w-10 h-10 rounded-xl bg-earth-card border border-earth-dark/10 text-earth-mut flex items-center justify-center shrink-0 group-hover:text-earth-primary group-hover:border-earth-primary/20 transition-all">
                      <ArrowUpRight size={18} className="group-hover:rotate-45 transition-transform" />
                    </div>
                    <div>
                      <p className="font-black text-xs md:text-sm text-earth-brown group-hover:text-earth-brown transition-colors uppercase italic">{booking.serviceType}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                         <p className="text-[8px] uppercase font-black tracking-widest text-earth-mut">{new Date(booking.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric'})}</p>
                         <span className="w-1 h-1 bg-earth-card-alt rounded-full"></span>
                         <p className="text-[8px] uppercase font-black text-earth-mut tracking-widest">#{booking.id}</p>
                      </div>
                    </div>
                  </div>
                  <div className="sm:text-right flex items-center sm:items-end justify-between sm:justify-center mt-3 sm:mt-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-earth-dark/10 gap-5">
                    <div className="hidden sm:block">
                      <p className="font-black text-base md:text-lg text-earth-brown block tabular-nums tracking-tighter">{formatCurrency(booking.remainingAmount)}</p>
                      <Badge className={cn(
                        "mt-1 text-[8px] px-2 py-0 border-none font-black uppercase tracking-widest",
                        booking.paymentStatus === 'full' ? 'bg-earth-primary/10 text-earth-green' : 
                        booking.paymentStatus === 'partial' ? 'bg-blue-500/10 text-blue-400' : 
                        'bg-orange-500/10 text-orange-400'
                      )}>
                        {booking.paymentStatus}
                      </Badge>
                    </div>

                    {booking.paymentStatus !== 'full' && (
                      <Button 
                        onClick={() => {
                          setPaymentPortal({ open: true, type: `Payment for ${booking.serviceType}`, amount: booking.remainingAmount, targetId: booking.id });
                          setPaymentStep('method');
                        }}
                        className="bg-accent text-white hover:opacity-90 px-5 h-9 font-black uppercase tracking-widest text-[8px] rounded-lg shadow-lg shadow-accent/10 transition-all"
                      >
                        Pay Now
                      </Button>
                    )}
                    
                    {/* Mobile Only Amount Display */}
                    <div className="sm:hidden text-right">
                       <p className="font-black text-lg text-earth-brown tabular-nums tracking-tighter">{formatCurrency(booking.remainingAmount)}</p>
                       <p className={cn(
                         "text-[7px] font-black uppercase tracking-widest",
                         booking.paymentStatus === 'full' ? 'text-earth-green' : 
                         booking.paymentStatus === 'partial' ? 'text-blue-400' : 'text-orange-400'
                       )}>{booking.paymentStatus}</p>
                    </div>
                  </div>
                </motion.div>
              );
            }) : (
              <div className="py-20 text-center bg-white rounded-[2.5rem] shadow-[0_15px_35px_rgba(0,0,0,0.05)]">
                <CheckCircle className="mx-auto mb-4 text-earth-green/20" size={40} />
                <p className="text-[10px] font-black uppercase tracking-widest text-earth-brown italic">Zero Dues Recorded</p>
                <p className="text-[8px] font-bold text-earth-mut uppercase tracking-widest mt-2">You are all caught up with your payments!</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Transaction Detail Modal - Scaled Down */}
      <AnimatePresence>
        {selectedTx && (
          <div className="fixed inset-0 z-[100000] flex items-start md:items-center justify-center p-4 overflow-y-auto py-12 md:py-20">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedTx(null)} className="absolute inset-0 bg-earth-dark/95 backdrop-blur-xl" />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-earth-card border border-earth-dark/10 w-full max-w-[400px] rounded-2xl md:rounded-[2.5rem] overflow-hidden shadow-2xl relative z-10 my-auto">
              <div className="p-6 border-b border-earth-dark/10 bg-earth-card/30 flex justify-between items-center">
                 <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-earth-primary rounded-xl flex items-center justify-center text-earth-brown">
                       <ArrowUpRight size={20} />
                    </div>
                    <div>
                       <h3 className="font-black text-lg text-earth-brown uppercase italic leading-none">Receipt</h3>
                       <p className="text-[8px] font-black text-earth-mut uppercase tracking-widest mt-1">ID #{selectedTx.id}</p>
                    </div>
                 </div>
                 <button onClick={() => setSelectedTx(null)} className="text-earth-mut hover:text-earth-brown transition-colors"><X size={20} /></button>
              </div>
              <div className="p-6 space-y-4">
                 <div className="space-y-3 bg-earth-card/50 border border-earth-dark/10 p-5 rounded-2xl">
                    <div className="flex justify-between items-center text-[10px] font-black text-earth-mut uppercase tracking-widest">
                       <span>Service Unit</span>
                       <span className="text-earth-brown">{selectedTx.serviceType}</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-black text-earth-mut uppercase tracking-widest border-t border-earth-dark/10/50 pt-3">
                       <span className="text-earth-primary">Total Dues</span>
                       <span className="text-xl text-earth-brown font-black tabular-nums tracking-tighter">{formatCurrency(selectedTx.totalAmount)}</span>
                    </div>
                 </div>
                 <div className="grid grid-cols-2 gap-3">
                    <Button onClick={() => alert('Receipt downloaded')} variant="outline" className="h-12 rounded-xl border-earth-dark/10 text-earth-mut font-black uppercase tracking-widest text-[8px] hover:text-earth-brown">PDF Receipt</Button>
                    <Button className="h-12 rounded-xl bg-accent text-white font-black uppercase tracking-widest text-[8px]">Print</Button>
                 </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Payment Portal - Compact */}
      <AnimatePresence>
        {paymentPortal.open && (
          <div className="fixed inset-0 z-[110000] flex items-start md:items-center justify-center p-4 overflow-y-auto py-12 md:py-20">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-earth-dark/90 backdrop-blur-3xl" />
            
            <motion.div 
               initial={{ y: 10, opacity: 0 }} 
               animate={{ y: 0, opacity: 1 }} 
               exit={{ y: 10, opacity: 0 }}
               className="bg-earth-card border border-earth-dark/10 w-full max-w-[400px] rounded-2xl md:rounded-[2.5rem] overflow-hidden shadow-2xl relative z-10 border-t-2 border-t-accent my-auto"
            >
              {paymentStep === 'method' && (
                <div className="p-7 space-y-6">
                  <div className="flex justify-between items-start">
                    <div>
                       <h3 className="text-2xl font-black text-earth-brown italic leading-none">Checkout</h3>
                       <p className="text-[8px] font-black text-earth-mut uppercase tracking-widest mt-2">{paymentPortal.type}</p>
                    </div>
                    <button onClick={() => setPaymentPortal({ ...paymentPortal, open: false })} className="text-earth-mut hover:text-earth-brown transition-colors"><X size={20} /></button>
                  </div>

                  <div className="bg-earth-card border border-earth-dark/10 p-5 rounded-2xl text-center">
                     <p className="text-[8px] font-black text-earth-mut uppercase tracking-widest mb-1.5">Amount Payable</p>
                     <p className="text-3xl font-black text-earth-brown italic tracking-tighter">{formatCurrency(paymentPortal.amount)}</p>
                  </div>

                  <div className="space-y-2">
                     <button onClick={startPayment} className="w-full h-14 bg-earth-card border border-earth-dark/10 rounded-xl px-4 flex items-center justify-between transition-all group">
                        <div className="flex items-center gap-3">
                           <CreditCard size={18} className="text-accent" />
                           <span className="font-black text-xs text-earth-brown uppercase italic">Credit Card</span>
                        </div>
                        <ArrowUpRight size={16} className="text-earth-mut" />
                     </button>
                     <button onClick={startPayment} className="w-full h-14 bg-earth-card border border-earth-dark/10 rounded-xl px-4 flex items-center justify-between transition-all group">
                        <div className="flex items-center gap-3">
                           <Building size={18} className="text-earth-green" />
                           <span className="font-black text-xs text-earth-brown uppercase italic">UPI / QR</span>
                        </div>
                        <ArrowUpRight size={16} className="text-earth-mut" />
                     </button>
                  </div>
                  <p className="text-[7px] text-center text-earth-mut font-bold uppercase tracking-widest">Encrypted Gateways Active</p>
                </div>
              )}

              {paymentStep === 'processing' && (
                <div className="p-12 flex flex-col items-center justify-center text-center space-y-4">
                  <Clock className="w-16 h-16 text-earth-primary animate-spin" strokeWidth={1.5} />
                  <div>
                    <h3 className="text-lg font-black text-earth-brown uppercase italic">Processing</h3>
                    <p className="text-[10px] text-earth-mut font-bold mt-1">Verifying secure channel...</p>
                  </div>
                </div>
              )}

              {paymentStep === 'success' && (
                <div className="p-10 text-center space-y-6">
                   <div className="w-16 h-16 bg-accent rounded-2xl flex items-center justify-center text-white mx-auto shadow-lg shadow-orange-500/20">
                      <CheckCircle size={32} strokeWidth={2.5} />
                   </div>
                   <div>
                     <h3 className="text-xl font-black text-earth-brown italic">Payment Done</h3>
                     <p className="text-[10px] text-earth-mut font-bold mt-1 uppercase tracking-widest">Transfer Verified</p>
                   </div>
                   <Button onClick={() => setPaymentPortal({ ...paymentPortal, open: false })} className="w-full h-12 bg-earth-card-alt text-earth-brown font-black uppercase tracking-widest rounded-xl text-[10px] hover:bg-earth-card">Done</Button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style dangerouslySetInnerHTML={{ __html: `
      `}} />
    </div>
  );
}
