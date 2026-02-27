import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Camera,
  Filter,
  Map,
  Search,
  ShieldAlert,
  Users
} from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Button } from '../../components/ui/button';
import { fetchMapOverview } from '../../redux/mapViewSlice';

const CARD_STYLES = 'rounded-xl border border-stone-brown-100 bg-white p-5 shadow-sm';

const markerTheme = {
  camera: {
    dot: 'bg-toasted-almond-500',
    text: 'Camera'
  },
  incident: {
    dot: 'bg-stone-brown-900',
    text: 'Incident'
  },
  responder: {
    dot: 'bg-olive-wood-500',
    text: 'Responder'
  },
  admin: {
    dot: 'bg-toasted-almond-700',
    text: 'Admin'
  }
};

function formatNumber(value) {
  return new Intl.NumberFormat('en-IN').format(value || 0);
}

function createMarkerIcon(colorClass) {
  const colorHexMap = {
    'bg-toasted-almond-500': '#c2793d',
    'bg-stone-brown-900': '#1e1915',
    'bg-olive-wood-500': '#af7b50',
    'bg-toasted-almond-700': '#744925'
  };

  const color = colorHexMap[colorClass] || '#c2793d';

  return L.divIcon({
    className: 'custom-map-marker',
    html: `<span style="display:block;width:14px;height:14px;border-radius:9999px;background:${color};border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.25);"></span>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7]
  });
}

function MapBoundsController({ points, bounds }) {
  const map = useMap();

  useEffect(() => {
    if (!points.length) return;

    const hasBounds = bounds && [bounds.minLat, bounds.maxLat, bounds.minLng, bounds.maxLng].every((value) => value !== null);

    if (hasBounds) {
      map.fitBounds(
        [
          [bounds.minLat, bounds.minLng],
          [bounds.maxLat, bounds.maxLng]
        ],
        { padding: [40, 40], maxZoom: 16 }
      );
      return;
    }

    map.setView([points[0].lat, points[0].lng], 13);
  }, [map, points, bounds]);

  return null;
}

export default function MapViewPage() {
  const dispatch = useDispatch();
  const { stats, points, bounds, loading, error } = useSelector((state) => state.mapView);
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [adminLocation, setAdminLocation] = useState(null);

  useEffect(() => {
    dispatch(fetchMapOverview());
  }, [dispatch]);

  useEffect(() => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setAdminLocation({
          id: 'admin-location',
          sourceId: 'admin-location',
          type: 'admin',
          title: 'Admin Location',
          subtitle: 'Current device position',
          status: 'active',
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
      },
      () => {
        setAdminLocation(null);
      }
    );
  }, []);

  const filteredPoints = useMemo(() => {
    return points.filter((point) => {
      const matchesType = selectedType === 'all' || point.type === selectedType;
      const query = search.trim().toLowerCase();
      const matchesSearch =
        !query ||
        point.title?.toLowerCase().includes(query) ||
        point.subtitle?.toLowerCase().includes(query);

      return matchesType && matchesSearch;
    });
  }, [points, search, selectedType]);

  const pointsToRender = useMemo(() => {
    if (filteredPoints.length > 0) return filteredPoints;
    if (adminLocation) return [adminLocation];
    return [];
  }, [filteredPoints, adminLocation]);

  return (
    <div className="flex-1 px-6 py-6 overflow-y-auto bg-stone-brown-50 h-screen">
      <div className="max-w-[1200px] mx-auto space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <div className={CARD_STYLES}>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-lg bg-toasted-almond-50 text-toasted-almond-500 flex items-center justify-center">
                <Camera size={20} />
              </div>
              <div>
                <p className="text-3xl font-bold text-stone-brown-900">{formatNumber(stats.activeCameras)}</p>
                <p className="text-silver-500 text-sm">Active cameras</p>
              </div>
            </div>
          </div>

          <div className={CARD_STYLES}>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-lg bg-olive-wood-50 text-olive-wood-600 flex items-center justify-center">
                <Map size={20} />
              </div>
              <div>
                <p className="text-3xl font-bold text-stone-brown-900">{formatNumber(stats.totalCameras)}</p>
                <p className="text-silver-500 text-sm">Total mapped cameras</p>
              </div>
            </div>
          </div>

          <div className={CARD_STYLES}>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-lg bg-stone-brown-100 text-stone-brown-700 flex items-center justify-center">
                <AlertTriangle size={20} />
              </div>
              <div>
                <p className="text-3xl font-bold text-stone-brown-900">{formatNumber(stats.openIncidents)}</p>
                <p className="text-silver-500 text-sm">Open incidents</p>
              </div>
            </div>
          </div>

          <div className={CARD_STYLES}>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-lg bg-toasted-almond-50 text-toasted-almond-600 flex items-center justify-center">
                <Users size={20} />
              </div>
              <div>
                <p className="text-3xl font-bold text-stone-brown-900">{formatNumber(stats.trackedResponders)}</p>
                <p className="text-silver-500 text-sm">Tracked responders</p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-stone-brown-100 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-3">
            <div>
              <h2 className="font-bold text-stone-brown-900">Map View</h2>
              <p className="text-sm text-silver-500">Cameras, incidents, and responder locations</p>
            </div>

            <div className="flex items-center gap-2">
              <div className="h-10 px-3 rounded-md border border-stone-brown-100 flex items-center gap-2 text-silver-500">
                <Search size={16} />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  className="outline-none text-sm text-stone-brown-900 placeholder:text-silver-400 bg-transparent"
                  placeholder="Search"
                />
              </div>

              <Button variant="outline" className="gap-2" onClick={() => setSelectedType('all')}>
                <Filter size={16} />
                {selectedType === 'all' ? 'All' : `Filter: ${selectedType}`}
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedType('camera')}
              >
                Cameras
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedType('incident')}
              >
                Incidents
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedType('responder')}
              >
                Responders
              </Button>
            </div>
          </div>

          <div className="relative h-[540px] w-full rounded-lg border border-stone-brown-100 overflow-hidden bg-stone-brown-100/40">
            <div className="absolute inset-0">
              <MapContainer
                center={[20.5937, 78.9629]}
                zoom={5}
                className="h-full w-full"
                scrollWheelZoom
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                <MapBoundsController points={pointsToRender} bounds={bounds} />

                {pointsToRender.map((point) => {
                  const theme = markerTheme[point.type] || markerTheme.camera;

                  return (
                    <Marker
                      key={point.id}
                      position={[point.lat, point.lng]}
                      icon={createMarkerIcon(theme.dot)}
                    >
                      <Popup>
                        <div className="text-xs">
                          <p className="font-semibold text-stone-brown-900">{point.title}</p>
                          <p className="text-silver-500">{point.subtitle}</p>
                          <p className="uppercase tracking-wide text-[10px] text-toasted-almond-600 mt-1">{theme.text}</p>
                        </div>
                      </Popup>
                    </Marker>
                  );
                })}
              </MapContainer>
            </div>

            <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
              <div className="rounded-md bg-white/90 border border-stone-brown-100 px-3 py-2 text-xs text-silver-600">
                Showing {pointsToRender.length} mapped points
              </div>
              <Button variant="outline" size="sm" onClick={() => dispatch(fetchMapOverview())}>
                Refresh
              </Button>
            </div>

            {!loading && !error && pointsToRender.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="rounded-lg bg-white border border-stone-brown-100 px-4 py-3 text-sm text-silver-500 flex items-center gap-2">
                  <ShieldAlert size={16} className="text-silver-400" />
                  No map points available and admin location access is not enabled.
                </div>
              </div>
            )}

            {loading && (
              <div className="absolute inset-0 flex items-center justify-center text-silver-500 text-sm">
                Loading map data...
              </div>
            )}

            {error && !loading && (
              <div className="absolute inset-0 flex items-center justify-center px-4">
                <div className="rounded-lg border border-stone-brown-100 bg-white px-4 py-3 text-sm text-stone-brown-700">
                  {error}
                </div>
              </div>
            )}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-silver-500">
            <span className="inline-flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-toasted-almond-500" /> Cameras</span>
            <span className="inline-flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-stone-brown-900" /> Incidents</span>
            <span className="inline-flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-olive-wood-500" /> Responders</span>
            <span className="inline-flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-toasted-almond-700" /> Admin</span>
            <span className="text-silver-400">High risk zones: {stats.highRiskZones}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
