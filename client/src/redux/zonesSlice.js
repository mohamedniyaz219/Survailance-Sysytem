import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import API from '../services/api';

const defaultPagination = {
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 1
};

export const fetchZones = createAsyncThunk(
  'zones/fetchZones',
  async ({ page = 1, limit = 10, search = '' } = {}, { rejectWithValue }) => {
    try {
      const response = await API.get('/admin/zones', { params: { page, limit, search } });
      return response.data;
    } catch (err) {
      return rejectWithValue(err?.response?.data?.error || 'Failed to fetch zones');
    }
  }
);

export const createZone = createAsyncThunk(
  'zones/createZone',
  async (payload, { rejectWithValue, dispatch, getState }) => {
    try {
      await API.post('/admin/zones', payload);
      const { page, limit, search } = getState().zones;
      dispatch(fetchZones({ page, limit, search }));
    } catch (err) {
      return rejectWithValue(err?.response?.data?.error || 'Failed to create zone');
    }
  }
);

export const updateZone = createAsyncThunk(
  'zones/updateZone',
  async ({ id, data }, { rejectWithValue, dispatch, getState }) => {
    try {
      await API.patch(`/admin/zones/${id}`, data);
      const { page, limit, search } = getState().zones;
      dispatch(fetchZones({ page, limit, search }));
    } catch (err) {
      return rejectWithValue(err?.response?.data?.error || 'Failed to update zone');
    }
  }
);

export const deleteZone = createAsyncThunk(
  'zones/deleteZone',
  async (id, { rejectWithValue, dispatch, getState }) => {
    try {
      await API.delete(`/admin/zones/${id}`);
      const { page, limit, search } = getState().zones;
      dispatch(fetchZones({ page, limit, search }));
    } catch (err) {
      return rejectWithValue(err?.response?.data?.error || 'Failed to delete zone');
    }
  }
);

const zonesSlice = createSlice({
  name: 'zones',
  initialState: {
    items: [],
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
    search: '',
    loading: false,
    actionLoading: false,
    error: null
  },
  reducers: {
    setZonesPage(state, action) {
      state.page = action.payload;
    },
    setZonesLimit(state, action) {
      state.limit = action.payload;
      state.page = 1;
    },
    setZonesSearch(state, action) {
      state.search = action.payload;
      state.page = 1;
    },
    clearZonesError(state) {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchZones.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchZones.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload?.data || [];
        const pagination = action.payload?.pagination || defaultPagination;
        state.page = pagination.page;
        state.limit = pagination.limit;
        state.total = pagination.total;
        state.totalPages = pagination.totalPages;
      })
      .addCase(fetchZones.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createZone.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(createZone.fulfilled, (state) => {
        state.actionLoading = false;
      })
      .addCase(createZone.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })
      .addCase(updateZone.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(updateZone.fulfilled, (state) => {
        state.actionLoading = false;
      })
      .addCase(updateZone.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })
      .addCase(deleteZone.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(deleteZone.fulfilled, (state) => {
        state.actionLoading = false;
      })
      .addCase(deleteZone.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      });
  }
});

export const { setZonesPage, setZonesLimit, setZonesSearch, clearZonesError } = zonesSlice.actions;
export default zonesSlice.reducer;
