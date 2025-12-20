import { SimpleChart } from "../utils/simple-charts.js";
import { StorageManager } from "../services/storage.js";
import { Logger } from "../services/logger.js";

class Dashboard {
  constructor() {
    this.storage = new StorageManager();
    this.logger = new Logger("Dashboard");
    this.charts = {};
    this.refreshInterval = null;
    this.countdownInterval = null;
    this.refreshSeconds = 30;

    this.init();
  }

  async init() {
    try {
      await this.loadData();
      this.initCharts();
      this.startAutoRefresh();
    } catch (error) {
      this.logger.error("Initialization failed:", error);
    }
  }

  async loadData() {
    try {
      // Load all bookmarks
      const bookmarks = await this.storage.getAllBookmarks();
      const categories = await this.storage.getCategories();

      // Calculate stats
      this.stats = this.calculateStats(bookmarks, categories);

      // Update header
      this.updateHeader(this.stats);

      // Load activity data (last 30 days)
      this.activityData = this.calculateActivityData(bookmarks, 30);

      // Load category distribution
      this.categoryData = this.calculateCategoryDistribution(bookmarks);

      // Load recent bookmarks (last 20)
      this.recentBookmarks = bookmarks
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 20);

      // Update UI
      this.updateTopCategories(this.categoryData);
      this.updateRecentBookmarks(this.recentBookmarks);
      this.updateAIStats(bookmarks);
      this.updateProviderStats(bookmarks);
    } catch (error) {
      this.logger.error("Failed to load data:", error);
    }
  }

  calculateStats(bookmarks, categories) {
    const today = new Date().setHours(0, 0, 0, 0);
    const todayBookmarks = bookmarks.filter(
      (b) => new Date(b.timestamp).setHours(0, 0, 0, 0) === today
    );

    return {
      total: bookmarks.length,
      categories: categories.length,
      today: todayBookmarks.length,
    };
  }

  calculateActivityData(bookmarks, days) {
    const data = [];
    const now = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);

      const count = bookmarks.filter((b) => {
        const bookmarkDate = new Date(b.timestamp);
        return bookmarkDate >= date && bookmarkDate < nextDay;
      }).length;

      data.push({
        label: i === 0 ? "Heute" : `${i}d`,
        value: count,
      });
    }

    return data;
  }

  calculateCategoryDistribution(bookmarks) {
    const distribution = {};

    bookmarks.forEach((bookmark) => {
      const category = bookmark.category || "Other";
      distribution[category] = (distribution[category] || 0) + 1;
    });

    const sorted = Object.entries(distribution)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 8);

    return {
      labels: sorted.map(([cat]) => cat),
      values: sorted.map(([, count]) => count),
      distribution,
    };
  }

  updateHeader(stats) {
    document.getElementById("total-bookmarks").textContent = stats.total;
    document.getElementById("total-categories").textContent = stats.categories;
    document.getElementById("today-bookmarks").textContent = stats.today;
  }

  initCharts() {
    // Activity Chart
    const activityCanvas = document.getElementById("activityChart");
    if (activityCanvas && this.activityData.length > 0) {
      this.charts.activity = new SimpleChart(activityCanvas, "line", {
        labels: this.activityData.map((d) => d.label),
        values: this.activityData.map((d) => d.value),
      });
    }

    // Category Chart
    const categoryCanvas = document.getElementById("categoryChart");
    if (categoryCanvas && this.categoryData) {
      this.charts.category = new SimpleChart(categoryCanvas, "doughnut", {
        labels: this.categoryData.labels,
        values: this.categoryData.values,
        colors: [
          "#6366f1",
          "#8b5cf6",
          "#ec4899",
          "#f59e0b",
          "#10b981",
          "#06b6d4",
          "#f43f5e",
          "#64748b",
        ],
      });
    }
  }

  updateTopCategories(categoryData) {
    const tbody = document.querySelector("#top-categories-table tbody");
    if (!tbody) return;

    tbody.innerHTML = "";
    const total = categoryData.values.reduce((sum, val) => sum + val, 0);

    categoryData.labels.forEach((category, index) => {
      const count = categoryData.values[index];
      const percentage = ((count / total) * 100).toFixed(1);

      const row = document.createElement("tr");
      row.innerHTML = `
        <td>
          <span class="category-badge" style="background: ${this.getCategoryColor(
            category
          )}20; color: ${this.getCategoryColor(category)}">
            ${category}
          </span>
        </td>
        <td><strong>${count}</strong></td>
        <td>
          ${percentage}%
          <div class="percentage-bar">
            <div class="percentage-fill" style="width: ${percentage}%"></div>
          </div>
        </td>
      `;
      tbody.appendChild(row);
    });
  }

  updateRecentBookmarks(bookmarks) {
    const container = document.getElementById("recent-bookmarks");
    if (!container) return;

    container.innerHTML = "";

    bookmarks.forEach((bookmark) => {
      const item = document.createElement("div");
      item.className = "bookmark-item";

      const categoryIcon = this.getCategoryIcon(bookmark.category);
      const timeAgo = this.getTimeAgo(bookmark.timestamp);
      const confidence = bookmark.confidence
        ? (bookmark.confidence * 100).toFixed(1)
        : "0.0";

      item.innerHTML = `
        <div class="bookmark-favicon">${categoryIcon}</div>
        <div class="bookmark-info">
          <div class="bookmark-title">${this.escapeHtml(bookmark.title)}</div>
          <div class="bookmark-meta">
            <span>${bookmark.category || "Other"}</span>
            <span>•</span>
            <span>${timeAgo}</span>
            ${
              bookmark.confidence
                ? `<span>•</span><span class="bookmark-confidence">${confidence}%</span>`
                : ""
            }
          </div>
        </div>
      `;

      container.appendChild(item);
    });
  }

  updateAIStats(bookmarks) {
    let totalConfidence = 0;
    let aiCount = 0;
    let patternCount = 0;

    bookmarks.forEach((bookmark) => {
      if (bookmark.confidence) {
        totalConfidence += bookmark.confidence;
        aiCount++;
      }
      if (bookmark.method === "pattern") {
        patternCount++;
      }
    });

    const avgConfidence =
      aiCount > 0 ? (totalConfidence / aiCount).toFixed(5) : "0.00000";

    document.getElementById("avg-confidence").textContent = avgConfidence;
    document.getElementById("ai-classifications").textContent = aiCount;
    document.getElementById("pattern-matches").textContent = patternCount;
  }

  updateProviderStats(bookmarks) {
    const providers = {};

    bookmarks.forEach((bookmark) => {
      if (bookmark.provider) {
        providers[bookmark.provider] = (providers[bookmark.provider] || 0) + 1;
      }
    });

    const container = document.getElementById("provider-stats");
    if (!container) return;

    container.innerHTML = "";

    Object.entries(providers)
      .sort(([, a], [, b]) => b - a)
      .forEach(([provider, count]) => {
        const item = document.createElement("div");
        item.className = "provider-item";
        item.innerHTML = `
          <span class="provider-name">${provider}</span>
          <span class="provider-count">${count}</span>
        `;
        container.appendChild(item);
      });

    if (Object.keys(providers).length === 0) {
      container.innerHTML =
        '<p style="text-align: center; color: var(--text-muted);">Keine Provider-Daten</p>';
    }
  }

  getCategoryColor(category) {
    const colors = {
      Development: "#4f46e5",
      Social: "#ec4899",
      News: "#f59e0b",
      Shopping: "#10b981",
      Education: "#8b5cf6",
      Entertainment: "#f43f5e",
      Documentation: "#06b6d4",
      Tools: "#64748b",
      Other: "#6b7280",
    };
    return colors[category] || "#6b7280";
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

  getTimeAgo(timestamp) {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Gerade eben";
    if (minutes < 60) return `vor ${minutes}m`;
    if (hours < 24) return `vor ${hours}h`;
    return `vor ${days}d`;
  }

  escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  startAutoRefresh() {
    // Countdown
    let countdown = this.refreshSeconds;
    const countdownElement = document.getElementById("refresh-countdown");

    this.countdownInterval = setInterval(() => {
      countdown--;
      if (countdownElement) {
        countdownElement.textContent = countdown;
      }
      if (countdown <= 0) {
        countdown = this.refreshSeconds;
      }
    }, 1000);

    // Refresh data
    this.refreshInterval = setInterval(async () => {
      await this.loadData();
      if (this.charts.activity) {
        this.charts.activity.update({
          labels: this.activityData.map((d) => d.label),
          values: this.activityData.map((d) => d.value),
        });
      }
      if (this.charts.category) {
        this.charts.category.update({
          labels: this.categoryData.labels,
          values: this.categoryData.values,
        });
      }
    }, this.refreshSeconds * 1000);
  }

  destroy() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
    Object.values(this.charts).forEach((chart) => chart.destroy());
  }
}

// Initialize dashboard
const dashboard = new Dashboard();

// Cleanup on unload
window.addEventListener("beforeunload", () => {
  dashboard.destroy();
});
