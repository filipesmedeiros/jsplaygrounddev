import cn from 'classnames';
import { type ReactNode } from 'react';
import { GrBottomCorner } from 'react-icons/gr';

import useResizer from '../../hooks/useResizer';
import useScrollbarWidth from '../../hooks/useScrollbarWidth';
import fractionStringifier from '../../utils/fractionStringifier';

interface Props {
  children: ReactNode;
  className?: string;
  parent: HTMLElement | null;
  widthFraction?: number;
  heightFraction?: number;
  maximize?: boolean;
  transformWidthChange?: (value: number) => number;
  transformHeightChange?: (value: number) => number;
}

export default function ResizableChildContainer({
  children,
  className,
  parent,
  widthFraction = 0.5,
  heightFraction = 0.5,
  maximize = false,
  transformWidthChange = (value) => value,
  transformHeightChange = (value) => value,
}: Props) {
  const [{ x, y }, isResizing, startResizing] = useResizer(parent, {
    x: widthFraction,
    y: heightFraction,
  });

  return (
    <div className={cn(className, 'relative w-full h-full')}>
      {children}

      <div
        className={cn(
          'absolute cursor-nwse-resize right-px bottom-px max-sm:hidden',
          {
            'after:fixed after:inset-0': isResizing,
          },
        )}
        onMouseDown={startResizing}
        onTouchStart={startResizing}
      >
        <GrBottomCorner className="[&_polyline]:stroke-[#6a6a6a] w-2.5 h-2.5" />
      </div>
    </div>
  );
}
