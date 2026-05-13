"use client";

import { useEffect, useImperativeHandle, useRef, forwardRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import type { ParsedGcode } from "@/lib/gcode/parser";

const EXTRUSION_COLOR = new THREE.Color(0x3b82f6); // blue-500
const TRAVEL_COLOR = new THREE.Color(0xd4d4d8); // zinc-300

type Props = {
  parsed: ParsedGcode;
  showTravel: boolean;
};

export type GcodeViewerHandle = {
  setProgress: (moveCount: number) => void;
};

const GcodeViewer = forwardRef<GcodeViewerHandle, Props>(function GcodeViewer(
  { parsed, showTravel },
  ref,
) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Line geometry that holds every G-code segment (one segment per move).
  const extrusionLineRef = useRef<THREE.LineSegments | null>(null);
  const travelLineRef = useRef<THREE.LineSegments | null>(null);

  // Mapping from cumulative move index -> drawRange end position. We rebuild
  // this when the parsed object changes; setProgress just looks it up.
  const extrusionEndPerMoveRef = useRef<Uint32Array | null>(null);
  const travelEndPerMoveRef = useRef<Uint32Array | null>(null);

  useImperativeHandle(
    ref,
    () => ({
      setProgress(moveCount: number) {
        const exMap = extrusionEndPerMoveRef.current;
        const tvMap = travelEndPerMoveRef.current;
        if (extrusionLineRef.current && exMap) {
          const clamped = Math.max(0, Math.min(moveCount, exMap.length - 1));
          extrusionLineRef.current.geometry.setDrawRange(0, exMap[clamped]);
        }
        if (travelLineRef.current && tvMap) {
          const clamped = Math.max(0, Math.min(moveCount, tvMap.length - 1));
          travelLineRef.current.geometry.setDrawRange(0, tvMap[clamped]);
        }
      },
    }),
    [],
  );

  // ---- one-time three.js setup ----
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || 1;
    const height = container.clientHeight || 1;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf4f4f5);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 10000);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(width, height);
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    scene.add(new THREE.AmbientLight(0xffffff, 0.8));
    scene.add(new THREE.GridHelper(300, 30, 0xd4d4d8, 0xe4e4e7));

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controlsRef.current = controls;

    const animate = () => {
      animFrameRef.current = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!container || !cameraRef.current || !rendererRef.current) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w === 0 || h === 0) return;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };
    window.addEventListener("resize", handleResize);
    const observer = new ResizeObserver(() => handleResize());
    observer.observe(container);

    return () => {
      window.removeEventListener("resize", handleResize);
      observer.disconnect();
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current);
      }
      controls.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
  }, []);

  // ---- (re)build geometry whenever parsed G-code changes ----
  useEffect(() => {
    const scene = sceneRef.current;
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    const container = containerRef.current;
    if (!scene || !camera || !controls || !container) return;

    // Tear down previous lines
    if (extrusionLineRef.current) {
      scene.remove(extrusionLineRef.current);
      extrusionLineRef.current.geometry.dispose();
      (extrusionLineRef.current.material as THREE.Material).dispose();
      extrusionLineRef.current = null;
    }
    if (travelLineRef.current) {
      scene.remove(travelLineRef.current);
      travelLineRef.current.geometry.dispose();
      (travelLineRef.current.material as THREE.Material).dispose();
      travelLineRef.current = null;
    }

    if (!parsed.moves.length) return;

    // Build two separate line buffers (extrusion + travel), in cumulative
    // index order — that way the timeline drawRange truncates both
    // proportionally to "moves played" and we don't need vertex colors.
    let extrusionCount = 0;
    let travelCount = 0;
    for (const m of parsed.moves) {
      if (m.isExtrusion) extrusionCount++;
      else travelCount++;
    }

    const extrusionPositions = new Float32Array(extrusionCount * 2 * 3);
    const travelPositions = new Float32Array(travelCount * 2 * 3);
    const exEndPerMove = new Uint32Array(parsed.moves.length + 1);
    const tvEndPerMove = new Uint32Array(parsed.moves.length + 1);

    // Center model around origin for nicer camera framing.
    const cx = (parsed.bbox.min[0] + parsed.bbox.max[0]) / 2;
    const cy = (parsed.bbox.min[1] + parsed.bbox.max[1]) / 2;
    const cz = (parsed.bbox.min[2] + parsed.bbox.max[2]) / 2;

    let exIdx = 0;
    let tvIdx = 0;
    for (let i = 0; i < parsed.moves.length; i++) {
      const m = parsed.moves[i];
      if (m.isExtrusion) {
        extrusionPositions[exIdx * 6 + 0] = m.px - cx;
        extrusionPositions[exIdx * 6 + 1] = m.py - cy;
        extrusionPositions[exIdx * 6 + 2] = m.pz - cz;
        extrusionPositions[exIdx * 6 + 3] = m.x - cx;
        extrusionPositions[exIdx * 6 + 4] = m.y - cy;
        extrusionPositions[exIdx * 6 + 5] = m.z - cz;
        exIdx++;
      } else {
        travelPositions[tvIdx * 6 + 0] = m.px - cx;
        travelPositions[tvIdx * 6 + 1] = m.py - cy;
        travelPositions[tvIdx * 6 + 2] = m.pz - cz;
        travelPositions[tvIdx * 6 + 3] = m.x - cx;
        travelPositions[tvIdx * 6 + 4] = m.y - cy;
        travelPositions[tvIdx * 6 + 5] = m.z - cz;
        tvIdx++;
      }
      // setDrawRange uses *vertex* count; each segment = 2 vertices.
      exEndPerMove[i + 1] = exIdx * 2;
      tvEndPerMove[i + 1] = tvIdx * 2;
    }
    extrusionEndPerMoveRef.current = exEndPerMove;
    travelEndPerMoveRef.current = tvEndPerMove;

    if (extrusionCount > 0) {
      const geo = new THREE.BufferGeometry();
      geo.setAttribute(
        "position",
        new THREE.BufferAttribute(extrusionPositions, 3),
      );
      const mat = new THREE.LineBasicMaterial({ color: EXTRUSION_COLOR });
      const line = new THREE.LineSegments(geo, mat);
      line.frustumCulled = false;
      scene.add(line);
      extrusionLineRef.current = line;
    }

    if (travelCount > 0) {
      const geo = new THREE.BufferGeometry();
      geo.setAttribute(
        "position",
        new THREE.BufferAttribute(travelPositions, 3),
      );
      const mat = new THREE.LineBasicMaterial({
        color: TRAVEL_COLOR,
        transparent: true,
        opacity: 0.5,
      });
      const line = new THREE.LineSegments(geo, mat);
      line.frustumCulled = false;
      line.visible = showTravel;
      scene.add(line);
      travelLineRef.current = line;
    }

    // Frame camera on bbox.
    const sx = parsed.bbox.max[0] - parsed.bbox.min[0];
    const sy = parsed.bbox.max[1] - parsed.bbox.min[1];
    const sz = parsed.bbox.max[2] - parsed.bbox.min[2];
    const maxDim = Math.max(sx, sy, sz, 1);
    const aspect = Math.max(container.clientWidth / container.clientHeight, 0.0001);
    const halfFov = (camera.fov / 2) * (Math.PI / 180);
    const fitHeight = maxDim / 2 / Math.tan(halfFov);
    const fitWidth = fitHeight / aspect;
    const distance = Math.max(fitHeight, fitWidth) * 1.6;

    camera.position.set(distance * 0.85, distance * 0.6, distance);
    camera.near = Math.max(distance / 100, 0.01);
    camera.far = distance * 100;
    camera.aspect = aspect;
    camera.updateProjectionMatrix();
    camera.lookAt(0, 0, 0);
    controls.target.set(0, 0, 0);
    controls.update();

    // Default progress: show everything.
    if (extrusionLineRef.current) {
      extrusionLineRef.current.geometry.setDrawRange(0, extrusionCount * 2);
    }
    if (travelLineRef.current) {
      travelLineRef.current.geometry.setDrawRange(0, travelCount * 2);
    }
  }, [parsed, showTravel]);

  // ---- toggle travel visibility without rebuilding geometry ----
  useEffect(() => {
    if (travelLineRef.current) travelLineRef.current.visible = showTravel;
  }, [showTravel]);

  return (
    <div
      ref={containerRef}
      className="flex-1 min-h-[300px] sm:min-h-[400px] rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800"
    />
  );
});

export default GcodeViewer;
