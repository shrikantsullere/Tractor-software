import { useEffect, useMemo, useState } from 'react';
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import { io } from 'socket.io-client';
import L from 'leaflet';
import { api } from '../../lib/api';
import { Button } from '../../components/ui/Button';
import 'leaflet/dist/leaflet.css';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
const OPENFREE_TILES = 'https://tiles.openfreemap.org/styles/liberty/{z}/{x}/{y}.png';
const OSM_FALLBACK_TILES = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const DEFAULT_CENTER = { lat: 30.900965, lng: 75.857277 };

const requestPinIcon = L.divIcon({
  html: '<div style="background:#dc2626;color:white;border-radius:9999px;padding:8px 10px;font-size:18px;box-shadow:0 4px 14px rgba(0,0,0,.25)">📍</div>',
  className: '',
  iconSize: [36, 36],
  iconAnchor: [18, 34],
});

const operatorIcon = L.divIcon({
  html: '<div style="background:#16a34a;color:#fff;border-radius:12px;padding:8px 10px;font-size:20px;box-shadow:0 4px 14px rgba(0,0,0,.25)">🚜</div>',
  className: '',
  iconSize: [42, 42],
  iconAnchor: [21, 38],
});

export default function LiveTracking() {
  const [requests, setRequests] = useState([]);
  const [error, setError] = useState('');
  const [tileUrl, setTileUrl] = useState(OPENFREE_TILES);
  const [operatorLocation, setOperatorLocation] = useState(null);

  useEffect(() => {
    const loadInitial = async () => {
      try {
        const res = await api.requests.listAll();
        if (res?.success) {
          setRequests(res.data || []);
        }
      } catch (err) {
        setError(err.message || 'Failed to load request map.');
      }
    };
    loadInitial();

    const socket = io(SOCKET_URL, { transports: ['websocket'], reconnection: true });
    socket.on('connect', () => {
      socket.emit('tracking:join', { roomId: 'default-room', role: 'admin' });
    });
    socket.on('tracking:state', (payload) => {
      if (payload?.operatorLocation) {
        setOperatorLocation(payload.operatorLocation);
      }
    });
    socket.on('location:update', (payload) => {
      if (!payload) return;
      setOperatorLocation({ lat: payload.lat, lng: payload.lng });
    });
    socket.on('new:request', (payload) => {
      setRequests((prev) => [payload, ...prev.filter((item) => item.id !== payload.id)]);
    });
    socket.on('request:updated', (payload) => {
      setRequests((prev) => prev.map((item) => (item.id === payload.id ? payload : item)));
    });
    socket.on('connect_error', () => setError('Realtime socket disconnected.'));

    return () => socket.disconnect();
  }, []);

  const center = useMemo(() => {
    const first = requests.find((item) => Number.isFinite(item.latitude) && Number.isFinite(item.longitude));
    if (!first) return DEFAULT_CENTER;
    return { lat: first.latitude, lng: first.longitude };
  }, [requests]);

  const acceptRequest = async (id) => {
    try {
      const res = await api.requests.accept(id);
      if (res?.success) {
        setRequests((prev) => prev.map((item) => (item.id === id ? res.data : item)));
      }
    } catch (err) {
      setError(err.message || 'Failed to accept request.');
    }
  };

  return (
    <div className="space-y-3">
      <div className="text-[10px] uppercase font-black tracking-widest text-earth-sub">
        Operator Live + Farmer Request Pins ({requests.length})
      </div>
      {error ? <p className="text-[11px] font-bold text-red-600">{error}</p> : null}
      <div className="h-[calc(100vh-10rem)] rounded-2xl overflow-hidden border border-earth-dark/10">
        <MapContainer center={center} zoom={12} className="w-full h-full" scrollWheelZoom>
          <TileLayer
            attribution="&copy; OpenFreeMap contributors"
            url={tileUrl}
            eventHandlers={{
              tileerror: () => {
                if (tileUrl !== OSM_FALLBACK_TILES) {
                  setTileUrl(OSM_FALLBACK_TILES);
                  setError('');
                  return;
                }
                setError('Map tiles failed to load.');
              },
            }}
          />
          {operatorLocation ? (
            <Marker
              position={[operatorLocation.lat, operatorLocation.lng]}
              icon={operatorIcon}
            >
              <Popup>
                <div className="text-xs font-bold">Operator Live Location</div>
              </Popup>
            </Marker>
          ) : null}
          {requests.map((request) => (
            <Marker
              key={request.id}
              position={[request.latitude, request.longitude]}
              icon={requestPinIcon}
            >
              <Popup>
                <div className="space-y-2 min-w-[200px]">
                  <div className="text-xs font-bold">{request.farmer?.name || 'Farmer'}</div>
                  <div className="text-[11px]">Service: {request.serviceType}</div>
                  <div className="text-[11px]">Status: {request.status}</div>
                  <Button
                    type="button"
                    className="w-full h-8 text-[10px] font-black uppercase tracking-widest"
                    disabled={request.status === 'accepted'}
                    onClick={() => acceptRequest(request.id)}
                  >
                    {request.status === 'accepted' ? 'Accepted' : 'Accept'}
                  </Button>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}
