import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, MapPin, History, Wallet, Zap, Calendar, Tractor, Clock, Loader2, Navigation } from 'lucide-react';
import { Card, CardContent } from '../../components/ui/Card';
import { api } from '../../lib/api';
import { cn } from '../../lib/utils';
import { Button } from '../../components/ui/Button';
import RequestLocationMap from '../../components/map/RequestLocationMap';

export default function Home() {
  const [dashboardData, setDashboardData] = useState({ name: '', location: '', active_jobs: 0, total_bookings: 0, total_paid: 0 });
  const [recentActivity, setRecentActivity] = useState([]);
  const [upcomingJobs, setUpcomingJobs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [services, setServices] = useState([]);
  const [selectedService, setSelectedService] = useState('');
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [requestError, setRequestError] = useState('');
  const [requestSuccess, setRequestSuccess] = useState('');
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setIsLoading(true);
        const [dashRes, activityRes, jobsRes] = await Promise.all([
          api.farmer.getDashboard(),
          api.farmer.getRecentActivity(),
          api.farmer.getUpcomingJobs(),
        ]);
        if (dashRes?.success) setDashboardData(dashRes.data);
        if (activityRes?.success) setRecentActivity(activityRes.data);
        if (jobsRes?.success) setUpcomingJobs(jobsRes.data);
        const servicesRes = await api.farmer.listServices();
        if (servicesRes?.success) {
          setServices(servicesRes.data || []);
          if (servicesRes.data?.length > 0) {
            setSelectedService(servicesRes.data[0].name);
          }
        }
      } catch (error) {
        console.error('Failed to fetch farmer dashboard:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  const stats = [
    { label: 'Total Paid', value: `₦${dashboardData.total_paid.toLocaleString()}`, icon: Wallet, color: 'text-earth-green', bg: 'bg-earth-primary/10' },
    { label: 'Active Jobs', value: dashboardData.active_jobs.toString(), icon: Zap, color: 'text-earth-primary', bg: 'bg-earth-primary/10' },
    { label: 'Total Bookings', value: dashboardData.total_bookings.toString(), icon: History, color: 'text-blue-400', bg: 'bg-blue-500/10' },
  ];

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setRequestError('Geolocation is not supported in this browser.');
      return;
    }

    setIsLocating(true);
    setRequestError('');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setSelectedLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setIsLocating(false);
      },
      () => {
        setRequestError('Could not fetch your current location.');
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 2000 }
    );
  };

  const submitPinnedRequest = async () => {
    setRequestError('');
    setRequestSuccess('');

    if (!selectedService) {
      setRequestError('Please select a service.');
      return;
    }

    if (!selectedLocation) {
      setRequestError('Please tap on map to select work location.');
      return;
    }

    setIsSubmittingRequest(true);
    try {
      const res = await api.requests.create({
        serviceType: selectedService,
        location: selectedLocation,
      });
      if (res?.success) {
        setRequestSuccess('Request submitted. Admin can now see your pinned location instantly.');
      }
    } catch (error) {
      setRequestError(error.message || 'Failed to submit request.');
    } finally {
      setIsSubmittingRequest(false);
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-5 md:space-y-6 max-w-7xl mx-auto pb-24 md:pb-6">
      
      {/* Dark Theme Header */}
      <header className="relative bg-white border-none shadow-[0_15px_35px_rgba(0,0,0,0.05)] text-earth-brown p-4 md:p-6 rounded-[1.2rem] overflow-hidden">
        <div className="absolute top-0 right-0 w-full h-full opacity-[0.03] bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white via-transparent to-transparent pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <p className="text-earth-primary text-xs md:text-sm font-bold mb-0.5 tracking-wider uppercase">Welcome back,</p>
            <h1 className="text-xl md:text-2xl font-black tracking-tight text-earth-brown">{isLoading ? 'Loading...' : dashboardData.name}</h1>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 md:gap-6">
        
        {/* Left Column: Main Actions & Insights */}
        <div className="lg:col-span-8 space-y-5 md:space-y-6">
          <Card className="bg-white border-none shadow-[0_15px_35px_rgba(0,0,0,0.05)] rounded-[1.2rem] overflow-hidden">
            <CardContent className="p-4 md:p-5 space-y-4">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <h2 className="text-base md:text-lg font-black text-earth-brown uppercase tracking-wide">Quick Service Request</h2>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-earth-mut mt-1">Tap on map to select work location</p>
                </div>
                <Button
                  type="button"
                  onClick={useCurrentLocation}
                  disabled={isLocating}
                  variant="outline"
                  className="h-9 text-[10px] font-black uppercase tracking-widest"
                >
                  {isLocating ? <Loader2 size={14} className="animate-spin mr-1" /> : <Navigation size={14} className="mr-1" />}
                  Use Current Location
                </Button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {services.map((service) => {
                  const active = selectedService === service.name;
                  return (
                    <button
                      key={service.id}
                      type="button"
                      onClick={() => setSelectedService(service.name)}
                      className={cn(
                        'p-2 rounded-lg border text-[10px] font-black uppercase tracking-widest transition-all',
                        active ? 'bg-earth-primary text-white border-earth-primary' : 'bg-earth-card-alt text-earth-brown border-earth-dark/10 hover:border-earth-primary/40'
                      )}
                    >
                      {service.name}
                    </button>
                  );
                })}
              </div>

              <RequestLocationMap selectedLocation={selectedLocation} onPick={setSelectedLocation} />

              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="text-[11px] font-bold text-earth-sub">
                  {selectedLocation
                    ? `Pinned: ${selectedLocation.lat.toFixed(6)}, ${selectedLocation.lng.toFixed(6)}`
                    : 'No pin selected yet.'}
                </div>
                <Button
                  type="button"
                  onClick={submitPinnedRequest}
                  disabled={isSubmittingRequest}
                  className="bg-accent hover:opacity-90 text-white text-[10px] font-black uppercase tracking-widest h-10"
                >
                  {isSubmittingRequest ? <Loader2 size={14} className="animate-spin mr-1" /> : null}
                  Submit Request
                </Button>
              </div>

              {requestError ? <p className="text-[11px] font-bold text-red-600">{requestError}</p> : null}
              {requestSuccess ? <p className="text-[11px] font-bold text-earth-green">{requestSuccess}</p> : null}
            </CardContent>
          </Card>

          {/* Stats for Left Side */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-5">
            {stats.slice(0, 2).map((stat, i) => {
              const Icon = stat.icon;
              return (
                <Card key={i} className="bg-white border-none shadow-[0_15px_35px_rgba(0,0,0,0.05)] hover:shadow-[0_20px_50px_rgba(0,0,0,0.08)] transition-shadow rounded-[1.2rem] h-full relative overflow-hidden group">
                  <div className={cn("absolute top-0 left-0 w-full h-1.5", i === 0 ? "bg-earth-green" : "bg-earth-primary")}></div>
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-earth-primary/5 to-transparent rounded-full blur-2xl transform translate-x-1/2 -translate-y-1/2 pointer-events-none group-hover:scale-150 transition-transform duration-700"></div>
                  <CardContent className="p-4 flex items-center justify-between h-full">
                    <div>
                      <p className="text-[10px] font-black text-earth-mut uppercase tracking-widest mb-1">{stat.label}</p>
                      <h3 className="text-xl font-black text-earth-brown">{isLoading ? '-' : stat.value}</h3>
                    </div>
                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center border border-earth-dark/15 shadow-inner", stat.bg, stat.color)}>
                      <Icon size={20} />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Activity Section */}
          <div className="flex flex-col gap-5 md:gap-6 mt-5 md:mt-6">
            <div className="space-y-5 md:space-y-6 flex flex-col h-full">
              {/* Main CTA Card */}
              <Card className="bg-earth-primary text-earth-brown border-none shadow-[0_10px_30px_rgba(234,179,8,0.1)] relative overflow-hidden rounded-[1.2rem]">
                <div className="absolute top-0 right-0 p-3 opacity-10 pointer-events-none transform translate-x-2 -translate-y-2">
                  <Tractor size={80} />
                </div>
                <CardContent className="p-4 md:p-5 space-y-2.5 relative z-10">
                  <div>
                    <h2 className="text-lg md:text-xl font-black mb-1 tracking-tight uppercase italic leading-none">Need a Tractor?</h2>
                    <p className="text-earth-brown/80 font-bold text-[10px] md:text-[11px] leading-snug">Book machinery in minutes with estimated wait times.</p>
                  </div>
                  <Link to="/farmer/book" className="inline-block bg-accent text-white hover:opacity-90 px-4 py-2 text-[10px] md:text-[11px] font-black uppercase tracking-widest rounded-lg shadow-md transition-transform hover:-translate-y-0.5 mt-1">
                    Book Now <ChevronRight className="inline ml-1" size={12} strokeWidth={3} />
                  </Link>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <div className="space-y-3 flex-1 flex flex-col">
                <div className="flex justify-between items-center px-1">
                  <h3 className="font-bold text-earth-brown tracking-tight text-xs uppercase tracking-widest">Recent Activity</h3>
                  <Link to="/farmer/track" className="text-[10px] font-black text-earth-primary hover:text-earth-primary-hover uppercase tracking-widest">Track</Link>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-5 flex-1">
                  {isLoading ? (
                    <Card className="bg-white shadow-[0_10px_30px_rgba(0,0,0,0.03)] border-none rounded-[1.2rem] md:col-span-3">
                      <CardContent className="p-4 flex items-center justify-center h-[72px]">
                         <Clock className="animate-spin text-earth-mut" size={16} />
                      </CardContent>
                    </Card>
                  ) : recentActivity.length > 0 ? (
                    recentActivity.slice(0, 3).map((activity, idx) => (
                      <Link key={idx} to="/farmer/track" className="block group">
                        <Card className="bg-white border-none shadow-[0_10px_30px_rgba(0,0,0,0.03)] hover:shadow-[0_20px_50px_rgba(0,0,0,0.08)] transition-all rounded-[1.2rem] relative overflow-hidden h-full">
                          <div className={cn("absolute top-0 left-0 w-1 h-full", activity.status.toLowerCase() === 'completed' ? 'bg-earth-primary' : 'bg-earth-accent')}></div>
                          <CardContent className="p-4 flex items-center justify-between h-full">
                            <div>
                              <p className={cn("text-[9px] font-black uppercase tracking-widest leading-none mb-1", activity.status.toLowerCase() === 'completed' ? 'text-earth-primary' : 'text-earth-accent')}>
                                {activity.status.replace('_', ' ')} : {new Date(activity.created_at).toLocaleDateString()}
                              </p>
                              <h4 className="font-black text-earth-brown text-sm group-hover:text-earth-primary transition-colors uppercase tracking-tight">{activity.service_type}</h4>
                              <p className="text-[10px] text-earth-sub font-semibold uppercase tracking-widest leading-none mt-1">{activity.land_size} Hectares</p>
                            </div>
                            <History size={18} className="text-earth-mut group-hover:text-earth-primary transition-colors shrink-0 ml-2" />
                          </CardContent>
                        </Card>
                      </Link>
                    ))
                  ) : (
                    <Card className="bg-white shadow-[0_10px_30px_rgba(0,0,0,0.03)] border-none rounded-[1.2rem] h-full min-h-[120px] md:col-span-3">
                        <CardContent className="p-4 flex items-center justify-center text-[10px] font-bold text-earth-mut uppercase tracking-widest h-full">
                           No Recent Activity
                        </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Mini Widgets & Schedule */}
        <div className="lg:col-span-4 space-y-5">
          <div className="space-y-4">
            {/* Stat for Right Side */}
            <Card className="bg-white border-none shadow-[0_15px_35px_rgba(0,0,0,0.05)] hover:shadow-[0_20px_50px_rgba(0,0,0,0.08)] transition-shadow rounded-[1.2rem] relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-1.5 bg-blue-500"></div>
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-earth-primary/5 to-transparent rounded-full blur-2xl transform translate-x-1/2 -translate-y-1/2 pointer-events-none group-hover:scale-150 transition-transform duration-700"></div>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black text-earth-mut uppercase tracking-widest mb-1">{stats[2].label}</p>
                  <h3 className="text-xl font-black text-earth-brown">{isLoading ? '-' : stats[2].value}</h3>
                </div>
                {(() => {
                  const Icon = stats[2].icon;
                  return (
                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center border border-earth-dark/15 shadow-inner", stats[2].bg, stats[2].color)}>
                      <Icon size={20} />
                    </div>
                  );
                })()}
              </CardContent>
            </Card>

            <Card className="bg-white border-none shadow-[0_15px_35px_rgba(0,0,0,0.05)] hover:shadow-[0_20px_50px_rgba(0,0,0,0.08)] transition-shadow rounded-[1.2rem]">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 bg-earth-card border border-earth-dark/15 rounded-lg flex items-center justify-center text-earth-primary shrink-0 shadow-inner">
                  <MapPin size={18} />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-black text-earth-mut uppercase tracking-widest mb-0.5">Primary Farm</p>
                  <p className="font-bold text-earth-brown text-[11px] truncate leading-tight">
                    {isLoading ? '...' : dashboardData.location || 'Unknown Location'}
                  </p>
                </div>
              </CardContent>
            </Card>


          </div>

          {/* Upcoming Schedule */}
          <div className="space-y-3">
            <h3 className="font-bold text-earth-brown tracking-tight text-xs uppercase tracking-widest px-1">Upcoming Jobs</h3>
            <div className="space-y-2.5">
              {isLoading ? (
                <div className="bg-earth-card-alt/30 p-4 rounded-xl border border-earth-dark/10/50 text-center flex items-center justify-center h-[74px]">
                  <Clock className="animate-spin text-earth-mut" size={16} />
                </div>
              ) : upcomingJobs.length > 0 ? (
                upcomingJobs.map((job, idx) => {
                  const jobDate = new Date(job.date);
                  return (
                    <div key={idx} className="flex gap-4 items-center bg-white shadow-[0_10px_30px_rgba(0,0,0,0.03)] hover:shadow-[0_20px_50px_rgba(0,0,0,0.08)] transition-shadow p-4 rounded-[1.2rem]">
                      <div className="w-12 h-12 bg-earth-card rounded-xl flex flex-col items-center justify-center border border-earth-dark/10 shrink-0 shadow-inner">
                        <span className="text-[9px] font-black text-earth-primary uppercase leading-none mb-0.5">{jobDate.toLocaleString('default', { month: 'short' })}</span>
                        <span className="text-base font-black text-earth-brown leading-none">{jobDate.getDate()}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-black text-earth-brown truncate uppercase tracking-wide leading-none">{job.service_type}</p>
                        <p className="text-[9px] text-earth-mut font-bold uppercase tracking-widest mt-1">Status: {job.status}</p>
                      </div>
                      <Calendar size={14} className="text-earth-mut" />
                    </div>
                  );
                })
              ) : (
                <div className="bg-earth-card-alt/30 p-4 rounded-xl border border-earth-dark/10/50 text-center flex items-center justify-center h-[74px]">
                   <p className="text-[10px] font-black text-earth-mut uppercase tracking-widest">No upcoming jobs</p>
                </div>
              )}
              
              <Link to="/farmer/history" className="block text-center p-2 text-[10px] font-black text-earth-mut hover:text-earth-primary border border-dashed border-earth-dark/15 rounded-lg transition-colors uppercase tracking-widest">Full Schedule</Link>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
