/* global Module, Log, DOMPurify */

Module.register("MMM-ILM-DailyReminder", {
  defaults: {
    apiUrl: "https://reminder.dev/api/daily",
    updateInterval: 60 * 60 * 1000,
    animationSpeed: 2 * 1000,
    initialLoadDelay: 1000,
    maxWidth: "100%",
    headerText: "Daily Reminder",
    showHeader: false,
    fontSize: "14px",
    emptyText: "Waiting for reminder...",
    errorText: "Unable to load reminder."
  },
  requiresVersion: "2.1.0",
  getScripts() { 
	return [
		//"purify.min.js", //source: https://github.com/cure53/dompurify
		this.file('node_modules/dompurify/dist/purify.min.js')
		]; 
	},
  getStyles() { return ["MMM-ILM-DailyReminder.css"]; },

  start() {
    this.loaded = false;
    this.error = null;
    this.reminder = null;
    setTimeout(() => this.getReminder(), this.config.initialLoadDelay);
    this.scheduleUpdate();
  },

  scheduleUpdate() {
    clearInterval(this.updateTimer);
    this.updateTimer = setInterval(() => this.getReminder(), this.config.updateInterval);
  },

  getDom() {
    const wrapper = document.createElement("div");
    wrapper.className = "MMM-ILM-DailyReminder";
    wrapper.style.maxWidth = this.config.maxWidth;

    if (this.config.showHeader) {
      const header = document.createElement("div");
      header.className = "small light dimmed header";
      header.innerText = this.config.headerText;
      wrapper.appendChild(header);
    }

    const content = document.createElement("div");
    content.className = "small bright reminder-text";
    content.style.fontSize = this.config.fontSize;

    if (this.error) {
      content.classList.add("error");
      content.innerText = this.config.errorText;
    } else if (!this.loaded) {
      content.className = "small light dimmed";
      content.innerText = this.config.emptyText;
    } else {
      const data = this.reminder || {};
      const html = `
        <div class="meta">
			<table>
			<tr>
				<td><span class="label">Name:</span> ${data.name||'-'}</td>
				<td><span class="label">Hadith:</span> ${data.hadith||'-'}</td>
			</tr>
			<tr>
				<td><span class="label">Qur'an Verse:</span> ${data.verse||'-'}</td>
				<td><span class="label">Reflection:</span> ${data.message||'-'}</td>
			</tr>
			<tr>
				<td><span class="label">Hijri Date:</span> ${data.hijri||'-'}</td>
				<td><span class="label">Updated:</span> ${data.updated||'-'}</td>
			</tr>
			</table>
		</div>`;
		
		//console.log(html)
		try {
			content.innerHTML = DOMPurify.sanitize(html);
			Log.info(`html is loaded with DOMPurify and is sanitized.`);
		} catch (error) {
			Log.info(`html is not sanitized, run npm install to load html with DOMPurify.`);
			content.innerHTML = html;
		}     
    }
    wrapper.appendChild(content);
    return wrapper;
  },

  getReminder() { 
	this.sendSocketNotification("DAILY_REMINDER_FETCH", { 
		apiUrl: this.config.apiUrl 
	}); 
  },

  socketNotificationReceived(notification, payload) {
    if (notification === "DAILY_REMINDER_DATA") { 
		this.reminder = payload; 
		this.loaded = true; 
		this.error = null; 
		this.updateDom(); 
	}
    if (notification === "DAILY_REMINDER_ERROR") { 
		this.error = payload?.message; 
		this.loaded = true; 
		this.updateDom(); 
	}
  }
});