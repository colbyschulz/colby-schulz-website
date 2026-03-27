import { describe, it, expect } from 'vitest';
import { FloatEngine } from '../float-engine.ts';

describe('FloatEngine', () => {
  describe('register / unregister', () => {
    it('registers an item and returns it in tick positions', () => {
      const engine = new FloatEngine(2, 800, 600);
      engine.register('a', { width: 100, height: 50 }, { x: 10, y: 10 });

      const positions = engine.tick();

      expect(positions.get('a')).toBeDefined();
    });

    it('unregisters an item so it no longer appears in tick', () => {
      const engine = new FloatEngine(2, 800, 600);
      engine.register('a', { width: 100, height: 50 }, { x: 10, y: 10 });
      engine.unregister('a');

      const positions = engine.tick();

      expect(positions.get('a')).toBeUndefined();
    });
  });

  describe('movement', () => {
    it('moves an item by its velocity each tick', () => {
      const engine = new FloatEngine(2, 800, 600);
      engine.register('a', { width: 100, height: 50 }, { x: 100, y: 100 });

      const item = engine.getItem('a')!;
      const startX = item.position.x;
      const startY = item.position.y;
      const vx = item.velocity.x;
      const vy = item.velocity.y;

      engine.tick();

      expect(item.position.x).toBe(startX + vx);
      expect(item.position.y).toBe(startY + vy);
    });
  });

  describe('item-item collision', () => {
    it('reverses velocity when two items overlap', () => {
      const engine = new FloatEngine(2, 800, 600);
      // Place two items overlapping horizontally
      engine.register('a', { width: 100, height: 50 }, { x: 100, y: 100 });
      engine.register('b', { width: 100, height: 50 }, { x: 190, y: 100 });

      const a = engine.getItem('a')!;
      const b = engine.getItem('b')!;
      // a moving right, b moving left — they will collide
      a.velocity = { x: 2, y: 0 };
      a.direction = { x: 1, y: 1 };
      b.velocity = { x: -2, y: 0 };
      b.direction = { x: -1, y: 1 };

      engine.tick();

      // After collision on x-axis, x velocities should reverse
      expect(a.velocity.x).toBeLessThan(0);
      expect(b.velocity.x).toBeGreaterThan(0);
    });

    it('bounces a moving item off a frozen item', () => {
      const engine = new FloatEngine(2, 800, 600);
      engine.register('a', { width: 100, height: 50 }, { x: 100, y: 100 });
      engine.register('b', { width: 100, height: 50 }, { x: 190, y: 100 });

      const a = engine.getItem('a')!;
      a.velocity = { x: 2, y: 0 };
      a.direction = { x: 1, y: 1 };

      engine.setFrozen('b', true);
      const bPosBefore = { ...engine.getItem('b')!.position };

      engine.tick();

      // a should bounce
      expect(a.velocity.x).toBeLessThan(0);
      // b should not have moved
      const bPosAfter = engine.getItem('b')!.position;
      expect(bPosAfter.x).toBe(bPosBefore.x);
      expect(bPosAfter.y).toBe(bPosBefore.y);
    });
  });

  describe('freeze', () => {
    it('stops a frozen item from moving', () => {
      const engine = new FloatEngine(2, 800, 600);
      engine.register('a', { width: 100, height: 50 }, { x: 100, y: 100 });

      engine.setFrozen('a', true);
      const posBefore = { ...engine.getItem('a')!.position };

      engine.tick();

      const posAfter = engine.getItem('a')!.position;
      expect(posAfter.x).toBe(posBefore.x);
      expect(posAfter.y).toBe(posBefore.y);
    });

    it('resumes in the same direction after unfreeze', () => {
      const engine = new FloatEngine(2, 800, 600);
      engine.register('a', { width: 100, height: 50 }, { x: 200, y: 200 });

      const item = engine.getItem('a')!;
      // Force a known direction
      item.velocity = { x: 2, y: -2 };
      item.direction = { x: 1, y: -1 };

      engine.setFrozen('a', true);
      expect(item.velocity.x).toBe(0);
      expect(item.velocity.y).toBe(0);
      // Direction preserved
      expect(item.direction.x).toBe(1);
      expect(item.direction.y).toBe(-1);

      engine.setFrozen('a', false);
      expect(item.velocity.x).toBe(2);
      expect(item.velocity.y).toBe(-2);
    });
  });

  describe('setSpeed', () => {
    it('updates velocity of non-frozen items', () => {
      const engine = new FloatEngine(2, 800, 600);
      engine.register('a', { width: 100, height: 50 }, { x: 100, y: 100 });

      const item = engine.getItem('a')!;
      item.direction = { x: 1, y: -1 };

      engine.setSpeed(5);

      expect(item.velocity.x).toBe(5);
      expect(item.velocity.y).toBe(-5);
    });

    it('does not change velocity of frozen items', () => {
      const engine = new FloatEngine(2, 800, 600);
      engine.register('a', { width: 100, height: 50 }, { x: 100, y: 100 });

      engine.setFrozen('a', true);
      engine.setSpeed(5);

      const item = engine.getItem('a')!;
      expect(item.velocity.x).toBe(0);
      expect(item.velocity.y).toBe(0);
    });

    it('uses new speed when unfreezing after speed change', () => {
      const engine = new FloatEngine(2, 800, 600);
      engine.register('a', { width: 100, height: 50 }, { x: 100, y: 100 });

      const item = engine.getItem('a')!;
      item.direction = { x: 1, y: 1 };

      engine.setFrozen('a', true);
      engine.setSpeed(7);
      engine.setFrozen('a', false);

      expect(item.velocity.x).toBe(7);
      expect(item.velocity.y).toBe(7);
    });
  });

  describe('edge collision', () => {
    it('reverses x velocity when hitting the right edge', () => {
      const engine = new FloatEngine(2, 800, 600);
      // Place item right at the edge: viewport 800, item width 100, so max x = 700
      engine.register('a', { width: 100, height: 50 }, { x: 699, y: 100 });

      const item = engine.getItem('a')!;
      // Force velocity to the right
      item.velocity.x = Math.abs(item.velocity.x);
      item.direction.x = 1;

      engine.tick();

      expect(item.velocity.x).toBeLessThan(0);
      expect(item.position.x).toBeLessThanOrEqual(700);
    });

    it('reverses y velocity when hitting the bottom edge', () => {
      const engine = new FloatEngine(2, 800, 600);
      // Max y = 600 - 50 = 550
      engine.register('a', { width: 100, height: 50 }, { x: 100, y: 549 });

      const item = engine.getItem('a')!;
      item.velocity.y = Math.abs(item.velocity.y);
      item.direction.y = 1;

      engine.tick();

      expect(item.velocity.y).toBeLessThan(0);
      expect(item.position.y).toBeLessThanOrEqual(550);
    });

    it('reverses velocity when hitting the top/left edge', () => {
      const engine = new FloatEngine(2, 800, 600);
      engine.register('a', { width: 100, height: 50 }, { x: 1, y: 1 });

      const item = engine.getItem('a')!;
      item.velocity.x = -Math.abs(item.velocity.x);
      item.velocity.y = -Math.abs(item.velocity.y);
      item.direction.x = -1;
      item.direction.y = -1;

      engine.tick();

      expect(item.velocity.x).toBeGreaterThan(0);
      expect(item.velocity.y).toBeGreaterThan(0);
      expect(item.position.x).toBeGreaterThanOrEqual(0);
      expect(item.position.y).toBeGreaterThanOrEqual(0);
    });
  });
});
