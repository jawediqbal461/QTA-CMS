import { accountRequest } from "./api";

export type RecorderOptions = {
  token: string;
  kind: "booking" | "class";
  id: string;
  localStream: MediaStream | null;
  remoteStreams: Iterable<MediaStream>;
  tiles: () => HTMLVideoElement[];
  board: () => { canvas: HTMLCanvasElement; hasContent: boolean } | null;
  onError: (message: string) => void;
};

export type ClassRecorder = {
  addAudioStream: (stream: MediaStream) => void;
  stop: () => Promise<void>;
};

const WIDTH = 1280;
const HEIGHT = 720;

function pickMimeType() {
  const candidates = ["video/webm;codecs=vp8,opus", "video/webm;codecs=vp9,opus", "video/webm"];
  return candidates.find((type) => MediaRecorder.isTypeSupported(type)) ?? "";
}

function drawTile(context: CanvasRenderingContext2D, video: HTMLVideoElement, x: number, y: number, w: number, h: number) {
  context.fillStyle = "#171717";
  context.fillRect(x, y, w, h);
  if (video.videoWidth > 0 && video.readyState >= 2) {
    const scale = Math.min(w / video.videoWidth, h / video.videoHeight);
    const dw = video.videoWidth * scale;
    const dh = video.videoHeight * scale;
    context.drawImage(video, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
  }
  const name = video.dataset.name;
  if (name) {
    context.fillStyle = "rgba(0,0,0,0.55)";
    context.fillRect(x, y + h - 26, Math.min(w, 220), 26);
    context.fillStyle = "#ffffff";
    context.font = "16px sans-serif";
    context.fillText(name.slice(0, 26), x + 8, y + h - 8);
  }
}

// Records the class entirely in the tutor's browser: all video tiles (and the whiteboard when it is in use) are
// composed on a canvas, every participant's audio is mixed, and the result is uploaded in small chunks.
export async function startClassRecording(options: RecorderOptions): Promise<ClassRecorder> {
  const { token, kind, id } = options;
  const created = await accountRequest<{ id: string }>(`/live/rooms/${kind}/${id}/recordings`, token, "POST");
  const recordingId = created.id;

  const canvas = document.createElement("canvas");
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Your browser cannot compose the recording.");

  const audioContext = new AudioContext();
  const destination = audioContext.createMediaStreamDestination();
  const mixed = new Set<string>();
  const addAudioStream = (stream: MediaStream) => {
    for (const track of stream.getAudioTracks()) {
      if (mixed.has(track.id)) continue;
      mixed.add(track.id);
      audioContext.createMediaStreamSource(new MediaStream([track])).connect(destination);
    }
  };
  if (options.localStream) addAudioStream(options.localStream);
  for (const stream of options.remoteStreams) addAudioStream(stream);

  const render = () => {
    context.fillStyle = "#0a0a0a";
    context.fillRect(0, 0, WIDTH, HEIGHT);
    const tiles = options.tiles();
    const board = options.board();
    if (board?.hasContent) {
      const stageWidth = Math.floor(WIDTH * 0.68);
      context.drawImage(board.canvas, 0, 0, stageWidth, HEIGHT);
      const tileHeight = Math.min(HEIGHT / Math.max(tiles.length, 1), 220);
      tiles.forEach((video, index) => drawTile(context, video, stageWidth + 8, index * tileHeight, WIDTH - stageWidth - 8, tileHeight - 4));
    } else if (tiles.length > 0) {
      const columns = Math.ceil(Math.sqrt(tiles.length));
      const rows = Math.ceil(tiles.length / columns);
      const w = WIDTH / columns;
      const h = HEIGHT / rows;
      tiles.forEach((video, index) => drawTile(context, video, (index % columns) * w, Math.floor(index / columns) * h, w - 4, h - 4));
    }
  };
  render();
  const timer = window.setInterval(render, 66);

  const output = new MediaStream([...canvas.captureStream(15).getVideoTracks(), ...destination.stream.getAudioTracks()]);
  const mimeType = pickMimeType();
  const recorder = new MediaRecorder(output, { ...(mimeType ? { mimeType } : {}), videoBitsPerSecond: 800_000, audioBitsPerSecond: 64_000 });
  const startedAt = Date.now();

  let queue = Promise.resolve();
  let failed = false;
  const upload = (blob: Blob) => {
    queue = queue.then(async () => {
      if (failed) return;
      for (let attempt = 1; attempt <= 3; attempt += 1) {
        try {
          const response = await fetch("/api/live/recordings/" + recordingId + "/chunk", {
            method: "POST",
            headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/octet-stream" },
            body: blob,
          });
          if (response.ok) return;
          if (response.status === 413) throw new Error("The recording reached the size limit.");
        } catch (error) {
          if (attempt === 3 || (error instanceof Error && error.message.includes("size limit"))) {
            failed = true;
            options.onError(error instanceof Error ? error.message : "Uploading the recording failed.");
            return;
          }
        }
        await new Promise((resolve) => window.setTimeout(resolve, 800 * attempt));
      }
      failed = true;
      options.onError("Uploading the recording failed. The part saved so far is kept.");
    });
  };

  recorder.ondataavailable = (event) => { if (event.data.size > 0) upload(event.data); };
  recorder.start(5000);

  return {
    addAudioStream,
    async stop() {
      window.clearInterval(timer);
      if (recorder.state !== "inactive") {
        await new Promise<void>((resolve) => { recorder.addEventListener("stop", () => resolve(), { once: true }); recorder.stop(); });
      }
      await queue;
      output.getTracks().forEach((track) => track.stop());
      void audioContext.close();
      await accountRequest(`/live/recordings/${recordingId}/finish`, token, "POST", { durationSec: Math.round((Date.now() - startedAt) / 1000) });
    },
  };
}
