import { useState, useCallback } from 'react';
import type { ReactNode } from 'react';

interface TraceDockProps {
  canvas: ReactNode;
  inspector: ReactNode;
  editor: ReactNode;
}

export default function TraceDock({ canvas, inspector, editor }: TraceDockProps) {
  const [inspectorWidth, setInspectorWidth] = useState(320);
  const [editorWidth, setEditorWidth] = useState(384);
  const [inspectorOpen, setInspectorOpen] = useState(true);
  const [editorOpen, setEditorOpen] = useState(true);

  const handleInspectorResize = useCallback((e: MouseEvent) => {
    const startX = e.clientX;
    const startWidth = inspectorWidth;
    const onMouseMove = (moveEvent: MouseEvent) => {
      const delta = startX - moveEvent.clientX;
      const newWidth = Math.min(480, Math.max(240, startWidth + delta));
      setInspectorWidth(newWidth);
    };
    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      document.body.style.cursor = '';
    };
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    document.body.style.cursor = 'col-resize';
  }, [inspectorWidth]);

  const handleEditorResize = useCallback((e: MouseEvent) => {
    const startX = e.clientX;
    const startWidth = editorWidth;
    const onMouseMove = (moveEvent: MouseEvent) => {
      const delta = startX - moveEvent.clientX;
      const newWidth = Math.min(640, Math.max(280, startWidth + delta));
      setEditorWidth(newWidth);
    };
    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      document.body.style.cursor = '';
    };
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    document.body.style.cursor = 'col-resize';
  }, [editorWidth]);

  return (
    <div className="flex flex-1 min-h-0 overflow-hidden">
      {/* Canvas */}
      <div className="flex-1 min-w-0 h-full relative">
        {canvas}
        {(!inspectorOpen || !editorOpen) && (
          <div className="absolute top-2 right-2 flex gap-1 z-10">
            {!inspectorOpen && (
              <button
                type="button"
                onClick={() => setInspectorOpen(true)}
                className="text-[11px] px-2 py-1 bg-sidebar border border-border text-secondary hover:text-primary rounded"
              >
                Inspector
              </button>
            )}
            {!editorOpen && (
              <button
                type="button"
                onClick={() => setEditorOpen(true)}
                className="text-[11px] px-2 py-1 bg-sidebar border border-border text-secondary hover:text-primary rounded"
              >
                Editor
              </button>
            )}
          </div>
        )}
      </div>

      {/* Inspector resize handle */}
      {inspectorOpen && (
        <div
          role="separator"
          aria-label="Resize step inspector"
          className="w-1 bg-border hover:bg-accent cursor-col-resize transition-colors"
          onMouseDown={(e) => handleInspectorResize(e.nativeEvent)}
        />
      )}

      {/* Inspector */}
      {inspectorOpen && (
        <div
          className="h-full flex flex-col border-l border-border"
          style={{ width: inspectorWidth }}
        >
          <div className="h-8 flex items-center justify-between px-3 bg-sidebar border-b border-border">
            <span className="text-xs text-secondary">Step Inspector</span>
            <button
              type="button"
              onClick={() => setInspectorOpen(false)}
              className="text-secondary hover:text-primary text-xs"
              aria-label="Close panel"
            >
              ✕
            </button>
          </div>
          <div className="flex-1 overflow-hidden">{inspector}</div>
        </div>
      )}

      {/* Editor resize handle */}
      {editorOpen && (
        <div
          role="separator"
          aria-label="Resize JSON editor"
          className="w-1 bg-border hover:bg-accent cursor-col-resize transition-colors"
          onMouseDown={(e) => handleEditorResize(e.nativeEvent)}
        />
      )}

      {/* Editor */}
      {editorOpen && (
        <div
          className="h-full flex flex-col border-l border-border"
          style={{ width: editorWidth }}
        >
          <div className="h-8 flex items-center justify-between px-3 bg-sidebar border-b border-border">
            <span className="text-xs text-secondary">Test data</span>
            <button
              type="button"
              onClick={() => setEditorOpen(false)}
              className="text-secondary hover:text-primary text-xs"
              aria-label="Close panel"
            >
              ✕
            </button>
          </div>
          <div className="flex-1 overflow-hidden">{editor}</div>
        </div>
      )}
    </div>
  );
}
