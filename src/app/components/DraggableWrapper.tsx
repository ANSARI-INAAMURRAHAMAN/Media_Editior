import React, { useRef} from 'react';
import Draggable, { DraggableProps, DraggableEventHandler } from 'react-draggable';

// Create a compatible version of Draggable that works with React 19
const DraggableWrapper: React.FC<DraggableProps & { children: React.ReactNode }> = (props) => {
  const nodeRef = useRef<HTMLDivElement | null>(null);
  
  return (
    <Draggable
      {...props}
      nodeRef={nodeRef as React.RefObject<HTMLElement>}
    >
      <div ref={nodeRef} style={{ position: 'absolute', top: 0, left: 0 }}>
        {props.children}
      </div>
    </Draggable>
  );
};

export default DraggableWrapper;

// Re-export types from react-draggable for convenience
export type { DraggableData, DraggableEvent } from 'react-draggable';
export type { DraggableEventHandler };
