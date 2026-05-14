"use client"

import { useEffect, useRef, useState } from "react"

const stats = [
  { value: 500, suffix: "+", label: "estéticas activas" },
  { value: 10000, suffix: "+", label: "turnos por mes", format: "10.000" },
  { value: 98, suffix: "%", label: "clientes que renuevan" },
  { value: 0, suffix: "", label: "doble bookings" },
]

function useCountUp(target: number, duration = 1500, started: boolean) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!started || target === 0) { setCount(target); return }
    let start: number | null = null
    const step = (timestamp: number) => {
      if (!start) start = timestamp
      const progress = Math.min((timestamp - start) / duration, 1)
      setCount(Math.floor(progress * target))
      if (progress < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [started, target, duration])

  return count
}

function StatItem({ value, suffix, label, format, started }: typeof stats[0] & { started: boolean }) {
  const count = useCountUp(value, 1400, started)
  const display = format
    ? format.replace(/\d+/, count.toLocaleString("es-AR"))
    : count.toLocaleString("es-AR")

  return (
    <div className="text-center">
      <p className="text-3xl font-bold text-violet-600 mb-1">
        {display}{suffix}
      </p>
      <p className="text-sm text-gray-500">{label}</p>
    </div>
  )
}

export function AnimatedStats() {
  const ref = useRef<HTMLDivElement>(null)
  const [started, setStarted] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setStarted(true); observer.disconnect() } },
      { threshold: 0.3 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={ref} className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
      {stats.map((s) => (
        <StatItem key={s.label} {...s} started={started} />
      ))}
    </div>
  )
}
