import { haversineKm } from './geo.util';

describe('haversineKm', () => {
  it('returns 0 for identical points', () => {
    expect(haversineKm(17.6688, 80.8936, 17.6688, 80.8936)).toBe(0);
  });

  it('computes a known distance within tolerance', () => {
    // Bhadrachalam (~17.6688, 80.8936) to a point ~1 km away
    const d = haversineKm(17.6688, 80.8936, 17.6778, 80.8936);
    expect(d).toBeGreaterThan(0.9);
    expect(d).toBeLessThan(1.1);
  });

  it('is symmetric', () => {
    const a = haversineKm(17.6, 80.8, 17.7, 80.9);
    const b = haversineKm(17.7, 80.9, 17.6, 80.8);
    expect(a).toBeCloseTo(b, 6);
  });
});
