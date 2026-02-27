import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import API from '../services/api';

export const fetchMapOverview = createAsyncThunk(
  'mapView/fetchMapOverview',
  async (_, { rejectWithValue }) => {
    try {
      const response = await API.get('/admin/map-overview');
      return response.data;
    } catch (err) {
      return rejectWithValue(err?.response?.data?.error || 'Failed to load map overview');
    }
  }
);

const mapViewSlice = createSlice({
  name: 'mapView',
  initialState: {
    stats: {
      totalCameras: 0,
      activeCameras: 0,
      openIncidents: 0,
      highRiskZones: 0,
      trackedResponders: 0
    },
    points: [],
    bounds: {
      minLat: null,
      maxLat: null,
      minLng: null,
      maxLng: null
    },
    loading: false,
    error: null
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchMapOverview.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMapOverview.fulfilled, (state, action) => {
        state.loading = false;
        state.stats = action.payload?.stats || state.stats;
        state.points = action.payload?.points || [];
        state.bounds = action.payload?.bounds || state.bounds;
      })
      .addCase(fetchMapOverview.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export default mapViewSlice.reducer;
