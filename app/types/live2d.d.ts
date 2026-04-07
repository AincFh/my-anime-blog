/**
 * Live2D Widget 全局类型声明
 */

interface Live2DConfig {
  model: {
    jsonPath: string;
  };
  display: {
    position: string;
    width: number;
    height: number;
    hOffset: number;
    vOffset: number;
  };
  mobile: {
    show: boolean;
  };
  react: {
    opacityDefault: number;
    opacityOnHover: number;
  };
  dialog: {
    enable: boolean;
  };
}

interface Live2DWidgetInstance {
  init(config: Live2DConfig): void;
  on(event: string, callback: () => void): void;
  emit(event: string): void;
  loadModel(modelName: string): void;
  setXML(xml: string): void;
  resize(): void;
  destroy(): void;
}

declare global {
  interface Window {
    L2Dwidget?: Live2DWidgetInstance;
    live2d?: {
      init: (config: Live2DConfig) => void;
    };
  }
}

export {};
