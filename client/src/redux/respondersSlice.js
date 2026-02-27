import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import API from '../services/api';

const defaultPagination = {
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 1
};

export const fetchResponders = createAsyncThunk(
  'responders/fetchResponders',
  async ({ page = 1, limit = 10, search = '' } = {}, { rejectWithValue }) => {
    try {
      const response = await API.get('/admin/responders', {
        params: { page, limit, search }
      });
      return response.data;
    } catch (err) {
      return rejectWithValue(err?.response?.data?.error || 'Failed to fetch responders');
    }
  }
);

export const fetchZoneOptions = createAsyncThunk(
  'responders/fetchZoneOptions',
  async ({ search = '' } = {}, { rejectWithValue }) => {
    try {
      const response = await API.get('/admin/zones/options', {
        params: { search, limit: 500 }
      });
      return response.data;
    } catch (err) {
      return rejectWithValue(err?.response?.data?.error || 'Failed to fetch zones');
    }
  }
);

export const createResponder = createAsyncThunk(
  'responders/createResponder',
  async (payload, { rejectWithValue, dispatch, getState }) => {
    try {
      await API.post('/admin/responders', payload);
      const { page, limit, search } = getState().responders;
      dispatch(fetchResponders({ page, limit, search }));
    } catch (err) {
      return rejectWithValue(err?.response?.data?.error || 'Failed to create responder');
    }
  }
);

export const updateResponder = createAsyncThunk(
  'responders/updateResponder',
  async ({ id, data }, { rejectWithValue, dispatch, getState }) => {
    try {
      await API.patch(`/admin/responders/${id}`, data);
      const { page, limit, search } = getState().responders;
      dispatch(fetchResponders({ page, limit, search }));
    } catch (err) {
      return rejectWithValue(err?.response?.data?.error || 'Failed to update responder');
    }
  }
);

export const deleteResponder = createAsyncThunk(
  'responders/deleteResponder',
  async (id, { rejectWithValue, dispatch, getState }) => {
    try {
      await API.delete(`/admin/responders/${id}`);
      const { page, limit, search } = getState().responders;
      dispatch(fetchResponders({ page, limit, search }));
    } catch (err) {
      return rejectWithValue(err?.response?.data?.error || 'Failed to delete responder');
    }
  }
);

const respondersSlice = createSlice({
  name: 'responders',
  initialState: {
    items: [],
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
    search: '',
    zoneOptions: [],
    zoneOptionsLoading: false,
    loading: false,
    actionLoading: false,
    error: null
  },
  reducers: {
    setPage(state, action) {
      state.page = action.payload;
    },
    setLimit(state, action) {
      state.limit = action.payload;
      state.page = 1;
    },
    setSearch(state, action) {
      state.search = action.payload;
      state.page = 1;
    },
    clearRespondersError(state) {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchResponders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchResponders.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload?.data || [];
        const pagination = action.payload?.pagination || defaultPagination;
        state.page = pagination.page;
        state.limit = pagination.limit;
        state.total = pagination.total;
        state.totalPages = pagination.totalPages;
      })
      .addCase(fetchResponders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchZoneOptions.pending, (state) => {
        state.zoneOptionsLoading = true;
      })
      .addCase(fetchZoneOptions.fulfilled, (state, action) => {
        state.zoneOptionsLoading = false;
        state.zoneOptions = action.payload?.data || [];
      })
      .addCase(fetchZoneOptions.rejected, (state, action) => {
        state.zoneOptionsLoading = false;
        state.error = action.payload;
      })
      .addCase(createResponder.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(createResponder.fulfilled, (state) => {
        state.actionLoading = false;
      })
      .addCase(createResponder.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })
      .addCase(updateResponder.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(updateResponder.fulfilled, (state) => {
        state.actionLoading = false;
      })
      .addCase(updateResponder.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })
      .addCase(deleteResponder.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(deleteResponder.fulfilled, (state) => {
        state.actionLoading = false;
      })
      .addCase(deleteResponder.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      });
  }
});

export const { setPage, setLimit, setSearch, clearRespondersError } = respondersSlice.actions;
export default respondersSlice.reducer;
