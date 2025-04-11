/**
 * MongoDB相关文件清理脚本
 * 运行方式: node scripts/cleanupMongoDB.js
 */

const fs = require('fs');
const path = require('path');

console.log('开始清理MongoDB相关文件...');

// 需要删除的文件列表（相对于项目根目录）
const filesToDelete = [
  'createAdmin.js',
  'unlockAdmin.js',
  'resetAdminPassword.js',
  'inspectVocabStore.js',
  'insertSampleModules.js',
  'importVocabulary.js',
  'cleanAndImportVocabulary.js',
  'checkModules.js',
  'addDuplicateModules.js',
  'activateAllModules.js',
  'fixModuleNames.js',
  'models/vocabularyModel.js',
  'models/Vocabulary.js'
];

// 需要移动到备份目录的文件（相对于项目根目录）
const filesToBackup = [
  'createAdmin.js',
  'unlockAdmin.js',
  'resetAdminPassword.js',
  'inspectVocabStore.js',
  'insertSampleModules.js',
  'importVocabulary.js',
  'cleanAndImportVocabulary.js',
  'checkModules.js',
  'addDuplicateModules.js',
  'activateAllModules.js',
  'fixModuleNames.js'
];

// 创建备份目录
const backupDir = path.join(__dirname, '../backup-mongodb');
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
  console.log(`创建备份目录: ${backupDir}`);
}

// 备份需要保留历史记录的文件
for (const file of filesToBackup) {
  const sourcePath = path.join(__dirname, '..', file);
  const destPath = path.join(backupDir, path.basename(file));
  
  if (fs.existsSync(sourcePath)) {
    try {
      fs.copyFileSync(sourcePath, destPath);
      console.log(`已备份: ${file}`);
    } catch (err) {
      console.error(`备份失败: ${file}`, err);
    }
  }
}

// 删除不需要的文件
let deletedCount = 0;
for (const file of filesToDelete) {
  const filePath = path.join(__dirname, '..', file);
  
  if (fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
      console.log(`已删除: ${file}`);
      deletedCount++;
    } catch (err) {
      console.error(`删除失败: ${file}`, err);
    }
  } else {
    console.log(`文件不存在: ${file}`);
  }
}

// 删除不需要的目录
const dirsToDelete = ['models-mongo'];
for (const dir of dirsToDelete) {
  const dirPath = path.join(__dirname, '..', dir);
  
  if (fs.existsSync(dirPath)) {
    try {
      // 递归删除目录
      fs.rmSync(dirPath, { recursive: true, force: true });
      console.log(`已删除目录: ${dir}`);
    } catch (err) {
      console.error(`删除目录失败: ${dir}`, err);
    }
  } else {
    console.log(`目录不存在: ${dir}`);
  }
}

// 更新package.json，如果需要移除mongoose
try {
  const packageJsonPath = path.join(__dirname, '..', 'package.json');
  const packageJson = require(packageJsonPath);
  
  // 如果存在mongoose依赖，则移除
  if (packageJson.dependencies && packageJson.dependencies.mongoose) {
    delete packageJson.dependencies.mongoose;
    console.log('从package.json中移除mongoose依赖');
    
    // 写回package.json
    fs.writeFileSync(
      packageJsonPath,
      JSON.stringify(packageJson, null, 2)
    );
    console.log('已更新package.json');
  } else {
    console.log('package.json中已经没有mongoose依赖');
  }
} catch (err) {
  console.error('更新package.json失败:', err);
}

console.log(`清理完成! 已删除 ${deletedCount} 个MongoDB相关文件。`);
console.log(`原始文件已备份到: ${backupDir}`);
console.log('\n提示: 如果您需要恢复文件，可以从备份目录复制。');
console.log('如果确认迁移成功，您可以手动删除备份目录。'); 