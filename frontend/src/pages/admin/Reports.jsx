import { useState, useEffect } from 'react';
import { BarChart3, LineChart, PieChart, Download, Loader2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { api } from '../../lib/api';
import { cn } from '../../lib/utils';

export default function Reports() {
  const [range, setRange] = useState('7d');
  const [loading, setLoading] = useState(true);
  
  const [revenueData, setRevenueData] = useState({ labels: [], data: [] });
  const [serviceUsage, setServiceUsage] = useState([]);
  const [fleetStats, setFleetStats] = useState({ total: 0, active: 0, maintenance: 0, efficiency: 0 });
  const [farmerGrowth, setFarmerGrowth] = useState({ labels: [], data: [] });

  useEffect(() => {
    fetchAllData();
  }, [range]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [rev, serv, fleet, growth] = await Promise.all([
        api.admin.reports.getRevenue(range),
        api.admin.reports.getServiceUsage(),
        api.admin.reports.getFleet(),
        api.admin.reports.getFarmers()
      ]);

      if (rev.success) setRevenueData(rev.data);
      if (serv.success) setServiceUsage(serv.data);
      if (fleet.success) setFleetStats(fleet.data);
      if (growth.success) setFarmerGrowth(growth.data);
    } catch (error) {
      console.error("Failed to fetch report data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Helper to generate SVG Path for line charts
  const getLinePath = (data, width = 1000, height = 300) => {
    if (!data || data.length < 2) return "";
    const max = Math.max(...data, 100);
    const points = data.map((val, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - (val / max) * height * 0.8 - 20;
      return { x, y };
    });

    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
        const curr = points[i];
        const next = points[i + 1];
        const cp1x = curr.x + (next.x - curr.x) / 2;
        d += ` C ${cp1x} ${curr.y}, ${cp1x} ${next.y}, ${next.x} ${next.y}`;
    }
    return d;
  };

  const getAreaPath = (data, width = 1000, height = 300) => {
    const lineD = getLinePath(data, width, height);
    if (!lineD) return "";
    return `${lineD} L ${width} ${height} L 0 ${height} Z`;
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-earth-card-alt p-5 md:p-6 rounded-[1.5rem] shadow-sm border border-earth-dark/15/50">
        <div>
          <h2 className="text-xl md:text-2xl font-black tracking-tight text-earth-brown">System Analytics & Reports</h2>
          <p className="text-[10px] font-bold uppercase tracking-widest text-earth-mut mt-1">View organizational performance telemetry</p>
        </div>
        <div className="flex flex-wrap gap-2 text-[10px] font-black uppercase tracking-widest bg-earth-card border border-earth-dark/10 rounded-xl p-1.5 shadow-inner w-full sm:w-auto">
          {['7d', '30d', '1y'].map((r) => (
            <button 
              key={r}
              onClick={() => setRange(r)}
              className={cn(
                "flex-1 sm:flex-none px-4 sm:px-5 py-2 rounded-lg transition-all",
                range === r ? "bg-accent text-white shadow-[0_0_10px_rgba(255,152,0,0.3)]" : "text-earth-mut hover:text-earth-brown hover:bg-earth-card-alt"
              )}
            >
              {r === '7d' ? '7 Days' : r === '30d' ? '30 Days' : 'Year'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
        {/* Revenue Chart */}
        <Card className="shadow-sm border-earth-dark/15/50 bg-earth-card-alt rounded-[1.5rem]">
          <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-earth-dark/15/50 bg-earth-card/50 pt-6 px-6">
            <CardTitle className="text-base font-black text-earth-brown uppercase tracking-wide">Revenue Over Time</CardTitle>
            <Button size="icon" className="bg-earth-card hover:bg-earth-card-alt border border-earth-dark/10 text-earth-sub hover:text-earth-brown rounded-lg"><Download size={16} /></Button>
          </CardHeader>
          <CardContent className="p-6">
            <div className="w-full h-[280px] relative bg-earth-card rounded-2xl border border-earth-dark/10 shadow-inner p-6 flex flex-col group overflow-hidden">
               {loading ? (
                 <div className="flex-1 flex items-center justify-center"><Loader2 className="animate-spin text-earth-primary" /></div>
               ) : (
                 <>
                  <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at center, #262626 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
                  <div className="flex-1 mt-4">
                      <svg className="w-full h-full" viewBox="0 0 1000 300" preserveAspectRatio="none">
                        <path 
                          d={getLinePath(revenueData.data)} 
                          fill="none" 
                          stroke="#eab308" 
                          strokeWidth="4" 
                          strokeLinecap="round" 
                        />
                        <path 
                          d={getAreaPath(revenueData.data)} 
                          fill="url(#revGrad)" 
                          opacity="0.1" 
                        />
                        <defs>
                          <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#eab308" />
                            <stop offset="100%" stopColor="#0a0a0a" />
                          </linearGradient>
                        </defs>
                      </svg>
                  </div>
                  <div className="flex justify-between mt-4 text-[9px] font-black text-earth-mut uppercase tracking-widest pl-2 pr-2">
                    {revenueData.labels.map((l, i) => (
                      <span key={i} className={i === revenueData.labels.length - 1 ? "text-earth-primary" : ""}>{l}</span>
                    ))}
                  </div>
                 </>
               )}
            </div>
          </CardContent>
        </Card>

        {/* Service Usage Chart */}
        <Card className="shadow-sm border-earth-dark/15/50 bg-earth-card-alt rounded-[1.5rem]">
          <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-earth-dark/15/50 bg-earth-card/50 pt-6 px-6">
            <CardTitle className="text-base font-black text-earth-brown uppercase tracking-wide">Service Usage Distribution</CardTitle>
            <Button size="icon" className="bg-earth-card hover:bg-earth-card-alt border border-earth-dark/10 text-earth-sub hover:text-earth-brown rounded-lg"><Download size={16} /></Button>
          </CardHeader>
          <CardContent className="p-6">
            <div className="w-full h-[280px] relative bg-earth-card rounded-2xl border border-earth-dark/10 shadow-inner p-6 flex flex-col group overflow-hidden">
               {loading ? (
                 <div className="flex-1 flex items-center justify-center"><Loader2 className="animate-spin text-earth-green" /></div>
               ) : (
                 <>
                  <div className="absolute inset-x-0 bottom-12 h-px bg-earth-card-alt"></div>
                  <div className="flex-1 flex items-end justify-around gap-2 px-2 z-10">
                      {serviceUsage.map((u, i) => {
                        const maxCount = Math.max(...serviceUsage.map(x => x.count), 1);
                        const height = (u.count / maxCount) * 90;
                        return (
                          <div key={i} className="group/bar relative flex-1">
                            <div 
                              className="w-full bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t-lg transition-all duration-700 group-hover:shadow-[0_0_15px_rgba(16,185,129,0.3)] shadow-inner" 
                              style={{ height: `${height}%` }}
                            ></div>
                            <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover/bar:opacity-100 transition-opacity text-[9px] font-black text-earth-green">
                              {u.count}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                  <div className="flex justify-between mt-4 text-[9px] font-black text-earth-mut uppercase tracking-widest overflow-hidden">
                    {serviceUsage.map((u, i) => (
                      <span key={i} className="truncate px-1">{u.service}</span>
                    ))}
                  </div>
                 </>
               )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
        {/* Fleet Utilization */}
        <Card className="lg:col-span-1 shadow-sm border-earth-dark/15/50 bg-earth-card-alt rounded-[1.5rem] flex flex-col">
          <CardHeader className="pb-4 border-b border-earth-dark/15/50 bg-earth-card/50 pt-6 px-6">
            <CardTitle className="text-base font-black text-earth-brown uppercase tracking-wide">Fleet Utilization</CardTitle>
          </CardHeader>
          <CardContent className="p-6 flex-1 flex flex-col items-center justify-center relative">
            <div className="relative w-48 h-48 group">
               <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="40" fill="none" stroke="#262626" strokeWidth="12" />
                  <circle 
                    cx="50" cy="50" r="40" 
                    fill="none" stroke="#eab308" strokeWidth="12" 
                    strokeDasharray="251.2" 
                    strokeDashoffset={251.2 - (251.2 * fleetStats.efficiency) / 100} 
                    strokeLinecap="round" 
                    className="drop-shadow-[0_0_15px_rgba(234,179,8,0.3)] transition-all duration-1000" 
                  />
               </svg>
               <div className="absolute inset-0 flex flex-col items-center justify-center transition-transform group-hover:scale-110 duration-500">
                  <span className="text-4xl font-black text-earth-brown">{fleetStats.efficiency}<span className="text-xl font-bold text-earth-mut">%</span></span>
                  <span className="text-[10px] font-black text-earth-mut uppercase tracking-widest mt-1">Efficiency</span>
               </div>
            </div>
            <div className="mt-8 grid grid-cols-2 gap-4 w-full">
               <div className="p-3 bg-earth-card/50 rounded-xl border border-earth-dark/10 text-center">
                  <p className="text-[9px] font-black text-earth-mut uppercase tracking-widest mb-1">Active</p>
                  <p className="text-base font-black text-earth-brown">{fleetStats.active} Units</p>
               </div>
               <div className="p-3 bg-earth-card/50 rounded-xl border border-earth-dark/10 text-center">
                  <p className="text-[9px] font-black text-earth-mut uppercase tracking-widest mb-1">Maintenance</p>
                  <p className="text-base font-black text-earth-sub">{fleetStats.maintenance} Units</p>
               </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Farmer Growth Chart */}
        <Card className="md:col-span-2 lg:col-span-2 shadow-sm border-earth-dark/15/50 bg-earth-card-alt rounded-[1.5rem] flex flex-col">
          <CardHeader className="pb-4 border-b border-earth-dark/15/50 bg-earth-card/50 pt-6 px-6">
            <CardTitle className="text-base font-black text-earth-brown uppercase tracking-wide">Farmer Network Growth</CardTitle>
          </CardHeader>
          <CardContent className="p-6 flex-1 flex flex-col justify-center">
            <div className="w-full h-[240px] relative bg-earth-card rounded-2xl shadow-inner p-4 flex flex-col group overflow-hidden">
               {loading ? (
                 <div className="flex-1 flex items-center justify-center"><Loader2 className="animate-spin text-earth-green" /></div>
               ) : (
                 <>
                  <div className="flex-1 mt-2">
                      <svg className="w-full h-full" viewBox="0 0 1000 300" preserveAspectRatio="none">
                        <path d={getLinePath(farmerGrowth.data)} fill="none" stroke="#10b981" strokeWidth="5" strokeLinecap="round" />
                        <path d={getAreaPath(farmerGrowth.data)} fill="url(#nodeGrad2)" />
                        <defs>
                          <linearGradient id="nodeGrad2" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#10b981" stopOpacity="0.15" /><stop offset="100%" stopColor="#10b981" stopOpacity="0" /></linearGradient>
                        </defs>
                      </svg>
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                      <div className="flex gap-4">
                        {farmerGrowth.labels.map((l, i) => (
                          <span key={i} className="text-[8px] font-black text-earth-mut uppercase tracking-widest">{l}</span>
                        ))}
                      </div>
                      <span className="text-2xl font-black text-earth-brown">{farmerGrowth.data.reduce((a,b) => a+b, 0)} Total</span>
                  </div>
                 </>
               )}
            </div>
          </CardContent>
        </Card>
      </div>

    </div>
  );
}
