import { useState } from 'react';
import * as Slider from '@radix-ui/react-slider';
import type { Control, ControlValues } from './chaos-panel.types';
import { MaxPowerButton } from './max-power-button/max-power-button';
import { PleaseStopButton } from './please-stop-button/please-stop-button';
import styles from './chaos-panel.module.scss';

interface ChaosPanelProps {
  chaosActive: boolean;
  controls: Control[];
  values: ControlValues;
  onChange: (key: string, value: number) => void;
  onActivateChaos: () => void;
  onCancelChaos: () => void;
  onMaxPower: () => void;
}

function SliderRow({
  control,
  value,
  onChange,
}: {
  control: Extract<Control, { type: 'slider' }>;
  value: number;
  onChange: (value: number) => void;
}) {
  const toPercent = (v: number) =>
    `${Math.round(((v - control.min) / (control.max - control.min)) * 100)}%`;
  const display = control.format ? control.format(value) : toPercent(value);

  return (
    <div className={styles.control}>
      <div className={styles.controlHeader}>
        <label className={styles.label}>{control.label}</label>
        <span className={styles.value}>{display}</span>
      </div>
      <Slider.Root
        className={styles.sliderRoot}
        value={[value]}
        onValueChange={(v) => onChange(v[0])}
        min={control.min}
        max={control.max}
        step={control.step ?? 1}
      >
        <Slider.Track className={styles.sliderTrack}>
          <Slider.Range className={styles.sliderRange} />
        </Slider.Track>
        <Slider.Thumb className={styles.sliderThumb} aria-label={control.label} />
      </Slider.Root>
    </div>
  );
}

export function ChaosPanel({
  chaosActive,
  controls,
  values,
  onChange,
  onActivateChaos,
  onCancelChaos,
  onMaxPower,
}: ChaosPanelProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [prevChaosActive, setPrevChaosActive] = useState(chaosActive);

  // When chaos activates, start collapsed so the user sees the full chaos first;
  // when chaos deactivates, reset to non-collapsed for the calm face.
  if (prevChaosActive !== chaosActive) {
    setPrevChaosActive(chaosActive);
    setCollapsed(chaosActive);
  }

  return (
    <div
      className={styles.box}
      data-chaos={chaosActive}
      data-collapsed={chaosActive && collapsed}
      onClick={!chaosActive ? onActivateChaos : (chaosActive && collapsed ? () => setCollapsed(false) : undefined)}
    >
      <div className={styles.calmFace}>
        <div className={styles.calmStripe}>
          <div className={styles.cautionBand}>
            {Array.from({ length: 3 }, (_, i) => (
              <span key={i} className={styles.cautionText}>CAUTION</span>
            ))}
          </div>
        </div>
        <span className={styles.calmLabel}>activate chaos mode</span>
        <div className={styles.calmStripe}>
          <div className={styles.cautionBand}>
            {Array.from({ length: 3 }, (_, i) => (
              <span key={i} className={styles.cautionText}>CAUTION</span>
            ))}
          </div>
        </div>
      </div>

      <button
        className={styles.panelTab}
        onClick={(e) => { e.stopPropagation(); setCollapsed((c) => !c); }}
      >
        Chaos Controller
        <span className={styles.panelTabChevron}>{collapsed ? '▲' : '▼'}</span>
      </button>

      <div className={styles.panelFaceOuter}>
        <div className={styles.panelFace}>
          <div className={styles.panelFaceInner}>
            <div className={styles.controls}>
              {controls.map((control) => {
                if (control.type !== 'slider') return null;
                return (
                  <SliderRow
                    key={control.key}
                    control={control}
                    value={values[control.key]}
                    onChange={(v) => onChange(control.key, v)}
                  />
                );
              })}
            </div>
            <div className={styles.panelActions}>
              <MaxPowerButton onClick={onMaxPower} />
              <PleaseStopButton onClick={onCancelChaos} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
