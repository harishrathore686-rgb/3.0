/*
 * PRAHARI OS - script.js
 * Global page controllers, ripple managers, ambient micro-behaviors, and visual voice modules.
 */

class PrahariCore {
  constructor() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.init());
    } else {
      this.init();
    }
  }

  init() {
    this.setupRippleButtons();
    this.setupMouseGlows();
    this.handleBootLoadingScreen();
    this.initVoiceVisualizer();
    this.syncNavbarUserAvatar();
  }

  setupRippleButtons() {
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('.btn');
      if (!btn) return;

      const ripple = document.createElement('span');
      ripple.className = 'ripple';
      
      const rect = btn.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      ripple.style.width = ripple.style.height = `${size}px`;
      
      const x = e.clientX - rect.left - size / 2;
      const y = e.clientY - rect.top - size / 2;
      ripple.style.left = `${x}px`;
      ripple.style.top = `${y}px`;
      
      btn.appendChild(ripple);
      
      ripple.addEventListener('animationend', () => {
        ripple.remove();
      });
    });
  }

  setupMouseGlows() {
    // Dynamic mouse glow coords for premium SaaS card highlights
    document.addEventListener('mousemove', (e) => {
      const cards = document.querySelectorAll('.glow-card');
      cards.forEach(card => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        card.style.setProperty('--mouse-x', `${x}px`);
        card.style.setProperty('--mouse-y', `${y}px`);
      });
    });
  }

  handleBootLoadingScreen() {
    const loader = document.getElementById('boot-loader');
    if (!loader) return;

    // Simulate sophisticated neural weight compilation
    const progressEl = document.getElementById('boot-progress-bar');
    const logEl = document.getElementById('boot-status-logs');
    
    const logs = [
      "Broadcasting public health gateway nodes...",
      "Connecting with regional FHIR / EHR database tunnels...",
      "Syncing Google Workspace People profiles...",
      "Initializing Prahari Epidemic Prediction Engine...",
      "Prahari OS compilation successful. Initializing secure kernel."
    ];

    let progress = 0;
    let logIndex = 0;

    const interval = setInterval(() => {
      progress += Math.floor(Math.random() * 8) + 4;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        
        // Hide loader with fade transition
        loader.style.transition = 'opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1)';
        loader.style.opacity = '0';
        setTimeout(() => {
          loader.style.display = 'none';
          // Dispatch completed event
          window.dispatchEvent(new CustomEvent('prahari-boot-completed'));
          window.PrahariNotifications.show("Prahari Kernel Live", "All district prediction modules initialized successfully.", "cyan");
        }, 600);
      }
      
      if (progressEl) progressEl.style.width = `${progress}%`;
      
      // Rotate logs on timeline
      if (logEl && progress > (logIndex + 1) * 20 && logIndex < logs.length) {
        logEl.textContent = logs[logIndex];
        logIndex++;
      }
    }, 120);
  }

  initVoiceVisualizer() {
    const triggerBtn = document.getElementById('voice-input-trigger');
    const waveform = document.getElementById('voice-waveform-container');
    if (!triggerBtn || !waveform) return;

    let recording = false;

    triggerBtn.addEventListener('click', () => {
      recording = !recording;
      if (recording) {
        triggerBtn.classList.add('btn-accent');
        triggerBtn.innerHTML = `<span>🛑</span> Stop Recording`;
        waveform.style.display = 'flex';
        window.PrahariNotifications.show("Microphone Connected", "Listening for DHC clinical notes...", "cyan");
      } else {
        triggerBtn.classList.remove('btn-accent');
        triggerBtn.innerHTML = `<span>🎤</span> Speak Clinical Notes`;
        waveform.style.display = 'none';
        this.processRecordedAudio();
      }
    });
  }

  processRecordedAudio() {
    window.PrahariNotifications.show("Voice Synthesizer Activated", "Processing natural language structures via Gemini NLP API...", "blue");
    
    // Fill OCR or telemetry slots inside active page to show dynamic twin integration
    const analysisLog = document.getElementById('ocr-analysis-log');
    if (analysisLog) {
      analysisLog.innerHTML = `
        <div style="text-align:center; padding:10px;" class="thinking">Analyzing audio transcription parameters</div>
      `;
      
      setTimeout(() => {
        analysisLog.innerHTML = `
          <div style="display:flex; flex-direction:column; gap:8px; font-size:0.8rem;">
            <div style="color:var(--color-success); font-weight:600;">✓ AUDIO DICTATION VERIFIED</div>
            <div style="background:rgba(255,255,255,0.02); padding:8px; border-radius:6px; border:1px solid var(--border-color);">
              <span style="color:var(--text-secondary);">Transcribed Statement:</span> "Alerting Dhar CHC. Extreme caseload spikes detected in ward B. Requesting 5 medical interns for pediatric rotation."
            </div>
            <div style="color:var(--color-cyan);">Action: Dispatched intern request roster draft to District Administrator.</div>
          </div>
        `;
        window.PrahariNotifications.show("Clinical Notes Processed", "Roster automation suggested to Administrator", "success");
      }, 2500);
    }
  }

  syncNavbarUserAvatar() {
    // Read cached user session info
    const sync = () => {
      const avatarContainer = document.getElementById('nav-user-avatar-block');
      if (!avatarContainer) return;
      
      const profile = window.PrahariAuth ? window.PrahariAuth.getUserProfile() : null;
      if (profile && profile.displayName !== "Guest Member") {
        avatarContainer.innerHTML = `
          <div style="display:flex; align-items:center; gap:12px; cursor:pointer;" onclick="window.location.href='profile.html'">
            <div style="text-align:right;" class="desktop-only">
              <div style="font-size:0.85rem; font-weight:600; color:var(--text-primary); line-height:1.1;">${profile.displayName}</div>
              <div style="font-size:0.7rem; color:var(--text-muted);">${profile.role}</div>
            </div>
            <img src="${profile.photoURL}" style="width:36px; height:36px; border-radius:50%; border:1.5px solid var(--color-cyan); object-fit:cover;" referrerPolicy="no-referrer" alt="Profile">
          </div>
        `;
      } else {
        avatarContainer.innerHTML = `
          <button class="btn btn-secondary" onclick="window.location.href='login.html'" style="font-size:0.8rem; padding:6px 14px;">Sign In</button>
        `;
      }
    };

    // Initial sync
    sync();
    // Re-sync on auth events
    window.addEventListener('prahari-auth-login', sync);
    window.addEventListener('prahari-auth-logout', sync);
    window.addEventListener('prahari-auth-roleChanged', sync);
  }
}

window.PrahariCore = new PrahariCore();
export default PrahariCore;
