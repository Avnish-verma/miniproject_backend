import React, { useState } from 'react';
import { X, Image, Type, Palette, Loader2, Upload } from 'lucide-react';
import Avatar from '../common/Avatar';
import Button from '../common/Button';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const COLOR_PRESETS = [
  '#161616', // Slate dark
  '#FF5C35', // Brand coral
  '#1E3A8A', // Deep blue
  '#065F46', // Emerald
  '#581C87', // Purple
  '#831843', // Rose
  '#312E81', // Indigo
];

export default function StoryCreatorModal({ isOpen, onClose, onStoryCreated }) {
  const { user } = useAuth();
  const [mode, setMode] = useState('text'); // 'text' | 'media'
  const [text, setText] = useState('');
  const [backgroundColor, setBackgroundColor] = useState(COLOR_PRESETS[0]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 20 * 1024 * 1024) {
      setError('Media size cannot exceed 20MB');
      return;
    }

    setError('');
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleClearFile = () => {
    setSelectedFile(null);
    setPreviewUrl('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (mode === 'text' && !text.trim()) {
      setError('Please type something for your story.');
      return;
    }
    if (mode === 'media' && !selectedFile) {
      setError('Please select an image for your story.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      let uploadedUrl = '';
      let uploadedPublicId = '';

      if (mode === 'media' && selectedFile) {
        const signRes = await api.get('/api/v1/media/upload-post');
        const { uploadUrl, apiKey, timestamp, signature, folder, public_id } = signRes.data.data;

        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('api_key', apiKey);
        formData.append('timestamp', timestamp);
        formData.append('signature', signature);
        formData.append('folder', folder);
        formData.append('public_id', public_id);

        const cloudRes = await fetch(uploadUrl, {
          method: 'POST',
          body: formData,
        });

        const cloudData = await cloudRes.json();
        if (!cloudData.secure_url) {
          throw new Error('Media upload failed');
        }

        uploadedUrl = cloudData.secure_url;
        uploadedPublicId = cloudData.public_id;
      }

      await api.post('/api/v1/stories', {
        text: text.trim(),
        mediaUrl: uploadedUrl,
        mediaPublicId: uploadedPublicId,
        backgroundColor: mode === 'text' ? backgroundColor : '#000000',
      });

      if (onStoryCreated) onStoryCreated();
      onClose();
    } catch (err) {
      console.error('Failed to create story:', err);
      setError(err.response?.data?.message || 'Could not publish story. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 select-none">
      <div className="bg-[#FFFFFF] dark:bg-[#151515] border border-[#E7E5E2] dark:border-[#292929] rounded-[16px] w-full max-w-md shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E7E5E2] dark:border-[#292929]">
          <h3 className="font-bold text-[16px] text-[#111111] dark:text-[#F5F5F5]">
            Create Story
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-[#929292] hover:text-[#111111] dark:hover:text-[#F5F5F5] transition-colors"
          >
            <X className="w-5 h-5 stroke-[1.75px]" />
          </button>
        </div>

        {/* Story Type Selector */}
        <div className="grid grid-cols-2 p-1.5 m-4 bg-[#FAFAF8] dark:bg-[#0D0D0D] rounded-[10px] border border-[#E7E5E2] dark:border-[#292929]">
          <button
            type="button"
            onClick={() => setMode('text')}
            className={`flex items-center justify-center gap-2 py-2 rounded-[8px] text-[13px] font-semibold transition-all ${
              mode === 'text'
                ? 'bg-[#FFFFFF] dark:bg-[#1A1A1A] text-[#111111] dark:text-[#F5F5F5] shadow-xs'
                : 'text-[#6B6B6B] dark:text-[#A0A0A0] hover:text-[#111111]'
            }`}
          >
            <Type className="w-4 h-4 stroke-[1.75px]" />
            <span>Text story</span>
          </button>

          <button
            type="button"
            onClick={() => setMode('media')}
            className={`flex items-center justify-center gap-2 py-2 rounded-[8px] text-[13px] font-semibold transition-all ${
              mode === 'media'
                ? 'bg-[#FFFFFF] dark:bg-[#1A1A1A] text-[#111111] dark:text-[#F5F5F5] shadow-xs'
                : 'text-[#6B6B6B] dark:text-[#A0A0A0] hover:text-[#111111]'
            }`}
          >
            <Image className="w-4 h-4 stroke-[1.75px]" />
            <span>Photo story</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-4 pb-4 space-y-4">
          {/* Live Preview / Canvas */}
          <div
            className="relative w-full h-[240px] rounded-[12px] overflow-hidden flex items-center justify-center p-4 transition-colors"
            style={{
              backgroundColor: mode === 'text' ? backgroundColor : '#0D0D0D',
            }}
          >
            {mode === 'text' ? (
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Tap to type your story..."
                maxLength={280}
                className="w-full h-full bg-transparent text-white text-center text-[18px] font-bold outline-none resize-none placeholder-white/50 flex items-center justify-center pt-12"
              />
            ) : previewUrl ? (
              <div className="relative w-full h-full">
                <img
                  src={previewUrl}
                  alt="Story preview"
                  className="w-full h-full object-cover rounded-[10px]"
                />
                <button
                  type="button"
                  onClick={handleClearFile}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center gap-2 text-white/80 cursor-pointer p-6 border-2 border-dashed border-white/20 rounded-[12px] w-full h-full hover:border-white/40 transition-colors">
                <Upload className="w-6 h-6 stroke-[1.75px]" />
                <span className="text-[13px] font-semibold">Choose photo</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* Color Palettes for Text Mode */}
          {mode === 'text' && (
            <div className="flex items-center justify-center gap-2 pt-1">
              {COLOR_PRESETS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setBackgroundColor(color)}
                  className={`w-7 h-7 rounded-full transition-transform ${
                    backgroundColor === color
                      ? 'scale-110 ring-2 ring-offset-2 ring-[#FF5C35]'
                      : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: color }}
                  aria-label={`Color ${color}`}
                />
              ))}
            </div>
          )}

          {/* Optional Caption for Media Mode */}
          {mode === 'media' && previewUrl && (
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Add an optional caption..."
              className="w-full h-[38px] px-3 rounded-[9px] bg-[#FAFAF8] dark:bg-[#0D0D0D] border border-[#E7E5E2] dark:border-[#292929] text-[13px] text-[#111111] dark:text-[#F5F5F5] outline-none"
            />
          )}

          {error && (
            <p className="text-[12px] text-red-500 text-center">{error}</p>
          )}

          <div className="flex items-center justify-between pt-2">
            <span className="text-[11px] text-[#929292] dark:text-[#707070]">
              Disappears after 24 hours
            </span>

            <div className="flex items-center gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={onClose}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="accent"
                size="sm"
                isLoading={isSubmitting}
              >
                Share story
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
