"use client"

import * as React from "react"
import {
  AnimationPlaybackControls,
  motion,
  MotionStyle,
  Transition,
  useAnimate,
} from "motion/react"

import { cn } from "@/lib/utils"

interface BorderBeamProps {
  /**
   * The size of the border beam.
   */
  size?: number
  /**
   * The duration of the border beam.
   */
  duration?: number
  /**
   * The delay of the border beam.
   */
  delay?: number
  /**
   * The color of the border beam from.
   */
  colorFrom?: string
  /**
   * The color of the border beam to.
   */
  colorTo?: string
  /**
   * The motion transition of the border beam.
   */
  transition?: Transition
  /**
   * The class name of the border beam.
   */
  className?: string
  /**
   * The style of the border beam.
   */
  style?: React.CSSProperties
  /**
   * Whether to reverse the animation direction.
   */
  reverse?: boolean
  /**
   * The initial offset position (0-100).
   */
  initialOffset?: number
  /**
   * The border width of the beam.
   */
  borderWidth?: number
}

export const BorderBeam = ({
  className,
  size = 50,
  delay = 0,
  duration = 6,
  colorFrom = "#ffaa40",
  colorTo = "#9c40ff",
  transition,
  style,
  reverse = false,
  initialOffset = 0,
  borderWidth = 1,
}: BorderBeamProps) => {
  const containerRef = React.useRef<HTMLDivElement>(null)
  const [scope, animate] = useAnimate<HTMLDivElement>()
  const controlsRef = React.useRef<AnimationPlaybackControls | null>(null)

  // SSR-safe gates: default to the full desktop experience during SSR and the
  // first client paint (so the visual identity is preserved and hydration
  // stays stable), then downgrade after mount on phones / reduced-motion.
  const [prefersReducedMotion, setPrefersReducedMotion] = React.useState(false)
  const [isMobile, setIsMobile] = React.useState(false)
  const [inView, setInView] = React.useState(true)
  const [tabVisible, setTabVisible] = React.useState(true)

  // Mobile + reduced-motion media queries.
  React.useEffect(() => {
    if (
      typeof window === "undefined" ||
      typeof window.matchMedia !== "function"
    ) {
      return
    }
    const mobileQuery = window.matchMedia(
      "(max-width: 640px), (pointer: coarse)"
    )
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)")
    const syncMobile = () => setIsMobile(mobileQuery.matches)
    const syncMotion = () => setPrefersReducedMotion(motionQuery.matches)
    syncMobile()
    syncMotion()
    mobileQuery.addEventListener("change", syncMobile)
    motionQuery.addEventListener("change", syncMotion)
    return () => {
      mobileQuery.removeEventListener("change", syncMobile)
      motionQuery.removeEventListener("change", syncMotion)
    }
  }, [])

  // Pause while the tab is hidden.
  React.useEffect(() => {
    if (typeof document === "undefined") return
    const sync = () => setTabVisible(document.visibilityState !== "hidden")
    sync()
    document.addEventListener("visibilitychange", sync)
    return () => document.removeEventListener("visibilitychange", sync)
  }, [])

  // Pause while the beam is scrolled off-screen — the single biggest win for
  // the many hover-gated beams that otherwise animate behind the fold.
  React.useEffect(() => {
    const el = containerRef.current
    if (!el || typeof IntersectionObserver === "undefined") return
    const observer = new IntersectionObserver(
      (entries) => setInView(entries[0]?.isIntersecting ?? true),
      { rootMargin: "128px" }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const animationDisabled = prefersReducedMotion || isMobile
  const shouldPlay = !animationDisabled && inView && tabVisible

  // Read the latest play state inside the creation effect so a beam created
  // while off-screen / hidden starts paused instead of running unseen.
  const shouldPlayRef = React.useRef(shouldPlay)
  shouldPlayRef.current = shouldPlay

  // Drive the beam imperatively so we can pause/resume mid-flight without the
  // position jump a declarative restart would cause. On mobile / reduced-motion
  // we never start it — the element stays frozen at `initial` (a static beam,
  // gracefully reduced, never removed).
  React.useEffect(() => {
    if (animationDisabled) return
    const target = scope.current
    if (!target) return
    const controls = animate(
      target,
      {
        offsetDistance: reverse
          ? [`${100 - initialOffset}%`, `${-initialOffset}%`]
          : [`${initialOffset}%`, `${100 + initialOffset}%`],
      },
      {
        repeat: Infinity,
        ease: "linear",
        duration,
        delay: -delay,
        ...transition,
      }
    )
    controlsRef.current = controls
    if (!shouldPlayRef.current) controls.pause()
    return () => {
      controls.cancel()
      controlsRef.current = null
    }
  }, [
    animate,
    scope,
    animationDisabled,
    reverse,
    initialOffset,
    duration,
    delay,
    transition,
  ])

  React.useEffect(() => {
    const controls = controlsRef.current
    if (!controls) return
    if (shouldPlay) controls.play()
    else controls.pause()
  }, [shouldPlay])

  return (
    <div
      ref={containerRef}
      className="pointer-events-none absolute inset-0 rounded-[inherit] border-(length:--border-beam-width) border-transparent mask-[linear-gradient(transparent,transparent),linear-gradient(#000,#000)] mask-intersect [mask-clip:padding-box,border-box]"
      style={
        {
          "--border-beam-width": `${borderWidth}px`,
        } as React.CSSProperties
      }
    >
      <motion.div
        ref={scope}
        className={cn(
          "absolute aspect-square",
          "bg-linear-to-l from-(--color-from) via-(--color-to) to-transparent",
          className
        )}
        style={
          {
            width: size,
            offsetPath: `rect(0 auto auto 0 round ${size}px)`,
            // Promote a compositor layer only while actively animating; drop it
            // on paused / reduced / mobile paths so the layer isn't resident.
            willChange: shouldPlay ? "transform" : undefined,
            "--color-from": colorFrom,
            "--color-to": colorTo,
            ...style,
          } as MotionStyle
        }
        initial={{ offsetDistance: `${initialOffset}%` }}
      />
    </div>
  )
}
