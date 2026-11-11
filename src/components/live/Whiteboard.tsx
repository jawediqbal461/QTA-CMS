import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { Eraser, Trash2, Undo2 } from "lucide-react";
import type { Board, Stroke } from "../../lib/liveRtc";

const WIDTH = 1280;
const HEIGHT = 720;
export const BOARD_BACKGROUND = "#111827";
const COLORS = ["#ffffff", "#facc15", "#34d399", "#60a5fa", "#f87171", "#c084fc"];

function paint(context: CanvasRenderingContext2D, strokes: Stroke[]) {
  context.fillStyle = BOARD_BACKGROUND;
  context.fillRect(0, 0, WIDTH, HEIGHT);
  context.lineCap = "round";
  context.lineJoin = "round";
  for (const stroke of strokes) {
    if (stroke.pts.length === 0) continue;
    context.strokeStyle = stroke.color;
    context.fillStyle = stroke.color;
    context.lineWidth = stroke.w;
    if (stroke.pts.length === 1) {
      context.beginPath();
      context.arc(stroke.pts[0][0] * WIDTH, stroke.pts[0][1] * HEIGHT, stroke.w / 2, 0, Math.PI * 2);
      context.fill();
      continue;
    }
    context.beginPath();
    context.moveTo(stroke.pts[0][0] * WIDTH, stroke.pts[0][1] * HEIGHT);
    for (let index = 1; index < stroke.pts.length; index += 1) context.lineTo(stroke.pts[index][0] * WIDTH, stroke.pts[index][1] * HEIGHT);
    context.stroke();
  }
}

export default function Whiteboard({ board, canDraw, isTutor, myPeerId, allow, send, registerCanvas }: {
  board: Board;
  canDraw: boolean;
  isTutor: boolean;
  myPeerId: string;
  allow: boolean;
  send: (payload: Record<string, unknown>) => void;
  registerCanvas: (entry: { canvas: HTMLCanvasElement; hasContent: () => boolean } | null) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frame = useRef(0);
  const [color, setColor] = useState(COLORS[0]);
  const [size, setSize] = useState(4);
  const [erasing, setErasing] = useState(false);
  const drawing = useRef<{ id: string; sent: number; timer: number } | null>(null);

  const redraw = useCallback(() => {
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      const context = canvasRef.current?.getContext("2d");
      if (context) paint(context, board.strokes);
    });
  }, [board]);

  useEffect(() => {
    board.listeners.add(redraw);
    redraw();
    const canvas = canvasRef.current;
    if (canvas) registerCanvas({ canvas, hasContent: () => board.strokes.length > 0 });
    return () => { board.listeners.delete(redraw); registerCanvas(null); cancelAnimationFrame(frame.current); };
  }, [board, redraw, registerCanvas]);

  const point = (event: ReactPointerEvent<HTMLCanvasElement>): [number, number] => {
    const rect = event.currentTarget.getBoundingClientRect();
    return [Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width)), Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height))];
  };

  const flush = (stroke: Stroke) => {
    const state = drawing.current;
    if (!state || stroke.pts.length <= state.sent) return;
    send({ op: "seg", id: stroke.id, color: stroke.color, w: stroke.w, pts: stroke.pts.slice(state.sent).map(([x, y]) => [Number(x.toFixed(4)), Number(y.toFixed(4))]) });
    state.sent = stroke.pts.length;
  };

  const onDown = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!canDraw) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    const stroke: Stroke = {
      id: crypto.randomUUID(), peer: myPeerId, color: erasing ? BOARD_BACKGROUND : color, w: erasing ? size * 4 : size, pts: [point(event)],
    };
    board.strokes.push(stroke);
    const timer = window.setInterval(() => flush(stroke), 90);
    drawing.current = { id: stroke.id, sent: 0, timer };
    redraw();
  };

  const onMove = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const state = drawing.current;
    if (!state) return;
    const stroke = board.strokes.find((entry) => entry.id === state.id);
    if (!stroke || stroke.pts.length >= 1500) return;
    stroke.pts.push(point(event));
    redraw();
  };

  const onUp = () => {
    const state = drawing.current;
    if (!state) return;
    window.clearInterval(state.timer);
    const stroke = board.strokes.find((entry) => entry.id === state.id);
    if (stroke) flush(stroke);
    drawing.current = null;
  };

  const undo = () => {
    for (let index = board.strokes.length - 1; index >= 0; index -= 1) {
      if (board.strokes[index].peer === myPeerId) {
        board.strokes.splice(index, 1);
        redraw();
        break;
      }
    }
    send({ op: "undo" });
  };

  return (
    <div className="space-y-2">
      <canvas
        ref={canvasRef} width={WIDTH} height={HEIGHT}
        onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}
        className={`aspect-video w-full touch-none rounded-xl border border-neutral-800 ${canDraw ? "cursor-crosshair" : "cursor-not-allowed"}`}
        aria-label="Shared whiteboard"
      />
      {canDraw ? (
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {COLORS.map((entry) => (
            <button key={entry} type="button" aria-label={`Colour ${entry}`} onClick={() => { setColor(entry); setErasing(false); }}
              className={`h-6 w-6 rounded-full border-2 ${color === entry && !erasing ? "border-emerald-400" : "border-neutral-700"}`} style={{ background: entry }} />
          ))}
          <input type="range" min={2} max={14} value={size} onChange={(event) => setSize(Number(event.target.value))} aria-label="Pen size" className="w-20 accent-emerald-500" />
          <button type="button" onClick={() => setErasing((value) => !value)} className={`rounded-lg border px-2 py-1 font-bold ${erasing ? "border-emerald-500 text-emerald-400" : "border-neutral-700 text-neutral-300"}`}><Eraser size={12} className="inline" /> Eraser</button>
          <button type="button" onClick={undo} className="rounded-lg border border-neutral-700 px-2 py-1 font-bold text-neutral-300"><Undo2 size={12} className="inline" /> Undo</button>
          {isTutor && <button type="button" onClick={() => { board.strokes = []; redraw(); send({ op: "clear" }); }} className="rounded-lg border border-rose-500/40 px-2 py-1 font-bold text-rose-400"><Trash2 size={12} className="inline" /> Clear</button>}
        </div>
      ) : (
        <p className="text-[11px] text-neutral-500">Only the teacher can draw right now.</p>
      )}
      {isTutor && (
        <label className="flex items-center gap-2 text-[11px] text-neutral-300">
          <input type="checkbox" checked={allow} onChange={(event) => send({ op: "allow", value: event.target.checked })} className="accent-emerald-500" />
          Let students and guardians draw too
        </label>
      )}
    </div>
  );
}
