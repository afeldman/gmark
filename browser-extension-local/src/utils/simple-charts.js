/**
 * SimpleChart - Canvas-based charting library
 * Manifest V3 compatible (no external CDN dependencies)
 * Supports line charts and doughnut charts
 */

export class SimpleChart {
  constructor(canvas, type, config) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.type = type;
    this.config = config;
    this.animationFrame = null;

    // Wait for next frame to ensure canvas has layout dimensions
    requestAnimationFrame(() => {
      this.initCanvas();
      this.render();
    });
  }

  initCanvas() {
    // Set canvas size to match display size with DPI scaling
    const rect = this.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    // Set buffer size for high-DPI displays
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;

    // Scale drawing context
    this.ctx.scale(dpr, dpr);

    // Store logical dimensions for calculations
    this.width = rect.width;
    this.height = rect.height;
  }

  render() {
    // Use logical dimensions for clearRect
    this.ctx.clearRect(0, 0, this.width, this.height);

    if (this.type === "line") {
      this.renderLineChart();
    } else if (this.type === "doughnut") {
      this.renderDoughnutChart();
    }
  }

  renderLineChart() {
    const { labels, values } = this.config;
    if (!labels || !values || labels.length === 0) return;

    const padding = 40;
    const width = this.width - padding * 2;
    const height = this.height - padding * 2;

    const maxValue = Math.max(...values, 1);
    const minValue = Math.min(...values, 0);
    const range = maxValue - minValue || 1;

    // Draw grid lines
    this.ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
    this.ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = padding + (height / 4) * i;
      this.ctx.beginPath();
      this.ctx.moveTo(padding, y);
      this.ctx.lineTo(padding + width, y);
      this.ctx.stroke();
    }

    // Draw axes
    this.ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.moveTo(padding, padding);
    this.ctx.lineTo(padding, padding + height);
    this.ctx.lineTo(padding + width, padding + height);
    this.ctx.stroke();

    // Draw line
    const stepX = width / (labels.length - 1 || 1);

    this.ctx.strokeStyle = "#6366f1";
    this.ctx.lineWidth = 2.5;
    this.ctx.lineCap = "round";
    this.ctx.lineJoin = "round";

    // Create gradient for line
    const gradient = this.ctx.createLinearGradient(
      0,
      padding,
      0,
      padding + height
    );
    gradient.addColorStop(0, "#6366f1");
    gradient.addColorStop(1, "#8b5cf6");
    this.ctx.strokeStyle = gradient;

    this.ctx.beginPath();
    values.forEach((value, i) => {
      const x = padding + stepX * i;
      const normalizedValue = (value - minValue) / range;
      const y = padding + height - normalizedValue * height;

      if (i === 0) {
        this.ctx.moveTo(x, y);
      } else {
        this.ctx.lineTo(x, y);
      }
    });
    this.ctx.stroke();

    // Draw fill area
    this.ctx.lineTo(padding + width, padding + height);
    this.ctx.lineTo(padding, padding + height);
    this.ctx.closePath();

    const fillGradient = this.ctx.createLinearGradient(
      0,
      padding,
      0,
      padding + height
    );
    fillGradient.addColorStop(0, "rgba(99, 102, 241, 0.2)");
    fillGradient.addColorStop(1, "rgba(99, 102, 241, 0.02)");
    this.ctx.fillStyle = fillGradient;
    this.ctx.fill();

    // Draw points
    this.ctx.fillStyle = "#6366f1";
    values.forEach((value, i) => {
      const x = padding + stepX * i;
      const normalizedValue = (value - minValue) / range;
      const y = padding + height - normalizedValue * height;

      this.ctx.beginPath();
      this.ctx.arc(x, y, 4, 0, Math.PI * 2);
      this.ctx.fillStyle = "#ffffff";
      this.ctx.fill();
      this.ctx.strokeStyle = "#6366f1";
      this.ctx.lineWidth = 2;
      this.ctx.stroke();
    });

    // Draw labels
    this.ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
    this.ctx.font = "10px system-ui, -apple-system, sans-serif";
    this.ctx.textAlign = "center";
    labels.forEach((label, i) => {
      const x = padding + stepX * i;
      this.ctx.fillText(label, x, padding + height + 20);
    });

    // Draw y-axis labels
    this.ctx.textAlign = "right";
    for (let i = 0; i <= 4; i++) {
      const value = maxValue - (range / 4) * i;
      const y = padding + (height / 4) * i;
      this.ctx.fillText(Math.round(value), padding - 10, y + 4);
    }
  }

  renderDoughnutChart() {
    const { labels, values, colors } = this.config;
    if (!labels || !values || labels.length === 0) return;

    const centerX = this.width / 2;
    const centerY = this.height / 2;
    const radius = Math.min(centerX, centerY) - 40;
    const innerRadius = radius * 0.6;

    const total = values.reduce((sum, val) => sum + val, 0);
    if (total === 0) return;

    let currentAngle = -Math.PI / 2;

    // Draw segments
    values.forEach((value, i) => {
      const sliceAngle = (value / total) * Math.PI * 2;
      const color = colors?.[i] || this.getDefaultColor(i);

      // Draw outer arc
      this.ctx.beginPath();
      this.ctx.arc(
        centerX,
        centerY,
        radius,
        currentAngle,
        currentAngle + sliceAngle
      );
      this.ctx.arc(
        centerX,
        centerY,
        innerRadius,
        currentAngle + sliceAngle,
        currentAngle,
        true
      );
      this.ctx.closePath();

      // Create gradient for segment
      const gradient = this.ctx.createRadialGradient(
        centerX,
        centerY,
        innerRadius,
        centerX,
        centerY,
        radius
      );
      gradient.addColorStop(0, this.lightenColor(color, 20));
      gradient.addColorStop(1, color);
      this.ctx.fillStyle = gradient;
      this.ctx.fill();

      // Draw segment border
      this.ctx.strokeStyle = "rgba(15, 23, 42, 0.8)";
      this.ctx.lineWidth = 2;
      this.ctx.stroke();

      currentAngle += sliceAngle;
    });

    // Draw center circle
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, innerRadius, 0, Math.PI * 2);
    this.ctx.fillStyle = "#0f172a";
    this.ctx.fill();

    // Draw total in center
    this.ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
    this.ctx.font = "bold 20px system-ui, -apple-system, sans-serif";
    this.ctx.textAlign = "center";
    this.ctx.textBaseline = "middle";
    this.ctx.fillText(total, centerX, centerY - 8);

    this.ctx.font = "11px system-ui, -apple-system, sans-serif";
    this.ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
    this.ctx.fillText("Bookmarks", centerX, centerY + 12);

    // Draw legend
    const legendX = 20;
    const legendY =
      this.canvas.height / window.devicePixelRatio - labels.length * 22 - 10;

    this.ctx.textAlign = "left";
    this.ctx.textBaseline = "middle";

    labels.forEach((label, i) => {
      const y = legendY + i * 22;
      const color = colors?.[i] || this.getDefaultColor(i);

      // Draw color box
      this.ctx.fillStyle = color;
      this.ctx.fillRect(legendX, y, 12, 12);

      // Draw label
      this.ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
      this.ctx.font = "11px system-ui, -apple-system, sans-serif";
      this.ctx.fillText(label, legendX + 18, y + 6);

      // Draw percentage
      const percentage = ((values[i] / total) * 100).toFixed(1);
      this.ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
      this.ctx.fillText(
        `${percentage}%`,
        legendX + 18 + this.ctx.measureText(label).width + 8,
        y + 6
      );
    });
  }

  getDefaultColor(index) {
    const colors = [
      "#6366f1", // indigo
      "#8b5cf6", // purple
      "#ec4899", // pink
      "#f59e0b", // amber
      "#10b981", // emerald
      "#06b6d4", // cyan
      "#f43f5e", // rose
      "#64748b", // slate
    ];
    return colors[index % colors.length];
  }

  lightenColor(color, percent) {
    const num = parseInt(color.replace("#", ""), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = ((num >> 8) & 0x00ff) + amt;
    const B = (num & 0x0000ff) + amt;
    return (
      "#" +
      (
        0x1000000 +
        (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
        (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
        (B < 255 ? (B < 1 ? 0 : B) : 255)
      )
        .toString(16)
        .slice(1)
    );
  }

  update(newConfig) {
    this.config = { ...this.config, ...newConfig };

    // Reinitialize canvas dimensions in case of resize
    this.initCanvas();

  destroy() {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
    this.ctx.clearRect(0, 0, this.width, this.height);
  }
}
