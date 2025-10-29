declare module 'jest-axe' {
  export function axe(container: HTMLElement, config?: unknown): Promise<unknown>;
  export const toHaveNoViolations: jest.CustomMatcher;
}
