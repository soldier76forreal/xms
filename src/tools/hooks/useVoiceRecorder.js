// Record a voice note with the browser's own MediaRecorder — no package.
//
// A hook rather than a ninth inline copy (CRM, DM, Supply, Job Reports and
// notes each carry their own). The existing ones hard-code `audio/webm`, which
// is wrong on Safari: it records MP4/AAC, so the file would be labelled with a
// type it isn't and some players refuse it. This one names the file by what
// the recorder actually produced.
//
//   const rec = useVoiceRecorder({ onRecorded: (file) => …, maxSeconds: 300 });
//   rec.start() / rec.stop()
//   rec.recording  rec.seconds  rec.error ('denied' | 'unsupported' | null)
//
// Leaving the page (or closing the form) mid-recording releases the microphone
// and throws the take away — it never calls onRecorded for a take nobody ended.
import { useState, useRef, useEffect, useCallback } from 'react';

const extensionFor = (mime = '') => {
  if (mime.includes('mp4') || mime.includes('aac')) return 'm4a';
  if (mime.includes('ogg')) return 'ogg';
  if (mime.includes('wav')) return 'wav';
  return 'webm';
};

export const canRecordAudio = () =>
  typeof navigator !== 'undefined'
  && !!navigator.mediaDevices
  && typeof navigator.mediaDevices.getUserMedia === 'function'
  && typeof window !== 'undefined'
  && typeof window.MediaRecorder !== 'undefined';

export default function useVoiceRecorder({ onRecorded, maxSeconds = 300, filePrefix = 'voice' } = {}) {
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState(null);

  const recorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const discardRef = useRef(false);
  // The latest callback, without re-creating start()/stop() when it changes.
  const onRecordedRef = useRef(onRecorded);
  onRecordedRef.current = onRecorded;

  const release = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  const stop = useCallback(() => {
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== 'inactive') recorder.stop();
    else { release(); setRecording(false); }
  }, [release]);

  const start = useCallback(async () => {
    if (recorderRef.current && recorderRef.current.state === 'recording') return;
    setError(null);
    if (!canRecordAudio()) { setError('unsupported'); return; }

    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (_) {
      setError('denied');
      return;
    }

    try {
      const recorder = new MediaRecorder(stream);
      streamRef.current = stream;
      recorderRef.current = recorder;
      chunksRef.current = [];
      discardRef.current = false;

      recorder.ondataavailable = (e) => { if (e.data && e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = () => {
        const mime = recorder.mimeType || 'audio/webm';
        const take = chunksRef.current;
        chunksRef.current = [];
        release();
        recorderRef.current = null;
        setRecording(false);
        if (discardRef.current || !take.length) return;
        const blob = new Blob(take, { type: mime });
        const file = new File([blob], `${filePrefix}-${Date.now()}.${extensionFor(mime)}`, { type: mime });
        if (onRecordedRef.current) onRecordedRef.current(file);
      };

      recorder.start();
      setSeconds(0);
      setRecording(true);
      // A plain counter, not a state updater: an updater must be pure (React
      // may run it twice), and ending the take is a side effect.
      let elapsed = 0;
      timerRef.current = setInterval(() => {
        elapsed += 1;
        setSeconds(elapsed);
        if (elapsed >= maxSeconds) stop();
      }, 1000);
    } catch (_) {
      stream.getTracks().forEach((track) => track.stop());
      setError('unsupported');
    }
  }, [filePrefix, maxSeconds, release, stop]);

  // Unmounting mid-take: let go of the microphone and drop the audio.
  useEffect(() => () => {
    discardRef.current = true;
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== 'inactive') {
      try { recorder.stop(); } catch (_) { /* already stopped */ }
    }
    release();
  }, [release]);

  return { start, stop, recording, seconds, error, supported: canRecordAudio() };
}
