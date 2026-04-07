import { useEffect, useState, useRef, useMemo } from "react";
import { useMusicPlayer, parseLRC } from "~/hooks/useMusicPlayer";
import { MusicPlayerMini } from "./MusicPlayerMini";
import { MusicPlayerFullscreen } from "./MusicPlayerFullscreen";

/**
 * The Brain (大满贯中枢核): 负责调度音频原边、AudioContext 分析器及分发状态
 * 不牵涉任何具体外观 UI，只负责呈现 A（小卡片）或 B（大仓）
 */
export function MusicPlayer({ playlistId: externalId }: { playlistId?: string }) {
  const {
    songs, currentSong, currentIndex, setCurrentIndex,
    isPlaying, setIsPlaying, togglePlay, handleNext, handlePrev,
    currentTime, setCurrentTime, duration, setDuration, handleSeek,
    volume, setVolume, isMuted, setIsMuted,
    isLoading, isVisible, setIsVisible, audioRef
  } = useMusicPlayer(externalId);

  const [isExpanded, setIsExpanded] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showPlaylist, setShowPlaylist] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [stylusState, setStylusState] = useState<"iddle" | "lifting" | "playing">("iddle");
  
  // 共享给旧版迷你播放器的强制 60FPS DOM 数据同步用的 ref 和 data
  const [audioData, setAudioData] = useState<Uint8Array | null>(null);
  
  // 核心的 Web Audio 分析器 (将暴露给全屏版本的 Canvas 使用)
  const [analyserNode, setAnalyserNode] = useState<AnalyserNode | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // 跳过 React 调度用的原生操控句柄 (主要在 Mini 版本用)
  const progressFillRef = useRef<HTMLDivElement>(null);
  const progressBarRef = useRef<HTMLInputElement>(null);
  const currentTimeRef = useRef<HTMLSpanElement>(null);

  useEffect(() => { setIsMounted(true); }, []);

  // Web Audio 引擎挂载（仅初始化 AudioContext，不驱动任何轮询）
  useEffect(() => {
    if (!isPlaying || !audioRef.current) return;

    if (!audioContextRef.current) {
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioCtx();
        const source = ctx.createMediaElementSource(audioRef.current);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 64;
        source.connect(analyser);
        analyser.connect(ctx.destination);

        audioContextRef.current = ctx;
        setAnalyserNode(analyser);
      } catch (e) {
        console.warn("AudioContext failed", e);
      }
    }
  }, [isPlaying]);

  // Mini 版频谱轮询（全屏时完全不启动，零开销）
  useEffect(() => {
     if (!analyserNode || !isPlaying || isFullscreen) return;
     let localRaf: number;
     const updateMiniData = () => {
         localRaf = requestAnimationFrame(updateMiniData);
         const data = new Uint8Array(analyserNode.frequencyBinCount);
         analyserNode.getByteFrequencyData(data);
         setAudioData(new Uint8Array(data));
     }
     updateMiniData();
     return () => cancelAnimationFrame(localRaf);
  }, [analyserNode, isPlaying, isFullscreen]);

  // 物理状态：唱针阻尼
  useEffect(() => {
    if (isPlaying) {
      setStylusState("lifting");
      const timer = setTimeout(() => setStylusState("playing"), 500);
      return () => clearTimeout(timer);
    } else {
      setStylusState("iddle");
    }
  }, [isPlaying]);

  // 极限守护：完全跳过 React 状态树直接修改 DOM 取进度
  useEffect(() => {
    let lastTime = -1;
    let rafId: number;
    const updateProgress = () => {
      const audio = audioRef.current;
      if (audio && !audio.paused && isFinite(audio.duration)) {
        const safeDuration = audio.duration > 0 ? audio.duration : 100;
        const progressPercent = Math.max(0, Math.min((audio.currentTime / safeDuration) * 100, 100)) || 0;

        if (progressFillRef.current) progressFillRef.current.style.width = `${progressPercent}%`;
        if (progressBarRef.current) progressBarRef.current.value = String(audio.currentTime);

        if (currentTimeRef.current) {
          const time = audio.currentTime;
          const mins = Math.floor(time / 60);
          const secs = Math.floor(time % 60);
          currentTimeRef.current.innerText = `${mins}:${secs.toString().padStart(2, "0")}`;
        }
        
        // 高频同步：每帧更新状态以供歌词计算，不再有 1s 限制
        setCurrentTime(audio.currentTime);

        const currentDur = audio.duration;
        if (currentDur && currentDur !== duration) setDuration(currentDur);
      }
      rafId = requestAnimationFrame(updateProgress);
    };

    rafId = requestAnimationFrame(updateProgress);
    return () => cancelAnimationFrame(rafId);
  }, [audioRef, setCurrentTime, setDuration, duration]);

  // Escape 劫持退出全屏
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFullscreen]);


  // 提取歌词计算 (安全监听 currentSong.lrc，防丢失)
  const currentLyrics = useMemo(() => {
    return currentSong?.lrc ? parseLRC(currentSong.lrc) : [];
  }, [currentSong?.lrc]);

  if (!isMounted || !isVisible) return null;

  // 引入 0.5s 的提前量补偿，解决歌词滞后问题
  const SYNC_OFFSET = 0.5;
  const activeLyricIndex = currentLyrics.findIndex((l: any, i: number) =>
    l.time <= (currentTime + SYNC_OFFSET) && (!currentLyrics[i + 1] || currentLyrics[i + 1].time > (currentTime + SYNC_OFFSET))
  );



  const sharedProps = {
    songs, currentSong, currentIndex, setCurrentIndex,
    isPlaying, setIsPlaying, togglePlay, handleNext, handlePrev,
    currentTime, setCurrentTime, duration, setDuration, handleSeek,
    volume, setVolume, isMuted, setIsMuted, isLoading,
    currentTimeRef, progressBarRef, progressFillRef,
    showPlaylist, setShowPlaylist,
    stylusState, audioData, analyserNode
  };

  // ==================
  // 退出全屏 (以前是销毁，现在改为回归迷你模式以符合用户后台播放预期)
  // ==================
  const handleFullClose = () => {
    setIsFullscreen(false);
    // 不再执行 setIsVisible(false) 和 setIsPlaying(false)
  };


  return (
    <>
      {songs.length > 0 && currentSong && (
        <audio 
          ref={audioRef} 
          src={currentSong.url} 
          preload="metadata" 
          crossOrigin="anonymous" 
          onEnded={handleNext}
        />
      )}

      {isFullscreen ? (
        <MusicPlayerFullscreen 
           {...sharedProps}
           currentLyrics={currentLyrics}
           activeLyricIndex={activeLyricIndex}
           onClose={handleFullClose}
           onMinimize={() => setIsFullscreen(false)}
        />
      ) : (
        <MusicPlayerMini 
           {...sharedProps}
           isExpanded={isExpanded}
           toggleExpand={() => setIsExpanded(!isExpanded)}
           onFullscreen={() => setIsFullscreen(true)}
        />
      )}
    </>
  );
}
