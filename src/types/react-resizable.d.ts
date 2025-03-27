// ./src/types/react-resizable.d.ts
declare module 'react-resizable' {
    import React from 'react';
  
    export interface ResizeCallbackData {
      element: HTMLElement;
      size: { width: number; height: number };
      handle: string;
    }
  
    export interface ResizableBoxProps {
      width: number;
      height: number;
      onResize?: (e: React.SyntheticEvent, data: ResizeCallbackData) => void;
      onResizeStop?: (e: React.SyntheticEvent, data: ResizeCallbackData) => void;
      minConstraints?: [number, number];
      maxConstraints?: [number, number];
      resizeHandles?: string[];
      handle?: (handle: string, ref: React.Ref<HTMLDivElement>) => React.ReactNode;
      children: React.ReactNode;
      className?: string;
    }
  
    export class ResizableBox extends React.Component<ResizableBoxProps> {}
  }