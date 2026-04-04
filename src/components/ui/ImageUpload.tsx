import React, { useEffect, useRef, useState } from "react";
import { Upload, X, Image as ImageIcon, Loader2, HardDrive, RefreshCw } from "lucide-react";
import { api } from "../../api/client";
import { useToast } from "../../store/useToast";

interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  placeholder?: string;
  className?: string;
  accept?: string;
  maxSizeMB?: number;
  /** Show local cache import / cache-to-local buttons */
  showCacheOptions?: boolean;
}

/**
 * ImageUpload component
 *
 * 所有图片统一走后端接口：
 * 1. POST /api/v1/upload/image           - 上传图片到服务器，返回URL
 * 2. POST /api/v1/cache/import-local     - 从本地路径导入图片到缓存
 * 3. POST /api/v1/cache/cache-uploaded   - 缓存已上传图片到本地
 *
 * 前端只做显示，不做base64回退。上传失败就是失败，不会用本地预览蒙混过关。
 */
export function ImageUpload({
  value,
  onChange,
  placeholder = "点击或拖拽上传图片",
  className = "",
  accept = "image/*",
  maxSizeMB = 5,
  showCacheOptions = false,
}: ImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [showLocalImport, setShowLocalImport] = useState(false);
  const [localPath, setLocalPath] = useState("");
  const { addToast } = useToast();

  // previewUrl always synced with external value prop
  const previewUrl = value || "";

  const handleFileSelect = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      addToast("请选择图片文件", "error");
      return;
    }
    if (file.size > maxSizeMB * 1024 * 1024) {
      addToast(`图片大小不能超过 ${maxSizeMB}MB`, "error");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await api.post("/upload/image", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data?.code === 200 && res.data?.data?.url) {
        const uploadedUrl = res.data.data.url;
        onChange(uploadedUrl);
        addToast("图片上传成功", "success");
      } else {
        addToast(res.data?.message || "图片上传失败", "error");
      }
    } catch (err: any) {
      console.error("Image upload failed:", err);
      addToast("图片上传失败，请检查网络或后端服务", "error");
    } finally {
      setUploading(false);
    }
  };

  /** Import image from local file path via /api/v1/cache/import-local */
  const handleLocalImport = async () => {
    if (!localPath.trim()) {
      addToast("请输入本地文件路径", "error");
      return;
    }
    setUploading(true);
    try {
      const res = await api.post("/cache/import-local", { filePath: localPath.trim() });
      if (res.data?.code === 200 && res.data?.data?.url) {
        onChange(res.data.data.url);
        setShowLocalImport(false);
        setLocalPath("");
        addToast("本地图片导入成功", "success");
      } else {
        addToast(res.data?.message || "导入失败", "error");
      }
    } catch {
      addToast("本地图片导入失败", "error");
    } finally {
      setUploading(false);
    }
  };

  /** Cache an already-uploaded image to local storage via /api/v1/cache/cache-uploaded */
  const handleCacheToLocal = async () => {
    if (!previewUrl) {
      addToast("没有可缓存的图片", "error");
      return;
    }
    setUploading(true);
    try {
      const res = await api.post("/cache/cache-uploaded", { uploadUrl: previewUrl });
      if (res.data?.code === 200 && res.data?.data?.url) {
        onChange(res.data.data.url);
        addToast("图片已缓存到本地", "success");
      } else {
        addToast(res.data?.message || "缓存失败", "error");
      }
    } catch {
      addToast("缓存到本地失败", "error");
    } finally {
      setUploading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileSelect(file);
  };

  const handleRemove = () => {
    onChange("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Upload area */}
      <div
        className={`relative border-2 border-dashed rounded-xl transition-colors cursor-pointer overflow-hidden ${
          dragOver
            ? "border-blue-400 bg-blue-50"
            : previewUrl
            ? "border-gray-200"
            : "border-gray-300 hover:border-blue-300 hover:bg-blue-50/30"
        }`}
        onClick={() => !uploading && fileInputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        {previewUrl ? (
          <div className="relative aspect-video">
            <img
              src={previewUrl}
              alt="preview"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
            <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 hover:opacity-100">
              <span className="text-white text-sm font-medium bg-black/50 px-3 py-1.5 rounded-lg">
                点击更换图片
              </span>
            </div>
            {!uploading && (
              <button
                onClick={(e) => { e.stopPropagation(); handleRemove(); }}
                className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 px-4">
            {uploading ? (
              <>
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-2" />
                <p className="text-sm text-gray-500">上传中...</p>
              </>
            ) : (
              <>
                <Upload className="w-8 h-8 text-gray-400 mb-2" />
                <p className="text-sm text-gray-600 font-medium">{placeholder}</p>
                <p className="text-xs text-gray-400 mt-1">
                  支持 JPG、PNG、GIF、WebP，最大 {maxSizeMB}MB
                </p>
              </>
            )}
          </div>
        )}
        {uploading && previewUrl && (
          <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          </div>
        )}
      </div>

      {/* URL input + cache options */}
      <div className="flex items-center gap-2">
        <ImageIcon className="w-4 h-4 text-gray-400 shrink-0" />
        <input
          type="text"
          placeholder="或输入图片URL..."
          className="flex-1 text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
          value={previewUrl}
          onChange={(e) => onChange(e.target.value)}
        />
        {showCacheOptions && (
          <>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setShowLocalImport(!showLocalImport); }}
              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="从本地路径导入"
            >
              <HardDrive className="w-4 h-4" />
            </button>
            {previewUrl && previewUrl.startsWith("/uploads/") && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); handleCacheToLocal(); }}
                className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                title="缓存到本地"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            )}
          </>
        )}
      </div>

      {/* Local file import input */}
      {showLocalImport && showCacheOptions && (
        <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-2">
          <input
            type="text"
            placeholder="输入本地文件路径，如 /home/user/photos/product.jpg"
            className="flex-1 text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white"
            value={localPath}
            onChange={(e) => setLocalPath(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLocalImport()}
          />
          <button
            type="button"
            onClick={handleLocalImport}
            disabled={uploading}
            className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 whitespace-nowrap"
          >
            导入
          </button>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={handleInputChange}
      />
    </div>
  );
}
