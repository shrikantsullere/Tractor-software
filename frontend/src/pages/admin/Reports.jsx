import { useState, useEffect } from 'react';
import { BarChart3, LineChart, PieChart, Download, Loader2, FileJson, FileText, ChevronDown } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { api } from '../../lib/api';
import { cn } from '../../lib/utils';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// --- Improved Custom SVG Chart Components ---

const DonutChart = ({ data, colors = [], size = 200, strokeWidth = 20 }) => {
  if (!data || data.length === 0) return <div className="text-earth-mut font-black uppercase tracking-widest text-[10px]">No data available</div>;
  
  const total = data.reduce((sum, item) => sum + item.count, 0);
  if (total === 0) return <div className="text-earth-mut font-black uppercase tracking-widest text-[10px]">No data available</div>;

  let currentAngle = -90;
  const center = size / 2;
  const radius = (size - strokeWidth) / 2;

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {data.map((item, i) => {
          const angle = (item.count / total) * 360;
          const largeArcFlag = angle > 180 ? 1 : 0;
          const x1 = center + radius * Math.cos((Math.PI * currentAngle) / 180);
          const y1 = center + radius * Math.sin((Math.PI * currentAngle) / 180);
          currentAngle += angle;
          const x2 = center + radius * Math.cos((Math.PI * currentAngle) / 180);
          const y2 = center + radius * Math.sin((Math.PI * currentAngle) / 180);

          return (
            <path
              key={i}
              d={`M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`}
              fill="none"
              stroke={colors[i % colors.length]}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              className="transition-all duration-700 hover:opacity-80 cursor-pointer"
            />
          );
        })}
      </svg>
      <div className="mt-6 grid grid-cols-2 gap-x-6 gap-y-2">
        {data.map((item, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: colors[i % colors.length] }}></div>
            <span className="text-[9px] font-black text-earth-mut uppercase tracking-wider">{item.service || item.status}</span>
            <span className="text-[10px] font-black text-earth-brown">{Math.round((item.count / total) * 100)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default function Reports() {
  const [range, setRange] = useState('7d');
  const [loading, setLoading] = useState(true);
  const [showExportOptions, setShowExportOptions] = useState(false);
  const [exporting, setExporting] = useState(false);
  
  const [revenueData, setRevenueData] = useState({ labels: [], data: [] });
  const [serviceUsage, setServiceUsage] = useState([]);
  const [fleetStats, setFleetStats] = useState({ total: 0, active: 0, maintenance: 0, efficiency: 0 });
  const [farmerGrowth, setFarmerGrowth] = useState({ labels: [], data: [] });
  const [bookingsAnalytics, setBookingsAnalytics] = useState({ labels: [], total: [], completed: [] });
  const [operatorPerformance, setOperatorPerformance] = useState([]);
  const [jobStatusDist, setJobStatusDist] = useState([]);

  useEffect(() => {
    fetchAllData();
  }, [range]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [rev, serv, fleet, growth, bookAn, opPerf, statusDist] = await Promise.all([
        api.admin.reports.getRevenue(range),
        api.admin.reports.getServiceUsage(range),
        api.admin.reports.getFleet(),
        api.admin.reports.getFarmers(range),
        api.admin.reports.getBookingsAnalytics(range),
        api.admin.reports.getOperatorPerformance(range),
        api.admin.reports.getJobStatusDistribution(range)
      ]);

      if (rev.success) setRevenueData(rev.data);
      if (serv.success) setServiceUsage(serv.data);
      if (fleet.success) setFleetStats(fleet.data);
      if (growth.success) setFarmerGrowth(growth.data);
      if (bookAn.success) setBookingsAnalytics(bookAn.data);
      if (opPerf.success) setOperatorPerformance(opPerf.data);
      if (statusDist.success) setJobStatusDist(statusDist.data);
    } catch (error) {
      console.error("Failed to fetch report data:", error);
    } finally {
      setLoading(false);
    }
  };

  const downloadCSV = async () => {
    try {
      const res = await api.admin.reports.getExportData(range);
      if (!res.success) throw new Error("Export failed");
      
      const { bookings, revenue, operators } = res.data;
      
      let csvContent = "data:text/csv;charset=utf-8,";
      csvContent += "Type,ID,Name/Farmer,Amount/Price,Status,Date\n";
      
      bookings.forEach(b => csvContent += `Booking,${b.id},${b.farmer},${b.totalPrice},${b.status},${new Date(b.date).toLocaleDateString()}\n`);
      revenue.forEach(r => csvContent += `Revenue,${r.id},N/A,${r.amount},Paid,${new Date(r.date).toLocaleDateString()}\n`);
      operators.forEach(o => csvContent += `Operator,${o.id},${o.name},N/A,Jobs:${o.completedJobs},${new Date(o.joined).toLocaleDateString()}\n`);
      
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `tractorlink_report_${range}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      alert("Failed to download CSV: " + error.message);
    }
  };

  const downloadPDF = async () => {
    try {
      const res = await api.admin.reports.getExportData(range);
      if (!res.success) throw new Error("Export failed");
      
      const doc = new jsPDF();
      doc.setFontSize(18);
      doc.text("TractorLink Operational Report", 14, 20);
      doc.setFontSize(10);
      doc.text(`Time Range: ${range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : '1 Year'}`, 14, 30);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 35);

      // Bookings Table
      doc.setFontSize(14);
      doc.setTextColor(40);
      doc.text("Bookings Summary", 14, 50);
      
      autoTable(doc, {
        startY: 55,
        head: [['ID', 'Farmer', 'Service', 'Price', 'Status', 'Date']],
        body: res.data.bookings.map(b => [
          b.id, 
          b.farmer, 
          b.service, 
          `NGN ${b.totalPrice.toLocaleString()}`, 
          b.status.toUpperCase(),
          new Date(b.date).toLocaleDateString()
        ]),
        styles: { fontSize: 8, font: 'helvetica' },
        headStyles: { fillStyle: [234, 179, 8], textColor: 255 },
        alternateRowStyles: { fillStyle: [250, 250, 250] }
      });

      // Operator Table
      const finalY = (doc).lastAutoTable.finalY + 15;
      doc.setFontSize(14);
      doc.text("Operator Performance", 14, finalY);
      
      autoTable(doc, {
        startY: finalY + 5,
        head: [['ID', 'Name', 'Phone', 'Jobs Completed']],
        body: res.data.operators.map(o => [o.id, o.name, o.phone, o.completedJobs]),
        styles: { fontSize: 8 },
        headStyles: { fillStyle: [16, 185, 129], textColor: 255 }
      });

      doc.save(`tractorlink_report_${range}.pdf`);
    } catch (error) {
      alert("Failed to download PDF: " + error.message);
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
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header & Filter */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-earth-card-alt p-5 md:p-6 rounded-[1.5rem] shadow-sm border border-earth-dark/15/50 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-earth-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="relative z-10">
          <h2 className="text-xl md:text-2xl font-black tracking-tight text-earth-brown">Advanced Analytics Suite</h2>
          <p className="text-[10px] font-bold uppercase tracking-widest text-earth-mut mt-1">Operational performance & business intelligence</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto relative z-10">
          <div className="flex gap-2 text-[10px] font-black uppercase tracking-widest bg-earth-card border border-earth-dark/10 rounded-xl p-1.5 shadow-inner">
            {['7d', '30d', '1y'].map((r) => (
              <button 
                key={r}
                onClick={() => setRange(r)}
                className={cn(
                  "px-4 sm:px-5 py-2 rounded-lg transition-all",
                  range === r ? "bg-accent text-white shadow-lg" : "text-earth-mut hover:text-earth-brown"
                )}
              >
                {r === '7d' ? '7D' : r === '30d' ? '30D' : '1Y'}
              </button>
            ))}
          </div>
          
          <div className="relative">
            <Button 
              disabled={exporting}
              onClick={async () => {
                setExporting(true);
                await downloadPDF();
                setExporting(false);
              }}
              className="w-full sm:w-auto bg-earth-primary hover:bg-emerald-600 text-white font-black tracking-widest uppercase text-[10px] h-11 px-6 rounded-xl shadow-lg transition-all flex items-center gap-2 border-none disabled:opacity-50"
            >
              {exporting ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />} 
              {exporting ? "Generating PDF..." : "Export PDF Report"}
            </Button>
            
            <button 
              onClick={() => setShowExportOptions(!showExportOptions)}
              className="absolute -bottom-6 right-0 text-[8px] font-black text-earth-mut uppercase tracking-widest hover:text-earth-primary transition-colors"
            >
              Other Formats (CSV)
            </button>

            {showExportOptions && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-2xl border border-earth-dark/10 p-2 z-50 animate-in fade-in slide-in-from-top-2">
                <button onClick={() => { downloadCSV(); setShowExportOptions(false); }} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-earth-card-alt rounded-xl transition-colors text-left group">
                  <FileJson size={14} className="text-earth-primary" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-earth-brown">Download CSV</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* REVENUE TRENDS (Line Chart) */}
        <Card className="shadow-sm border-earth-dark/15/50 bg-earth-card-alt rounded-[1.5rem]">
            <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-earth-dark/15/50 bg-earth-card/50 pt-6 px-6">
            <CardTitle className="text-[11px] font-black text-earth-brown uppercase tracking-widest flex items-center gap-2"><LineChart size={14} className="text-earth-primary" /> Revenue Trends</CardTitle>
            <Button onClick={downloadPDF} size="icon" className="bg-earth-card hover:bg-earth-card-alt border border-earth-dark/10 text-earth-sub hover:text-earth-brown rounded-lg"><Download size={14} /></Button>
          </CardHeader>
          <CardContent className="p-6">
            <div className="w-full h-[280px] relative bg-earth-card rounded-2xl border border-earth-dark/10 shadow-inner p-6 flex flex-col group overflow-hidden">
               {loading ? (
                 <div className="flex-1 flex items-center justify-center"><Loader2 className="animate-spin text-earth-primary" /></div>
               ) : (
                 <>
                  {revenueData.data.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center text-[10px] font-black text-earth-mut uppercase tracking-widest">No data available</div>
                  ) : (
                    <>
                      <div className="flex-1 mt-4">
                          <svg className="w-full h-full" viewBox="0 0 1000 300" preserveAspectRatio="none">
                            <path d={getLinePath(revenueData.data)} fill="none" stroke="#eab308" strokeWidth="4" strokeLinecap="round" />
                            <path d={getAreaPath(revenueData.data)} fill="url(#revGrad)" opacity="0.1" />
                            <defs>
                              <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#eab308" /><stop offset="100%" stopColor="#0a0a0a" /></linearGradient>
                            </defs>
                          </svg>
                      </div>
                      <div className="flex justify-between mt-4 text-[9px] font-black text-earth-mut uppercase tracking-widest">
                        {revenueData.labels.map((l, i) => <span key={i}>{l}</span>)}
                      </div>
                    </>
                  )}
                 </>
               )}
            </div>
          </CardContent>
        </Card>

        {/* BOOKINGS ANALYTICS (Grouped Bar Chart) */}
        <Card className="shadow-sm border-earth-dark/15/50 bg-earth-card-alt rounded-[1.5rem]">
          <CardHeader className="pb-4 border-b border-earth-dark/15/50 bg-earth-card/50 pt-6 px-6">
            <CardTitle className="text-[11px] font-black text-earth-brown uppercase tracking-widest flex items-center gap-2"><BarChart3 size={14} className="text-blue-400" /> Bookings Analytics</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="w-full h-[280px] relative bg-earth-card rounded-2xl border border-earth-dark/10 shadow-inner p-6 flex flex-col group overflow-hidden">
               {loading ? (
                 <div className="flex-1 flex items-center justify-center"><Loader2 className="animate-spin text-earth-primary" /></div>
               ) : (
                 <>
                  {bookingsAnalytics.total.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center text-[10px] font-black text-earth-mut uppercase tracking-widest">No data available</div>
                  ) : (
                    <>
                      <div className="flex-1 flex items-end justify-around gap-4 px-2">
                          {bookingsAnalytics.labels.map((l, i) => {
                            const max = Math.max(...bookingsAnalytics.total, 1);
                            const tHeight = (bookingsAnalytics.total[i] / max) * 100;
                            const cHeight = (bookingsAnalytics.completed[i] / max) * 100;
                            return (
                              <div key={i} className="flex-1 flex items-end gap-1 max-w-[40px]">
                                <div className="flex-1 bg-earth-mut/20 rounded-t-md transition-all duration-700" style={{ height: `${tHeight}%` }}></div>
                                <div className="flex-1 bg-blue-400 rounded-t-md transition-all duration-700" style={{ height: `${cHeight}%` }}></div>
                              </div>
                            )
                          })}
                      </div>
                      <div className="mt-4 flex justify-between items-center text-[8px] font-black tracking-widest uppercase">
                          <div className="flex gap-4">
                            <span className="flex items-center gap-1.5"><div className="w-2h-2 bg-earth-mut/20 rounded-full"></div> Total</span>
                            <span className="flex items-center gap-1.5"><div className="w-2h-2 bg-blue-400 rounded-full"></div> Completed</span>
                          </div>
                      </div>
                    </>
                  )}
                 </>
               )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* SERVICE DISTRIBUTION (Donut) */}
        <Card className="shadow-sm border-earth-dark/15/50 bg-earth-card-alt rounded-[1.5rem]">
          <CardHeader className="pb-4 border-b border-earth-dark/15/50 bg-earth-card/50 pt-6 px-6">
            <CardTitle className="text-[11px] font-black text-earth-brown uppercase tracking-widest">Service Distribution</CardTitle>
          </CardHeader>
          <CardContent className="p-8 flex items-center justify-center min-h-[300px]">
             <DonutChart data={serviceUsage} colors={['#eab308', '#10b981', '#3b82f6', '#f97316']} />
          </CardContent>
        </Card>

        {/* JOB STATUS DISTRIBUTION (Donut) */}
        <Card className="shadow-sm border-earth-dark/15/50 bg-earth-card-alt rounded-[1.5rem]">
          <CardHeader className="pb-4 border-b border-earth-dark/15/50 bg-earth-card/50 pt-6 px-6">
            <CardTitle className="text-[11px] font-black text-earth-brown uppercase tracking-widest">Job Status Analysis</CardTitle>
          </CardHeader>
          <CardContent className="p-8 flex items-center justify-center min-h-[300px]">
             <DonutChart data={jobStatusDist} colors={['#94a3b8', '#3b82f6', '#eab308', '#10b981']} />
          </CardContent>
        </Card>

        {/* OPERATOR PERFORMANCE (Bar list) */}
        <Card className="shadow-sm border-earth-dark/15/50 bg-earth-card-alt rounded-[1.5rem]">
          <CardHeader className="pb-4 border-b border-earth-dark/15/50 bg-earth-card/50 pt-6 px-6">
            <CardTitle className="text-[11px] font-black text-earth-brown uppercase tracking-widest">Top Performers</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
             <div className="space-y-4">
                {operatorPerformance.map((op, i) => {
                  const max = Math.max(...operatorPerformance.map(o => o.completedJobs), 1);
                  const width = (op.completedJobs / max) * 100;
                  return (
                    <div key={i} className="space-y-1.5">
                      <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                        <span className="text-earth-brown">{op.name}</span>
                        <span className="text-earth-primary">{op.completedJobs} Jobs</span>
                      </div>
                      <div className="w-full h-2 bg-earth-card rounded-full overflow-hidden shadow-inner">
                        <div className="h-full bg-earth-primary rounded-full transition-all duration-1000" style={{ width: `${width}%` }}></div>
                      </div>
                    </div>
                  )
                })}
                {operatorPerformance.length === 0 && <div className="text-center text-[10px] font-black text-earth-mut uppercase py-12">No performance data yet</div>}
             </div>
          </CardContent>
        </Card>
      </div>

      {/* FARMER ANALYTICS (Wide Card) */}
      <Card className="shadow-sm border-earth-dark/15/50 bg-earth-card-alt rounded-[1.5rem]">
        <CardHeader className="pb-4 border-b border-earth-dark/15/50 bg-earth-card/50 pt-6 px-6">
          <CardTitle className="text-[11px] font-black text-earth-brown uppercase tracking-widest">Farmer Network Growth Trends</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="w-full h-[240px] relative bg-earth-card rounded-2xl shadow-inner p-4 flex flex-col group overflow-hidden">
              {loading ? (
                <div className="flex-1 flex items-center justify-center"><Loader2 className="animate-spin text-earth-green" /></div>
              ) : (
                <>
                {farmerGrowth.data.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center text-[10px] font-black text-earth-mut uppercase tracking-widest">No registration data</div>
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
                        <span className="text-2xl font-black text-earth-brown tracking-tighter">{farmerGrowth.data.reduce((a,b) => a+b, 0)} <span className="text-xs font-bold text-earth-mut uppercase">Total Registrations</span></span>
                    </div>
                  </>
                )}
                </>
              )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
