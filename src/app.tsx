import { useCallback, useState } from 'react';
import { FloatProvider } from './components/float/float-provider';
import { FloatItem } from './components/float/float-item';
import { GrainOverlay } from './components/grain-overlay/grain-overlay';
import { ControlPanel } from './components/control-panel/control-panel';
import { ErrorBoundary } from './components/error-boundary/error-boundary';
import { Chat } from './components/chat/chat';
import { Modal } from './components/modal/modal';
import type { ModalOrigin } from './components/modal/modal.types';
import type {
  Control,
  ControlValues,
} from './components/control-panel/control-panel.types';
import type { ComponentType } from 'react';
import styles from './app.module.scss';

interface FloatItemConfig {
  key: string;
  label: string;
  freezeOnHover?: boolean;
  modal?: {
    title: string;
    content: ComponentType;
  };
}

const FLOAT_ITEMS: FloatItemConfig[] = [
  {
    key: 'name',
    label: 'Colby Schulz',
    modal: { title: 'About', content: () => <p>About content coming soon.</p> },
    freezeOnHover: true,
  },
  {
    key: 'resume',
    label: 'Resume',
    modal: { title: 'Resume', content: () => <p>Resume coming soon.</p> },
    freezeOnHover: true,
  },
  {
    key: 'chatbot',
    label: 'Chatbot',
    modal: { title: 'Chat', content: Chat },
    freezeOnHover: true,
  },
  {
    key: 'links',
    label: 'Links',
    modal: { title: 'Links', content: () => <p>Links coming soon.</p> },
    freezeOnHover: true,
  },
];

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

interface ActiveModal {
  key: string;
  origin: ModalOrigin;
}

function App() {
  const [controlValues, setControlValues] =
    useState<ControlValues>(DEFAULT_VALUES);
  const [activeModal, setActiveModal] = useState<ActiveModal | null>(null);
  const [frozenKey, setFrozenKey] = useState<string | null>(null);

  const handleChange = useCallback((key: string, value: number) => {
    setControlValues((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleItemClick = useCallback((key: string, origin: ModalOrigin) => {
    setFrozenKey(key);
    setActiveModal({ key, origin });
  }, []);

  const handleModalClose = useCallback(() => {
    setFrozenKey(null);
    setActiveModal(null);
  }, []);

  const activeConfig = activeModal
    ? FLOAT_ITEMS.find((item) => item.key === activeModal.key)
    : null;

  return (
    <ErrorBoundary>
      <div className={styles.container}>
        <FloatProvider speed={controlValues.speed}>
          {FLOAT_ITEMS.map((item) => (
            <FloatItem
              key={item.key}
              freezeOnHover={item.freezeOnHover ?? false}
              frozen={frozenKey === item.key}
              onClick={
                item.modal
                  ? (origin) => handleItemClick(item.key, origin)
                  : undefined
              }
            >
              <h2 className={styles.bouncingText}>{item.label}</h2>
            </FloatItem>
          ))}
        </FloatProvider>
      </div>

      {activeModal && activeConfig?.modal && (
        <Modal
          open
          onClose={handleModalClose}
          title={activeConfig.modal.title}
          origin={activeModal.origin}
        >
          <activeConfig.modal.content />
        </Modal>
      )}

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
