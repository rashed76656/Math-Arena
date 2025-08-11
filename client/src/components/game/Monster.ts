import { Monster as MonsterType } from "../../lib/stores/useGameState";
import { CANVAS_WIDTH, CANVAS_HEIGHT, moveTowardsTarget, Point } from "../../lib/gameUtils";

export class Monster {
  public data: MonsterType;
  private lastUpdateTime: number = 0;
  private spawnTime: number;

  constructor(monsterData: MonsterType) {
    this.data = { ...monsterData };
    this.spawnTime = Date.now();
  }

  update(deltaTime: number, playerPosition: Point): MonsterType {
    // Update target to player position
    this.data.targetX = playerPosition.x;
    this.data.targetY = playerPosition.y;

    // Calculate how much time has elapsed since spawn
    const currentTime = Date.now();
    const elapsedTime = currentTime - this.spawnTime;
    const totalTravelTime = 5000; // 5 seconds in milliseconds

    // Calculate progress (0 to 1) based on time, not movement
    const progress = Math.min(elapsedTime / totalTravelTime, 1);

    // Get the spawn point (stored in the monster data if available, otherwise calculate)
    if (!this.data.spawnX || !this.data.spawnY) {
      this.data.spawnX = this.data.x;
      this.data.spawnY = this.data.y;
    }

    // Linear interpolation from spawn point to target based on time progress
    this.data.x = this.data.spawnX + (this.data.targetX - this.data.spawnX) * progress;
    this.data.y = this.data.spawnY + (this.data.targetY - this.data.spawnY) * progress;

    return this.data;
  }

  takeDamage(amount: number): boolean {
    this.data.health = Math.max(0, this.data.health - amount);
    return this.data.health <= 0;
  }

  isAttacking(playerPosition: Point, playerRadius: number): boolean {
    const distance = Math.sqrt(
      Math.pow(this.data.x - playerPosition.x, 2) + Math.pow(this.data.y - playerPosition.y, 2)
    );
    return distance <= this.data.size + playerRadius;
  }

  render(ctx: CanvasRenderingContext2D): void {
    const { x, y, size, color, health, maxHealth, type, equation, isDestroying, destructionStartTime } = this.data;

    // Handle destruction animation with enhanced effects
    if (isDestroying && destructionStartTime) {
      const elapsed = Date.now() - destructionStartTime;
      const animationDuration = 800; // Extended to 800ms for better effect
      const progress = Math.min(elapsed / animationDuration, 1);

      ctx.save();

      // Multi-stage explosion effect
      if (progress < 0.9) {
        // Stage 1: Initial flash (0-20%)
        if (progress < 0.2) {
          ctx.globalAlpha = 1 - (progress / 0.2);
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(x, y, size * (3 + progress * 2), 0, Math.PI * 2);
          ctx.fill();
        }

        // Stage 2: Colorful particle explosion (10-70%)
        if (progress > 0.1 && progress < 0.7) {
          const particleProgress = (progress - 0.1) / 0.6;
          for (let i = 0; i < 24; i++) {
            const angle = (i / 24) * Math.PI * 2;
            const distance = particleProgress * 120 * (0.8 + Math.random() * 0.4);
            const particleX = x + Math.cos(angle) * distance;
            const particleY = y + Math.sin(angle) * distance;

            // Enhanced particle variety
            const particleColors = [
              '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57',
              '#ff9ff3', '#54a0ff', '#5f27cd', '#00d2d3', '#ff9f43'
            ];
            const particleSize = 8 * (1 - particleProgress) * (0.5 + Math.random() * 0.5);

            ctx.fillStyle = particleColors[i % particleColors.length];
            ctx.globalAlpha = (1 - particleProgress) * 0.9;

            ctx.beginPath();
            ctx.arc(particleX, particleY, particleSize, 0, Math.PI * 2);
            ctx.fill();

            // Add sparkle effects
            if (Math.random() < 0.3) {
              ctx.strokeStyle = '#ffffff';
              ctx.lineWidth = 2;
              ctx.beginPath();
              ctx.moveTo(particleX - 5, particleY);
              ctx.lineTo(particleX + 5, particleY);
              ctx.moveTo(particleX, particleY - 5);
              ctx.lineTo(particleX, particleY + 5);
              ctx.stroke();
            }
          }
        }

        // Stage 3: Glowing rings (50-90%)
        if (progress > 0.5 && progress < 0.9) {
          const ringProgress = (progress - 0.5) / 0.4;
          for (let ring = 0; ring < 3; ring++) {
            const ringRadius = size * (1 + ring * 0.5) * (1 + ringProgress * 3);
            const ringAlpha = (1 - ringProgress) * (0.7 - ring * 0.2);

            ctx.globalAlpha = ringAlpha;
            ctx.strokeStyle = ring % 2 === 0 ? '#4ade80' : '#f59e0b';
            ctx.lineWidth = 6 - ring * 2;
            ctx.beginPath();
            ctx.arc(x, y, ringRadius, 0, Math.PI * 2);
            ctx.stroke();
          }
        }
      }

      ctx.restore();
      return; // Skip normal rendering during destruction
    }

    ctx.save();

    // Monster base shape with enhanced visuals
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, size);

    // Color variations based on type
    switch (type) {
      case "basic":
        gradient.addColorStop(0, "#ff7b7b");
        gradient.addColorStop(0.7, "#e63946");
        gradient.addColorStop(1, "#a61e1e");
        break;
      case "fast":
        gradient.addColorStop(0, "#ffd23f");
        gradient.addColorStop(0.7, "#ffb300");
        gradient.addColorStop(1, "#cc8900");
        break;
      case "tank":
        gradient.addColorStop(0, "#7b68ee");
        gradient.addColorStop(0.7, "#6a4c93");
        gradient.addColorStop(1, "#2d1b69");
        break;
      default:
        gradient.addColorStop(0, color);
        gradient.addColorStop(1, "#666666");
    }

    // Monster glow effect
    ctx.shadowColor = color;
    ctx.shadowBlur = 15;
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Monster border
    ctx.strokeStyle = "#333333";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.stroke();

    // Unique visual design for each monster type
    switch (type) {
      case "basic":
        // Basic monster - Simple round eyes with angry expression
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(x - size * 0.25, y - size * 0.15, size * 0.12, 0, Math.PI * 2);
        ctx.arc(x + size * 0.25, y - size * 0.15, size * 0.12, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#000000";
        ctx.beginPath();
        ctx.arc(x - size * 0.25, y - size * 0.15, size * 0.06, 0, Math.PI * 2);
        ctx.arc(x + size * 0.25, y - size * 0.15, size * 0.06, 0, Math.PI * 2);
        ctx.fill();

        // Angry eyebrows
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x - size * 0.4, y - size * 0.35);
        ctx.lineTo(x - size * 0.1, y - size * 0.25);
        ctx.moveTo(x + size * 0.1, y - size * 0.25);
        ctx.lineTo(x + size * 0.4, y - size * 0.35);
        ctx.stroke();

        // Simple mouth
        ctx.fillStyle = "#000000";
        ctx.fillRect(x - size * 0.2, y + size * 0.1, size * 0.4, size * 0.1);
        break;

      case "fast":
        // Fast monster - Lightning bolt eyes and spiky design
        ctx.fillStyle = "#ffff00";

        // Lightning bolt left eye
        ctx.beginPath();
        ctx.moveTo(x - size * 0.35, y - size * 0.3);
        ctx.lineTo(x - size * 0.15, y - size * 0.3);
        ctx.lineTo(x - size * 0.25, y - size * 0.1);
        ctx.lineTo(x - size * 0.1, y - size * 0.1);
        ctx.lineTo(x - size * 0.3, y + size * 0.1);
        ctx.lineTo(x - size * 0.2, y - size * 0.05);
        ctx.lineTo(x - size * 0.35, y - size * 0.05);
        ctx.closePath();
        ctx.fill();

        // Lightning bolt right eye
        ctx.beginPath();
        ctx.moveTo(x + size * 0.35, y - size * 0.3);
        ctx.lineTo(x + size * 0.15, y - size * 0.3);
        ctx.lineTo(x + size * 0.25, y - size * 0.1);
        ctx.lineTo(x + size * 0.1, y - size * 0.1);
        ctx.lineTo(x + size * 0.3, y + size * 0.1);
        ctx.lineTo(x + size * 0.2, y - size * 0.05);
        ctx.lineTo(x + size * 0.35, y - size * 0.05);
        ctx.closePath();
        ctx.fill();

        // Speed lines around the monster
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2;
        for (let i = 0; i < 8; i++) {
          const angle = (i / 8) * Math.PI * 2;
          const startX = x + Math.cos(angle) * (size + 5);
          const startY = y + Math.sin(angle) * (size + 5);
          const endX = x + Math.cos(angle) * (size + 15);
          const endY = y + Math.sin(angle) * (size + 15);

          ctx.beginPath();
          ctx.moveTo(startX, startY);
          ctx.lineTo(endX, endY);
          ctx.stroke();
        }

        // Jagged mouth
        ctx.fillStyle = "#000000";
        ctx.beginPath();
        ctx.moveTo(x - size * 0.3, y + size * 0.2);
        for (let i = 0; i <= 6; i++) {
          const px = x - size * 0.3 + (i * size * 0.1);
          const py = y + size * 0.2 + (i % 2 === 0 ? 0 : size * 0.05);
          ctx.lineTo(px, py);
        }
        ctx.lineTo(x - size * 0.3, y + size * 0.3);
        ctx.closePath();
        ctx.fill();
        break;

      case "tank":
        // Tank monster - Shield-like eyes and armored appearance
        ctx.fillStyle = "#c0c0c0";

        // Shield-shaped eyes
        ctx.beginPath();
        ctx.moveTo(x - size * 0.3, y - size * 0.3);
        ctx.lineTo(x - size * 0.15, y - size * 0.3);
        ctx.lineTo(x - size * 0.1, y - size * 0.05);
        ctx.lineTo(x - size * 0.225, y + size * 0.05);
        ctx.lineTo(x - size * 0.35, y - size * 0.05);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(x + size * 0.3, y - size * 0.3);
        ctx.lineTo(x + size * 0.15, y - size * 0.3);
        ctx.lineTo(x + size * 0.1, y - size * 0.05);
        ctx.lineTo(x + size * 0.225, y + size * 0.05);
        ctx.lineTo(x + size * 0.35, y - size * 0.05);
        ctx.closePath();
        ctx.fill();

        // Red glowing centers
        ctx.fillStyle = "#ff0000";
        ctx.beginPath();
        ctx.arc(x - size * 0.225, y - size * 0.1, size * 0.05, 0, Math.PI * 2);
        ctx.arc(x + size * 0.225, y - size * 0.1, size * 0.05, 0, Math.PI * 2);
        ctx.fill();

        // Armor plating lines
        ctx.strokeStyle = "#666666";
        ctx.lineWidth = 2;
        for (let i = -2; i <= 2; i++) {
          ctx.beginPath();
          ctx.moveTo(x - size * 0.4, y + i * size * 0.15);
          ctx.lineTo(x + size * 0.4, y + i * size * 0.15);
          ctx.stroke();
        }

        // Rectangular mouth (like a tank viewport)
        ctx.fillStyle = "#000000";
        ctx.fillRect(x - size * 0.25, y + size * 0.15, size * 0.5, size * 0.12);
        ctx.strokeStyle = "#c0c0c0";
        ctx.lineWidth = 2;
        ctx.strokeRect(x - size * 0.25, y + size * 0.15, size * 0.5, size * 0.12);
        break;

      case "boss":
        // Boss monster - Crown, multiple eyes, and intimidating features
        // Crown
        ctx.fillStyle = "#ffd700";
        ctx.beginPath();
        ctx.moveTo(x - size * 0.4, y - size * 0.5);
        ctx.lineTo(x - size * 0.3, y - size * 0.7);
        ctx.lineTo(x - size * 0.15, y - size * 0.6);
        ctx.lineTo(x, y - size * 0.8);
        ctx.lineTo(x + size * 0.15, y - size * 0.6);
        ctx.lineTo(x + size * 0.3, y - size * 0.7);
        ctx.lineTo(x + size * 0.4, y - size * 0.5);
        ctx.lineTo(x + size * 0.4, y - size * 0.4);
        ctx.lineTo(x - size * 0.4, y - size * 0.4);
        ctx.closePath();
        ctx.fill();

        // Crown gems
        ctx.fillStyle = "#ff0000";
        ctx.beginPath();
        ctx.arc(x - size * 0.2, y - size * 0.55, size * 0.04, 0, Math.PI * 2);
        ctx.arc(x, y - size * 0.65, size * 0.05, 0, Math.PI * 2);
        ctx.arc(x + size * 0.2, y - size * 0.55, size * 0.04, 0, Math.PI * 2);
        ctx.fill();

        // Multiple eyes (3 eyes)
        ctx.fillStyle = "#ff0000";
        ctx.beginPath();
        ctx.arc(x - size * 0.25, y - size * 0.15, size * 0.08, 0, Math.PI * 2);
        ctx.arc(x, y - size * 0.25, size * 0.1, 0, Math.PI * 2);
        ctx.arc(x + size * 0.25, y - size * 0.15, size * 0.08, 0, Math.PI * 2);
        ctx.fill();

        // Eye pupils
        ctx.fillStyle = "#000000";
        ctx.beginPath();
        ctx.arc(x - size * 0.25, y - size * 0.15, size * 0.04, 0, Math.PI * 2);
        ctx.arc(x, y - size * 0.25, size * 0.05, 0, Math.PI * 2);
        ctx.arc(x + size * 0.25, y - size * 0.15, size * 0.04, 0, Math.PI * 2);
        ctx.fill();

        // Menacing mouth with fangs
        ctx.fillStyle = "#000000";
        ctx.beginPath();
        ctx.arc(x, y + size * 0.2, size * 0.25, 0, Math.PI);
        ctx.fill();

        // Fangs
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.moveTo(x - size * 0.15, y + size * 0.2);
        ctx.lineTo(x - size * 0.1, y + size * 0.35);
        ctx.lineTo(x - size * 0.05, y + size * 0.2);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(x + size * 0.05, y + size * 0.2);
        ctx.lineTo(x + size * 0.1, y + size * 0.35);
        ctx.lineTo(x + size * 0.15, y + size * 0.2);
        ctx.closePath();
        ctx.fill();

        // Boss aura effect
        ctx.strokeStyle = "#7c3aed";
        ctx.lineWidth = 3;
        ctx.shadowColor = "#7c3aed";
        ctx.shadowBlur = 10;
        for (let ring = 1; ring <= 3; ring++) {
          ctx.beginPath();
          ctx.arc(x, y, size + ring * 8, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.shadowBlur = 0;
        break;

      default:
        // Fallback to basic design
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(x - size * 0.3, y - size * 0.2, size * 0.15, 0, Math.PI * 2);
        ctx.arc(x + size * 0.3, y - size * 0.2, size * 0.15, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#000000";
        ctx.beginPath();
        ctx.arc(x - size * 0.3, y - size * 0.2, size * 0.08, 0, Math.PI * 2);
        ctx.arc(x + size * 0.3, y - size * 0.2, size * 0.08, 0, Math.PI * 2);
        ctx.fill();
        break;
    }

    // Health bar
    if (health < maxHealth) {
      const barWidth = size * 1.5;
      const barHeight = 6;
      const barX = x - barWidth / 2;
      const barY = y - size - 15;

      // Background
      ctx.fillStyle = "#333333";
      ctx.fillRect(barX, barY, barWidth, barHeight);

      // Health fill
      const healthPercent = health / maxHealth;
      const healthWidth = barWidth * healthPercent;

      if (healthPercent > 0.5) ctx.fillStyle = "#4ade80";
      else if (healthPercent > 0.25) ctx.fillStyle = "#fbbf24";
      else ctx.fillStyle = "#ef4444";

      ctx.fillRect(barX, barY, healthWidth, barHeight);

      // Border
      ctx.strokeStyle = "#666666";
      ctx.lineWidth = 1;
      ctx.strokeRect(barX, barY, barWidth, barHeight);
    }

    // Display equation if available
    if (equation) {
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 14px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.strokeStyle = "#000000";
      ctx.lineWidth = 3;
      ctx.strokeText(equation, x, y + size + 20);
      ctx.fillText(equation, x, y + size + 20);
    }

    ctx.restore();
  }

  private getMonsterIcon(): string {
    // Different icons based on monster type and difficulty
    const iconsByType = {
      basic: ["👾", "🤖", "👹", "🎃", "👻"],
      fast: ["⚡", "💨", "🏃", "🦅", "🐆"],
      tank: ["🛡️", "🏰", "🦏", "🐘", "⚔️"],
      boss: ["🐲", "🦖", "👑", "💀", "🔥"]
    };

    const typeIcons = iconsByType[this.data.type] || iconsByType.basic;
    return typeIcons[Math.floor(Math.random() * typeIcons.length)];
  }
}