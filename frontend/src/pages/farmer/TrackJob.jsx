import { useEffect, useState } from 'react';
import LiveTrackingMap from '../../components/map/LiveTrackingMap';
import { api } from '../../lib/api';

/**
 * Farmer Track Job Page.
 * Shows the farmer's LOCKED booking location and the operator's live position.
 * Farmer CANNOT change their location after booking is confirmed.
 */
export default function TrackJob() {
  const [activeBooking, setActiveBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let intervalId;

    const fetchActiveBooking = async (isFirstLoad = false) => {
      try {
        if (isFirstLoad) setLoading(true);
        
        // Fetch bookings with multiple tracking-eligible statuses in one go
        const res = await api.farmer.listBookings({ 
          status: 'ASSIGNED,IN_PROGRESS',
          limit: 1 // We only need the most recent one
        });
        
        const booking = res?.data?.bookings?.[0];

        if (booking) {
          setActiveBooking(booking);
          setError('');
          // If we found a booking, we can stop polling or slow it down. 
          // For now, let's keep it simple and just clear the error if we had one.
        } else {
          setActiveBooking(null);
          setError('No active job found. Your tractor will appear here once an operator is assigned.');
        }
      } catch (err) {
        if (isFirstLoad) setError('Failed to load tracking data.');
        console.error(err);
      } finally {
        if (isFirstLoad) setLoading(false);
      }
    };

    fetchActiveBooking(true);

    // Setup polling every 15 seconds
    intervalId = setInterval(() => {
      // Only poll if we don't have an active booking or if we want to check for status updates
      fetchActiveBooking(false);
    }, 15000);

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-earth-primary/30 border-t-earth-primary rounded-full animate-spin mx-auto"></div>
          <p className="text-[10px] font-black uppercase tracking-widest text-earth-mut">Establishing Satellite Link...</p>
        </div>
      </div>
    );
  }

  if (error || !activeBooking) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
        <div className="text-center space-y-4 max-w-sm px-6">
          <div className="w-16 h-16 bg-earth-card rounded-2xl flex items-center justify-center mx-auto border border-earth-dark/10">
            <span className="text-3xl">📍</span>
          </div>
          <p className="text-sm font-black text-earth-brown uppercase">{error || 'No Active Job'}</p>
          <p className="text-[10px] text-earth-mut font-bold uppercase tracking-widest">
            Once your booking is assigned to an operator, live tracking will be available here.
          </p>
        </div>
      </div>
    );
  }

  // Build the LOCKED destination from booking data
  const farmerDestination =
    Number.isFinite(activeBooking.farmerLatitude) && Number.isFinite(activeBooking.farmerLongitude)
      ? { lat: Number(activeBooking.farmerLatitude), lng: Number(activeBooking.farmerLongitude) }
      : null;

  return (
    <div className="relative h-full">
      {/* Booking Info Overlay */}
      <div className="absolute top-4 right-4 z-[1000] bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-earth-dark/10 p-3 max-w-[200px]">
        <p className="text-[8px] font-black uppercase tracking-widest text-earth-mut mb-1">Active Job #{activeBooking.id}</p>
        <p className="text-xs font-black text-earth-brown truncate">{activeBooking.service?.name || activeBooking.serviceNameSnapshot || 'Service'}</p>
        <p className="text-[9px] text-earth-mut font-bold mt-1 truncate">{activeBooking.location}</p>
        <div className="mt-2 flex items-center gap-1.5">
          <div className={`w-2 h-2 rounded-full ${activeBooking.status === 'IN_PROGRESS' ? 'bg-blue-500 animate-pulse' : 'bg-earth-primary animate-pulse'}`}></div>
          <span className="text-[8px] font-black uppercase tracking-widest text-earth-mut">
            {activeBooking.status === 'IN_PROGRESS' ? 'Operator Working' : 'Operator En Route'}
          </span>
        </div>
      </div>

      <LiveTrackingMap
        role="farmer"
        bookingId={activeBooking.id}
        enableDestinationPick={false}
        initialDestination={farmerDestination}
        destinationLabel={activeBooking.location || 'Your Farm'}
        className="h-full lg:h-[calc(100vh-4rem)]"
      />
    </div>
  );
}
