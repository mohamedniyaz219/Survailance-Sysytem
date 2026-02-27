import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Edit3, Plus, Radar, Trash2 } from 'lucide-react';
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
  clearAnomalyRulesError,
  createAnomalyRule,
  deleteAnomalyRule,
  fetchAnomalyRules,
  fetchAnomalyZoneOptions,
  setAnomalyRulesActiveFilter,
  setAnomalyRulesLimit,
  setAnomalyRulesPage,
  setAnomalyRulesSearch,
  setAnomalyRulesType,
  updateAnomalyRule
} from '../../redux/anomalyRulesSlice';

const ruleTypeOptions = [
  { value: 'loitering', label: 'Loitering' },
  { value: 'sudden_motion', label: 'Sudden Motion' },
  { value: 'object_abandoned', label: 'Object Abandoned' },
  { value: 'crowd_spike', label: 'Crowd Spike' }
];

const defaultForm = {
  name: '',
  rule_type: 'loitering',
  threshold_value: '',
  zone_id: '',
  is_active: true
};

export default function AnomalyRulesPage() {
  const dispatch = useDispatch();
  const {
    items,
    page,
    limit,
    totalPages,
    search,
    ruleType,
    activeFilter,
    zoneOptions,
    zoneOptionsLoading,
    loading,
    actionLoading,
    error
  } = useSelector((state) => state.anomalyRules);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(defaultForm);

  useEffect(() => {
    dispatch(fetchAnomalyRules({ page, limit, search, rule_type: ruleType, is_active: activeFilter }));
  }, [dispatch, page, limit, search, ruleType, activeFilter]);

  const openCreateForm = () => {
    dispatch(clearAnomalyRulesError());
    dispatch(fetchAnomalyZoneOptions());
    setEditingId(null);
    setFormData(defaultForm);
    setIsFormOpen(true);
  };

  const openEditForm = (item) => {
    dispatch(clearAnomalyRulesError());
    dispatch(fetchAnomalyZoneOptions());
    setEditingId(item.id);
    setFormData({
      name: item.name || '',
      rule_type: item.rule_type || 'loitering',
      threshold_value: item.threshold_value ?? '',
      zone_id: item.zone_id || '',
      is_active: Boolean(item.is_active)
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
      rule_type: formData.rule_type,
      threshold_value: Number(formData.threshold_value),
      zone_id: formData.zone_id || null,
      is_active: formData.is_active
    };

    const result = editingId
      ? await dispatch(updateAnomalyRule({ id: editingId, data: payload }))
      : await dispatch(createAnomalyRule(payload));

    if (!result.error) {
      closeForm();
    }
  };

  const onDelete = async (id) => {
    if (!window.confirm('Delete this anomaly rule?')) return;
    await dispatch(deleteAnomalyRule(id));
  };

  return (
    <div className="flex-1 p-8 overflow-y-auto bg-stone-brown-50 h-screen">
      <div className="max-w-7xl mx-auto rounded-2xl border border-stone-brown-100 bg-white shadow-sm">
        <div className="px-6 py-5 border-b border-stone-brown-100 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-xl font-bold text-stone-brown-900">Anomaly Rules</h1>
            <p className="text-sm text-silver-500">Admin-controlled anomaly definition engine.</p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <input
              value={search}
              onChange={(event) => dispatch(setAnomalyRulesSearch(event.target.value))}
              placeholder="Search anomaly rules"
              className="h-10 w-56 rounded-md border border-stone-brown-100 px-3 text-sm text-stone-brown-900 outline-none focus:border-toasted-almond-400"
            />

            <select
              value={ruleType}
              onChange={(event) => dispatch(setAnomalyRulesType(event.target.value))}
              className="h-10 rounded-md border border-stone-brown-100 bg-white px-3 text-sm text-stone-brown-900"
            >
              <option value="">All types</option>
              {ruleTypeOptions.map((item) => (
                <option key={item.value} value={item.value}>{item.label}</option>
              ))}
            </select>

            <select
              value={activeFilter}
              onChange={(event) => dispatch(setAnomalyRulesActiveFilter(event.target.value))}
              className="h-10 rounded-md border border-stone-brown-100 bg-white px-3 text-sm text-stone-brown-900"
            >
              <option value="">All status</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>

            <Button onClick={openCreateForm} className="gap-2">
              <Plus size={16} />
              Add Rule
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
            <TableCaption>Anomaly rule definitions used by surveillance engine.</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Rule Type</TableHead>
                <TableHead>Threshold</TableHead>
                <TableHead>Zone</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-silver-500">Loading anomaly rules...</TableCell>
                </TableRow>
              ) : items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-silver-500">
                    <div className="flex flex-col items-center gap-2 py-8">
                      <Radar size={24} className="text-silver-300" />
                      <span>No anomaly rules found.</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-semibold">{item.name}</TableCell>
                    <TableCell className="capitalize">{String(item.rule_type || '').replace('_', ' ')}</TableCell>
                    <TableCell>{item.threshold_value}</TableCell>
                    <TableCell>{item.zone || '-'}</TableCell>
                    <TableCell>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${item.is_active ? 'bg-olive-wood-100 text-olive-wood-700' : 'bg-silver-100 text-silver-600'}`}>
                        {item.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="icon" onClick={() => openEditForm(item)}>
                          <Edit3 size={16} />
                        </Button>
                        <Button variant="outline" size="icon" onClick={() => onDelete(item.id)}>
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
                onChange={(event) => dispatch(setAnomalyRulesLimit(Number(event.target.value)))}
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
              </select>
            </div>

            <Pagination page={page} totalPages={totalPages} onPageChange={(value) => dispatch(setAnomalyRulesPage(value))} />
          </div>
        </div>
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-stone-brown-900/25 p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-stone-brown-100 bg-white p-6 shadow-lg">
            <h2 className="text-lg font-bold text-stone-brown-900">{editingId ? 'Edit Anomaly Rule' : 'Create Anomaly Rule'}</h2>

            <form onSubmit={onSubmit} className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
              <label className="flex flex-col gap-1 text-sm text-silver-600 md:col-span-2">
                Rule Name
                <input
                  required
                  name="name"
                  value={formData.name}
                  onChange={onChange}
                  className="h-10 rounded-md border border-stone-brown-100 px-3 text-stone-brown-900 outline-none focus:border-toasted-almond-400"
                  placeholder="Person loitering > 5 min"
                />
              </label>

              <label className="flex flex-col gap-1 text-sm text-silver-600">
                Rule Type
                <select
                  name="rule_type"
                  value={formData.rule_type}
                  onChange={onChange}
                  className="h-10 rounded-md border border-stone-brown-100 bg-white px-3 text-stone-brown-900 outline-none focus:border-toasted-almond-400"
                >
                  {ruleTypeOptions.map((item) => (
                    <option key={item.value} value={item.value}>{item.label}</option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-1 text-sm text-silver-600">
                Threshold Value
                <input
                  required
                  type="number"
                  min={0}
                  name="threshold_value"
                  value={formData.threshold_value}
                  onChange={onChange}
                  className="h-10 rounded-md border border-stone-brown-100 px-3 text-stone-brown-900 outline-none focus:border-toasted-almond-400"
                />
              </label>

              <label className="flex flex-col gap-1 text-sm text-silver-600 md:col-span-2">
                Zone
                <SearchableSelect
                  value={formData.zone_id}
                  onChange={(value) => setFormData((prev) => ({ ...prev, zone_id: value }))}
                  options={zoneOptions}
                  loading={zoneOptionsLoading}
                  placeholder="Select a zone"
                  emptyText="No zones found"
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
                Active rule
              </label>

              <div className="md:col-span-2 mt-2 flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={closeForm}>Cancel</Button>
                <Button type="submit" disabled={actionLoading}>{actionLoading ? 'Saving...' : editingId ? 'Update Rule' : 'Create Rule'}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
