import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AlertTriangle, Eye, ShieldCheck, ShieldX, UserCog } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { SearchableSelect } from '../../components/ui/searchable-select';
import { Pagination } from '../../components/ui/pagination';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '../../components/ui/table';
import {
  assignIncidentResponder,
  clearIncidentDetails,
  clearIncidentError,
  fetchIncidentDetails,
  fetchIncidents,
  fetchResponderOptions,
  verifyIncidentDecision,
  setLimit,
  setPage,
  setSearch,
  setStatusFilter,
  setTypeFilter,
  setVerificationFilter
} from '../../redux/incidentsSlice';

const statusOptions = [
  { value: '', label: 'All statuses' },
  { value: 'new', label: 'New' },
  { value: 'assigned', label: 'Assigned' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'false_alarm', label: 'False alarm' }
];

const verificationOptions = [
  { value: '', label: 'All verification' },
  { value: 'pending', label: 'Pending' },
  { value: 'verified', label: 'Verified' },
  { value: 'rejected', label: 'Rejected' }
];

function statusBadgeClass(status) {
  if (status === 'assigned') return 'bg-olive-wood-100 text-olive-wood-700';
  if (status === 'resolved') return 'bg-toasted-almond-100 text-toasted-almond-700';
  if (status === 'false_alarm') return 'bg-silver-100 text-silver-600';
  return 'bg-red-100 text-red-700';
}

function formatIncidentType(item) {
  if (item.detected_class) return item.detected_class;
  return item.type || '-';
}

function verificationBadgeClass(status) {
  if (status === 'verified') return 'bg-olive-wood-100 text-olive-wood-700';
  if (status === 'rejected') return 'bg-red-100 text-red-700';
  return 'bg-silver-100 text-silver-600';
}

export default function IncidentsPage() {
  const dispatch = useDispatch();
  const {
    items,
    page,
    limit,
    total,
    totalPages,
    search,
    statusFilter,
    typeFilter,
    verificationFilter,
    responderOptions,
    respondersLoading,
    selectedIncident,
    detailsLoading,
    loading,
    actionLoading,
    error
  } = useSelector((state) => state.incidents);

  const [assignTarget, setAssignTarget] = useState(null);
  const [responderId, setResponderId] = useState('');
  const [assignComment, setAssignComment] = useState('');
  const [verifyTarget, setVerifyTarget] = useState(null);
  const [verifyStatus, setVerifyStatus] = useState('verified');
  const [verifyComment, setVerifyComment] = useState('');
  const [falsePositiveTag, setFalsePositiveTag] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);

  useEffect(() => {
    dispatch(fetchIncidents({ page, limit, search, status: statusFilter, type: typeFilter, verification_status: verificationFilter }));
  }, [dispatch, page, limit, search, statusFilter, typeFilter, verificationFilter]);

  const summaryLabel = useMemo(() => {
    const newCount = items.filter((item) => item.status === 'new').length;
    return `Total Incidents: ${total} • New on current page: ${newCount}`;
  }, [items, total]);

  const openAssignDialog = (incident) => {
    dispatch(clearIncidentError());
    dispatch(fetchResponderOptions());
    setAssignTarget(incident);
    setResponderId(incident.assigned_responder_id || '');
    setAssignComment('');
  };

  const closeAssignDialog = () => {
    setAssignTarget(null);
    setResponderId('');
    setAssignComment('');
  };

  const openVerificationDialog = (incident, status) => {
    dispatch(clearIncidentError());
    setVerifyTarget(incident);
    setVerifyStatus(status);
    setFalsePositiveTag(status === 'rejected');
    setVerifyComment('');
  };

  const closeVerificationDialog = () => {
    setVerifyTarget(null);
    setVerifyStatus('verified');
    setFalsePositiveTag(false);
    setVerifyComment('');
  };

  const submitVerification = async () => {
    if (!verifyTarget) return;

    const result = await dispatch(
      verifyIncidentDecision({
        incidentId: verifyTarget.id,
        verification_status: verifyStatus,
        false_positive_tag: verifyStatus === 'rejected' ? falsePositiveTag : false,
        comment: verifyComment
      })
    );

    if (!result.error) {
      closeVerificationDialog();
    }
  };

  const submitAssignment = async () => {
    if (!assignTarget) return;

    const result = await dispatch(
      assignIncidentResponder({
        incidentId: assignTarget.id,
        responder_id: responderId || null,
        comment: assignComment
      })
    );

    if (!result.error) {
      closeAssignDialog();
    }
  };

  const openDetails = (incidentId) => {
    setDetailsOpen(true);
    dispatch(fetchIncidentDetails(incidentId));
  };

  const closeDetails = () => {
    setDetailsOpen(false);
    dispatch(clearIncidentDetails());
  };

  return (
    <div className="flex-1 p-8 overflow-y-auto bg-stone-brown-50 h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="rounded-2xl border border-stone-brown-100 bg-white shadow-sm">
          <div className="px-6 py-5 border-b border-stone-brown-100 flex flex-col gap-4">
            <div className="flex flex-col gap-1 md:flex-row md:items-end md:justify-between">
              <div>
                <h1 className="text-xl font-bold text-stone-brown-900">Incidents</h1>
                <p className="mt-1 text-sm text-silver-500">{summaryLabel}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
              <input
                value={search}
                onChange={(event) => dispatch(setSearch(event.target.value))}
                placeholder="Search by type, class, description"
                className="h-10 rounded-md border border-stone-brown-100 px-3 text-sm text-stone-brown-900 outline-none focus:border-toasted-almond-400"
              />

              <select
                value={statusFilter}
                onChange={(event) => dispatch(setStatusFilter(event.target.value))}
                className="h-10 rounded-md border border-stone-brown-100 bg-white px-3 text-sm text-stone-brown-900 outline-none focus:border-toasted-almond-400"
              >
                {statusOptions.map((item) => (
                  <option key={item.value || 'all'} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>

              <input
                value={typeFilter}
                onChange={(event) => dispatch(setTypeFilter(event.target.value))}
                placeholder="Filter by type/class"
                className="h-10 rounded-md border border-stone-brown-100 px-3 text-sm text-stone-brown-900 outline-none focus:border-toasted-almond-400"
              />

              <select
                value={verificationFilter}
                onChange={(event) => dispatch(setVerificationFilter(event.target.value))}
                className="h-10 rounded-md border border-stone-brown-100 bg-white px-3 text-sm text-stone-brown-900 outline-none focus:border-toasted-almond-400"
              >
                {verificationOptions.map((item) => (
                  <option key={item.value || 'all-verification'} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>

              <select
                value={limit}
                onChange={(event) => dispatch(setLimit(Number(event.target.value)))}
                className="h-10 rounded-md border border-stone-brown-100 bg-white px-3 text-sm text-stone-brown-900"
              >
                <option value={5}>5 per page</option>
                <option value={10}>10 per page</option>
                <option value={20}>20 per page</option>
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
              <TableCaption>AI and user detected incidents with responder assignment controls.</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Type / Class</TableHead>
                  <TableHead>Camera</TableHead>
                  <TableHead>Confidence</TableHead>
                  <TableHead>Verification</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Assigned Responder</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-silver-500">
                      Loading incidents...
                    </TableCell>
                  </TableRow>
                ) : items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-silver-500">
                      <div className="flex flex-col items-center gap-2 py-8">
                        <AlertTriangle className="text-silver-300" size={24} />
                        <span>No incidents found.</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((incident) => (
                    <TableRow key={incident.id}>
                      <TableCell className="font-semibold">{formatIncidentType(incident)}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span>{incident.camera_name || '-'}</span>
                          <span className="text-xs text-silver-500">{incident.camera_location_name || '-'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {incident.confidence_score === null || incident.confidence_score === undefined
                          ? '-'
                          : `${Math.round(Number(incident.confidence_score) * 100)}%`}
                      </TableCell>
                      <TableCell>
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${verificationBadgeClass(incident.verification_status)}`}>
                          {incident.verification_status || 'pending'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusBadgeClass(incident.status)}`}>
                          {incident.status}
                        </span>
                      </TableCell>
                      <TableCell>{incident.assigned_responder_name || '-'}</TableCell>
                      <TableCell>{new Date(incident.createdAt).toLocaleString()}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            aria-label="View incident details"
                            onClick={() => openDetails(incident.id)}
                          >
                            <Eye size={16} />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            aria-label="Assign responder"
                            onClick={() => openAssignDialog(incident)}
                          >
                            <UserCog size={16} />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            aria-label="Verify incident"
                            onClick={() => openVerificationDialog(incident, 'verified')}
                            disabled={actionLoading || incident.verification_status === 'verified'}
                          >
                            <ShieldCheck size={16} className="text-olive-wood-700" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            aria-label="Reject incident"
                            onClick={() => openVerificationDialog(incident, 'rejected')}
                            disabled={actionLoading || incident.verification_status === 'rejected'}
                          >
                            <ShieldX size={16} className="text-red-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>

            <div className="mt-4 flex items-center justify-between gap-3">
              <span className="text-sm text-silver-500">{`Page ${page} of ${totalPages}`}</span>
              <Pagination page={page} totalPages={totalPages} onPageChange={(value) => dispatch(setPage(value))} />
            </div>
          </div>
        </div>

        {assignTarget && (
          <div className="fixed inset-0 z-30 flex items-center justify-center bg-stone-brown-900/25 p-4">
            <div className="w-full max-w-xl rounded-2xl border border-stone-brown-100 bg-white p-6 shadow-lg">
              <h2 className="text-lg font-bold text-stone-brown-900">Assign Responder</h2>
              <p className="mt-1 text-sm text-silver-500">
                Incident #{assignTarget.id} • {formatIncidentType(assignTarget)}
              </p>

              <div className="mt-5 space-y-4">
                <label className="flex flex-col gap-1 text-sm text-silver-600">
                  Responder
                  <SearchableSelect
                    value={responderId}
                    onChange={(value) => setResponderId(value)}
                    options={responderOptions}
                    loading={respondersLoading}
                    placeholder="Select responder"
                    emptyText="No active responders"
                  />
                </label>

                <label className="flex flex-col gap-1 text-sm text-silver-600">
                  Comment (optional)
                  <textarea
                    rows={3}
                    value={assignComment}
                    onChange={(event) => setAssignComment(event.target.value)}
                    className="rounded-md border border-stone-brown-100 px-3 py-2 text-sm text-stone-brown-900 outline-none focus:border-toasted-almond-400"
                    placeholder="Reason for assignment/reassignment/unassignment"
                  />
                </label>
              </div>

              <div className="mt-6 flex flex-wrap justify-end gap-2">
                <Button type="button" variant="outline" onClick={closeAssignDialog}>
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setResponderId('')}
                  disabled={actionLoading}
                >
                  Unassign
                </Button>
                <Button type="button" onClick={submitAssignment} disabled={actionLoading}>
                  {actionLoading ? 'Saving...' : 'Save Assignment'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {detailsOpen && (
          <div className="fixed inset-0 z-30 flex items-center justify-center bg-stone-brown-900/25 p-4">
            <div className="w-full max-w-3xl rounded-2xl border border-stone-brown-100 bg-white p-6 shadow-lg max-h-[85vh] overflow-y-auto">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-stone-brown-900">Incident Details</h2>
                  <p className="mt-1 text-sm text-silver-500">
                    {selectedIncident ? `Incident #${selectedIncident.id}` : 'Loading incident details...'}
                  </p>
                </div>
                <Button type="button" variant="outline" onClick={closeDetails}>
                  Close
                </Button>
              </div>

              {detailsLoading || !selectedIncident ? (
                <p className="mt-4 text-sm text-silver-500">Loading...</p>
              ) : (
                <div className="mt-5 space-y-5">
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2 text-sm">
                    <p><span className="font-semibold text-stone-brown-900">Type:</span> {selectedIncident.type}</p>
                    <p><span className="font-semibold text-stone-brown-900">Detected Class:</span> {selectedIncident.detected_class || '-'}</p>
                    <p><span className="font-semibold text-stone-brown-900">Source:</span> {selectedIncident.source || '-'}</p>
                    <p><span className="font-semibold text-stone-brown-900">Confidence:</span> {selectedIncident.confidence_score ?? selectedIncident.confidence ?? '-'}</p>
                    <p><span className="font-semibold text-stone-brown-900">Verification Status:</span> {selectedIncident.verification_status || 'pending'}</p>
                    <p><span className="font-semibold text-stone-brown-900">Verified By:</span> {selectedIncident.verified_by_name || '-'}</p>
                    <p><span className="font-semibold text-stone-brown-900">Camera:</span> {selectedIncident.camera_name || '-'}</p>
                    <p><span className="font-semibold text-stone-brown-900">Responder:</span> {selectedIncident.assigned_responder_name || '-'}</p>
                    <p className="md:col-span-2"><span className="font-semibold text-stone-brown-900">Description:</span> {selectedIncident.description || '-'}</p>
                  </div>

                  {selectedIncident.verification_status !== 'verified' && (
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => openVerificationDialog(selectedIncident, 'verified')}
                        disabled={actionLoading}
                      >
                        Mark Verified
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => openVerificationDialog(selectedIncident, 'rejected')}
                        disabled={actionLoading}
                      >
                        Mark Rejected
                      </Button>
                    </div>
                  )}

                  <div>
                    <h3 className="text-sm font-semibold text-stone-brown-900">Assignment History</h3>
                    <div className="mt-2 rounded-md border border-stone-brown-100">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Action</TableHead>
                            <TableHead>From</TableHead>
                            <TableHead>To</TableHead>
                            <TableHead>Comment</TableHead>
                            <TableHead>Timestamp</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {(selectedIncident.history || []).length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={5} className="text-center text-silver-500">
                                No history entries.
                              </TableCell>
                            </TableRow>
                          ) : (
                            selectedIncident.history.map((entry) => (
                              <TableRow key={entry.id}>
                                <TableCell>{entry.action}</TableCell>
                                <TableCell>{entry.prev_status || '-'}</TableCell>
                                <TableCell>{entry.new_status || '-'}</TableCell>
                                <TableCell>{entry.comment || '-'}</TableCell>
                                <TableCell>{entry.timestamp ? new Date(entry.timestamp).toLocaleString() : '-'}</TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {verifyTarget && (
          <div className="fixed inset-0 z-30 flex items-center justify-center bg-stone-brown-900/25 p-4">
            <div className="w-full max-w-xl rounded-2xl border border-stone-brown-100 bg-white p-6 shadow-lg">
              <h2 className="text-lg font-bold text-stone-brown-900">Incident Verification</h2>
              <p className="mt-1 text-sm text-silver-500">
                Incident #{verifyTarget.id} • {formatIncidentType(verifyTarget)}
              </p>

              <div className="mt-5 space-y-4">
                <label className="flex flex-col gap-1 text-sm text-silver-600">
                  Verification Decision
                  <select
                    value={verifyStatus}
                    onChange={(event) => {
                      const value = event.target.value;
                      setVerifyStatus(value);
                      if (value === 'rejected') setFalsePositiveTag(true);
                    }}
                    className="h-10 rounded-md border border-stone-brown-100 bg-white px-3 text-sm text-stone-brown-900 outline-none focus:border-toasted-almond-400"
                  >
                    <option value="verified">Verified</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </label>

                {verifyStatus === 'rejected' && (
                  <label className="flex items-center gap-2 text-sm text-silver-600">
                    <input
                      type="checkbox"
                      checked={falsePositiveTag}
                      onChange={(event) => setFalsePositiveTag(event.target.checked)}
                      className="h-4 w-4 rounded border-stone-brown-200"
                    />
                    Tag as false positive
                  </label>
                )}

                <label className="flex flex-col gap-1 text-sm text-silver-600">
                  Comment
                  <textarea
                    rows={3}
                    value={verifyComment}
                    onChange={(event) => setVerifyComment(event.target.value)}
                    className="rounded-md border border-stone-brown-100 px-3 py-2 text-sm text-stone-brown-900 outline-none focus:border-toasted-almond-400"
                    placeholder="Add verification notes"
                  />
                </label>
              </div>

              <div className="mt-6 flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={closeVerificationDialog}>
                  Cancel
                </Button>
                <Button type="button" onClick={submitVerification} disabled={actionLoading}>
                  {actionLoading ? 'Saving...' : 'Save Verification'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
