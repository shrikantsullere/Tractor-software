import LiveTrackingMap from '../../components/map/LiveTrackingMap';
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { api } from '../../lib/api';

export default function Navigation() {
  const location = useLocation();
  const [fallbackDestination, setFallbackDestination] = useState(null);
  const [fallbackDestinationQuery, setFallbackDestinationQuery] = useState('');
  const destination = location.state?.destination || fallbackDestination;
  const destinationQuery = location.state?.destinationQuery || fallbackDestinationQuery;
  const destinationLabel = location.state?.destinationLabel || fallbackDestination?.label || '';

  useEffect(() => {
    // If user opens navigation directly, load destination from current assigned job.
    if (location.state?.destination) return;

    const loadJobDestination = async () => {
      try {
        const res = await api.operator.getJobs();
        const activeJob = res?.data?.current_job;
        if (
          activeJob &&
          Number.isFinite(activeJob.farmerLatitude) &&
          Number.isFinite(activeJob.farmerLongitude)
        ) {
          setFallbackDestination({
            lat: Number(activeJob.farmerLatitude),
            lng: Number(activeJob.farmerLongitude),
            label: activeJob.location || 'Assigned destination',
          });
        } else if (activeJob?.location) {
          setFallbackDestinationQuery(activeJob.location);
        }
      } catch (error) {
        console.error('Failed to load navigation destination:', error);
      }
    };

    loadJobDestination();
  }, [location.state]);

  return (
    <LiveTrackingMap
      role="operator"
      className="h-full lg:h-[calc(100vh-4rem)]"
      initialDestination={destination}
      initialDestinationQuery={destinationQuery}
      destinationLabel={destinationLabel}
    />
  );
}
