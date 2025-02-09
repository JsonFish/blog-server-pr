enum Category {
  BACKEND = 'backend',
  FRONTEND = 'frontend',
  ANDROID = 'android',
  IOS = 'ios',
  AI = 'ai',
  DEVTOOLS = 'devtools',
  READING = 'reading',
  UNSPECIFIED = '',
}

// 验证是否所有类别都是合法的
export const isCategoryListValid = (categoryList: string): boolean => {
  // 将输入字符串拆分为数组
  const categories = categoryList.split(',').map((cat) => cat.trim());

  // 检查每个类别是否在 Category 枚举的值中
  return categories.every((cat) => Object.values(Category).includes(cat as Category));
};
