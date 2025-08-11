export interface VisualEffect {
  id: string;
  type: "freeze" | "shield" | "heal" | "multiply" | "explosion" | "combo";
  x: number;
  y: number;
  duration: number;
  startTime: number;
  intensity: number;
  color: string;
  size: number;
  velocity?: { x: number; y: number };
  particles?: Particle[];
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  alpha: number;
}

export class PowerUpEffectsManager {
  private effects: VisualEffect[] = [];
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private animationId: number | null = null;
  private isActive = false;

  setCanvas(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
  }

  start() {
    if (this.isActive) return;
    this.isActive = true;
    this.animate();
  }

  stop() {
    this.isActive = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  addEffect(type: VisualEffect['type'], x: number, y: number, options: Partial<VisualEffect> = {}) {
    const effect: VisualEffect = {
      id: `${type}_${Date.now()}_${Math.random()}`,
      type,
      x,
      y,
      duration: this.getDefaultDuration(type),
      startTime: Date.now(),
      intensity: 1,
      color: this.getDefaultColor(type),
      size: this.getDefaultSize(type),
      particles: this.createParticles(type, x, y),
      ...options,
    };

    this.effects.push(effect);
    return effect.id;
  }

  private getDefaultDuration(type: VisualEffect['type']): number {
    switch (type) {
      case "freeze": return 3000;
      case "shield": return 500;
      case "heal": return 1000;
      case "multiply": return 2000;
      case "explosion": return 800;
      case "combo": return 1500;
      default: return 1000;
    }
  }

  private getDefaultColor(type: VisualEffect['type']): string {
    switch (type) {
      case "freeze": return "#00BFFF";
      case "shield": return "#FFD700";
      case "heal": return "#00FF00";
      case "multiply": return "#FF69B4";
      case "explosion": return "#FF4500";
      case "combo": return "#8A2BE2";
      default: return "#FFFFFF";
    }
  }

  private getDefaultSize(type: VisualEffect['type']): number {
    switch (type) {
      case "freeze": return 150;
      case "shield": return 120;
      case "heal": return 80;
      case "multiply": return 100;
      case "explosion": return 200;
      case "combo": return 60;
      default: return 50;
    }
  }

  private createParticles(type: VisualEffect['type'], x: number, y: number): Particle[] {
    const particles: Particle[] = [];
    const count = this.getParticleCount(type);
    const color = this.getDefaultColor(type);

    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
      const speed = 2 + Math.random() * 3;
      const life = 1000 + Math.random() * 1000;

      particles.push({
        x: x + (Math.random() - 0.5) * 20,
        y: y + (Math.random() - 0.5) * 20,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life,
        maxLife: life,
        size: 3 + Math.random() * 4,
        color,
        alpha: 1,
      });
    }

    return particles;
  }

  private getParticleCount(type: VisualEffect['type']): number {
    switch (type) {
      case "freeze": return 20;
      case "shield": return 15;
      case "heal": return 12;
      case "multiply": return 25;
      case "explosion": return 30;
      case "combo": return 10;
      default: return 10;
    }
  }

  private animate = () => {
    if (!this.isActive) return;

    this.update();
    this.render();

    this.animationId = requestAnimationFrame(this.animate);
  };

  private update() {
    const now = Date.now();
    
    this.effects = this.effects.filter(effect => {
      const elapsed = now - effect.startTime;
      const progress = elapsed / effect.duration;
      
      if (progress >= 1) return false;

      // Update particles
      if (effect.particles) {
        effect.particles = effect.particles.filter(particle => {
          particle.x += particle.vx;
          particle.y += particle.vy;
          particle.life -= 16; // Assuming ~60fps
          particle.alpha = particle.life / particle.maxLife;
          
          // Apply gravity for some effects
          if (effect.type === "explosion" || effect.type === "heal") {
            particle.vy += 0.1;
          }
          
          return particle.life > 0;
        });
      }

      return true;
    });
  }

  private render() {
    if (!this.ctx || !this.canvas) return;

    this.effects.forEach(effect => {
      this.renderEffect(effect);
    });
  }

  private renderEffect(effect: VisualEffect) {
    if (!this.ctx) return;

    const now = Date.now();
    const elapsed = now - effect.startTime;
    const progress = elapsed / effect.duration;
    const alpha = 1 - progress;

    this.ctx.save();
    this.ctx.globalAlpha = alpha * effect.intensity;

    switch (effect.type) {
      case "freeze":
        this.renderFreezeEffect(effect, progress);
        break;
      case "shield":
        this.renderShieldEffect(effect, progress);
        break;
      case "heal":
        this.renderHealEffect(effect, progress);
        break;
      case "multiply":
        this.renderMultiplyEffect(effect, progress);
        break;
      case "explosion":
        this.renderExplosionEffect(effect, progress);
        break;
      case "combo":
        this.renderComboEffect(effect, progress);
        break;
    }

    // Render particles
    if (effect.particles) {
      effect.particles.forEach(particle => {
        this.ctx!.save();
        this.ctx!.globalAlpha = particle.alpha;
        this.ctx!.fillStyle = particle.color;
        this.ctx!.beginPath();
        this.ctx!.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        this.ctx!.fill();
        this.ctx!.restore();
      });
    }

    this.ctx.restore();
  }

  private renderFreezeEffect(effect: VisualEffect, progress: number) {
    if (!this.ctx) return;

    const size = effect.size * (1 + progress * 0.5);
    const pulseIntensity = Math.sin(progress * Math.PI * 8) * 0.3 + 0.7;

    // Outer glow
    this.ctx.beginPath();
    this.ctx.arc(effect.x, effect.y, size, 0, Math.PI * 2);
    this.ctx.fillStyle = `rgba(0, 191, 255, ${0.1 * pulseIntensity})`;
    this.ctx.fill();

    // Inner ring
    this.ctx.beginPath();
    this.ctx.arc(effect.x, effect.y, size * 0.7, 0, Math.PI * 2);
    this.ctx.strokeStyle = `rgba(0, 191, 255, ${0.8 * pulseIntensity})`;
    this.ctx.lineWidth = 3;
    this.ctx.stroke();

    // Snowflake pattern
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const x1 = effect.x + Math.cos(angle) * size * 0.3;
      const y1 = effect.y + Math.sin(angle) * size * 0.3;
      const x2 = effect.x + Math.cos(angle) * size * 0.6;
      const y2 = effect.y + Math.sin(angle) * size * 0.6;

      this.ctx.beginPath();
      this.ctx.moveTo(x1, y1);
      this.ctx.lineTo(x2, y2);
      this.ctx.strokeStyle = `rgba(255, 255, 255, ${0.6 * pulseIntensity})`;
      this.ctx.lineWidth = 2;
      this.ctx.stroke();
    }
  }

  private renderShieldEffect(effect: VisualEffect, progress: number) {
    if (!this.ctx) return;

    const size = effect.size * (1.2 - progress * 0.2);
    
    // Shield bubble
    this.ctx.beginPath();
    this.ctx.arc(effect.x, effect.y, size, 0, Math.PI * 2);
    this.ctx.strokeStyle = effect.color;
    this.ctx.lineWidth = 4;
    this.ctx.stroke();

    // Inner glow
    this.ctx.beginPath();
    this.ctx.arc(effect.x, effect.y, size * 0.8, 0, Math.PI * 2);
    this.ctx.fillStyle = `rgba(255, 215, 0, ${0.1})`;
    this.ctx.fill();
  }

  private renderHealEffect(effect: VisualEffect, progress: number) {
    if (!this.ctx) return;

    const size = effect.size * (0.5 + progress * 0.5);
    const crossSize = size * 0.6;

    // Green glow
    this.ctx.beginPath();
    this.ctx.arc(effect.x, effect.y, size, 0, Math.PI * 2);
    this.ctx.fillStyle = `rgba(0, 255, 0, ${0.2})`;
    this.ctx.fill();

    // Cross symbol
    this.ctx.strokeStyle = effect.color;
    this.ctx.lineWidth = 6;
    
    // Vertical line
    this.ctx.beginPath();
    this.ctx.moveTo(effect.x, effect.y - crossSize);
    this.ctx.lineTo(effect.x, effect.y + crossSize);
    this.ctx.stroke();
    
    // Horizontal line
    this.ctx.beginPath();
    this.ctx.moveTo(effect.x - crossSize, effect.y);
    this.ctx.lineTo(effect.x + crossSize, effect.y);
    this.ctx.stroke();
  }

  private renderMultiplyEffect(effect: VisualEffect, progress: number) {
    if (!this.ctx) return;

    const rotation = progress * Math.PI * 4;
    const size = effect.size * (1 + Math.sin(progress * Math.PI * 6) * 0.2);

    this.ctx.save();
    this.ctx.translate(effect.x, effect.y);
    this.ctx.rotate(rotation);

    // Star shape
    this.ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const angle = (i / 5) * Math.PI * 2 - Math.PI / 2;
      const x = Math.cos(angle) * size;
      const y = Math.sin(angle) * size;
      if (i === 0) {
        this.ctx.moveTo(x, y);
      } else {
        this.ctx.lineTo(x, y);
      }
    }
    this.ctx.closePath();
    this.ctx.fillStyle = effect.color;
    this.ctx.fill();

    this.ctx.restore();
  }

  private renderExplosionEffect(effect: VisualEffect, progress: number) {
    if (!this.ctx) return;

    const size = effect.size * progress * 2;
    const intensity = 1 - progress;

    // Expanding circle
    this.ctx.beginPath();
    this.ctx.arc(effect.x, effect.y, size, 0, Math.PI * 2);
    this.ctx.fillStyle = `rgba(255, 69, 0, ${0.3 * intensity})`;
    this.ctx.fill();

    // Shock wave
    this.ctx.beginPath();
    this.ctx.arc(effect.x, effect.y, size * 1.2, 0, Math.PI * 2);
    this.ctx.strokeStyle = `rgba(255, 165, 0, ${intensity})`;
    this.ctx.lineWidth = 3;
    this.ctx.stroke();
  }

  private renderComboEffect(effect: VisualEffect, progress: number) {
    if (!this.ctx) return;

    const pulseSize = effect.size * (1 + Math.sin(progress * Math.PI * 10) * 0.3);
    
    // Pulsing circle
    this.ctx.beginPath();
    this.ctx.arc(effect.x, effect.y, pulseSize, 0, Math.PI * 2);
    this.ctx.fillStyle = `rgba(138, 43, 226, ${0.4})`;
    this.ctx.fill();

    // Ring effect
    this.ctx.beginPath();
    this.ctx.arc(effect.x, effect.y, pulseSize * 1.2, 0, Math.PI * 2);
    this.ctx.strokeStyle = effect.color;
    this.ctx.lineWidth = 2;
    this.ctx.stroke();
  }

  // Screen shake effect
  addScreenShake(duration: number = 500, intensity: number = 10) {
    if (!this.canvas) return;
    
    const startTime = Date.now();
    const originalTransform = this.canvas.style.transform;
    
    const shake = () => {
      const elapsed = Date.now() - startTime;
      const progress = elapsed / duration;
      
      if (progress >= 1) {
        this.canvas!.style.transform = originalTransform;
        return;
      }
      
      const currentIntensity = intensity * (1 - progress);
      const x = (Math.random() - 0.5) * currentIntensity;
      const y = (Math.random() - 0.5) * currentIntensity;
      
      this.canvas!.style.transform = `translate(${x}px, ${y}px)`;
      
      requestAnimationFrame(shake);
    };
    
    shake();
  }

  // Clear all effects
  clear() {
    this.effects = [];
  }

  // Get active effects count
  getActiveEffectsCount(): number {
    return this.effects.length;
  }

  // Check if specific effect type is active
  hasActiveEffect(type: VisualEffect['type']): boolean {
    return this.effects.some(effect => effect.type === type);
  }
}

// Singleton instance
export const powerUpEffects = new PowerUpEffectsManager();