import { useEffect, useRef } from 'react'
import './WaveDivider.css'

const WaveDivider = ({ className = '', flip = false }) => {
  const svgRef = useRef(null)

  useEffect(() => {
    const svg = svgRef.current
    if (!svg) return

    const paths = svg.querySelectorAll('.wave-path')
    let animationFrame

    const animate = () => {
      const time = Date.now() * 0.001
      
      paths.forEach((path, index) => {
        const offset = index * 0.3
        const waveHeight = 20 + Math.sin(time + offset) * 10
        const waveOffset = Math.cos(time * 0.5 + offset) * 15
        
        // Create more dynamic wave paths
        const d = `M0,${60 + waveOffset} 
          C200,${60 + waveHeight + waveOffset} 
          400,${60 - waveHeight + waveOffset} 
          600,${60 + waveOffset} 
          C700,${60 + waveHeight * 0.5 + waveOffset} 
          800,${60 - waveHeight * 0.5 + waveOffset} 
          900,${60 + waveOffset} 
          C1000,${60 + waveHeight + waveOffset} 
          1100,${60 - waveHeight + waveOffset} 
          1200,${60 + waveOffset} 
          L1200,120 L0,120 Z`
        
        path.setAttribute('d', d)
      })

      animationFrame = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame)
      }
    }
  }, [])

  return (
    <div className={`wave-divider ${className} ${flip ? 'flip' : ''}`}>
      <svg
        ref={svgRef}
        viewBox="0 0 1200 120"
        preserveAspectRatio="none"
        className="wave-svg"
      >
        <path
          className="wave-path wave-1"
          d="M0,60 C200,80 400,40 600,60 C700,70 800,50 900,60 C1000,80 1100,40 1200,60 L1200,120 L0,120 Z"
        />
        <path
          className="wave-path wave-2"
          d="M0,70 C200,50 400,90 600,70 C700,60 800,80 900,70 C1000,50 1100,90 1200,70 L1200,120 L0,120 Z"
        />
        <path
          className="wave-path wave-3"
          d="M0,65 C200,75 400,55 600,65 C700,68 800,62 900,65 C1000,75 1100,55 1200,65 L1200,120 L0,120 Z"
        />
        <path
          className="wave-path wave-4"
          d="M0,75 C200,85 400,65 600,75 C700,78 800,72 900,75 C1000,85 1100,65 1200,75 L1200,120 L0,120 Z"
        />
      </svg>
    </div>
  )
}

export default WaveDivider

