---
name: glassmorphism-ui
description: 生成极光玻璃态UI组件，支持毛玻璃、渐变、霓虹光效。iOS 26 Liquid Glass风格。用于创建按钮、卡片、模态框、导航栏等玻璃态组件。
---

# 极光玻璃态 UI 组件生成

## 核心样式系统

### 基础玻璃态类

```typescript
// app/styles/glass.css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer components {
  .glass {
    @apply bg-white/10 backdrop-blur-lg border border-white/20;
  }
  
  .glass-strong {
    @apply bg-white/20 backdrop-blur-xl border border-white/30;
  }
  
  .glass-elevated {
    @apply glass shadow-lg shadow-black/20;
  }
  
  .glass-input {
    @apply bg-white/5 backdrop-blur-md border border-white/10 
           focus:border-white/30 focus:ring-2 focus:ring-white/10
           placeholder:text-white/40;
  }
  
  .glass-button {
    @apply glass px-4 py-2 rounded-lg transition-all duration-200
           hover:bg-white/20 hover:shadow-lg hover:shadow-white/10
           active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed;
  }
  
  .glass-card {
    @apply glass-elevated rounded-2xl p-6;
  }
  
  .glass-modal {
    @apply glass-strong rounded-3xl p-8 shadow-2xl shadow-black/40;
  }
  
  .glass-nav {
    @apply glass sticky top-0 z-50 border-b border-white/10;
  }
}
```

## 霓虹光效系统

### 霓虹渐变

```typescript
// Tailwind 自定义渐变配置
const tailwindConfig = {
  theme: {
    extend: {
      backgroundImage: {
        'aurora-gradient': 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
        'neon-cyan': 'linear-gradient(90deg, #00d4ff, #7b2ff7)',
        'neon-pink': 'linear-gradient(90deg, #f72fff, #ff6b6b)',
        'glass-gradient': 'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))',
      },
      boxShadow: {
        'neon-cyan': '0 0 20px rgba(0, 212, 255, 0.5), 0 0 40px rgba(0, 212, 255, 0.3)',
        'neon-pink': '0 0 20px rgba(247, 47, 255, 0.5), 0 0 40px rgba(247, 47, 255, 0.3)',
        'neon-purple': '0 0 20px rgba(123, 47, 247, 0.5), 0 0 40px rgba(123, 47, 247, 0.3)',
        'glow': '0 0 30px rgba(255, 255, 255, 0.2)',
      },
    },
  },
};
```

## 组件模板

### 玻璃态按钮

```typescript
interface GlassButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
}

export function GlassButton({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  loading,
  disabled,
  onClick,
  className = '',
}: GlassButtonProps) {
  const baseStyles = 'glass-button flex items-center justify-center gap-2 font-medium';
  
  const variants = {
    primary: 'bg-gradient-to-r from-cyan-500/30 to-purple-500/30 hover:from-cyan-500/50 hover:to-purple-500/50',
    secondary: 'bg-white/5 hover:bg-white/10',
    danger: 'bg-red-500/30 hover:bg-red-500/50',
    ghost: 'bg-transparent hover:bg-white/10',
  };
  
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };
  
  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || loading}
      onClick={onClick}
    >
      {loading ? (
        <span className="animate-spin">⟳</span>
      ) : icon ? (
        icon
      ) : null}
      {children}
    </button>
  );
}
```

### 玻璃态卡片

```typescript
interface GlassCardProps {
  children: React.ReactNode;
  variant?: 'default' | 'interactive' | 'highlight';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
}

export function GlassCard({
  children,
  variant = 'default',
  padding = 'md',
  className = '',
  onClick,
}: GlassCardProps) {
  const paddings = {
    none: '',
    sm: 'p-3',
    md: 'p-6',
    lg: 'p-8',
  };
  
  const variants = {
    default: 'glass-card',
    interactive: 'glass-card cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-white/10',
    highlight: 'glass-card border-2 border-cyan-500/30 shadow-neon-cyan',
  };
  
  const Component = onClick ? 'button' : 'div';
  
  return (
    <Component
      className={`${variants[variant]} ${paddings[padding]} ${className}`}
      onClick={onClick}
    >
      {children}
    </Component>
  );
}
```

### 玻璃态模态框

```typescript
interface GlassModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function GlassModal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
}: GlassModalProps) {
  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-2xl',
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* 背景遮罩 */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* 模态框内容 */}
      <div className={`glass-modal ${sizes[size]} w-full relative z-10 animate-in fade-in zoom-in-95`}>
        {title && (
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">{title}</h2>
            <button 
              onClick={onClose}
              className="text-white/60 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
```

### 玻璃态输入框

```typescript
interface GlassInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export function GlassInput({
  label,
  error,
  icon,
  className = '',
  ...props
}: GlassInputProps) {
  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-white/80">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40">
            {icon}
          </span>
        )}
        <input
          className={`glass-input w-full px-4 py-3 rounded-xl text-white ${
            icon ? 'pl-10' : ''
          } ${error ? 'border-red-500/50' : ''} ${className}`}
          {...props}
        />
      </div>
      {error && (
        <p className="text-sm text-red-400">{error}</p>
      )}
    </div>
  );
}
```

## iOS 26 Liquid Glass 效果

### 高级光效组件

```typescript
// 带动态光晕的玻璃容器
export function LiquidGlassContainer({ 
  children, 
  intensity = 1 
}: { 
  children: React.ReactNode;
  intensity?: number;
}) {
  return (
    <div className="relative overflow-hidden rounded-3xl">
      {/* 基础玻璃 */}
      <div className="glass bg-white/5 backdrop-blur-2xl">
        {children}
      </div>
      
      {/* 动态光晕层 */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(
            circle at 30% 20%,
            rgba(255, 255, 255, ${0.15 * intensity}),
            transparent 50%
          )`,
        }}
      />
      
      {/* 顶部高光 */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
    </div>
  );
}
```

## 生成工作流

1. **分析需求**：确定组件类型、功能和交互需求
2. **选择模板**：从上述模板中选择最接近的
3. **自定义样式**：根据 app.css 中的设计 Token 调整颜色和尺寸
4. **添加动画**：使用 Tailwind 的 transition 类添加过渡效果
5. **响应式适配**：确保在移动端、平板和桌面端都正常显示

## 注意事项

- 玻璃态效果在深色背景下更明显
- 不要在玻璃态元素上再堆叠玻璃态元素
- 保持动画流畅自然，避免过于花哨
- 确保文本在玻璃背景上有足够的对比度
