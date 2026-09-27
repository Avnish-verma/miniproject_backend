import React, { useState } from 'react';
import { X, Image, Video, Type, Loader2, Upload } from 'lucide-react';
import Avatar from '../common/Avatar';
import Button from '../common/Button';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

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
  const toast = useToast();
  const [mode, setMode] = useState('text'); // 'text' | 'photo' | 'video'
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

    const isVid = mode === 'video';
    const maxSize = isVid ? 50 * 1024 * 1024 : 20 * 1024 * 1024;

    if (file.size > maxSize) {
      setError(`File size cannot exceed ${isVid ? '50MB' : '20MB'}`);
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
    if ((mode === 'photo' || mode === 'video') && !selectedFile) {
      setError(`Please choose a ${mode === 'video' ? 'video' : 'photo'} for your story.`);
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      let uploadedUrl = '';
      let uploadedPublicId = '';

      if ((mode === 'photo' || mode === 'video') && selectedFile) {
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
        mediaType: mode === 'video' ? 'video' : mode === 'photo' ? 'image' : 'text',
        backgroundColor: mode === 'text' ? backgroundColor : '#000000',
      });

      if (toast?.success) {
        toast.success('Story published successfully!');
      }

      if (onStoryCreated) onStoryCreated();
      onClose();
    } catch (err) {
      console.error('Failed to create story:', err);
      setError(err.response?.data?.message || err.message || 'Could not publish story. Please try again.');
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

        {/* Story Type Selector: Text, Photo, Video */}
        <div className="grid grid-cols-3 p-1.5 m-4 bg-[#FAFAF8] dark:bg-[#0D0D0D] rounded-[10px] border border-[#E7E5E2] dark:border-[#292929] gap-1">
          <button
            type="button"
            onClick={() => {
              setMode('text');
              handleClearFile();
            }}
            className={`flex items-center justify-center gap-1.5 py-2 rounded-[8px] text-[12px] font-semibold transition-all ${
              mode === 'text'
                ? 'bg-[#FFFFFF] dark:bg-[#1A1A1A] text-[#111111] dark:text-[#F5F5F5] shadow-xs'
                : 'text-[#6B6B6B] dark:text-[#A0A0A0] hover:text-[#111111]'
            }`}
          >
            <Type className="w-3.5 h-3.5 stroke-[1.75px]" />
            <span>Text</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setMode('photo');
              handleClearFile();
            }}
            className={`flex items-center justify-center gap-1.5 py-2 rounded-[8px] text-[12px] font-semibold transition-all ${
              mode === 'photo'
                ? 'bg-[#FFFFFF] dark:bg-[#1A1A1A] text-[#111111] dark:text-[#F5F5F5] shadow-xs'
                : 'text-[#6B6B6B] dark:text-[#A0A0A0] hover:text-[#111111]'
            }`}
          >
            <Image className="w-3.5 h-3.5 stroke-[1.75px]" />
            <span>Photo</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setMode('video');
              handleClearFile();
            }}
            className={`flex items-center justify-center gap-1.5 py-2 rounded-[8px] text-[12px] font-semibold transition-all ${
              mode === 'video'
                ? 'bg-[#FFFFFF] dark:bg-[#1A1A1A] text-[#111111] dark:text-[#F5F5F5] shadow-xs'
                : 'text-[#6B6B6B] dark:text-[#A0A0A0] hover:text-[#111111]'
            }`}
          >
            <Video className="w-3.5 h-3.5 stroke-[1.75px]" />
            <span>Video</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-4 pb-4 space-y-4">
          {/* Live Preview / Canvas */}
          <div
            className="relative w-full h-[260px] rounded-[12px] overflow-hidden flex items-center justify-center p-4 transition-colors"
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
                className="w-full h-full bg-transparent text-white text-center text-[18px] font-bold outline-none resize-none placeholder-white/50 flex items-center justify-center pt-16"
              />
            ) : previewUrl ? (
              <div className="relative w-full h-full flex items-center justify-center">
                {mode === 'video' ? (
                  <video
                    src={previewUrl}
                    controls
                    playsInline
                    className="w-full h-full object-contain rounded-[10px]"
                  />
                ) : (
                  <img
                    src={previewUrl}
                    alt="Story preview"
                    className="w-full h-full object-cover rounded-[10px]"
                  />
                )}
                <button
                  type="button"
                  onClick={handleClearFile}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80 z-10"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center gap-2 text-white/80 cursor-pointer p-6 border-2 border-dashed border-white/20 rounded-[12px] w-full h-full hover:border-white/40 transition-colors">
                <Upload className="w-6 h-6 stroke-[1.75px]" />
                <span className="text-[13px] font-semibold">
                  Choose {mode === 'video' ? 'video (mp4/webm)' : 'photo'}
                </span>
                <input
                  type="file"
                  accept={mode === 'video' ? 'video/mp4,video/webm,video/quicktime' : 'image/*'}
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* Color Palettes for Text Mode */}
          {mode === 'text' && (
            <div className="flex items-center justify-center gap-2.5 py-1">
              {COLOR_PRESETS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setBackgroundColor(color)}
                  className={`w-6 h-6 rounded-full transition-transform ${
                    backgroundColor === color ? 'scale-125 ring-2 ring-white' : 'hover:scale-110'
                  }`}
                  style={{ backgroundColor: color }}
                  aria-label={`Color ${color}`}
                />
              ))}
            </div>
          )}

          {/* Caption for Photo/Video Mode */}
          {(mode === 'photo' || mode === 'video') && previewUrl && (
            <input
              type="text"
              placeholder="Add a caption... (optional)"
              value={text}
              onChange={(e) => setText(e.target.value)}
              maxLength={150}
              className="w-full px-3 py-2 rounded-[8px] bg-[#FAFAF8] dark:bg-[#0D0D0D] border border-[#E7E5E2] dark:border-[#292929] text-[13px] text-[#111111] dark:text-[#F5F5F5] outline-none focus:border-[#FF5C35]"
            />
          )}

          {error && (
            <p className="text-[12px] text-[#D64545] dark:text-[#E05252] text-center font-medium">
              {error}
            </p>
          )}

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E7E5E2] dark:border-[#292929]">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={isSubmitting}
              className="flex items-center gap-1.5 bg-[#FF5C35] hover:bg-[#FF481F]"
            >
              {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{isSubmitting ? 'Sharing...' : 'Share to Story'}</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
