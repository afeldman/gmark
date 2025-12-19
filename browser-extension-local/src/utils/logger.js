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
