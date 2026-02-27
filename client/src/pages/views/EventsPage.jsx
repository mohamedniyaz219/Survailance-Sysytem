import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { CalendarDays, Edit3, Plus, Trash2 } from 'lucide-react';
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
import { ConfirmDialog } from '../../components/ui/confirm-dialog';
import {
  clearEventsError,
  createEvent,
  deleteEvent,
  fetchEvents,
  setEventsLimit,
  setEventsPage,
  setEventsSearch,
  setEventsStatus,
  updateEvent
} from '../../redux/eventsSlice';

const defaultForm = {
  title: '',
  description: '',
  event_type: '',
  location_name: '',
  start_at: '',
  end_at: '',
  status: 'planned',
  is_active: true
};

const eventStatus = ['planned', 'active', 'completed', 'cancelled'];

function formatDateTime(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function toInputDateTime(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hour = pad(date.getHours());
  const minute = pad(date.getMinutes());
  return `${year}-${month}-${day}T${hour}:${minute}`;
}

export default function EventsPage() {
  const dispatch = useDispatch();
  const { items, page, limit, totalPages, search, status, loading, actionLoading, error } = useSelector(
    (state) => state.events
  );

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(defaultForm);
  const [deleteTargetId, setDeleteTargetId] = useState(null);

  useEffect(() => {
    dispatch(fetchEvents({ page, limit, search, status }));
  }, [dispatch, page, limit, search, status]);

  const openCreateForm = () => {
    dispatch(clearEventsError());
    setEditingId(null);
    setFormData(defaultForm);
    setIsFormOpen(true);
  };

  const openEditForm = (eventItem) => {
    dispatch(clearEventsError());
    setEditingId(eventItem.id);
    setFormData({
      title: eventItem.title || '',
      description: eventItem.description || '',
      event_type: eventItem.event_type || '',
      location_name: eventItem.location_name || '',
      start_at: toInputDateTime(eventItem.start_at),
      end_at: toInputDateTime(eventItem.end_at),
      status: eventItem.status || 'planned',
      is_active: Boolean(eventItem.is_active)
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
      title: formData.title.trim(),
      description: formData.description.trim(),
      event_type: formData.event_type.trim(),
      location_name: formData.location_name.trim(),
      start_at: formData.start_at,
      end_at: formData.end_at || null,
      status: formData.status,
      is_active: formData.is_active
    };

    const result = editingId
      ? await dispatch(updateEvent({ id: editingId, data: payload }))
      : await dispatch(createEvent(payload));

    if (!result.error) {
      closeForm();
    }
  };

  const confirmDelete = async () => {
    if (!deleteTargetId) return;
    const result = await dispatch(deleteEvent(deleteTargetId));
    if (!result.error) {
      setDeleteTargetId(null);
    }
  };

  return (
    <div className="flex-1 p-8 overflow-y-auto bg-stone-brown-50 h-screen">
      <div className="max-w-7xl mx-auto rounded-2xl border border-stone-brown-100 bg-white shadow-sm">
        <div className="px-6 py-5 border-b border-stone-brown-100 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-xl font-bold text-stone-brown-900">Events</h1>
            <p className="text-sm text-silver-500">Create and manage tenant events stored in the public schema.</p>
          </div>

          <div className="flex items-center gap-3">
            <input
              value={search}
              onChange={(event) => dispatch(setEventsSearch(event.target.value))}
              placeholder="Search events"
              className="h-10 w-56 rounded-md border border-stone-brown-100 px-3 text-sm text-stone-brown-900 outline-none focus:border-toasted-almond-400"
            />
            <select
              className="h-10 rounded-md border border-stone-brown-100 bg-white px-3 text-sm text-stone-brown-900"
              value={status}
              onChange={(event) => dispatch(setEventsStatus(event.target.value))}
            >
              <option value="">All status</option>
              {eventStatus.map((statusItem) => (
                <option key={statusItem} value={statusItem}>
                  {statusItem}
                </option>
              ))}
            </select>
            <Button onClick={openCreateForm} className="gap-2">
              <Plus size={16} />
              Add Event
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
            <TableCaption>Events table.</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Start</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-silver-500">Loading events...</TableCell>
                </TableRow>
              ) : items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-silver-500">
                    <div className="flex flex-col items-center gap-2 py-8">
                      <CalendarDays size={24} className="text-silver-300" />
                      <span>No events found.</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                items.map((eventItem) => (
                  <TableRow key={eventItem.id}>
                    <TableCell>
                      <div className="font-semibold text-stone-brown-900">{eventItem.title}</div>
                      <div className="text-xs text-silver-500">{eventItem.location_name || '-'}</div>
                    </TableCell>
                    <TableCell>{eventItem.event_type || '-'}</TableCell>
                    <TableCell>{formatDateTime(eventItem.start_at)}</TableCell>
                    <TableCell>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        eventItem.status === 'active'
                          ? 'bg-olive-wood-100 text-olive-wood-700'
                          : eventItem.status === 'completed'
                            ? 'bg-toasted-almond-100 text-toasted-almond-700'
                            : eventItem.status === 'cancelled'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-silver-100 text-silver-600'
                      }`}>
                        {eventItem.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="icon" onClick={() => openEditForm(eventItem)}>
                          <Edit3 size={16} />
                        </Button>
                        <Button variant="outline" size="icon" onClick={() => setDeleteTargetId(eventItem.id)}>
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
                onChange={(event) => dispatch(setEventsLimit(Number(event.target.value)))}
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
              </select>
            </div>

            <Pagination page={page} totalPages={totalPages} onPageChange={(value) => dispatch(setEventsPage(value))} />
          </div>
        </div>
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 z-30 flex items-start justify-center overflow-y-auto bg-stone-brown-900/25 p-4">
          <div className="my-4 w-full max-w-3xl max-h-[calc(100vh-2rem)] overflow-y-auto rounded-2xl border border-stone-brown-100 bg-white p-6 shadow-lg">
            <h2 className="text-lg font-bold text-stone-brown-900">{editingId ? 'Edit Event' : 'Create Event'}</h2>
            <form onSubmit={onSubmit} className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
              <label className="flex flex-col gap-1 text-sm text-silver-600 md:col-span-2">
                Title
                <input
                  required
                  name="title"
                  value={formData.title}
                  onChange={onChange}
                  className="h-10 rounded-md border border-stone-brown-100 px-3 text-stone-brown-900 outline-none focus:border-toasted-almond-400"
                />
              </label>

              <label className="flex flex-col gap-1 text-sm text-silver-600">
                Event Type
                <input
                  name="event_type"
                  value={formData.event_type}
                  onChange={onChange}
                  className="h-10 rounded-md border border-stone-brown-100 px-3 text-stone-brown-900 outline-none focus:border-toasted-almond-400"
                />
              </label>

              <label className="flex flex-col gap-1 text-sm text-silver-600">
                Location
                <input
                  name="location_name"
                  value={formData.location_name}
                  onChange={onChange}
                  className="h-10 rounded-md border border-stone-brown-100 px-3 text-stone-brown-900 outline-none focus:border-toasted-almond-400"
                />
              </label>

              <label className="flex flex-col gap-1 text-sm text-silver-600">
                Start Date & Time
                <input
                  required
                  type="datetime-local"
                  name="start_at"
                  value={formData.start_at}
                  onChange={onChange}
                  className="h-10 rounded-md border border-stone-brown-100 px-3 text-stone-brown-900 outline-none focus:border-toasted-almond-400"
                />
              </label>

              <label className="flex flex-col gap-1 text-sm text-silver-600">
                End Date & Time
                <input
                  type="datetime-local"
                  name="end_at"
                  value={formData.end_at}
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
                  {eventStatus.map((statusItem) => (
                    <option key={statusItem} value={statusItem}>
                      {statusItem}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex items-center gap-2 text-sm text-silver-600 mt-6">
                <input
                  type="checkbox"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={onChange}
                  className="h-4 w-4 rounded border-stone-brown-200"
                />
                Active event
              </label>

              <label className="flex flex-col gap-1 text-sm text-silver-600 md:col-span-2">
                Description
                <textarea
                  rows={4}
                  name="description"
                  value={formData.description}
                  onChange={onChange}
                  className="rounded-md border border-stone-brown-100 px-3 py-2 text-stone-brown-900 outline-none focus:border-toasted-almond-400"
                />
              </label>

              <div className="md:col-span-2 mt-2 flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={closeForm}>Cancel</Button>
                <Button type="submit" disabled={actionLoading}>{actionLoading ? 'Saving...' : editingId ? 'Update Event' : 'Create Event'}</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deleteTargetId)}
        title="Delete event"
        description="This action will permanently remove the event. Do you want to continue?"
        confirmLabel="Delete"
        cancelLabel="Cancel"
        loading={actionLoading}
        onCancel={() => setDeleteTargetId(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
