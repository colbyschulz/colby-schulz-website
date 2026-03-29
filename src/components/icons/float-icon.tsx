import type { ReactNode } from 'react';
import type { FloatItemContentProps } from '@/app';

interface FloatIconProps extends FloatItemContentProps {
  viewBox: string;
  className: string;
  svgClassName: string;
  shapeClassName: string;
  labelClassName: string;
  children: ReactNode;
}

export function FloatIcon({
  label,
  viewBox,
  className,
  svgClassName,
  shapeClassName,
  labelClassName,
  children,
}: FloatIconProps) {
  return (
    <div className={className}>
      <svg
        viewBox={viewBox}
        xmlns="http://www.w3.org/2000/svg"
        className={svgClassName}
        aria-hidden="true"
      >
        <g
          className={shapeClassName}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {children}
        </g>
      </svg>
      <span className={labelClassName}>{label}</span>
    </div>
  );
}
