/**
 * Generates a real playable video Blob directly in the browser
 * using HTML Canvas, Web Audio API, and MediaRecorder.
 * Useful for instant testing, verification, and demoing without uploading local files.
 */
export async function generateSampleVideo(durationSeconds = 45): Promise<File> {
  const canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = 360;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context not available.');

  // Create AudioContext for audio track
  const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  const dest = audioCtx.createMediaStreamDestination();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(440, audioCtx.currentTime); // 440 Hz standard pitch
  gain.gain.setValueAtTime(0.05, audioCtx.currentTime); // Low volume
  osc.connect(gain);
  gain.connect(dest);
  osc.start();

  const canvasStream = canvas.captureStream(30);
  // Add audio track to stream
  dest.stream.getAudioTracks().forEach((track) => canvasStream.addTrack(track));

  // Determine supported mime type
  let mimeType = 'video/webm;codecs=vp8,opus';
  if (!MediaRecorder.isTypeSupported(mimeType)) {
    if (MediaRecorder.isTypeSupported('video/webm')) {
      mimeType = 'video/webm';
    } else if (MediaRecorder.isTypeSupported('video/mp4')) {
      mimeType = 'video/mp4';
    }
  }

  const mediaRecorder = new MediaRecorder(canvasStream, {
    mimeType: mimeType || undefined,
  });

  const chunks: Blob[] = [];
  mediaRecorder.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) chunks.push(e.data);
  };

  return new Promise<File>((resolve, reject) => {
    mediaRecorder.onstop = () => {
      osc.stop();
      audioCtx.close();
      const extension = mimeType.includes('mp4') ? 'mp4' : 'webm';
      const videoBlob = new Blob(chunks, { type: mimeType });
      const file = new File([videoBlob], `sample_demo_${durationSeconds}s.${extension}`, {
        type: mimeType,
      });
      resolve(file);
    };

    mediaRecorder.onerror = (e) => {
      osc.stop();
      audioCtx.close();
      reject(e);
    };

    mediaRecorder.start(100);

    const startTime = performance.now();
    const intervalMs = 1000 / 30; // 30 fps

    const drawFrame = () => {
      const elapsed = (performance.now() - startTime) / 1000;
      if (elapsed >= durationSeconds) {
        mediaRecorder.stop();
        return;
      }

      // Render video frame
      const progress = elapsed / durationSeconds;
      const hue = Math.floor(progress * 360);

      // Background gradient
      const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      grad.addColorStop(0, `hsl(${hue}, 70%, 15%)`);
      grad.addColorStop(1, `hsl(${(hue + 60) % 360}, 65%, 8%)`);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Grid lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.lineWidth = 1;
      for (let x = 0; x < canvas.width; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // Title & Clock
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 24px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('CutPulse Test Video', canvas.width / 2, 100);

      const mins = Math.floor(elapsed / 60);
      const secs = Math.floor(elapsed % 60);
      const ms = Math.floor((elapsed - Math.floor(elapsed)) * 100);
      const timeStr = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;

      ctx.fillStyle = '#60A5FA';
      ctx.font = '600 48px monospace';
      ctx.fillText(timeStr, canvas.width / 2, 180);

      ctx.fillStyle = '#94A3B8';
      ctx.font = '16px system-ui, sans-serif';
      ctx.fillText(`Total Duration: ${durationSeconds}s · 30 FPS · Stereo 440Hz Tone`, canvas.width / 2, 230);

      // Progress bar
      ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.fillRect(80, 270, canvas.width - 160, 10);
      ctx.fillStyle = '#38BDF8';
      ctx.fillRect(80, 270, (canvas.width - 160) * progress, 10);

      setTimeout(drawFrame, intervalMs);
    };

    drawFrame();
  });
}
