import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Edit3, Plus, Trash2, Users } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { SearchableSelect } from '../../components/ui/searchable-select';
import { ConfirmDialog } from '../../components/ui/confirm-dialog';
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
  clearRespondersError,
  createResponder,
  deleteResponder,
  fetchResponders,
  fetchZoneOptions,
  setLimit,
  setPage,
  setSearch,
  updateResponder
} from '../../redux/respondersSlice';

const defaultForm = {
  name: '',
  email: '',
  assigned_zone_id: '',
  password: '',
  is_active: true
};

export default function RespondersPage() {
  const dispatch = useDispatch();
  const {
    items,
    page,
    limit,
    total,
    totalPages,
    search,
    zoneOptions,
    zoneOptionsLoading,
    loading,
    actionLoading,
    error
  } = useSelector((state) => state.responders);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(defaultForm);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    dispatch(fetchResponders({ page, limit, search }));
  }, [dispatch, page, limit, search]);

  const statsLabel = useMemo(() => {
    const activeCount = items.filter((item) => item.is_active).length;
    return `Total Responders: ${total} • Active on current page: ${activeCount}`;
  }, [items, total]);

  const onChange = (event) => {
    const { name, value, type, checked } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const openCreateForm = () => {
    dispatch(clearRespondersError());
    dispatch(fetchZoneOptions());
    setEditingId(null);
    setFormData(defaultForm);
    setIsFormOpen(true);
  };

  const openEditForm = (responder) => {
    dispatch(clearRespondersError());
    dispatch(fetchZoneOptions());
    setEditingId(responder.id);
    setFormData({
      name: responder.name || '',
      email: responder.email || '',
      assigned_zone_id: responder.assigned_zone_id || '',
      password: '',
      is_active: Boolean(responder.is_active)
    });
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingId(null);
    setFormData(defaultForm);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const payload = {
      name: formData.name.trim(),
      email: formData.email.trim(),
      assigned_zone_id: formData.assigned_zone_id || null,
      is_active: formData.is_active
    };

    if (formData.password) {
      payload.password = formData.password;
    }

    let result;
    if (editingId) {
      result = await dispatch(updateResponder({ id: editingId, data: payload }));
    } else {
      result = await dispatch(createResponder(payload));
    }

    if (!result.error) {
      closeForm();
    }
  };

  const handleDelete = async (id) => {
    setDeleteTargetId(id);
  };

  const confirmDelete = async () => {
    if (!deleteTargetId) return;
    setDeleteLoading(true);
    await dispatch(deleteResponder(deleteTargetId));
    setDeleteLoading(false);
    setDeleteTargetId(null);
  };

  const handleStatusToggle = async (responder) => {
    await dispatch(
      updateResponder({
        id: responder.id,
        data: {
          is_active: !responder.is_active
        }
      })
    );
  };

  return (
    <div className="flex-1 p-8 overflow-y-auto bg-stone-brown-50 h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="rounded-2xl border border-stone-brown-100 bg-white shadow-sm">
          <div className="px-6 py-5 border-b border-stone-brown-100 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-xl font-bold text-stone-brown-900">Responders</h1>
              <p className="mt-1 text-sm text-silver-500">{statsLabel}</p>
            </div>

            <div className="flex items-center gap-3">
              <input
                value={search}
                onChange={(event) => dispatch(setSearch(event.target.value))}
                placeholder="Search by name, email, badge..."
                className="h-10 w-64 rounded-md border border-stone-brown-100 px-3 text-sm text-stone-brown-900 outline-none focus:border-toasted-almond-400"
              />
              <Button onClick={openCreateForm} className="gap-2">
                <Plus size={16} />
                Add new responder
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
              <TableCaption>Responder management table.</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Badge ID</TableHead>
                  <TableHead>Zone</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-silver-500">
                      Loading responders...
                    </TableCell>
                  </TableRow>
                ) : items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-silver-500">
                      <div className="flex flex-col items-center gap-2 py-8">
                        <Users className="text-silver-300" size={24} />
                        <span>No responders found.</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((responder) => (
                    <TableRow key={responder.id}>
                      <TableCell className="font-semibold">{responder.name}</TableCell>
                      <TableCell>{responder.email}</TableCell>
                      <TableCell>{responder.badge_id || '-'}</TableCell>
                      <TableCell>{responder.assigned_zone_name || responder.assigned_zone || '-'}</TableCell>
                      <TableCell>
                        <button
                          type="button"
                          onClick={() => handleStatusToggle(responder)}
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            responder.is_active
                              ? 'bg-olive-wood-100 text-olive-wood-700'
                              : 'bg-silver-100 text-silver-600'
                          }`}
                        >
                          {responder.is_active ? 'Active' : 'Inactive'}
                        </button>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            aria-label="Edit responder"
                            onClick={() => openEditForm(responder)}
                          >
                            <Edit3 size={16} />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            aria-label="Delete responder"
                            onClick={() => handleDelete(responder.id)}
                          >
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
                  onChange={(event) => dispatch(setLimit(Number(event.target.value)))}
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                </select>
                <span>{`Page ${page} of ${totalPages}`}</span>
              </div>

              <Pagination page={page} totalPages={totalPages} onPageChange={(value) => dispatch(setPage(value))} />
            </div>
          </div>
        </div>

        {isFormOpen && (
          <div className="fixed inset-0 z-30 flex items-center justify-center bg-stone-brown-900/25 p-4">
            <div className="w-full max-w-xl rounded-2xl border border-stone-brown-100 bg-white p-6 shadow-lg">
              <h2 className="text-lg font-bold text-stone-brown-900">
                {editingId ? 'Edit responder' : 'Add responder'}
              </h2>

              <form onSubmit={handleSubmit} className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
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
                  Email
                  <input
                    required
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={onChange}
                    className="h-10 rounded-md border border-stone-brown-100 px-3 text-stone-brown-900 outline-none focus:border-toasted-almond-400"
                  />
                </label>

                <label className="flex flex-col gap-1 text-sm text-silver-600">
                  Assigned Zone
                  <SearchableSelect
                    value={formData.assigned_zone_id}
                    onChange={(value) =>
                      setFormData((prev) => ({
                        ...prev,
                        assigned_zone_id: value
                      }))
                    }
                    options={zoneOptions}
                    loading={zoneOptionsLoading}
                    placeholder="Select a zone"
                    emptyText="No active zones available"
                  />
                </label>

                <label className="flex flex-col gap-1 text-sm text-silver-600">
                  {editingId ? 'New Password (optional)' : 'Password (optional)'}
                  <input
                    name="password"
                    value={formData.password}
                    onChange={onChange}
                    className="h-10 rounded-md border border-stone-brown-100 px-3 text-stone-brown-900 outline-none focus:border-toasted-almond-400"
                  />
                </label>

                <label className="md:col-span-2 flex items-center gap-2 text-sm text-silver-600">
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={formData.is_active}
                    onChange={onChange}
                    className="h-4 w-4 rounded border-stone-brown-200"
                  />
                  Active responder
                </label>

                <div className="md:col-span-2 mt-2 flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={closeForm}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={actionLoading}>
                    {actionLoading ? 'Saving...' : editingId ? 'Update responder' : 'Create responder'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        <ConfirmDialog
          open={Boolean(deleteTargetId)}
          title="Delete responder"
          description="This action will permanently remove the responder. Do you want to continue?"
          confirmLabel="Delete"
          cancelLabel="Cancel"
          loading={deleteLoading}
          onCancel={() => setDeleteTargetId(null)}
          onConfirm={confirmDelete}
        />
      </div>
    </div>
  );
}
