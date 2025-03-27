'use client';

import { useState, useEffect, useRef } from 'react';
import MediaCanvas from './components/MediaCanvas';
import MediaSidebar from './components/MediaSidebar';
import { v4 as uuidv4 } from 'uuid';

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
  rotation?: number; // Added rotation property
}

export default function Home() {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [snapToGrid, setSnapToGrid] = useState(false); // Added grid snapping state
  
  const timerRef = useRef<number | null>(null);
  const lastUpdateTimeRef = useRef<number | null>(null);

  const selectedItem = selectedItemId 
      ? mediaItems.find(item => item.id === selectedItemId) || null
      : null;

  // Handle the timeline playback
  useEffect(() => {
    if (isPlaying) {
      lastUpdateTimeRef.current = Date.now();
      
      const updateTimer = () => {
        const now = Date.now();
        const deltaTime = (now - (lastUpdateTimeRef.current || now)) / 1000;
        lastUpdateTimeRef.current = now;
        
        setCurrentTime(prev => prev + deltaTime);
        timerRef.current = requestAnimationFrame(updateTimer);
      };
      
      timerRef.current = requestAnimationFrame(updateTimer);
    } else {
      if (timerRef.current !== null) {
        cancelAnimationFrame(timerRef.current);
        timerRef.current = null;
      }
    }
    
    return () => {
      if (timerRef.current !== null) {
        cancelAnimationFrame(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isPlaying]);

  const handlePlayTimeline = () => {
    if (isPlaying) {
      setIsPlaying(false);
    } else {
      setCurrentTime(0);
      setIsPlaying(true);
    }
  };

  const handleAddImage = (file: File) => {
    const url = URL.createObjectURL(file);
    const newItem: MediaItem = {
      id: uuidv4(),
      type: 'image',
      content: url,
      position: { x: 100, y: 100 },
      size: { width: 300, height: 200 },
      opacity: 100,
      startTime: 0,
      endTime: 10,
      rotation: 0
    };
    setMediaItems([...mediaItems, newItem]);
    setSelectedItemId(newItem.id);
  };

  const handleAddVideo = (file: File) => {
    const url = URL.createObjectURL(file);
    const newItem: MediaItem = {
      id: uuidv4(),
      type: 'video',
      content: url,
      position: { x: 100, y: 100 },
      size: { width: 320, height: 240 },
      opacity: 100,
      startTime: 0,
      endTime: 15,
      rotation: 0
    };
    setMediaItems([...mediaItems, newItem]);
    setSelectedItemId(newItem.id);
  };

  const handleAddText = (text: string) => {
    const newItem: MediaItem = {
      id: uuidv4(),
      type: 'text',
      content: text,
      position: { x: 100, y: 100 },
      size: { width: 200, height: 100 },
      color: '#ffffff',
      font: 'Arial',
      opacity: 100,
      startTime: 0,
      endTime: 5
    };
    setMediaItems([...mediaItems, newItem]);
    setSelectedItemId(newItem.id);
  };

  const handleDeleteSelected = () => {
    if (selectedItemId) {
      setMediaItems(mediaItems.filter(item => item.id !== selectedItemId));
      setSelectedItemId(null);
    }
  };

  const handleItemMove = (id: string, position: { x: number; y: number }) => {
    // Ensure we're not going off-screen with positive bounds check only
    const boundedPosition = {
      x: Math.max(0, position.x),
      y: Math.max(0, position.y)
    };
    
    // Use functional update to ensure we're working with the latest state
    setMediaItems(prevItems => 
      prevItems.map(item => 
        item.id === id ? { ...item, position: boundedPosition } : item
      )
    );
  };

  const handleItemResize = (id: string, size: { width: number; height: number }) => {
    setMediaItems(prevItems => 
      prevItems.map(item => 
        item.id === id ? { ...item, size } : item
      )
    );
  };
  
  // Add rotation handler
  const handleItemRotate = (id: string, rotation: number) => {
    setMediaItems(prevItems => 
      prevItems.map(item => 
        item.id === id ? { ...item, rotation } : item
      )
    );
  };

  const handleUpdateItem = (changes: Partial<MediaItem>) => {
    if (selectedItemId) {
      setMediaItems(prevItems => 
        prevItems.map(item => 
          item.id === selectedItemId ? { ...item, ...changes } : item
        )
      );
    }
  };

  return (
    <main className="app-container">
      <MediaCanvas 
        mediaItems={mediaItems}
        onItemSelect={setSelectedItemId}
        selectedItem={selectedItemId}
        onItemMove={handleItemMove}
        onItemResize={handleItemResize}
        onItemRotate={handleItemRotate}
        currentTime={currentTime}
        isPlaying={isPlaying}
        snapToGrid={snapToGrid}
      />
      <MediaSidebar
        onAddImage={handleAddImage}
        onAddVideo={handleAddVideo}
        onAddText={handleAddText}
        onDeleteSelected={handleDeleteSelected}
        selectedItem={selectedItem}
        onUpdateItem={handleUpdateItem}
        onPlayTimeline={handlePlayTimeline}
        isPlaying={isPlaying}
        snapToGrid={snapToGrid}
        setSnapToGrid={setSnapToGrid}
      />
    </main>
  );
}