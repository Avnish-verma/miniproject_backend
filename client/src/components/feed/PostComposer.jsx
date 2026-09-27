import React, { useState } from 'react';
import api from '../../services/api';
import { Image, Video, X, Loader2 } from 'lucide-react';
import Avatar from '../common/Avatar';
import Button from '../common/Button';
import { useAuth } from '../../context/AuthContext';

export default function PostComposer({ isOpen, onClose, onPostCreated }) {
  const { user } = useAuth();
  const [caption, setCaption] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [fileType, setFileType] = useState('image'); // 'image' | 'video'
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 50 * 1024 * 1024) {
      setError('File size exceeds 50MB limit');
      return;
    }

    setError('');
    setSelectedFile(file);
    const isVid = file.type.startsWith('video');
    setFileType(isVid ? 'video' : 'image');
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleClearFile = () => {
    setSelectedFile(null);
    setPreviewUrl('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!caption.trim() && !selectedFile) {
      setError('Please add text or attach media.');
      return;
    }

    setIsUploading(true);
    setError('');

    try {
      let uploadedUrl = '';
      let uploadedPublicId = '';

      if (selectedFile) {
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
          throw new Error('Cloudinary direct media upload failed');
        }

        uploadedUrl = cloudData.secure_url;
        uploadedPublicId = cloudData.public_id;
      }

      const payload = {
        caption: caption.trim(),
        postUrl: uploadedUrl,
        public_id: uploadedPublicId,
        media: uploadedUrl
          ? [
              {
                url: uploadedUrl,
                public_id: uploadedPublicId,
                mediaType: fileType,
              },
            ]
          : [],
      };

      const res = await api.post('/api/v1/posts', payload);
      if (res.data?.success) {
        onPostCreated(res.data.data);
        setCaption('');
        handleClearFile();
        onClose();
      }
    } catch (err) {
      console.error('Post creation failed:', err);
      setError(err.response?.data?.error?.message || err.message || 'Failed to publish post');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
      <div className="w-full sm:max-w-lg min-h-screen sm:min-h-0 bg-[#FFFFFF] dark:bg-[#151515] sm:rounded-[16px] border-0 sm:border border-[#E7E5E2] dark:border-[#292929] shadow-xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#E7E5E2] dark:border-[#292929]">
          <button
            onClick={onClose}
            className="p-1 rounded-[6px] text-[#929292] hover:text-[#111111] dark:hover:text-[#F5F5F5] transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 stroke-[1.75px]" />
          </button>
          <span className="font-bold text-[14px] text-[#111111] dark:text-[#F5F5F5]">New post</span>
          <Button
            size="xs"
            variant="accent"
            onClick={handleSubmit}
            isLoading={isUploading}
            disabled={!caption.trim() && !selectedFile}
          >
            Publish
          </Button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-4 flex-1 flex flex-col">
          {error && (
            <div className="p-2.5 mb-3 rounded-[9px] bg-[#D64545]/10 border border-[#D64545]/20 text-[#D64545] dark:text-[#E05252] text-[12px]">
              {error}
            </div>
          )}

          <div className="flex gap-3.5 items-start flex-1">
            <Avatar src={user?.profilePic} name={user?.fullname} size="md" />

            <div className="flex-1 min-w-0">
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="What's happening?"
                rows={5}
                autoFocus
                className="w-full bg-transparent resize-none border-none outline-none text-[15px] leading-relaxed text-[#111111] dark:text-[#F5F5F5] placeholder-[#929292] dark:placeholder-[#707070]"
              />

              {/* Media Preview Box */}
              {previewUrl && (
                <div className="relative mt-2 rounded-[12px] overflow-hidden border border-[#E7E5E2] dark:border-[#292929] bg-[#000000] max-h-64 flex items-center justify-center">
                  {fileType === 'video' ? (
                    <video src={previewUrl} controls className="max-h-64 w-full object-contain" />
                  ) : (
                    <img src={previewUrl} alt="Upload preview" className="max-h-64 w-full object-cover" />
                  )}
                  <button
                    type="button"
                    onClick={handleClearFile}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-black/70 hover:bg-black text-white transition-colors"
                    title="Remove media"
                    aria-label="Remove media"
                  >
                    <X className="w-4 h-4 stroke-[1.75px]" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Bottom Toolbar */}
          <div className="flex items-center justify-between pt-3 mt-4 border-t border-[#E7E5E2]/60 dark:border-[#292929]/60">
            <div className="flex items-center gap-1 text-[#6B6B6B] dark:text-[#A0A0A0]">
              <label
                className="p-2 rounded-[8px] hover:text-[#FF5C35] dark:hover:text-[#FF6845] hover:bg-[#FF5C35]/10 cursor-pointer transition-colors"
                title="Add image"
                aria-label="Add image"
              >
                <Image className="w-5 h-5 stroke-[1.75px]" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </label>
              <label
                className="p-2 rounded-[8px] hover:text-[#FF5C35] dark:hover:text-[#FF6845] hover:bg-[#FF5C35]/10 cursor-pointer transition-colors"
                title="Add video"
                aria-label="Add video"
              >
                <Video className="w-5 h-5 stroke-[1.75px]" />
                <input
                  type="file"
                  accept="video/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </label>
            </div>

            <div className="text-[12px] text-[#929292] dark:text-[#707070] font-mono">
              {caption.length > 0 && <span>{caption.length} / 500</span>}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
