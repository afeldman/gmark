/**
 * Simple Charts - Lightweight chart library using Canvas API
 * No external dependencies, works in Chrome Extensions (Manifest V3)
 */

export class SimpleChart {
  constructor(canvas, type, data) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.type = type;
    this.data = data;

    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    this.ctx.scale(2, 2);
    this.width = rect.width;
    this.height = rect.height;
    this.padding = 40;
  }

  render() {
    this.ctx.clearRect(0, 0, this.width, this.height);
    if (this.type === "line") this._renderLine();
    else if (this.type === "doughnut") this._renderDoughnut();
  }

  _renderLine() {
    const { labels, values } = this.data;
    if (!values || !labels) return;

    const maxValue = Math.max(...values, 1);
    const chartWidth = this.width - this.padding * 2;
    const chartHeight = this.height - this.padding * 2;
    const stepX = chartWidth / (labels.length - 1 || 1);
    const stepY = chartHeight / maxValue;

    // Grid
    this.ctx.strokeStyle = "#334155";
    this.ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = this.padding + (chartHeight * i) / 4;
      this.ctx.beginPath();
      this.ctx.moveTo(this.padding, y);
      this.ctx.lineTo(this.width - this.padding, y);
      this.ctx.stroke();
    }

    // Filled area
    this.ctx.fillStyle = "rgba(99, 102, 241, 0.1)";
    this.ctx.beginPath();
    this.ctx.moveTo(this.padding, this.height - this.padding);
    values.forEach((v, i) => {
      const x = this.padding + i * stepX;
      const y = this.height - this.padding - v * stepY;
      this.ctx.lineTo(x, y);
    });
    this.ctx.lineTo(this.width - this.padding, this.height - this.padding);
    this.ctx.closePath();
    this.ctx.fill();

    // Line
    this.ctx.strokeStyle = "#6366f1";
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    values.forEach((v, i) => {
      const x = this.padding + i * stepX;
      const y = this.height - this.padding - v * stepY;
      if (i === 0) this.ctx.moveTo(x, y);
      else this.ctx.lineTo(x, y);
    });
    this.ctx.stroke();

    // Points
    values.forEach((v, i) => {
      const x = this.padding + i * stepX;
      const y = this.height - this.padding - v * stepY;
      this.ctx.fillStyle = "#6366f1";
      this.ctx.beginPath();
      this.ctx.arc(x, y, 4, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.strokeStyle = "#fff";
      this.ctx.lineWidth = 2;
      this.ctx.stroke();
    });

    // X labels
    this.ctx.fillStyle = "#64748b";
    this.ctx.font = "11px sans-serif";
    this.ctx.textAlign = "center";
    labels.forEach((label, i) => {
      const x = this.padding + i * stepX;
      this.ctx.fillText(label, x, this.height - this.padding + 20);
    });

    // Y labels
    this.ctx.textAlign = "right";
    for (let i = 0; i <= 4; i++) {
      const value = Math.round((maxValue * (4 - i)) / 4);
      const y = this.padding + (chartHeight * i) / 4;
      this.ctx.fillText(value, this.padding - 10, y + 4);
    }
  }

  _renderDoughnut() {
    const { labels, values } = this.data;
    if (!values || !labels) return;

    const total = values.reduce((s, v) => s + v, 0);
    if (total === 0) return;

    const colors = ["#6366f1", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981"];
    const centerX = this.width / 2 - 40;
    const centerY = this.height / 2;
    const radius = Math.min(centerX, centerY) - 20;
    const innerRadius = radius * 0.6;

    let angle = -Math.PI / 2;

    // Segments
    values.forEach((v, i) => {
      const slice = (v / total) * Math.PI * 2;
      this.ctx.fillStyle = colors[i % colors.length];
      this.ctx.beginPath();
      this.ctx.arc(centerX, centerY, radius, angle, angle + slice);
      this.ctx.arc(centerX, centerY, innerRadius, angle + slice, angle, true);
      this.ctx.closePath();
      this.ctx.fill();
      angle += slice;
    });

    // Center text
    this.ctx.fillStyle = "#f1f5f9";
    this.ctx.font = "bold 20px sans-serif";
    this.ctx.textAlign = "center";
    this.ctx.fillText(total, centerX, centerY + 7);

    // Legend
    const legendX = this.width / 2 + 20;
    let legendY = this.height / 2 - (labels.length * 24) / 2;
    this.ctx.font = "11px sans-serif";
    this.ctx.textAlign = "left";

    labels.forEach((label, i) => {
      this.ctx.fillStyle = colors[i % colors.length];
      this.ctx.beginPath();
      this.ctx.arc(legendX, legendY, 5, 0, Math.PI * 2);
      this.ctx.fill();

      this.ctx.fillStyle = "#94a3b8";
      this.ctx.fillText(label, legendX + 15, legendY + 4);

      this.ctx.fillStyle = "#64748b";
      const labelWidth = this.ctx.measureText(label).width;
      this.ctx.fillText(
        `(${values[i]})`,
        legendX + 20 + labelWidth,
        legendY + 4
      );

      legendY += 24;
    });
  }

  update(newData) {
    this.data = newData;
    this.render();
  }

  destroy() {
    this.ctx.clearRect(0, 0, this.width, this.height);
  }
}

/**
 * Logger Utility - Controls console output based on environment
 * Set isDevelopment = false for production builds
 *
 * USAGE:
 * ------
 * - Development (default): All console.log, error, warn, info output visible
 * - Production: Change isDevelopment to false to disable all logging
 *
 * MIGRATION NOTES:
 * ----------------
 * This replaces all direct console.log() calls to provide environment-aware logging.
 * No changes to logic or functionality - purely a routing layer.
 *
 * PRODUCTION BUILD:
 * -----------------
 * To create a production build:
 * 1. Set isDevelopment = false (line 9)
 * 2. Run your build process
 * 3. All logging will be disabled at runtime
 *
 * ALTERNATIVE: Build-time stripping
 * -----------------------------------
 * For even better performance, consider using a build tool to completely strip
 * logger calls during the production build process using tree-shaking.
 */

const isDevelopment = true; // Change to false for production builds

const logger = {
  /**
   * Log informational message
   * @param {...*} args - Arguments to log
   */
  log: (...args) => {
    if (isDevelopment) console.log(...args);
  },

  /**
   * Log error message
   * @param {...*} args - Arguments to log
   */
  error: (...args) => {
    if (isDevelopment) console.error(...args);
  },

  /**
   * Log warning message
   * @param {...*} args - Arguments to log
   */
  warn: (...args) => {
    if (isDevelopment) console.warn(...args);
  },

  /**
   * Log info message
   * @param {...*} args - Arguments to log
   */
  info: (...args) => {
    if (isDevelopment) console.info(...args);
  },
};

export default logger;
