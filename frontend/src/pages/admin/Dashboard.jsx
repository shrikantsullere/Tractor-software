import { useState, useEffect } from 'react';
import { 
  Users, Tractor, Banknote, Navigation, ArrowUpRight, ArrowDownRight, 
  Activity, Clock, MapPin, CheckCircle, AlertCircle, Fuel, Battery,
  MoreVertical, ShieldCheck, Zap
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { api } from '../../lib/api';
import { cn } from '../../lib/utils';

export default function Dashboard() {
  const [assignmentStatus, setAssignmentStatus] = useState(null);
  
  // Dashboard state variables mapped to backend
  const [metrics, setMetrics] = useState({ active_jobs: 0, pending_assignment: 0, fleet_ready: 0, total_revenue: 0 });
  const [assignmentQueue, setAssignmentQueue] = useState([]);
  const [revenueChart, setRevenueChart] = useState({ labels: [], data: [] });
  const [fleetData, setFleetData] = useState([]);
  const [timeframe, setTimeframe] = useState('daily');
  
  const [isLoading, setIsLoading] = useState(true);
  const [isChartLoading, setIsChartLoading] = useState(false);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        const [metricsRes, queueRes, fleetRes] = await Promise.all([
          api.admin.getDashboardMetrics(),
          api.admin.getAssignmentQueue(),
          api.admin.getDashboardFleet()
        ]);
        
        if (metricsRes?.success) setMetrics(metricsRes.data);
        if (queueRes?.success) setAssignmentQueue(queueRes.data);
        if (fleetRes?.success) setFleetData(fleetRes.data);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  useEffect(() => {
    const fetchRevenueData = async () => {
      try {
        setIsChartLoading(true);
        const revenueRes = await api.admin.getDashboardRevenue(timeframe);
        if (revenueRes?.success) setRevenueChart(revenueRes.data);
      } catch (error) {
        console.error('Failed to fetch revenue:', error);
      } finally {
        setIsChartLoading(false);
      }
    };
    fetchRevenueData();
  }, [timeframe]);
  
  const stats = [
    { title: 'Active Jobs', value: metrics.active_jobs, icon: Activity, trend: '+2', up: true },
    { title: 'Pending Assignment', value: metrics.pending_assignment, icon: Clock, trend: `${metrics.pending_assignment} New`, up: true, highlight: metrics.pending_assignment > 0 },
    { title: 'Fleet Ready', value: metrics.fleet_ready, icon: Tractor, trend: 'Optimal', up: true },
    { title: 'Total Revenue', value: `₦${metrics.total_revenue.toLocaleString()}`, icon: Banknote, trend: '+18%', up: true },
  ];

  const handleAssign = (bookingId) => {
    window.location.hash = `#/admin/assignments?bookingId=${bookingId}`;
  };

  const chartMax = Math.max(...(revenueChart.data?.length ? revenueChart.data : [1000]));

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-10 relative">
      {/* Subtle Background Elements */}
      <div className="absolute -top-20 -right-20 w-64 h-64 bg-earth-primary/5 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute top-1/2 -left-20 w-64 h-64 bg-earth-accent/5 blur-[120px] rounded-full pointer-events-none"></div>

      
      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <Card key={i} className={cn(
            "relative border-none overflow-hidden hover:scale-[1.02] active:scale-[0.98] transition-all duration-500 transition-shadow",
            stat.highlight ? "bg-white shadow-[0_20px_50px_rgba(234,179,8,0.15)]" : "bg-white shadow-[0_15px_35px_rgba(0,0,0,0.05)]"
          )}>
            {/* Top Accent Bar */}
            <div className={cn("absolute top-0 left-0 w-full h-1.5", 
              i === 0 ? "bg-blue-500" : i === 1 ? "bg-earth-accent" : i === 2 ? "bg-earth-green" : "bg-earth-green-dark"
            )}></div>
            
            <CardContent className="p-6 relative z-10 flex flex-col h-full">
              <div className="flex justify-between items-start mb-6">
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-earth-mut">{stat.title}</p>
                  <h3 className="text-3xl font-black tracking-tighter text-earth-brown tabular-nums leading-none">{stat.value}</h3>
                </div>
                <div className={cn(
                  "w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner shrink-0 group-hover:rotate-6 transition-transform duration-500",
                  stat.highlight ? "bg-earth-accent/10 text-earth-accent border border-earth-accent/20" : "bg-earth-card border border-earth-dark/10 text-earth-primary"
                )}>
                  <stat.icon size={26} className={stat.highlight ? 'animate-pulse' : ''} />
                </div>
              </div>
              
              <div className="mt-auto flex items-center justify-between pt-4 border-t border-earth-dark/[0.05]">
                <div className="flex items-center gap-1.5">
                  <span className={cn(
                    "flex items-center text-[10px] font-black px-2 py-0.5 rounded-full",
                    stat.up ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'
                  )}>
                    {stat.up && stat.trend.includes('%') ? <ArrowUpRight size={12} className="mr-1" /> : null}
                    {stat.trend}
                  </span>
                  <span className="text-[9px] uppercase tracking-widest font-black text-earth-mut/70">Vs Last Phase</span>
                </div>
                <Activity size={12} className="text-earth-mut/30" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* DISPATCH QUEUE */}
        <div className="lg:col-span-8 space-y-5">
          <Card className="bg-white border-none shadow-[0_20px_50px_rgba(0,0,0,0.08)] rounded-[2rem] overflow-hidden">
            <CardHeader className="border-b border-earth-dark/5 pb-5 pt-7 px-8 flex flex-row items-center justify-between bg-white">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-earth-primary/10 rounded-lg flex items-center justify-center text-earth-primary border border-earth-primary/20">
                  <Zap size={16} />
                </div>
                <CardTitle className="text-base font-black text-earth-brown uppercase tracking-wide">Assignment Queue</CardTitle>
              </div>
              <Badge className="bg-earth-card border-earth-dark/15 text-earth-sub text-[10px] uppercase font-black tracking-widest px-3 py-1">
                {metrics.pending_assignment} Awaiting Allocation
              </Badge>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-earth-dark text-white rounded-t-xl overflow-hidden">
                    <tr>
                      <th className="px-3 md:px-6 py-5 text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em]">Deployment Identity</th>
                      <th className="px-3 md:px-6 py-5 text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em]">Classification</th>
                      <th className="px-3 md:px-6 py-5 text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em]">Operational Zone</th>
                      <th className="px-3 md:px-6 py-5 text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em]">Valuation</th>
                      <th className="px-3 md:px-6 py-5 text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] text-right">Commander Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-earth-dark/5">
                    {isLoading ? (
                      <tr>
                        <td colSpan={5} className="py-20 text-center">
                          <Clock className="animate-spin mx-auto text-earth-primary mb-4" size={24} />
                          <p className="text-[10px] font-black uppercase text-earth-mut">Syncing Assignment Queue...</p>
                        </td>
                      </tr>
                    ) : assignmentQueue.length > 0 ? assignmentQueue.map((booking) => {
                      return (
                        <tr key={booking.id} className="group hover:bg-earth-card transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="px-2 py-1 rounded-md bg-earth-card border border-earth-dark/10 flex items-center justify-center text-[9px] uppercase tracking-widest font-black text-earth-mut">
                                {booking.id}
                              </div>
                              <span className="font-bold text-earth-brown text-sm">{booking.farmer_name}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest border-earth-dark/15 bg-earth-card/50 text-earth-brown">
                              {booking.service_type}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 text-xs font-bold text-earth-sub">
                            <div>{booking.land_size} Hectares</div>
                            <div className="text-[10px] opacity-60 flex items-center gap-1"><MapPin size={10} /> {booking.location || 'Standard Zone'}</div>
                          </td>
                          <td className="px-6 py-4 text-xs font-black text-primary">
                            ₦{booking.total_price.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-2">
                              <Button 
                                onClick={() => handleAssign(booking.id)}
                                disabled={assignmentStatus === booking.id}
                                className="bg-earth-accent hover:bg-earth-accent/90 text-white h-9 px-6 text-[10px] font-black uppercase tracking-widest rounded-xl shadow-[0_4px_15px_rgba(255,152,0,0.3)] hover:scale-105 active:scale-95 transition-all border-none"
                              >
                                {assignmentStatus === booking.id ? "SYNCING..." : "ASSIGN UNIT"}
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    }) : (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-earth-mut font-bold uppercase text-[10px] tracking-widest">
                           All jobs assigned
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Revenue Chart Refinement */}
          <Card className="bg-earth-card-alt border border-earth-dark/10 rounded-[1.5rem] overflow-hidden">
             <div className="p-6 border-b border-earth-dark/10 flex justify-between items-center">
                <h3 className="text-sm font-black text-earth-brown uppercase tracking-widest">Revenue Analytics</h3>
                <div className="flex gap-2">
                   {['Hourly', 'Daily', 'Weekly'].map(t => {
                     const isActive = t.toLowerCase() === timeframe;
                     return (
                       <button 
                         key={t} 
                         onClick={() => setTimeframe(t.toLowerCase())}
                         className={cn("text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-md border transition-all", isActive ? "bg-earth-primary text-earth-brown border-earth-primary shadow-[0_0_10px_rgba(234,179,8,0.3)]" : "bg-earth-card text-earth-mut border-earth-dark/10 hover:text-earth-brown")}
                       >
                         {t}
                       </button>
                     );
                   })}
                </div>
             </div>
             <div className="p-6 h-64 relative bg-earth-card/20 flex items-end justify-around gap-2">
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'linear-gradient(to right, #404040 1px, transparent 1px), linear-gradient(to bottom, #404040 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
                
                {/* Dynamic Bar Chart Implementation based on API Data */}
                {revenueChart?.labels?.map((label, index) => {
                  const val = revenueChart.data[index] || 0;
                  const heightPercentage = Math.min(Math.max((val / chartMax) * 100, 8), 100);

                  return (
                    <div key={index} className="flex flex-col items-center justify-end h-full z-10 w-full max-w-[42px] group relative">
                      {/* Tooltip on hover */}
                      <div className="absolute bottom-full mb-3 hidden group-hover:flex flex-col items-center z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
                        <div className="bg-earth-dark text-white text-[10px] font-black px-3 py-2 rounded-xl shadow-2xl whitespace-nowrap">
                          ₦{val.toLocaleString()}
                        </div>
                        <div className="w-2 h-2 bg-earth-dark rotate-45 -mt-1"></div>
                      </div>

                      <div 
                        className="w-full bg-gradient-to-t from-earth-primary via-earth-primary/70 to-earth-primary/30 hover:brightness-110 rounded-xl transition-all duration-500 cursor-pointer shadow-[0_4px_15px_rgba(46,125,50,0.2)] relative"
                        style={{ height: `${heightPercentage}%` }}
                      >
                         <div className="absolute bottom-0 left-0 w-full h-1.5 bg-earth-primary-dark/30 rounded-b-xl"></div>
                      </div>
                      <div className="text-[10px] font-black text-earth-brown/70 mt-4 tracking-widest group-hover:text-earth-primary transition-colors uppercase whitespace-nowrap">{label}</div>
                    </div>
                  );
                })}
                {/* Empty State mapping */}
                {isChartLoading ? (
                   <div className="absolute inset-0 flex items-center justify-center text-[10px] font-black uppercase tracking-widest text-earth-mut gap-2">
                      <Clock className="animate-spin text-earth-primary" size={14} /> Loading Data...
                   </div>
                ) : revenueChart?.labels?.length === 0 ? (
                   <div className="absolute inset-0 flex items-center justify-center text-[10px] font-black uppercase tracking-widest text-earth-mut">
                      No recent revenue data
                   </div>
                ) : null}
             </div>
          </Card>
        </div>

        {/* FLEET MONITORING */}
        <div className="lg:col-span-4 space-y-5">
           <Card className="bg-white border-none shadow-[0_20px_50px_rgba(0,0,0,0.08)] rounded-[2rem] overflow-hidden flex flex-col h-full">
            <CardHeader className="border-b border-earth-dark/5 pb-5 pt-7 px-8 shrink-0 bg-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-earth-primary shadow-[0_0_8px_rgba(234,179,8,0.5)] animate-pulse"></div>
                   <CardTitle className="text-base font-black text-earth-brown uppercase tracking-wide">Live Fleet</CardTitle>
                </div>
                <Badge variant="outline" className="text-[9px] font-black uppercase tracking-[0.2em] border-emerald-500/20 text-earth-green bg-earth-primary/5 px-2">
                  Live GPS
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0 flex-1 flex flex-col">
              {/* GPS UI remains */}
              <div className="h-[200px] bg-earth-main relative flex items-center justify-center border-b border-earth-dark/10 shrink-0 group">
                 <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at center, #fbbf24 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
                 
                 <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border border-earth-dark/10 rounded-full opacity-20 animate-spin-slow"></div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 border border-earth-dark/10 rounded-full opacity-40"></div>
                 </div>

                 <p className="text-earth-mut font-black text-[10px] tracking-widest z-10 uppercase bg-earth-main px-4 py-1 border border-earth-dark/10 rounded-full">HQ Range: 50km</p>
                 
                 <div className="absolute top-1/4 left-1/3 w-3 h-3 bg-earth-primary rounded-full shadow-[0_0_15px_rgba(234,179,8,0.5)]"><div className="absolute inset-0 bg-earth-primary rounded-full animate-ping opacity-75"></div></div>
                 <div className="absolute top-1/2 right-1/3 w-3 h-3 bg-earth-primary rounded-full shadow-[0_0_15px_rgba(16,185,129,0.5)]"><div className="absolute inset-0 bg-earth-primary rounded-full animate-ping opacity-75"></div></div>
              </div>

              <div className="p-5 space-y-3 flex-1 overflow-y-auto bg-earth-card/30 scrollbar-hide max-h-[400px]">
                <h4 className="text-[10px] font-black text-earth-mut uppercase tracking-[0.2em] mb-4 pl-1">Operational Fleet Deployment</h4>
                {isLoading ? (
                  <div className="py-20 text-center">
                    <Activity className="animate-spin mx-auto text-earth-primary/40 mb-3" size={20} />
                    <p className="text-[9px] font-black uppercase tracking-widest text-earth-mut">Scanning Fleet...</p>
                  </div>
                ) : fleetData.length === 0 ? (
                  <div className="py-20 text-center bg-earth-main/50 rounded-[2rem] border border-dashed border-earth-dark/10">
                    <Tractor className="mx-auto text-earth-mut/20 mb-3" size={32} />
                    <p className="text-[9px] font-black text-earth-mut uppercase tracking-widest">No Active Units Found</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {fleetData.map((t, index) => (
                      <div key={index} className="p-5 rounded-[1.5rem] bg-white border border-earth-dark/[0.03] shadow-[0_10px_30px_rgba(0,0,0,0.03)] hover:shadow-[0_20px_50px_rgba(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-300 group overflow-hidden relative">
                        {/* Inner soft glow */}
                        <div className={cn("absolute top-0 right-0 w-32 h-32 blur-3xl opacity-10 rounded-full -mr-16 -mt-16 pointer-events-none", 
                          t.status?.toLowerCase() === 'available' ? 'bg-earth-green' : 'bg-earth-accent'
                        )}></div>
                        
                        <div className="flex justify-between items-start mb-5 relative z-10">
                          <div className="flex items-center gap-4">
                            <div className={cn(
                              "w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner transition-all transform group-hover:rotate-6 duration-500",
                              t.status?.toLowerCase() === 'available' ? 'bg-emerald-50 text-earth-green border border-emerald-100' : 
                              t.status?.toLowerCase() === 'in_use' ? 'bg-amber-50 text-earth-accent border border-amber-100' : 
                              'bg-red-50 text-red-500 border border-red-100'
                            )}>
                               <Tractor size={24} />
                            </div>
                            <div className="space-y-0.5" style={{ minWidth: 0 }}>
                              <p className="font-black text-earth-brown text-base tracking-tight truncate">{t.operator_name}</p>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] text-earth-mut font-black uppercase tracking-widest truncate">{t.tractor_model}</span>
                                <div className="w-1 h-1 bg-earth-dark/10 rounded-full shrink-0"></div>
                                <span className="text-[9px] text-earth-mut font-black uppercase tracking-[0.2em] shrink-0">UNIT #T-{t.id}</span>
                              </div>
                            </div>
                          </div>
                          <div className={cn(
                            "text-[8px] px-3 py-1 font-black uppercase tracking-[0.2em] rounded-full shadow-sm text-white shrink-0",
                            t.status?.toLowerCase() === 'available' ? 'bg-earth-green shadow-emerald-500/20' : 
                            t.status?.toLowerCase() === 'in_use' ? 'bg-earth-accent shadow-amber-500/20' : 
                            'bg-red-500 shadow-red-500/20'
                          )}>
                            {t.status?.replace('_', ' ')}
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 pt-5 border-t border-earth-dark/[0.05] relative z-10">
                          <div className="space-y-2">
                             <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest text-earth-mut">
                                <span>Engine Hours</span>
                                <span className="text-earth-brown text-right">{t.engine_hours || 0} HRS</span>
                             </div>
                             <div className="h-1.5 bg-earth-dark/[0.03] rounded-full overflow-hidden">
                                <div className="h-full bg-earth-accent rounded-full shadow-[0_0_8px_rgba(255,152,0,0.4)]" style={{ width: `${Math.min(((t.engine_hours || 0) / 250) * 100, 100)}%` }}></div>
                             </div>
                          </div>
                          <div className="space-y-2">
                             <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest text-earth-mut">
                                <span>Shift Status</span>
                                <span className={cn("text-right font-bold uppercase", t.operator_availability === 'available' ? "text-earth-green" : "text-earth-accent")}>{t.operator_availability}</span>
                             </div>
                             <div className="h-1.5 bg-earth-dark/[0.03] rounded-full overflow-hidden">
                                <div className={cn("h-full rounded-full transition-all duration-1000", t.operator_availability === 'available' ? "bg-earth-green w-full shadow-[0_0_8px_rgba(46,125,50,0.4)]" : "bg-earth-accent w-1/2 shadow-[0_0_8px_rgba(255,152,0,0.4)]")}></div>
                             </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .animate-spin-slow { animation: spin 20s linear infinite; }
        @keyframes spin { from { transform: translate(-50%, -50%) rotate(0deg); } to { transform: translate(-50%, -50%) rotate(360deg); } }
      `}} />

      {/* SUCCESS OVERLAY FOR ASSIGNMENT */}
      {assignmentStatus && (
        <div className="fixed bottom-10 right-10 bg-emerald-600 text-earth-brown px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 animate-in slide-in-from-right-10 duration-300 z-[100] border border-emerald-500">
           <div className="bg-earth-primary p-2 rounded-xl"><ShieldCheck size={24} /></div>
           <div>
              <p className="text-xs font-black uppercase tracking-widest">Operator Assigned</p>
              <p className="text-[10px] font-bold opacity-80">Raju linked to Booking {assignmentStatus}</p>
           </div>
        </div>
      )}
    </div>
  );
}
