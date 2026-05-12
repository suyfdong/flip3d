"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

type Props = {
  fileBuffer: ArrayBuffer | null;
  fileName?: string;
};

type ModelStats = {
  triangles: number;
  sizeKB: number;
  dimensions: { x: number; y: number; z: number };
};

export default function StlViewer({ fileBuffer, fileName }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const meshRef = useRef<THREE.Mesh | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const [stats, setStats] = useState<ModelStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 初始化 three.js scene（只跑一次）
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf4f4f5);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 10000);
    camera.position.set(80, 80, 120);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 光照
    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambient);
    const directional = new THREE.DirectionalLight(0xffffff, 0.8);
    directional.position.set(100, 100, 100);
    scene.add(directional);
    const directional2 = new THREE.DirectionalLight(0xffffff, 0.4);
    directional2.position.set(-100, -100, -100);
    scene.add(directional2);

    // 网格地面（视觉参考）
    const gridHelper = new THREE.GridHelper(200, 20, 0xd4d4d8, 0xe4e4e7);
    scene.add(gridHelper);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controlsRef.current = controls;

    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // resize handler
    const handleResize = () => {
      if (!container || !cameraRef.current || !rendererRef.current) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      controls.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
  }, []);

  // 当文件 buffer 变化时加载模型
  useEffect(() => {
    if (!fileBuffer || !sceneRef.current || !cameraRef.current || !controlsRef.current) {
      return;
    }

    setError(null);

    try {
      // 移除旧 mesh
      if (meshRef.current) {
        sceneRef.current.remove(meshRef.current);
        meshRef.current.geometry.dispose();
        if (Array.isArray(meshRef.current.material)) {
          meshRef.current.material.forEach((m) => m.dispose());
        } else {
          meshRef.current.material.dispose();
        }
        meshRef.current = null;
      }

      const loader = new STLLoader();
      const geometry = loader.parse(fileBuffer);
      geometry.computeVertexNormals();

      // 居中 + 缩放到合理大小
      geometry.computeBoundingBox();
      const box = geometry.boundingBox!;
      const center = new THREE.Vector3();
      box.getCenter(center);
      geometry.translate(-center.x, -center.y, -center.z);

      const size = new THREE.Vector3();
      box.getSize(size);
      const maxDim = Math.max(size.x, size.y, size.z);

      const material = new THREE.MeshStandardMaterial({
        color: 0x6366f1,
        metalness: 0.1,
        roughness: 0.6,
      });

      const mesh = new THREE.Mesh(geometry, material);
      sceneRef.current.add(mesh);
      meshRef.current = mesh;

      // 调整相机距离
      const distance = maxDim * 2;
      cameraRef.current.position.set(distance, distance, distance);
      cameraRef.current.lookAt(0, 0, 0);
      controlsRef.current.target.set(0, 0, 0);
      controlsRef.current.update();

      // 计算统计信息
      const triCount = geometry.attributes.position.count / 3;
      setStats({
        triangles: Math.floor(triCount),
        sizeKB: Math.round(fileBuffer.byteLength / 1024),
        dimensions: {
          x: Number(size.x.toFixed(2)),
          y: Number(size.y.toFixed(2)),
          z: Number(size.z.toFixed(2)),
        },
      });
    } catch (e) {
      console.error("STL 解析失败", e);
      setError(
        e instanceof Error ? e.message : "STL 文件解析失败，可能不是有效的 STL 格式"
      );
      setStats(null);
    }
  }, [fileBuffer]);

  return (
    <div className="flex flex-col h-full">
      <div
        ref={containerRef}
        className="flex-1 min-h-[400px] rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800"
      />

      {fileName && stats && !error && (
        <div className="mt-3 grid grid-cols-3 gap-3 text-xs text-zinc-600 dark:text-zinc-400">
          <div>
            <div className="font-medium text-zinc-900 dark:text-zinc-100">
              {stats.triangles.toLocaleString()}
            </div>
            <div>triangles</div>
          </div>
          <div>
            <div className="font-medium text-zinc-900 dark:text-zinc-100">
              {stats.sizeKB.toLocaleString()} KB
            </div>
            <div>file size</div>
          </div>
          <div>
            <div className="font-medium text-zinc-900 dark:text-zinc-100">
              {stats.dimensions.x} × {stats.dimensions.y} × {stats.dimensions.z}
            </div>
            <div>dimensions</div>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-3 px-4 py-3 rounded-lg bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 text-sm">
          ⚠️ {error}
        </div>
      )}
    </div>
  );
}
