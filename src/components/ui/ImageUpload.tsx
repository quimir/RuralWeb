import React, { useRef, useState } from "react";
import { Upload, X, Image as ImageIcon, Loader2 } from "lucide-react";
import { api } from "../../api/client";
import { useToast } from "../../store/useToast";

interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  placeholder?: string;
  className?: string;
  accept?: string;
  maxSizeMB?: number;
}

/**
 * ImageUpload component - supports local file upload
 *
 * Backend API suggestion:
 * POST /api/v1/upload/image
 * - Accept: multipart/form-data
 * - Field: "file" (the image file)
 * - Returns: { code: 200, data: { url: "https://...", filename: "..." } }
 *
 * Spring Boot implementation example:
 * @PostMapping("/upload/image")
 * public Result<Map<String, String>> uploadImage(@RequestParam("file") MultipartFile file) {
 *     // Save to local storage or cloud (e.g., Aliyun OSS, Minio)
 *     String filename = UUID.randomUUID() + "_" + file.getOriginalFilename();
 *     Path path = Paths.get("uploads/" + filename);
 *     Files.copy(file.getInputStream(), path);
 *     String url = "/uploads/" + filename;
 *     return Result.success(Map.of("url", url, "filename", filename));
 * }
 *
 * Config: add resource handler for /uploads/** -> file:uploads/
 */
export function ImageUpload({
  value,
  onChange,
  placeholder = "点击或拖拽上传图片",
  className = "",
  accept = "image/*",
  maxSizeMB = 5,
}: ImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>(value || "");
  const [dragOver, setDragOver] = useState(false);
  const { addToast } = useToast();

  const handleFileSelect = async (file: File) => {
    // Validate file type
    if (!file.type.startsWith("image/")) {
      addToast("请选择图片文件", "error");
      return;
    }

    // Validate file size
    if (file.size > maxSizeMB * 1024 * 1024) {
      addToast(`图片大小不能超过 ${maxSizeMB}MB`, "error");
      return;
    }

    // Create local preview
    const localPreview = URL.createObjectURL(file);
    setPreviewUrl(localPreview);

    // Try to upload to backend
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await api.post("/upload/image", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data?.code === 200 && res.data?.data?.url) {
        const uploadedUrl = res.data.data.url;
        setPreviewUrl(uploadedUrl);
        onChange(uploadedUrl);
        addToast("图片上传成功", "success");
      } else {
        // Backend may not support upload yet, use local preview as base64 fallback
        const base64 = await fileToBase64(file);
        setPreviewUrl(base64);
        onChange(base64);
        addToast("图片已加载（本地预览模式）", "info");
      }
    } catch {
      // Upload API not available, fallback to base64 data URL
      try {
        const base64 = await fileToBase64(file);
        setPreviewUrl(base64);
        onChange(base64);
        addToast("图片已加载（后端暂不支持上传，使用本地预览）", "info");
      } catch {
        addToast("图片加载失败", "error");
      }
    } finally {
      setUploading(false);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
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
    setPreviewUrl("");
    onChange("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleUrlInput = (url: string) => {
    setPreviewUrl(url);
    onChange(url);
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
              onError={() => {
                // If preview fails (e.g., invalid URL), keep the URL but show fallback
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
                  支持 JPG、PNG、GIF，最大 {maxSizeMB}MB
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

      {/* URL input fallback */}
      <div className="flex items-center gap-2">
        <ImageIcon className="w-4 h-4 text-gray-400 shrink-0" />
        <input
          type="text"
          placeholder="或输入图片URL..."
          className="flex-1 text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
          value={previewUrl?.startsWith("data:") ? "" : previewUrl || ""}
          onChange={(e) => handleUrlInput(e.target.value)}
        />
      </div>

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
