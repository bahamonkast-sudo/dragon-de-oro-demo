/**
 * Visionarios Session Timer (timer.js)
 * Implements a precise 60-minute countdown timer with custom browser events for frontend communication.
 * Supports hybrid ES Modules/CommonJS and global window scoping.
 */
class SessionTimer {
  constructor(durationMinutes = 60) {
    this.initialDuration = durationMinutes * 60; // Convert to seconds
    this.timeRemaining = this.initialDuration;
    this.intervalId = null;
    this.isRunning = false;
  }

  /**
   * Starts the countdown timer
   */
  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.emitEvent('timer-started', { timeRemaining: this.timeRemaining });

    this.intervalId = setInterval(() => {
      if (this.timeRemaining <= 0) {
        this.stop();
        this.emitEvent('timer-expired', { message: "La sesión ha expirado" });
      } else {
        this.timeRemaining--;
        this.emitEvent('timer-tick', { 
          timeRemaining: this.timeRemaining,
          formatted: this.getFormattedTime()
        });

        // Emit warning when 5 minutes remain (300 seconds)
        if (this.timeRemaining === 300) {
          this.emitEvent('timer-warning', { message: "Quedan 5 minutos de sesión" });
        }
      }
    }, 1000);
  }

  /**
   * Pauses the timer
   */
  pause() {
    if (!this.isRunning) return;
    clearInterval(this.intervalId);
    this.intervalId = null;
    this.isRunning = false;
    this.emitEvent('timer-paused', { timeRemaining: this.timeRemaining });
  }

  /**
   * Resets the timer to initial duration
   */
  reset() {
    this.pause();
    this.timeRemaining = this.initialDuration;
    this.emitEvent('timer-reset', { timeRemaining: this.timeRemaining, formatted: this.getFormattedTime() });
  }

  /**
   * Stops the timer completely
   */
  stop() {
    clearInterval(this.intervalId);
    this.intervalId = null;
    this.isRunning = false;
  }

  /**
   * Returns time remaining formatted as MM:SS
   * @returns {string}
   */
  getFormattedTime() {
    const minutes = Math.floor(this.timeRemaining / 60);
    const seconds = this.timeRemaining % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  /**
   * Helper to dispatch browser events natively when executed in a window context
   * @param {string} eventName 
   * @param {object} detail 
   */
  emitEvent(eventName, detail) {
    if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
      const event = new CustomEvent(eventName, { detail });
      window.dispatchEvent(event);
    }
  }
}

// Support both ES Modules/CommonJS and Global Browser Scope
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SessionTimer;
} else if (typeof window !== 'undefined') {
  window.SessionTimer = SessionTimer;
}
