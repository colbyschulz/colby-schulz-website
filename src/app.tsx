import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { FloatProvider, FloatContext } from './components/float/float-provider';
import { FloatItem } from './components/float/float-item';
import { GrainOverlay } from './components/grain-overlay/grain-overlay';
import { ChaosPanel } from './components/chaos-panel/chaos-panel';
import { ErrorBoundary } from './components/error-boundary/error-boundary';
import { Chat } from './components/chat/chat';
import { Modal } from './components/modal/modal';
import type { ModalOrigin } from './components/modal/modal.types';
import type {
  Control,
  ControlValues,
} from './components/chaos-panel/chaos-panel.types';

import type { ComponentType } from 'react';
import type { Vec2 } from './components/float/float-types';
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
    label: 'Ask anything',
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
    max: 200,
    step: 1,
    defaultValue: 50,
  },
  {
    type: 'slider',
    key: 'speed',
    label: 'Speed',
    min: 0,
    max: 18,
    step: 0.5,
    defaultValue: 2,
  },
];

const CALM_VALUES: ControlValues = { grain: 0, speed: 0 };
const CHAOS_VALUES: ControlValues = { grain: 120, speed: 3 };

interface ActiveModal {
  key: string;
  origin: ModalOrigin;
}

const ITEM_HEIGHT_ESTIMATE = 48; // ~3rem at 16px base
const STACK_GAP = 40; // ~2.5rem
const MOBILE_BREAKPOINT = 768;

function getStackPositions(count: number): Vec2[] {
  const isMobile = window.innerWidth <= MOBILE_BREAKPOINT;
  const gap = isMobile ? 24 : STACK_GAP;
  const totalHeight = count * ITEM_HEIGHT_ESTIMATE + (count - 1) * gap;
  const startY = (window.innerHeight - totalHeight) / 2;
  return Array.from({ length: count }, (_, i) => ({
    x: window.innerWidth / 2,
    y: startY + i * (ITEM_HEIGHT_ESTIMATE + gap),
  }));
}

/**
 * Bridge to access FloatContext.returnHome from App (which sits above
 * FloatProvider). Renders nothing — just forwards the context method
 * to a parent ref via onCapture so App can trigger returnHome.
 */
function ReturnHomeBridge({
  onCapture,
}: {
  onCapture: (fn: (onComplete?: () => void) => void) => void;
}) {
  const { returnHome } = useContext(FloatContext);
  useEffect(() => {
    onCapture(returnHome);
  }, [returnHome, onCapture]);
  return null;
}

function App() {
  const [chaosActive, setChaosActive] = useState(false);
  const [controlValues, setControlValues] =
    useState<ControlValues>(CALM_VALUES);
  const [activeModal, setActiveModal] = useState<ActiveModal | null>(null);
  const [frozenKey, setFrozenKey] = useState<string | null>(null);
  const [stackPositions, setStackPositions] = useState(() =>
    getStackPositions(FLOAT_ITEMS.length),
  );

  useEffect(() => {
    const handleResize = () => setStackPositions(getStackPositions(FLOAT_ITEMS.length));
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  const returnHomeRef = useRef<((onComplete?: () => void) => void) | null>(
    null,
  );

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

  const handleActivateChaos = useCallback(() => {
    setChaosActive(true);
    setControlValues(CHAOS_VALUES);
  }, []);

  const handleCancelChaos = useCallback(() => {
    returnHomeRef.current?.(() => {
      setChaosActive(false);
      setControlValues(CALM_VALUES);
    });
  }, []);

  const captureReturnHome = useCallback(
    (fn: (onComplete?: () => void) => void) => {
      returnHomeRef.current = fn;
    },
    [],
  );

  const activeConfig = activeModal
    ? FLOAT_ITEMS.find((item) => item.key === activeModal.key)
    : null;

  return (
    <ErrorBoundary>
      <div className={styles.container}>
        <FloatProvider speed={controlValues.speed}>
          <ReturnHomeBridge onCapture={captureReturnHome} />
          {FLOAT_ITEMS.map((item, i) => (
            <FloatItem
              key={item.key}
              initialPosition={stackPositions[i]}
              freezeOnHover={chaosActive && (item.freezeOnHover ?? false)}
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

      <div className={styles.chaosWrapper}>
        <ChaosPanel
          chaosActive={chaosActive}
          controls={CONTROLS}
          values={controlValues}
          onChange={handleChange}
          onActivateChaos={handleActivateChaos}
          onCancelChaos={handleCancelChaos}
        />
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
    </ErrorBoundary>
  );
}

export default App;
