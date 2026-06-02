/**
 * 一个简单的问候函数
 * @param {string} name - 名字
 * @returns {string} 问候语
 */
export function greet(name = '世界') {
  return `你好，${name}！欢迎使用我的第一个 NPM 包 🎉`;
}

/**
 * 加法函数（测试用）
 */
export function add(a, b) {
  return a + b;
}

export default {
  greet,
  add
};