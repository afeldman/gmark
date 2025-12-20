/**
 * GMARK Local - Modern Popup with Live Charts
 */

import StorageManager from "../utils/storage.js";

class PopupApp {
  constructor() {
    this.charts = {};
    this.refreshInterval = null;
    this.activityData = [];
  }

  async init() {
    this.showLoading();
    try {
      await this.loadData();
      this.initCharts();
      this.attachEventListeners();
      this.startLiveUpdates();
      this.showView("main");
    } catch (error) {
      console.error("Init error:", error);
      this.showError(error.message);
    }
  }

  showLoading() {
    document.getElementById("loading").classList.remove("hidden");
    document.getElementById("main-view").classList.add("hidden");
  }

  hideLoading() {
    document.getElementById("loading").classList.add("hidden");
    document.getElementById("main-view").classList.remove("hidden");
  }

  showView(view) {
    document.querySelectorAll(".state").forEach((el) => {
      el.classList.add("hidden");
    });
    document.getElementById(`${view}-view`).classList.remove("hidden");
  }

  async loadData() {
    const stats = await StorageManager.getStatistics();
    const bookmarks = await StorageManager.getAllBookmarks();

    // Update hero stats
    document.getElementById("stat-bookmarks").textContent = stats.totalBookmarks || 0;
    document.getElementById("stat-categories").textContent = stats.categoriesCount || 0;
    document.getElementById("stat-duplicates").textContent = stats.totalDuplicates || 0;

    // Calculate bookmark trend (last 7 days)
    const trend = this.calculateTrend(bookmarks);
    const trendEl = document.getElementById("bookmarks-trend");
    if (trend > 0) {
      trendEl.className = "stat-trend positive";
      trendEl.querySelector("span").textContent = `+${trend}`;
    } else if (trend < 0) {
      trendEl.className = "stat-trend negative";
      trendEl.querySelector("span").textContent = trend;
    } else {
      trendEl.style.display = "none";
    }

    // Load recent activity
    await this.loadRecentActivity(bookmarks);

    // Prepare chart data
    this.activityData = this.prepareActivityData(bookmarks);
    this.categoryData = this.prepareCategoryData(stats);

    this.hideLoading();
  }

  calculateTrend(bookmarks) {
    const now = Date.now();
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
    const recentBookmarks = bookmarks.filter(
      (b) => b.createdAt && b.createdAt > sevenDaysAgo
    );
    return recentBookmarks.length;
  }

  prepareActivityData(bookmarks) {
    const last7Days = [];
    const now = new Date();

    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const count = bookmarks.filter((b) => {
        if (!b.createdAt) return false;
        const bookmarkDate = new Date(b.createdAt);
        return bookmarkDate >= date && bookmarkDate < nextDate;
      }).length;

      last7Days.push({
        label: date.toLocaleDateString("de-DE", { weekday: "short" }),
        value: count,
      });
    }

    return last7Days;
  }

  prepareCategoryData(stats) {
    const categories = stats.categoriesDistribution || {};
    const sorted = Object.entries(categories)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);

    return {
      labels: sorted.map(([cat]) => cat),
      values: sorted.map(([, count]) => count),
    };
  }

  initCharts() {
    // Activity Line Chart
    const activityCtx = document.getElementById("activityChart").getContext("2d");
    this.charts.activity = new Chart(activityCtx, {
      type: "line",
      data: {
        labels: this.activityData.map((d) => d.label),
        datasets: [
          {
            label: "Bookmarks",
            data: this.activityData.map((d) => d.value),
            borderColor: "#6366f1",
            backgroundColor: "rgba(99, 102, 241, 0.1)",
            fill: true,
            tension: 0.4,
            pointRadius: 4,
            pointBackgroundColor: "#6366f1",
            pointBorderColor: "#fff",
            pointBorderWidth: 2,
            pointHoverRadius: 6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            backgroundColor: "#1e293b",
            titleColor: "#f1f5f9",
            bodyColor: "#94a3b8",
            borderColor: "#334155",
            borderWidth: 1,
            padding: 12,
            displayColors: false,
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              color: "#64748b",
              font: { size: 11 },
              stepSize: 1,
            },
            grid: {
              color: "#334155",
              drawBorder: false,
            },
          },
          x: {
            ticks: {
              color: "#64748b",
              font: { size: 11 },
            },
            grid: {
              display: false,
            },
          },
        },
      },
    });

    // Category Doughnut Chart
    const categoryCtx = document.getElementById("categoryChart").getContext("2d");
    this.charts.category = new Chart(categoryCtx, {
      type: "doughnut",
      data: {
        labels: this.categoryData.labels,
        datasets: [
          {
            data: this.categoryData.values,
            backgroundColor: [
              "#6366f1",
              "#8b5cf6",
              "#ec4899",
              "#f59e0b",
              "#10b981",
            ],
            borderWidth: 0,
            hoverOffset: 8,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "right",
            labels: {
              color: "#94a3b8",
              font: { size: 11 },
              padding: 12,
              usePointStyle: true,
              pointStyle: "circle",
            },
          },
          tooltip: {
            backgroundColor: "#1e293b",
            titleColor: "#f1f5f9",
            bodyColor: "#94a3b8",
            borderColor: "#334155",
            borderWidth: 1,
            padding: 12,
          },
        },
        cutout: "70%",
      },
    });
  }

  async loadRecentActivity(bookmarks) {
    const recent = bookmarks
      .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
      .slice(0, 5);

    const list = document.getElementById("recent-list");
    list.innerHTML = "";

    if (recent.length === 0) {
      list.innerHTML = `
        <div style="text-align: center; padding: 40px; color: var(--text-secondary);">
          <div style="font-size: 48px; margin-bottom: 12px; opacity: 0.5;">📚</div>
          <p>Noch keine Bookmarks</p>
        </div>
      `;
      return;
    }

    for (const bookmark of recent) {
      const timeAgo = this.formatTimeAgo(bookmark.createdAt);
      const item = document.createElement("div");
      item.className = "activity-item";
      item.innerHTML = `
        <div class="activity-icon">${this.getCategoryIcon(bookmark.category)}</div>
        <div class="activity-content">
          <div class="activity-title">${this.escapeHtml(bookmark.title)}</div>
          <div class="activity-meta">
            <span class="activity-badge">${bookmark.category}</span>
            <span>${timeAgo}</span>
          </div>
        </div>
      `;

      item.addEventListener("click", () => {
        chrome.tabs.create({ url: bookmark.url });
      });

      list.appendChild(item);
    }
  }

  getCategoryIcon(category) {
    const icons = {
      Development: "💻",
      Social: "👥",
      News: "📰",
      Shopping: "🛒",
      Education: "📚",
      Entertainment: "🎬",
      Documentation: "📖",
      Tools: "🔧",
      Other: "📌",
    };
    return icons[category] || "📌";
  }

  formatTimeAgo(timestamp) {
    if (!timestamp) return "Gerade eben";
    const seconds = Math.floor((Date.now() - timestamp) / 1000);

    if (seconds < 60) return "Gerade eben";
    if (seconds < 3600) return `vor ${Math.floor(seconds / 60)}m`;
    if (seconds < 86400) return `vor ${Math.floor(seconds / 3600)}h`;
    return `vor ${Math.floor(seconds / 86400)}d`;
  }

  startLiveUpdates() {
    // Refresh every 30 seconds
    this.refreshInterval = setInterval(async () => {
      await this.updateStats();
    }, 30000);
  }

  async updateStats() {
    const stats = await StorageManager.getStatistics();
    const bookmarks = await StorageManager.getAllBookmarks();

    // Animate number changes
    this.animateValue("stat-bookmarks", stats.totalBookmarks || 0);
    this.animateValue("stat-categories", stats.categoriesCount || 0);
    this.animateValue("stat-duplicates", stats.totalDuplicates || 0);

    // Update charts
    const newActivityData = this.prepareActivityData(bookmarks);
    this.charts.activity.data.datasets[0].data = newActivityData.map((d) => d.value);
    this.charts.activity.update("none");

    const newCategoryData = this.prepareCategoryData(stats);
    this.charts.category.data.labels = newCategoryData.labels;
    this.charts.category.data.datasets[0].data = newCategoryData.values;
    this.charts.category.update("none");
  }

  animateValue(id, newValue) {
    const el = document.getElementById(id);
    const currentValue = parseInt(el.textContent) || 0;

    if (currentValue === newValue) return;

    const duration = 500;
    const steps = 20;
    const stepValue = (newValue - currentValue) / steps;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      const value = Math.round(currentValue + stepValue * currentStep);
      el.textContent = value;

      if (currentStep >= steps) {
        el.textContent = newValue;
        clearInterval(timer);
      }
    }, duration / steps);
  }

  attachEventListeners() {
    // Menu toggle
    document.getElementById("menu-btn").addEventListener("click", () => {
      document.getElementById("menu").classList.toggle("hidden");
    });

    document.getElementById("menu-close")?.addEventListener("click", () => {
      document.getElementById("menu").classList.add("hidden");
    });

    // Save current page
    document.getElementById("save-current").addEventListener("click", async () => {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      chrome.runtime.sendMessage({
        type: "SAVE_BOOKMARK",
        url: tab.url,
        title: tab.title,
      });
      setTimeout(() => this.loadData(), 500);
    });

    // Open dashboard
    document.getElementById("view-dashboard").addEventListener("click", () => {
      chrome.tabs.create({ url: chrome.runtime.getURL("src/ui/dashboard.html") });
    });

    // Manage duplicates
    document.getElementById("manage-duplicates")?.addEventListener("click", () => {
      chrome.tabs.create({ url: chrome.runtime.getURL("src/ui/duplicates.html") });
    });

    // Settings
    document.getElementById("menu-settings")?.addEventListener("click", () => {
      chrome.runtime.openOptionsPage();
    });

    // Export
    document.getElementById("menu-export")?.addEventListener("click", async () => {
      const bookmarks = await StorageManager.getAllBookmarks();
      const dataStr = JSON.stringify(bookmarks, null, 2);
      const blob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `gmark-export-${Date.now()}.json`;
      a.click();
    });
  }

  escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  showError(message) {
    console.error("Error:", message);
  }

  destroy() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
    Object.values(this.charts).forEach((chart) => chart.destroy());
  }
}

// Initialize app
const app = new PopupApp();
document.addEventListener("DOMContentLoaded", () => app.init());

// Cleanup on unload
window.addEventListener("beforeunload", () => app.destroy());
