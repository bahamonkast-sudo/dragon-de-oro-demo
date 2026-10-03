/**
 * Core Authentication Module for Portable Local Access
 * Uses the Web Crypto API for secure, zero-dependency, and offline-compatible SHA-256 hashing.
 */
class LocalAuth {
  constructor(config = {}) {
    this.passwordSet = config.auth?.password_set || false;
    this.passwordHash = config.auth?.password_hash || "";
  }

  /**
   * Hashes a string using SHA-256 natively (Web Crypto API)
   * @param {string} password 
   * @returns {Promise<string>} Hex representation of the hash
   */
  async hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    // SubtleCrypto is available globally in browsers and Node.js 15+
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Registers a new password if none is set, or resets it
   * @param {string} newPassword 
   * @returns {Promise<object>} Updated auth config
   */
  async setPassword(newPassword) {
    if (!newPassword || newPassword.trim() === "") {
      throw new Error("La contraseña no puede estar vacía.");
    }
    const hash = await this.hashPassword(newPassword);
    this.passwordHash = hash;
    this.passwordSet = true;
    return {
      password_set: this.passwordSet,
      password_hash: this.passwordHash
    };
  }

  /**
   * Verifies if the provided password matches the stored hash
   * @param {string} password 
   * @returns {Promise<boolean>} True if password matches, false otherwise
   */
  async verifyPassword(password) {
    if (!this.passwordSet) {
      return false;
    }
    const hash = await this.hashPassword(password);
    return hash === this.passwordHash;
  }

  /**
   * Clears the current password
   */
  clearPassword() {
    this.passwordHash = "";
    this.passwordSet = false;
  }
}

// Support both ES Modules/CommonJS and Global Browser Scope
if (typeof module !== 'undefined' && module.exports) {
  module.exports = LocalAuth;
} else if (typeof window !== 'undefined') {
  window.LocalAuth = LocalAuth;
}
