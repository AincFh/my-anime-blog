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
    const timeRegex = /\[(\d+):(\d+\.\d+)\]/;

    lines.forEach((line) => {
        const match = timeRegex.exec(line);
        if (match) {
            const mins = parseInt(match[1]);
            const secs = parseFloat(match[2]);
            const text = line.replace(timeRegex, "").trim();
            if (text) {
                result.push({ time: mins * 60 + secs, text });
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

    // 通过事件属性方式让 DOM 层面直接报告时间更新
    // 不再这里自行 new Audio 制造孤点引用

    // 监听开关事件
    useEffect(() => {
        const handleToggle = () => setIsVisible(prev => !prev);
        window.addEventListener(MUSIC_PLAYER_TOGGLE_EVENT, handleToggle);
        return () => window.removeEventListener(MUSIC_PLAYER_TOGGLE_EVENT, handleToggle);
    }, []);

    // 获取数据 (带 sessionStorage 缓存)
    useEffect(() => {
        const fetchMusic = async () => {
            const cacheKey = `netease_playlist_${playlistId}`;
            const cached = sessionStorage.getItem(cacheKey);
            if (cached) {
                try {
                    const data = JSON.parse(cached);
                    setSongs(data);
                    return;
                } catch (e) {
                    sessionStorage.removeItem(cacheKey);
                }
            }

            try {
                setIsLoading(true);
                const res = await fetch(`${MUSIC_CONFIG.apiBase}?server=netease&type=playlist&id=${playlistId}`);
                const data = await res.json();
                if (Array.isArray(data) && data.length > 0) {
                    setSongs(data);
                    sessionStorage.setItem(cacheKey, JSON.stringify(data));
                }
            } catch (err) {
                console.error("Failed to fetch music list", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchMusic();
    }, [playlistId]);

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
        audioRef
    };
}
