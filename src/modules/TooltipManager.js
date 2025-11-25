export class TooltipManager {
  constructor() {
    this.tooltip = null;
    this.currentElement = null;
    this.mouseX = 0;
    this.mouseY = 0;
    this.showTimeout = null;
  }

  initialize() {
    this.createTooltip();
    this.attachListeners();
  }

  createTooltip() {
    this.tooltip = document.createElement('div');
    this.tooltip.className = 'custom-tooltip';
    this.tooltip.style.cssText = `
      position: fixed;
      background-color: var(--bg-tertiary);
      color: var(--text-primary);
      border: 1px solid var(--border-color);
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      white-space: nowrap;
      opacity: 0;
      pointer-events: none;
      z-index: 10000;
      transition: opacity 0.2s ease;
    `;
    document.body.appendChild(this.tooltip);
  }

  attachListeners() {
    document.addEventListener('mouseover', (e) => {
      const element = e.target.closest('[data-tooltip]');
      if (element && element !== this.currentElement) {
        this.showTooltip(element);
      }
    });

    document.addEventListener('mouseout', (e) => {
      const element = e.target.closest('[data-tooltip]');
      if (element && element === this.currentElement) {
        const relatedTarget = e.relatedTarget;
        if (!element.contains(relatedTarget)) {
          this.hideTooltip();
        }
      }
    });
  }

  showTooltip(element) {
    this.currentElement = element;
    const text = element.getAttribute('data-tooltip');
    this.tooltip.textContent = text;

    this.showTimeout = setTimeout(() => {
      this.updatePosition(element);
      this.tooltip.style.opacity = '1';
    }, 300);
  }

  hideTooltip() {
    if (this.showTimeout) {
      clearTimeout(this.showTimeout);
      this.showTimeout = null;
    }
    this.currentElement = null;
    this.tooltip.style.opacity = '0';
  }

  updatePosition(element) {
    const rect = element.getBoundingClientRect();

    const left = rect.left + rect.width * 0.6;
    const top = rect.bottom + 8;

    this.tooltip.style.left = `${left}px`;
    this.tooltip.style.top = `${top}px`;
  }
}
