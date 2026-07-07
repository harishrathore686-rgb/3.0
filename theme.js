/*
 * PRAHARI OS - theme.js
 * Theme initialization, togglers, contrast adjustments, and accessible font scale managers.
 */

(function() {
  // Read local storage or default to dark
  const savedTheme = localStorage.getItem('prahari-theme') || 'dark';
  const savedFontSize = localStorage.getItem('prahari-font-scale') || '100%';
  
  // Set theme on body
  if (savedTheme === 'light') {
    document.body.classList.add('light-theme');
  } else {
    document.body.classList.remove('light-theme');
  }
  
  // Set font size
  document.documentElement.style.fontSize = savedFontSize;
})();

window.PrahariTheme = {
  getTheme: function() {
    return localStorage.getItem('prahari-theme') || 'dark';
  },
  
  setTheme: function(theme) {
    if (theme === 'light') {
      document.body.classList.add('light-theme');
    } else {
      document.body.classList.remove('light-theme');
    }
    localStorage.setItem('prahari-theme', theme);
    
    // Dispatch event so active pages can update chart colors or visuals
    window.dispatchEvent(new CustomEvent('prahari-theme-changed', { detail: { theme } }));
  },
  
  toggleTheme: function() {
    const current = this.getTheme();
    const target = current === 'dark' ? 'light' : 'dark';
    this.setTheme(target);
    return target;
  },
  
  getFontScale: function() {
    return localStorage.getItem('prahari-font-scale') || '100%';
  },
  
  setFontScale: function(scale) {
    // scale e.g. "90%", "100%", "110%", "120%"
    document.documentElement.style.fontSize = scale;
    localStorage.setItem('prahari-font-scale', scale);
    window.dispatchEvent(new CustomEvent('prahari-font-scale-changed', { detail: { scale } }));
  },
  
  resetThemeSettings: function() {
    this.setTheme('dark');
    this.setFontScale('100%');
  }
};
