'use client'

import React, { useState, useRef, useMemo, useEffect } from 'react';
import Draggable, { DraggableData, DraggableEvent } from 'react-draggable';
import { ResizableBox, ResizeCallbackData } from 'react-resizable';
import Image from 'next/image';
import 'react-resizable/css/styles.css';

interface MediaItem {
  id: string;
  type: 'image' | 'video' | 'text';
  content: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  opacity?: number;
  color?: string;
  font?: string;
  startTime?: number;
  endTime?: number;
  rotation?: number; 
}

interface MediaCanvasProps {
  mediaItems: MediaItem[];
  onItemSelect: (id: string) => void;
  selectedItem: string | null;
  onItemMove: (id: string, position: { x: number; y: number }) => void;
  onItemResize: (id: string, size: { width: number; height: number }) => void;
  onItemRotate: (id: string, rotation: number) => void;
  currentTime: number;
  isPlaying: boolean;
}

const MediaCanvas: React.FC<MediaCanvasProps> = ({
  mediaItems,
  onItemSelect,
  selectedItem,
  onItemMove,
  onItemResize,
  onItemRotate,
  currentTime,
  isPlaying,
}) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  // Create a Map to store refs for each media item
  const draggableRefs = useMemo(() => new Map(), []);
  const [rotating, setRotating] = useState(false);
  const [initialRotation, setInitialRotation] = useState(0);
  const [initialAngle, setInitialAngle] = useState(0);
  const [activeInteraction, setActiveInteraction] = useState<'none' | 'drag' | 'resize' | 'rotate'>('none');
  const [rotatingItemId, setRotatingItemId] = useState<string | null>(null);
  
  // Update the useEffect to use more direct event handling
  useEffect(() => {
    if (!rotating || !rotatingItemId) return;
    
    console.log("Rotation active for item:", rotatingItemId);
    
    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault();
      
      const selectedItem = mediaItems.find(item => item.id === rotatingItemId);
      if (!selectedItem) return;
      
      // Get the element directly using querySelectorAll and data attribute
      const elements = document.querySelectorAll(`[data-id="${rotatingItemId}"]`);
      if (!elements.length) {
        console.log("Could not find element with id:", rotatingItemId);
        return;
      }
      
      // Cast the element to HTMLElement to access style property
      const element = elements[0] as HTMLElement;
      const rect = element.getBoundingClientRect();
      
      // Calculate center of the element
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      // Calculate the angle between the center and cursor
      const currentAngleRad = Math.atan2(e.clientY - centerY, e.clientX - centerX);
      const currentAngle = currentAngleRad * (180 / Math.PI);
      
      // Calculate the rotation
      let newRotation = initialRotation + (currentAngle - initialAngle);
      
      // Normalize rotation to 0-360 degrees
      newRotation = newRotation % 360;
      if (newRotation < 0) newRotation += 360;
      
      console.log("Rotating to:", newRotation, "degrees");
      
      // Apply rotation to the element immediately for visual feedback
      element.style.transform = `rotate(${newRotation}deg)`;
      
      // Update the state
      onItemRotate(rotatingItemId, newRotation);
    };
    
    const handleMouseUp = () => {
      console.log("Rotation ended");
      setRotating(false);
      setRotatingItemId(null);
      setActiveInteraction('none');
    };
    
    // Add event listeners
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    // Return cleanup function
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [rotating, rotatingItemId, initialRotation, initialAngle, mediaItems, onItemRotate]);

  const renderMediaItem = (item: MediaItem) => {
    // Get or create ref for this item
    if (!draggableRefs.has(item.id)) {
      draggableRefs.set(item.id, React.createRef());
    }
    const draggableRef = draggableRefs.get(item.id);
    const isSelected = selectedItem === item.id;
    const startTime = item.startTime !== undefined ? item.startTime : 0;
    const endTime = item.endTime !== undefined ? item.endTime : Infinity;
    const isVisible = currentTime >= startTime && currentTime <= endTime;
    
    if (!isVisible && isPlaying) return null;
    
    const handleRotateStart = (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      
      console.log("Starting rotation for item:", item.id);
      
      setRotating(true);
      setRotatingItemId(item.id);
      setActiveInteraction('rotate');
      setInitialRotation(item.rotation || 0);
      
      // Get the parent element's position
      const parentElement = e.currentTarget.closest('.media-item-container') as HTMLElement;
      if (!parentElement) {
        console.log("Could not find parent element");
        return;
      }
      
      const rect = parentElement.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      // Calculate initial angle
      const initialAngleRad = Math.atan2(e.clientY - centerY, e.clientX - centerX);
      const angle = initialAngleRad * (180 / Math.PI);
      
      console.log("Initial angle:", angle, "degrees");
      setInitialAngle(angle);
    };

    const onResize = (_e: React.SyntheticEvent, data: ResizeCallbackData) => {
      setActiveInteraction('resize');
      const { width, height } = data.size;
      onItemResize(item.id, { width, height });
    };
    
    const onResizeStop = () => {
      setTimeout(() => setActiveInteraction('none'), 100);
    };
    
    const handleDragStart = (e: DraggableEvent) => {
      if (isPlaying) {
        e.preventDefault();
        return false;
      }
      setActiveInteraction('drag');
      onItemSelect(item.id);
    };
    
    const handleDrag = (e: DraggableEvent, data: DraggableData) => {
      if (isPlaying || activeInteraction !== 'drag') {
        e.preventDefault();
        return false;
      }
      onItemMove(item.id, { x: data.x, y: data.y });
    };
    
    const handleDragStop = () => {
      setActiveInteraction('none');
    };
    
    const resizeHandles = isSelected && !isPlaying ? ['se', 'sw', 'ne', 'nw', 'n', 's', 'e', 'w'] : [];
    
    const getItemContent = () => {
      if (item.type === 'image') {
        return (
          <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            <Image 
              src={item.content} 
              alt="Media content" 
              fill 
              style={{ objectFit: 'contain' }} 
              unoptimized 
            />
          </div>
        );
      } else if (item.type === 'video') {
        return <video src={item.content} controls={!isPlaying} autoPlay={isPlaying} muted={isPlaying} loop={false} style={{ width: '100%', height: '100%' }} />;
      } else {
        return (
          <div style={{ 
            width: '100%', 
            height: '100%', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            fontSize: '16px',
            color: item.color || '#ffffff',
            fontFamily: item.font || 'Arial'
          }}>
            {item.content}
          </div>
        );
      }
    };
    
    const isDraggable = !isPlaying;
    
    return (
      <Draggable
        key={item.id}
        nodeRef={draggableRef}
        position={item.position}
        onStart={handleDragStart}
        onDrag={handleDrag}
        onStop={handleDragStop}
        disabled={!isDraggable || activeInteraction === 'resize' || activeInteraction === 'rotate'}
        bounds="parent"
        cancel=".custom-handle, .rotate-handle"
        defaultClassName="draggable-item"
        defaultClassNameDragging="dragging"
        defaultClassNameDragged="dragged"
        axis="both"
        defaultPosition={{ x: 0, y: 0 }}
        positionOffset={{ x: 0, y: 0 }}
        allowAnyClick={true}
        enableUserSelectHack={true}
        grid={undefined}
        scale={1}
      >
        <div
          ref={draggableRef}
          data-id={item.id}
          className={`media-item-container ${isSelected ? 'selected-container' : ''}`}
          style={{
            position: 'absolute',
            transformOrigin: 'center center',
            opacity: item.opacity ? item.opacity / 100 : 1,
            transform: `rotate(${item.rotation || 0}deg)`,
            width: `${item.size.width}px`, // Ensure width is explicitly set
            height: `${item.size.height}px`, // Ensure height is explicitly set
            cursor: isDraggable && activeInteraction === 'none' ? 'move' : 'default',
            zIndex: isSelected ? 10 : 2,
            // Remove transition during rotation to avoid lag
            transition: rotating && item.id === rotatingItemId 
              ? 'none'  // No transition during rotation for immediate feedback
              : 'transform 0.1s ease, opacity 0.2s ease, border 0.2s ease',
            border: isSelected ? '2px solid blue' : '2px solid transparent',
            borderRadius: '4px'
          }}
          onClick={(e) => {
            if (!isPlaying && activeInteraction === 'none') {
              e.stopPropagation();
              onItemSelect(item.id);
            }
          }}
        >
          <ResizableBox
            width={item.size.width}
            height={item.size.height}
            minConstraints={[50, 50]}
            maxConstraints={[1000, 1000]}
            resizeHandles={resizeHandles as ("s" | "se" | "sw" | "ne" | "nw" | "n" | "e" | "w")[]}
            onResize={onResize}
            onResizeStop={onResizeStop}
            handle={(h, ref) => (
              <div className={`custom-handle custom-handle-${h}`} ref={ref as React.Ref<HTMLDivElement>} />
            )}
            className="resizable-box"
          >
            <div 
              className={`media-item ${isSelected ? 'selected' : ''}`}
              style={{
                width: '100%',
                height: '100%',
                ...(item.type === 'text' && { 
                  color: item.color || '#ffffff',
                  fontFamily: item.font || 'Arial'
                })
              }}
            >
              {getItemContent()}
              
              {isSelected && !isPlaying && (
                <div 
                  className="rotate-handle"
                  onMouseDown={handleRotateStart}
                  style={{
                    position: 'absolute',
                    bottom: -30, // Move farther from the box
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: 24, // Make handle larger
                    height: 24, // Make handle larger
                    borderRadius: '50%',
                    background: 'blue',
                    cursor: 'grab',
                    zIndex: 1000,
                    border: '2px solid white' // Add border for visibility
                  }}
                />
              )}
            </div>
          </ResizableBox>
        </div>
      </Draggable>
    );
  };

  return (
    <div 
      className="canvas" 
      ref={canvasRef}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        backgroundColor: '#f0f0f0'
      }}
      onClick={() => {
        if (activeInteraction === 'none') {
          onItemSelect('');
        }
      }}
      onMouseUp={() => {
        setRotating(false);
        setActiveInteraction('none');
      }}
      onMouseLeave={() => {
        setRotating(false);
        setActiveInteraction('none');
      }}
    >
      {mediaItems.map(renderMediaItem)}
      
      {isPlaying && (
        <div style={{
          position: 'absolute',
          top: 10,
          right: 10,
          background: 'rgba(0,0,0,0.7)',
          color: 'white',
          padding: '5px 10px',
          borderRadius: 4
        }}>
          Time: {currentTime.toFixed(1)}s
        </div>
      )}
    </div>
  );
};

export default MediaCanvas;