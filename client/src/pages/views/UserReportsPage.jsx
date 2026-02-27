import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { MessageSquareWarning, UserPlus } from 'lucide-react';
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
import {
  assignUserReport,
  clearUserReportsError,
  fetchResponderOptions,
  fetchUserReports,
  setUserReportsLimit,
  setUserReportsPage,
  setUserReportsSearch,
  setUserReportsStatus
} from '../../redux/userReportsSlice';

const statusOptions = ['', 'new', 'assigned', 'in_progress', 'resolved', 'rejected'];

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

export default function UserReportsPage() {
  const dispatch = useDispatch();
  const {
    items,
    page,
    limit,
    totalPages,
    search,
    status,
    responderOptions,
    responderOptionsLoading,
    loading,
    actionLoading,
    error
  } = useSelector((state) => state.userReports);

  const [assignModal, setAssignModal] = useState({ open: false, reportId: null, responderId: '' });

  useEffect(() => {
    dispatch(fetchUserReports({ page, limit, search, status }));
  }, [dispatch, page, limit, search, status]);

  const openAssign = (reportId) => {
    dispatch(clearUserReportsError());
    dispatch(fetchResponderOptions());
    setAssignModal({ open: true, reportId, responderId: '' });
  };

  const closeAssign = () => {
    setAssignModal({ open: false, reportId: null, responderId: '' });
  };

  const confirmAssign = async () => {
    if (!assignModal.reportId || !assignModal.responderId) return;
    const result = await dispatch(
      assignUserReport({
        id: assignModal.reportId,
        responderId: assignModal.responderId
      })
    );
    if (!result.error) {
      closeAssign();
    }
  };

  return (
    <div className="flex-1 p-8 overflow-y-auto bg-stone-brown-50 h-screen">
      <div className="max-w-7xl mx-auto rounded-2xl border border-stone-brown-100 bg-white shadow-sm">
        <div className="px-6 py-5 border-b border-stone-brown-100 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-xl font-bold text-stone-brown-900">User Reports</h1>
            <p className="text-sm text-silver-500">Review incident reports submitted by users and assign responders.</p>
          </div>

          <div className="flex items-center gap-3">
            <input
              value={search}
              onChange={(event) => dispatch(setUserReportsSearch(event.target.value))}
              placeholder="Search reports"
              className="h-10 w-56 rounded-md border border-stone-brown-100 px-3 text-sm text-stone-brown-900 outline-none focus:border-toasted-almond-400"
            />

            <select
              className="h-10 rounded-md border border-stone-brown-100 bg-white px-3 text-sm text-stone-brown-900"
              value={status}
              onChange={(event) => dispatch(setUserReportsStatus(event.target.value))}
            >
              <option value="">All status</option>
              {statusOptions
                .filter(Boolean)
                .map((statusItem) => (
                  <option key={statusItem} value={statusItem}>
                    {statusItem}
                  </option>
                ))}
            </select>
          </div>
        </div>

        {error && (
          <div className="mx-6 mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="px-6 py-4">
          <Table>
            <TableCaption>User reports table.</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Incident</TableHead>
                <TableHead>Event</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Assigned</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-silver-500">Loading user reports...</TableCell>
                </TableRow>
              ) : items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-silver-500">
                    <div className="flex flex-col items-center gap-2 py-8">
                      <MessageSquareWarning size={24} className="text-silver-300" />
                      <span>No user reports found.</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                items.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell>
                      <div className="font-semibold text-stone-brown-900">{report.incident_type}</div>
                      <div className="text-xs text-silver-500">{formatDateTime(report.createdAt)}</div>
                    </TableCell>
                    <TableCell>{report.event_title || '-'}</TableCell>
                    <TableCell>
                      <div>{report.location_name || '-'}</div>
                      {report.media_url && (
                        <a
                          className="text-xs text-toasted-almond-600 hover:underline"
                          href={report.media_url}
                          target="_blank"
                          rel="noreferrer"
                        >
                          View {report.media_type || 'media'}
                        </a>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        report.status === 'resolved'
                          ? 'bg-olive-wood-100 text-olive-wood-700'
                          : report.status === 'assigned' || report.status === 'in_progress'
                            ? 'bg-toasted-almond-100 text-toasted-almond-700'
                            : report.status === 'rejected'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-silver-100 text-silver-600'
                      }`}>
                        {report.status}
                      </span>
                    </TableCell>
                    <TableCell>{report.assigned_responder_name || '-'}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" className="gap-2" onClick={() => openAssign(report.id)}>
                        <UserPlus size={14} />
                        Assign
                      </Button>
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
                onChange={(event) => dispatch(setUserReportsLimit(Number(event.target.value)))}
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
              </select>
            </div>

            <Pagination page={page} totalPages={totalPages} onPageChange={(value) => dispatch(setUserReportsPage(value))} />
          </div>
        </div>
      </div>

      {assignModal.open && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-stone-brown-900/25 p-4">
          <div className="w-full max-w-xl rounded-2xl border border-stone-brown-100 bg-white p-6 shadow-lg">
            <h2 className="text-lg font-bold text-stone-brown-900">Assign Responder</h2>
            <p className="mt-1 text-sm text-silver-500">Select an active responder for this user report.</p>

            <div className="mt-4">
              <SearchableSelect
                value={assignModal.responderId}
                onChange={(value) => setAssignModal((prev) => ({ ...prev, responderId: value }))}
                options={responderOptions}
                loading={responderOptionsLoading}
                placeholder="Select responder"
                emptyText="No responders found"
              />
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={closeAssign}>Cancel</Button>
              <Button type="button" disabled={!assignModal.responderId || actionLoading} onClick={confirmAssign}>
                {actionLoading ? 'Assigning...' : 'Assign'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
