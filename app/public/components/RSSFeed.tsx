import { motion } from "framer-motion";
import { Link } from "react-router";
import { Newspaper, BookOpen, Library, Radio, Atom } from "lucide-react";

/**
 * RSS订阅源 (The Feed)
 * 功能：订阅卡片，提供RSS链接和常见阅读器直达按钮
 */
export function RSSFeed() {
  const rssUrl = "/rss.xml";
  const atomUrl = "/atom.xml";

  const getBaseUrl = () => {
    if (typeof window !== "undefined") {
      return window.location.origin;
    }
    return "https://aincfh.dpdns.org"; // 默认域名
  };

  const baseUrl = getBaseUrl();
  const readers = [
    { name: "Feedly", url: `https://feedly.com/i/subscription/feed/${encodeURIComponent(baseUrl + rssUrl)}`, icon: <Newspaper className="w-4 h-4" /> },
    { name: "Inoreader", url: `https://www.inoreader.com/?add_feed=${encodeURIComponent(baseUrl + rssUrl)}`, icon: <BookOpen className="w-4 h-4" /> },
    { name: "The Old Reader", url: `https://theoldreader.com/feeds/subscribe?url=${encodeURIComponent(baseUrl + rssUrl)}`, icon: <Library className="w-4 h-4" /> },
  ];

  return (
    <motion.div
      className="bg-gradient-to-br from-sky-500/20 to-purple-500/20 backdrop-blur-xl rounded-2xl p-6 border border-white/20"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
    >
      <h3 className="text-white font-bold text-xl mb-4 flex items-center gap-2">
        <Radio className="w-5 h-5" />
        <span>建立神经连接 (Subscribe)</span>
      </h3>

      <div className="space-y-4">
        {/* RSS链接 */}
        <div className="flex items-center gap-4">
          <a
            href={rssUrl}
            className="px-4 py-2 bg-white/10 backdrop-blur-sm rounded-lg text-white hover:bg-white/20 transition-colors flex items-center gap-2"
          >
            <Radio className="w-4 h-4" />
            <span>RSS Feed</span>
          </a>
          <a
            href={atomUrl}
            className="px-4 py-2 bg-white/10 backdrop-blur-sm rounded-lg text-white hover:bg-white/20 transition-colors flex items-center gap-2"
          >
            <Atom className="w-4 h-4" />
            <span>Atom Feed</span>
          </a>
        </div>

        {/* 阅读器直达 */}
        <div>
          <div className="text-white/60 text-sm mb-2">快速订阅到：</div>
          <div className="flex flex-wrap gap-2">
            {readers.map((reader) => (
              <a
                key={reader.name}
                href={reader.url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-lg text-white hover:bg-white/20 transition-colors text-sm flex items-center gap-1"
              >
                <span>{reader.icon}</span>
                <span>{reader.name}</span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

