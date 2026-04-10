import LiveTrackingMap from '../../components/map/LiveTrackingMap';

export default function TrackJob() {
  return (
    <LiveTrackingMap
      role="farmer"
      enableDestinationPick
      className="h-full lg:h-[calc(100vh-4rem)]"
    />
  );
}
