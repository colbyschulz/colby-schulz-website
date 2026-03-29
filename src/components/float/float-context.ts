import { createContext } from 'react';
import type { FloatContextValue } from './float-types.ts';

const noop = () => {};

export const FloatContext = createContext<FloatContextValue>({
  register: noop,
  unregister: noop,
  setFrozen: noop,
  setSize: noop,
  setHome: noop,
  returnHome: noop,
});
