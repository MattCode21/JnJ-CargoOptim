import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface ThreeDViewerProps {
  containerDimensions: { length: number; width: number; height: number };
  itemDimensions: { length: number; width: number; height: number };
  positions: Array<{ x: number; y: number; z: number; rotation: { x: number; y: number; z: number } }>;
  containerType: 'carton' | 'pallet' | 'container';
}

const ThreeDViewer: React.FC<ThreeDViewerProps> = ({
  containerDimensions,
  itemDimensions,
  positions,
  containerType
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const animationIdRef = useRef<number>();

  useEffect(() => {
    if (!mountRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf5f5f5);
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      75,
      mountRef.current.clientWidth / mountRef.current.clientHeight,
      0.1,
      10000
    );

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;
    mountRef.current.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(50, 50, 50);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);

    // Container
    const containerGeometry = new THREE.BoxGeometry(
      containerDimensions.length,
      containerDimensions.height,
      containerDimensions.width
    );

    let containerMaterial: THREE.Material;
    switch (containerType) {
      case 'carton':
        containerMaterial = new THREE.MeshLambertMaterial({
          color: 0xdeb887,
          transparent: true,
          opacity: 0.3,
          side: THREE.DoubleSide
        });
        break;
      case 'pallet':
        containerMaterial = new THREE.MeshLambertMaterial({
          color: 0x8b4513,
          transparent: true,
          opacity: 0.2
        });
        break;
      case 'container':
        containerMaterial = new THREE.MeshLambertMaterial({
          color: 0x696969,
          transparent: true,
          opacity: 0.3
        });
        break;
    }

    const containerMesh = new THREE.Mesh(containerGeometry, containerMaterial);
    containerMesh.position.set(0, containerDimensions.height / 2, 0);
    scene.add(containerMesh);

    // Container wireframe
    const wireframe = new THREE.WireframeGeometry(containerGeometry);
    const wireframeMaterial = new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 2 });
    const wireframeMesh = new THREE.LineSegments(wireframe, wireframeMaterial);
    wireframeMesh.position.copy(containerMesh.position);
    scene.add(wireframeMesh);

    // Items
    const itemGeometry = new THREE.BoxGeometry(
      itemDimensions.length,
      itemDimensions.height,
      itemDimensions.width
    );

    const colors = [0x4299e1, 0x48bb78, 0xed8936, 0x9f7aea, 0xf56565, 0x38b2ac];
    
    positions.forEach((pos, index) => {
      const itemMaterial = new THREE.MeshLambertMaterial({
        color: colors[index % colors.length],
        transparent: true,
        opacity: 0.8
      });

      const itemMesh = new THREE.Mesh(itemGeometry, itemMaterial);
      itemMesh.position.set(
        pos.x + itemDimensions.length / 2 - containerDimensions.length / 2,
        pos.y + itemDimensions.height / 2,
        pos.z + itemDimensions.width / 2 - containerDimensions.width / 2
      );
      
      itemMesh.rotation.set(pos.rotation.x, pos.rotation.y, pos.rotation.z);
      itemMesh.castShadow = true;
      itemMesh.receiveShadow = true;
      scene.add(itemMesh);

      // Item wireframe
      const itemWireframe = new THREE.WireframeGeometry(itemGeometry);
      const itemWireframeMaterial = new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 1 });
      const itemWireframeMesh = new THREE.LineSegments(itemWireframe, itemWireframeMaterial);
      itemWireframeMesh.position.copy(itemMesh.position);
      itemWireframeMesh.rotation.copy(itemMesh.rotation);
      scene.add(itemWireframeMesh);
    });

    // Ground plane
    const groundGeometry = new THREE.PlaneGeometry(
      containerDimensions.length * 2,
      containerDimensions.width * 2
    );
    const groundMaterial = new THREE.MeshLambertMaterial({ color: 0xcccccc });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // Position camera
    const maxDimension = Math.max(containerDimensions.length, containerDimensions.width, containerDimensions.height);
    camera.position.set(maxDimension * 1.5, maxDimension, maxDimension * 1.5);
    camera.lookAt(0, containerDimensions.height / 2, 0);

    // Controls (basic rotation)
    let mouseX = 0;
    let mouseY = 0;
    let isMouseDown = false;

    const onMouseDown = (event: MouseEvent) => {
      isMouseDown = true;
      mouseX = event.clientX;
      mouseY = event.clientY;
    };

    const onMouseUp = () => {
      isMouseDown = false;
    };

    const onMouseMove = (event: MouseEvent) => {
      if (!isMouseDown) return;

      const deltaX = event.clientX - mouseX;
      const deltaY = event.clientY - mouseY;

      camera.position.x = camera.position.x * Math.cos(deltaX * 0.01) + camera.position.z * Math.sin(deltaX * 0.01);
      camera.position.z = camera.position.z * Math.cos(deltaX * 0.01) - camera.position.x * Math.sin(deltaX * 0.01);
      
      camera.position.y += deltaY * 0.5;
      camera.position.y = Math.max(10, Math.min(camera.position.y, maxDimension * 2));

      camera.lookAt(0, containerDimensions.height / 2, 0);

      mouseX = event.clientX;
      mouseY = event.clientY;
    };

    renderer.domElement.addEventListener('mousedown', onMouseDown);
    renderer.domElement.addEventListener('mouseup', onMouseUp);
    renderer.domElement.addEventListener('mousemove', onMouseMove);

    // Animation loop
    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    // Cleanup
    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      
      renderer.domElement.removeEventListener('mousedown', onMouseDown);
      renderer.domElement.removeEventListener('mouseup', onMouseUp);
      renderer.domElement.removeEventListener('mousemove', onMouseMove);
      
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      
      renderer.dispose();
    };
  }, [containerDimensions, itemDimensions, positions, containerType]);

  return (
    <div className="w-full h-full relative">
      <div ref={mountRef} className="w-full h-full" />
      <div className="absolute top-4 left-4 bg-white bg-opacity-90 rounded-lg p-3 text-sm">
        <div className="font-semibold text-gray-800 mb-2">3D View Controls</div>
        <div className="text-gray-600 text-xs space-y-1">
          <div>• Click and drag to rotate</div>
          <div>• Drag vertically to adjust height</div>
          <div>• Colors represent different items</div>
        </div>
      </div>
    </div>
  );
};

export default ThreeDViewer;