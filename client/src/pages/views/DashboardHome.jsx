import React, { useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  AlertTriangle,
  Camera,
  Flame,
  ShieldAlert,
  Users,
  Waves,
  Siren,
  Activity,
  PieChart,
  BarChart3
} from 'lucide-react';
import { fetchDashboardOverview } from '../../redux/dashboardSlice';

function Card({ title, value, icon: Icon, accent }) {
  return (
    <div className="rounded-xl border border-stone-brown-100 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-silver-500">{title}</p>
          <p className="mt-2 text-2xl font-bold text-stone-brown-900">{value}</p>
        </div>
        <div className={`rounded-lg p-2 ${accent}`}>
          <Icon size={16} />
        </div>
      </div>
    </div>
  );
}

function maxOf(list, key) {
  if (!list.length) return 0;
  return list.reduce((max, item) => Math.max(max, Number(item[key] || 0)), 0);
}

export default function DashboardHome() {
  const dispatch = useDispatch();
  const {
    cards,
    incidentsClasswise,
    lineSeries,
    pieSeries,
    heatmapMatrix,
    incidentHeatPoints,
    riskZones,
    crowdMetrics,
    recentIncidents,
    recentUserReports,
    loading,
    error
  } = useSelector((state) => state.dashboard);

  useEffect(() => {
    dispatch(fetchDashboardOverview());
  }, [dispatch]);

  const lineMax = useMemo(() => Math.max(maxOf(lineSeries, 'incidents'), maxOf(lineSeries, 'userReports'), 1), [lineSeries]);
  const pieTotal = useMemo(() => pieSeries.reduce((sum, item) => sum + Number(item.value || 0), 0), [pieSeries]);
  const heatMax = useMemo(() => {
    if (!heatmapMatrix.length) return 1;
    return Math.max(
      ...heatmapMatrix.flatMap((day) => day.hours.map((hour) => Number(hour.count || 0))),
      1
    );
  }, [heatmapMatrix]);

  const topClasses = incidentsClasswise.slice(0, 6);

  return (
    <div className="flex-1 overflow-y-auto bg-stone-brown-50 h-screen p-6">
      <div className="max-w-[1500px] mx-auto space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-stone-brown-900">Dashboard</h1>
            <p className="text-sm text-silver-500">Incidents, user reports, risk zones, crowd metrics and heat indicators</p>
          </div>
          <button
            type="button"
            onClick={() => dispatch(fetchDashboardOverview())}
            className="h-10 rounded-md border border-stone-brown-100 bg-white px-4 text-sm font-medium text-stone-brown-900"
          >
            Refresh
          </button>
        </div>

        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Card title="Total Incidents" value={cards?.totalIncidents ?? '-'} icon={AlertTriangle} accent="bg-red-50 text-red-700" />
          <Card title="Active Incidents" value={cards?.activeIncidents ?? '-'} icon={Siren} accent="bg-toasted-almond-50 text-toasted-almond-700" />
          <Card title="User Reports" value={cards?.totalReports ?? '-'} icon={Users} accent="bg-stone-brown-100 text-stone-brown-700" />
          <Card title="High Risk Zones" value={cards?.highRiskZones ?? '-'} icon={ShieldAlert} accent="bg-olive-wood-100 text-olive-wood-700" />
          <Card title="Online Cameras" value={cards?.cameraActive ?? '-'} icon={Camera} accent="bg-toasted-almond-50 text-toasted-almond-700" />
          <Card title="Active Responders" value={cards?.responderActive ?? '-'} icon={Users} accent="bg-olive-wood-100 text-olive-wood-700" />
          <Card title="Avg Crowd" value={cards?.crowdAveragePeople ?? '-'} icon={Waves} accent="bg-stone-brown-100 text-stone-brown-700" />
          <Card title="Peak Crowd" value={cards?.crowdPeakPeople ?? '-'} icon={Flame} accent="bg-red-50 text-red-700" />
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.35fr_1fr]">
          <div className="rounded-xl border border-stone-brown-100 bg-white p-4 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <Activity size={16} className="text-toasted-almond-600" />
              <h2 className="text-lg font-semibold text-stone-brown-900">Line Chart (7 Days)</h2>
            </div>
            <div className="grid grid-cols-7 gap-2 items-end h-44">
              {lineSeries.map((item) => {
                const incidentHeight = Math.max((Number(item.incidents || 0) / lineMax) * 100, 4);
                const reportHeight = Math.max((Number(item.userReports || 0) / lineMax) * 100, 4);
                return (
                  <div key={item.date} className="flex flex-col items-center gap-1">
                    <div className="flex items-end gap-1 h-32">
                      <div className="w-3 rounded-sm bg-toasted-almond-500" style={{ height: `${incidentHeight}%` }} />
                      <div className="w-3 rounded-sm bg-stone-brown-900" style={{ height: `${reportHeight}%` }} />
                    </div>
                    <span className="text-[10px] text-silver-500">{item.date.slice(5)}</span>
                  </div>
                );
              })}
            </div>
            <div className="mt-3 flex gap-4 text-xs text-silver-500">
              <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-toasted-almond-500" />Incidents</span>
              <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-stone-brown-900" />User Reports</span>
            </div>
          </div>

          <div className="rounded-xl border border-stone-brown-100 bg-white p-4 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <PieChart size={16} className="text-toasted-almond-600" />
              <h2 className="text-lg font-semibold text-stone-brown-900">Pie Chart (Incident Classes)</h2>
            </div>
            <div className="space-y-2">
              {pieSeries.slice(0, 8).map((item) => {
                const width = pieTotal ? (Number(item.value || 0) / pieTotal) * 100 : 0;
                return (
                  <div key={item.label}>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="text-stone-brown-900 font-medium capitalize">{item.label}</span>
                      <span className="text-silver-500">{item.value}</span>
                    </div>
                    <div className="h-2 rounded-full bg-stone-brown-100">
                      <div className="h-2 rounded-full bg-toasted-almond-500" style={{ width: `${width}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.1fr_1fr_1fr]">
          <div className="rounded-xl border border-stone-brown-100 bg-white p-4 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <BarChart3 size={16} className="text-toasted-almond-600" />
              <h2 className="text-lg font-semibold text-stone-brown-900">Classwise Incident Cards</h2>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {topClasses.map((item) => (
                <div key={item.label} className="rounded-lg border border-stone-brown-100 p-3">
                  <p className="text-xs text-silver-500 capitalize">{item.label}</p>
                  <p className="mt-1 text-xl font-bold text-stone-brown-900">{item.value}</p>
                </div>
              ))}
              {!topClasses.length && <p className="text-sm text-silver-500">No incident classes yet.</p>}
            </div>
          </div>

          <div className="rounded-xl border border-stone-brown-100 bg-white p-4 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-stone-brown-900">Risk Zones</h2>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {riskZones.slice(0, 12).map((zone) => (
                <div key={zone.id} className="rounded-lg border border-stone-brown-100 p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-stone-brown-900">{zone.zone_name}</p>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${zone.risk_score >= 70 ? 'bg-red-100 text-red-700' : 'bg-olive-wood-100 text-olive-wood-700'}`}>
                      {zone.risk_score}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-silver-500">{zone.risk_factor}</p>
                </div>
              ))}
              {!riskZones.length && <p className="text-sm text-silver-500">No risk zones calculated yet.</p>}
            </div>
          </div>

          <div className="rounded-xl border border-stone-brown-100 bg-white p-4 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-stone-brown-900">User Reports</h2>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {recentUserReports.map((item) => (
                <div key={item.id} className="rounded-lg border border-stone-brown-100 p-3">
                  <p className="text-sm font-semibold text-stone-brown-900 capitalize">{item.incident_type}</p>
                  <p className="text-xs text-silver-500">{item.location_name || '-'}</p>
                  <div className="mt-1 text-xs text-silver-500">{new Date(item.createdAt).toLocaleString()}</div>
                </div>
              ))}
              {!recentUserReports.length && <p className="text-sm text-silver-500">No user reports available.</p>}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.4fr_1fr]">
          <div className="rounded-xl border border-stone-brown-100 bg-white p-4 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-stone-brown-900">Heatmap (Incidents by Day & Hour)</h2>
            <div className="overflow-x-auto">
              <div className="min-w-[780px] space-y-1">
                {heatmapMatrix.map((day) => (
                  <div key={day.day} className="grid grid-cols-[42px_repeat(24,minmax(0,1fr))] gap-1 items-center">
                    <span className="text-[11px] text-silver-500">{day.day}</span>
                    {day.hours.map((hour) => {
                      const intensity = Number(hour.count || 0) / heatMax;
                      const alpha = 0.1 + intensity * 0.9;
                      return (
                        <div
                          key={`${day.day}-${hour.hour}`}
                          title={`${day.day} ${String(hour.hour).padStart(2, '0')}:00 • ${hour.count}`}
                          className="h-4 rounded"
                          style={{ backgroundColor: `rgba(194, 121, 61, ${alpha})` }}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-stone-brown-100 bg-white p-4 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-stone-brown-900">Incident Heat Points</h2>
            <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto">
              {incidentHeatPoints.slice(0, 90).map((point, index) => (
                <div key={`${point.lat}-${point.lng}-${index}`} className="rounded-md border border-stone-brown-100 p-2">
                  <p className="text-[10px] text-silver-500 capitalize">{point.class}</p>
                  <p className="text-xs text-stone-brown-900">{point.lat.toFixed(2)}, {point.lng.toFixed(2)}</p>
                  <p className="text-[10px] text-toasted-almond-700">Severity {point.severity}</p>
                </div>
              ))}
              {!incidentHeatPoints.length && <p className="text-sm text-silver-500 col-span-3">No heat points available.</p>}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <div className="rounded-xl border border-stone-brown-100 bg-white p-4 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-stone-brown-900">Recent Incidents</h2>
            <div className="space-y-2 max-h-56 overflow-y-auto">
              {recentIncidents.map((item) => (
                <div key={item.id} className="rounded-lg border border-stone-brown-100 p-3">
                  <p className="text-sm font-semibold text-stone-brown-900 capitalize">{item.detected_class || item.type}</p>
                  <p className="text-xs text-silver-500">{item.description || '-'}</p>
                  <p className="mt-1 text-xs text-silver-500">{new Date(item.createdAt).toLocaleString()}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-stone-brown-100 bg-white p-4 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-stone-brown-900">Crowd Metrics</h2>
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-lg border border-stone-brown-100 p-3">
                <p className="text-xs text-silver-500">Average</p>
                <p className="text-xl font-bold text-stone-brown-900">{crowdMetrics?.averagePeople ?? '-'}</p>
              </div>
              <div className="rounded-lg border border-stone-brown-100 p-3">
                <p className="text-xs text-silver-500">Peak</p>
                <p className="text-xl font-bold text-stone-brown-900">{crowdMetrics?.peakPeople ?? '-'}</p>
              </div>
              <div className="rounded-lg border border-stone-brown-100 p-3">
                <p className="text-xs text-silver-500">Samples</p>
                <p className="text-xl font-bold text-stone-brown-900">{crowdMetrics?.totalSamples ?? '-'}</p>
              </div>
            </div>
          </div>
        </div>

        {loading && <p className="text-sm text-silver-500">Loading dashboard...</p>}
      </div>
    </div>
  );
}