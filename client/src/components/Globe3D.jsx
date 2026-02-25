import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export default function Globe3D({ token }) {
  const mountRef = useRef(null);
  const [locations, setLocations] = useState([]);
  const [hoveredCity, setHoveredCity] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    // Fetch real login locations
    const fetchLocations = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/activities/locations`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setLocations(res.data);
      } catch (error) {
        console.error('Failed to fetch locations:', error);
        // Fallback to sample data
        setLocations([{ lat: 19.9993, lon: 73.7900, city: 'Nashik', country: 'India', login_count: 1 }]);
      }
    };

    if (token) {
      fetchLocations();
    }
  }, [token]);

  useEffect(() => {
    if (!mountRef.current || locations.length === 0) return;

    const mount = mountRef.current;

    // Scene
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, mount.clientWidth / mount.clientHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);

    // Globe
    const geometry = new THREE.SphereGeometry(5, 50, 50);
    const material = new THREE.MeshPhongMaterial({
      map: new THREE.TextureLoader().load('https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg'),
      bumpMap: new THREE.TextureLoader().load('https://unpkg.com/three-globe/example/img/earth-topology.png'),
      bumpScale: 0.05,
    });
    const globe = new THREE.Mesh(geometry, material);
    scene.add(globe);

    // Lighting
    const pointLight = new THREE.PointLight(0xffffff, 1.5);
    pointLight.position.set(10, 10, 10);
    scene.add(pointLight);
    const ambientLight = new THREE.AmbientLight(0x404040, 1.5);
    scene.add(ambientLight);

    // === STAR FIELD ===
    // Create thousands of stars as particles
    const starCount = 3000;
    const starGeometry = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starCount * 3);
    const starSizes = new Float32Array(starCount);
    const starColors = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount; i++) {
      // Random spherical distribution
      const radius = 30 + Math.random() * 70; // Stars far from globe
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      starPositions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      starPositions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      starPositions[i * 3 + 2] = radius * Math.cos(phi);

      // Vary star sizes
      starSizes[i] = Math.random() * 2 + 0.5;

      // Add slight color variation (blue-white stars)
      const colorVariation = 0.8 + Math.random() * 0.2;
      starColors[i * 3] = colorVariation;
      starColors[i * 3 + 1] = colorVariation;
      starColors[i * 3 + 2] = 1.0; // Slightly blue tint
    }

    starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    starGeometry.setAttribute('size', new THREE.BufferAttribute(starSizes, 1));
    starGeometry.setAttribute('color', new THREE.BufferAttribute(starColors, 3));

    const starMaterial = new THREE.PointsMaterial({
      size: 0.15,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      sizeAttenuation: true,
      blending: THREE.AdditiveBlending
    });

    const stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);

    // === GALAXY BACKGROUND ===
    // Create a large sphere with inverted normals for galaxy effect
    const galaxyGeometry = new THREE.SphereGeometry(100, 64, 64);
    const galaxyMaterial = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      uniforms: {
        time: { value: 0 }
      },
      vertexShader: `
        varying vec3 vPosition;
        void main() {
          vPosition = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        varying vec3 vPosition;
        
        void main() {
          // Create nebula-like gradient
          vec3 color1 = vec3(0.05, 0.0, 0.15); // Deep purple
          vec3 color2 = vec3(0.0, 0.05, 0.2); // Dark blue
          vec3 color3 = vec3(0.1, 0.0, 0.1); // Purple accent
          
          float pattern = sin(vPosition.x * 0.01 + time * 0.1) * 
                         cos(vPosition.y * 0.01) * 
                         sin(vPosition.z * 0.01);
          
          vec3 color = mix(color1, color2, (vPosition.y + 100.0) / 200.0);
          color = mix(color, color3, pattern * 0.5 + 0.5);
          
          gl_FragColor = vec4(color, 1.0);
        }
      `
    });

    const galaxyBackground = new THREE.Mesh(galaxyGeometry, galaxyMaterial);
    scene.add(galaxyBackground);

    // Add markers for login locations
    const markers = [];
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    locations.forEach((loc) => {
      const lat = loc.lat;
      const lon = loc.lon;

      // Convert lat/lon to 3D coordinates
      const phi = (90 - lat) * (Math.PI / 180);
      const theta = (lon + 180) * (Math.PI / 180);
      const radius = 5.1; // Slightly above globe surface

      const x = -(radius * Math.sin(phi) * Math.cos(theta));
      const y = radius * Math.cos(phi);
      const z = radius * Math.sin(phi) * Math.sin(theta);

      // Create marker
      const markerGeometry = new THREE.SphereGeometry(0.1, 16, 16);
      const markerMaterial = new THREE.MeshBasicMaterial({
        color: 0x00ff00,
        emissive: 0x00ff00,
        emissiveIntensity: 0.5
      });
      const marker = new THREE.Mesh(markerGeometry, markerMaterial);
      marker.position.set(x, y, z);
      marker.userData = { city: loc.city, country: loc.country, login_count: loc.login_count };
      scene.add(marker);
      markers.push(marker);

      // Add pulsing animation
      marker.scale.set(1, 1, 1);
    });

    // Mouse move handler for tooltip
    const handleMouseMove = (event) => {
      const rect = mount.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      setMousePos({ x: event.clientX, y: event.clientY });

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(markers);

      if (intersects.length > 0) {
        const marker = intersects[0].object;
        setHoveredCity(marker.userData);
        marker.material.emissiveIntensity = 1.0;
        marker.scale.set(1.5, 1.5, 1.5);
      } else {
        // Reset all markers
        markers.forEach(m => {
          m.material.emissiveIntensity = 0.5;
          m.scale.set(1, 1, 1);
        });
        setHoveredCity(null);
      }
    };

    mount.addEventListener('mousemove', handleMouseMove);

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enableZoom = true;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.5;

    camera.position.z = 15;

    // Animation
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();

      const time = Date.now() * 0.001;

      // === STAR TWINKLING ANIMATION ===
      // Update star opacity for twinkling effect
      const starSizesAttr = starGeometry.getAttribute('size');
      for (let i = 0; i < starCount; i++) {
        const baseSize = starSizesAttr.array[i];
        const twinkle = Math.sin(time * 2 + i * 0.1) * 0.3 + 0.7; // Oscillate between 0.7 and 1.0
        starSizesAttr.array[i] = baseSize * twinkle;
      }
      starSizesAttr.needsUpdate = true;

      // === GALAXY BACKGROUND ANIMATION ===
      // Slowly rotate galaxy background and update shader time
      galaxyBackground.rotation.y = time * 0.02;
      galaxyMaterial.uniforms.time.value = time;

      // === STAR ROTATION ===
      // Gentle rotation of entire star field
      stars.rotation.y = time * 0.01;
      stars.rotation.x = Math.sin(time * 0.05) * 0.05;

      // Pulse markers
      markers.forEach((marker, i) => {
        const scale = 1 + Math.sin(time * 2 + i) * 0.1;
        if (!marker.userData.isHovered) {
          marker.scale.set(scale, scale, scale);
        }
      });

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      mount.removeEventListener('mousemove', handleMouseMove);
      mount.removeChild(renderer.domElement);
      geometry.dispose();
      material.dispose();
      starGeometry.dispose();
      starMaterial.dispose();
      galaxyGeometry.dispose();
      galaxyMaterial.dispose();
      renderer.dispose();
    };
  }, [locations, token]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div ref={mountRef} style={{ width: '100%', height: '100%' }} />

      {/* Tooltip */}
      {hoveredCity && (
        <div
          style={{
            position: 'fixed',
            left: mousePos.x + 15,
            top: mousePos.y - 10,
            background: 'rgba(0, 0, 0, 0.9)',
            color: 'white',
            padding: '8px 12px',
            borderRadius: '6px',
            pointerEvents: 'none',
            zIndex: 1000,
            fontSize: '14px',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)'
          }}
        >
          <div style={{ fontWeight: 'bold' }}>{hoveredCity.city}</div>
          <div style={{ fontSize: '12px', opacity: 0.8 }}>{hoveredCity.country}</div>
          <div style={{ fontSize: '11px', marginTop: '4px', opacity: 0.6 }}>
            {hoveredCity.login_count} login{hoveredCity.login_count > 1 ? 's' : ''}
          </div>
        </div>
      )}
    </div>
  );
}
