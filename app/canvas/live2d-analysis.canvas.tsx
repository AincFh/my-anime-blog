import {
  Card,
  CardBody,
  CardHeader,
  Divider,
  Grid,
  H1,
  H2,
  H3,
  Pill,
  Stack,
  Stat,
  Table,
  Text,
  useHostTheme,
} from 'cursor/canvas';

type ModelStatus = 'matched' | 'partial' | 'unmatched' | 'missing';

interface Live2DModel {
  key: string;
  nameCn: string;
  archetype: string;
  style: string;
  directory: string;
  status: ModelStatus;
  gender: 'female' | 'male' | 'neutral';
}

const MODELS: Live2DModel[] = [
  { key: 'shizuku', nameCn: '静', archetype: '文静优雅, 文学少女', style: '文学系', directory: 'shizuku', status: 'matched', gender: 'female' },
  { key: 'chitose', nameCn: '千岁', archetype: '高贵典雅, 富家千金', style: '贵族系', directory: 'chitose', status: 'matched', gender: 'female' },
  { key: 'haru01', nameCn: '春', archetype: '活泼可爱, 元气少女', style: '元气系', directory: 'haru01', status: 'matched', gender: 'female' },
  { key: 'haruto', nameCn: '春人', archetype: '热血阳光, 阳光少年', style: '热血系', directory: 'haruto', status: 'unmatched', gender: 'male' },
  { key: 'hibiki', nameCn: '响', archetype: '温柔治愈, 音乐少女', style: '治愈系', directory: 'hibiki', status: 'matched', gender: 'female' },
  { key: 'hijiki', nameCn: '羊栖菜', archetype: '傲娇可爱, 猫娘', style: '傲娇系', directory: 'hijiki', status: 'partial', gender: 'female' },
  { key: 'koharu', nameCn: '小春', archetype: '天真烂漫, 小萝莉', style: '萝莉系', directory: 'koharu', status: 'partial', gender: 'female' },
  { key: 'miku', nameCn: '初音', archetype: '未来科技, 虚拟偶像', style: '科技系', directory: 'miku', status: 'matched', gender: 'female' },
  { key: 'ni-j', nameCn: '妮', archetype: '神秘双面, 双子上', style: '神秘系', directory: 'ni-j', status: 'matched', gender: 'neutral' },
  { key: 'nico', nameCn: 'nico', archetype: '元气满满, 偶像少女', style: '偶像系', directory: 'nico', status: 'matched', gender: 'female' },
  { key: 'nietzsche', nameCn: '尼采', archetype: '深沉智慧, 哲学家', style: '哲学系', directory: 'nietzsche', status: 'unmatched', gender: 'male' },
  { key: 'ipsilon', nameCn: '尼普西隆', archetype: '神秘诡异, 暗黑萝莉', style: '暗黑系', directory: 'ipsilon', status: 'partial', gender: 'female' },
  { key: 'nito', nameCn: '仁人', archetype: '内敛沉稳, 文静少年', style: '沉稳系', directory: 'nito', status: 'unmatched', gender: 'male' },
  { key: 'tsumiki', nameCn: '堆', archetype: '知性温婉, 眼镜娘', style: '知性系', directory: 'tsumiki', status: 'matched', gender: 'female' },
  { key: 'unitychan', nameCn: 'unity', archetype: '萌系搞怪, 虚拟主播', style: 'VTuber系', directory: 'unitychan', status: 'matched', gender: 'female' },
];

const MISSING_MODELS = [
  { key: 'z16', archetype: '机械冷静, 人造人', reason: 'PERS ONALITY_MAP 中定义但 public/live2d/ 目录无模型文件' },
  { key: 'tororo', archetype: '治愈动物', reason: 'PERS ONALITY_MAP 中定义但 public/live2d/ 目录无模型文件' },
  { key: 'wanko', archetype: '柴犬娘', reason: 'PERS ONALITY_MAP 中定义但 public/live2d/ 目录无模型文件' },
];

const KEY_MISMATCHES = [
  { personalityKey: 'nipsilon', configKey: 'ipsilon', issue: 'PERS ONALITY_MAP 使用 "nipsilon"，但 config 映射到 "ipsilon" 目录' },
  { key: 'ni_j', modelKey: 'ni-j', issue: 'PERSONALITY_MAP 使用 "ni_j"，但 LIVE2D_MODELS 使用 "ni-j"' },
];

export default function Live2DAnalysis() {
  const theme = useHostTheme();
  
  const matchedCount = MODELS.filter(m => m.status === 'matched').length;
  const partialCount = MODELS.filter(m => m.status === 'partial').length;
  const unmatchedCount = MODELS.filter(m => m.status === 'unmatched').length;

  const getStatusColor = (status: ModelStatus): 'success' | 'warning' | 'danger' | 'neutral' => {
    switch (status) {
      case 'matched': return 'success';
      case 'partial': return 'warning';
      case 'unmatched': return 'danger';
      case 'missing': return 'neutral';
    }
  };

  const getStatusLabel = (status: ModelStatus): string => {
    switch (status) {
      case 'matched': return '匹配';
      case 'partial': return '部分匹配';
      case 'unmatched': return '不匹配';
      case 'missing': return '缺失';
    }
  };

  return (
    <Stack gap={24} padding={24}>
      <Stack gap={8}>
        <H1>Live2D 模型分析</H1>
        <Text tone="secondary">
          动漫博客 Live2D 模型库综合分析 | 共 {MODELS.length} 个模型
        </Text>
      </Stack>

      <Grid columns={4} gap={16}>
        <Stat value={MODELS.length.toString()} label="模型总数" tone="success" />
        <Stat value={matchedCount.toString()} label="完美匹配" tone="success" />
        <Stat value={partialCount.toString()} label="部分匹配" tone="warning" />
        <Stat value={unmatchedCount.toString()} label="不匹配" tone="danger" />
      </Grid>

      <Divider />

      <H2>模型网格视图</H2>
      <Grid columns={3} gap={12}>
        {MODELS.map((model) => (
          <Card key={model.key} size="compact">
            <CardHeader 
              trailing={
                <Pill tone={getStatusColor(model.status)} size="small">
                  {getStatusLabel(model.status)}
                </Pill>
              }
            >
              <Stack gap={2}>
                <Text weight="semibold">{model.nameCn}</Text>
                <Text size="small" tone="secondary">{model.directory}</Text>
              </Stack>
            </CardHeader>
            <CardBody>
              <Stack gap={6}>
                <Stack direction="row" gap={4} align="center">
                  <Text size="small" tone="secondary">原型:</Text>
                  <Text size="small">{model.archetype}</Text>
                </Stack>
                <Stack direction="row" gap={4} align="center">
                  <Text size="small" tone="secondary">风格:</Text>
                  <Text size="small">{model.style}</Text>
                </Stack>
                <Stack direction="row" gap={4} align="center">
                  <Text size="small" tone="secondary">性别:</Text>
                  <Pill size="small" tone={model.gender === 'female' ? 'success' : model.gender === 'male' ? 'warning' : 'neutral'}>
                    {model.gender === 'female' ? '女' : model.gender === 'male' ? '男' : '中性'}
                  </Pill>
                </Stack>
              </Stack>
            </CardBody>
          </Card>
        ))}
      </Grid>

      <Divider />

      <H2>不匹配原因分析</H2>
      <Stack gap={12}>
        <Text>
          以下模型与站点主题（动漫博客、萌系风格）存在冲突：
        </Text>
        <Table
          headers={['模型', '风格', '冲突原因']}
          rows={[
            ['haruto (春人)', '热血系 / 男性', '热血少年风格与萌系博客定位不符'],
            ['nietzsche (尼采)', '哲学系 / 男性', '深沉哲学家形象偏离可爱动漫主题'],
            ['nito (仁人)', '沉稳系 / 男性', '内敛少年与站点元气少女风格不搭'],
            ['hijiki (羊栖菜)', '傲娇系 / 猫娘', '猫娘角色略显边缘，部分用户可能不适'],
            ['koharu (小春)', '萝莉系', '萝莉风格存在内容合规风险'],
            ['ipsilon (尼普西隆)', '暗黑系', '暗黑萝莉形象与阳光博客氛围冲突'],
          ]}
          rowTone={['danger', 'danger', 'danger', 'warning', 'warning', 'warning']}
        />
      </Stack>

      <Divider />

      <H2>问题修复清单</H2>
      <Stack gap={16}>
        <Card>
          <CardHeader>
            <Text weight="semibold">缺失模型文件</Text>
          </CardHeader>
          <CardBody>
            <Table
              headers={['模型键名', '角色描述', '解决方案']}
              rows={MISSING_MODELS.map(m => [
                m.key,
                m.archetype,
                '从 PERSONALITY_MAP 中移除或添加模型文件',
              ])}
              rowTone={['neutral', undefined, 'success']}
            />
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <Text weight="semibold">键名不匹配</Text>
          </CardHeader>
          <CardBody>
            <Table
              headers={['位置', '键名', '问题描述']}
              rows={[
                ['PERSONALITY_MAP', 'nipsilon', '应改为与 config 一致的键名或移除'],
                ['config/index.ts', 'ipsilon', '目录名为 ipsilon，与模型文件一致'],
                ['PERSONALITY_MAP', 'ni_j', '应改为 ni-j 与 LIVE2D_MODELS 保持一致'],
                ['LIVE2D_MODELS', 'ni-j', '模型文件名使用连字符格式'],
              ]}
              rowTone={['warning', 'warning', 'danger']}
            />
          </CardBody>
        </Card>
      </Stack>

      <Divider />

      <H2>建议</H2>
      <Stack gap={8}>
        <Text>
          1. <Text weight="semibold">优先级修复：</Text>统一 ni_j / ni-j 键名，避免运行时错误
        </Text>
        <Text>
          2. <Text weight="semibold">内容安全：</Text>评估 koharu (萝莉) 和 ipsilon (暗黑) 是否符合站点内容政策
        </Text>
        <Text>
          3. <Text weight="semibold">模型扩展：</Text>考虑添加更多女性向萌系模型替代不匹配的热血/哲学系模型
        </Text>
        <Text>
          4. <Text weight="semibold">清理：</Text>移除 z16、tororo、wanko 等无模型文件的占位符
        </Text>
      </Stack>
    </Stack>
  );
}
