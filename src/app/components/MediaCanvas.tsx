'use client'

import React, { useState, useRef, useEffect } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
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
  snapToGrid: boolean;
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
  snapToGrid
}) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [rotating, setRotating] = useState(false);
  const [initialRotation, setInitialRotation] = useState(0);
  const [initialAngle, setInitialAngle] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  
  // Function to handle grid snapping
  const snapToGridValue = (value: number, gridSize: number = 20): number => {
    if (!snapToGrid) return value;
    return Math.round(value / gridSize) * gridSize;
  };
  
  const renderMediaItem = (item: MediaItem) => {
    const isSelected = selectedItem === item.id;
    
    // Check if the item should be visible based on timing
    const startTime = item.startTime !== undefined ? item.startTime : 0;
    const endTime = item.endTime !== undefined ? item.endTime : Infinity;
    const isVisible = currentTime >= startTime && currentTime <= endTime;
    
    if (!isVisible && isPlaying) {
      return null;
    }
    
    const handleRotateStart = (e: React.MouseEvent) => {
      e.stopPropagation();
      setRotating(true);
      setInitialRotation(item.rotation || 0);
      
      // Calculate the center of the element
      const rect = (e.currentTarget.parentNode as HTMLElement).getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      // Calculate initial angle between cursor and center
      const initialAngleRad = Math.atan2(e.clientY - centerY, e.clientX - centerX);
      setInitialAngle(initialAngleRad * (180 / Math.PI));
    };
    
    const handleRotateMove = (e: React.MouseEvent) => {
      if (!rotating) return;
      
      e.stopPropagation();
      e.preventDefault();
      
      // Get the center of the element
      const rect = (e.currentTarget.parentNode as HTMLElement).getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      // Calculate new angle
      const angleRad = Math.atan2(e.clientY - centerY, e.clientX - centerX);
      const angle = angleRad * (180 / Math.PI);
      
      // Calculate rotation difference and update
      let newRotation = initialRotation + (angle - initialAngle);
      
      // Snap to 15-degree increments if grid snapping is enabled
      if (snapToGrid) {
        newRotation = Math.round(newRotation / 15) * 15;
      }
      
      onItemRotate(item.id, newRotation);
    };

    // Handle resize from react-resizable
    const onResize = (e: React.SyntheticEvent, data: ResizeCallbackData) => {
      e.stopPropagation();
      setIsResizing(true);
      let { width, height } = data.size;
      
      // Apply grid snapping if enabled
      if (snapToGrid) {
        width = snapToGridValue(width, 10);
        height = snapToGridValue(height, 10);
      }
      
      onItemResize(item.id, { width, height });
    };
    
    const onResizeStop = () => {
      setTimeout(() => setIsResizing(false), 100);
    };
    
    const resizeHandles = isSelected && !isPlaying ? ['se', 'sw', 'ne', 'nw', 'n', 's', 'e', 'w'] : [];
    
    // Get content based on item type
    const getItemContent = () => {
      if (item.type === 'image') {
        // For blob URLs, we'll fall back to regular img tag since Next.js Image
        // has limitations with blob URLs
        if (item.content.startsWith('blob:')) {
          return <img 
            src={item.content} 
            alt="Media content" 
            style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
          />;
        }
        
        return (
          <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            <Image 
              src={item.content} 
              alt="Media content" 
              fill 
              style={{ objectFit: 'contain' }} 
              unoptimized={true}
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
    
    // This will prevent dragging during resize operations
    const shouldAllowDrag = !isPlaying && !rotating && !isResizing;
    
    // Define motion props with proper typing
    const motionProps: HTMLMotionProps<"div"> = {
      className: `media-item-container ${isSelected ? 'selected-container' : ''}`,
      style: {
        position: 'absolute',
        transformOrigin: 'center center',
        opacity: item.opacity ? item.opacity / 100 : 1,
        rotate: item.rotation || 0,
        cursor: shouldAllowDrag ? 'move' : 'default',
        zIndex: isSelected ? 10 : 2,
      },
      initial: { x: item.position.x, y: item.position.y },
      animate: { x: item.position.x, y: item.position.y },
      drag: shouldAllowDrag,
      dragMomentum: false,
      dragElastic: 0,
      onDragStart: () => setIsDragging(true),
      onDrag: (e, info) => {
        if (shouldAllowDrag) {
          const newX = snapToGridValue(item.position.x + info.delta.x);
          const newY = snapToGridValue(item.position.y + info.delta.y);
          onItemMove(item.id, { x: newX, y: newY });
        }
      },
      onDragEnd: () => {
        setTimeout(() => setIsDragging(false), 100);
      },
      onClick: (e: React.MouseEvent) => {
        if (!isPlaying && !isResizing && !isDragging) {
          e.stopPropagation();
          onItemSelect(item.id);
        }
      },
      whileHover: { scale: isPlaying ? 1 : 1.01 },
      transition: { duration: 0.2 }
    };
    
    return (
      <motion.div
        key={item.id}
        {...motionProps}
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
                onMouseMove={handleRotateMove}
              />
            )}
          </div>
        </ResizableBox>
      </motion.div>
    );
  };
  
  useEffect(() => {
    const handleMouseUp = () => {
      setRotating(false);
      // Small delay to ensure click events are processed correctly
      setTimeout(() => {
        setIsResizing(false);
        setIsDragging(false);
      }, 100);
    };
    
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);
  
  // Draw grid lines if snapToGrid is enabled
  const renderGrid = () => {
    if (!snapToGrid) return null;
    
    const gridLines = [];
    const gridSize = 20;
    const canvasWidth = canvasRef.current?.clientWidth || 1000;
    const canvasHeight = canvasRef.current?.clientHeight || 800;
    
    // Vertical lines
    for (let x = 0; x <= canvasWidth; x += gridSize) {
      gridLines.push(
        <line 
          key={`v-${x}`} 
          x1={x} 
          y1={0} 
          x2={x} 
          y2={canvasHeight} 
          stroke="rgba(0, 0, 0, 0.15)" 
          strokeWidth="1" 
        />
      );
    }
    
    // Horizontal lines
    for (let y = 0; y <= canvasHeight; y += gridSize) {
      gridLines.push(
        <line 
          key={`h-${y}`} 
          x1={0} 
          y1={y} 
          x2={canvasWidth} 
          y2={y} 
          stroke="rgba(0, 0, 0, 0.15)" 
          strokeWidth="1" 
        />
      );
    }
    
    return (
      <svg className="grid-overlay" width={canvasWidth} height={canvasHeight}>
        {gridLines}
      </svg>
    );
  };

  return (
    <div 
      className="canvas" 
      ref={canvasRef}
      onClick={() => {
        // Deselect when clicking on the canvas (and not on an item)
        if (!isResizing && !isDragging && !rotating) {
          onItemSelect('');
        }
      }}
      onMouseUp={() => {
        setRotating(false);
      }}
    >
      {renderGrid()}
      {mediaItems.map(renderMediaItem)}
      
      {isPlaying && (
        <div className="time-display">
          Time: {currentTime.toFixed(1)}s
        </div>
      )}
    </div>
  );
};

export default MediaCanvas;