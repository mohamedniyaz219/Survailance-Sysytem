import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import API from '../services/api';

const defaultPagination = {
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 1
};

export const fetchIncidents = createAsyncThunk(
  'incidents/fetchIncidents',
  async ({ page = 1, limit = 10, search = '', status = '', type = '', verification_status = '' } = {}, { rejectWithValue }) => {
    try {
      const response = await API.get('/admin/incidents', {
        params: { page, limit, search, status, type, verification_status }
      });
      return response.data;
    } catch (err) {
      return rejectWithValue(err?.response?.data?.error || 'Failed to fetch incidents');
    }
  }
);

export const fetchResponderOptions = createAsyncThunk(
  'incidents/fetchResponderOptions',
  async ({ search = '' } = {}, { rejectWithValue }) => {
    try {
      const response = await API.get('/admin/responders/options', {
        params: { search, limit: 500 }
      });
      return response.data;
    } catch (err) {
      return rejectWithValue(err?.response?.data?.error || 'Failed to fetch responder options');
    }
  }
);

export const fetchIncidentDetails = createAsyncThunk(
  'incidents/fetchIncidentDetails',
  async (incidentId, { rejectWithValue }) => {
    try {
      const response = await API.get(`/admin/incidents/${incidentId}`);
      return response.data;
    } catch (err) {
      return rejectWithValue(err?.response?.data?.error || 'Failed to fetch incident details');
    }
  }
);

export const assignIncidentResponder = createAsyncThunk(
  'incidents/assignIncidentResponder',
  async ({ incidentId, responder_id = null, comment = '' }, { rejectWithValue, dispatch, getState }) => {
    try {
      const payload = {
        responder_id,
        comment: comment || null
      };

      const response = await API.post(`/admin/incidents/${incidentId}/assign`, payload);

      const { page, limit, search, statusFilter, typeFilter, verificationFilter } = getState().incidents;
      dispatch(fetchIncidents({ page, limit, search, status: statusFilter, type: typeFilter, verification_status: verificationFilter }));
      dispatch(fetchIncidentDetails(incidentId));

      return response.data;
    } catch (err) {
      return rejectWithValue(err?.response?.data?.error || 'Failed to update responder assignment');
    }
  }
);

export const verifyIncidentDecision = createAsyncThunk(
  'incidents/verifyIncidentDecision',
  async (
    { incidentId, verification_status, false_positive_tag = false, comment = '' },
    { rejectWithValue, dispatch, getState }
  ) => {
    try {
      const payload = {
        verification_status,
        false_positive_tag: Boolean(false_positive_tag),
        comment: comment || null
      };

      const response = await API.patch(`/admin/incidents/${incidentId}/verify`, payload);

      const { page, limit, search, statusFilter, typeFilter, verificationFilter } = getState().incidents;
      dispatch(fetchIncidents({ page, limit, search, status: statusFilter, type: typeFilter, verification_status: verificationFilter }));
      dispatch(fetchIncidentDetails(incidentId));

      return response.data;
    } catch (err) {
      return rejectWithValue(err?.response?.data?.error || 'Failed to verify incident');
    }
  }
);

const incidentsSlice = createSlice({
  name: 'incidents',
  initialState: {
    items: [],
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
    search: '',
    statusFilter: '',
    typeFilter: '',
    verificationFilter: '',
    responderOptions: [],
    respondersLoading: false,
    selectedIncident: null,
    detailsLoading: false,
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
    setStatusFilter(state, action) {
      state.statusFilter = action.payload;
      state.page = 1;
    },
    setTypeFilter(state, action) {
      state.typeFilter = action.payload;
      state.page = 1;
    },
    setVerificationFilter(state, action) {
      state.verificationFilter = action.payload;
      state.page = 1;
    },
    clearIncidentError(state) {
      state.error = null;
    },
    clearIncidentDetails(state) {
      state.selectedIncident = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchIncidents.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchIncidents.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload?.data || [];
        const pagination = action.payload?.pagination || defaultPagination;
        state.page = pagination.page;
        state.limit = pagination.limit;
        state.total = pagination.total;
        state.totalPages = pagination.totalPages;
      })
      .addCase(fetchIncidents.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchResponderOptions.pending, (state) => {
        state.respondersLoading = true;
      })
      .addCase(fetchResponderOptions.fulfilled, (state, action) => {
        state.respondersLoading = false;
        state.responderOptions = action.payload?.data || [];
      })
      .addCase(fetchResponderOptions.rejected, (state, action) => {
        state.respondersLoading = false;
        state.error = action.payload;
      })
      .addCase(fetchIncidentDetails.pending, (state) => {
        state.detailsLoading = true;
      })
      .addCase(fetchIncidentDetails.fulfilled, (state, action) => {
        state.detailsLoading = false;
        state.selectedIncident = action.payload?.data || null;
      })
      .addCase(fetchIncidentDetails.rejected, (state, action) => {
        state.detailsLoading = false;
        state.error = action.payload;
      })
      .addCase(assignIncidentResponder.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(assignIncidentResponder.fulfilled, (state) => {
        state.actionLoading = false;
      })
      .addCase(assignIncidentResponder.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })
      .addCase(verifyIncidentDecision.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(verifyIncidentDecision.fulfilled, (state) => {
        state.actionLoading = false;
      })
      .addCase(verifyIncidentDecision.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      });
  }
});

export const {
  setPage,
  setLimit,
  setSearch,
  setStatusFilter,
  setTypeFilter,
  setVerificationFilter,
  clearIncidentError,
  clearIncidentDetails
} = incidentsSlice.actions;

export default incidentsSlice.reducer;
