import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Bot, CheckCircle2, RefreshCw } from 'lucide-react';
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
  activateAIModel,
  clearAIModelsError,
  fetchAIModels,
  setAIModelsLimit,
  setAIModelsPage,
  setAIModelsSearch,
  syncAIModels
} from '../../redux/aiModelsSlice';

export default function AIModelsPage() {
  const dispatch = useDispatch();
  const {
    items,
    page,
    limit,
    totalPages,
    search,
    loading,
    actionLoading,
    syncLoading,
    lastSync,
    error
  } = useSelector((state) => state.aiModels);

  useEffect(() => {
    dispatch(fetchAIModels({ page, limit, search }));
  }, [dispatch, page, limit, search]);

  const onActivate = async (id) => {
    dispatch(clearAIModelsError());
    await dispatch(activateAIModel(id));
  };

  const onSync = async () => {
    dispatch(clearAIModelsError());
    await dispatch(syncAIModels());
  };

  return (
    <div className="flex-1 p-8 overflow-y-auto bg-stone-brown-50 h-screen">
      <div className="max-w-6xl mx-auto rounded-2xl border border-stone-brown-100 bg-white shadow-sm">
        <div className="px-6 py-5 border-b border-stone-brown-100 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-xl font-bold text-stone-brown-900">AI Models</h1>
            <p className="text-sm text-silver-500">Choose active model and sync available models from AI engine catalog.</p>
          </div>

          <div className="flex items-center gap-3">
            <input
              value={search}
              onChange={(event) => dispatch(setAIModelsSearch(event.target.value))}
              placeholder="Search models"
              className="h-10 w-56 rounded-md border border-stone-brown-100 px-3 text-sm text-stone-brown-900 outline-none focus:border-toasted-almond-400"
            />
            <Button variant="outline" onClick={onSync} disabled={syncLoading} className="gap-2">
              <RefreshCw size={16} className={syncLoading ? 'animate-spin' : ''} />
              {syncLoading ? 'Syncing...' : 'Sync from Engine'}
            </Button>
          </div>
        </div>

        {error && (
          <div className="mx-6 mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        {lastSync && (
          <div className="mx-6 mt-4 rounded-md border border-olive-wood-200 bg-olive-wood-50 px-3 py-2 text-sm text-olive-wood-700">
            Sync complete: discovered {lastSync.discovered}, inserted {lastSync.inserted}, updated {lastSync.updated}, removed {lastSync.deleted}
          </div>
        )}

        <div className="px-6 py-4">
          <Table>
            <TableCaption>AI models table.</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Version</TableHead>
                <TableHead>Accuracy</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-silver-500">Loading AI models...</TableCell>
                </TableRow>
              ) : items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-silver-500">
                    <div className="flex flex-col items-center gap-2 py-8">
                      <Bot className="text-silver-300" size={24} />
                      <span>No AI models found.</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                items.map((model) => (
                  <TableRow key={model.id}>
                    <TableCell className="font-semibold">{model.name}</TableCell>
                    <TableCell>{model.version || '-'}</TableCell>
                    <TableCell>
                      {model.accuracy_score === null || model.accuracy_score === undefined
                        ? '-'
                        : `${Number(model.accuracy_score).toFixed(2)}%`}
                    </TableCell>
                    <TableCell>
                      {model.is_active ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-olive-wood-100 px-3 py-1 text-xs font-semibold text-olive-wood-700">
                          <CheckCircle2 size={12} />
                          Active
                        </span>
                      ) : (
                        <span className="rounded-full bg-silver-100 px-3 py-1 text-xs font-semibold text-silver-600">
                          Inactive
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant={model.is_active ? 'outline' : 'default'}
                        disabled={model.is_active || actionLoading}
                        onClick={() => onActivate(model.id)}
                      >
                        {model.is_active ? 'Selected' : 'Set Active'}
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
                onChange={(event) => dispatch(setAIModelsLimit(Number(event.target.value)))}
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
              </select>
            </div>

            <Pagination page={page} totalPages={totalPages} onPageChange={(value) => dispatch(setAIModelsPage(value))} />
          </div>
        </div>
      </div>
    </div>
  );
}
