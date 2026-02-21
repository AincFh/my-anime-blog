import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

// 主题类型定义
interface Theme {
  id: string;
  name: string;
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  backgroundImage: string;
  cursorStyle?: string;
}

// 主题列表
const themes: Theme[] = [
  {
    id: 'default',
    name: '默认主题',
    primaryColor: '#ff6b6b',
    secondaryColor: '#4ecdc4',
    backgroundColor: '#1a1a2e',
    backgroundImage: 'url(https://api.yimian.xyz/img?id=201)',
  },
  {
    id: 'miku',
    name: '初音未来',
    primaryColor: '#00bfff',
    secondaryColor: '#9932cc',
    backgroundColor: '#1a1a2e',
    backgroundImage: 'url(https://api.yimian.xyz/img?id=202)',
  },
  {
    id: 'asuka',
    name: '明日香',
    primaryColor: '#ff69b4',
    secondaryColor: '#ff8c00',
    backgroundColor: '#1a1a2e',
    backgroundImage: 'url(https://api.yimian.xyz/img?id=203)',
  },
  {
    id: 'evangelion',
    name: '福音战士',
    primaryColor: '#ff0000',
    secondaryColor: '#ffffff',
    backgroundColor: '#000000',
    backgroundImage: 'url(https://api.yimian.xyz/img?id=204)',
  },
  {
    id: 'totoro',
    name: '龙猫',
    primaryColor: '#4a9e6d',
    secondaryColor: '#ff9a8b',
    backgroundColor: '#e8f5e9',
    backgroundImage: 'url(https://api.yimian.xyz/img?id=205)',
  },
  {
    id: 'sailormoon',
    name: '美少女战士',
    primaryColor: '#ff1493',
    secondaryColor: '#00bfff',
    backgroundColor: '#f0f8ff',
    backgroundImage: 'url(https://api.yimian.xyz/img?id=206)',
  },
];

export function ThemeSwitcher() {
  // 初始使用默认主题，不在服务器端尝试访问 localStorage
  const [currentTheme, setCurrentTheme] = useState<Theme>(themes[0]);

  // 在客户端渲染后，从 localStorage 加载主题
  useEffect(() => {
    // 检查是否在浏览器环境中
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme) {
        const theme = themes.find(theme => theme.id === savedTheme);
        if (theme) {
          setCurrentTheme(theme);
        }
      }
    }
  }, []);

  // 应用主题并保存到本地存储
  useEffect(() => {
    const root = document.documentElement;
    const bgElement = document.querySelector('.fullscreen-bg') as HTMLElement | null;

    // 更新CSS变量
    root.style.setProperty('--primary-color', currentTheme.primaryColor);
    root.style.setProperty('--secondary-color', currentTheme.secondaryColor);
    root.style.setProperty('--background-color', currentTheme.backgroundColor);
    root.style.setProperty('--background-image', currentTheme.backgroundImage);

    // 直接更新背景图
    if (bgElement) {
      bgElement.style.backgroundImage = currentTheme.backgroundImage;
      bgElement.style.backgroundColor = currentTheme.backgroundColor;
    }

    // 更新鼠标光标（如果有）
    if (currentTheme.cursorStyle) {
      root.style.cursor = currentTheme.cursorStyle;
    } else {
      root.style.cursor = 'default';
    }

    // 检查是否在浏览器环境中，只在客户端保存主题
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', currentTheme.id);
    }
  }, [currentTheme]);

  return (
    <motion.div
      className="glass-effect rounded-full p-2 fixed top-4 right-4 z-50 md:top-6 md:right-6"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <select
        value={currentTheme.id}
        onChange={(e) => {
          const theme = themes.find(t => t.id === e.target.value);
          if (theme) {
            setCurrentTheme(theme);
          }
        }}
        className="bg-transparent border-none text-white px-3 py-1 md:px-4 md:py-2 rounded-full focus:outline-none focus:ring-2 focus:ring-primary text-sm md:text-base"
      >
        {themes.map((theme) => (
          <option key={theme.id} value={theme.id} className="bg-gray-900 text-white">
            {theme.name}
          </option>
        ))}
      </select>
    </motion.div>
  );
}