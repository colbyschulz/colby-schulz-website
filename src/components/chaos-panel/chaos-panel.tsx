import * as Slider from '@radix-ui/react-slider';
import type { Control, ControlValues } from '../control-panel/control-panel.types';
import styles from './chaos-panel.module.scss';

interface ChaosPanelProps {
  chaosActive: boolean;
  returning: boolean;
  controls: Control[];
  values: ControlValues;
  onChange: (key: string, value: number) => void;
  onActivateChaos: () => void;
  onCancelChaos: () => void;
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
  returning,
  controls,
  values,
  onChange,
  onActivateChaos,
  onCancelChaos,
}: ChaosPanelProps) {
  return (
    <div
      className={styles.box}
      data-chaos={chaosActive}
      data-returning={returning}
      onClick={!chaosActive ? onActivateChaos : undefined}
    >
      <div className={styles.calmFace}>
        <span className={styles.calmLabel}>activate chaos mode</span>
      </div>

      <div className={styles.returningFace}>
        <span className={styles.returningLabel}>calming down...</span>
      </div>

      <div className={styles.panelFace}>
        <span className={styles.panelHeader}>Chaos Controller</span>
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
        <button className={styles.cancelButton} onClick={onCancelChaos}>
          Cancel Chaos
        </button>
      </div>
    </div>
  );
}
