import { useState } from 'react';
import * as Slider from '@radix-ui/react-slider';
import { ChevronUpIcon, ChevronDownIcon } from '@radix-ui/react-icons';
import type { Control, ControlValues } from './control-panel.types';
import styles from './control-panel.module.scss';

interface ControlPanelProps {
  controls: Control[];
  values: ControlValues;
  onChange: (key: string, value: number) => void;
  onCancelChaos: () => void;
}

function SliderRow({ control, value, onChange }: {
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

function renderControl(control: Control, value: number, onChange: (value: number) => void) {
  switch (control.type) {
    case 'slider':
      return <SliderRow key={control.key} control={control} value={value} onChange={onChange} />;
  }
}

export function ControlPanel({ controls, values, onChange, onCancelChaos }: ControlPanelProps) {
  const [open, setOpen] = useState(true);

  return (
    <div className={styles.panel} data-open={open}>
      <button
        className={styles.toggleChaos}
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-label="Toggle control panel"
      >
        Control Chaos
        {open ? <ChevronDownIcon className={styles.chevron} /> : <ChevronUpIcon className={styles.chevron} />}
      </button>

      {open && (
        <div className={styles.controls}>
          {controls.map((control) =>
            renderControl(control, values[control.key], (value) => onChange(control.key, value))
          )}
          <button className={styles.cancelButton} onClick={onCancelChaos}>
            Cancel Chaos
          </button>
        </div>
      )}
    </div>
  );
}
