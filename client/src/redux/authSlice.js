import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import API from '../services/api';

// Async Actions
export const loginOfficial = createAsyncThunk('auth/login', async (credentials, { rejectWithValue }) => {
  try {
    // Matches your Backend Controller: loginOfficial
    const response = await API.post('/auth/official/login', credentials);
    return response.data;
  } catch (err) {
    return rejectWithValue(err.response.data.error);
  }
});

export const registerTenant = createAsyncThunk('auth/register', async (data, { rejectWithValue }) => {
  try {
    // Matches your Backend Controller: registerTenant
    const response = await API.post('/auth/official/register-tenant', data);
    return response.data;
  } catch (err) {
    return rejectWithValue(err.response.data.error);
  }
});

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: JSON.parse(localStorage.getItem('user')) || null,
    token: localStorage.getItem('token') || null,
    loading: false,
    error: null,
  },
  reducers: {
    logout: (state) => {
      state.user = null;
      state.token = null;
      localStorage.clear();
    },
  },
  extraReducers: (builder) => {
    builder
      // Login Handlers
      .addCase(loginOfficial.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(loginOfficial.fulfilled, (state, action) => {
        state.loading = false;
        state.token = action.payload.token;
        state.user = action.payload.user;
        // Persist
        localStorage.setItem('token', action.payload.token);
        localStorage.setItem('user', JSON.stringify(action.payload.user));
      })
      .addCase(loginOfficial.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Register Handlers
      .addCase(registerTenant.fulfilled, (state) => {
        state.loading = false;
        // Auto-login logic can be added here if needed
      });
  },
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;