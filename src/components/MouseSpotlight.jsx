import { useEffect, useRef } from 'react';

/**
 * MouseSpotlight
 * ──────────────
 * Renders a large, soft radial-gradient blob that follows the mouse
 * (or touch) with a smooth spring / lerp easing.  The blob illuminates
 * the bg-grid lines without competing with foreground content.
 *
 * Performance: uses a single absolutely-positioned <div> whose
 * `background` string is updated via a ref directly in the RAF loop —
 * zero React re-renders after mount.
 */
export default function MouseSpotlight() {
  const blobRef = useRef(null);

  useEffect(() => {
    const blob = blobRef.current;
    if (!blob) return;

    // Current rendered position (lerped)
    let cx = window.innerWidth  * 0.5;
    let cy = window.innerHeight * 0.4;

    // Target position (raw mouse)
    let tx = cx;
    let ty = cy;

    // Spring factor: 0.04 = very smooth, 0.12 = snappier
    const LERP = 0.055;

    let rafId;

    const onMouseMove = (e) => {
      tx = e.clientX;
      ty = e.clientY;
    };

    const onTouchMove = (e) => {
      if (e.touches.length > 0) {
        tx = e.touches[0].clientX;
        ty = e.touches[0].clientY;
      }
    };

    // Idle drift — a slow Lissajous so the blob still moves on touch-only devices
    let t = 0;
    let isIdle = true;
    let idleTimer;
    const resetIdle = () => {
      isIdle = false;
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => { isIdle = true; }, 3500);
    };

    const onAnyMove = (e) => {
      resetIdle();
      if (e.type === 'mousemove') onMouseMove(e);
      if (e.type === 'touchmove') onTouchMove(e);
    };

    const tick = () => {
      t += 0.004;

      if (isIdle) {
        // Drift in a slow figure-of-eight when no mouse input
        const W = window.innerWidth;
        const H = window.innerHeight;
        tx = W * 0.5 + Math.sin(t)         * W * 0.32;
        ty = H * 0.5 + Math.sin(t * 2.0)   * H * 0.22;
      }

      // Lerp current toward target
      cx += (tx - cx) * LERP;
      cy += (ty - cy) * LERP;

      // Write directly to DOM — bypasses React
      blob.style.left = `${cx}px`;
      blob.style.top  = `${cy}px`;

      rafId = requestAnimationFrame(tick);
    };

    window.addEventListener('mousemove', onAnyMove, { passive: true });
    window.addEventListener('touchmove',  onAnyMove, { passive: true });

    rafId = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener('mousemove', onAnyMove);
      window.removeEventListener('touchmove',  onAnyMove);
      cancelAnimationFrame(rafId);
      clearTimeout(idleTimer);
    };
  }, []);

  return (
    <div
      ref={blobRef}
      aria-hidden
      style={{
        position: 'fixed',
        // Centred on the tracked point via negative translate
        transform: 'translate(-50%, -50%)',
        width:  '780px',
        height: '780px',
        borderRadius: '50%',
        // Two layered gradients:
        // 1. Sharp-ish core (accent blue)
        // 2. Wide diffuse halo (darker tint, fades the grid)
        background:
          'radial-gradient(circle, rgba(79,127,255,0.13) 0%, rgba(79,127,255,0.07) 30%, transparent 70%)',
        pointerEvents: 'none',
        zIndex: 0,
        // No transition here — lerp in RAF is smoother
      }}
    />
  );
}
