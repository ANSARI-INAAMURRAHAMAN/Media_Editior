declare module 'react-resizable' {
  import React from 'react';
  
  export interface ResizeCallbackData {
    node: HTMLElement;
    size: {
      width: number;
      height: number;
    };
    handle: string;
  }
  
  export interface ResizableBoxProps {
    width: number;
    height: number;
    axis?: 'both' | 'x' | 'y' | 'none';
    handle?: React.ReactElement | ((resizeHandle: string, ref: React.Ref<HTMLElement>) => React.ReactElement);
    handleSize?: [number, number];
    lockAspectRatio?: boolean;
    minConstraints?: [number, number];
    maxConstraints?: [number, number];
    onResizeStop?: (e: React.SyntheticEvent, data: ResizeCallbackData) => void;
    onResizeStart?: (e: React.SyntheticEvent, data: ResizeCallbackData) => void;
    onResize?: (e: React.SyntheticEvent, data: ResizeCallbackData) => void;
    resizeHandles?: Array<'s' | 'w' | 'e' | 'n' | 'sw' | 'nw' | 'se' | 'ne'>;
    transformScale?: number;
    draggableOpts?: Object;
    className?: string;
    children?: React.ReactNode;
  }
  
  export class Resizable extends React.Component<ResizableBoxProps> {}
  export class ResizableBox extends React.Component<ResizableBoxProps> {}
}
