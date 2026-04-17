'use client'

import React from 'react'
import Image from 'next/image'
import { ArrowLeft, Camera, Loader2, ScanLine, Upload } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { AnalyzerState } from '@/lib/hooks/useFoodImageAnalyzer'

interface CameraScannerProps {
  isOpen: boolean
  state: AnalyzerState
  error: string | null
  scanImageDataUrl: string | null
  videoRef: React.RefObject<HTMLVideoElement | null>
  fileInputRef: React.RefObject<HTMLInputElement | null>
  onClose: () => void
  onCapture: () => void
  onRetake: () => void
  onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void
  children?: React.ReactNode
}

export function CameraScanner({
  isOpen,
  state,
  error,
  scanImageDataUrl,
  videoRef,
  fileInputRef,
  onClose,
  onCapture,
  onRetake,
  onFileChange,
  children,
}: CameraScannerProps) {
  if (!isOpen) return null

  const showLiveCamera = state === 'streaming'
  const showCaptured = state === 'captured' || state === 'analyzing' || state === 'results'
  const showError = state === 'error'

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-black">
      <input ref={fileInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={onFileChange} />

      <div className="absolute top-0 left-0 right-0 h-[80px] bg-gradient-to-b from-black/80 to-transparent flex items-center justify-between px-6 z-20">
        <button
          onClick={onClose}
          className="w-[40px] h-[40px] rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/20 transition-colors"
        >
          <ArrowLeft className="w-[20px] h-[20px]" />
        </button>
        <span className="font-display font-bold text-[18px] text-white">AI Vision Scan</span>
        <div className="w-[40px]" />
      </div>

      <div className="flex-1 relative overflow-hidden bg-black flex items-center justify-center">
        {showLiveCamera && (
          <>
            <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-x-10 inset-y-[20%] border-2 border-dashed border-white/50 rounded-[32px] pointer-events-none flex flex-col items-center justify-center">
              <ScanLine className="w-[64px] h-[64px] text-white/50 animate-pulse" />
            </div>
          </>
        )}

        {showCaptured && scanImageDataUrl && (
          <Image
            src={scanImageDataUrl}
            alt="Captured meal"
            fill
            unoptimized
            sizes="100vw"
            className="absolute inset-0 object-cover filter brightness-75"
          />
        )}

        {state === 'idle' && (
          <div className="text-white text-center">
            <Loader2 className="w-[40px] h-[40px] animate-spin mx-auto mb-4 text-emerald-500" />
            <p className="font-body">Initializing camera...</p>
          </div>
        )}

        {state === 'analyzing' && (
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm shadow-[inset_0_0_100px_rgba(16,185,129,0.3)] flex flex-col items-center justify-center z-30">
            <div className="w-[120px] h-[120px] rounded-full border-4 border-emerald-500/20 border-t-emerald-500 animate-spin mb-6 drop-shadow-[0_0_20px_rgba(16,185,129,0.8)]" />
            <h2 className="font-display font-black text-[22px] sm:text-[24px] lg:text-[28px] text-white mb-2">Analyzing Meal...</h2>
            <p className="font-body text-emerald-400 font-medium">Detecting food and calculating macros</p>
          </div>
        )}

        {showError && (
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center gap-4 px-6 text-center z-30">
            <p className="font-display text-[24px] text-white">Scan Error</p>
            <p className="font-body text-[14px] text-white/80 max-w-[360px]">{error || 'Unable to process this image.'}</p>
            <div className="flex items-center gap-3">
              <button
                onClick={onRetake}
                className="h-[44px] px-4 rounded-[12px] bg-zinc-800 text-white font-body font-semibold"
              >
                Try Camera Again
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="h-[44px] px-4 rounded-[12px] bg-emerald-500 text-white font-body font-semibold"
              >
                Upload Photo
              </button>
            </div>
          </div>
        )}

        {children}
      </div>

      {state === 'streaming' && (
        <div className="absolute bottom-0 left-0 right-0 h-[140px] bg-gradient-to-t from-black via-black/80 to-transparent flex flex-col items-center justify-center z-20 pb-6">
          <button
            onClick={onCapture}
            className="w-[80px] h-[80px] rounded-full border-[4px] border-white/50 flex items-center justify-center relative hover:scale-[1.05] transition-transform active:scale-95 group"
          >
            <div className="w-[64px] h-[64px] rounded-full bg-white transition-transform group-active:scale-90" />
          </button>
          <button
            className={cn('absolute bottom-10 right-10 text-white/80 hover:text-white flex items-center gap-2')}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="w-[14px] h-[14px]" />
            <span className="font-body text-[13px] font-semibold tracking-wide uppercase">Upload</span>
          </button>
          <button
            className="absolute bottom-10 left-10 text-white/80 hover:text-white flex items-center gap-2"
            onClick={onRetake}
          >
            <Camera className="w-[14px] h-[14px]" />
            <span className="font-body text-[13px] font-semibold tracking-wide uppercase">Reset</span>
          </button>
        </div>
      )}
    </div>
  )
}
