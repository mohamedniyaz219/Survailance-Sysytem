import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Camera, Edit3, Plus, Search, Trash2 } from 'lucide-react';
import { MapContainer, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Button } from '../../components/ui/button';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '../../components/ui/table';
import { Pagination } from '../../components/ui/pagination';
import { SearchableSelect } from '../../components/ui/searchable-select';
import { ConfirmDialog } from '../../components/ui/confirm-dialog';
import {
  clearCamerasError,
  createCamera,
  deleteCamera,
  fetchCameraZoneOptions,
  fetchCameras,
  setCamerasLimit,
  setCamerasPage,
  setCamerasSearch,
  setCamerasStatus,
  updateCamera
} from '../../redux/camerasSlice';

const defaultForm = {
  name: '',
  rtsp_url: '',
  location_name: '',
  zone_id: '',
  status: 'online',
  lat: '',
  lng: ''
};

const defaultMapCenter = { lat: 20.5937, lng: 78.9629 };

function FixedPinMapController({ centerTarget, onCenterUpdate, onCenterTargetHandled }) {
  const map = useMap();

  useEffect(() => {
    const center = map.getCenter();
    onCenterUpdate({
      lat: Number(center.lat.toFixed(6)),
      lng: Number(center.lng.toFixed(6))
    });
  }, []);

  useEffect(() => {
    if (!centerTarget) return;
    map.setView([centerTarget.lat, centerTarget.lng], 15);
    onCenterTargetHandled();
  }, [map, centerTarget, onCenterTargetHandled]);

  useMapEvents({
    moveend() {
      const center = map.getCenter();
      onCenterUpdate({
        lat: Number(center.lat.toFixed(6)),
        lng: Number(center.lng.toFixed(6))
      });
    }
  });

  return null;
}

export default function CamerasPage() {
  const dispatch = useDispatch();
  const {
    items,
    page,
    limit,
    totalPages,
    search,
    status,
    zoneOptions,
    zoneOptionsLoading,
    loading,
    actionLoading,
    error
  } = useSelector((state) => state.cameras);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(defaultForm);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [mapCenterTarget, setMapCenterTarget] = useState(null);
  const [addressSearch, setAddressSearch] = useState('');
  const [searchingLocation, setSearchingLocation] = useState(false);
  const [locatingCurrent, setLocatingCurrent] = useState(false);
  const [locationSearchError, setLocationSearchError] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const reverseGeocodeRequestRef = useRef(0);

  useEffect(() => {
    dispatch(fetchCameras({ page, limit, search, status }));
  }, [dispatch, page, limit, search, status]);

  const openCreateForm = () => {
    dispatch(clearCamerasError());
    dispatch(fetchCameraZoneOptions());
    setEditingId(null);
    setFormData(defaultForm);
    setSelectedLocation(defaultMapCenter);
    setMapCenterTarget(defaultMapCenter);
    setAddressSearch('');
    setLocationSearchError('');
    setSearchResults([]);
    setIsFormOpen(true);
  };

  const openEditForm = (camera) => {
    dispatch(clearCamerasError());
    dispatch(fetchCameraZoneOptions());
    setEditingId(camera.id);
    setFormData({
      name: camera.name || '',
      rtsp_url: camera.rtsp_url || '',
      location_name: camera.location_name || '',
      zone_id: camera.zone_id || '',
      status: camera.status || 'online',
      lat: camera.lat ?? '',
      lng: camera.lng ?? ''
    });
    if (camera.lat !== null && camera.lat !== undefined && camera.lng !== null && camera.lng !== undefined) {
      const current = { lat: Number(camera.lat), lng: Number(camera.lng) };
      setSelectedLocation(current);
      setMapCenterTarget(current);
    } else {
      setSelectedLocation(defaultMapCenter);
      setMapCenterTarget(defaultMapCenter);
    }
    setAddressSearch(camera.location_name || '');
    setLocationSearchError('');
    setSearchResults([]);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingId(null);
    setFormData(defaultForm);
    setSelectedLocation(null);
    setMapCenterTarget(null);
    setAddressSearch('');
    setLocationSearchError('');
    setSearchResults([]);
  };

  const onChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const onSubmit = async (event) => {
    event.preventDefault();

    if (!selectedLocation) {
      setLocationSearchError('Pick a location from map or search an address first.');
      return;
    }

    const payload = {
      name: formData.name.trim(),
      rtsp_url: formData.rtsp_url.trim(),
      location_name: formData.location_name.trim(),
      zone_id: formData.zone_id || null,
      status: formData.status,
      lat: selectedLocation.lat,
      lng: selectedLocation.lng
    };

    const result = editingId
      ? await dispatch(updateCamera({ id: editingId, data: payload }))
      : await dispatch(createCamera(payload));

    if (!result.error) {
      closeForm();
    }
  };

  const onDelete = (id) => {
    setDeleteTargetId(id);
  };

  const updateAddressFromCoordinates = async (lat, lng) => {
    const requestId = reverseGeocodeRequestRef.current + 1;
    reverseGeocodeRequestRef.current = requestId;

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lng)}`
      );

      if (!response.ok) return;

      const data = await response.json();
      if (reverseGeocodeRequestRef.current !== requestId) return;

      const resolvedAddress = data?.display_name;
      if (!resolvedAddress) return;

      setAddressSearch(resolvedAddress);
      setFormData((prev) => {
        if (prev.location_name?.trim()) return prev;
        return { ...prev, location_name: resolvedAddress.slice(0, 180) };
      });
    } catch {
      // silent fail for reverse geocoding
    }
  };

  const onMapLocationSelect = ({ lat, lng }, shouldCenter = false, shouldResolveAddress = true) => {
    setSelectedLocation({ lat, lng });
    setFormData((prev) => ({ ...prev, lat, lng }));
    setLocationSearchError('');
    if (shouldCenter) {
      setMapCenterTarget({ lat, lng });
    }
    if (shouldResolveAddress) {
      updateAddressFromCoordinates(lat, lng);
    }
  };

  const searchAddressLocation = async () => {
    const query = addressSearch.trim();
    if (!query) {
      setLocationSearchError('Enter an address to search.');
      return;
    }

    setSearchingLocation(true);
    setLocationSearchError('');

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`
      );

      if (!response.ok) {
        throw new Error('Unable to search location right now');
      }

      const data = await response.json();
      if (!Array.isArray(data) || data.length === 0) {
        setSearchResults([]);
        setLocationSearchError('No locations found for this address.');
        return;
      }

      const options = data.map((item) => ({
        label: item.display_name,
        lat: Number(item.lat),
        lng: Number(item.lon)
      }));

      setSearchResults(options);
      onMapLocationSelect({ lat: options[0].lat, lng: options[0].lng }, true, false);
      setAddressSearch(options[0].label);
      if (!formData.location_name.trim()) {
        setFormData((prev) => ({ ...prev, location_name: options[0].label.slice(0, 180) }));
      }
    } catch (err) {
      setLocationSearchError(err.message || 'Address search failed');
      setSearchResults([]);
    } finally {
      setSearchingLocation(false);
    }
  };

  const pickCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationSearchError('Geolocation is not supported in this browser.');
      return;
    }

    setLocatingCurrent(true);
    setLocationSearchError('');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = Number(position.coords.latitude.toFixed(6));
        const lng = Number(position.coords.longitude.toFixed(6));
        onMapLocationSelect({ lat, lng }, true);
        setLocatingCurrent(false);
      },
      () => {
        setLocationSearchError('Unable to fetch current location. Please allow location permission.');
        setLocatingCurrent(false);
      },
      { enableHighAccuracy: true, timeout: 12000 }
    );
  };

  const confirmDelete = async () => {
    if (!deleteTargetId) return;
    setDeleteLoading(true);
    await dispatch(deleteCamera(deleteTargetId));
    setDeleteLoading(false);
    setDeleteTargetId(null);
  };

  return (
    <div className="flex-1 p-8 overflow-y-auto bg-stone-brown-50 h-screen">
      <div className="max-w-7xl mx-auto rounded-2xl border border-stone-brown-100 bg-white shadow-sm">
        <div className="px-6 py-5 border-b border-stone-brown-100 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-xl font-bold text-stone-brown-900">Cameras</h1>
            <p className="text-sm text-silver-500">Create and manage camera streams by zone.</p>
          </div>

          <div className="flex items-center gap-3">
            <input
              value={search}
              onChange={(event) => dispatch(setCamerasSearch(event.target.value))}
              placeholder="Search cameras"
              className="h-10 w-56 rounded-md border border-stone-brown-100 px-3 text-sm text-stone-brown-900 outline-none focus:border-toasted-almond-400"
            />
            <select
              className="h-10 rounded-md border border-stone-brown-100 bg-white px-3 text-sm text-stone-brown-900"
              value={status}
              onChange={(event) => dispatch(setCamerasStatus(event.target.value))}
            >
              <option value="">All status</option>
              <option value="online">Online</option>
              <option value="offline">Offline</option>
              <option value="maintenance">Maintenance</option>
            </select>
            <Button onClick={openCreateForm} className="gap-2">
              <Plus size={16} />
              Add Camera
            </Button>
          </div>
        </div>

        {error && (
          <div className="mx-6 mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="px-6 py-4">
          <Table>
            <TableCaption>Cameras table.</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>RTSP URL</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Zone</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-silver-500">Loading cameras...</TableCell>
                </TableRow>
              ) : items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-silver-500">
                    <div className="flex flex-col items-center gap-2 py-8">
                      <Camera className="text-silver-300" size={24} />
                      <span>No cameras found.</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                items.map((camera) => (
                  <TableRow key={camera.id}>
                    <TableCell className="font-semibold">{camera.name}</TableCell>
                    <TableCell className="max-w-[280px] truncate" title={camera.rtsp_url}>{camera.rtsp_url}</TableCell>
                    <TableCell>
                      {camera.location_name || '-'}
                      {camera.lat !== null && camera.lng !== null && (
                        <div className="text-xs text-silver-500">{camera.lat}, {camera.lng}</div>
                      )}
                    </TableCell>
                    <TableCell>{camera.zone_name || '-'}</TableCell>
                    <TableCell>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        camera.status === 'online'
                          ? 'bg-olive-wood-100 text-olive-wood-700'
                          : camera.status === 'maintenance'
                            ? 'bg-toasted-almond-100 text-toasted-almond-700'
                            : 'bg-silver-100 text-silver-600'
                      }`}>
                        {camera.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="icon" onClick={() => openEditForm(camera)}>
                          <Edit3 size={16} />
                        </Button>
                        <Button variant="outline" size="icon" onClick={() => onDelete(camera.id)}>
                          <Trash2 size={16} className="text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2 text-sm text-silver-500">
              <span>Rows per page</span>
              <select
                className="h-9 rounded-md border border-stone-brown-100 bg-white px-2 text-sm text-stone-brown-900"
                value={limit}
                onChange={(event) => dispatch(setCamerasLimit(Number(event.target.value)))}
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
              </select>
            </div>

            <Pagination page={page} totalPages={totalPages} onPageChange={(value) => dispatch(setCamerasPage(value))} />
          </div>
        </div>
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 z-30 flex items-start justify-center overflow-y-auto bg-stone-brown-900/25 p-4">
          <div className="my-4 w-full max-w-4xl max-h-[calc(100vh-2rem)] overflow-y-auto rounded-2xl border border-stone-brown-100 bg-white p-6 shadow-lg">
            <h2 className="text-lg font-bold text-stone-brown-900">{editingId ? 'Edit Camera' : 'Add Camera'}</h2>
            <form onSubmit={onSubmit} className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
              <label className="flex flex-col gap-1 text-sm text-silver-600">
                Name
                <input
                  required
                  name="name"
                  value={formData.name}
                  onChange={onChange}
                  className="h-10 rounded-md border border-stone-brown-100 px-3 text-stone-brown-900 outline-none focus:border-toasted-almond-400"
                />
              </label>

              <label className="flex flex-col gap-1 text-sm text-silver-600">
                Status
                <select
                  name="status"
                  value={formData.status}
                  onChange={onChange}
                  className="h-10 rounded-md border border-stone-brown-100 bg-white px-3 text-stone-brown-900 outline-none focus:border-toasted-almond-400"
                >
                  <option value="online">Online</option>
                  <option value="offline">Offline</option>
                  <option value="maintenance">Maintenance</option>
                </select>
              </label>

              <label className="md:col-span-2 flex flex-col gap-1 text-sm text-silver-600">
                RTSP URL
                <input
                  required
                  name="rtsp_url"
                  value={formData.rtsp_url}
                  onChange={onChange}
                  className="h-10 rounded-md border border-stone-brown-100 px-3 text-stone-brown-900 outline-none focus:border-toasted-almond-400"
                />
              </label>

              <label className="flex flex-col gap-1 text-sm text-silver-600">
                Location Name
                <input
                  name="location_name"
                  value={formData.location_name}
                  onChange={onChange}
                  className="h-10 rounded-md border border-stone-brown-100 px-3 text-stone-brown-900 outline-none focus:border-toasted-almond-400"
                />
              </label>

              <label className="flex flex-col gap-1 text-sm text-silver-600">
                Zone
                <SearchableSelect
                  value={formData.zone_id}
                  onChange={(value) => setFormData((prev) => ({ ...prev, zone_id: value }))}
                  options={zoneOptions}
                  loading={zoneOptionsLoading}
                  placeholder="Select zone"
                  emptyText="No zones found"
                />
              </label>

              <div className="md:col-span-2 rounded-xl border border-stone-brown-100 p-4">
                <p className="text-sm font-semibold text-stone-brown-900">Select location from map</p>
                <p className="text-xs text-silver-500 mt-1">Keep the pin fixed and move the map. The center point will be saved as camera location.</p>

                <div className="mt-3 flex flex-col gap-2 md:flex-row">
                  <div className="h-10 px-3 rounded-md border border-stone-brown-100 flex items-center gap-2 text-silver-500 md:flex-1">
                    <Search size={16} />
                    <input
                      value={addressSearch}
                      onChange={(event) => setAddressSearch(event.target.value)}
                      className="outline-none text-sm text-stone-brown-900 placeholder:text-silver-400 bg-transparent w-full"
                      placeholder="Enter address to search"
                    />
                  </div>
                  <Button type="button" variant="outline" onClick={searchAddressLocation} disabled={searchingLocation || locatingCurrent}>
                    {searchingLocation ? 'Searching...' : 'Find location'}
                  </Button>
                  <Button type="button" variant="outline" onClick={pickCurrentLocation} disabled={locatingCurrent || searchingLocation}>
                    {locatingCurrent ? 'Locating...' : 'Current location'}
                  </Button>
                </div>

                {searchResults.length > 0 && (
                  <div className="mt-2 max-h-36 overflow-y-auto rounded-md border border-stone-brown-100">
                    {searchResults.map((result, index) => (
                      <button
                        key={`${result.lat}-${result.lng}-${index}`}
                        type="button"
                        onClick={() => {
                          onMapLocationSelect({ lat: result.lat, lng: result.lng }, true);
                          if (!formData.location_name.trim()) {
                            setFormData((prev) => ({ ...prev, location_name: result.label.slice(0, 180) }));
                          }
                        }}
                        className="w-full px-3 py-2 text-left text-sm text-stone-brown-900 hover:bg-stone-brown-50 border-b border-stone-brown-100 last:border-b-0"
                      >
                        {result.label}
                      </button>
                    ))}
                  </div>
                )}

                {locationSearchError && (
                  <p className="mt-2 text-xs text-red-600">{locationSearchError}</p>
                )}

                <div className="relative mt-3 h-64 w-full overflow-hidden rounded-lg border border-stone-brown-100">
                  <MapContainer
                    center={[selectedLocation?.lat || defaultMapCenter.lat, selectedLocation?.lng || defaultMapCenter.lng]}
                    zoom={selectedLocation ? 14 : 5}
                    className="h-full w-full"
                    scrollWheelZoom
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <FixedPinMapController
                      centerTarget={mapCenterTarget}
                      onCenterUpdate={(location) => onMapLocationSelect(location, false)}
                      onCenterTargetHandled={() => setMapCenterTarget(null)}
                    />
                  </MapContainer>

                  <div className="pointer-events-none absolute inset-0 z-[1000] flex items-center justify-center">
                    <div
                      className="h-4 w-4 rounded-full border-2 border-white shadow"
                      style={{ backgroundColor: '#c2793d' }}
                    />
                  </div>
                </div>

                <p className="mt-2 text-xs text-silver-500">
                  Selected coordinates: {selectedLocation ? `${selectedLocation.lat}, ${selectedLocation.lng}` : 'Not selected'}
                </p>
              </div>

              <div className="md:col-span-2 mt-2 flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={closeForm}>Cancel</Button>
                <Button type="submit" disabled={actionLoading}>{actionLoading ? 'Saving...' : editingId ? 'Update Camera' : 'Create Camera'}</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deleteTargetId)}
        title="Delete camera"
        description="This action will permanently remove the camera. Do you want to continue?"
        confirmLabel="Delete"
        cancelLabel="Cancel"
        loading={deleteLoading}
        onCancel={() => setDeleteTargetId(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
