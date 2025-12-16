import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

/**
 * 战利品/收藏柜 (The Artifact Case)
 * 功能：Bento Grid、翻转动画、呼吸光效
 */
interface Artifact {
  id: string;
  name: string;
  image: string;
  rarity: "N" | "R" | "SR" | "SSR";
  obtainedDate: string;
  description: string;
}

interface ArtifactCaseProps {
  artifacts: Artifact[];
}

export function ArtifactCase({ artifacts }: ArtifactCaseProps) {
  const [selectedArtifact, setSelectedArtifact] = useState<Artifact | null>(null);
  const [flippedCards, setFlippedCards] = useState<Set<string>>(new Set());

  const handleCardClick = (artifact: Artifact) => {
    if (flippedCards.has(artifact.id)) {
      // 如果已翻转，显示详情
      setSelectedArtifact(artifact);
      // 播放音效（可选）
      // new Audio('/sounds/card-flip.mp3').play();
    } else {
      // 翻转卡片
      setFlippedCards(new Set([...flippedCards, artifact.id]));
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case "SSR":
        return "from-yellow-400 via-orange-500 to-red-500";
      case "SR":
        return "from-purple-400 to-pink-500";
      case "R":
        return "from-blue-400 to-cyan-500";
      default:
        return "from-gray-400 to-gray-500";
    }
  };

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {artifacts.map((artifact) => {
          const isFlipped = flippedCards.has(artifact.id);
          const isSSR = artifact.rarity === "SSR";

          return (
            <motion.div
              key={artifact.id}
              className="relative h-48 cursor-pointer"
              onClick={() => handleCardClick(artifact)}
              whileHover={{ scale: 1.05, zIndex: 10 }}
              whileTap={{ scale: 0.95 }}
            >
              {/* 卡片容器 */}
              <motion.div
                className="relative w-full h-full"
                style={{ transformStyle: "preserve-3d" }}
                animate={{
                  rotateY: isFlipped ? 180 : 0,
                }}
                transition={{ duration: 0.6 }}
              >
                {/* 正面 */}
                <div className="absolute inset-0 backface-hidden">
                  <div className={`relative w-full h-full rounded-xl bg-gradient-to-br ${getRarityColor(artifact.rarity)} p-4 shadow-lg overflow-hidden`}>
                    {/* 呼吸光效（SSR） */}
                    {isSSR && (
                      <motion.div
                        className="absolute inset-0 rounded-xl border-2 border-yellow-400"
                        animate={{
                          boxShadow: [
                            "0 0 20px rgba(251, 191, 36, 0.5)",
                            "0 0 40px rgba(251, 191, 36, 0.8)",
                            "0 0 20px rgba(251, 191, 36, 0.5)",
                          ],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                      />
                    )}

                    {/* 图片 */}
                    <div className="relative z-10 w-full h-32 mb-2 rounded-lg overflow-hidden">
                      <img
                        src={artifact.image}
                        alt={artifact.name}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* 名称和稀有度 */}
                    <div className="relative z-10">
                      <h3 className="text-white font-bold text-sm mb-1 line-clamp-1">
                        {artifact.name}
                      </h3>
                      <span className={`px-2 py-0.5 bg-white/20 backdrop-blur-sm rounded text-xs font-bold text-white`}>
                        {artifact.rarity}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 背面 */}
                <div
                  className="absolute inset-0 backface-hidden"
                  style={{ transform: "rotateY(180deg)" }}
                >
                  <div className="w-full h-full rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 p-4 shadow-lg">
                    <div className="text-white text-xs space-y-2">
                      <div>
                        <div className="text-white/60 mb-1">获取日期</div>
                        <div>{artifact.obtainedDate}</div>
                      </div>
                      <div>
                        <div className="text-white/60 mb-1">稀有度</div>
                        <div className={`inline-block px-2 py-0.5 bg-gradient-to-r ${getRarityColor(artifact.rarity)} rounded text-xs font-bold`}>
                          {artifact.rarity}
                        </div>
                      </div>
                      <div>
                        <div className="text-white/60 mb-1">描述</div>
                        <div className="text-white/80 text-xs line-clamp-3">
                          {artifact.description}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          );
        })}
      </div>

      {/* 详情模态框 */}
      <AnimatePresence>
        {selectedArtifact && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedArtifact(null)}
            />
            <motion.div
              className="fixed inset-0 z-[201] flex items-center justify-center p-4"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative max-w-2xl w-full">
                {/* 背景大图 */}
                <div
                  className="absolute inset-0 bg-cover bg-center rounded-3xl opacity-20 blur-2xl"
                  style={{ backgroundImage: `url('${selectedArtifact.image}')` }}
                />
                
                {/* 卡片内容 */}
                <div className="relative bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-xl rounded-3xl p-8 border border-white/20">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <img
                        src={selectedArtifact.image}
                        alt={selectedArtifact.name}
                        className="w-full rounded-xl shadow-2xl"
                      />
                    </div>
                    <div className="text-white">
                      <h2 className="text-3xl font-bold mb-4">{selectedArtifact.name}</h2>
                      <div className="space-y-3">
                        <div>
                          <div className="text-white/60 text-sm mb-1">稀有度</div>
                          <span className={`inline-block px-3 py-1 bg-gradient-to-r ${getRarityColor(selectedArtifact.rarity)} rounded-lg font-bold`}>
                            {selectedArtifact.rarity}
                          </span>
                        </div>
                        <div>
                          <div className="text-white/60 text-sm mb-1">获取日期</div>
                          <div>{selectedArtifact.obtainedDate}</div>
                        </div>
                        <div>
                          <div className="text-white/60 text-sm mb-1">描述</div>
                          <div className="text-white/80">{selectedArtifact.description}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => setSelectedArtifact(null)}
                    className="absolute top-4 right-4 w-10 h-10 bg-white/10 backdrop-blur-sm rounded-full text-white flex items-center justify-center hover:bg-white/20 transition-colors"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

