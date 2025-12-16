import { useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";

/**
 * 验证码输入组件
 * 功能：6个独立方框，输入一个自动跳到下一个
 */
interface VerificationCodeInputProps {
  length?: number;
  onComplete: (code: string) => void;
  disabled?: boolean;
}

export function VerificationCodeInput({ length = 6, onComplete, disabled = false }: VerificationCodeInputProps) {
  const [codes, setCodes] = useState<string[]>(Array(length).fill(""));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (index: number, value: string) => {
    if (disabled) return;
    
    // 只允许数字
    if (value && !/^\d$/.test(value)) return;

    const newCodes = [...codes];
    newCodes[index] = value;
    setCodes(newCodes);

    // 自动跳到下一个输入框
    if (value && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // 检查是否全部输入完成
    if (newCodes.every((code) => code !== "") && newCodes.join("").length === length) {
      onComplete(newCodes.join(""));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !codes[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").slice(0, length);
    const newCodes = Array(length).fill("");
    pastedData.split("").forEach((char, index) => {
      if (/^\d$/.test(char) && index < length) {
        newCodes[index] = char;
      }
    });
    setCodes(newCodes);
    
    // 聚焦到最后一个已输入的框
    const lastIndex = Math.min(pastedData.length - 1, length - 1);
    inputRefs.current[lastIndex]?.focus();
    
    // 如果全部输入完成，触发回调
    if (newCodes.every((code) => code !== "") && newCodes.join("").length === length) {
      onComplete(newCodes.join(""));
    }
  };

  return (
    <div className="flex gap-2 justify-center" onPaste={handlePaste}>
      {codes.map((code, index) => (
        <motion.input
          key={index}
          ref={(el) => {
            inputRefs.current[index] = el;
          }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={code}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          disabled={disabled}
          className="w-12 h-12 text-center text-xl font-bold bg-white/10 backdrop-blur-sm border-2 border-white/20 rounded-lg text-white focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-400/50 transition-all disabled:opacity-50"
          whileFocus={{ scale: 1.05 }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
        />
      ))}
    </div>
  );
}

