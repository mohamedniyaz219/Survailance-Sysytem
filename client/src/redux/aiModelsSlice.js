import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import API from '../services/api';

const defaultPagination = {
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 1
};

export const fetchAIModels = createAsyncThunk(
  'aiModels/fetchAIModels',
  async ({ page = 1, limit = 10, search = '' } = {}, { rejectWithValue }) => {
    try {
      const response = await API.get('/admin/ai-models', { params: { page, limit, search } });
      return response.data;
    } catch (err) {
      return rejectWithValue(err?.response?.data?.error || 'Failed to fetch AI models');
    }
  }
);

export const activateAIModel = createAsyncThunk(
  'aiModels/activateAIModel',
  async (id, { rejectWithValue, dispatch, getState }) => {
    try {
      await API.patch(`/admin/ai-models/${id}/activate`);
      const { page, limit, search } = getState().aiModels;
      dispatch(fetchAIModels({ page, limit, search }));
    } catch (err) {
      return rejectWithValue(err?.response?.data?.error || 'Failed to activate AI model');
    }
  }
);

export const syncAIModels = createAsyncThunk(
  'aiModels/syncAIModels',
  async (_, { rejectWithValue, dispatch, getState }) => {
    try {
      const response = await API.post('/admin/ai-models/sync');
      const { page, limit, search } = getState().aiModels;
      dispatch(fetchAIModels({ page, limit, search }));
      return response.data;
    } catch (err) {
      return rejectWithValue(err?.response?.data?.error || 'Failed to sync AI models');
    }
  }
);

const aiModelsSlice = createSlice({
  name: 'aiModels',
  initialState: {
    items: [],
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
    search: '',
    loading: false,
    actionLoading: false,
    syncLoading: false,
    lastSync: null,
    error: null
  },
  reducers: {
    setAIModelsPage(state, action) {
      state.page = action.payload;
    },
    setAIModelsLimit(state, action) {
      state.limit = action.payload;
      state.page = 1;
    },
    setAIModelsSearch(state, action) {
      state.search = action.payload;
      state.page = 1;
    },
    clearAIModelsError(state) {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAIModels.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAIModels.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload?.data || [];
        const pagination = action.payload?.pagination || defaultPagination;
        state.page = pagination.page;
        state.limit = pagination.limit;
        state.total = pagination.total;
        state.totalPages = pagination.totalPages;
      })
      .addCase(fetchAIModels.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(activateAIModel.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(activateAIModel.fulfilled, (state) => {
        state.actionLoading = false;
      })
      .addCase(activateAIModel.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })
      .addCase(syncAIModels.pending, (state) => {
        state.syncLoading = true;
        state.error = null;
      })
      .addCase(syncAIModels.fulfilled, (state, action) => {
        state.syncLoading = false;
        state.lastSync = {
          inserted: action.payload?.inserted ?? 0,
          updated: action.payload?.updated ?? 0,
          deleted: action.payload?.deleted ?? 0,
          discovered: action.payload?.discovered ?? 0,
          at: new Date().toISOString()
        };
      })
      .addCase(syncAIModels.rejected, (state, action) => {
        state.syncLoading = false;
        state.error = action.payload;
      });
  }
});

export const {
  setAIModelsPage,
  setAIModelsLimit,
  setAIModelsSearch,
  clearAIModelsError
} = aiModelsSlice.actions;

export default aiModelsSlice.reducer;
