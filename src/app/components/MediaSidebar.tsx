'use client'

import React, { useState } from 'react';
import { Dropzone } from '@mantine/dropzone';
import { Button, TextInput, Slider, ColorInput, Tabs, Select, NumberInput, Group, Switch } from '@mantine/core';
import { IconUpload, IconPhoto, IconTypography, IconTrash, IconPlayerPlay, IconGrid4x4 } from '@tabler/icons-react';

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

interface MediaSidebarProps {
  onAddImage: (file: File) => void;
  onAddVideo: (file: File) => void;
  onAddText: (text: string) => void;
  onDeleteSelected: () => void;
  selectedItem: MediaItem | null;
  onUpdateItem: (changes: Partial<MediaItem>) => void;
  onPlayTimeline: () => void;
  isPlaying: boolean;
  snapToGrid: boolean;
  setSnapToGrid: (value: boolean) => void;
}

const MediaSidebar: React.FC<MediaSidebarProps> = ({
  onAddImage,
  onAddVideo,
  onAddText,
  onDeleteSelected,
  selectedItem,
  onUpdateItem,
  onPlayTimeline,
  isPlaying,
  snapToGrid,
  setSnapToGrid
}) => {
  const [textContent, setTextContent] = useState('');

  const handleDrop = (files: File[]) => {
    files.forEach(file => {
      if (file.type.startsWith('image/')) {
        onAddImage(file);
      } else if (file.type.startsWith('video/')) {
        onAddVideo(file);
      }
    });
  };

  const handleTextAdd = () => {
    if (textContent.trim()) {
      onAddText(textContent);
      setTextContent('');
    }
  };

  return (
    <div className="sidebar">
      <Tabs defaultValue="upload">
        <Tabs.List>
          <Tabs.Tab value="upload" leftSection={<IconUpload size={16} />}>Upload</Tabs.Tab>
          <Tabs.Tab value="edit" leftSection={<IconPhoto size={16} />}>Edit</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="upload" className="tab-panel">
          <Dropzone
            onDrop={handleDrop}
            accept={['image/*', 'video/*']}
            className="dropzone"
          >
            <div style={{ textAlign: 'center' }}>
              <IconUpload size={32} stroke={1.5} />
              <p>Drag images or videos here or click to select files</p>
            </div>
          </Dropzone>
          
          <div className="control-panel">
            <TextInput
              placeholder="Enter text"
              value={textContent}
              onChange={(e) => setTextContent(e.target.value)}
              style={{ marginBottom: '1rem' }}
            />
            <Button 
              onClick={handleTextAdd}
              leftSection={<IconTypography size={16} />}
              className="tool-button"
              fullWidth
            >
              Add Text
            </Button>
          </div>
          
          <div className="control-panel">
            <Button 
              onClick={onPlayTimeline}
              leftSection={<IconPlayerPlay size={16} />}
              color={isPlaying ? "red" : "green"}
              fullWidth
            >
              {isPlaying ? "Stop" : "Play Timeline"}
            </Button>
          </div>
          
          <div className="control-panel">
            <Group>
              <Switch 
                label="Snap to Grid" 
                checked={snapToGrid}
                onChange={(event) => setSnapToGrid(event.currentTarget.checked)}
              />
            </Group>
          </div>
        </Tabs.Panel>

        <Tabs.Panel value="edit" className="tab-panel">
          {selectedItem ? (
            <div className="control-panel">
              <h3>Element Properties</h3>
              
              {selectedItem.type === 'text' && (
                <TextInput
                  label="Text Content"
                  value={selectedItem.content}
                  onChange={(e) => onUpdateItem({ content: e.target.value })}
                  style={{ marginBottom: '1rem' }}
                />
              )}
              
              <Group grow style={{ marginBottom: '1rem' }}>
                <NumberInput
                  label="Width"
                  value={selectedItem.size.width}
                  onChange={(value) => onUpdateItem({ size: { ...selectedItem.size, width: Number(value) } })}
                  min={50}
                  max={1000}
                />
                <NumberInput
                  label="Height"
                  value={selectedItem.size.height}
                  onChange={(value) => onUpdateItem({ size: { ...selectedItem.size, height: Number(value) } })}
                  min={50}
                  max={1000}
                />
              </Group>
              
              <Group grow style={{ marginBottom: '1rem' }}>
                <NumberInput
                  label="X Position"
                  value={selectedItem.position.x}
                  onChange={(value) => onUpdateItem({ position: { ...selectedItem.position, x: Number(value) } })}
                  min={0}
                />
                <NumberInput
                  label="Y Position"
                  value={selectedItem.position.y}
                  onChange={(value) => onUpdateItem({ position: { ...selectedItem.position, y: Number(value) } })}
                  min={0}
                />
              </Group>
              
              {(selectedItem.type === 'image' || selectedItem.type === 'video') && (
                <div style={{ marginBottom: '1rem' }}>
                  <p>Rotation (degrees)</p>
                  <Slider
                    value={selectedItem.rotation || 0}
                    onChange={(value) => onUpdateItem({ rotation: value })}
                    min={0}
                    max={360}
                    step={snapToGrid ? 15 : 1}
                    label={(value) => `${value}°`}
                    style={{ marginTop: '0.5rem' }}
                  />
                </div>
              )}
              
              <div style={{ marginBottom: '1rem' }}>
                <p>Opacity</p>
                <Slider
                  value={selectedItem.opacity || 100}
                  onChange={(value) => onUpdateItem({ opacity: value })}
                  min={0}
                  max={100}
                  step={1}
                  label={(value) => `${value}%`}
                  style={{ marginTop: '0.5rem' }}
                />
              </div>
              
              <Group grow style={{ marginBottom: '1rem' }}>
                <NumberInput
                  label="Start Time (seconds)"
                  value={selectedItem.startTime || 0}
                  onChange={(value) => onUpdateItem({ startTime: Number(value) })}
                  min={0}
                  step={0.1}
                />
                <NumberInput
                  label="End Time (seconds)"
                  value={selectedItem.endTime || 60}
                  onChange={(value) => onUpdateItem({ endTime: Number(value) })}
                  min={(selectedItem.startTime || 0) + 0.1}
                  step={0.1}
                />
              </Group>
              
              {selectedItem.type === 'text' && (
                <>
                  <ColorInput
                    label="Text Color"
                    value={selectedItem.color || '#ffffff'}
                    onChange={(color) => onUpdateItem({ color })}
                    style={{ marginBottom: '1rem' }}
                  />
                  
                  <Select
                    label="Font"
                    data={['Arial', 'Times New Roman', 'Courier', 'Georgia', 'Verdana']}
                    value={selectedItem.font || 'Arial'}
                    onChange={(value) => onUpdateItem({ font: value || undefined })}
                    style={{ marginBottom: '1rem' }}
                  />
                </>
              )}
              
              <Button 
                onClick={onDeleteSelected}
                leftSection={<IconTrash size={16} />}
                color="red"
                variant="outline"
                fullWidth
              >
                Delete Element
              </Button>
            </div>
          ) : (
            <div className="control-panel">
              <p>Select an element to edit its properties</p>
            </div>
          )}
        </Tabs.Panel>
      </Tabs>
    </div>
  );
};

export default MediaSidebar;