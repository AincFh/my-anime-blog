import { useState, useEffect, useRef, useCallback } from "react";

export interface Song {
    title: string;
    author: string;
    url: string;
    pic: string;
    lrc?: string;
}

export interface LyricLine {
    time: number;
    text: string;
}

  // 网络状态类型
  export type NetworkStatus = 'idle' | 'slow' | 'error';

  // 播放模式类型
  export type PlayMode = 'list' | 'one' | 'shuffle';

export function parseLRC(lrc: string): LyricLine[] {
    if (!lrc) return [];
    const lines = lrc.split("\n");
    const result: LyricLine[] = [];
    // 兼容多样化时间戳：[00:00], [00:00.00], [00:00.000], [00:00:00] 等
    const timeRegex = /\[(\d+):(\d+)(?:[:.](\d+))?\]/g;

    lines.forEach((line) => {
        let match;
        // 重置 regex 状态以便在同一行匹配多个时间戳（虽然不常用，但 LRC 规范支持）
        while ((match = timeRegex.exec(line)) !== null) {
            const mins = parseInt(match[1]);
            const secs = parseInt(match[2]);
            const msStr = match[3] || "0";
            // 将毫秒部分转为浮点秒
            const ms = parseFloat("0." + msStr);
            const time = mins * 60 + secs + ms;
            const text = line.replace(/\[.*?\]/g, "").trim();
            if (text) {
                result.push({ time, text });
            }
        }
    });

    return result.sort((a, b) => a.time - b.time);
}

const MUSIC_PLAYER_TOGGLE_EVENT = "music-player-toggle";
const BREAKPOINT_STORAGE_KEY = "music_player_breakpoint";
const BREAKPOINT_TTL_MS = 2 * 60 * 60 * 1000; // 2小时自动销毁

export interface BreakpointData {
    songUrl: string;
    currentTime: number;
    currentIndex: number;
    savedAt: number;
}

export function musicPlayerToggle() {
    if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent(MUSIC_PLAYER_TOGGLE_EVENT));
    }
}

/**
 * 保存断点到 localStorage
 */
function saveBreakpoint(song: Song, currentTime: number, currentIndex: number): void {
    if (typeof window === "undefined") return;
    try {
        const data: BreakpointData = {
            songUrl: song.url,
            currentTime,
            currentIndex,
            savedAt: Date.now(),
        };
        localStorage.setItem(BREAKPOINT_STORAGE_KEY, JSON.stringify(data));
    } catch {
        // localStorage 满了或不可用时静默失败
    }
}

/**
 * 读取断点（自动检查 TTL）
 */
function loadBreakpoint(): BreakpointData | null {
    if (typeof window === "undefined") return null;
    try {
        const raw = localStorage.getItem(BREAKPOINT_STORAGE_KEY);
        if (!raw) return null;
        const data: BreakpointData = JSON.parse(raw);
        if (Date.now() - data.savedAt > BREAKPOINT_TTL_MS) {
            localStorage.removeItem(BREAKPOINT_STORAGE_KEY);
            return null;
        }
        return data;
    } catch {
        return null;
    }
}

/**
 * 清除断点
 */
function clearBreakpoint(): void {
    if (typeof window === "undefined") return;
    localStorage.removeItem(BREAKPOINT_STORAGE_KEY);
}

import { MUSIC_CONFIG } from "~/config";

/** 比较「逻辑上」是否为同一首音频地址，避免 audio.src 已解析为绝对 URL 时误判而重复 load */
function mediaUrlEquals(audio: HTMLAudioElement, url: string): boolean {
    if (!url) return false;
    try {
        const resolved = new URL(url, typeof window !== "undefined" ? window.location.href : "https://localhost/").href;
        if (audio.currentSrc && audio.currentSrc === resolved) return true;
        if (audio.src) {
            return new URL(audio.src).href === resolved;
        }
    } catch {
        return false;
    }
    return false;
}

export function useMusicPlayer(playlistId: string = MUSIC_CONFIG.defaultPlaylistId) {
    const [songs, setSongs] = useState<Song[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [volume, setVolume] = useState(1);
    const [isVisible, setIsVisible] = useState(true);
    const [networkStatus, setNetworkStatus] = useState<NetworkStatus>('idle'); // 网络状态
    const [playMode, setPlayModeState] = useState<PlayMode>('list'); // 播放模式

    // 断点恢复相关：用 ref 跟踪是否已从断点恢复过
    const hasRestoredRef = useRef(false);
    // 记录从断点恢复时的歌曲索引，用于判断用户是否主动切换了歌曲
    const restoredFromIndexRef = useRef<number | null>(null);
    // 正在从断点恢复中（防止 setState 异步导致 clear-breakpoint effect 误清除）
    const isRestoringRef = useRef(false);

    const audioRef = useRef<HTMLAudioElement | null>(null);
    const nextAudioRef = useRef<HTMLAudioElement | null>(null); // 无缝衔接：预加载下一首

    const currentSong = songs[currentIndex];

    // 监听开关事件
    useEffect(() => {
        const handleToggle = () => setIsVisible(prev => !prev);
        window.addEventListener(MUSIC_PLAYER_TOGGLE_EVENT, handleToggle);
        return () => window.removeEventListener(MUSIC_PLAYER_TOGGLE_EVENT, handleToggle);
    }, []);

    // 获取数据 (带 localStorage 缓存 + 1h TTL)
    useEffect(() => {
        const fetchMusic = async () => {
            const cacheKey = `netease_playlist_${playlistId}`;
            const cached = localStorage.getItem(cacheKey);
            
            // 用于合并旧歌词文本的引用
            let existingLyricsMap: Record<string, string> = {};

            if (cached) {
                try {
                    const { data, ts } = JSON.parse(cached);
                    // 记录现有的歌词文本数据，防止其后被网络请求覆盖
                    if (Array.isArray(data)) {
                        data.forEach((s: Song) => {
                            if (s.lrc && !s.lrc.startsWith("http")) {
                                existingLyricsMap[s.url] = s.lrc;
                            }
                        });
                    }

                    if (Date.now() - ts < 3600000) {
                        setSongs(data);
                        return;
                    }
                } catch {
                    localStorage.removeItem(cacheKey);
                }
            }

            try {
                setIsLoading(true);
                const res = await fetch(`${MUSIC_CONFIG.apiBase}?server=netease&type=playlist&id=${playlistId}`);
                const text = await res.text();
                const trimmed = text.trim();
                
                if (!res.ok || trimmed.startsWith("<") || (!trimmed.startsWith("[") && !trimmed.startsWith("{"))) {
                    return;
                }
                
                let json = JSON.parse(trimmed);
                if (Array.isArray(json) && json.length > 0) {
                    // 合并缓存中的歌词文本
                    const merged = json.map((s: Song) => ({
                        ...s,
                        lrc: existingLyricsMap[s.url] || s.lrc
                    }));
                    setSongs(merged);
                    localStorage.setItem(cacheKey, JSON.stringify({ data: merged, ts: Date.now() }));
                }
            } catch (err) {
                console.error("Failed to fetch music list", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchMusic();
    }, [playlistId]);


    // ==================== 断点续播逻辑 ====================
    // 页面加载时检查并恢复断点
    useEffect(() => {
        if (songs.length === 0 || hasRestoredRef.current) return;

        const breakpoint = loadBreakpoint();
        if (breakpoint) {
            // 找到匹配的歌曲
            const matchedIndex = songs.findIndex(s => s.url === breakpoint.songUrl);
            if (matchedIndex !== -1) {
                // 先记录恢复标记，避免紧接着的 currentIndex 变化触发 clearBreakpoint 把断点清掉
                restoredFromIndexRef.current = matchedIndex;
                hasRestoredRef.current = true;
                isRestoringRef.current = true; // 标记：正在恢复，防止异步 setState 导致误清除
                setCurrentIndex(matchedIndex);
                // 恢复完成后清除标记（稍后通过 requestAnimationFrame 确保在 React 批次更新之后执行）
                requestAnimationFrame(() => { isRestoringRef.current = false; });
                // currentTime 稍后在 audio timeupdate 中自动同步，这里只记录期望值
                requestAnimationFrame(() => {
                    if (audioRef.current) {
                        audioRef.current.currentTime = breakpoint.currentTime;
                    }
                });
                // 自动恢复播放（静默失败不阻塞）
                setIsPlaying(true);
            }
        }
    }, [songs]);

    // 用户离开网站时保存断点（visibilitychange + beforeunload 双保险）
    useEffect(() => {
        const saveOnLeave = () => {
            if (!currentSong) return;
            saveBreakpoint(currentSong, currentTime, currentIndex);
        };

        const handleVisibilityChange = () => {
            if (document.hidden) {
                saveOnLeave();
            }
        };

        const handleBeforeUnload = () => {
            saveOnLeave();
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);
        window.addEventListener("beforeunload", handleBeforeUnload);

        return () => {
            document.removeEventListener("visibilitychange", handleVisibilityChange);
            window.removeEventListener("beforeunload", handleBeforeUnload);
        };
    }, [currentSong, currentTime, currentIndex]);

    // 用户主动切换歌曲时清除旧断点
    useEffect(() => {
        if (isRestoringRef.current) return; // 正在从断点恢复，跳过（防止 setState 异步导致误清除）
        if (restoredFromIndexRef.current !== null && currentIndex !== restoredFromIndexRef.current) {
            // 用户在断点恢复后主动切换了歌曲，清除断点
            clearBreakpoint();
        } else if (restoredFromIndexRef.current === null) {
            // 没有断点恢复过，用户正常切换歌曲时也清除（兜底）
            clearBreakpoint();
        }
    }, [currentIndex]);


    // ==================== 歌词二次请求 ====================
    // Meting API 的 lrc 字段返回的是 URL 而非文本，需要二次 fetch 获取真正的 LRC 内容
    useEffect(() => {
        if (songs.length === 0) return;
        const song = songs[currentIndex];
        if (!song?.lrc) return;
        
        // 判断是否为 URL（以 http 开头说明还没被替换为真正的歌词文本）
        if (!song.lrc.startsWith("http")) return;
        
        const lrcUrl = song.lrc;
        let cancelled = false;
        
        (async () => {
            try {
                const res = await fetch(lrcUrl);
                if (!res.ok) return;
                const text = await res.text();
                const trimmed = text.trim();
                // 安全校验：确认返回的是 LRC 格式而非 HTML
                if (trimmed.startsWith("<") || !trimmed.includes("[")) return;
                
                if (!cancelled) {
                    setSongs(prev => {
                        const updated = prev.map((s, i) => 
                            i === currentIndex ? { ...s, lrc: trimmed } : s
                        );
                        
                        // 同步持久化缓存
                        const cacheKey = `netease_playlist_${playlistId}`;
                        const cached = localStorage.getItem(cacheKey);
                        if (cached) {
                            try {
                                const { ts } = JSON.parse(cached);
                                localStorage.setItem(cacheKey, JSON.stringify({ data: updated, ts }));
                            } catch (e) {}
                        }
                        return updated;
                    });
                }
            } catch {
                // 网络错误时静默失败，不阻塞播放
            }


        })();
        
        return () => { cancelled = true; };
    }, [currentIndex, songs.length]);

  // 播放状态同步 + 网络状态检测
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || songs.length === 0) return;

    const currentSong = songs[currentIndex];
    if (!mediaUrlEquals(audio, currentSong.url)) {
      audio.src = currentSong.url;
      audio.load();
      // 切歌时重置网络状态，让用户无感知（不显示任何提示）
      setNetworkStatus('idle');
    }

    audio.volume = isMuted ? 0 : volume;
    if (isPlaying) {
      audio.play().catch(() => setIsPlaying(false));
    } else {
      audio.pause();
    }
  }, [isPlaying, currentIndex, isMuted, volume, songs]);

  // 无缝衔接：当歌曲快结束时预缓存下一首
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || songs.length === 0) return;

    // 用 ref 跟踪当前歌曲是否已预加载下一首
    const preloadedRef = { current: false };

    const onTimeUpdate = () => {
      if (preloadedRef.current) return;
      // 更早开始预拉下一首，便于走 HTTP 缓存，减轻切歌瞬间的空白
      const remain =
        duration > 0 && Number.isFinite(duration)
          ? duration - audio.currentTime
          : Infinity;
      if (remain < 12 && currentIndex < songs.length - 1) {
        preloadedRef.current = true;
        const preloadAudio = new Audio();
        preloadAudio.preload = "auto";
        preloadAudio.src = songs[currentIndex + 1].url;
        preloadAudio.load();
        nextAudioRef.current = preloadAudio;
      }
    };

    const onEnded = () => {
      const len = songs.length;
      if (len === 0) return;

      if (nextAudioRef.current) {
        const nextAudio = nextAudioRef.current;
        nextAudioRef.current = null;
        const nextUrl = nextAudio.src || songs[(currentIndex + 1) % len].url;
        audio.src = nextUrl;
        // 无缝路径：不再显式 load()，避免重置媒体元素导致已缓存资源重新解码、听感「卡一下」
        void audio.play().catch(() => setIsPlaying(false));
        setCurrentIndex((prev) => (prev + 1) % len);
        setCurrentTime(0);
        return;
      }

      // 无预加载（最后一首、网络慢、时长未就绪等）：与手动「下一首」一致，列表循环
      setCurrentIndex((prev) => (prev + 1) % len);
      setCurrentTime(0);
      setIsPlaying(true);
    };

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('ended', onEnded);

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('ended', onEnded);
    };
  }, [songs, currentIndex, duration]);

  // 重置预加载标记（切歌时）
  useEffect(() => {
    nextAudioRef.current = null;
  }, [currentIndex]);

  // 网络慢时提示（仅在真正缓冲超过 1.5s 时才提示）
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || songs.length === 0) return;

    let slowTimer: ReturnType<typeof setTimeout>;

    const onWaiting = () => {
      clearTimeout(slowTimer);
      slowTimer = setTimeout(() => setNetworkStatus('slow'), 1500);
    };

    const onCanPlay = () => {
      clearTimeout(slowTimer);
      setNetworkStatus('idle');
    };

    const onError = () => {
      clearTimeout(slowTimer);
      setNetworkStatus('error');
    };

    audio.addEventListener('waiting', onWaiting);
    audio.addEventListener('canplay', onCanPlay);
    audio.addEventListener('error', onError);

    return () => {
      audio.removeEventListener('waiting', onWaiting);
      audio.removeEventListener('canplay', onCanPlay);
      audio.removeEventListener('error', onError);
      clearTimeout(slowTimer);
    };
  }, [songs, currentIndex]);

    const togglePlay = () => setIsPlaying(!isPlaying);

    const handleNext = useCallback(() => {
        setSongs(currentSongs => {
            if (currentSongs.length === 0) return currentSongs;
            setCurrentIndex(prev => (prev + 1) % currentSongs.length);
            setIsPlaying(true);
            return currentSongs;
        });
    }, []);

    const handlePrev = useCallback(() => {
        setSongs(currentSongs => {
            if (currentSongs.length === 0) return currentSongs;
            setCurrentIndex(prev => (prev - 1 + currentSongs.length) % currentSongs.length);
            setIsPlaying(true);
            return currentSongs;
        });
    }, []);

    const handleSeek = (time: number) => {
        setCurrentTime(time);
        if (audioRef.current) audioRef.current.currentTime = time;
    };

    return {
        songs,
        currentSong,
        currentIndex,
        setCurrentIndex,
        isPlaying,
        setIsPlaying,
        togglePlay,
        handleNext,
        handlePrev,
        currentTime,
        setCurrentTime,
        duration,
        setDuration,
        handleSeek,
        volume,
        setVolume,
        isMuted,
        setIsMuted,
        isLoading,
        isVisible,
        setIsVisible,
        audioRef,
        networkStatus // 新增：网络状态
    };
}
