/**
 * copy-live2d.cjs
 * 将 Live2D 模型文件复制到构建输出目录
 */
const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '..', 'public', 'live2d');
const destDir = path.join(__dirname, '..', 'build', 'client', 'live2d');

function copyDir(src, dest) {
  if (!fs.existsSync(src)) {
    console.log('[copy-live2d] 源目录不存在，跳过:', src);
    return;
  }

  fs.mkdirSync(dest, { recursive: true });

  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
      console.log('[copy-live2d] 复制:', entry.name);
    }
  }
}

console.log('[copy-live2d] 开始复制 Live2D 模型...');
copyDir(srcDir, destDir);
console.log('[copy-live2d] 完成！');
