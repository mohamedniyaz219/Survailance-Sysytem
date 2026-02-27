import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Edit3, MapPinned, Plus, Trash2 } from 'lucide-react';
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
import {
  clearZonesError,
  createZone,
  deleteZone,
  fetchZones,
  setZonesLimit,
  setZonesPage,
  setZonesSearch,
  updateZone
} from '../../redux/zonesSlice';

const defaultForm = {
  name: '',
  description: '',
  is_active: true
};

export default function ZonesPage() {
  const dispatch = useDispatch();
  const { items, page, limit, totalPages, search, loading, actionLoading, error } = useSelector((state) => state.zones);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(defaultForm);

  useEffect(() => {
    dispatch(fetchZones({ page, limit, search }));
  }, [dispatch, page, limit, search]);

  const openCreateForm = () => {
    dispatch(clearZonesError());
    setEditingId(null);
    setFormData(defaultForm);
    setIsFormOpen(true);
  };

  const openEditForm = (zone) => {
    dispatch(clearZonesError());
    setEditingId(zone.id);
    setFormData({
      name: zone.name || '',
      description: zone.description || '',
      is_active: Boolean(zone.is_active)
    });
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingId(null);
    setFormData(defaultForm);
  };

  const onChange = (event) => {
    const { name, value, type, checked } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    const payload = {
      name: formData.name.trim(),
      description: formData.description.trim(),
      is_active: formData.is_active
    };

    const result = editingId
      ? await dispatch(updateZone({ id: editingId, data: payload }))
      : await dispatch(createZone(payload));

    if (!result.error) {
      closeForm();
    }
  };

  const onDelete = async (id) => {
    if (!window.confirm('Delete this zone?')) return;
    await dispatch(deleteZone(id));
  };

  return (
    <div className="flex-1 p-8 overflow-y-auto bg-stone-brown-50 h-screen">
      <div className="max-w-6xl mx-auto rounded-2xl border border-stone-brown-100 bg-white shadow-sm">
        <div className="px-6 py-5 border-b border-stone-brown-100 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-xl font-bold text-stone-brown-900">Zones</h1>
            <p className="text-sm text-silver-500">Manage zones for cameras, anomaly rules, and risk scores.</p>
          </div>

          <div className="flex items-center gap-3">
            <input
              value={search}
              onChange={(event) => dispatch(setZonesSearch(event.target.value))}
              placeholder="Search zones"
              className="h-10 w-56 rounded-md border border-stone-brown-100 px-3 text-sm text-stone-brown-900 outline-none focus:border-toasted-almond-400"
            />
            <Button onClick={openCreateForm} className="gap-2">
              <Plus size={16} />
              Add Zone
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
            <TableCaption>Zones table.</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-silver-500">Loading zones...</TableCell>
                </TableRow>
              ) : items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-silver-500">
                    <div className="flex flex-col items-center gap-2 py-8">
                      <MapPinned size={22} className="text-silver-300" />
                      <span>No zones found.</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                items.map((zone) => (
                  <TableRow key={zone.id}>
                    <TableCell className="font-semibold">{zone.name}</TableCell>
                    <TableCell>{zone.description || '-'}</TableCell>
                    <TableCell>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${zone.is_active ? 'bg-olive-wood-100 text-olive-wood-700' : 'bg-silver-100 text-silver-600'}`}>
                        {zone.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="icon" onClick={() => openEditForm(zone)}>
                          <Edit3 size={16} />
                        </Button>
                        <Button variant="outline" size="icon" onClick={() => onDelete(zone.id)}>
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
                onChange={(event) => dispatch(setZonesLimit(Number(event.target.value)))}
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
              </select>
            </div>

            <Pagination page={page} totalPages={totalPages} onPageChange={(value) => dispatch(setZonesPage(value))} />
          </div>
        </div>
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-stone-brown-900/25 p-4">
          <div className="w-full max-w-xl rounded-2xl border border-stone-brown-100 bg-white p-6 shadow-lg">
            <h2 className="text-lg font-bold text-stone-brown-900">{editingId ? 'Edit Zone' : 'Create Zone'}</h2>
            <form onSubmit={onSubmit} className="mt-5 grid grid-cols-1 gap-4">
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
                Description
                <textarea
                  rows={3}
                  name="description"
                  value={formData.description}
                  onChange={onChange}
                  className="rounded-md border border-stone-brown-100 px-3 py-2 text-stone-brown-900 outline-none focus:border-toasted-almond-400"
                />
              </label>

              <label className="flex items-center gap-2 text-sm text-silver-600">
                <input
                  type="checkbox"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={onChange}
                  className="h-4 w-4 rounded border-stone-brown-200"
                />
                Active zone
              </label>

              <div className="mt-2 flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={closeForm}>Cancel</Button>
                <Button type="submit" disabled={actionLoading}>{actionLoading ? 'Saving...' : editingId ? 'Update Zone' : 'Create Zone'}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
