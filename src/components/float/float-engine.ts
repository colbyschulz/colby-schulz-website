import type { FloatingItem, Vec2, Size } from './float-types.ts';

export class FloatEngine {
  private items = new Map<string, FloatingItem>();
  private speed: number;
  private viewportWidth: number;
  private viewportHeight: number;
  private returning = false;
  private onReturnComplete: (() => void) | null = null;

  constructor(speed: number, viewportWidth: number, viewportHeight: number) {
    this.speed = speed;
    this.viewportWidth = viewportWidth;
    this.viewportHeight = viewportHeight;
  }

  register(
    id: string,
    size: Size,
    initialPosition?: Vec2,
    element: HTMLElement | null = null,
  ): void {
    const maxX = this.viewportWidth - size.width;
    const maxY = this.viewportHeight - size.height;
    const position = initialPosition ?? {
      x: Math.random() * Math.max(0, maxX),
      y: Math.random() * Math.max(0, maxY),
    };
    const dirX = Math.random() > 0.5 ? 1 : -1;
    const dirY = Math.random() > 0.5 ? 1 : -1;

    this.items.set(id, {
      id,
      position: { ...position },
      velocity: { x: dirX * this.speed, y: dirY * this.speed },
      direction: { x: dirX, y: dirY },
      size,
      frozen: false,
      element,
      homePosition: { ...position },
    });
  }

  unregister(id: string): void {
    this.items.delete(id);
  }

  getItem(id: string): FloatingItem | undefined {
    return this.items.get(id);
  }

  setFrozen(id: string, frozen: boolean): void {
    const item = this.items.get(id);
    if (!item) return;

    if (frozen) {
      item.velocity = { x: 0, y: 0 };
    } else {
      item.velocity = {
        x: item.direction.x * this.speed,
        y: item.direction.y * this.speed,
      };
    }
    item.frozen = frozen;
  }

  setSpeed(speed: number): void {
    this.speed = speed;
    for (const item of this.items.values()) {
      if (!item.frozen) {
        item.velocity = {
          x: item.direction.x * speed,
          y: item.direction.y * speed,
        };
      }
    }
  }

  setSize(id: string, size: Size): void {
    const item = this.items.get(id);
    if (!item) return;
    item.size = size;
  }

  setViewport(width: number, height: number): void {
    this.viewportWidth = width;
    this.viewportHeight = height;
  }

  returnHome(onComplete?: () => void): void {
    this.returning = true;
    this.onReturnComplete = onComplete ?? null;
  }

  isReturning(): boolean {
    return this.returning;
  }

  private resolveItemCollisions(): void {
    const items = Array.from(this.items.values());
    for (let i = 0; i < items.length; i++) {
      for (let j = i + 1; j < items.length; j++) {
        const a = items[i];
        const b = items[j];

        // AABB overlap check
        const overlapX =
          a.position.x < b.position.x + b.size.width &&
          a.position.x + a.size.width > b.position.x;
        const overlapY =
          a.position.y < b.position.y + b.size.height &&
          a.position.y + a.size.height > b.position.y;

        if (!overlapX || !overlapY) continue;

        // Calculate overlap depth on each axis
        const overlapLeft = a.position.x + a.size.width - b.position.x;
        const overlapRight = b.position.x + b.size.width - a.position.x;
        const overlapTop = a.position.y + a.size.height - b.position.y;
        const overlapBottom = b.position.y + b.size.height - a.position.y;

        const minOverlapX = Math.min(overlapLeft, overlapRight);
        const minOverlapY = Math.min(overlapTop, overlapBottom);

        // Resolve on axis of least penetration
        if (minOverlapX < minOverlapY) {
          if (!a.frozen) {
            a.velocity.x *= -1;
            a.direction.x *= -1;
          }
          if (!b.frozen) {
            b.velocity.x *= -1;
            b.direction.x *= -1;
          }
          // Separate items
          const push = minOverlapX / 2;
          if (!a.frozen && !b.frozen) {
            a.position.x += overlapLeft < overlapRight ? -push : push;
            b.position.x += overlapLeft < overlapRight ? push : -push;
          } else if (!a.frozen) {
            a.position.x += overlapLeft < overlapRight ? -minOverlapX : minOverlapX;
          } else if (!b.frozen) {
            b.position.x += overlapLeft < overlapRight ? minOverlapX : -minOverlapX;
          }
        } else {
          if (!a.frozen) {
            a.velocity.y *= -1;
            a.direction.y *= -1;
          }
          if (!b.frozen) {
            b.velocity.y *= -1;
            b.direction.y *= -1;
          }
          const push = minOverlapY / 2;
          if (!a.frozen && !b.frozen) {
            a.position.y += overlapTop < overlapBottom ? -push : push;
            b.position.y += overlapTop < overlapBottom ? push : -push;
          } else if (!a.frozen) {
            a.position.y += overlapTop < overlapBottom ? -minOverlapY : minOverlapY;
          } else if (!b.frozen) {
            b.position.y += overlapTop < overlapBottom ? minOverlapY : -minOverlapY;
          }
        }
      }
    }
  }

  private tickReturnHome(): Map<string, Vec2> {
    let allHome = true;
    const lerpFactor = 0.08;
    const snapThreshold = 0.5;

    for (const item of this.items.values()) {
      const dx = item.homePosition.x - item.position.x;
      const dy = item.homePosition.y - item.position.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < snapThreshold) {
        item.position.x = item.homePosition.x;
        item.position.y = item.homePosition.y;
        item.velocity = { x: 0, y: 0 };
      } else {
        allHome = false;
        item.position.x += dx * lerpFactor;
        item.position.y += dy * lerpFactor;
      }
    }

    if (allHome) {
      this.returning = false;
      this.speed = 0;
      for (const item of this.items.values()) {
        item.velocity = { x: 0, y: 0 };
      }
      this.onReturnComplete?.();
      this.onReturnComplete = null;
    }

    const positions = new Map<string, Vec2>();
    for (const item of this.items.values()) {
      positions.set(item.id, { x: item.position.x, y: item.position.y });
    }
    return positions;
  }

  tick(): Map<string, Vec2> {
    if (this.returning) {
      return this.tickReturnHome();
    }

    // Move non-frozen items
    for (const item of this.items.values()) {
      if (item.frozen) continue;
      item.position.x += item.velocity.x;
      item.position.y += item.velocity.y;
    }

    // Edge collisions
    for (const item of this.items.values()) {
      const maxX = this.viewportWidth - item.size.width;
      const maxY = this.viewportHeight - item.size.height;

      if (item.position.x <= 0 || item.position.x >= maxX) {
        if (!item.frozen) {
          item.velocity.x *= -1;
          item.direction.x *= -1;
        }
        item.position.x = Math.max(0, Math.min(item.position.x, maxX));
      }
      if (item.position.y <= 0 || item.position.y >= maxY) {
        if (!item.frozen) {
          item.velocity.y *= -1;
          item.direction.y *= -1;
        }
        item.position.y = Math.max(0, Math.min(item.position.y, maxY));
      }
    }

    // Item-item collisions
    this.resolveItemCollisions();

    // Return positions
    const positions = new Map<string, Vec2>();
    for (const item of this.items.values()) {
      positions.set(item.id, { x: item.position.x, y: item.position.y });
    }
    return positions;
  }
}
