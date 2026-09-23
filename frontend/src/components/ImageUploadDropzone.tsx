import { useCallback, useRef, useState } from "react";
import { UploadCloud, X, ImageIcon } from "lucide-react";

const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const MAX_FILES = 6;
const MAX_SIZE_MB = 10;

interface StagedImage {
  file: File;
  previewUrl: string;
}

interface ImageUploadDropzoneProps {
  images: StagedImage[];
  onChange: (images: StagedImage[]) => void;
}

export function useStagedImages() {
  const [images, setImages] = useState<StagedImage[]>([]);
  return { images, setImages };
}

export default function ImageUploadDropzone({ images, onChange }: ImageUploadDropzoneProps) {
  const [dragActive, setDragActive] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback(
    (fileList: FileList | null) => {
      if (!fileList) return;
      setValidationError(null);

      const incoming = Array.from(fileList);
      const accepted: StagedImage[] = [];

      for (const file of incoming) {
        if (!ALLOWED_TYPES.includes(file.type)) {
          setValidationError(`"${file.name}" isn't a supported format. Use JPG, PNG, or WEBP.`);
          continue;
        }
        if (file.size > MAX_SIZE_MB * 1024 * 1024) {
          setValidationError(`"${file.name}" is larger than ${MAX_SIZE_MB}MB.`);
          continue;
        }
        accepted.push({ file, previewUrl: URL.createObjectURL(file) });
      }

      const combined = [...images, ...accepted];
      if (combined.length > MAX_FILES) {
        setValidationError(`Up to ${MAX_FILES} package images are supported.`);
      }
      onChange(combined.slice(0, MAX_FILES));
    },
    [images, onChange]
  );

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragActive(false);
    addFiles(e.dataTransfer.files);
  }

  function removeAt(index: number) {
    const target = images[index];
    URL.revokeObjectURL(target.previewUrl);
    onChange(images.filter((_, i) => i !== index));
  }

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-6 py-10 text-center transition ${
          dragActive ? "border-teal-500 bg-teal-50" : "border-slate-300 hover:border-navy-400"
        }`}
      >
        <UploadCloud className="mb-2 h-8 w-8 text-slate-400" />
        <p className="text-sm font-medium text-slate-600">
          Drag & drop package images, or click to browse
        </p>
        <p className="mt-1 text-xs text-slate-400">
          JPG, PNG, or WEBP · up to {MAX_SIZE_MB}MB each · up to {MAX_FILES} images (front, back, side…)
        </p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ALLOWED_TYPES.join(",")}
          className="hidden"
          onChange={(e) => addFiles(e.target.files)}
        />
      </div>

      {validationError && <p className="mt-2 text-sm text-critical">{validationError}</p>}

      {images.length > 0 && (
        <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4">
          {images.map((img, i) => (
            <div
              key={img.previewUrl}
              className="group relative overflow-hidden rounded-lg border border-slate-200"
            >
              <img src={img.previewUrl} alt={img.file.name} className="h-24 w-full object-cover" />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeAt(i);
                }}
                className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white opacity-0 transition group-hover:opacity-100"
              >
                <X className="h-3 w-3" />
              </button>
              <div className="flex items-center gap-1 bg-white/90 px-1.5 py-1 text-[10px] text-slate-600">
                <ImageIcon className="h-3 w-3 shrink-0" />
                <span className="truncate">{img.file.name}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export type { StagedImage };
