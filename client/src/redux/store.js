import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import respondersReducer from './respondersSlice';
import mapViewReducer from './mapViewSlice';
import zonesReducer from './zonesSlice';
import camerasReducer from './camerasSlice';
import liveWallReducer from './liveWallSlice';
import aiModelsReducer from './aiModelsSlice';
import eventsReducer from './eventsSlice';
import userReportsReducer from './userReportsSlice';
import incidentsReducer from './incidentsSlice';
import dashboardReducer from './dashboardSlice';
import anomalyRulesReducer from './anomalyRulesSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    responders: respondersReducer,
    liveWall: liveWallReducer,
    aiModels: aiModelsReducer,
    events: eventsReducer,
    userReports: userReportsReducer,
    incidents: incidentsReducer,
    dashboard: dashboardReducer,
    anomalyRules: anomalyRulesReducer,
    mapView: mapViewReducer,
    zones: zonesReducer,
    cameras: camerasReducer,
  },
});