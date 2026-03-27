import type { FloatingItem, Vec2, Size } from './float-types.ts';

export class FloatEngine {
  private items = new Map<string, FloatingItem>();
  private speed: number;
  private viewportWidth: number;
  private viewportHeight: number;

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
      position,
      velocity: { x: dirX * this.speed, y: dirY * this.speed },
      direction: { x: dirX, y: dirY },
      size,
      frozen: false,
      element,
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

  setViewport(width: number, height: number): void {
    this.viewportWidth = width;
    this.viewportHeight = height;
  }

  tick(): Map<string, Vec2> {
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

    // Return positions
    const positions = new Map<string, Vec2>();
    for (const item of this.items.values()) {
      positions.set(item.id, { x: item.position.x, y: item.position.y });
    }
    return positions;
  }
}
