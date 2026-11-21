import { useCallback, useEffect, useRef, useState } from 'react'
import {
  AlertCircle,
  Maximize,
  Minimize,
  Pause,
  Play,
  RotateCcw,
  VideoOff,
  Volume2,
  VolumeX,
} from 'lucide-react'
import { useLanguage } from '../i18n/LanguageContext'
import { api } from '../lib/api'

const PING_INTERVAL_MS = 15000
const SEEK_TOLERANCE_SECONDS = 0.5
const WATERMARK_INTERVAL_MS = 12000

const WATERMARK_POSITIONS = [
  { top: '10%', left: '6%' },
  { top: '14%', left: '58%' },
  { top: '68%', left: '8%' },
  { top: '64%', left: '56%' },
  { top: '38%', left: '34%' },
]

const BLOCKED_KEYS = new Set([
  'ArrowLeft',
  'ArrowRight',
  'ArrowUp',
  'ArrowDown',
  'Home',
  'End',
  'PageUp',
  'PageDown',
  ',',
  '.',
  '<',
  '>',
  '[',
  ']',
])

/**
 * Protected lesson player.
 * - media is fetched from the authenticated streaming endpoint
 * - native controls, seeking, playback-rate changes, download, right-click
 *   and picture-in-picture are blocked
 * - a moving watermark identifies the signed-in learner
 * - watch progress is saved on the server and completion unlocks lesson N+1
 */
export default function OnlineLessonPlayer({
  courseId,
  lesson,
  watermarkName,
  watermarkEmail,
  onCompleted,
}) {
  const { t } = useLanguage()
  const videoRef = useRef(null)
  const containerRef = useRef(null)
  const allowedTimeRef = useRef(0)
  const lastSentRef = useRef(0)
  const sendingRef = useRef(false)
  const completedRef = useRef(Boolean(lesson.isCompleted))
  const onCompletedRef = useRef(onCompleted)

  const [playing, setPlaying] = useState(false)
  const [muted, setMuted] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)
  const [started, setStarted] = useState(false)
  const [problem, setProblem] = useState(lesson.hasVideo ? null : 'missing')
  const [saveError, setSaveError] = useState(false)
  const [watermarkIndex, setWatermarkIndex] = useState(0)

  useEffect(() => {
    onCompletedRef.current = onCompleted
  }, [onCompleted])

  const resumeAt = lesson.isCompleted ? 0 : Math.max(0, Number(lesson.positionSeconds) || 0)

  const sendProgress = useCallback(
    async ({ ended = false } = {}) => {
      const video = videoRef.current
      if (!video || !Number.isFinite(video.duration) || video.duration <= 0) return null

      const position = ended ? video.duration : video.currentTime
      if (!ended && Math.abs(position - lastSentRef.current) < 2) return null

      if (!ended) {
        if (sendingRef.current) return null
        sendingRef.current = true
      }

      lastSentRef.current = position

      try {
        const result = await api.lessonProgress(courseId, lesson.id, {
          positionSeconds: position,
          durationSeconds: video.duration,
          ended,
        })

        if (result?.isCompleted && !completedRef.current) {
          completedRef.current = true
        }

        if (ended && result?.isCompleted) {
          setSaveError(false)
          onCompletedRef.current?.(lesson.id)
        }

        return result
      } catch (error) {
        if (error?.code === 'VIDEO_NOT_AVAILABLE' || error?.code === 'VIDEO_NOT_FOUND') {
          setProblem('missing')
        }
        if (ended) setSaveError(true)
        return null
      } finally {
        if (!ended) sendingRef.current = false
      }
    },
    [courseId, lesson.id]
  )

  // Reset per-lesson state when the selected lesson changes.
  useEffect(() => {
    setPlaying(false)
    setStarted(false)
    setProblem(lesson.hasVideo ? null : 'missing')
    setSaveError(false)
    setWatermarkIndex(0)
    completedRef.current = Boolean(lesson.isCompleted)
    allowedTimeRef.current = resumeAt
    lastSentRef.current = 0
    if (lesson.isCompleted) videoRef.current?.pause()
  }, [lesson.id, lesson.hasVideo, lesson.isCompleted, resumeAt])

  // Move the watermark around the video.
  useEffect(() => {
    if (problem) return undefined
    const timer = setInterval(() => {
      setWatermarkIndex((index) => {
        let next = index
        while (next === index) {
          next = Math.floor(Math.random() * WATERMARK_POSITIONS.length)
        }
        return next
      })
    }, WATERMARK_INTERVAL_MS)
    return () => clearInterval(timer)
  }, [problem])

  // Save progress while the video is actually playing.
  useEffect(() => {
    if (problem) return undefined
    const timer = setInterval(() => {
      const video = videoRef.current
      if (video && !video.paused && !video.ended) sendProgress()
    }, PING_INTERVAL_MS)

    const onHidden = () => {
      const video = videoRef.current
      if (document.visibilityState === 'hidden' && video && video.currentTime > 0) {
        sendProgress()
      }
    }
    document.addEventListener('visibilitychange', onHidden)

    return () => {
      clearInterval(timer)
      document.removeEventListener('visibilitychange', onHidden)
    }
  }, [problem, sendProgress])

  useEffect(() => {
    const onFullscreenChange = () => {
      setFullscreen(document.fullscreenElement === containerRef.current)
    }
    document.addEventListener('fullscreenchange', onFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange)
  }, [])

  // React has no synthetic event for picture-in-picture; listen natively and
  // immediately leave PiP if a browser still offers it.
  useEffect(() => {
    const video = videoRef.current
    if (!video || problem) return undefined
    const onEnterPictureInPicture = () => {
      if (document.pictureInPictureElement) document.exitPictureInPicture().catch(() => {})
    }
    video.addEventListener('enterpictureinpicture', onEnterPictureInPicture)
    return () => video.removeEventListener('enterpictureinpicture', onEnterPictureInPicture)
  }, [problem, lesson.id])

  const togglePlay = useCallback(async () => {
    const video = videoRef.current
    if (!video || problem) return

    if (video.paused || video.ended) {
      if (video.ended) {
        video.currentTime = 0
        allowedTimeRef.current = 0
      }
      try {
        await video.play()
        setStarted(true)
      } catch {
        setPlaying(false)
      }
    } else {
      video.pause()
    }
  }, [problem])

  const toggleMute = () => {
    const video = videoRef.current
    if (!video) return
    video.muted = !video.muted
    setMuted(video.muted)
  }

  const toggleFullscreen = async () => {
    const container = containerRef.current
    if (!container) return
    try {
      if (document.fullscreenElement) await document.exitFullscreen()
      else await container.requestFullscreen()
    } catch {
      /* fullscreen may be denied by the browser */
    }
  }

  const handleLoadedMetadata = () => {
    const video = videoRef.current
    if (!video) return
    video.playbackRate = 1
    video.defaultPlaybackRate = 1

    if (resumeAt > 0 && resumeAt < video.duration - 2) {
      allowedTimeRef.current = resumeAt
      video.currentTime = resumeAt
      setStarted(true)
    } else {
      allowedTimeRef.current = 0
    }
  }

  const handleTimeUpdate = () => {
    const video = videoRef.current
    if (!video || video.seeking) return
    allowedTimeRef.current = video.currentTime
  }

  const handleSeeking = () => {
    const video = videoRef.current
    if (!video) return
    if (Math.abs(video.currentTime - allowedTimeRef.current) > SEEK_TOLERANCE_SECONDS) {
      video.currentTime = allowedTimeRef.current
    }
  }

  const handleRateChange = () => {
    const video = videoRef.current
    if (video && video.playbackRate !== 1) video.playbackRate = 1
  }

  const handleEnded = () => {
    const video = videoRef.current
    setPlaying(false)
    if (video) allowedTimeRef.current = video.duration
    sendProgress({ ended: true })
  }

  const handleKeyDown = (event) => {
    if (BLOCKED_KEYS.has(event.key) || /^[0-9]$/.test(event.key)) {
      event.preventDefault()
      event.stopPropagation()
      return
    }
    if (event.key === ' ' || event.key === 'k' || event.key === 'K') {
      event.preventDefault()
      togglePlay()
    }
  }

  const currentPosition = WATERMARK_POSITIONS[watermarkIndex]
  const showPlayOverlay = !playing && !problem

  return (
    <section className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-5">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-accent-600">
            {t('onlineCoursePage.current')}
          </p>
          <h2 className="mt-1 text-lg font-extrabold leading-snug text-navy-900">
            {lesson.title}
          </h2>
        </div>
        {lesson.isCompleted && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-bold text-emerald-700">
            {t('onlineCoursePage.completed')}
          </span>
        )}
      </header>

      <div
        ref={containerRef}
        tabIndex={0}
        onKeyDown={handleKeyDown}
        onContextMenu={(event) => event.preventDefault()}
        className="relative aspect-video w-full select-none overflow-hidden bg-slate-950 outline-none"
      >
        {problem ? (
          <div className="flex h-full w-full flex-col items-center justify-center gap-3 px-6 text-center">
            <VideoOff size={42} className="text-slate-500" />
            <p className="text-sm font-semibold text-slate-300">
              {t('onlineCoursePage.videoUnavailable')}
            </p>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              src={api.lessonStreamUrl(courseId, lesson.id)}
              className="h-full w-full bg-slate-950 object-contain"
              preload="metadata"
              playsInline
              controls={false}
              disablePictureInPicture
              disableRemotePlayback
              controlsList="nodownload noplaybackrate noremoteplayback"
              onContextMenu={(event) => event.preventDefault()}
              onDragStart={(event) => event.preventDefault()}
              onLoadedMetadata={handleLoadedMetadata}
              onPlay={() => setPlaying(true)}
              onPause={() => {
                setPlaying(false)
                const video = videoRef.current
                if (video && !video.ended && video.currentTime > 0) sendProgress()
              }}
              onTimeUpdate={handleTimeUpdate}
              onSeeking={handleSeeking}
              onRateChange={handleRateChange}
              onEnded={handleEnded}
              onError={() => setProblem('missing')}
            />

            <div
              aria-hidden="true"
              dir="ltr"
              data-watermark="true"
              className="pointer-events-none absolute z-20 max-w-[70%] select-none rounded bg-slate-950/35 px-2 py-1 text-[10px] font-semibold leading-tight text-white/70 shadow-sm backdrop-blur-[1px] transition-all duration-700 sm:text-[11px]"
              style={{ top: currentPosition.top, left: currentPosition.left }}
            >
              <span className="block truncate">{watermarkName || 'Access Center'}</span>
              <span className="block truncate text-white/55">{watermarkEmail}</span>
            </div>

            {showPlayOverlay && (
              <button
                type="button"
                onClick={togglePlay}
                aria-label={t('onlineCoursePage.play')}
                className="absolute inset-0 z-10 grid place-items-center bg-slate-950/25 transition-colors hover:bg-slate-950/35"
              >
                <span className="grid h-16 w-16 place-items-center rounded-full bg-white/95 text-navy-900 shadow-lg">
                  {started ? <Play size={26} /> : <Play size={26} className="ml-1" />}
                </span>
              </button>
            )}

            <div className="absolute inset-x-0 bottom-0 z-20 flex items-center gap-1 bg-gradient-to-t from-slate-950/75 to-transparent px-3 pb-2.5 pt-8">
              <button
                type="button"
                onClick={togglePlay}
                aria-label={playing ? t('onlineCoursePage.pause') : t('onlineCoursePage.play')}
                className="grid h-9 w-9 place-items-center rounded-lg text-white/90 transition-colors hover:bg-white/15 hover:text-white"
              >
                {playing ? <Pause size={19} /> : <Play size={19} />}
              </button>

              <button
                type="button"
                onClick={toggleMute}
                aria-label={muted ? t('onlineCoursePage.unmute') : t('onlineCoursePage.mute')}
                className="grid h-9 w-9 place-items-center rounded-lg text-white/90 transition-colors hover:bg-white/15 hover:text-white"
              >
                {muted ? <VolumeX size={19} /> : <Volume2 size={19} />}
              </button>

              <span className="ml-1 rounded bg-slate-950/40 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-white/60">
                {t('onlineCoursePage.noSeek')}
              </span>

              <span className="flex-1" />

              <button
                type="button"
                onClick={toggleFullscreen}
                aria-label={
                  fullscreen
                    ? t('onlineCoursePage.exitFullscreen')
                    : t('onlineCoursePage.fullscreen')
                }
                className="grid h-9 w-9 place-items-center rounded-lg text-white/90 transition-colors hover:bg-white/15 hover:text-white"
              >
                {fullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
              </button>
            </div>
          </>
        )}
      </div>

      <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 px-5 py-3">
        <p className="text-[11px] font-semibold text-slate-500">
          {t('onlineCoursePage.watermarkHint')}
        </p>
        {saveError && (
          <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-red-600">
            <AlertCircle size={13} />
            {t('onlineCoursePage.saveError')}
          </p>
        )}
        {lesson.isCompleted && onCompleted && (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700">
            <RotateCcw size={13} />
            {t('onlineCoursePage.completedHint')}
          </span>
        )}
      </footer>
    </section>
  )
}
