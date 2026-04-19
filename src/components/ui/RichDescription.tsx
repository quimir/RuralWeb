import React from "react";

export interface ContentBlock {
  id?: string;
  type: "text" | "image";
  content?: string;
  url?: string;
  caption?: string;
}

/** Parse a description string into blocks. Handles JSON blocks or plain text. */
export function parseBlocks(raw: string): ContentBlock[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
  } catch {}
  return [{ type: "text", content: raw }];
}

/** Serialize blocks to a JSON string for storage in the description field. */
export function serializeBlocks(blocks: ContentBlock[]): string {
  return JSON.stringify(blocks.filter(b => (b.type === "text" && b.content?.trim()) || (b.type === "image" && b.url)));
}

/**
 * Extract plain text from a description field (JSON blocks or plain text).
 * Used for product cards, list views, and brief summary areas.
 */
export function getPlainDescription(raw: string, maxLen = 200): string {
  if (!raw) return "";
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      const texts = parsed
        .filter((b: ContentBlock) => b.type === "text" && b.content?.trim())
        .map((b: ContentBlock) => b.content!.trim());
      const joined = texts.join(" ");
      return joined.length > maxLen ? joined.slice(0, maxLen) + "..." : joined;
    }
  } catch {}
  return raw.length > maxLen ? raw.slice(0, maxLen) + "..." : raw;
}

interface RichDescriptionProps {
  content: string;
  className?: string;
}

/** Renders a product description that may contain text + image blocks or plain text. */
export function RichDescription({ content, className = "" }: RichDescriptionProps) {
  const blocks = parseBlocks(content);

  if (blocks.length === 0) return null;

  return (
    <div className={`space-y-4 ${className}`}>
      {blocks.map((block, idx) => {
        if (block.type === "image" && block.url) {
          return (
            <figure key={block.id || idx} className="my-2">
              <img
                src={block.url}
                alt={block.caption || ""}
                className="w-full rounded-xl object-cover"
                referrerPolicy="no-referrer"
              />
              {block.caption && (
                <figcaption className="text-xs text-center text-gray-400 mt-1.5">
                  {block.caption}
                </figcaption>
              )}
            </figure>
          );
        }
        // Text block: render with line breaks preserved
        return (
          <p key={block.id || idx} className="text-gray-600 leading-relaxed whitespace-pre-wrap">
            {block.content}
          </p>
        );
      })}
    </div>
  );
}
