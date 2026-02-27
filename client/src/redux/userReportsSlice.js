import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import API from '../services/api';

const defaultPagination = {
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 1
};

export const fetchUserReports = createAsyncThunk(
  'userReports/fetchUserReports',
  async ({ page = 1, limit = 10, search = '', status = '' } = {}, { rejectWithValue }) => {
    try {
      const response = await API.get('/admin/user-reports', { params: { page, limit, search, status } });
      return response.data;
    } catch (err) {
      return rejectWithValue(err?.response?.data?.error || 'Failed to fetch user reports');
    }
  }
);

export const fetchResponderOptions = createAsyncThunk(
  'userReports/fetchResponderOptions',
  async ({ search = '' } = {}, { rejectWithValue }) => {
    try {
      const response = await API.get('/admin/responders/options', { params: { search, limit: 500 } });
      return response.data;
    } catch (err) {
      return rejectWithValue(err?.response?.data?.error || 'Failed to fetch responders');
    }
  }
);

export const assignUserReport = createAsyncThunk(
  'userReports/assignUserReport',
  async ({ id, responderId }, { rejectWithValue, dispatch, getState }) => {
    try {
      await API.post(`/admin/user-reports/${id}/assign`, { responder_id: responderId });
      const { page, limit, search, status } = getState().userReports;
      dispatch(fetchUserReports({ page, limit, search, status }));
    } catch (err) {
      return rejectWithValue(err?.response?.data?.error || 'Failed to assign responder');
    }
  }
);

const userReportsSlice = createSlice({
  name: 'userReports',
  initialState: {
    items: [],
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
    search: '',
    status: '',
    responderOptions: [],
    responderOptionsLoading: false,
    loading: false,
    actionLoading: false,
    error: null
  },
  reducers: {
    setUserReportsPage(state, action) {
      state.page = action.payload;
    },
    setUserReportsLimit(state, action) {
      state.limit = action.payload;
      state.page = 1;
    },
    setUserReportsSearch(state, action) {
      state.search = action.payload;
      state.page = 1;
    },
    setUserReportsStatus(state, action) {
      state.status = action.payload;
      state.page = 1;
    },
    clearUserReportsError(state) {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserReports.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserReports.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload?.data || [];
        const pagination = action.payload?.pagination || defaultPagination;
        state.page = pagination.page;
        state.limit = pagination.limit;
        state.total = pagination.total;
        state.totalPages = pagination.totalPages;
      })
      .addCase(fetchUserReports.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchResponderOptions.pending, (state) => {
        state.responderOptionsLoading = true;
      })
      .addCase(fetchResponderOptions.fulfilled, (state, action) => {
        state.responderOptionsLoading = false;
        state.responderOptions = action.payload?.data || [];
      })
      .addCase(fetchResponderOptions.rejected, (state, action) => {
        state.responderOptionsLoading = false;
        state.error = action.payload;
      })
      .addCase(assignUserReport.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(assignUserReport.fulfilled, (state) => {
        state.actionLoading = false;
      })
      .addCase(assignUserReport.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      });
  }
});

export const {
  setUserReportsPage,
  setUserReportsLimit,
  setUserReportsSearch,
  setUserReportsStatus,
  clearUserReportsError
} = userReportsSlice.actions;

export default userReportsSlice.reducer;
