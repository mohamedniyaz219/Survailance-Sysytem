import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import API from '../services/api';

const defaultPagination = {
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 1
};

export const fetchAnomalyRules = createAsyncThunk(
  'anomalyRules/fetchAnomalyRules',
  async ({ page = 1, limit = 10, search = '', rule_type = '', is_active = '' } = {}, { rejectWithValue }) => {
    try {
      const response = await API.get('/admin/anomaly-rules', {
        params: { page, limit, search, rule_type, is_active }
      });
      return response.data;
    } catch (err) {
      return rejectWithValue(err?.response?.data?.error || 'Failed to fetch anomaly rules');
    }
  }
);

export const fetchAnomalyZoneOptions = createAsyncThunk(
  'anomalyRules/fetchAnomalyZoneOptions',
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

export const createAnomalyRule = createAsyncThunk(
  'anomalyRules/createAnomalyRule',
  async (payload, { rejectWithValue, dispatch, getState }) => {
    try {
      await API.post('/admin/anomaly-rules', payload);
      const { page, limit, search, ruleType, activeFilter } = getState().anomalyRules;
      dispatch(fetchAnomalyRules({ page, limit, search, rule_type: ruleType, is_active: activeFilter }));
    } catch (err) {
      return rejectWithValue(err?.response?.data?.error || 'Failed to create anomaly rule');
    }
  }
);

export const updateAnomalyRule = createAsyncThunk(
  'anomalyRules/updateAnomalyRule',
  async ({ id, data }, { rejectWithValue, dispatch, getState }) => {
    try {
      await API.patch(`/admin/anomaly-rules/${id}`, data);
      const { page, limit, search, ruleType, activeFilter } = getState().anomalyRules;
      dispatch(fetchAnomalyRules({ page, limit, search, rule_type: ruleType, is_active: activeFilter }));
    } catch (err) {
      return rejectWithValue(err?.response?.data?.error || 'Failed to update anomaly rule');
    }
  }
);

export const deleteAnomalyRule = createAsyncThunk(
  'anomalyRules/deleteAnomalyRule',
  async (id, { rejectWithValue, dispatch, getState }) => {
    try {
      await API.delete(`/admin/anomaly-rules/${id}`);
      const { page, limit, search, ruleType, activeFilter } = getState().anomalyRules;
      dispatch(fetchAnomalyRules({ page, limit, search, rule_type: ruleType, is_active: activeFilter }));
    } catch (err) {
      return rejectWithValue(err?.response?.data?.error || 'Failed to delete anomaly rule');
    }
  }
);

const anomalyRulesSlice = createSlice({
  name: 'anomalyRules',
  initialState: {
    items: [],
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
    search: '',
    ruleType: '',
    activeFilter: '',
    zoneOptions: [],
    zoneOptionsLoading: false,
    loading: false,
    actionLoading: false,
    error: null
  },
  reducers: {
    setAnomalyRulesPage(state, action) {
      state.page = action.payload;
    },
    setAnomalyRulesLimit(state, action) {
      state.limit = action.payload;
      state.page = 1;
    },
    setAnomalyRulesSearch(state, action) {
      state.search = action.payload;
      state.page = 1;
    },
    setAnomalyRulesType(state, action) {
      state.ruleType = action.payload;
      state.page = 1;
    },
    setAnomalyRulesActiveFilter(state, action) {
      state.activeFilter = action.payload;
      state.page = 1;
    },
    clearAnomalyRulesError(state) {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAnomalyRules.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAnomalyRules.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload?.data || [];
        const pagination = action.payload?.pagination || defaultPagination;
        state.page = pagination.page;
        state.limit = pagination.limit;
        state.total = pagination.total;
        state.totalPages = pagination.totalPages;
      })
      .addCase(fetchAnomalyRules.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchAnomalyZoneOptions.pending, (state) => {
        state.zoneOptionsLoading = true;
      })
      .addCase(fetchAnomalyZoneOptions.fulfilled, (state, action) => {
        state.zoneOptionsLoading = false;
        state.zoneOptions = action.payload?.data || [];
      })
      .addCase(fetchAnomalyZoneOptions.rejected, (state, action) => {
        state.zoneOptionsLoading = false;
        state.error = action.payload;
      })
      .addCase(createAnomalyRule.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(createAnomalyRule.fulfilled, (state) => {
        state.actionLoading = false;
      })
      .addCase(createAnomalyRule.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })
      .addCase(updateAnomalyRule.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(updateAnomalyRule.fulfilled, (state) => {
        state.actionLoading = false;
      })
      .addCase(updateAnomalyRule.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })
      .addCase(deleteAnomalyRule.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(deleteAnomalyRule.fulfilled, (state) => {
        state.actionLoading = false;
      })
      .addCase(deleteAnomalyRule.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      });
  }
});

export const {
  setAnomalyRulesPage,
  setAnomalyRulesLimit,
  setAnomalyRulesSearch,
  setAnomalyRulesType,
  setAnomalyRulesActiveFilter,
  clearAnomalyRulesError
} = anomalyRulesSlice.actions;

export default anomalyRulesSlice.reducer;
