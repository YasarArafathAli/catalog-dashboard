/**
 * Production-ready logger utility
 * Reduces console.log overhead in production builds
 */

const isDevelopment = import.meta.env.DEV;

class Logger {
  constructor() {
    this.isEnabled = isDevelopment;
  }

  log(...args) {
    if (this.isEnabled) {
      console.log(...args);
    }
  }

  error(...args) {
    // Always log errors, even in production
    console.error(...args);
  }

  warn(...args) {
    if (this.isEnabled) {
      console.warn(...args);
    }
  }

  info(...args) {
    if (this.isEnabled) {
      console.info(...args);
    }
  }

  debug(...args) {
    if (this.isEnabled) {
      console.debug(...args);
    }
  }

  // Enable/disable logging at runtime
  setEnabled(enabled) {
    this.isEnabled = enabled;
  }
}

export const logger = new Logger();
export default logger;
