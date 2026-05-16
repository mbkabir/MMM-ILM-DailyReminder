/* MagicMirror - Node Helper: MMM-ILM-DailyReminder (CommonJS, Node 18+ global fetch) */

const NodeHelper = require("node_helper");

async function fetchReminder(apiUrl) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const res = await fetch(apiUrl, {
      headers: { Accept: "application/json, text/plain, */*" },
      signal: controller.signal
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();
    try { return JSON.parse(text); } catch { return text; }
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchWithRetry(apiUrl, attempts = 3) {
  let lastErr;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fetchReminder(apiUrl);
    } catch (err) {
      lastErr = err;
      await new Promise(r => setTimeout(r, 500 * (i + 1))); // 500ms, 1000ms, 1500ms
    }
  }
  throw lastErr;
}

module.exports = NodeHelper.create({
  start: function () {
    console.log("Starting node helper for: " + this.name);
  },

  socketNotificationReceived: function (notification, payload) {
    if (notification === 'DAILY_REMINDER_FETCH') {
      const apiUrl = (payload && payload.apiUrl) || 'https://reminder.dev/api/daily';
      fetchWithRetry(apiUrl, 3)
        .then(data => this.sendSocketNotification('DAILY_REMINDER_DATA', data))
        .catch(err => this.sendSocketNotification('DAILY_REMINDER_ERROR', { message: String(err && err.message ? err.message : err) }));
    }
  }
});
