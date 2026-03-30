import { useCallback, useEffect, useRef, useState } from 'react';
import { FloatProvider } from './components/float/float-provider';
import type { FloatProviderHandle } from './components/float/float-types';
import { FloatItem } from './components/float/float-item';
import { GrainOverlay } from './components/grain-overlay/grain-overlay';
import { ChaosPanel } from './components/chaos-panel/chaos-panel';
import { ErrorBoundary } from './components/error-boundary/error-boundary';
import { Chat } from './components/chat/chat';
import { ColbotBubble } from './components/icons/colbot-bubble';
import { ContactEnvelope } from './components/icons/contact-envelope';
import { ResumeDocument } from './components/icons/resume-document';
import { NameCard } from './components/icons/name-card';
import { Modal } from './components/modal/modal';
import type { ModalOrigin } from './components/modal/modal.types';
import type {
  Control,
  ControlValues,
} from './components/chaos-panel/chaos-panel.types';

import type { ComponentType } from 'react';
import type { Vec2 } from './components/float/float-types';
import styles from './app.module.scss';

export interface FloatItemContentProps {
  label: string;
}

interface FloatItemConfig {
  key: string;
  label: string;
  content?: ComponentType<FloatItemContentProps>;
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
    content: NameCard,
    modal: { title: 'About', content: () => <p>About content coming soon.</p> },
    freezeOnHover: true,
  },
  {
    key: 'resume',
    label: 'Resume',
    content: ResumeDocument,
    modal: { title: 'Resume', content: () => <p>Resume coming soon.</p> },
    freezeOnHover: true,
  },
  {
    key: 'contact',
    label: 'Contact',
    content: ContactEnvelope,
    modal: { title: 'Contact', content: () => <p>Contact coming soon.</p> },
    freezeOnHover: true,
  },
  {
    key: 'chatbot',
    label: 'ASK COL-BOT!',
    content: ColbotBubble,
    modal: { title: 'Chat', content: Chat },
    freezeOnHover: true,
  },
];

const CONTROLS: Control[] = [
  {
    type: 'slider',
    key: 'grain',
    label: 'Grain Intensity',
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
  {
    type: 'slider',
    key: 'scalePulse',
    label: 'Scale Pulse Magnitude',
    min: 0,
    max: 200,
    step: 1,
    defaultValue: 0,
  },
  {
    type: 'slider',
    key: 'glowCycle',
    label: 'Glow Cycle',
    min: 0,
    max: 20,
    step: 1,
    defaultValue: 0,
  },
];

const CALM_VALUES: ControlValues = {
  grain: 0,
  speed: 0,
  scalePulse: 0,
  glowCycle: 0,
};
const CHAOS_VALUES: ControlValues = {
  grain: 120,
  speed: 3,
  scalePulse: 70,
  glowCycle: 5,
};

interface ActiveModal {
  key: string;
  origin: ModalOrigin;
}

const MOBILE_BREAKPOINT = 768;
const STACK_GAP_DESKTOP = 90;
const STACK_GAP_MOBILE = 40;
const STACK_MARGIN = 16; // minimum px from viewport top edge
const CHAOS_PANEL_RESERVED = 48; // collapsed panel: 44px min-height + 2×2px border

function getViewportSize() {
  // visualViewport accounts for iOS Safari browser chrome (address/tab bars).
  // Falls back to innerWidth/Height for environments that don't support it.
  return {
    width: window.visualViewport?.width ?? window.innerWidth,
    height: window.visualViewport?.height ?? window.innerHeight,
  };
}

function computeStackPositions(
  items: FloatItemConfig[],
  heights: Record<string, number>,
): Vec2[] {
  const { width, height } = getViewportSize();
  const isMobile = width <= MOBILE_BREAKPOINT;
  const preferredGap = isMobile ? STACK_GAP_MOBILE : STACK_GAP_DESKTOP;
  const usableHeight = height - CHAOS_PANEL_RESERVED - STACK_MARGIN;
  const totalItemHeight = items.reduce(
    (sum, item) => sum + (heights[item.key] ?? 0),
    0,
  );
  // Cap gap so the full stack never exceeds usable height.
  const gap = Math.max(
    0,
    Math.min(preferredGap, (usableHeight - totalItemHeight) / (items.length - 1)),
  );
  const totalHeight = totalItemHeight + (items.length - 1) * gap;
  const startY = Math.max(STACK_MARGIN, (usableHeight - totalHeight) / 2 + STACK_MARGIN);
  let y = startY;
  return items.map((item) => {
    const pos = { x: width / 2, y };
    y += (heights[item.key] ?? 0) + gap;
    return pos;
  });
}

function App() {
  const [chaosActive, setChaosActive] = useState(false);
  const [controlValues, setControlValues] =
    useState<ControlValues>(CALM_VALUES);
  const [activeModal, setActiveModal] = useState<ActiveModal | null>(null);
  const [frozenKey, setFrozenKey] = useState<string | null>(null);
  // Measured heights reported by each FloatItem's ResizeObserver.
  // Using a ref avoids re-renders during measurement; state update fires once all are in.
  const measuredHeightsRef = useRef<Record<string, number>>({});
  const [stackPositions, setStackPositions] = useState<Vec2[]>(() =>
    // Rough fallback until ResizeObserver fires — items snap to measured positions
    // on the first paint since speed=0 in calm mode.
    FLOAT_ITEMS.map((_, i) => ({
      x: window.innerWidth / 2,
      y: window.innerHeight / 2 + (i - FLOAT_ITEMS.length / 2) * 160,
    })),
  );

  const handleItemSizeChange = useCallback((key: string, height: number) => {
    measuredHeightsRef.current[key] = height;
    if (FLOAT_ITEMS.every((item) => item.key in measuredHeightsRef.current)) {
      setStackPositions(
        computeStackPositions(FLOAT_ITEMS, measuredHeightsRef.current),
      );
    }
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (FLOAT_ITEMS.every((item) => item.key in measuredHeightsRef.current)) {
        setStackPositions(
          computeStackPositions(FLOAT_ITEMS, measuredHeightsRef.current),
        );
      }
    };
    window.addEventListener('resize', handleResize);
    // iOS Safari fires visualViewport resize when browser chrome shows/hides,
    // which changes the available height without triggering window resize.
    window.visualViewport?.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.visualViewport?.removeEventListener('resize', handleResize);
    };
  }, []);

  const floatProviderRef = useRef<FloatProviderHandle>(null);

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
    floatProviderRef.current?.returnHome(() => {
      setChaosActive(false);
      setControlValues(CALM_VALUES);
    });
  }, []);

  const handleMaxPower = useCallback(() => {
    const maxValues = CONTROLS.reduce<ControlValues>((acc, control) => {
      acc[control.key] = control.max;
      return acc;
    }, {});
    setControlValues(maxValues);
  }, []);

  const activeConfig = activeModal
    ? FLOAT_ITEMS.find((item) => item.key === activeModal.key)
    : null;

  return (
    <ErrorBoundary>
      <div
        className={styles.container}
        style={
          {
            '--scale-amplitude': controlValues.scalePulse,
            '--glow-speed': controlValues.glowCycle,
          } as React.CSSProperties
        }
      >
        <FloatProvider ref={floatProviderRef} speed={controlValues.speed}>
          {FLOAT_ITEMS.map((item, i) => (
            <FloatItem
              key={item.key}
              initialPosition={stackPositions[i]}
              freezeOnHover={chaosActive && (item.freezeOnHover ?? false)}
              frozen={frozenKey === item.key}
              chaosActive={chaosActive}
              staggerIndex={i}
              onSizeChange={(height) => handleItemSizeChange(item.key, height)}
              onClick={
                item.modal
                  ? (origin) => handleItemClick(item.key, origin)
                  : undefined
              }
            >
              {item.content ? (
                <item.content label={item.label} />
              ) : (
                <h2 className={styles.floatLabel}>{item.label}</h2>
              )}
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
          onMaxPower={handleMaxPower}
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
