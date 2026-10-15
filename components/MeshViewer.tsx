"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { computeStats, type ModelStats } from "@/lib/converters";
import { THEME_SPECS, type EmbedTheme } from "@/lib/embed-themes";

type Props = {
  object: THREE.Object3D | null;
  compact?: boolean;
  theme?: EmbedTheme;
  /** Click two points on the model to measure the straight-line distance. */
  measure?: boolean;
  /** Label for model units in the measurement readout (e.g. "mm"). */
  unitLabel?: string;
  /** Override the file's up axis for display (Z-up files are stood upright). */
  upAxis?: "y" | "z";
  /**
   * Play the model's own animation clips (GLB / FBX). Off by default: converter
   * pages export what the viewer shows, and a mid-animation pose would leak
   * into the exported mesh.
   */
  playAnimations?: boolean;
};

type Measurement = { points: THREE.Vector3[]; distance: number | null };

function fitCamera(
  camera: THREE.PerspectiveCamera,
  controls: OrbitControls,
  object: THREE.Object3D,
  width: number,
  height: number,
) {
  // Fit the bounding sphere, so the model fits from any orbit angle and a
  // viewport of any aspect (the narrower half-angle is the constraint).
  object.updateMatrixWorld(true);
  const sphere = new THREE.Box3().setFromObject(object).getBoundingSphere(new THREE.Sphere());
  const radius = sphere.radius || 1;
  const aspect = Math.max(width / height, 0.0001);
  const halfV = (camera.fov / 2) * (Math.PI / 180);
  const halfH = Math.atan(Math.tan(halfV) * aspect);
  const distance = (radius / Math.sin(Math.min(halfV, halfH))) * 1.05;

  const dir = new THREE.Vector3(0.85, 0.6, 1).normalize();
  camera.position.copy(sphere.center).addScaledVector(dir, distance);
  camera.near = Math.max(distance / 100, 0.01);
  camera.far = distance * 100;
  camera.aspect = aspect;
  camera.updateProjectionMatrix();
  camera.lookAt(sphere.center);
  controls.target.copy(sphere.center);
  controls.update();
}

export default function MeshViewer({
  object,
  compact = false,
  theme,
  measure = false,
  unitLabel = "mm",
  upAxis,
  playAnimations = false,
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const currentObjectRef = useRef<THREE.Object3D | null>(null);
  const gridHelperRef = useRef<THREE.GridHelper | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const envRef = useRef<THREE.Texture | null>(null);
  const [clips, setClips] = useState<THREE.AnimationClip[]>([]);
  const [clipIndex, setClipIndex] = useState(0);
  const [clipPlaying, setClipPlaying] = useState(true);

  const [stats, setStats] = useState<ModelStats | null>(null);
  const [measurement, setMeasurement] = useState<Measurement>({ points: [], distance: null });

  const themeSpec = theme ? THEME_SPECS[theme] : null;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || 1;
    const height = container.clientHeight || 1;

    const initialBg = themeSpec ? themeSpec.background : 0xf4f4f5;
    const initialMajor = themeSpec ? themeSpec.gridMajor : 0xd4d4d8;
    const initialMinor = themeSpec ? themeSpec.gridMinor : 0xe4e4e7;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(initialBg);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100000);
    camera.position.set(80, 80, 120);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const dir1 = new THREE.DirectionalLight(0xffffff, 0.8);
    dir1.position.set(100, 100, 100);
    scene.add(dir1);
    const dir2 = new THREE.DirectionalLight(0xffffff, 0.4);
    dir2.position.set(-100, -100, -100);
    scene.add(dir2);

    const gridHelper = new THREE.GridHelper(200, 20, initialMajor, initialMinor);
    scene.add(gridHelper);
    gridHelperRef.current = gridHelper;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controlsRef.current = controls;

    // Image-based lighting for PBR materials kept from GLB files — metallic
    // surfaces read as black with only point/directional lights.
    const pmrem = new THREE.PMREMGenerator(renderer);
    envRef.current = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();

    const clock = new THREE.Clock();
    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate);
      const dt = clock.getDelta();
      mixerRef.current?.update(dt);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!container || !cameraRef.current || !rendererRef.current) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w === 0 || h === 0) return;
      rendererRef.current.setSize(w, h);
      if (currentObjectRef.current && controlsRef.current) {
        fitCamera(cameraRef.current, controlsRef.current, currentObjectRef.current, w, h);
      } else {
        cameraRef.current.aspect = w / h;
        cameraRef.current.updateProjectionMatrix();
      }
    };
    window.addEventListener("resize", handleResize);

    const observer = new ResizeObserver(() => handleResize());
    observer.observe(container);

    return () => {
      window.removeEventListener("resize", handleResize);
      observer.disconnect();
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      controls.dispose();
      envRef.current?.dispose();
      envRef.current = null;
      renderer.dispose();
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Apply theme changes after init.
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene || !themeSpec) return;
    scene.background = new THREE.Color(themeSpec.background);
    if (gridHelperRef.current) {
      const grid = gridHelperRef.current;
      grid.material.dispose();
      const newGrid = new THREE.GridHelper(
        200,
        20,
        themeSpec.gridMajor,
        themeSpec.gridMinor,
      );
      scene.remove(grid);
      scene.add(newGrid);
      gridHelperRef.current = newGrid;
    }
    // Re-tint the current object's materials so the theme covers the mesh too.
    if (currentObjectRef.current) {
      currentObjectRef.current.traverse((child) => {
        if (!(child instanceof THREE.Mesh || child instanceof THREE.Points)) return;
        if (child.userData.keepColor) return;
        const mat = child.material;
        const apply = (m: THREE.Material) => {
          if ("color" in m && m.color instanceof THREE.Color) {
            m.color.setHex(themeSpec.meshColor);
          }
        };
        if (Array.isArray(mat)) mat.forEach(apply);
        else if (mat) apply(mat);
      });
    }
  }, [themeSpec]);

  useEffect(() => {
    const scene = sceneRef.current;
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    const container = containerRef.current;
    if (!scene || !camera || !controls || !container) return;

    if (currentObjectRef.current) {
      scene.remove(currentObjectRef.current);
      currentObjectRef.current = null;
    }

    if (!object) {
      setStats(null);
      return;
    }

    // Apply theme mesh color to the freshly-added object too.
    if (themeSpec) {
      object.traverse((child) => {
        if (!(child instanceof THREE.Mesh || child instanceof THREE.Points)) return;
        if (child.userData.keepColor) return;
        const mat = child.material;
        const apply = (m: THREE.Material) => {
          if ("color" in m && m.color instanceof THREE.Color) {
            m.color.setHex(themeSpec.meshColor);
          }
        };
        if (Array.isArray(mat)) mat.forEach(apply);
        else if (mat) apply(mat);
      });
    }

    // Stats in the file's own axes, before any display rotation.
    setStats(computeStats(object));
    scene.environment = object.userData.pbr ? envRef.current : null;
    scene.environmentIntensity = 0.9;
    setClips(object.animations?.length ? [...object.animations] : []);
    setClipIndex(0);
    setClipPlaying(true);

    const box = new THREE.Box3().setFromObject(object);
    const center = new THREE.Vector3();
    box.getCenter(center);
    object.position.sub(center);

    // Display-only: Z-up files (STL/3MF/STEP) stand up in our Y-up scene.
    // The rotation lives on a wrapper so exports keep the file's axes.
    const holder = new THREE.Group();
    holder.name = "__flip3d_view";
    if ((upAxis ?? object.userData.upAxis) === "z") holder.rotation.x = -Math.PI / 2;
    holder.add(object);
    // Sit the model on the grid instead of letting the grid cut through it.
    holder.updateMatrixWorld(true);
    holder.position.y -= new THREE.Box3().setFromObject(holder).min.y;
    holder.updateMatrixWorld(true);
    scene.add(holder);
    currentObjectRef.current = holder;

    fitCamera(
      camera,
      controls,
      object,
      container.clientWidth || 1,
      container.clientHeight || 1,
    );
  }, [object, upAxis]);

  // Two-click measuring. Markers/line draw on top (no depth test) and live in
  // their own group so clearing never touches the model.
  useEffect(() => {
    const renderer = rendererRef.current;
    const scene = sceneRef.current;
    const camera = cameraRef.current;
    setMeasurement({ points: [], distance: null });
    if (!measure || !renderer || !scene || !camera || !object) return;

    const overlay = new THREE.Group();
    overlay.renderOrder = 999;
    scene.add(overlay);
    const box = new THREE.Box3().setFromObject(object);
    const diag = box.getSize(new THREE.Vector3()).length() || 1;
    const markerGeo = new THREE.SphereGeometry(diag / 150, 16, 12);
    const markerMat = new THREE.MeshBasicMaterial({ color: 0xf97316, depthTest: false });
    const lineMat = new THREE.LineBasicMaterial({ color: 0xf97316, depthTest: false });
    const raycaster = new THREE.Raycaster();
    raycaster.params.Points = { threshold: diag / 300 };
    let picked: THREE.Vector3[] = [];
    let down: { x: number; y: number } | null = null;

    const clearOverlay = () => {
      overlay.children.slice().forEach((c) => {
        overlay.remove(c);
        if (c instanceof THREE.Line) c.geometry.dispose();
      });
    };

    const onDown = (e: PointerEvent) => {
      down = { x: e.clientX, y: e.clientY };
    };
    const onUp = (e: PointerEvent) => {
      if (!down || e.button !== 0) return;
      const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y);
      down = null;
      if (moved > 4) return; // that was an orbit drag, not a pick
      const rect = renderer.domElement.getBoundingClientRect();
      const ndc = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1,
      );
      raycaster.setFromCamera(ndc, camera);
      const hit = raycaster
        .intersectObject(object, true)
        .find((h) => h.object.visible && !overlay.children.includes(h.object));
      if (!hit) return;
      if (picked.length === 2) {
        picked = [];
        clearOverlay();
      }
      picked.push(hit.point.clone());
      const marker = new THREE.Mesh(markerGeo, markerMat);
      marker.position.copy(hit.point);
      overlay.add(marker);
      if (picked.length === 2) {
        const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(picked), lineMat);
        overlay.add(line);
      }
      // Report deltas in the file's axes, not the (possibly rotated) view's.
      const toFile = (p: THREE.Vector3) => (object.parent ? object.parent.worldToLocal(p.clone()) : p.clone());
      setMeasurement({
        points: picked.map(toFile),
        distance: picked.length === 2 ? picked[0].distanceTo(picked[1]) : null,
      });
    };

    const el = renderer.domElement;
    el.addEventListener("pointerdown", onDown);
    el.addEventListener("pointerup", onUp);
    el.style.cursor = "crosshair";
    return () => {
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointerup", onUp);
      el.style.cursor = "";
      clearOverlay();
      scene.remove(overlay);
      markerGeo.dispose();
      markerMat.dispose();
      lineMat.dispose();
    };
  }, [measure, object, upAxis]);

  // Drive the selected clip. Stops (and resets the pose) when turned off.
  useEffect(() => {
    if (!object || !playAnimations || clips.length === 0) return;
    const mixer = new THREE.AnimationMixer(object);
    mixerRef.current = mixer;
    const action = mixer.clipAction(clips[Math.min(clipIndex, clips.length - 1)]);
    action.play();
    action.paused = !clipPlaying;
    return () => {
      mixer.stopAllAction();
      mixer.uncacheRoot(object);
      mixerRef.current = null;
    };
  }, [object, playAnimations, clips, clipIndex, clipPlaying]);

  return (
    <div className="flex flex-col h-full">
      <div className="relative flex-1 min-h-0 flex flex-col">
        <div
          ref={containerRef}
          className={
            compact
              ? "flex-1 min-h-0 overflow-hidden"
              : "flex-1 min-h-[300px] sm:min-h-[400px] rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800"
          }
        />
        {measure && (
          <div className="pointer-events-none absolute left-3 top-3 rounded-lg bg-white/90 dark:bg-zinc-900/90 px-3 py-2 text-xs shadow border border-zinc-200 dark:border-zinc-700">
            {measurement.distance !== null ? (
              <>
                <span className="font-mono text-sm font-semibold text-orange-600 dark:text-orange-400">
                  {formatLength(measurement.distance)} {unitLabel}
                </span>
                <span className="block text-zinc-500 mt-0.5">
                  Δx {formatLength(Math.abs(measurement.points[1].x - measurement.points[0].x))} · Δy{" "}
                  {formatLength(Math.abs(measurement.points[1].y - measurement.points[0].y))} · Δz{" "}
                  {formatLength(Math.abs(measurement.points[1].z - measurement.points[0].z))}
                </span>
              </>
            ) : (
              <span className="text-zinc-600 dark:text-zinc-300">
                {measurement.points.length === 1
                  ? "Click a second point"
                  : "Click two points on the model to measure"}
              </span>
            )}
          </div>
        )}
        {playAnimations && clips.length > 0 && (
          <div className="absolute left-3 bottom-3 flex items-center gap-2 rounded-lg bg-white/90 dark:bg-zinc-900/90 px-2 py-1.5 text-xs shadow border border-zinc-200 dark:border-zinc-700">
            <button
              onClick={() => setClipPlaying((p) => !p)}
              className="px-2 py-0.5 rounded border border-zinc-300 dark:border-zinc-600"
              aria-label={clipPlaying ? "Pause animation" : "Play animation"}
            >
              {clipPlaying ? "❚❚" : "▶"}
            </button>
            {clips.length > 1 ? (
              <select
                value={clipIndex}
                onChange={(e) => setClipIndex(Number(e.target.value))}
                className="bg-transparent max-w-[12rem]"
              >
                {clips.map((c, i) => (
                  <option key={i} value={i}>
                    {c.name || `Animation ${i + 1}`}
                  </option>
                ))}
              </select>
            ) : (
              <span className="text-zinc-600 dark:text-zinc-300 max-w-[12rem] truncate">
                {clips[0].name || "Animation"}
              </span>
            )}
          </div>
        )}
      </div>
      {!compact && stats && (
        <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-zinc-600 dark:text-zinc-400">
          {stats.points > 0 && stats.meshes === 0 ? (
            <>
              <Stat label="points" value={stats.points.toLocaleString()} />
              <Stat label="faces" value="0 (point cloud)" />
              <Stat label="meshes" value="0" />
            </>
          ) : (
            <>
              <Stat label="triangles" value={stats.triangles.toLocaleString()} />
              <Stat label="vertices" value={stats.vertices.toLocaleString()} />
              <Stat label="meshes" value={stats.meshes.toLocaleString()} />
            </>
          )}
          <Stat
            label="dimensions"
            value={`${stats.bbox.x} × ${stats.bbox.y} × ${stats.bbox.z}`}
          />
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="font-medium text-zinc-900 dark:text-zinc-100">{value}</div>
      <div>{label}</div>
    </div>
  );
}

function formatLength(v: number): string {
  if (v >= 1000) return v.toFixed(0);
  if (v >= 100) return v.toFixed(1);
  return v.toFixed(2);
}
