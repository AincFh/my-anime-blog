import { motion } from "framer-motion";
import { useNavigate } from "react-router";
import { useState } from "react";

/**
 * 世界线跳跃随机传送 (Random Jump)
 * 功能：随机跳转到旧文章，Glitch转场效果
 */
interface RandomJumpProps {
  articles: Array<{ slug: string; title: string }>;
}

export function RandomJump({ articles }: RandomJumpProps) {
  const navigate = useNavigate();
  const [isJumping, setIsJumping] = useState(false);

  const handleJump = () => {
    if (articles.length === 0) return;

    setIsJumping(true);

    // Glitch效果
    const body = document.body;
    body.style.filter = "hue-rotate(180deg)";
    body.style.animation = "glitch 0.5s";

    setTimeout(() => {
      // 随机选择一篇文章
      const randomArticle = articles[Math.floor(Math.random() * articles.length)];
      navigate(`/articles/${randomArticle.slug}`);
      
      // 恢复
      body.style.filter = "";
      body.style.animation = "";
      setIsJumping(false);
    }, 500);
  };

  return (
    <motion.button
      onClick={handleJump}
      disabled={isJumping || articles.length === 0}
      className="fixed bottom-8 right-8 z-40 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full font-bold shadow-xl hover:shadow-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      animate={isJumping ? { rotate: 360 } : {}}
      transition={{ duration: 0.5 }}
    >
      <span className="flex items-center gap-2">
        <span>🎲</span>
        <span>跳跃至未知世界线</span>
      </span>
    </motion.button>
  );
}

