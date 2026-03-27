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
