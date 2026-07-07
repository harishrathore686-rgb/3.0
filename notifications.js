/*
 * PRAHARI OS - notifications.js
 * High-fidelity non-blocking notification queue, state-dependent counters, and audio dispatch wrappers.
 */

class NotificationManager {
  constructor() {
    this.toasts = [];
    this.unreadCount = parseInt(localStorage.getItem('prahari-unread-notifications') || '4');
    this.container = null;
    this.audioEnabled = false;
    
    // Auto initialize container when DOM loaded
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.initContainer());
    } else {
      this.initContainer();
    }
  }

  initContainer() {
    this.container = document.getElementById('toast-container');
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.id = 'toast-container';
      document.body.appendChild(this.container);
    }
    this.updateBadgeUI();
  }

  show(title, body, type = 'cyan', duration = 5000) {
    if (!this.container) this.initContainer();

    const toast = document.createElement('div');
    toast.className = `toast toast-enter`;
    toast.style.borderLeftColor = this.getColorForType(type);
    
    // Custom Icon based on type
    const icon = this.getIconForType(type);
    
    toast.innerHTML = `
      <div style="color: ${this.getColorForType(type)}; font-size: 1.25rem;">${icon}</div>
      <div class="toast-content">
        <div class="toast-title">${title}</div>
        <div class="toast-body">${body}</div>
      </div>
      <button class="toast-close" style="background:none; border:none; color:var(--text-muted); cursor:pointer; font-size:1.1rem; line-height:1;">&times;</button>
    `;

    // Close button event
    toast.querySelector('.toast-close').addEventListener('click', () => {
      this.dismiss(toast);
    });

    this.container.appendChild(toast);
    
    // Increment unread count
    this.incrementUnread();

    // Play subtle audio if enabled
    this.playChime();

    // Auto remove after duration
    setTimeout(() => {
      if (toast.parentNode) {
        this.dismiss(toast);
      }
    }, duration);
  }

  dismiss(toast) {
    toast.classList.remove('toast-enter');
    toast.classList.add('toast-exit');
    toast.addEventListener('animationend', () => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    });
  }

  getColorForType(type) {
    switch (type) {
      case 'success': return 'var(--color-success)';
      case 'warning': return 'var(--color-warning)';
      case 'danger': return 'var(--color-danger)';
      case 'emergency': return 'var(--color-emergency)';
      case 'blue': return 'var(--color-blue)';
      default: return 'var(--color-cyan)';
    }
  }

  getIconForType(type) {
    switch (type) {
      case 'success': return '✓';
      case 'warning': return '⚠';
      case 'danger': return '🚨';
      case 'emergency': return '⚡';
      default: return '◈';
    }
  }

  incrementUnread() {
    this.unreadCount++;
    localStorage.setItem('prahari-unread-notifications', this.unreadCount);
    this.updateBadgeUI();
  }

  clearUnread() {
    this.unreadCount = 0;
    localStorage.setItem('prahari-unread-notifications', '0');
    this.updateBadgeUI();
  }

  updateBadgeUI() {
    const badges = document.querySelectorAll('.unread-counter');
    badges.forEach(badge => {
      if (this.unreadCount > 0) {
        badge.textContent = this.unreadCount;
        badge.style.display = 'inline-flex';
      } else {
        badge.style.display = 'none';
      }
    });
  }

  toggleAudio(enabled) {
    this.audioEnabled = enabled;
  }

  playChime() {
    if (!this.audioEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5 note
      osc.frequency.exponentialRampToValueAtTime(1320, audioCtx.currentTime + 0.15); // E5 note
      
      gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
      
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.3);
    } catch (e) {
      console.warn("Audio Context block or unsupported");
    }
  }
}

window.PrahariNotifications = new NotificationManager();
