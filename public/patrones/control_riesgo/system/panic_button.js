/**
 * Visionarios Panic Button Module (panic_button.js)
 * High-fidelity shutdown system. If running in a Node-based portable desktop wrapper (e.g. Electron/NW.js),
 * it kills operating system processes related to Binomo.
 * If running in a pure web browser, it alerts the user and redirects/closes the page immediately.
 */
class PanicButton {
  constructor() {
    this.isNode = typeof process !== 'undefined' && process.versions && process.versions.node;
  }

  /**
   * Triggers the panic/shutdown protocol
   */
  async activate() {
    console.warn("¡ALERTA: PROTOCOLO DE PÁNICO ACTIVADO!");

    // Play the voice warning natively via browser first
    try {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance("Cerraré tu sesión, luego me lo agradecerás, calma tu sed de venganza.");
        utterance.lang = 'es-ES';
        utterance.rate = 0.90;
        
        // Find a male voice or lower pitch
        const voices = window.speechSynthesis.getVoices();
        const maleVoice = voices.find(v => v.lang.startsWith('es') && (v.name.toLowerCase().includes('pablo') || v.name.toLowerCase().includes('male') || v.name.toLowerCase().includes('hombre')));
        if (maleVoice) {
          utterance.voice = maleVoice;
        } else {
          utterance.pitch = 0.3; // Very low pitch for masculine voice
        }

        utterance.onend = () => {
          this.executeShutdown();
        };

        window.speechSynthesis.speak(utterance);
        
        // Fallback in case onend never fires (sometimes happens in certain browsers)
        setTimeout(() => this.executeShutdown(), 7000);
        return;
      }
    } catch (e) {
      console.error(e);
    }
    
    // Fallback if no speech synthesis
    this.executeShutdown();
  }

  executeShutdown() {
    this.browserFallback();
  }

  /**
   * Browser fallback protocol when child_process is unavailable
   */
  browserFallback() {
    const alertMessage = "🚨 ¡BOTÓN DE PÁNICO ACTIVADO! 🚨\n\nDesconectando inmediatamente por seguridad...";
    
    if (typeof window !== 'undefined') {
      // Execute the deep system shutdown via the API we added to server.js
      if (typeof fetch !== 'undefined') {
        fetch('/api/panic', { method: 'POST' }).catch(e => console.error("Error invoking panic API", e));
      }

      // Direct visual feedback as fallback
      alert(alertMessage);
      
      // Attempt to close the window
      try {
        window.close();
      } catch (e) {
        window.location.href = "about:blank";
      }
    } else {
      console.log(alertMessage);
    }
  }
}

// Support both ES Modules/CommonJS and Global Browser Scope
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PanicButton;
} else if (typeof window !== 'undefined') {
  window.PanicButton = PanicButton;
}
