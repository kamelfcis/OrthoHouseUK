import { useEffect, useRef } from 'react'
import * as THREE from 'three'

const ThreeJSBackground = () => {
  const mountRef = useRef(null)
  const sceneRef = useRef(null)
  const animationFrameRef = useRef(null)

  useEffect(() => {
    if (!mountRef.current) return

    // Scene setup
    const scene = new THREE.Scene()
    sceneRef.current = scene

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    )
    camera.position.z = 5

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true
    })
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setPixelRatio(window.devicePixelRatio)
    mountRef.current.appendChild(renderer.domElement)

    // Create floating particles
    const particlesGeometry = new THREE.BufferGeometry()
    const particlesCount = 200
    const positions = new Float32Array(particlesCount * 3)

    for (let i = 0; i < particlesCount * 3; i++) {
      positions[i] = (Math.random() - 0.5) * 20
    }

    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))

    // Particle material with gradient colors
    const particlesMaterial = new THREE.PointsMaterial({
      color: 0x005f9a,
      size: 0.1,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending
    })

    const particles = new THREE.Points(particlesGeometry, particlesMaterial)
    scene.add(particles)

    // Create geometric shapes
    const shapes = []
    const colors = [0x005f9a, 0x0077b6, 0x0096c7, 0x00b4d8]

    for (let i = 0; i < 8; i++) {
      const geometry = new THREE.IcosahedronGeometry(0.3, 0)
      const material = new THREE.MeshStandardMaterial({
        color: colors[Math.floor(Math.random() * colors.length)],
        transparent: true,
        opacity: 0.3,
        wireframe: true,
        metalness: 0.5,
        roughness: 0.5
      })
      const shape = new THREE.Mesh(geometry, material)
      
      shape.position.set(
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 10
      )
      shape.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      )
      
      shapes.push({
        mesh: shape,
        rotationSpeed: {
          x: (Math.random() - 0.5) * 0.02,
          y: (Math.random() - 0.5) * 0.02,
          z: (Math.random() - 0.5) * 0.02
        },
        floatSpeed: {
          x: (Math.random() - 0.5) * 0.01,
          y: (Math.random() - 0.5) * 0.01,
          z: (Math.random() - 0.5) * 0.01
        }
      })
      
      scene.add(shape)
    }

    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
    scene.add(ambientLight)

    // Add directional lights
    const light1 = new THREE.DirectionalLight(0x005f9a, 0.5)
    light1.position.set(5, 5, 5)
    scene.add(light1)

    const light2 = new THREE.DirectionalLight(0x0077b6, 0.5)
    light2.position.set(-5, -5, -5)
    scene.add(light2)

    // Animation loop
    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate)

      // Rotate particles
      particles.rotation.y += 0.001

      // Animate shapes
      shapes.forEach((shapeData) => {
        shapeData.mesh.rotation.x += shapeData.rotationSpeed.x
        shapeData.mesh.rotation.y += shapeData.rotationSpeed.y
        shapeData.mesh.rotation.z += shapeData.rotationSpeed.z

        shapeData.mesh.position.x += shapeData.floatSpeed.x
        shapeData.mesh.position.y += shapeData.floatSpeed.y
        shapeData.mesh.position.z += shapeData.floatSpeed.z

        // Bounce back if too far
        if (Math.abs(shapeData.mesh.position.x) > 8) shapeData.floatSpeed.x *= -1
        if (Math.abs(shapeData.mesh.position.y) > 8) shapeData.floatSpeed.y *= -1
        if (Math.abs(shapeData.mesh.position.z) > 8) shapeData.floatSpeed.z *= -1
      })

      // Rotate camera slightly for dynamic effect
      camera.position.x = Math.sin(Date.now() * 0.0001) * 0.5
      camera.position.y = Math.cos(Date.now() * 0.0001) * 0.5
      camera.lookAt(scene.position)

      renderer.render(scene, camera)
    }

    animate()

    // Handle resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
    }

    window.addEventListener('resize', handleResize)

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize)
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement)
      }
      renderer.dispose()
      particlesGeometry.dispose()
      particlesMaterial.dispose()
      shapes.forEach((shapeData) => {
        shapeData.mesh.geometry.dispose()
        shapeData.mesh.material.dispose()
      })
    }
  }, [])

  return <div ref={mountRef} className="threejs-background" />
}

export default ThreeJSBackground

