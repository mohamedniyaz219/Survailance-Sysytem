import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import API from '../services/api';

const defaultPagination = {
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 1
};

export const fetchCameras = createAsyncThunk(
  'cameras/fetchCameras',
  async ({ page = 1, limit = 10, search = '', status = '' } = {}, { rejectWithValue }) => {
    try {
      const response = await API.get('/admin/cameras', {
        params: { page, limit, search, status }
      });
      return response.data;
    } catch (err) {
      return rejectWithValue(err?.response?.data?.error || 'Failed to fetch cameras');
    }
  }
);

export const fetchCameraZoneOptions = createAsyncThunk(
  'cameras/fetchCameraZoneOptions',
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

export const createCamera = createAsyncThunk(
  'cameras/createCamera',
  async (payload, { rejectWithValue, dispatch, getState }) => {
    try {
      await API.post('/admin/cameras', payload);
      const { page, limit, search, status } = getState().cameras;
      dispatch(fetchCameras({ page, limit, search, status }));
    } catch (err) {
      return rejectWithValue(err?.response?.data?.error || 'Failed to create camera');
    }
  }
);

export const updateCamera = createAsyncThunk(
  'cameras/updateCamera',
  async ({ id, data }, { rejectWithValue, dispatch, getState }) => {
    try {
      await API.patch(`/admin/cameras/${id}`, data);
      const { page, limit, search, status } = getState().cameras;
      dispatch(fetchCameras({ page, limit, search, status }));
    } catch (err) {
      return rejectWithValue(err?.response?.data?.error || 'Failed to update camera');
    }
  }
);

export const deleteCamera = createAsyncThunk(
  'cameras/deleteCamera',
  async (id, { rejectWithValue, dispatch, getState }) => {
    try {
      await API.delete(`/admin/cameras/${id}`);
      const { page, limit, search, status } = getState().cameras;
      dispatch(fetchCameras({ page, limit, search, status }));
    } catch (err) {
      return rejectWithValue(err?.response?.data?.error || 'Failed to delete camera');
    }
  }
);

const camerasSlice = createSlice({
  name: 'cameras',
  initialState: {
    items: [],
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
    search: '',
    status: '',
    zoneOptions: [],
    zoneOptionsLoading: false,
    loading: false,
    actionLoading: false,
    error: null
  },
  reducers: {
    setCamerasPage(state, action) {
      state.page = action.payload;
    },
    setCamerasLimit(state, action) {
      state.limit = action.payload;
      state.page = 1;
    },
    setCamerasSearch(state, action) {
      state.search = action.payload;
      state.page = 1;
    },
    setCamerasStatus(state, action) {
      state.status = action.payload;
      state.page = 1;
    },
    clearCamerasError(state) {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCameras.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCameras.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload?.data || [];
        const pagination = action.payload?.pagination || defaultPagination;
        state.page = pagination.page;
        state.limit = pagination.limit;
        state.total = pagination.total;
        state.totalPages = pagination.totalPages;
      })
      .addCase(fetchCameras.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchCameraZoneOptions.pending, (state) => {
        state.zoneOptionsLoading = true;
      })
      .addCase(fetchCameraZoneOptions.fulfilled, (state, action) => {
        state.zoneOptionsLoading = false;
        state.zoneOptions = action.payload?.data || [];
      })
      .addCase(fetchCameraZoneOptions.rejected, (state, action) => {
        state.zoneOptionsLoading = false;
        state.error = action.payload;
      })
      .addCase(createCamera.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(createCamera.fulfilled, (state) => {
        state.actionLoading = false;
      })
      .addCase(createCamera.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })
      .addCase(updateCamera.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(updateCamera.fulfilled, (state) => {
        state.actionLoading = false;
      })
      .addCase(updateCamera.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })
      .addCase(deleteCamera.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(deleteCamera.fulfilled, (state) => {
        state.actionLoading = false;
      })
      .addCase(deleteCamera.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      });
  }
});

export const {
  setCamerasPage,
  setCamerasLimit,
  setCamerasSearch,
  setCamerasStatus,
  clearCamerasError
} = camerasSlice.actions;

export default camerasSlice.reducer;
