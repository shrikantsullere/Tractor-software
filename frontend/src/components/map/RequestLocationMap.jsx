import { useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const OPENFREE_TILES = 'https://tiles.openfreemap.org/styles/liberty/{z}/{x}/{y}.png';
const OSM_FALLBACK_TILES = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const DEFAULT_CENTER = { lat: 30.900965, lng: 75.857277 };

const pinIcon = L.divIcon({
  html: '<div style="background:#dc2626;color:white;border-radius:9999px;padding:8px 10px;font-size:18px;box-shadow:0 4px 14px rgba(0,0,0,.25)">📍</div>',
  className: '',
  iconSize: [36, 36],
  iconAnchor: [18, 34],
});

function Picker({ onPick }) {
  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      onPick({ lat, lng });
    },
  });
  return null;
}

function RecenterMap({ center }) {
  const map = useMap();
  useEffect(() => {
    if (!center) return;
    map.setView([center.lat, center.lng], map.getZoom(), { animate: true });
  }, [center, map]);
  return null;
}

export default function RequestLocationMap({ selectedLocation, onPick, autoUseCurrentLocation = true }) {
  const center = useMemo(() => selectedLocation || DEFAULT_CENTER, [selectedLocation]);
  const [tileUrl, setTileUrl] = useState(OPENFREE_TILES);
  const autoLocationLoadedRef = useRef(false);
  const watchIdRef = useRef(null);
  const manualPinRef = useRef(false);

  useEffect(() => {
    if (!autoUseCurrentLocation || selectedLocation || autoLocationLoadedRef.current) return;
    if (!navigator.geolocation) return;

    autoLocationLoadedRef.current = true;
    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        if (manualPinRef.current) return;
        const lat = Number(position.coords.latitude.toFixed(6));
        const lng = Number(position.coords.longitude.toFixed(6));
        onPick({ lat, lng }, 'gps');
      },
      () => {
        // Silent fallback to default center when GPS read fails.
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 2000 }
    );

    return () => {
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [autoUseCurrentLocation, onPick, selectedLocation]);

  return (
    <div className="w-full h-[420px] rounded-2xl overflow-hidden border border-earth-dark/10">
      <MapContainer center={center} zoom={13} className="w-full h-full" scrollWheelZoom>
        <TileLayer
          attribution="&copy; OpenFreeMap contributors"
          url={tileUrl}
          eventHandlers={{
            tileerror: () => {
              if (tileUrl !== OSM_FALLBACK_TILES) {
                setTileUrl(OSM_FALLBACK_TILES);
              }
            },
          }}
        />
        <RecenterMap center={center} />
        <Picker
          onPick={(point) => {
            manualPinRef.current = true;
            onPick(point, 'manual');
          }}
        />
        {selectedLocation ? (
          <Marker position={[selectedLocation.lat, selectedLocation.lng]} icon={pinIcon} />
        ) : null}
      </MapContainer>
    </div>
  );
}
