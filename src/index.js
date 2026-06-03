/**
 * @author Ginga
 * @updated 2026-06-03 16:20:23
 * @version 1.0.2
 */

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
  xml = formatXmlString(xml)

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

/**
 * 提取 XML 中的纯文本内容
 * @param {string} xmlStr - XML 字符串
 * @returns {string} 纯文本内容
 */
function extractText(xmlStr) {
  if (!xmlStr) return '';

  return xmlStr
    // 去掉 CDATA
    .replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1')
    // 去掉所有标签
    .replace(/<[^>]+>/g, '')
    // 处理常见 HTML/XML 实体
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    // 去掉多余空白
    .replace(/\s+/g, ' ')
    .trim();
}

function formatXmlString(str) {
  let xmlString = str
  if (!xmlString || typeof xmlString !== 'string') {
    console.warn('XML string is invalid');
    return '';
  }
  if (xmlString.includes('<?xml version="1.0" encoding="UTF-8"?>')) {
    xmlString = xmlString.replaceAll('<?xml version="1.0" encoding="UTF-8"?>', '')
  }
  return xmlString
}

/**
 * 将 XML 字符串转换为 HTML 字符串
 * 所有 XML 标签都转换为指定的 HTML 标签（仅限 'span', 'div', 'p'），保留所有属性并添加 xml-name 属性
 *
 * @param {string} xmlString - 要转换的 XML 字符串
 * @param {string} [targetTag='span'] - 转换后的 HTML 标签，仅限 'span' | 'div' | 'p'，默认是 'span'
 * @returns {string} 转换后的 HTML 字符串，如果转换失败则返回空字符串
 */
function xmlToHtml(xmlString, targetTag = 'span') {
  try {
    // 1. 基础校验
    xmlString = formatXmlString(xmlString);
    if (!xmlString) {
      return ""
    }

    const trimmedXml = xmlString.trim();
    if (!trimmedXml) return "";

    // 校验目标标签，仅限 'span' | 'div' | 'p'，默认是 'span'
    const allowedTags = ['span', 'div', 'p'];
    const tag = allowedTags.includes(targetTag) ? targetTag : 'span';

    // 2. 节点构造器
    function createNode(tagName, type = "element") {
      return {
        tagName,
        type, // 'element' or 'text'
        attributes: {},
        children: [],
      };
    }

    // 3. 属性解析
    function parseAttributes(attrString) {
      const attrs = {};
      if (!attrString) return attrs;
      const attrRegex = /([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g;
      let match;
      while ((match = attrRegex.exec(attrString)) !== null) {
        attrs[match[1]] = match[2] || match[3] || "";
      }
      return attrs;
    }

    // 4. XML 转树
    function parseXmlToTree(xml) {
      const root = createNode("root");
      let current = root;
      const stack = [root];

      const tagRegex = /<!--[\s\S]*?-->|<(\/?)([\w:-]+)([^>]*?)(\/?)>|([^<]+)/g;
      let match;
      while ((match = tagRegex.exec(xml)) !== null) {
        const [fullMatch, isClose, tagName, attrStr, isSelfClose, textContent] = match;

        if (fullMatch.startsWith("<!--")) continue;

        // 文本节点
        if (textContent) {
          const text = textContent;
          if (text.trim()) {
            current.children.push({ type: "text", content: text });
          }
          continue;
        }

        // 结束标签
        if (isClose) {
          if (stack.length > 1) {
            stack.pop();
            current = stack[stack.length - 1];
          }
        }
        // 开始标签或自闭合标签
        else if (tagName) {
          const newNode = createNode(tagName);
          newNode.attributes = parseAttributes(attrStr);

          current.children.push(newNode);

          // 判断自闭合
          const selfClosed = isSelfClose === "/" || /\/\s*$/.test(attrStr);
          if (!selfClosed) {
            stack.push(newNode);
            current = newNode;
          }
        }
      }

      return root.children[0];
    }

    // 5. 树转 HTML
    function convertTreeToHtml(node) {
      if (!node) return "";

      if (node.type === "text") return node.content || "";

      if (node.type === "element") {
        let attributesStr = `xml-name="${node.tagName}"`;
        for (const key in node.attributes) {
          if (Object.prototype.hasOwnProperty.call(node.attributes, key)) {
            attributesStr += ` ${key}="${node.attributes[key]}"`;
          }
        }

        const childrenHtml = node.children
          .map(convertTreeToHtml)
          .join("");

        return `<${tag} ${attributesStr}>${childrenHtml}</${tag}>`;
      }

      return "";
    }

    // 执行转换
    const xmlTree = parseXmlToTree(trimmedXml);
    if (!xmlTree) {
      console.warn("The valid XML structure was not parsed out");
      return "";
    }

    return convertTreeToHtml(xmlTree);
  } catch (error) {
    console.error("An error occurred in the parsing", error);
    return "";
  }
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

  /**
   * 提取 XML 中的纯文本内容
   * @param {string} xmlStr - XML 字符串
   * @returns {string} 纯文本内容
   */
  extractText(xmlStr) {
    return extractText(xmlStr);
  }

  /**
   * 将 XML 字符串转换为 HTML 字符串
   * 所有 XML 标签都转换为指定的 HTML 标签（仅限 'span', 'div', 'p'），保留所有属性并添加 xml-name 属性
   *
   * @param {string} xmlString - 要转换的 XML 字符串
   * @param {string} [targetTag='span'] - 转换后的 HTML 标签，仅限 'span' | 'div' | 'p'，默认是 'span'
   * @returns {string} 转换后的 HTML 字符串，如果转换失败则返回空字符串
   */
  xmlToHtml(xmlString, targetTag = 'span') {
    return xmlToHtml(xmlString, targetTag);
  }
}

// 创建默认共享实例，用于静态方法调用
const defaultInstance = new XmlProcessor();

// 绑定静态方法
XmlProcessor.parse = (xml) => parse(xml);
XmlProcessor.format = (node) => format(node);
XmlProcessor.extractText = (xmlStr) => extractText(xmlStr);
XmlProcessor.xmlToHtml = (xmlString, targetTag) => xmlToHtml(xmlString, targetTag);

export default XmlProcessor;
