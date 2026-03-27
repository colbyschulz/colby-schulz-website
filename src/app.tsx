import { useCallback, useState } from 'react';
import { FloatProvider } from './components/float/float-provider';
import { FloatItem } from './components/float/float-item';
import { GrainOverlay } from './components/grain-overlay/grain-overlay';
import { ControlPanel } from './components/control-panel/control-panel';
import { ErrorBoundary } from './components/error-boundary/error-boundary';
import { Chat } from './components/chat/chat';
import type {
  Control,
  ControlValues,
} from './components/control-panel/control-panel.types';
import styles from './app.module.scss';

const CONTROLS: Control[] = [
  {
    type: 'slider',
    key: 'grain',
    label: 'Grain',
    min: 0,
    max: 230,
    step: 1,
    defaultValue: 50,
  },
  {
    type: 'slider',
    key: 'speed',
    label: 'Speed',
    min: 0,
    max: 20,
    step: 0.5,
    defaultValue: 2,
  },
];

const DEFAULT_VALUES: ControlValues = Object.fromEntries(
  CONTROLS.map((c) => [c.key, c.defaultValue]),
);

function App() {
  const [controlValues, setControlValues] =
    useState<ControlValues>(DEFAULT_VALUES);

  const handleChange = useCallback((key: string, value: number) => {
    setControlValues((prev) => ({ ...prev, [key]: value }));
  }, []);

  return (
    <ErrorBoundary>
      <div className={styles.container}>
        <FloatProvider speed={controlValues.speed}>
          <FloatItem freezeOnHover>
            <h1 className={styles.bouncingText}>Colby Schulz 1</h1>
          </FloatItem>
          <FloatItem freezeOnHover>
            <h1 className={styles.bouncingText}>Colby Schulz 2</h1>
          </FloatItem>
          <FloatItem freezeOnHover>
            <Chat />
          </FloatItem>
        </FloatProvider>
      </div>

      <GrainOverlay opacity={controlValues.grain} />

      <ControlPanel
        controls={CONTROLS}
        values={controlValues}
        onChange={handleChange}
      />
    </ErrorBoundary>
  );
}

export default App;
