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
 * ImageUpload component - supports local file upload with backend fallback to base64
 *
 * ===== 后端接口规约 =====
 *
 * 接口地址: POST /api/v1/upload/image
 * Content-Type: multipart/form-data
 * 请求字段: "file" (图片文件, 支持 JPG/PNG/GIF, 最大 5MB)
 * 认证: 需携带 Authorization: Bearer <token>
 *
 * 返回格式:
 * {
 *   "code": 200,
 *   "message": "success",
 *   "data": {
 *     "url": "/uploads/a1b2c3d4_product.jpg",
 *     "filename": "a1b2c3d4_product.jpg"
 *   }
 * }
 *
 * ===== Spring Boot 本地存储实现 =====
 *
 * 1. Controller:
 *
 * @RestController
 * @RequestMapping("/api/v1/upload")
 * public class FileUploadController {
 *
 *     @Value("${file.upload-dir:uploads}")
 *     private String uploadDir;
 *
 *     @PostMapping("/image")
 *     public Result<Map<String, String>> uploadImage(@RequestParam("file") MultipartFile file) {
 *         // 校验文件类型
 *         String contentType = file.getContentType();
 *         if (contentType == null || !contentType.startsWith("image/")) {
 *             return Result.fail(400, "只允许上传图片文件");
 *         }
 *         // 校验文件大小 (5MB)
 *         if (file.getSize() > 5 * 1024 * 1024) {
 *             return Result.fail(400, "图片大小不能超过5MB");
 *         }
 *         // 生成唯一文件名
 *         String ext = file.getOriginalFilename() != null
 *             ? file.getOriginalFilename().substring(file.getOriginalFilename().lastIndexOf("."))
 *             : ".jpg";
 *         String filename = UUID.randomUUID().toString().replace("-", "") + ext;
 *         // 按日期分目录存储
 *         String dateDir = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyy/MM/dd"));
 *         Path dir = Paths.get(uploadDir, dateDir);
 *         Files.createDirectories(dir);
 *         Path filePath = dir.resolve(filename);
 *         Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);
 *         String url = "/uploads/" + dateDir + "/" + filename;
 *         return Result.success(Map.of("url", url, "filename", filename));
 *     }
 * }
 *
 * 2. 静态资源映射 (WebMvcConfigurer):
 *
 * @Configuration
 * public class WebMvcConfig implements WebMvcConfigurer {
 *     @Value("${file.upload-dir:uploads}")
 *     private String uploadDir;
 *
 *     @Override
 *     public void addResourceHandlers(ResourceHandlerRegistry registry) {
 *         registry.addResourceHandler("/uploads/**")
 *                 .addResourceLocations("file:" + uploadDir + "/");
 *     }
 * }
 *
 * 3. application.yml:
 *
 * file:
 *   upload-dir: uploads
 * spring:
 *   servlet:
 *     multipart:
 *       max-file-size: 5MB
 *       max-request-size: 10MB
 *
 * ===== 前端行为 =====
 * - 优先尝试上传到后端 POST /api/v1/upload/image
 * - 上传成功: 使用后端返回的 url 作为图片地址
 * - 上传失败(后端未实现): 自动降级为 base64 Data URL 本地预览模式
 * - 同时支持直接输入图片URL
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
