import React, { useEffect, useState } from "react";
import { Plus, Trash2, Image as ImageIcon, AlignLeft, ChevronUp, ChevronDown } from "lucide-react";
import { ImageUpload } from "./ImageUpload";
import { ContentBlock, parseBlocks, serializeBlocks } from "./RichDescription";

interface BlockEditorProps {
  value: string;
  onChange: (value: string) => void;
}

let idCounter = 0;
const newId = () => `blk-${++idCounter}-${Date.now()}`;

/** Block-based rich text editor: supports paragraph text + image blocks. */
export function BlockEditor({ value, onChange }: BlockEditorProps) {
  const [blocks, setBlocks] = useState<ContentBlock[]>(() => {
    const parsed = parseBlocks(value);
    return parsed.map(b => ({ ...b, id: b.id || newId() }));
  });

  // Sync external value changes (e.g. form reset)
  useEffect(() => {
    const parsed = parseBlocks(value);
    const withIds = parsed.map(b => ({ ...b, id: b.id || newId() }));
    setBlocks(withIds);
  }, []);

  const push = (updated: ContentBlock[]) => {
    setBlocks(updated);
    onChange(serializeBlocks(updated));
  };

  const addText = () => push([...blocks, { id: newId(), type: "text", content: "" }]);
  const addImage = () => push([...blocks, { id: newId(), type: "image", url: "", caption: "" }]);

  const remove = (idx: number) => push(blocks.filter((_, i) => i !== idx));

  const moveUp = (idx: number) => {
    if (idx === 0) return;
    const b = [...blocks];
    [b[idx - 1], b[idx]] = [b[idx], b[idx - 1]];
    push(b);
  };

  const moveDown = (idx: number) => {
    if (idx === blocks.length - 1) return;
    const b = [...blocks];
    [b[idx], b[idx + 1]] = [b[idx + 1], b[idx]];
    push(b);
  };

  const updateBlock = (idx: number, patch: Partial<ContentBlock>) => {
    const updated = blocks.map((b, i) => i === idx ? { ...b, ...patch } : b);
    setBlocks(updated);
    onChange(serializeBlocks(updated));
  };

  return (
    <div className="space-y-3">
      {blocks.length === 0 && (
        <div className="text-center py-6 text-gray-400 text-sm border-2 border-dashed border-gray-200 rounded-xl">
          点击下方按钮添加文字或图片
        </div>
      )}

      {blocks.map((block, idx) => (
        <div key={block.id} className="group relative border border-gray-200 rounded-xl overflow-hidden bg-white">
          {/* Block controls */}
          <div className="flex items-center justify-between px-3 py-2 bg-gray-50 border-b border-gray-100">
            <span className="text-xs font-medium text-gray-400 flex items-center gap-1">
              {block.type === "text" ? (
                <><AlignLeft className="w-3.5 h-3.5" />文字段落</>
              ) : (
                <><ImageIcon className="w-3.5 h-3.5" />图片</>
              )}
            </span>
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={() => moveUp(idx)}
                disabled={idx === 0}
                className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 rounded"
              >
                <ChevronUp className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => moveDown(idx)}
                disabled={idx === blocks.length - 1}
                className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 rounded"
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => remove(idx)}
                className="p-1 text-red-400 hover:text-red-600 rounded ml-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Block content */}
          <div className="p-3">
            {block.type === "text" ? (
              <textarea
                className="w-full border-0 outline-none text-sm text-gray-700 leading-relaxed resize-none min-h-[80px] bg-transparent placeholder-gray-300"
                placeholder="在此输入段落文字..."
                value={block.content || ""}
                onChange={e => updateBlock(idx, { content: e.target.value })}
                rows={3}
              />
            ) : (
              <div className="space-y-2">
                <ImageUpload
                  value={block.url || ""}
                  onChange={url => updateBlock(idx, { url })}
                  placeholder="上传图片"
                  showCacheOptions
                />
                <input
                  type="text"
                  className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-xs text-gray-600 placeholder-gray-300"
                  placeholder="图片说明（可选）"
                  value={block.caption || ""}
                  onChange={e => updateBlock(idx, { caption: e.target.value })}
                />
              </div>
            )}
          </div>
        </div>
      ))}

      {/* Add buttons */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={addText}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 border-2 border-dashed border-gray-300 rounded-xl text-sm text-gray-500 hover:border-green-400 hover:text-green-600 transition-colors"
        >
          <Plus className="w-4 h-4" />
          添加段落
        </button>
        <button
          type="button"
          onClick={addImage}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 border-2 border-dashed border-gray-300 rounded-xl text-sm text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors"
        >
          <ImageIcon className="w-4 h-4" />
          插入图片
        </button>
      </div>
    </div>
  );
}
