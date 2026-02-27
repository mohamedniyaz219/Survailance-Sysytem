import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import API from '../services/api';

const defaultPagination = {
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 1
};

export const fetchEvents = createAsyncThunk(
  'events/fetchEvents',
  async ({ page = 1, limit = 10, search = '', status = '' } = {}, { rejectWithValue }) => {
    try {
      const response = await API.get('/admin/events', { params: { page, limit, search, status } });
      return response.data;
    } catch (err) {
      return rejectWithValue(err?.response?.data?.error || 'Failed to fetch events');
    }
  }
);

export const createEvent = createAsyncThunk(
  'events/createEvent',
  async (payload, { rejectWithValue, dispatch, getState }) => {
    try {
      await API.post('/admin/events', payload);
      const { page, limit, search, status } = getState().events;
      dispatch(fetchEvents({ page, limit, search, status }));
    } catch (err) {
      return rejectWithValue(err?.response?.data?.error || 'Failed to create event');
    }
  }
);

export const updateEvent = createAsyncThunk(
  'events/updateEvent',
  async ({ id, data }, { rejectWithValue, dispatch, getState }) => {
    try {
      await API.patch(`/admin/events/${id}`, data);
      const { page, limit, search, status } = getState().events;
      dispatch(fetchEvents({ page, limit, search, status }));
    } catch (err) {
      return rejectWithValue(err?.response?.data?.error || 'Failed to update event');
    }
  }
);

export const deleteEvent = createAsyncThunk(
  'events/deleteEvent',
  async (id, { rejectWithValue, dispatch, getState }) => {
    try {
      await API.delete(`/admin/events/${id}`);
      const { page, limit, search, status } = getState().events;
      dispatch(fetchEvents({ page, limit, search, status }));
    } catch (err) {
      return rejectWithValue(err?.response?.data?.error || 'Failed to delete event');
    }
  }
);

const eventsSlice = createSlice({
  name: 'events',
  initialState: {
    items: [],
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
    search: '',
    status: '',
    loading: false,
    actionLoading: false,
    error: null
  },
  reducers: {
    setEventsPage(state, action) {
      state.page = action.payload;
    },
    setEventsLimit(state, action) {
      state.limit = action.payload;
      state.page = 1;
    },
    setEventsSearch(state, action) {
      state.search = action.payload;
      state.page = 1;
    },
    setEventsStatus(state, action) {
      state.status = action.payload;
      state.page = 1;
    },
    clearEventsError(state) {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchEvents.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEvents.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload?.data || [];
        const pagination = action.payload?.pagination || defaultPagination;
        state.page = pagination.page;
        state.limit = pagination.limit;
        state.total = pagination.total;
        state.totalPages = pagination.totalPages;
      })
      .addCase(fetchEvents.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createEvent.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(createEvent.fulfilled, (state) => {
        state.actionLoading = false;
      })
      .addCase(createEvent.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })
      .addCase(updateEvent.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(updateEvent.fulfilled, (state) => {
        state.actionLoading = false;
      })
      .addCase(updateEvent.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })
      .addCase(deleteEvent.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(deleteEvent.fulfilled, (state) => {
        state.actionLoading = false;
      })
      .addCase(deleteEvent.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      });
  }
});

export const {
  setEventsPage,
  setEventsLimit,
  setEventsSearch,
  setEventsStatus,
  clearEventsError
} = eventsSlice.actions;

export default eventsSlice.reducer;
