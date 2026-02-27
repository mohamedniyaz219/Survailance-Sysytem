import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import API from '../services/api';

function resolveStreamUrl(streamUrl) {
  if (!streamUrl) return '';
  if (/^https?:\/\//i.test(streamUrl)) return streamUrl;

  try {
    const base = API.defaults.baseURL || 'http://localhost:3000/api/v1';
    const backendOrigin = new URL(base).origin;
    return `${backendOrigin}${streamUrl}`;
  } catch {
    return streamUrl;
  }
}

export const fetchLiveWallOverview = createAsyncThunk(
  'liveWall/fetchLiveWallOverview',
  async ({ cameraId } = {}, { rejectWithValue }) => {
    try {
      const response = await API.get('/admin/live-wall', {
        params: cameraId ? { cameraId } : undefined
      });
      return response.data;
    } catch (err) {
      return rejectWithValue(err?.response?.data?.error || 'Failed to load live wall');
    }
  }
);

export const fetchLiveWallTimeline = createAsyncThunk(
  'liveWall/fetchLiveWallTimeline',
  async ({ cameraId }, { rejectWithValue }) => {
    try {
      const response = await API.get('/admin/live-wall/timeline', {
        params: { cameraId }
      });
      return response.data;
    } catch (err) {
      return rejectWithValue(err?.response?.data?.error || 'Failed to load camera timeline');
    }
  }
);

export const fetchLiveCameraStream = createAsyncThunk(
  'liveWall/fetchLiveCameraStream',
  async ({ cameraId }, { rejectWithValue }) => {
    try {
      const response = await API.get(`/admin/cameras/${cameraId}/stream`);
      return {
        cameraId,
        streamUrl: resolveStreamUrl(response?.data?.streamUrl)
      };
    } catch (err) {
      return rejectWithValue(err?.response?.data?.error || 'Failed to load camera stream');
    }
  }
);

const initialState = {
  cameras: [],
  feed: [],
  timeline: {
    ticks: [],
    clips: [],
    cards: [],
    nowLabel: ''
  },
  selectedCameraId: null,
  selectedFeedId: null,
  selectedEventFilter: 'all-events',
  streamUrl: '',
  loading: false,
  timelineLoading: false,
  streamLoading: false,
  error: null
};

const liveWallSlice = createSlice({
  name: 'liveWall',
  initialState,
  reducers: {
    setSelectedCamera(state, action) {
      state.selectedCameraId = action.payload;
      state.selectedFeedId = null;
      state.streamUrl = '';
      state.error = null;
    },
    setSelectedEventFilter(state, action) {
      state.selectedEventFilter = action.payload;
    },
    setSelectedFeedItem(state, action) {
      state.selectedFeedId = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchLiveWallOverview.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchLiveWallOverview.fulfilled, (state, action) => {
        state.loading = false;
        state.cameras = action.payload?.cameras || [];
        state.feed = action.payload?.feed || [];
        state.timeline = action.payload?.timeline || initialState.timeline;

        if (action.payload?.selectedCameraId) {
          state.selectedCameraId = action.payload.selectedCameraId;
        } else if (!state.selectedCameraId && state.cameras.length) {
          state.selectedCameraId = state.cameras[0].id;
        }
      })
      .addCase(fetchLiveWallOverview.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchLiveWallTimeline.pending, (state) => {
        state.timelineLoading = true;
        state.error = null;
      })
      .addCase(fetchLiveWallTimeline.fulfilled, (state, action) => {
        state.timelineLoading = false;
        state.timeline = action.payload?.timeline || initialState.timeline;
      })
      .addCase(fetchLiveWallTimeline.rejected, (state, action) => {
        state.timelineLoading = false;
        state.error = action.payload;
      })
      .addCase(fetchLiveCameraStream.pending, (state) => {
        state.streamLoading = true;
        state.error = null;
      })
      .addCase(fetchLiveCameraStream.fulfilled, (state, action) => {
        state.streamLoading = false;
        state.streamUrl = action.payload?.streamUrl || '';
      })
      .addCase(fetchLiveCameraStream.rejected, (state, action) => {
        state.streamLoading = false;
        state.error = action.payload;
      });
  }
});

export const {
  setSelectedCamera,
  setSelectedEventFilter,
  setSelectedFeedItem
} = liveWallSlice.actions;

export default liveWallSlice.reducer;
