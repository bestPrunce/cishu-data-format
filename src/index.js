/**
 * XML 内容转义
 * @param {string} str - 待转义的 XML 文本内容
 * @returns {string} 转义后的文本
 */
function escapeXml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * 属性值转义
 * @param {string} str - 待转义的属性值
 * @returns {string} 转义后的属性值
 */
function escapeAttr(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;');
}

/**
 * 解析 XML 属性字符串
 * @param {string} str - 属性字符串
 * @returns {Object} 属性对象
 */
function parseAttributes(str) {
  const attrs = {};
  const attrRegex = /(\w[\w:-]*)\s*=\s*"([^"]*)"/g;
  let m;
  while ((m = attrRegex.exec(str))) {
    attrs[m[1]] = m[2];
  }
  return attrs;
}

/**
 * 将 XML 字符串转换为 JSON 对象结构
 * @param {string} xml - XML 字符串
 * @returns {Object|Array} 解析后的 JSON 节点或节点数组
 */
function parse(xml) {
  if (typeof xml !== 'string') {
    throw new TypeError('XML input must be a string');
  }

  xml = xml.trim();
  const tagRegex = /<([^>]+)>/g;
  let lastIndex = 0;

  const root = { name: null, attributes: {}, children: [], text: '' };
  const stack = [root];

  let match;
  while ((match = tagRegex.exec(xml))) {
    const textBetween = xml.substring(lastIndex, match.index);
    lastIndex = tagRegex.lastIndex;

    if (textBetween.trim()) {
      const node = stack[stack.length - 1];
      node.children.push({
        type: 'text',
        text: textBetween.trim()
      });
    }

    const tag = match[1].trim();

    // 忽略 XML 声明、注释、CDATA等
    if (tag.startsWith('?') || tag.startsWith('!--') || tag.startsWith('!DOCTYPE')) {
      continue;
    }

    // 处理结束标签 </xxx>
    if (tag.startsWith('/')) {
      stack.pop();
      continue;
    }

    // 判断是否为自闭合标签 <xxx />
    const selfClosing = tag.endsWith('/');

    // 提取标签名
    const parts = tag.replace(/\/$/, '').split(/\s+/);
    const tagName = parts[0];

    const attrs = parseAttributes(tag);

    const newNode = {
      type: 'element',
      name: tagName,
      attributes: attrs,
      children: []
    };

    const parent = stack[stack.length - 1];
    parent.children.push(newNode);

    if (!selfClosing) {
      stack.push(newNode);
    }
  }

  return root.children.length === 1 ? root.children[0] : root.children;
}

/**
 * 将 JSON 对象结构转换为 XML 字符串
 * @param {Object|Array} node - 符合结构的 JSON 节点或数组
 * @returns {string} XML 字符串
 */
function format(node) {
  if (!node) return '';

  if (Array.isArray(node)) {
    return node.map(n => format(n)).join('');
  }

  // 文本节点
  if (node.type === 'text') {
    return escapeXml(node.text || '');
  }

  // 处理属性
  const attrs = Object.entries(node.attributes || {})
    .map(([key, value]) => `${key}="${escapeAttr(value)}"`)
    .join(' ');

  const hasAttrs = attrs.length > 0;
  const openTag = hasAttrs ? `<${node.name} ${attrs}>` : `<${node.name}>`;

  // 子节点
  const children = (node.children || [])
    .map(child => format(child))
    .join('');

  // 如果没有 children 且没有文本 → 可能写成自闭合
  if (!children) {
    return hasAttrs ? `<${node.name} ${attrs}/>` : `<${node.name}/>`;
  }

  return `${openTag}${children}</${node.name}>`;
}

export class XmlProcessor {
  /**
   * 将 XML 字符串转换为 JSON 对象结构
   * @param {string} xml - XML 字符串
   * @returns {Object|Array} 解析后的 JSON 节点或节点数组
   */
  parse(xml) {
    return parse(xml);
  }

  /**
   * 将 JSON 对象结构转换为 XML 字符串
   * @param {Object|Array} node - 符合结构的 JSON 节点或数组
   * @returns {string} XML 字符串
   */
  format(node) {
    return format(node);
  }
}

// 创建默认共享实例，用于静态方法调用
const defaultInstance = new XmlProcessor();

// 绑定静态方法
XmlProcessor.parse = (xml) => parse(xml);
XmlProcessor.format = (node) => format(node);

export default XmlProcessor;
