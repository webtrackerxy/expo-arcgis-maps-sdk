import { compareVersions, ensureMinimumDeploymentTarget } from '../ios';

describe('compareVersions', () => {
  it('orders by major then minor', () => {
    expect(compareVersions('17.0', '16.4')).toBeGreaterThan(0);
    expect(compareVersions('16.4', '17.0')).toBeLessThan(0);
    expect(compareVersions('17.0', '17.0')).toBe(0);
    expect(compareVersions('17.2', '17.10')).toBeLessThan(0);
  });
});

describe('ensureMinimumDeploymentTarget', () => {
  it('uses the minimum when current is missing', () => {
    expect(ensureMinimumDeploymentTarget(undefined, '17.0')).toBe('17.0');
  });

  it('raises a lower current target', () => {
    expect(ensureMinimumDeploymentTarget('15.1', '17.0')).toBe('17.0');
  });

  it('never lowers an equal or higher target', () => {
    expect(ensureMinimumDeploymentTarget('17.0', '17.0')).toBe('17.0');
    expect(ensureMinimumDeploymentTarget('18.0', '17.0')).toBe('18.0');
  });
});
