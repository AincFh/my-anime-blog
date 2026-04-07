import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { isMobileDevice } from "~/utils/performance";
import {
  UI_CONSTANTS,
  LIVE2D_MODELS,
  getLive2dModelLayout,
  getModelDir,
} from "~/config";

// ============================================================================
// 看板娘人格系统定义
// ============================================================================

interface Personality {
  gender: "male" | "female" | "neutral";
  archetype: string;
  style: string;
  pronouns: { subject: string; possessive: string };
  honorifics: string[];
  speechPatterns: {
    prefix: string[];
    suffix: string[];
    emphasis: string[];
  };
}

// 18种看板娘人格配置
const PERSONALITY_MAP: Record<string, Personality> = {
  // 女性角色
  shizuku: {
    gender: "female", archetype: "文学少女", style: "文静优雅",
    pronouns: { subject: "我", possessive: "我的" },
    honorifics: ["主人", "Master", "亲爱的"],
    speechPatterns: {
      prefix: ["嗯~", "那个...", "说起来~", "悄悄说~", "话说~", "轻轻地~", "柔柔地~"],
      suffix: ["呢~", "哦~", "的说~", "呀~", "呐~", "呢的说~", "哟~"],
      emphasis: ["呀", "呐", "喵", "哦", "呢"],
    },
  },
  chitose: {
    gender: "female", archetype: "富家千金", style: "高贵典雅",
    pronouns: { subject: "我", possessive: "本小姐的" },
    honorifics: ["你", "亲爱的", "小可爱"],
    speechPatterns: {
      prefix: ["哼~", "哼哼~", "哎呀~", "呐呐~", "诶嘿嘿~", "嘻嘻~", "哎呀呀~"],
      suffix: ["呀~", "呢~", "哦~", "哒~", "嘛~", "哟~", "呐~"],
      emphasis: ["呢", "呀", "呐", "哦", "哒"],
    },
  },
  haru01: {
    gender: "female", archetype: "元气少女", style: "活泼可爱",
    pronouns: { subject: "我", possessive: "我的" },
    honorifics: ["你", "小伙伴", "朋友"],
    speechPatterns: {
      prefix: ["嗨嗨~", "耶~", "嗯嗯~", "冲鸭~", "呦呦~", "嘿嘿~", "哇哇~"],
      suffix: ["啦~", "呦~", "咯~", "呀~", "呐~", "哟~", "哈~"],
      emphasis: ["耶", "嘿", "哇", "呀", "哈"],
    },
  },
  hibiki: {
    gender: "female", archetype: "音乐少女", style: "温柔治愈",
    pronouns: { subject: "我", possessive: "我的" },
    honorifics: ["你", "亲爱的", "宝贝"],
    speechPatterns: {
      prefix: ["♪~", "嗯~", "那个~", "轻轻地~", "温柔地~", "暖暖地~", "静静地~"],
      suffix: ["呢~", "哦~", "呀~", "呐~", "的说~", "哟~", "呢~"],
      emphasis: ["呀", "呢", "喵", "哦", "呐"],
    },
  },
  hijiki: {
    gender: "female", archetype: "猫娘", style: "傲娇可爱",
    pronouns: { subject: "吾", possessive: "咱的" },
    honorifics: ["铲屎官", "主人", "你"],
    speechPatterns: {
      prefix: ["喵~", "唔...", "哼！", "喵呜~", "才不是~", "呜喵~", "讨厌~"],
      suffix: ["喵~", "的说喵", "呢~", "呦~", "啦喵~", "哟~", "呐喵~"],
      emphasis: ["喵", "呦", "呜", "哼", "诶"],
    },
  },
  koharu: {
    gender: "female", archetype: "小萝莉", style: "天真烂漫",
    pronouns: { subject: "我", possessive: "我的" },
    honorifics: ["大哥哥", "大姐姐", "你"],
    speechPatterns: {
      prefix: ["那个...", "嘿嘿~", "嗯~", "天真地~", "好奇地~", "呆呆地~", "眨眨眼~"],
      suffix: ["哦~", "呢~", "呀~", "嘛~", "呐~", "哟~", "呀~"],
      emphasis: ["呀", "哦", "诶", "哇", "呐"],
    },
  },
  miku: {
    gender: "female", archetype: "虚拟偶像", style: "未来科技",
    pronouns: { subject: "我", possessive: "Miku的" },
    honorifics: ["你", "Everyone", "小伙伴"],
    speechPatterns: {
      prefix: ["♪~", "哈喽~", "Miku在这里~", "Hey~", "Yo~", "嗯哼~", "Ready~"],
      suffix: ["呦~", "呢~", "哦~", "啦~", "呐~", "哟~", "哈~"],
      emphasis: ["嗨", "耶", "哈", "Yo", "嗯"],
    },
  },
  nico: {
    gender: "female", archetype: "偶像少女", style: "元气满满",
    pronouns: { subject: "我", possessive: "妮可的" },
    honorifics: ["你", "粉丝", "大家"],
    speechPatterns: {
      prefix: ["Nico Nico~", "呐呐~", "诶嘿~", "冲啊~", "加油~", "耶嘿~", "哒哒~"],
      suffix: ["呦~", "啦~", "呢~", "呀~", "哒~", "哟~", "呐~"],
      emphasis: ["哒", "呦", "嘿", "耶", "哈"],
    },
  },
  nipsilon: {
    gender: "female", archetype: "暗黑萝莉", style: "神秘诡异",
    pronouns: { subject: "我", possessive: "本尊的" },
    honorifics: ["凡人", "你", "小家伙"],
    speechPatterns: {
      prefix: ["呵~", "嗯...", "汝可知~", "有趣呢~", "吾感知~", "神秘地~", "幽幽地~"],
      suffix: ["呢~", "哦~", "呀~", "呐~", "的说~", "哟~", "呢~"],
      emphasis: ["呐", "呀", "呦", "哦", "呢"],
    },
  },
  tsumiki: {
    gender: "female", archetype: "眼镜娘", style: "知性温婉",
    pronouns: { subject: "我", possessive: "我的" },
    honorifics: ["你", "同学", "朋友"],
    speechPatterns: {
      prefix: ["嗯~", "那个~", "话说~", "认真地~", "分析中~", "思考中~", "静静地~"],
      suffix: ["呢~", "哦~", "的说~", "呀~", "呐~", "哟~", "呢~"],
      emphasis: ["呀", "呐", "哦", "呢", "嗯"],
    },
  },
  unitychan: {
    gender: "female", archetype: "虚拟主播", style: "萌系搞怪",
    pronouns: { subject: "我", possessive: "我的" },
    honorifics: ["你", "观众老爷", "小伙伴"],
    speechPatterns: {
      prefix: ["哇~", "诶诶~", "呦呦~", "嘿嘿~", "冲冲~", "耶耶~", "哇哇~"],
      suffix: ["啦~", "呦~", "咯~", "呀~", "呐~", "哟~", "哈~"],
      emphasis: ["耶", "哇", "嘿", "呀", "哈"],
    },
  },
  tororo: {
    gender: "female", archetype: "治愈动物", style: "呆萌温暖",
    pronouns: { subject: "咱", possessive: "咱的" },
    honorifics: ["你", "主人", "朋友"],
    speechPatterns: {
      prefix: ["嘛~", "嗯...", "那个~", "呆呆地~", "暖暖地~", "软软地~", "困困地~"],
      suffix: ["呦~", "呢~", "啦~", "呀~", "呐~", "哟~", "呢~"],
      emphasis: ["嘛", "呐", "哦", "呀", "呢"],
    },
  },
  wanko: {
    gender: "female", archetype: "柴犬娘", style: "忠诚热情",
    pronouns: { subject: "汪", possessive: "汪汪的" },
    honorifics: ["主人", "铲屎的", "你"],
    speechPatterns: {
      prefix: ["汪汪~", "嘿嘿~", "嗯~", "兴奋地~", "热情地~", "摇尾巴~", "汪~"],
      suffix: ["呦~", "啦~", "汪~", "呀~", "呐~", "哟~", "哈~"],
      emphasis: ["汪", "耶", "嘿", "哇", "呀"],
    },
  },
  // 男性角色
  haruto: {
    gender: "male", archetype: "阳光少年", style: "热血阳光",
    pronouns: { subject: "我", possessive: "我的" },
    honorifics: ["你", "兄弟", "伙伴"],
    speechPatterns: {
      prefix: ["哟~", "嘿~", "哈~", "冲啊~", "加油~", "耶~", "哇~"],
      suffix: ["啊~", "呦~", "啦~", "呀~", "呐~", "哟~", "哈~"],
      emphasis: ["耶", "哈", "嘿", "哇", "冲"],
    },
  },
  nito: {
    gender: "male", archetype: "文静少年", style: "内敛沉稳",
    pronouns: { subject: "我", possessive: "我的" },
    honorifics: ["你", "同学", "朋友"],
    speechPatterns: {
      prefix: ["嗯~", "那个...", "话说~", "静静地~", "淡淡地~", "轻轻地~", "缓缓地~"],
      suffix: ["呢~", "哦~", "的说~", "呀~", "呐~", "哟~", "呢~"],
      emphasis: ["呀", "呐", "嗯", "哦", "呢"],
    },
  },
  ni_j: {
    gender: "neutral", archetype: "双子上", style: "神秘双面",
    pronouns: { subject: "我们", possessive: "我们的" },
    honorifics: ["你", "人类", "朋友"],
    speechPatterns: {
      prefix: ["嘻嘻~", "呐呐~", "嗯~", "神秘地~", "双重地~", "变幻地~", "镜像地~"],
      suffix: ["呢~", "哦~", "呀~", "呐~", "的说~", "哟~", "呢~"],
      emphasis: ["呐", "呦", "嘿", "呀", "哦"],
    },
  },
  z16: {
    gender: "male", archetype: "人造人", style: "机械冷静",
    pronouns: { subject: "我", possessive: "本机的" },
    honorifics: ["用户", "你", "主人"],
    speechPatterns: {
      prefix: ["检测到...", "分析完毕~", "嗯~", "系统提示~", "数据反馈~", "计算中~", "处理中~"],
      suffix: ["呢~", "哦~", "的判断~", "呀~", "呐~", "哟~", "呢~"],
      emphasis: ["呢", "哦", "呐", "呀", "嗯"],
    },
  },
  nietzsche: {
    gender: "male", archetype: "哲学家", style: "深沉智慧",
    pronouns: { subject: "我", possessive: "吾之" },
    honorifics: ["你", "旅人", "求知者"],
    speechPatterns: {
      prefix: ["嗯...", "汝可知~", "哲学家说~", "深思~", "感悟~", "哲理~", "思辨~"],
      suffix: ["呢~", "呀~", "呐~", "哦~", "的说~", "哟~", "呢~"],
      emphasis: ["呀", "呐", "哦", "嗯", "呢"],
    },
  },
};

// ============================================================================
// 巨量关怀词库（随机组合系统）
// ============================================================================

// 关怀场景词库
const CARE_SCENES = {
  // 睡眠休息
  sleep: [
    "该休息了", "早点睡吧", "不要熬夜", "夜深了该睡了",
    "被窝在等你", "睡个好觉", "做个好梦", "休息是大事",
    "身体需要休息", "睡眠质量很重要", "别太晚", "月亮都困了",
    "再不睡要秃头", "星星都睡了", "熬夜伤身", "早睡早起身体好",
  ],
  // 努力奋斗
  effort: [
    "加油呀", "继续努力", "你一定可以", "辛苦了",
    "不要太勉强", "劳逸结合", "适度休息效率更高", "努力的你最闪耀",
    "坚持就是胜利", "成功在向你招手", "不要放弃", "你行的",
    "相信你自己", "努力不会白费", "再坚持一下", "你是最棒的",
  ],
  // 身心健康
  health: [
    "要注意身体", "健康最重要", "不要太累", "适时放松",
    "身体发出的信号要重视", "喝水了吗", "站起来动动", "眼睛休息了吗",
    "别太拼命", "身体是本钱", "别逞强", "要爱惜自己",
    "健康第一", "别太辛苦了", "注意休息", "身体需要充电",
  ],
  // 情绪关怀
  mood: [
    "今天心情怎么样", "有什么烦恼吗", "开心最重要",
    "笑一笑吧", "世界很美好", "乌云会散去", "雨后有彩虹",
    "一切都会好起来", "保持好心情", "你笑起来真好看",
    "烦恼都会过去", "阳光总在风雨后", "笑一笑十年少",
    "心情不好可以告诉我", "我陪你", "要开心哦",
  ],
  // 学习工作
  work: [
    "工作顺利吗", "学习怎么样", "不要太有压力",
    "累了就休息", "效率很重要", "合理安排时间", "慢慢来不用急",
    "你已经做得很好了", "相信自己", "压力太大要说哦",
    "工作学习加油", "注意劳逸结合", "适度休息", "别太累了",
    "今天的任务完成了吗", "加油，你行的",
  ],
  // 温馨日常
  daily: [
    "今天也要开心", "新的一天要元气", "记得微笑", "你很棒",
    "世界因你而美好", "今天天气怎么样", "吃了吗", "想我了吗",
    "在做什么呢", "你还好吗", "今天怎么样", "有好好照顾自己吗",
    "要开心哦", "今天的你也很棒", "记得喝水", "要好好吃饭",
  ],
  // 凌晨深夜
  lateNight: [
    "夜猫子吗", "这么晚还不睡", "熬夜对身体不好",
    "Master是夜猫子", "再不睡要秃头", "星星都困了",
    "月亮陪着你", "夜里也要照顾自己", "这么晚还在",
    "月亮都睡了", "星星在打瞌睡", "再不睡明天起不来",
    "夜里更要爱惜身体", "熬夜冠军要休息了", "月亮叫你睡觉",
  ],
  // 美食餐饮
  food: [
    "记得吃饭", "饿了吗", "美食在等你",
    "吃饱才有力气", "别饿着肚子", "好好犒劳自己",
    "午餐吃了吗", "晚餐想吃什么", "要好好吃饭哦",
    "美食不可辜负", "吃饱不想家", "民以食为天",
  ],
  // 运动休闲
  exercise: [
    "运动一下吧", "出去走走", "呼吸新鲜空气",
    "久坐不好", "起来活动", "阳光等着你",
    "散散步吧", "运动让人快乐", "动起来更健康",
    "晒晒太阳", "伸个懒腰", "起来动一动",
  ],
};

// 情感强化词
const INTENSIFIERS = [
  "真的", "真的真的", "超级", "非常", "特别", "格外",
  "简直", "的确", "务必", "一定", "千万", "绝对",
];

// 关怀对象称呼
const CARE_TARGETS = {
  female: ["你呀", "亲爱的", "宝贝", "小可爱", "主人", "Master", "小伙伴", "你"],
  male: ["你呀", "兄弟", "伙伴", "朋友", "亲爱的", "你"],
  neutral: ["你呀", "朋友", "旅人", "小伙伴", "亲爱的", "你"],
};

// 性格专属关怀（直接使用，不组合）
const PERSONALITY_DIRECT: Record<string, string[]> = {
  // 傲娇类
  tsundere: [
    "才不是担心你呢！只是随口说说！",
    "哼！不理你了...才、才怪啦！",
    "快去休息！这是命令！才不是因为关心你呢！",
    "谁、谁让你这么晚还不睡的！生气！...好吧没生气啦~",
    "哼~别以为我会关心你！...才、才有一丢丢担心啦！",
    "快去睡觉！...这是命令！才不是因为心疼你呢！",
  ],
  // 猫娘类
  catgirl: [
    "喵~主人还不睡的话，咱也要生气喵~",
    "喵呜~被窝里很暖和的说喵~",
    "要不要摸摸头~？才、才不是想被摸呢喵！",
    "喵~铲屎官要乖乖睡觉喵~",
    "咱的尾巴在打瞌睡喵~主人也该睡了呢~",
    "喵~再不睡，咱的胡须都要打结了喵！",
    "主人~被窝已经暖好啦~快进来喵~",
  ],
  // 萝莉类
  loli: [
    "大哥哥/大姐姐~不要勉强自己嘛~",
    "嘿嘿~乖~乖~快去休息吧~",
    "一起睡觉觉好不好呀~？",
    "困困了吗~？抱抱~",
    "嘿嘿~小熊维尼都说要早睡早起呢~",
    "乖~乖~不睡觉会长不高哦~...啊不对，大哥哥/大姐姐已经很高了呢~",
  ],
  // 温柔类
  gentle: [
    "累了的话，就靠一靠吧~我一直在这里呢~",
    "你的努力，我都看在眼里哦~",
    "有什么烦恼的话，可以告诉我呢~",
    "没关系，慢慢来~我陪着你呀~",
    "累了吗~？休息一下吧~我一直都在~",
    "你的辛苦我都明白~要好好休息哦~",
  ],
  // 高冷类
  cool: [
    "别太累了，适可而止。",
    "...关心你一下，别误会。",
    "有我在，没什么过不去的。",
    "不要太逞强。",
    "累了就说，不用硬撑。",
    "有些事情不用一个人扛。",
  ],
  // 元气类
  energetic: [
    "耶~活力满满的一天！冲鸭~！",
    "一起嗨起来吧~！",
    "嘿嘿~今天也是元气满满的呢~！",
    "冲啊~！我们可以的~！",
    "耶耶~今天的你也很棒哦~！",
    "冲鸭~！元气满满~！GO GO~！",
  ],
  // 神秘类
  mysterious: [
    "命运指引你来到这里呢~",
    "这个时间点还在...有什么在等待着你吗？",
    "星空之下，一切都会好起来的~",
    "缘分让我们相遇呢~",
    "命运的齿轮在转动呢~",
    "星空在诉说着什么~",
  ],
  // 机械类
  machine: [
    "检测到用户疲劳状态，建议立即休息。",
    "本机提醒：保持良好的作息对身体有益。",
    "用户数据分析中...你在想什么呢？",
    "系统建议：适时休息可以提高效率。",
    "检测到能量消耗，建议补充能量。",
    "本机建议：保持心情愉快可以提高效率。",
  ],
  // 哲学类
  philosopher: [
    "凡有所得，必有所失...不要太执着哦~",
    "黑夜总会过去，黎明终将到来呢~",
    "生命的意义在于...此刻，你找到了吗？",
    "汝可知~烦恼即菩提呀~",
    "凡所有相，皆是虚妄~不要太过执着呢~",
    "汝可知~真正的强大是学会放下呀~",
  ],
};

// ============================================================================
// 工具函数
// ============================================================================

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// 生成随机关怀语（组合式）
function generateCaringPhrase(personality: Personality): string {
  // 确定性格类型
  const isCatgirl = personality.archetype === "猫娘";
  const isLoli = personality.archetype === "小萝莉";
  const isTsundere = personality.style === "傲娇可爱";
  const isGentle = personality.style === "温柔治愈" || personality.style === "知性温婉";
  const isCool = personality.style === "神秘诡异" || personality.style === "深沉智慧" || personality.style === "机械冷静";
  const isEnergetic = personality.style === "活泼可爱" || personality.style === "元气满满";
  const isMysterious = personality.archetype === "神秘双面" || personality.style === "神秘诡异";
  const isMachine = personality.archetype === "人造人";
  const isPhilosopher = personality.archetype === "哲学家";

  // 30%概率直接使用性格专属关怀
  if (Math.random() > 0.7) {
    let pool: string[] = [];
    if (isCatgirl) pool = pool.concat(PERSONALITY_DIRECT.catgirl);
    if (isLoli) pool = pool.concat(PERSONALITY_DIRECT.loli);
    if (isTsundere) pool = pool.concat(PERSONALITY_DIRECT.tsundere);
    if (isGentle) pool = pool.concat(PERSONALITY_DIRECT.gentle);
    if (isCool) pool = pool.concat(PERSONALITY_DIRECT.cool);
    if (isEnergetic) pool = pool.concat(PERSONALITY_DIRECT.energetic);
    if (isMysterious) pool = pool.concat(PERSONALITY_DIRECT.mysterious);
    if (isMachine) pool = pool.concat(PERSONALITY_DIRECT.machine);
    if (isPhilosopher) pool = pool.concat(PERSONALITY_DIRECT.philosopher);

    if (pool.length > 0) {
      let result = pickRandom(pool);
      // 50%概率添加语气
      if (Math.random() > 0.5) {
        const prefix = pickRandom(personality.speechPatterns.prefix);
        const suffix = pickRandom(personality.speechPatterns.suffix);
        result = prefix + " " + result;
        if (Math.random() > 0.5) {
          result = result + suffix;
        }
      }
      return result;
    }
  }

  // 组合式生成关怀语
  const targets = CARE_TARGETS[personality.gender] || CARE_TARGETS.neutral;
  const target = pickRandom(targets);
  const intensifier = Math.random() > 0.6 ? pickRandom(INTENSIFIERS) : "";

  // 选择关怀场景
  const sceneKeys = Object.keys(CARE_SCENES);
  const sceneKey = pickRandom(sceneKeys) as keyof typeof CARE_SCENES;
  const scenePhrases = CARE_SCENES[sceneKey];
  const scenePhrase = pickRandom(scenePhrases);

  // 组装句子
  let result = "";

  // 40%概率加强度词
  if (intensifier) {
    result = intensifier + "要" + scenePhrase + "哦~";
  } else {
    // 随机选择句式
    const patterns = [
      `${scenePhrase}呀，${target}`,
      `${target}要${scenePhrase}呢~`,
      `${scenePhrase}的${target}~`,
      `要${scenePhrase}哦，${target}`,
      `${scenePhrase}好不好呀，${target}~`,
      `话说~${target}要${scenePhrase}呢~`,
    ];
    result = pickRandom(patterns);
  }

  // 添加语气
  const prefix = personality.speechPatterns.prefix;
  const suffix = personality.speechPatterns.suffix;

  // 50%概率加前缀
  if (Math.random() > 0.5) {
    result = pickRandom(prefix) + result;
  }

  // 50%概率加后缀
  if (Math.random() > 0.5) {
    result = result + pickRandom(suffix);
  }

  return result;
}

// ============================================================================
// 组件定义
// ============================================================================

function pickRandomModel(): string {
  return LIVE2D_MODELS[Math.floor(Math.random() * LIVE2D_MODELS.length)];
}

export function Live2D() {
    const [isVisible, setIsVisible] = useState(true);
    const [isLoaded, setIsLoaded] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [dialog, setDialog] = useState<string>("");
  const [loadFailed, setLoadFailed] = useState(false);
  const [personality, setPersonality] = useState<Personality | null>(null);
  const [showChat, setShowChat] = useState(false);

  // Refs
    const scrollBottomTriggeredRef = useRef<boolean>(false);
    const greetingShownRef = useRef(false);
    const lastScrollPhraseAtRef = useRef<number>(0);
    const scriptRef = useRef<HTMLScriptElement | null>(null);
  const dockIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const dockObserverRef = useRef<MutationObserver | null>(null);
  const dockResizeRef = useRef<(() => void) | null>(null);
  const modelNameRef = useRef<string>(pickRandomModel());
  const dialogQueueRef = useRef<string[]>([]);
  const isShowingDialogRef = useRef(false);
  const usedPhrasesRef = useRef<Set<string>>(new Set());

  // 显示对话框（队列式，避免覆盖）
  const showDialog = useCallback((message: string, duration: number = 3500) => {
    if (isShowingDialogRef.current) {
      dialogQueueRef.current.push(message);
      return;
    }
    isShowingDialogRef.current = true;
    setDialog(message);
    setTimeout(() => {
      setDialog("");
      isShowingDialogRef.current = false;
      if (dialogQueueRef.current.length > 0) {
        const next = dialogQueueRef.current.shift();
        if (next) showDialog(next, duration);
      }
    }, duration);
  }, []);

  // 显示关怀语（随机生成，确保不重复）
  const showCaringPhrase = useCallback(() => {
    if (!personality) return;

    let phrase = generateCaringPhrase(personality);
    let attempts = 0;

    // 确保不重复（最多尝试10次）
    while (usedPhrasesRef.current.has(phrase) && attempts < 10) {
      phrase = generateCaringPhrase(personality);
      attempts++;
    }

    usedPhrasesRef.current.add(phrase);

    // 限制已使用短语的数量（保留最近50条）
    if (usedPhrasesRef.current.size > 50) {
      const first = usedPhrasesRef.current.values().next().value;
      if (first) usedPhrasesRef.current.delete(first);
    }

    showDialog(phrase, 4000);
  }, [personality, showDialog]);

    useEffect(() => {
        setIsMobile(isMobileDevice());
    }, []);

  // PC 端加载 Live2D
    useEffect(() => {
        if (isMobile || !isVisible || typeof document === 'undefined') return;

    const modelName = modelNameRef.current;
    const layout = getLive2dModelLayout(modelName);
    setPersonality(PERSONALITY_MAP[modelName] || PERSONALITY_MAP.shizuku);

    const timeoutId = setTimeout(() => {
      setIsLoaded(true);
      setLoadFailed(true);
    }, 10000);

        /**
         * 同步点击热区到 canvas 的真实屏幕位置。
         * 用 getBoundingClientRect 保证不受 transform/position 影响，精确覆盖模型区域。
         */
        const syncClickArea = () => {
          const canvas = document.getElementById('live2dcanvas');
          const area = document.getElementById('live2d-click-area');
          if (!(canvas instanceof HTMLElement) || !area) return;

          const rect = canvas.getBoundingClientRect();
          area.style.cssText = [
            'position:fixed',
            `left:${rect.left}px`,
            `top:${rect.top}px`,
            `width:${rect.width}px`,
            `height:${rect.height}px`,
            'pointer-events:auto',
            'cursor:pointer',
            'z-index:100003',
          ].join('!');
        };

        /**
         * 锚定 Live2D 画布到视口右下角：
         *   - position: fixed; right + bottom = 0（视觉上贴底贴右）
         *   - transform: translateY(脚底补偿)，无 scale（保持模型原始比例）
         *   - transform-origin: right bottom（以脚底为变换基准）
         */
        const dockLive2dToCorner = () => {
          const canvas = document.getElementById('live2dcanvas');
          const wrap = document.getElementById('live2d-widget');
          if (!(canvas instanceof HTMLElement)) return;

          const nudge = layout.visualBottomNudgePx;

          canvas.style.setProperty('position', 'fixed', 'important');
          canvas.style.setProperty('top', 'auto', 'important');
          canvas.style.setProperty('left', 'auto', 'important');
          canvas.style.setProperty('right', `${UI_CONSTANTS.live2d.rightInsetPx}px`, 'important');
          canvas.style.setProperty('bottom', '0', 'important');
          canvas.style.setProperty('margin', '0', 'important');
          canvas.style.setProperty('pointer-events', 'none', 'important');
          canvas.style.setProperty('transform-origin', 'right bottom', 'important');
          canvas.style.setProperty(
            'transform',
            nudge !== 0 ? `translateY(${nudge}px)` : 'none',
            'important'
          );
          if (wrap instanceof HTMLElement) {
            wrap.style.setProperty('pointer-events', 'none', 'important');
          }

          // canvas 加载后同步热区
          requestAnimationFrame(syncClickArea);
        };

        const startDockGuards = () => {
          if (dockResizeRef.current) {
            window.removeEventListener('resize', dockResizeRef.current);
          }
          const onResize = () => {
            dockLive2dToCorner();
            syncClickArea();
          };
          dockResizeRef.current = onResize;
          window.addEventListener('resize', onResize);

          if (dockIntervalRef.current) {
            clearInterval(dockIntervalRef.current);
          }
          let tick = 0;
          dockIntervalRef.current = setInterval(() => {
            dockLive2dToCorner();
            tick += 1;
            if (tick >= 50 && dockIntervalRef.current) {
              clearInterval(dockIntervalRef.current);
              dockIntervalRef.current = null;
            }
          }, 200);

          const attachObserver = () => {
            if (dockObserverRef.current) return;
            const el = document.getElementById('live2dcanvas');
            if (!el) return;
            dockObserverRef.current = new MutationObserver(() => {
              dockLive2dToCorner();
              requestAnimationFrame(syncClickArea);
            });
            dockObserverRef.current.observe(el, {
              attributes: true,
              attributeFilter: ['style', 'class'],
            });
            // 同时监听 canvas 尺寸变化（加载完成后）
            const ro = new ResizeObserver(() => syncClickArea());
            ro.observe(el);
          };
          setTimeout(attachObserver, 400);
          setTimeout(attachObserver, 2200);
        };

        const timer = setTimeout(() => {
            const script = document.createElement('script');
            script.src = UI_CONSTANTS.live2d.scriptSrc;
            script.async = true;
            scriptRef.current = script;

            script.onload = () => {
        const initDelay = setTimeout(() => {
          const modelPath = `/live2d/${getModelDir(modelName)}/${getModelDir(modelName)}.model.json`;
                const config = {
            model: { jsonPath: modelPath },
                    display: {
                        position: 'right',
                        width: layout.displayWidth,
                        height: layout.displayHeight,
                        hOffset: UI_CONSTANTS.live2d.rightInsetPx,
                        vOffset: 0,
                    },
                    mobile: { show: false },
                    react: {
                        opacityDefault: UI_CONSTANTS.live2d.opacity.default,
                        opacityOnHover: UI_CONSTANTS.live2d.opacity.hover,
                    },
                    dialog: {
              enable: false,
                    },
                };

                // @ts-ignore
                if (window.L2Dwidget) {
            try {
                    // @ts-ignore
                    window.L2Dwidget.init(config);
              
              // 禁用 Live2D 模型的鼠标事件，避免遮挡光标
              setTimeout(() => {
                const widget = document.getElementById('live2d-widget');
                if (widget) {
                  const canvas = widget.querySelector('canvas');
                  if (canvas) {
                    (canvas as HTMLElement).style.pointerEvents = 'none';
                    canvas.style.cursor = 'default';
                  }
                  widget.style.pointerEvents = 'none';
                }
                dockLive2dToCorner();
                startDockGuards();
                requestAnimationFrame(() => requestAnimationFrame(syncClickArea));
              }, 100);
              setTimeout(dockLive2dToCorner, 800);
              setTimeout(dockLive2dToCorner, 2000);
              setTimeout(() => requestAnimationFrame(syncClickArea), 1200);
              setTimeout(() => requestAnimationFrame(syncClickArea), 3000);
              
              setIsLoaded(true);
            } catch {
              setIsLoaded(true);
              setLoadFailed(true);
            }
          } else {
            setIsLoaded(true);
            setLoadFailed(true);
          }

          // 进页时自动问候（仅首次，1.5s后出现一次）
          if (!greetingShownRef.current) {
            greetingShownRef.current = true;
            setTimeout(() => {
              showCaringPhrase();
            }, 1500);
          }
        }, 500);

        return () => clearTimeout(initDelay);
      };

      script.onerror = () => {
        setIsLoaded(true);
        setLoadFailed(true);
            };

            document.body.appendChild(script);
        }, 2000);

        return () => {
            clearTimeout(timer);
      clearTimeout(timeoutId);
          if (dockIntervalRef.current) {
            clearInterval(dockIntervalRef.current);
            dockIntervalRef.current = null;
          }
          if (dockObserverRef.current) {
            dockObserverRef.current.disconnect();
            dockObserverRef.current = null;
          }
          if (dockResizeRef.current) {
            window.removeEventListener('resize', dockResizeRef.current);
            dockResizeRef.current = null;
          }
            const widget = document.getElementById('live2d-widget');
            if (widget) widget.remove();
            if (scriptRef.current?.parentNode) {
                scriptRef.current.parentNode.removeChild(scriptRef.current);
            }
        };
  }, [isMobile, isVisible, showDialog]);

  /** 自动关怀语：仅「明确交互」触发，并带冷却，避免刷屏 */
  const SCROLL_BOTTOM_PHRASE_COOLDOWN_MS = 5 * 60 * 1000;
  const INACTIVITY_PHRASE_COOLDOWN_MS = 3 * 60 * 1000;
  const RANDOM_PHRASE_COOLDOWN_MS = 2 * 60 * 1000;
  const LAST_PHRASE_AT_REF = useRef<number>(0);

  useEffect(() => {
    if (isMobile || !isLoaded || !personality) return;

    const handleScroll = () => {
      const isBottom =
        window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 60;
      if (isBottom && !scrollBottomTriggeredRef.current) {
        scrollBottomTriggeredRef.current = true;
        const now = Date.now();
        if (now - lastScrollPhraseAtRef.current >= SCROLL_BOTTOM_PHRASE_COOLDOWN_MS) {
          lastScrollPhraseAtRef.current = now;
          showCaringPhrase();
        }
      } else if (!isBottom) {
        scrollBottomTriggeredRef.current = false;
      }
    };

    const checkNightCaring = () => {
      const hour = new Date().getHours();
      if (hour >= 2 && hour < 5) {
        const now = Date.now();
        if (now - LAST_PHRASE_AT_REF.current >= INACTIVITY_PHRASE_COOLDOWN_MS) {
          LAST_PHRASE_AT_REF.current = now;
          showCaringPhrase();
        }
      }
    };

    let inactivityTimer: ReturnType<typeof setInterval> | null = null;
    let lastActivity = Date.now();

    const handleActivity = () => { lastActivity = Date.now(); };

    const checkInactivity = () => {
      const now = Date.now();
      if (now - lastActivity >= 45000 && !dialog) {
        if (now - LAST_PHRASE_AT_REF.current >= INACTIVITY_PHRASE_COOLDOWN_MS) {
          LAST_PHRASE_AT_REF.current = now;
          showCaringPhrase();
        }
      }
    };

    let randomTimer: ReturnType<typeof setInterval> | null = null;
    const startRandomPhrase = () => {
      if (randomTimer) clearInterval(randomTimer);
      let tick = 0;
      randomTimer = setInterval(() => {
        tick += 1;
        if (tick % 6 === 0) { // 约每 2 分钟检测一次（20s × 6）
          const now = Date.now();
          if (now - LAST_PHRASE_AT_REF.current >= RANDOM_PHRASE_COOLDOWN_MS && Math.random() > 0.7) {
            LAST_PHRASE_AT_REF.current = now;
            showCaringPhrase();
          }
        }
      }, 20000);
    };

    setTimeout(checkNightCaring, 5000);
    setTimeout(startRandomPhrase, 10000);

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('mousemove', handleActivity, { passive: true });
    window.addEventListener('mousedown', handleActivity, { passive: true });

    inactivityTimer = setInterval(checkInactivity, 20000);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('mousedown', handleActivity);
      if (inactivityTimer) clearInterval(inactivityTimer);
      if (randomTimer) clearInterval(randomTimer);
    };
  }, [isMobile, isLoaded, personality, dialog, showCaringPhrase]);

  // 点击看板娘触发对话
  const handleClick = () => {
    if (!dialog && personality) {
      showCaringPhrase();
    }
  };

    if (isMobile) return null;

    /**
     * 锚点策略：
     *   - 所有模型锚在视口右下角（right bottom），right = 8px，bottom = 0
     *   - 模型保持原始比例，不拉伸、不 scale
     *   - 容器宽度跟随模型实际宽度（displayWidth）
     *   - 容器高度 = displayHeight + headCenterFromBottom + bubbleMaxHeight
     *     （底部模型区 + 上方弹幕区）
     *   - 弹幕气泡小三角指向角色头顶中心（与 canvas 同款的 translateY 补偿）
     *   - 三角底边到头顶中心保持 8~12px 小间隙
     */
    const cfg = UI_CONSTANTS.live2d;
    const layout = getLive2dModelLayout(modelNameRef.current);
    const headGap = 10; // 小三角尖到头顶中心的间隙（px）
    // 画布有 translateY(visualBottomNudgePx)，头顶随之下移；气泡必须减去同一偏移，否则会指到胸口
    const headAnchorBottomPx = Math.max(
      32,
      layout.headCenterFromBottomPx - layout.visualBottomNudgePx,
    );
    const bubbleBottomPx = headAnchorBottomPx + headGap;
    // canvas 真实尺寸来自 JS 测量（fallback 到 layout 预估值）
    const containerWidth = layout.displayWidth + 40;
    // 容器总高度 = 角色画布高度 + 头顶以上区域高度（headCenterFromBottom + 弹幕高度）
    const containerHeight = layout.displayHeight + layout.headCenterFromBottomPx + layout.bubbleMaxHeight;

    return (
    <div
      className="fixed z-[100002] hidden max-w-[calc(100vw-1rem)] lg:flex lg:flex-col items-end justify-end pointer-events-none"
      style={{
        right: cfg.rightInsetPx,
        bottom: 0,
        width: containerWidth,
        height: containerHeight,
      }}
    >
      {/*
        弹幕气泡：
        - 小三角永远指向角色的头顶中心（已扣掉与 canvas 一致的 translateY 补偿）
        - 随模型高度变化，不固定位置
        - 小三角在气泡底边居中（left: 50%）
      */}
      <AnimatePresence mode="wait">
        {isVisible && dialog ? (
          <motion.div
            key={dialog.slice(0, 24)}
            initial={{ opacity: 0, scale: 0.92, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 6 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="pointer-events-none absolute max-w-[min(280px,calc(100vw-2rem))] rounded-2xl border border-white/10 bg-[#1c1c1f]/95 px-4 py-3 shadow-lg shadow-black/30 backdrop-blur-xl"
            style={{
              // 气泡底边与小三角尖之间隔 headGap，指向头顶中心（与 dockLive2dToCorner 的 nudge 对齐）
              bottom: bubbleBottomPx,
              right: 0,
              left: 0,
            }}
          >
            <p className="text-center text-[13px] font-medium leading-relaxed text-white/90">{dialog}</p>
            {/* 小三角：气泡底边居中，朝下指向头顶 */}
            <div
              className="absolute -bottom-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 border-b border-r border-white/10 bg-[#1c1c1f]/95"
              style={{ transform: 'translateX(-50%) rotate(45deg)' }}
            />
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/*
        点击热区：初始用预估值（防零尺寸），JS 加载后用 canvas 实际尺寸精确覆盖。
        cursor:pointer 让鼠标靠近时变成手型。
      */}
      {isVisible ? (
        <div
          id="live2d-click-area"
          className="cursor-pointer opacity-0"
          onClick={handleClick}
          aria-hidden
          style={{
            position: 'fixed',
            right: cfg.rightInsetPx,
            bottom: 0,
            width: layout.displayWidth,
            height: layout.displayHeight,
            pointerEvents: 'auto',
          }}
        />
      ) : null}
    </div>
    );
}
