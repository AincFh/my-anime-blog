import { createContext, useContext, type ReactNode } from "react";

/**
 * 系统设置Context
 * 功能：全站共享配置，从数据库JSON加载
 */
export interface SystemSettings {
  // 基本设定
  site_title: string;
  site_description: string;
  keywords: string;
  master_name: string;
  avatar_url: string;
  bio: string;
  footer_text: string;
  icp_number?: string;
  start_year: number;

  // 外观引擎
  theme: {
    default_wallpaper: string;
    dark_mode_wallpaper: string;
    overlay_opacity: number;
    primary_color: string;
    radius: "small" | "medium" | "large" | "full";
    enable_particles: boolean;
    enable_blur: boolean;
    gray_mode: boolean;
  };

  // 功能模块
  features: {
    live2d: {
      enabled: boolean;
      model_source: string;
      position: "bottom-left" | "bottom-right";
    };
    music: {
      auto_play: boolean;
      playlist_id: string;
      volume: number;
    };
    comments: {
      enabled: boolean;
      enable_danmaku: boolean;
      review_required: boolean;
    };
  };

  // 第三方连接
  integrations: {
    google_analytics_id?: string;
    cloudflare_analytics_token?: string;
    social: {
      github?: string;
      bilibili?: string;
      twitter?: string;
    };
    r2: {
      public_domain?: string;
      upload_path: string;
    };
  };

  // 安全与备份
  security: {
    maintenance_mode: boolean;
  };
}

const defaultSettings: SystemSettings = {
  site_title: "Project Blue Sky",
  site_description: "沉浸式二次元个人终端",
  keywords: "二次元, React, 博客",
  master_name: "Master",
  avatar_url: "",
  bio: "欢迎来到我的二次元基地",
  footer_text: "© 2024 Project Blue Sky",
  start_year: 2024,
  theme: {
    default_wallpaper: "",
    dark_mode_wallpaper: "",
    overlay_opacity: 0.3,
    primary_color: "#FF9F43",
    radius: "large",
    enable_particles: true,
    enable_blur: true,
    gray_mode: false,
  },
  features: {
    live2d: {
      enabled: true,
      model_source: "",
      position: "bottom-left",
    },
    music: {
      auto_play: false,
      playlist_id: "",
      volume: 50,
    },
    comments: {
      enabled: true,
      enable_danmaku: true,
      review_required: true,
    },
  },
  integrations: {
    social: {
      github: "",
      bilibili: "",
      twitter: "",
    },
    r2: {
      upload_path: "uploads/",
    },
  },
  security: {
    maintenance_mode: false,
  },
};

const SettingsContext = createContext<{
  settings: SystemSettings;
  updateSettings: (newSettings: Partial<SystemSettings>) => void;
}>({
  settings: defaultSettings,
  updateSettings: () => {},
});

export function SettingsProvider({ children, settings }: { children: ReactNode; settings: SystemSettings }) {
  return (
    <SettingsContext.Provider value={{ settings, updateSettings: () => {} }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}

