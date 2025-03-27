'use client'

import React, { useState, useRef, useMemo } from 'react';
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
  // Create a Map to store refs for each media item
  const draggableRefs = useMemo(() => new Map(), []);
  const [rotating, setRotating] = useState(false);
  const [initialRotation, setInitialRotation] = useState(0);
  const [initialAngle, setInitialAngle] = useState(0);
  const [activeInteraction, setActiveInteraction] = useState<'none' | 'drag' | 'resize' | 'rotate'>('none');

  const snapToGridValue = (value: number, gridSize: number = 20): number => {
    if (!snapToGrid) return value;
    return Math.round(value / gridSize) * gridSize;
  };
  
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
      setRotating(true);
      setActiveInteraction('rotate');
      setInitialRotation(item.rotation || 0);
      const rect = (e.currentTarget.parentNode as HTMLElement).getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const initialAngleRad = Math.atan2(e.clientY - centerY, e.clientX - centerX);
      setInitialAngle(initialAngleRad * (180 / Math.PI));
    };
    
    const handleRotateMove = (e: React.MouseEvent) => {
      if (!rotating) return;
      e.stopPropagation();
      e.preventDefault();
      const rect = (e.currentTarget.parentNode as HTMLElement).getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const angleRad = Math.atan2(e.clientY - centerY, e.clientX - centerX);
      const angle = angleRad * (180 / Math.PI);
      let newRotation = initialRotation + (angle - initialAngle);
      if (snapToGrid) newRotation = Math.round(newRotation / 15) * 15;
      onItemRotate(item.id, newRotation);
    };

    const onResize = (_e: React.SyntheticEvent, data: ResizeCallbackData) => {
      setActiveInteraction('resize');
      let { width, height } = data.size;
      if (snapToGrid) {
        width = snapToGridValue(width, 10);
        height = snapToGridValue(height, 10);
      }
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
      const newX = snapToGridValue(data.x);
      const newY = snapToGridValue(data.y);
      onItemMove(item.id, { x: newX, y: newY });
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
        grid={[1, 1]}
        scale={1}
      >
        <div
          ref={draggableRef}
          className={`media-item-container ${isSelected ? 'selected-container' : ''}`}
          style={{
            position: 'absolute',
            transformOrigin: 'center center',
            opacity: item.opacity ? item.opacity / 100 : 1,
            transform: `rotate(${item.rotation || 0}deg)`,
            cursor: isDraggable && activeInteraction === 'none' ? 'move' : 'default',
            zIndex: isSelected ? 10 : 2,
            transition: 'transform 0.2s ease, opacity 0.2s ease, border 0.2s ease',
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
                  onMouseMove={handleRotateMove}
                  style={{
                    position: 'absolute',
                    bottom: -25,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    background: 'blue',
                    cursor: 'grab'
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