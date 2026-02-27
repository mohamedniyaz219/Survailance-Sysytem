import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import API from '../services/api';

export const fetchDashboardOverview = createAsyncThunk(
  'dashboard/fetchDashboardOverview',
  async (_, { rejectWithValue }) => {
    try {
      const response = await API.get('/admin/dashboard-overview');
      return response.data;
    } catch (err) {
      return rejectWithValue(err?.response?.data?.error || 'Failed to load dashboard overview');
    }
  }
);

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState: {
    cards: null,
    incidentsClasswise: [],
    lineSeries: [],
    pieSeries: [],
    heatmapMatrix: [],
    incidentHeatPoints: [],
    riskZones: [],
    crowdMetrics: null,
    recentIncidents: [],
    recentUserReports: [],
    loading: false,
    error: null
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboardOverview.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDashboardOverview.fulfilled, (state, action) => {
        state.loading = false;
        state.cards = action.payload?.cards || null;
        state.incidentsClasswise = action.payload?.incidentsClasswise || [];
        state.lineSeries = action.payload?.lineSeries || [];
        state.pieSeries = action.payload?.pieSeries || [];
        state.heatmapMatrix = action.payload?.heatmapMatrix || [];
        state.incidentHeatPoints = action.payload?.incidentHeatPoints || [];
        state.riskZones = action.payload?.riskZones || [];
        state.crowdMetrics = action.payload?.crowdMetrics || null;
        state.recentIncidents = action.payload?.recentIncidents || [];
        state.recentUserReports = action.payload?.recentUserReports || [];
      })
      .addCase(fetchDashboardOverview.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export default dashboardSlice.reducer;
