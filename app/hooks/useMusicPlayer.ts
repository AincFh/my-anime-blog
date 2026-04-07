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

export function musicPlayerToggle() {
    if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent(MUSIC_PLAYER_TOGGLE_EVENT));
    }
}

import { MUSIC_CONFIG } from "~/config";

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

    const audioRef = useRef<HTMLAudioElement | null>(null);

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

    // 播放状态同步
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio || songs.length === 0) return;

        const currentSong = songs[currentIndex];
        if (audio.src !== currentSong.url) {
            audio.src = currentSong.url;
            audio.load();
        }

        audio.volume = isMuted ? 0 : volume;
        if (isPlaying) {
            audio.play().catch(() => setIsPlaying(false));
        } else {
            audio.pause();
        }
    }, [isPlaying, currentIndex, isMuted, volume, songs]);

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

    const currentSong = songs[currentIndex];

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
        audioRef
    };
}
