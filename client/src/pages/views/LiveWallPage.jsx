import React, { useEffect, useMemo } from 'react';
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Filter,
  ListFilter,
  Maximize,
  Pause,
  Play,
  Volume2
} from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchLiveCameraStream,
  fetchLiveWallOverview,
  fetchLiveWallTimeline,
  setSelectedCamera,
  setSelectedFeedItem
} from '../../redux/liveWallSlice';

function clipCountLabel(count) {
  return `${count} clip${count === 1 ? '' : 's'}`;
}

function formatFeedDate(value) {
  const date = new Date(value);
  return {
    day: date.toLocaleDateString('en-GB', { weekday: 'short' }),
    date: date.toLocaleDateString('en-GB', { day: '2-digit' })
  };
}

export default function LiveWallPage() {
  const dispatch = useDispatch();
  const {
    cameras,
    feed,
    timeline,
    selectedCameraId,
    selectedFeedId,
    streamUrl,
    loading,
    timelineLoading,
    streamLoading,
    error
  } = useSelector((state) => state.liveWall);

  useEffect(() => {
    dispatch(fetchLiveWallOverview());
  }, [dispatch]);

  useEffect(() => {
    if (!selectedCameraId) return;
    dispatch(fetchLiveWallTimeline({ cameraId: selectedCameraId }));
    dispatch(fetchLiveCameraStream({ cameraId: selectedCameraId }));
  }, [dispatch, selectedCameraId]);

  const activeCamera = useMemo(
    () => cameras.find((camera) => camera.id === selectedCameraId) || null,
    [cameras, selectedCameraId]
  );

  const filteredFeed = useMemo(() => {
    return feed.filter((item) => {
      const byCamera = !selectedCameraId || item.cameraId === selectedCameraId;
      return byCamera;
    });
  }, [feed, selectedCameraId]);

  const feedDays = useMemo(() => {
    const source = filteredFeed.length ? filteredFeed : feed;
    const unique = new Map();
    source.slice(0, 7).forEach((item) => {
      const key = new Date(item.timestamp).toDateString();
      if (!unique.has(key)) {
        unique.set(key, formatFeedDate(item.timestamp));
      }
    });
    return Array.from(unique.values());
  }, [feed, filteredFeed]);

  const handlePrevCamera = () => {
    if (!cameras.length || !selectedCameraId) return;
    const index = cameras.findIndex((camera) => camera.id === selectedCameraId);
    const prevIndex = index <= 0 ? cameras.length - 1 : index - 1;
    dispatch(setSelectedCamera(cameras[prevIndex].id));
  };

  const handleNextCamera = () => {
    if (!cameras.length || !selectedCameraId) return;
    const index = cameras.findIndex((camera) => camera.id === selectedCameraId);
    const nextIndex = index >= cameras.length - 1 ? 0 : index + 1;
    dispatch(setSelectedCamera(cameras[nextIndex].id));
  };

  return (
    <div className="flex-1 h-full min-h-0 overflow-hidden bg-stone-brown-50 p-4">
      <div className="h-full min-h-0 mx-auto max-w-[1500px] rounded-2xl border border-stone-brown-100 bg-white p-4 shadow-sm overflow-hidden">
        <div className="grid h-full min-h-0 grid-cols-[minmax(0,1fr)_320px] gap-4 overflow-hidden">
          <div className="min-w-0 h-full min-h-0">
            <div className="h-full min-h-0 overflow-y-auto rounded-2xl bg-stone-brown-50 p-3 border border-stone-brown-100">
              <div className="mb-3 flex items-center justify-between text-sm text-stone-brown-900">
                <div className="flex items-center gap-2">
                  <ChevronLeft size={15} />
                  <span>Home</span>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={handlePrevCamera} className="hover:text-black"><ChevronLeft size={16} /></button>
                  <span className="font-medium">{activeCamera?.name || 'Next Device'}</span>
                  <button onClick={handleNextCamera} className="hover:text-black"><ChevronRight size={16} /></button>
                </div>
              </div>

              <div className="h-[410px] min-h-[260px] rounded-2xl bg-black overflow-hidden relative">
                {streamLoading ? (
                  <div className="absolute inset-0 grid place-items-center text-white/80 text-sm">Loading stream...</div>
                ) : streamUrl ? (
                  <video
                    key={streamUrl}
                    src={streamUrl}
                    controls
                    autoPlay
                    muted
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-stone-brown-900 via-stone-brown-700 to-stone-brown-500 grid place-items-center text-white/80 text-sm">
                    No active stream available
                  </div>
                )}

                <div className="absolute left-4 bottom-12 text-white text-sm drop-shadow">
                  <div className="font-semibold">{activeCamera?.name || 'Camera'}</div>
                  <div className="text-xs opacity-90">{activeCamera?.locationName || activeCamera?.zoneName || 'Live feed'}</div>
                </div>

                <div className="absolute bottom-3 inset-x-4 flex items-center justify-between text-white/95 text-sm">
                  <div className="flex items-center gap-3">
                    <button className="hover:text-white"><Volume2 size={17} /></button>
                    <span className="text-xs">01:03 / 02:08</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <button className="hover:text-white"><Pause size={16} /></button>
                    <button className="hover:text-white"><Play size={16} /></button>
                    <button className="hover:text-white"><Maximize size={16} /></button>
                  </div>
                </div>
              </div>

              <div className="mt-3 rounded-xl border border-stone-brown-100 bg-white p-3">
                <div className="mb-2 flex items-center justify-between text-sm">
                  <div className="flex items-center gap-1 font-medium text-stone-brown-900">
                    <span>Today</span>
                    <ChevronDown size={14} />
                  </div>
                  <div className="text-xs text-silver-500">Now: {timeline.nowLabel || '--:--'}</div>
                </div>

                <div className="relative rounded-lg border border-stone-brown-100 bg-stone-brown-50 p-2 overflow-x-auto overflow-y-hidden">
                  <div className="min-w-[900px]">
                    <div className="mb-2 grid grid-cols-6 text-[11px] text-silver-500">
                      {(timeline.ticks || []).slice(0, 6).map((tick) => (
                        <span key={`${tick.minute}-${tick.label}`}>{tick.label}</span>
                      ))}
                    </div>

                    <div className="relative h-[66px] rounded-md bg-white border border-stone-brown-100">
                      {(timeline.clips || []).map((clip) => {
                        const start = timeline.startMinute ?? 0;
                        const end = timeline.endMinute ?? start + 1;
                        const ratio = end === start ? 0 : (clip.minute - start) / (end - start);
                        const left = Math.max(0, Math.min(100, ratio * 100));

                        return (
                          <div
                            key={clip.id}
                            className="absolute top-2 h-10 w-[2px] bg-black/70"
                            style={{ left: `${left}%` }}
                            title={`${clip.title} • ${clip.time}`}
                          />
                        );
                      })}

                      <div className="pointer-events-none absolute inset-y-0 left-1/2 w-[2px] bg-toasted-almond-500" />
                    </div>

                    <div className="mt-3 flex gap-3 overflow-x-auto pb-1">
                      {(timeline.cards || []).length === 0 && (
                        <div className="text-xs text-silver-500 py-3">No timeline clips available for this camera yet.</div>
                      )}

                      {(timeline.cards || []).map((card) => (
                        <div
                          key={card.id}
                          className="w-[150px] shrink-0 rounded-xl border border-stone-brown-100 bg-white p-2"
                        >
                          <div className="h-16 rounded-lg bg-stone-brown-100 overflow-hidden">
                            {card.preview ? (
                              <img src={card.preview} alt={card.time} className="h-full w-full object-cover" />
                            ) : (
                              <div className="h-full w-full bg-gradient-to-br from-stone-brown-200 to-stone-brown-100" />
                            )}
                          </div>
                          <div className="mt-2 text-[11px] text-silver-500">{card.time}</div>
                          <div className="text-xs font-semibold text-stone-brown-900">{clipCountLabel(card.clipCount)}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {error && (
                <div className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {error}
                </div>
              )}
            </div>
          </div>

          <div className="min-w-0 h-full min-h-0 rounded-2xl bg-white p-4 shadow-sm flex flex-col overflow-hidden border border-stone-brown-100">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-stone-brown-900">Feed</h2>
              <div className="flex items-center gap-2 text-silver-500">
                <Filter size={16} />
                <ListFilter size={16} />
              </div>
            </div>

            <div className="mt-4 flex items-center gap-3 overflow-x-auto">
              {feedDays.map((item, index) => (
                <div
                  key={`${item.day}-${item.date}-${index}`}
                  className={`min-w-[42px] rounded-lg px-2 py-1 text-center ${
                    index === 0 ? 'bg-toasted-almond-500 text-white' : 'text-stone-brown-900'
                  }`}
                >
                  <div className="text-[10px] uppercase">{item.day}</div>
                  <div className="text-sm font-semibold">{item.date}</div>
                </div>
              ))}
            </div>

            <div className="mt-4 flex-1 min-h-0 overflow-y-auto pr-1 space-y-3">
              {loading && <div className="text-sm text-silver-500">Loading feed...</div>}

              {!loading && filteredFeed.length === 0 && (
                <div className="rounded-lg border border-stone-brown-100 p-3 text-sm text-silver-500">
                  No feed events for this camera/filter.
                </div>
              )}

              {filteredFeed.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    dispatch(setSelectedCamera(item.cameraId));
                    dispatch(setSelectedFeedItem(item.id));
                  }}
                  className={`w-full rounded-xl border p-2 text-left transition ${
                    selectedFeedId === item.id
                      ? 'border-toasted-almond-400 bg-toasted-almond-50'
                      : 'border-transparent hover:border-stone-brown-100 hover:bg-stone-brown-50'
                  }`}
                >
                  <div className="flex gap-2">
                    <div className="h-16 w-24 rounded-lg overflow-hidden bg-stone-brown-100 shrink-0">
                      {item.thumbnail ? (
                        <img src={item.thumbnail} alt={item.cameraName} className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full bg-gradient-to-br from-stone-brown-200 to-stone-brown-100" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-stone-brown-900 truncate">{item.cameraName}</div>
                      <div className="text-xs text-silver-500">{item.title}</div>
                      <div className="text-[11px] text-silver-400 mt-1">{item.timeLabel}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
