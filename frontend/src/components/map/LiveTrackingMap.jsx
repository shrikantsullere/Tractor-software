import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, Marker, Polyline, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { io } from 'socket.io-client';
import 'leaflet/dist/leaflet.css';

const DEFAULT_CENTER = { lat: 30.900965, lng: 75.857277 };
const TRACKING_ROOM = 'default-room';
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
const OPENFREE_TILES = 'https://tiles.openfreemap.org/styles/liberty/{z}/{x}/{y}.png';
const OSM_FALLBACK_TILES = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

const tractorIcon = L.divIcon({
  html: '<div style="background:#16a34a;color:#fff;border-radius:12px;padding:8px 10px;font-size:20px;box-shadow:0 4px 14px rgba(0,0,0,.25)">🚜</div>',
  className: '',
  iconSize: [42, 42],
  iconAnchor: [21, 38],
});

const farmerIcon = L.divIcon({
  html: '<div style="background:#dc2626;color:#fff;border-radius:9999px;padding:8px;font-size:18px;box-shadow:0 4px 14px rgba(0,0,0,.25)">📍</div>',
  className: '',
  iconSize: [36, 36],
  iconAnchor: [18, 34],
});

const getNavigationArrowIcon = (headingDeg = 0) =>
  L.divIcon({
    html: `<div style="width:0;height:0;border-left:10px solid transparent;border-right:10px solid transparent;border-bottom:18px solid #2563eb;transform: rotate(${headingDeg}deg);filter: drop-shadow(0 2px 4px rgba(0,0,0,.35));"></div>`,
    className: '',
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  });

function DestinationPicker({ enabled, onPick }) {
  useMapEvents({
    click(event) {
      if (!enabled) return;
      const { lat, lng } = event.latlng;
      onPick({ lat, lng });
    },
  });
  return null;
}

function RecenterMap({ center, enabled }) {
  const map = useMap();
  useEffect(() => {
    if (!enabled) return;
    if (!center) return;
    map.setView([center.lat, center.lng], map.getZoom(), { animate: true });
  }, [center, enabled, map]);
  return null;
}

function FitRouteBounds({ route, enabled }) {
  const map = useMap();
  useEffect(() => {
    if (!enabled) return;
    if (!route || route.length < 2) return;
    map.fitBounds(route, { padding: [40, 40] });
  }, [route, enabled, map]);
  return null;
}

function MapInteractionWatcher({ onManualInteraction }) {
  useMapEvents({
    dragstart() {
      onManualInteraction();
    },
    zoomstart() {
      onManualInteraction();
    },
  });
  return null;
}

function haversineKm(a, b) {
  if (!a || !b) return 0;
  const toRad = (d) => (d * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const x = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLng / 2) * Math.sin(dLng / 2) * Math.cos(lat1) * Math.cos(lat2);
  const y = 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
  return R * y;
}

function computeHeadingDeg(from, to) {
  if (!from || !to) return 0;
  const toRad = (d) => (d * Math.PI) / 180;
  const toDeg = (r) => (r * 180) / Math.PI;
  const lat1 = toRad(from.lat);
  const lat2 = toRad(to.lat);
  const dLng = toRad(to.lng - from.lng);
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

function parsePinnedCoordinates(text) {
  if (!text) return null;
  const match = text.match(/-?\d+(\.\d+)?/g);
  if (!match || match.length < 2) return null;
  const lat = Number(match[0]);
  const lng = Number(match[1]);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  return { lat, lng };
}

function normalizeInstruction(step) {
  const modifier = step?.maneuver?.modifier ? ` ${step.maneuver.modifier}` : '';
  const road = step?.name ? ` onto ${step.name}` : '';
  switch (step?.maneuver?.type) {
    case 'depart':
      return `Start and head${modifier}${road}`.trim();
    case 'arrive':
      return 'You have reached your destination';
    case 'turn':
      return `Turn${modifier}${road}`.trim();
    case 'new name':
      return `Continue${road}`.trim();
    case 'roundabout':
      return `Take the roundabout${road}`.trim();
    default:
      return step?.name ? `Continue on ${step.name}` : 'Continue straight';
  }
}

async function getRoute(start, end) {
  const routeUrl = `https://router.project-osrm.org/route/v1/driving/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson&steps=true`;
  const response = await fetch(routeUrl);
  if (!response.ok) {
    throw new Error('Could not load route from OSRM.');
  }

  const data = await response.json();
  const route = data?.routes?.[0];
  if (!route) {
    throw new Error('No route available for selected points.');
  }

  return {
    distanceKm: (route.distance / 1000).toFixed(2),
    etaMin: Math.ceil(route.duration / 60),
    coordinates: route.geometry.coordinates.map(([lng, lat]) => [lat, lng]),
    instructions: (route.legs?.[0]?.steps || []).map(normalizeInstruction).filter(Boolean).slice(0, 6),
  };
}

export default function LiveTrackingMap({
  role,
  roomId = TRACKING_ROOM,
  className = '',
  enableDestinationPick = false,
  initialDestination = null,
  initialDestinationQuery = '',
  destinationLabel = '',
}) {
  const [operatorLocation, setOperatorLocation] = useState(null);
  const [farmerLocation, setFarmerLocation] = useState(null);
  const [deviceLocation, setDeviceLocation] = useState(null);
  const [route, setRoute] = useState([]);
  const [distanceKm, setDistanceKm] = useState('--');
  const [etaMin, setEtaMin] = useState('--');
  const [instructions, setInstructions] = useState([]);
  const [isNavigating, setIsNavigating] = useState(false);
  const [isAutoFollow, setIsAutoFollow] = useState(true);
  const [headingDeg, setHeadingDeg] = useState(0);
  const [remainingDistanceKm, setRemainingDistanceKm] = useState('--');
  const [remainingEtaMin, setRemainingEtaMin] = useState('--');
  const [statusText, setStatusText] = useState('Initializing map...');
  const [errorText, setErrorText] = useState('');
  const [tileUrl, setTileUrl] = useState(OPENFREE_TILES);

  const socketRef = useRef(null);
  const watchIdRef = useRef(null);
  const deviceWatchIdRef = useRef(null);
  const emitGateRef = useRef(0);
  const routeTimerRef = useRef(null);
  const operatorAnimRef = useRef(null);
  const lowAccuracyCooldownRef = useRef(0);
  const hasShownGpsIssueRef = useRef(false);

  const center = useMemo(() => {
    if (role === 'operator') return operatorLocation || deviceLocation || farmerLocation || DEFAULT_CENTER;
    if (role === 'admin') return farmerLocation || operatorLocation || deviceLocation || DEFAULT_CENTER;
    return farmerLocation || operatorLocation || deviceLocation || DEFAULT_CENTER;
  }, [farmerLocation, operatorLocation, deviceLocation, role]);

  useEffect(() => {
    if (!navigator.geolocation) return;
    deviceWatchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        setDeviceLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      () => console.warn('Device geolocation failed'),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
    );
    return () => {
      if (deviceWatchIdRef.current) navigator.geolocation.clearWatch(deviceWatchIdRef.current);
    };
  }, []);

  const emitFarmerDestination = useCallback((location) => {
    if (!socketRef.current || !location) return;
    socketRef.current.emit('farmer:destination:update', {
      roomId,
      lat: location.lat,
      lng: location.lng,
    });
  }, [roomId]);

  useEffect(() => {
    if (!initialDestination) return;
    if (!Number.isFinite(initialDestination.lat) || !Number.isFinite(initialDestination.lng)) return;
    setFarmerLocation({
      lat: Number(initialDestination.lat),
      lng: Number(initialDestination.lng),
    });
    setStatusText(
      destinationLabel
        ? `Route loaded for ${destinationLabel}.`
        : 'Route loaded for assigned destination.'
    );
  }, [initialDestination, destinationLabel]);

  useEffect(() => {
    if (initialDestination) return;
    if (!initialDestinationQuery?.trim()) return;

    const parsedPinned = parsePinnedCoordinates(initialDestinationQuery);
    if (parsedPinned) {
      setFarmerLocation(parsedPinned);
      setStatusText('Destination loaded from pinned coordinates.');
      return;
    }

    const geocodeDestination = async () => {
      try {
        const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(initialDestinationQuery)}`;
        const response = await fetch(url, {
          headers: { Accept: 'application/json' }
        });
        const data = await response.json();
        const first = data?.[0];
        if (!first) {
          setErrorText('Destination not found from location text.');
          return;
        }
        setFarmerLocation({
          lat: Number(first.lat),
          lng: Number(first.lon),
        });
        setStatusText('Destination resolved from location text.');
      } catch (error) {
        setErrorText('Could not resolve destination location.');
      }
    };

    geocodeDestination();
  }, [initialDestination, initialDestinationQuery]);

  const animateOperator = useCallback((nextPoint) => {
    if (!nextPoint) return;
    if (!operatorLocation) {
      setOperatorLocation(nextPoint);
      return;
    }

    if (operatorAnimRef.current) {
      cancelAnimationFrame(operatorAnimRef.current);
    }

    const start = operatorLocation;
    const startedAt = performance.now();
    const duration = 1200;

    const step = (ts) => {
      const elapsed = ts - startedAt;
      const t = Math.min(elapsed / duration, 1);
      const eased = t * (2 - t);

      setOperatorLocation({
        lat: start.lat + (nextPoint.lat - start.lat) * eased,
        lng: start.lng + (nextPoint.lng - start.lng) * eased,
      });

      if (t < 1) {
        operatorAnimRef.current = requestAnimationFrame(step);
      }
    };

    operatorAnimRef.current = requestAnimationFrame(step);
  }, [operatorLocation]);

  const scheduleRouteUpdate = useCallback((start, end) => {
    if (!start || !end) return;
    if (routeTimerRef.current) {
      clearTimeout(routeTimerRef.current);
    }

    routeTimerRef.current = setTimeout(async () => {
      try {
        const routeData = await getRoute(start, end);
        setRoute(routeData.coordinates);
        setDistanceKm(routeData.distanceKm);
        setEtaMin(routeData.etaMin);
        setInstructions(routeData.instructions || []);
      } catch (error) {
        setErrorText(error.message || 'Unable to calculate route.');
      }
    }, 1000);
  }, []);

  useEffect(() => {
    const socket = io(SOCKET_URL, {
      transports: ['websocket'],
      reconnection: true,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setStatusText('Connected. Waiting for live updates...');
      socket.emit('tracking:join', { roomId, role });
    });

    socket.on('tracking:state', (payload) => {
      if (payload?.operatorLocation) {
        animateOperator(payload.operatorLocation);
      }
      if (payload?.farmerLocation) {
        setFarmerLocation(payload.farmerLocation);
      }
    });

    socket.on('location:update', (payload) => {
      if (!payload) return;
      animateOperator({ lat: payload.lat, lng: payload.lng });
      setStatusText('Operator location updated in real time.');
    });

    socket.on('farmer:destination:update', (payload) => {
      if (!payload) return;
      setFarmerLocation({ lat: payload.lat, lng: payload.lng });
    });

    socket.on('connect_error', () => {
      setErrorText('Socket connection failed. Check backend server.');
    });

    return () => {
      socket.disconnect();
    };
  }, [animateOperator, role, roomId]);

  useEffect(() => {
    if (!navigator.geolocation) return;
    if (role !== 'operator') return;

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const point = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };

        if (role === 'operator') {
          animateOperator(point);
          const now = Date.now();
          if (socketRef.current && now - emitGateRef.current > 2000) {
            emitGateRef.current = now;
            socketRef.current.emit('location:update', {
              roomId,
              lat: point.lat,
              lng: point.lng,
              timestamp: now,
            });
          }
        }

      },
      (error) => {
        if (error.code === 1) {
          setErrorText('Location permission denied. Enable browser location for live turn-by-turn guidance.');
          return;
        }
        if (error.code === 3) {
          // Fallback to coarse location when high-accuracy GPS stalls.
          const now = Date.now();
          if (now - lowAccuracyCooldownRef.current > 12000 && navigator.geolocation) {
            lowAccuracyCooldownRef.current = now;
            navigator.geolocation.getCurrentPosition(
              (position) => {
                const point = {
                  lat: position.coords.latitude,
                  lng: position.coords.longitude,
                };
                animateOperator(point);
                setErrorText('');
                setStatusText('Using fallback GPS accuracy. Navigation continues.');
                hasShownGpsIssueRef.current = false;
              },
              () => {
                if (!operatorLocation && !hasShownGpsIssueRef.current) {
                  setErrorText('Live GPS is unavailable right now. Set location permission to Always Allow for smoother tracking.');
                  hasShownGpsIssueRef.current = true;
                }
              },
              { enableHighAccuracy: false, timeout: 12000, maximumAge: 60000 }
            );
            return;
          }
          // Silence repeated timeout noise when last known location is already available.
          if (!operatorLocation && !hasShownGpsIssueRef.current) {
            setErrorText('Live GPS is unavailable right now. Set location permission to Always Allow for smoother tracking.');
            hasShownGpsIssueRef.current = true;
          }
          return;
        }
        if (!operatorLocation && !hasShownGpsIssueRef.current) {
          setErrorText('Live GPS is unstable on this device.');
          hasShownGpsIssueRef.current = true;
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 25000,
        maximumAge: 12000,
      }
    );

    return () => {
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      if (operatorAnimRef.current) {
        cancelAnimationFrame(operatorAnimRef.current);
      }
      if (routeTimerRef.current) {
        clearTimeout(routeTimerRef.current);
      }
    };
  }, [animateOperator, role, roomId]);

  useEffect(() => {
    if (!operatorLocation || !farmerLocation) return;
    scheduleRouteUpdate(operatorLocation, farmerLocation);
  }, [operatorLocation, farmerLocation, scheduleRouteUpdate]);

  useEffect(() => {
    if (!isNavigating || !operatorLocation || route.length < 2) return;
    const routePoints = route.map(([lat, lng]) => ({ lat, lng }));
    let nearestIdx = 0;
    let nearestDist = Infinity;
    for (let i = 0; i < routePoints.length; i += 1) {
      const d = haversineKm(operatorLocation, routePoints[i]);
      if (d < nearestDist) {
        nearestDist = d;
        nearestIdx = i;
      }
    }

    const nextPoint = routePoints[Math.min(nearestIdx + 1, routePoints.length - 1)];
    if (nextPoint) {
      setHeadingDeg(computeHeadingDeg(operatorLocation, nextPoint));
    }

    let remain = 0;
    for (let i = nearestIdx; i < routePoints.length - 1; i += 1) {
      remain += haversineKm(routePoints[i], routePoints[i + 1]);
    }
    setRemainingDistanceKm(remain.toFixed(2));
    setRemainingEtaMin(String(Math.max(1, Math.ceil((remain / 35) * 60))));
  }, [isNavigating, operatorLocation, route]);

  const handleDestinationPick = useCallback((location) => {
    setFarmerLocation(location);
    emitFarmerDestination(location);
    setStatusText('Farmer destination updated.');
  }, [emitFarmerDestination]);

  const geolocationUnavailable = !navigator.geolocation;

  return (
    <div className={`relative w-full h-screen ${className}`}>
      <div className="absolute z-[1000] top-4 left-4 bg-white/95 rounded-xl shadow-md border border-neutral-200 p-3 min-w-[220px]">
        <p className="text-xs font-bold text-neutral-800 uppercase">{role} tracking</p>
        <p className="text-[11px] text-neutral-600 mt-1">{statusText}</p>
        <p className="text-[11px] mt-2 text-neutral-800">Distance: <span className="font-semibold">{distanceKm} km</span></p>
        <p className="text-[11px] text-neutral-800">ETA: <span className="font-semibold">{etaMin} min</span></p>
        <p className="text-[11px] text-neutral-800 mt-1">
          Live: <span className="font-semibold">
            {(operatorLocation || farmerLocation)
              ? `${(operatorLocation || farmerLocation).lat.toFixed(5)}, ${(operatorLocation || farmerLocation).lng.toFixed(5)}`
              : '--'}
          </span>
        </p>
        {geolocationUnavailable ? (
          <p className="text-[11px] text-red-600 mt-2">Geolocation is not supported in this browser.</p>
        ) : null}
        {tileUrl === OSM_FALLBACK_TILES ? (
          <p className="text-[11px] text-neutral-500 mt-2">Map is running on backup tiles.</p>
        ) : null}
        {errorText ? <p className="text-[11px] text-red-600 mt-2">{errorText}</p> : null}
        {instructions.length > 0 ? (
          <div className="mt-3 border-t border-neutral-200 pt-2">
            <p className="text-[10px] font-bold text-neutral-700 uppercase">Route Steps</p>
            <ul className="mt-1 space-y-1">
              {instructions.map((step, idx) => (
                <li key={`${step}-${idx}`} className="text-[10px] text-neutral-700 leading-tight">
                  {idx + 1}. {step}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        {role === 'operator' && route.length > 1 ? (
          <button
            type="button"
            onClick={() => setIsNavigating((prev) => !prev)}
            className="mt-3 w-full h-8 rounded-lg bg-neutral-900 text-white text-[10px] font-bold uppercase tracking-widest hover:opacity-90 transition-opacity"
          >
            {isNavigating ? 'Navigation Running' : 'Start Navigation'}
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => setIsAutoFollow((prev) => !prev)}
          className="mt-2 w-full h-8 rounded-lg border border-neutral-300 bg-white text-neutral-800 text-[10px] font-bold uppercase tracking-widest hover:bg-neutral-50 transition-colors"
        >
          {isAutoFollow ? 'Auto Follow: ON' : 'Auto Follow: OFF'}
        </button>
        {isNavigating ? (
          <div className="mt-2 border-t border-neutral-200 pt-2">
            <p className="text-[10px] font-bold text-blue-700 uppercase">Navigation Active</p>
            <p className="text-[10px] text-neutral-700 mt-1">
              Remaining: <span className="font-semibold">{remainingDistanceKm} km</span> • ETA: <span className="font-semibold">{remainingEtaMin} min</span>
            </p>
            {instructions[0] ? (
              <p className="text-[10px] text-neutral-800 mt-1"><span className="font-semibold">Next:</span> {instructions[0]}</p>
            ) : null}
          </div>
        ) : null}
      </div>

      <MapContainer center={center} zoom={13} className="w-full h-full" scrollWheelZoom>
        <TileLayer
          attribution='&copy; OpenFreeMap contributors'
          url={tileUrl}
          eventHandlers={{
            tileerror: () => {
              if (tileUrl !== OSM_FALLBACK_TILES) {
                setTileUrl(OSM_FALLBACK_TILES);
                setStatusText('Map loaded with backup tiles.');
                setErrorText('');
                return;
              }
              setErrorText('Map tiles failed to load. Please check your internet connection.');
            },
          }}
        />
        <RecenterMap center={center} enabled={isAutoFollow} />
        <FitRouteBounds route={route} enabled={isAutoFollow} />
        <MapInteractionWatcher onManualInteraction={() => setIsAutoFollow(false)} />

        <DestinationPicker enabled={enableDestinationPick} onPick={handleDestinationPick} />

        {deviceLocation ? (
          <Marker
            position={[deviceLocation.lat, deviceLocation.lng]}
            icon={L.divIcon({
              html: '<div style="background:#2563eb;color:white;border-radius:9999px;padding:5px;width:12px;height:12px;border:2px solid white;box-shadow:0 0 10px rgba(0,0,0,0.3)"></div>',
              className: '',
              iconSize: [20, 20],
              iconAnchor: [10, 10],
            })}
          >
            <Popup>
              <div className="text-[10px] font-black uppercase">You are here</div>
            </Popup>
          </Marker>
        ) : null}

        {operatorLocation ? (
          <Marker
            position={[operatorLocation.lat, operatorLocation.lng]}
            icon={isNavigating ? getNavigationArrowIcon(headingDeg) : tractorIcon}
          />
        ) : null}

        {farmerLocation ? (
          <Marker
            position={[farmerLocation.lat, farmerLocation.lng]}
            icon={farmerIcon}
          />
        ) : null}

        {route.length > 1 ? (
          <Polyline positions={route} pathOptions={{ color: '#2563eb', weight: 5, opacity: 0.9 }} />
        ) : null}
      </MapContainer>
    </div>
  );
}
