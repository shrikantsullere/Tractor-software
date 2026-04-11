import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, History, Search, Filter, Mail, MapPin, MoreHorizontal, Shield, ShieldOff, CheckCircle2, ChevronRight, Loader2, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { api } from '../../lib/api';
import { cn } from '../../lib/utils';
import AddFarmerModal from '../../components/admin/AddFarmerModal';

export default function Farmers() {
  const navigate = useNavigate();
  const [farmers, setFarmers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [updatingId, setUpdatingId] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const fetchFarmers = async () => {
    setIsLoading(true);
    try {
      const result = await api.admin.listFarmers();
      setFarmers(result.data || []);
    } catch (error) {
      console.error("Failed to fetch farmers:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFarmers();
  }, []);

  const handleToggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    setUpdatingId(id);
    try {
      const result = await api.admin.updateFarmerStatus(id, newStatus);
      if (result.success) {
        setFarmers(prev => prev.map(f => f.id === id ? { ...f, status: newStatus } : f));
      }
    } catch (error) {
      console.error("Failed to update status:", error);
      alert(error.message || "Failed to update farmer status");
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredFarmers = farmers.filter(f => 
    f.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    f.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 border-b border-earth-dark/10 pb-8">
        <div>
          <h2 className="text-2xl md:text-3xl font-black tracking-tight text-earth-brown mb-1 uppercase italic font-outfit">Service Consumers</h2>
          <p className="text-[10px] tracking-[0.3em] font-black uppercase text-earth-mut flex items-center gap-2">
            <Users size={12} className="text-earth-primary" /> Farmer Database Registry
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
          <div className="relative group w-full lg:w-72">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-earth-mut group-focus-within:text-earth-primary transition-colors" size={16} />
            <Input 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search Farmers/Locations..." 
              className="pl-12 bg-earth-card border-earth-dark/10 rounded-2xl h-12 focus:ring-1 focus:ring-earth-primary/30 font-bold shadow-inner"
            />
          </div>
          <Button 
            onClick={() => setIsAddModalOpen(true)}
            className="h-12 px-8 rounded-2xl bg-accent hover:opacity-90 text-white font-black uppercase tracking-widest text-xs shadow-lg shadow-accent/20 border-none transition-all active:scale-[0.98]"
          >
            <Users size={18} className="mr-2" /> Add Farmer
          </Button>
        </div>
      </div>

      {/* Stats Quick View */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
         {[
           { label: 'Total Enrolled', value: farmers.length, icon: Users, color: 'text-earth-brown', bg: 'bg-earth-dark/5' },
           { label: 'Active Users', value: farmers.filter(f => f.status === 'active').length, icon: Shield, color: 'text-earth-green', bg: 'bg-earth-primary/10' },
           { label: 'Dormant Accounts', value: farmers.filter(f => f.status === 'inactive').length, icon: ShieldOff, color: 'text-zinc-500', bg: 'bg-zinc-500/10' },
         ].map((stat, i) => (
           <Card key={i} className="bg-earth-card border-earth-dark/10 shadow-sm rounded-2xl border-b-4 border-b-earth-primary/20">
              <CardContent className="p-4 flex items-center justify-between">
                 <div>
                    <p className="text-[9px] font-black text-earth-mut uppercase tracking-[0.15em] mb-0.5 font-outfit">{stat.label}</p>
                    <h3 className="text-2xl font-black text-earth-brown tracking-tighter">{stat.value.toString().padStart(2, '0')}</h3>
                 </div>
                 <div className={cn("p-3 rounded-xl shrink-0 shadow-inner", stat.bg)}>
                    <stat.icon size={18} className={stat.color} />
                 </div>
              </CardContent>
           </Card>
         ))}
      </div>

      {/* Farmers List */}
      <Card className="bg-earth-card border-earth-dark/10 shadow-sm rounded-2xl overflow-hidden">
        <CardHeader className="p-6 border-b border-earth-dark/10 flex flex-row items-center justify-between bg-earth-card/50">
          <div>
            <CardTitle className="text-base font-black text-earth-brown uppercase tracking-wider italic font-outfit">Platform Users</CardTitle>
            <CardDescription className="text-[10px] font-bold text-earth-mut uppercase mt-1 tracking-[0.1em]">Verified agricultural service consumers</CardDescription>
          </div>
          <button onClick={fetchFarmers} className="p-2.5 hover:bg-earth-card-alt rounded-2xl transition-all text-earth-mut hover:text-earth-brown border border-transparent hover:border-earth-dark/10 shadow-sm">
            <RefreshCw size={16} className={isLoading ? "animate-spin text-earth-primary" : ""} />
          </button>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="px-8 py-24 text-center">
              <div className="flex flex-col items-center gap-4">
                <div className="relative">
                  <Loader2 className="animate-spin text-earth-primary" size={40} />
                  <Users className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-earth-brown/30" size={16} />
                </div>
                <p className="text-xs font-black text-earth-mut uppercase tracking-[0.3em] animate-pulse italic">Accessing Encrypted Farmer Records...</p>
              </div>
            </div>
          ) : filteredFarmers.length === 0 ? (
            <div className="px-8 py-24 text-center">
              <div className="p-12 rounded-[2.5rem] bg-earth-dark/5 inline-block border-2 border-dashed border-earth-dark/10">
                 <Users size={40} className="mx-auto text-earth-mut opacity-30 mb-4" />
                 <p className="text-xs font-black text-earth-mut uppercase tracking-widest">Zero consumer records detected</p>
              </div>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-earth-dark text-earth-main">
                    <tr>
                      <th className="px-8 py-5 text-left text-[10px] font-black text-earth-main uppercase tracking-[0.2em]">User Entity</th>
                      <th className="px-8 py-5 text-left text-[10px] font-black text-earth-main uppercase tracking-[0.2em]">Contact & Reach</th>
                      <th className="px-8 py-5 text-left text-[10px] font-black text-earth-main uppercase tracking-[0.2em]">Operations</th>
                      <th className="px-8 py-5 text-left text-[10px] font-black text-earth-main uppercase tracking-[0.2em]">Account State</th>
                      <th className="px-8 py-5 text-right text-[10px] font-black text-earth-main uppercase tracking-[0.2em]">Management</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-earth-dark/10">
                    {filteredFarmers.map((farmer) => (
                      <tr key={farmer.id} className="group hover:bg-earth-primary/5 transition-all duration-300">
                        <td className="px-8 py-6">
                           <div className="flex items-center gap-4">
                             <div className="w-12 h-12 rounded-2xl bg-earth-card-alt flex items-center justify-center text-earth-brown border border-earth-dark/10 shadow-inner group-hover:border-earth-primary/30 group-hover:scale-110 transition-all duration-300">
                                <Users size={20} className="group-hover:text-earth-primary transition-colors" />
                             </div>
                             <div>
                                <p className="text-sm font-black text-earth-brown group-hover:tracking-tight transition-all font-outfit">{farmer.name}</p>
                                <p className="text-[10px] font-bold text-earth-mut uppercase flex items-center gap-1 mt-0.5 tracking-tighter">
                                   ID: TL-FR-{farmer.id.toString().padStart(4, '0')}
                                </p>
                             </div>
                           </div>
                        </td>
                        <td className="px-8 py-6">
                           <div className="space-y-1.5">
                              <div className="flex items-center gap-2 text-xs font-bold text-earth-brown">
                                 <Mail size={12} className="text-earth-mut" /> {farmer.email}
                              </div>
                              <div className="flex items-center gap-2 text-[10px] font-bold text-earth-mut uppercase italic tracking-tighter">
                                 <MapPin size={10} className="text-earth-primary" /> {farmer.location}
                              </div>
                           </div>
                        </td>
                        <td className="px-8 py-6">
                           <div className="flex items-center gap-3">
                              <div className="h-9 w-9 bg-earth-primary/10 rounded-xl flex items-center justify-center text-earth-primary border border-earth-primary/20 shadow-inner">
                                 <span className="text-xs font-black">{farmer.totalBookings}</span>
                              </div>
                              <div className="flex flex-col">
                                <span className="text-[9px] font-black text-earth-mut uppercase tracking-widest">History</span>
                                <span className="text-[8px] font-bold text-earth-brown/60 uppercase">Lifetime Bookings</span>
                              </div>
                           </div>
                        </td>
                        <td className="px-8 py-6">
                          <Badge className={cn(
                            "text-[9px] px-3 py-1 border uppercase font-black tracking-[0.2em] h-7 rounded-lg shadow-sm border-b-2",
                            farmer.status === 'active' 
                              ? 'bg-earth-primary/10 text-earth-green border-earth-primary/20' 
                              : 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20'
                          )}>
                            {farmer.status}
                          </Badge>
                        </td>
                        <td className="px-8 py-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button 
                              size="sm"
                              variant="outline"
                              onClick={() => navigate(`/admin/bookings?search=${farmer.email}`)}
                              className="text-[9px] px-4 font-black uppercase tracking-widest h-10 rounded-xl bg-accent text-white border-none hover:opacity-90 transition-all shadow-lg shadow-accent/20 active:translate-y-0.5"
                            >
                              <History size={14} className="mr-1.5" /> History
                            </Button>
                            <Button 
                              size="sm"
                              variant="outline"
                              disabled={updatingId === farmer.id}
                              onClick={() => handleToggleStatus(farmer.id, farmer.status)}
                              className={cn(
                                "text-[9px] px-4 font-black uppercase tracking-widest h-10 rounded-xl transition-all border-b-2 active:translate-y-0.5",
                                farmer.status === 'active' 
                                  ? 'bg-earth-card-alt border-earth-dark/15 text-earth-sub hover:text-red-500 hover:border-red-500/30' 
                                  : 'bg-earth-primary text-earth-brown border-earth-primary/30'
                              )}
                            >
                              {updatingId === farmer.id ? (
                                <Loader2 size={12} className="animate-spin" />
                              ) : (
                                farmer.status === 'active' ? (
                                  <><ShieldOff size={14} className="mr-1.5" /> Deactivate</>
                                ) : (
                                  <><CheckCircle2 size={14} className="mr-1.5" /> Restore Access</>
                                )
                              )}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden p-4 space-y-4">
                {filteredFarmers.map((farmer) => (
                  <div key={farmer.id} className="bg-earth-card-alt border border-earth-dark/10 rounded-3xl p-5 space-y-5 shadow-sm">
                    <div className="flex justify-between items-start">
                      <div className="flex gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-earth-card flex items-center justify-center text-earth-brown border border-earth-dark/10 shadow-inner">
                          <Users size={20} />
                        </div>
                        <div>
                          <h4 className="font-outfit font-black text-earth-brown">{farmer.name}</h4>
                          <p className="text-[10px] font-bold text-earth-mut uppercase tracking-[0.1em] mt-0.5">ID: TL-FR-{farmer.id.toString().padStart(4, '0')}</p>
                        </div>
                      </div>
                      <Badge className={cn(
                        "text-[9px] px-3 py-1 border uppercase font-black tracking-widest rounded-lg",
                        farmer.status === 'active' ? 'bg-earth-primary/10 text-earth-green border-earth-primary/20' : 'bg-red-500/10 text-red-500 border-red-500/20'
                      )}>
                        {farmer.status}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 gap-3 py-3 border-y border-earth-dark/10">
                      <div className="flex items-center gap-2 text-[11px] font-bold text-earth-brown truncate">
                        <Mail size={14} className="text-earth-mut shrink-0" /> {farmer.email}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] font-bold text-earth-mut uppercase italic">
                        <MapPin size={14} className="text-earth-primary shrink-0" /> {farmer.location}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 bg-earth-primary/10 rounded-xl flex items-center justify-center text-earth-primary border border-earth-primary/20 shadow-inner">
                          <span className="text-xs font-black">{farmer.totalBookings}</span>
                        </div>
                        <span className="text-[10px] font-black text-earth-mut uppercase tracking-widest">Lifetime Bookings</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-4">
                      <Button 
                        size="sm"
                        onClick={() => navigate(`/admin/bookings?search=${farmer.email}`)}
                        className="w-full h-11 rounded-2xl bg-accent text-white font-black uppercase tracking-widest text-[9px] shadow-lg shadow-accent/20 border-none"
                      >
                        <History size={14} className="mr-1.5" /> History
                      </Button>
                      <Button 
                        size="sm"
                        disabled={updatingId === farmer.id}
                        onClick={() => handleToggleStatus(farmer.id, farmer.status)}
                        className={cn(
                          "w-full h-11 rounded-2xl font-black uppercase tracking-widest text-[9px] transition-all border-none",
                          farmer.status === 'active' 
                            ? 'bg-earth-dark/10 text-earth-sub' 
                            : 'bg-earth-primary text-earth-brown shadow-lg shadow-earth-primary/20'
                        )}
                      >
                        {updatingId === farmer.id ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : (
                          farmer.status === 'active' ? "Deactivate" : "Activate"
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <AddFarmerModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        onRefresh={fetchFarmers} 
      />
    </div>
  );
}
