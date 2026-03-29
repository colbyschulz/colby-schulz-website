export type SliderControl = {
  type: 'slider';
  key: string;
  label: string;
  min: number;
  max: number;
  step?: number;
  defaultValue: number;
  format?: (value: number) => string;
};

// New control types get added to this union
export type Control = SliderControl;

export type ControlValues = Record<string, number>;
