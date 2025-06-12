import { 
  decode, 
  encode, 
  encodingToHex, 
  hexToEncoding 
} from "../src/codec.js";
import { renderToCanvas, renderToSVG } from "../src/render.js";
import { 
  createRandomCleanEncoding,
  createRandomLayer,
  randomByte,
  randomNibble
} from "../src/util.js";
import { getPalette } from "../src/colors.js";

// Lightspeed Application
class LightspeedApp {
  constructor() {
    this.currentEncoding = null;
    this.history = this.loadHistory();
    this.canvas = null;
    this.context = null;
    this.exportSize = 4000; // High-quality export size
    this.activeColorPicker = null; // Track which color we're picking for
    this.margin = 10; // Default margin in pixels
    
    this.init();
  }

  init() {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setupUI());
    } else {
      this.setupUI();
    }
  }

  setupUI() {
    // Get canvas and context
    this.canvas = document.getElementById('mainCanvas');
    this.context = this.canvas.getContext('2d', { colorSpace: 'display-p3' });
    
    // Setup event listeners
    this.setupTabs();
    this.setupControls();
    this.setupLayerControls();
    
    // Generate initial artwork
    this.generateRandom();
    
    // Update gallery
    this.updateGallery();
  }

  setupTabs() {
    const tabs = document.querySelectorAll('.tab');
    const panels = document.querySelectorAll('.tab-panel');
    
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const targetTab = tab.dataset.tab;
        
        // Update active tab
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        
        // Update active panel
        panels.forEach(p => p.classList.remove('active'));
        document.getElementById(`${targetTab}-panel`).classList.add('active');
      });
    });
  }

  setupControls() {
    // New navbar buttons
    document.getElementById('shuffleBtn').addEventListener('click', () => {
      this.generateRandom();
    });
    
    document.getElementById('exportBtn').addEventListener('click', () => {
      this.showExportModal();
    });

    // Random button (keeping existing)
    document.getElementById('randomBtn').addEventListener('click', () => {
      this.generateRandom();
    });

    // Export modal controls
    document.getElementById('closeModal').addEventListener('click', () => {
      this.hideExportModal();
    });

    // Close modal when clicking outside
    document.getElementById('exportModal').addEventListener('click', (e) => {
      if (e.target.id === 'exportModal') {
        this.hideExportModal();
      }
    });

    // Color picker modal controls
    document.getElementById('closeColorPicker').addEventListener('click', () => {
      this.hideColorPicker();
    });

    document.getElementById('colorPickerModal').addEventListener('click', (e) => {
      if (e.target.id === 'colorPickerModal') {
        this.hideColorPicker();
      }
    });

    // Keyboard shortcuts
    this.setupKeyboardShortcuts();

    // Margin control
    const marginSlider = document.getElementById('marginSlider');
    const marginValue = document.getElementById('marginValue');
    
    marginSlider.addEventListener('input', (e) => {
      this.margin = parseInt(e.target.value);
      marginValue.textContent = `${this.margin}px`;
      this.render();
    });

    // Make functions globally available
    window.applyPreset = (preset) => this.applyPreset(preset);
    window.shuffleFunction = (type) => this.shuffleFunction(type);
    window.shuffleComposition = () => this.shuffleComposition();
    window.exportCSV = () => this.exportCSV();
    window.exportSVG = () => this.exportSVG();
    window.exportPNG = () => this.exportPNG();
    window.importCSV = () => this.importCSV();
    window.copyShareUrl = () => this.copyShareUrl();
    window.addToHistory = () => this.addToHistory();
    window.clearHistory = () => this.clearHistory();
  }

  setupLayerControls() {
    const visibleContainer = document.getElementById('visible-dots');
    const colorContainer = document.getElementById('layer-colors');
    
    if (this.currentEncoding) {
      const decoded = decode(this.currentEncoding);
      
      // Setup visible dots
      visibleContainer.innerHTML = '';
      decoded.layers.forEach((layer, index) => {
        const dot = document.createElement('div');
        dot.className = `visible-dot ${layer.visible ? 'filled' : 'empty'}`;
        dot.onclick = () => this.toggleLayer(index);
        visibleContainer.appendChild(dot);
      });

      // Setup color controls
      colorContainer.innerHTML = '';
      
      // Color A row
      const colorADiv = document.createElement('div');
      colorADiv.innerHTML = '<span style="font-size: 9px; color: #666; width: 40px; display: inline-block;">Color A</span>';
      decoded.layers.forEach((layer, index) => {
        const swatch = document.createElement('div');
        swatch.className = 'color-swatch';
        swatch.style.background = this.getLayerColor(layer, 0);
        swatch.onclick = () => this.showColorPicker(index, 0);
        swatch.title = `Click to change color A for layer ${index + 1}`;
        colorADiv.appendChild(swatch);
      });
      colorContainer.appendChild(colorADiv);

      // Color B row  
      const colorBDiv = document.createElement('div');
      colorBDiv.innerHTML = '<span style="font-size: 9px; color: #666; width: 40px; display: inline-block;">Color B</span>';
      colorBDiv.style.marginTop = '4px';
      decoded.layers.forEach((layer, index) => {
        const swatch = document.createElement('div');
        swatch.className = 'color-swatch';
        swatch.style.background = this.getLayerColor(layer, 1);
        swatch.onclick = () => this.showColorPicker(index, 1);
        swatch.title = `Click to change color B for layer ${index + 1}`;
        colorBDiv.appendChild(swatch);
      });
      colorContainer.appendChild(colorBDiv);

      // Composition row
      const compositionDiv = document.createElement('div');
      compositionDiv.innerHTML = '<span style="font-size: 9px; color: #666; width: 40px; display: inline-block;">Composition</span>';
      compositionDiv.style.marginTop = '4px';
      decoded.layers.forEach((layer, index) => {
        const btn = document.createElement('div');
        btn.className = 'icon-btn';
        btn.style.width = '16px';
        btn.style.height = '16px';
        btn.style.border = '1px solid #999';
        btn.style.background = 'white';
        btn.style.cursor = 'pointer';
        btn.style.display = 'inline-flex';
        btn.style.alignItems = 'center';
        btn.style.justifyContent = 'center';
        btn.style.fontSize = '8px';
        btn.style.marginRight = '2px';
        btn.innerHTML = '⚃';
        btn.title = `Shuffle layer ${index + 1} composition`;
        btn.onclick = () => this.shuffleLayerComposition(index);
        compositionDiv.appendChild(btn);
      });
      colorContainer.appendChild(compositionDiv);
    }
  }

  getLayerColor(layer, colorIndex) {
    const palette = getPalette({ system: this.currentEncoding[0] });
    const colorId = layer.colors[colorIndex];
    
    if (colorId === 0) {
      // Return a CSS pattern for "no color"
      return 'repeating-linear-gradient(45deg, transparent, transparent 2px, #ccc 2px, #ccc 3px)';
    }
    
    return palette[Math.max(0, Math.min(palette.length - 1, colorId))] || '#888';
  }

  generateRandom() {
    this.currentEncoding = createRandomCleanEncoding();
    this.render();
    this.updateControls();
  }

  render() {
    if (!this.currentEncoding || !this.context) return;
    
    // Clear canvas
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Render artwork with custom margin
    renderToCanvas({
      context: this.context,
      width: this.canvas.width,
      height: this.canvas.height,
      encoding: this.currentEncoding,
      hatch: true,
      hatchContours: true,
      margin: this.margin
    });
  }

  updateControls() {
    this.setupLayerControls();
    this.updateDataPanel();
  }

  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      if (e.metaKey || e.ctrlKey) {
        if (e.key === 's') {
          e.preventDefault();
          this.addToHistory(); // Save to Gallery
        } else if (e.key === 'e') {
          e.preventDefault();
          this.showExportModal(); // Show export options
        }
      }
    });
  }

  showExportModal() {
    document.getElementById('exportModal').style.display = 'block';
  }

  hideExportModal() {
    document.getElementById('exportModal').style.display = 'none';
  }

  showColorPicker(layerIndex, colorIndex) {
    this.activeColorPicker = { layerIndex, colorIndex };
    this.populateColorGrid();
    document.getElementById('colorPickerModal').style.display = 'block';
  }

  hideColorPicker() {
    document.getElementById('colorPickerModal').style.display = 'none';
    this.activeColorPicker = null;
  }

  populateColorGrid() {
    const grid = document.getElementById('colorGrid');
    grid.innerHTML = '';
    
    const palette = getPalette({ system: this.currentEncoding[0] });
    
    // Add "no color" option first
    const noColorOption = document.createElement('div');
    noColorOption.className = 'color-option no-color';
    noColorOption.title = 'No color';
    noColorOption.onclick = () => this.selectColor(0);
    grid.appendChild(noColorOption);
    
    // Add all palette colors
    palette.slice(1).forEach((color, index) => {
      const colorOption = document.createElement('div');
      colorOption.className = 'color-option';
      colorOption.style.backgroundColor = color;
      colorOption.title = `Color ${index + 1}`;
      colorOption.onclick = () => this.selectColor(index + 1);
      grid.appendChild(colorOption);
    });
  }

  selectColor(colorId) {
    if (!this.activeColorPicker) return;
    
    const { layerIndex, colorIndex } = this.activeColorPicker;
    const decoded = decode(this.currentEncoding);
    decoded.layers[layerIndex].colors[colorIndex] = colorId;
    this.currentEncoding = encode(decoded);
    
    this.render();
    this.updateControls();
    this.hideColorPicker();
  }

  updateDataPanel() {
    const textarea = document.getElementById('encodingData');
    if (textarea && this.currentEncoding) {
      textarea.value = encodingToHex(this.currentEncoding);
    }
  }

  // Layer manipulation
  toggleLayer(layerIndex) {
    const decoded = decode(this.currentEncoding);
    decoded.layers[layerIndex].visible = !decoded.layers[layerIndex].visible;
    this.currentEncoding = encode(decoded);
    this.render();
    this.updateControls();
  }

  shuffleLayerComposition(layerIndex) {
    const decoded = decode(this.currentEncoding);
    const layer = decoded.layers[layerIndex];
    layer.dimensions = [randomNibble(), randomNibble()];
    layer.scale = randomNibble();
    layer.skip = randomNibble();
    this.currentEncoding = encode(decoded);
    this.render();
    this.updateControls();
  }

  shuffleComposition() {
    const decoded = decode(this.currentEncoding);
    decoded.layers.forEach(layer => {
      layer.dimensions = [randomNibble(), randomNibble()];
      layer.scale = randomNibble();
      layer.skip = randomNibble();
    });
    this.currentEncoding = encode(decoded);
    this.render();
    this.updateControls();
  }

  // Preset functions
  applyPreset(preset) {
    const presets = {
      blocky: () => this.applyBlockyPreset(),
      checker: () => this.applyCheckerPreset(),
      mono: () => this.applyMonoPreset(),
      glitch: () => this.applyGlitchPreset(),
      dither: () => this.applyDitherPreset(),
      cellular: () => this.applyCellularPreset(),
      dual: () => this.applyDualPreset(),
      weave: () => this.applyWeavePreset(),
      matrix: () => this.applyMatrixPreset()
    };
    
    if (presets[preset]) {
      presets[preset]();
      this.render();
      this.updateControls();
    }
  }

  applyBlockyPreset() {
    const decoded = decode(this.currentEncoding);
    // Blocks: focuses on first 3 layers, some have one, some two, some no color
    decoded.layers.forEach((layer, i) => {
      if (i < 3) {
        layer.visible = true;
        // Random color configuration: no color, one color, or two colors
        const colorMode = Math.floor(Math.random() * 3);
        if (colorMode === 0) {
          layer.colors = [0, 0]; // no color
        } else if (colorMode === 1) {
          layer.colors = [randomNibble(), 0]; // one color
        } else {
          layer.colors = [randomNibble(), randomNibble()]; // two colors
        }
        layer.dimensions = [randomNibble(), randomNibble()];
        layer.pattern = randomByte();
      } else {
        layer.visible = false;
      }
    });
    this.currentEncoding = encode(decoded);
  }

  applyCheckerPreset() {
    const decoded = decode(this.currentEncoding);
    // Checkers: only first layer, always two colors active
    decoded.layers.forEach((layer, i) => {
      if (i === 0) {
        layer.visible = true;
        layer.colors = [randomNibble(), randomNibble()]; // always two colors
        layer.pattern = parseInt("10101010", 2); // checkered pattern
        layer.rule = 90; // typical checker rule
        layer.dimensions = [4, 4]; // good size for checkers
      } else {
        layer.visible = false;
      }
    });
    this.currentEncoding = encode(decoded);
  }

  applyMonoPreset() {
    const decoded = decode(this.currentEncoding);
    // Mono: only first layer, one color only
    decoded.layers.forEach((layer, i) => {
      if (i === 0) {
        layer.visible = true;
        layer.colors = [randomNibble(), 0]; // one color only
        layer.dimensions = [randomNibble(), randomNibble()];
        layer.pattern = randomByte();
      } else {
        layer.visible = false;
      }
    });
    // Use black & white system for mono
    this.currentEncoding[0] = 1;
    this.currentEncoding = encode(decoded);
  }

  applyGlitchPreset() {
    const decoded = decode(this.currentEncoding);
    // Glitch: focuses on first 3 layers, only one color of the two
    decoded.layers.forEach((layer, i) => {
      if (i < 3) {
        layer.visible = true;
        const color = randomNibble();
        layer.colors = [color, 0]; // only one color active
        layer.rule = randomByte(); // random rules for glitch effect
        layer.pattern = randomByte();
        layer.dimensions = [randomNibble(), randomNibble()];
      } else {
        layer.visible = false;
      }
    });
    this.currentEncoding = encode(decoded);
  }

  applyDitherPreset() {
    const decoded = decode(this.currentEncoding);
    // Dither: first two layers only, one color only
    decoded.layers.forEach((layer, i) => {
      if (i < 2) {
        layer.visible = true;
        const color = randomNibble();
        layer.colors = [color, 0]; // only one color
        layer.pattern = Math.random() > 0.5 ? parseInt("10101010", 2) : parseInt("01010101", 2);
        layer.dimensions = [6, 6]; // medium grid for dither
      } else {
        layer.visible = false;
      }
    });
    this.currentEncoding = encode(decoded);
  }

  applyCellularPreset() {
    const decoded = decode(this.currentEncoding);
    // Cellular: first two layers only, one color each
    decoded.layers.forEach((layer, i) => {
      if (i < 2) {
        layer.visible = true;
        const color = randomNibble();
        layer.colors = [color, 0]; // one color only
        layer.rule = 30; // cellular automata rule
        layer.dimensions = [6, 6]; // medium grid
        layer.pattern = randomByte();
      } else {
        layer.visible = false;
      }
    });
    this.currentEncoding = encode(decoded);
  }

  applyDualPreset() {
    const decoded = decode(this.currentEncoding);
    // Dual: both colors on first layer only
    decoded.layers.forEach((layer, i) => {
      if (i === 0) {
        layer.visible = true;
        layer.colors = [randomNibble(), randomNibble()]; // both colors active
        layer.dimensions = [randomNibble(), randomNibble()];
        layer.pattern = randomByte();
      } else {
        layer.visible = false;
      }
    });
    this.currentEncoding = encode(decoded);
  }

  applyWeavePreset() {
    const decoded = decode(this.currentEncoding);
    // Weave: three layers, only first color active, first color and layer always white
    decoded.layers.forEach((layer, i) => {
      if (i < 3) {
        layer.visible = true;
        if (i === 0) {
          layer.colors = [15, 0]; // first layer: white (15) and no second color
        } else {
          layer.colors = [randomNibble(), 0]; // other layers: first color only
        }
        layer.pattern = i % 2 ? parseInt("11001100", 2) : parseInt("00110011", 2); // weave pattern
        layer.dimensions = [5, 5];
      } else {
        layer.visible = false;
      }
    });
    this.currentEncoding = encode(decoded);
  }

  applyMatrixPreset() {
    const decoded = decode(this.currentEncoding);
    // Matrix: first two layers active, one color only
    decoded.layers.forEach((layer, i) => {
      if (i < 2) {
        layer.visible = true;
        const color = 8; // greenish color for matrix feel
        layer.colors = [color, 0]; // one color only
        layer.dimensions = [8, 8]; // large grid
        layer.pattern = randomByte();
        layer.rule = randomByte();
      } else {
        layer.visible = false;
      }
    });
    this.currentEncoding = encode(decoded);
  }

  // Shuffle functions
  shuffleFunction(type) {
    const decoded = decode(this.currentEncoding);
    
    switch(type) {
      case 'colors':
        decoded.layers.forEach(layer => {
          layer.colors = [randomNibble(), randomNibble()];
        });
        break;
      case 'grid':
        decoded.layers.forEach(layer => {
          layer.dimensions = [randomNibble(), randomNibble()];
        });
        break;
      case 'rules':
        decoded.layers.forEach(layer => {
          layer.rule = randomByte();
        });
        break;
      case 'scale':
        decoded.layers.forEach(layer => {
          layer.scale = randomNibble();
        });
        break;
      case 'skip':
        decoded.layers.forEach(layer => {
          layer.skip = randomNibble();
        });
        break;
      case 'patterns':
        decoded.layers.forEach(layer => {
          layer.pattern = Array(8).fill().map(() => Math.random() > 0.5 ? '1' : '0').join('');
        });
        break;
      case 'layers':
        decoded.layers.forEach(layer => {
          layer.visible = Math.random() > 0.3;
        });
        break;
      case 'flip':
        decoded.layers.forEach(layer => {
          layer.flipMode = Math.floor(Math.random() * 4);
        });
        break;
    }
    
    this.currentEncoding = encode(decoded);
    this.render();
    this.updateControls();
  }

  // Export functions
  exportCSV() {
    const csv = encodingToHex(this.currentEncoding);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lightspeed_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    this.hideExportModal();
  }

  exportSVG() {
    const svgContent = renderToSVG({
      width: this.exportSize,
      height: this.exportSize,
      encoding: this.currentEncoding,
      hatch: true,
      hatchContours: true,
      margin: this.margin
    });
    
    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lightspeed_${Date.now()}.svg`;
    a.click();
    URL.revokeObjectURL(url);
    this.hideExportModal();
  }

  exportPNG() {
    // Create high-res canvas for export
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = this.exportSize;
    exportCanvas.height = this.exportSize;
    const exportContext = exportCanvas.getContext('2d');

    renderToCanvas({
      context: exportContext,
      width: this.exportSize,
      height: this.exportSize,
      encoding: this.currentEncoding,
      hatch: true,
      hatchContours: true,
      margin: this.margin
    });
    
    const link = document.createElement('a');
    link.download = `lightspeed_${Date.now()}.png`;
    link.href = exportCanvas.toDataURL('image/png');
    link.click();
    this.hideExportModal();
  }

  importCSV() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv,.txt';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const hex = e.target.result.trim();
            this.currentEncoding = hexToEncoding(hex);
            this.render();
            this.updateControls();
          } catch (err) {
            alert('Invalid encoding data');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  }

  generateShareUrl() {
    const hex = encodingToHex(this.currentEncoding);
    const url = `${window.location.origin}${window.location.pathname}?data=${hex}`;
    document.getElementById('shareUrl').value = url;
  }

  copyShareUrl() {
    this.generateShareUrl();
    const input = document.getElementById('shareUrl');
    input.select();
    document.execCommand('copy');
    alert('URL copied to clipboard!');
  }

  // History functions
  addToHistory() {
    const hex = encodingToHex(this.currentEncoding);
    if (!this.history.includes(hex)) {
      this.history.unshift(hex);
      if (this.history.length > 50) this.history.pop(); // Keep last 50
      this.saveHistory();
      this.updateGallery();
    }
  }

  clearHistory() {
    if (confirm('Clear all history?')) {
      this.history = [];
      this.saveHistory();
      this.updateGallery();
    }
  }

  updateGallery() {
    const grid = document.getElementById('gallery-grid');
    if (!grid) return;
    
    grid.innerHTML = '';
    
    this.history.forEach((hex, index) => {
      const item = document.createElement('div');
      item.className = 'gallery-item';
      
      const canvas = document.createElement('canvas');
      canvas.width = 128;
      canvas.height = 128;
      const ctx = canvas.getContext('2d');
      
      try {
        const encoding = hexToEncoding(hex);
        renderToCanvas({
          context: ctx,
          width: 128,
          height: 128,
          encoding,
          hatch: true,
          margin: 5 // Use smaller margin for gallery thumbnails
        });
      } catch (err) {
        console.warn('Failed to render history item:', err);
      }
      
      item.appendChild(canvas);
      item.addEventListener('click', () => {
        this.currentEncoding = hexToEncoding(hex);
        this.render();
        this.updateControls();
      });
      
      grid.appendChild(item);
    });
  }

  // Storage
  saveHistory() {
    localStorage.setItem('lightspeed_history', JSON.stringify(this.history));
  }

  loadHistory() {
    try {
      return JSON.parse(localStorage.getItem('lightspeed_history') || '[]');
    } catch {
      return [];
    }
  }
}

// Initialize app when page loads
window.app = new LightspeedApp();

// Handle URL parameters for sharing
window.addEventListener('load', () => {
  const params = new URLSearchParams(window.location.search);
  const data = params.get('data');
  if (data) {
    try {
      window.app.currentEncoding = hexToEncoding(data);
      window.app.render();
      window.app.updateControls();
    } catch (err) {
      console.warn('Invalid shared data:', err);
    }
  }
});
