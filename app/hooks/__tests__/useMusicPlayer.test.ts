import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useMusicPlayer } from '../useMusicPlayer';
import { MUSIC_CONFIG } from '~/config';

// 模拟全局 fetch
global.fetch = vi.fn();

describe('useMusicPlayer Hook', () => {
    const mockSongs = [
        { id: '1', name: 'Song 1', artist: 'Artist 1', url: 'url1', pic: 'pic1', lrc: 'lrc1' },
        { id: '2', name: 'Song 2', artist: 'Artist 2', url: 'url2', pic: 'pic2', lrc: 'lrc2' },
    ];

    beforeEach(() => {
        vi.clearAllMocks();
        (fetch as any).mockResolvedValue({
            json: () => Promise.resolve(mockSongs),
        });
    });

    it('应该能正确获取并初始化歌曲列表', async () => {
        const { result } = renderHook(() => useMusicPlayer());

        // 等待数据加载
        await act(async () => {
            // Fetch triggered by useEffect
        });

        expect(result.current.songs).toEqual(mockSongs);
        expect(result.current.currentSong).toEqual(mockSongs[0]);
        expect(result.current.isLoading).toBe(false);
    });

    it('应该能切换播放/暂停状态', async () => {
        const { result } = renderHook(() => useMusicPlayer());

        await act(async () => {
            result.current.togglePlay();
        });

        expect(result.current.isPlaying).toBe(true);

        await act(async () => {
            result.current.togglePlay();
        });

        expect(result.current.isPlaying).toBe(false);
    });

    it('点击下一首应该正确循环', async () => {
        const { result } = renderHook(() => useMusicPlayer());

        await act(async () => {
            result.current.nextSong();
        });

        expect(result.current.currentIndex).toBe(1);

        await act(async () => {
            result.current.nextSong();
        });

        expect(result.current.currentIndex).toBe(0); // 循环回到第一首
    });

    it('应该能调节音量并记录静音前状态', async () => {
        const { result } = renderHook(() => useMusicPlayer());

        act(() => {
            result.current.setVolume(0.5);
        });

        expect(result.current.volume).toBe(0.5);

        // 切换静音
        act(() => {
            result.current.toggleMute();
        });

        expect(result.current.isMuted).toBe(true);
        expect(result.current.volume).toBe(0);

        // 取消静音应恢复 0.5
        act(() => {
            result.current.toggleMute();
        });

        expect(result.current.isMuted).toBe(false);
        expect(result.current.volume).toBe(0.5);
    });

    it('API 请求失败时应该优雅处理', async () => {
        (fetch as any).mockRejectedValueOnce(new Error('API Down'));

        const { result } = renderHook(() => useMusicPlayer());

        await act(async () => {
            // Wait for effect
        });

        expect(result.current.songs).toEqual([]);
        expect(result.current.isLoading).toBe(false);
    });
});
