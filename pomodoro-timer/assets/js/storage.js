const Storage = (() => {
  const STORAGE_KEY = "pomodoro_daily_stats_v1";

  const readAll = () => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    } catch (error) {
      console.error("Storage read error", error);
      return {};
    }
  };

  const writeAll = (payload) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (error) {
      console.error("Storage write error", error);
    }
  };

  const todayKey = () => new Date().toLocaleDateString("fa-IR", { timeZone: "Asia/Tehran" });

  const getToday = () => {
    const all = readAll();
    const key = todayKey();
    return all[key] || { focusSessions: 0, focusMinutes: 0, breakMinutes: 0 };
  };

  const saveToday = (stats) => {
    const all = readAll();
    all[todayKey()] = stats;
    writeAll(all);
  };

  const updateToday = (mutator) => {
    const current = getToday();
    const updated = mutator({ ...current });
    saveToday(updated);
    return updated;
  };

  const clearAll = () => {
    writeAll({});
  };

  const history = (limit = 7) => {
    const entries = Object.entries(readAll())
      .sort(([a], [b]) => new Date(b) - new Date(a))
      .slice(0, limit);
    return entries.map(([date, stats]) => ({ date, ...stats }));
  };

  return {
    todayKey,
    getToday,
    saveToday,
    updateToday,
    history,
    clearAll,
  };
})();

