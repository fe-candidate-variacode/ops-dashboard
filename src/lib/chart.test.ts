import { autoDomain, buildLineGeometry } from './chart';

const options = { width: 100, height: 50, capacity: 5, min: 0, max: 100 };

describe('buildLineGeometry', () => {
  it('returns empty paths without data', () => {
    expect(buildLineGeometry([], options)).toEqual({ line: '', area: '' });
  });

  it('pins the newest sample to the right edge and scrolls older ones left', () => {
    const { line } = buildLineGeometry([0, 100], options);

    // step = 100 / (5 - 1) = 25; newest at x=100, previous at x=75.
    expect(line).toBe('M 75 50 L 100 0');
  });

  it('maps higher values to a smaller y (towards the top)', () => {
    const { line } = buildLineGeometry([25, 75], options);

    expect(line).toBe('M 75 37.5 L 100 12.5');
  });

  it('clamps values outside the domain', () => {
    const { line } = buildLineGeometry([-50, 500], options);

    expect(line).toBe('M 75 50 L 100 0');
  });

  it('closes the area down to the baseline', () => {
    const { area } = buildLineGeometry([0, 100], options);

    expect(area).toBe('M 75 50 L 100 0 L 100 50 L 75 50 Z');
  });

  it('survives a flat domain without dividing by zero', () => {
    const { line } = buildLineGeometry([10], { ...options, min: 10, max: 10 });

    expect(line).toBe('M 100 50');
  });
});

describe('autoDomain', () => {
  it('starts at zero and never goes below the minimum ceiling', () => {
    expect(autoDomain([10, 20])).toEqual([0, 100]);
  });

  it('rounds the ceiling up with headroom for large values', () => {
    expect(autoDomain([100, 740])).toEqual([0, 850]);
  });

  it('handles an empty series', () => {
    expect(autoDomain([])).toEqual([0, 100]);
  });
});
