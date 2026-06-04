/**
 * @author Ginga
 * @updated 2026-06-04 15:57:32
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

export function injectBase64Font(fontData, fontFamily = 'ztFont') {
  return new Promise((resolve, reject) => {
    // 微信小程序环境
    if (typeof wx !== 'undefined' && typeof wx.loadFontFace === 'function') {
      wx.loadFontFace({
        global: true,
        family: fontFamily,
        source: `data:font/truetype;charset=utf-8;base64,${fontData}`,
        success: () => resolve(),
        fail: (res) => {
          console.error('字体加载失败：', res);
          reject(res);
        },
      });
    }
    // 浏览器环境
    else if (typeof document !== 'undefined') {
      try {
        if (typeof FontFace !== 'undefined' && document.fonts) {
          const fontFace = new FontFace(fontFamily, `url(data:font/truetype;charset=utf-8;base64,${fontData})`);
          fontFace.load().then((loadedFace) => {
            document.fonts.add(loadedFace);
            resolve();
          }).catch((err) => {
            console.error('字体加载失败：', err);
            reject(err);
          });
        } else {
          const style = document.createElement('style');
          style.textContent = `
            @font-face {
              font-family: '${fontFamily}';
              src: url(data:font/truetype;charset=utf-8;base64,${fontData}) format('truetype');
            }
          `;
          document.head.appendChild(style);
          resolve();
        }
      } catch (err) {
        console.error('字体加载失败：', err);
        reject(err);
      }
    } else {
      const err = new Error('当前环境不支持加载字体');
      console.error(err.message);
      reject(err);
    }
  });
}

function getPrimaryColor() {
  return '#3b82f6';
}

function formatSenseJson(node) {
  function countSense(node) {
    let count = 0;

    function walk(n) {
      if (!n) return;
      if (n.type === "element") {
        if (n.attributes && n.attributes["xml-name"] === "sense") {
          count++;
        }
        n.children && n.children.forEach(walk);
      }
    }

    walk(node);
    return count;
  }

  if (!node) return node;

  // 先统计 sense 数量
  const senseCount = countSense(node);

  // 只有一个 sense，直接返回原结构，不做任何处理
  if (senseCount <= 1) {
    return node;
  }

  // 样式模板
  const getGrayBox = (num) => ({
    type: "element",
    name: "mark",
    attributes: {
      style: `
        display: inline-block;
        width: 1.4em;
        height: 1.3em;
        color: #BEBEBE;
        font-size: 0.9em;
        line-height: 1.2em;
        text-align: center;
        border: 2px solid #BEBEBE;
        border-radius: 2px;
        background: inherit;
        margin-right: .3em;
        vertical-align: middle;
        font-weight: bolder;
      `,
      class: "default-font"
    },
    children: [{ type: "text", text: String(num) }]
  });

  const getBlackCircle = (num) => ({
    type: "element",
    name: "span",
    attributes: {
      style: `
        display: inline-block;
        width: 1em;
        height: 1em;
        color: #fff;
        font-size: 1em;
        line-height: 1em;
        text-align: center;
        background-color: #222;
        border-radius: 50%;
        margin-right: 2px;
      `
    },
    children: [{ type: "text", text: String(num) }]
  });

  // 递归处理
  function traverse(node) {
    if (node.type === "element") {
      // 处理 sensenum
      if (node.attributes && node.attributes["xml-name"] === "sensenum") {
        const numbers = [];
        node.children.forEach(child => {
          if (child.type === "text") {
            const nums = child.text.match(/\d+/g);
            if (nums) numbers.push(...nums);
          }
        });
        if (numbers.length) {
          node.children = numbers.map(n => getBlackCircle(n));
        }
      }

      // 处理 sense
      if (node.attributes && node.attributes["xml-name"] === "sense") {
        if (node.attributes.id) {
          const grayBox = getGrayBox(node.attributes.id);
          // 插入灰框到 children 前面
          node.children.unshift(grayBox);
          node.name = "div"; // 将 sense 标签改为 div
          node.attributes.style = `line-height: 2;`;
        }
      }

      // 递归处理子节点
      node.children.forEach(traverse);
    }
  }

  traverse(node);
  return node;
}

function cleanJsonNode(node) {
  if (!node) return null;

  // 文本节点直接保留
  if (node.type === "text") return node;

  // 元素节点
  if (node.type === "element") {
    // 从 attributes 中获取原始标签名
    const tag = node.attributes?.["xml-name"]?.toLowerCase() || "";

    const shouldDelete =
      tag === "pinyin" ||
      tag === "pinyinlianxie" || tag === 'headword' ||
      (["title", "sensenum"].includes(tag) && node.children.length === 0);

    if (shouldDelete) return null;

    // 递归处理子节点
    if (node.children && node.children.length > 0) {
      const newChildren = [];
      for (const child of node.children) {
        const cleanedChild = cleanJsonNode(child);
        if (cleanedChild) newChildren.push(cleanedChild);
      }
      node.children = newChildren;
    }

    return node;
  }

  return null;
}

function addTextBefore(node) {
  if (!node) return null;

  if (node.type === "text") return node;

  if (node.type === "element") {
    // 先递归处理子节点
    if (node.children && node.children.length > 0) {
      node.children = node.children.map(child => addTextBefore(child)).filter(Boolean);

      // 合并相邻相同类型的标签
      const mergedChildren = [];
      let buffer = null; // 缓存合并 of 节点

      for (const child of node.children) {
        const tag = child.attributes?.["xml-name"]?.toLowerCase() || "";
        if ((tag === "tradition" || tag === "variantion") && child.children && child.children.length > 0) {
          if (buffer && buffer.attributes["xml-name"].toLowerCase() === tag) {
            // 相同类型，合并 children
            buffer.children.push(...child.children);
          } else {
            if (buffer) mergedChildren.push(buffer);
            buffer = JSON.parse(JSON.stringify(child)); // 深拷贝
          }
        } else {
          if (buffer) {
            mergedChildren.push(buffer);
            buffer = null;
          }
          mergedChildren.push(child);
        }
      }
      if (buffer) mergedChildren.push(buffer);

      node.children = mergedChildren;

      // 给每个 <tradition> 或 <variantion> 添加描述文字和样式
      node.children = node.children.map(child => {
        const tag = child.attributes?.["xml-name"]?.toLowerCase() || "";
        if ((tag === "tradition" || tag === "variantion") && child.children && child.children.length > 0) {
          // 合并文本为逗号分隔字符串
          const textContent = child.children
            .filter(c => c.type === "text")
            .map(c => c.text)
            .join("，");

          // 保留非文本节点
          const otherChildren = child.children.filter(c => c.type !== "text");

          // 设置描述文字
          const textNode = {
            type: "text",
            text: tag === "tradition" ? `繁体：${textContent}` : `异体：${textContent}`
          };
          const empNode = {
            type: "element",
            name: "span",
            attributes: { style: "display: inline-block; width: 1em;" },
            children: []
          };

          child.attributes.style = "line-height: 3;";
          child.children = [textNode, ...otherChildren, empNode];
        }
        return child;
      });
    }

    return node;
  }

  return null;
}

function changeLink(node) {
  if (!node) return null;
  // 文本节点直接返回
  if (node.type === "text") return node;
  // 元素节点
  if (node.type === "element") {
    // 先递归处理子节点
    if (node.children && node.children.length > 0) {
      node.children = node.children.map(child => changeLink(child)).filter(Boolean);
    }
    // 只处理 <consultword>
    const tag = node.attributes?.["xml-name"]?.toLowerCase() || "";
    if (tag === "consultword") {
      node.attributes.style = `
        color: ${getPrimaryColor()};
        cursor: pointer;
      `;
      node.attributes['data-href'] = '干'
    }
    return node;
  }

  return null;
}

function changeSupLineHeight(node) {
  if (!node) return null;
  // 文本节点直接返回
  if (node.type === "text") return node;
  // 元素节点
  if (node.type === "element") {
    // 先递归处理子节点
    if (node.children && node.children.length > 0) {
      node.children = node.children.map(child => changeSupLineHeight(child)).filter(Boolean);
    }
    // 只处理 <sup>
    const tag = node.attributes?.["xml-name"]?.toLowerCase() || "";
    if (tag === "sup") {
      const textContent = node.children.map(c => c.type === "text" ? c.text : '').join('');
      const supChars = ['㊀', '㊁', '㊂', '㊃', '㊄', '㊅', '㊆', '㊇', '㊈', '㊉'];
      if (supChars.includes(textContent)) {
        node.attributes.style = `
          line-height: 3;
        `;
      } else {
        node.name = 'sup'
      }
    }
    return node;
  }

  return null;
}

function transTagToTag(node, tag1, tag2) {
  if (!node) return null;
  // 文本节点直接返回
  if (node.type === "text") return node;
  // 元素节点
  if (node.type === "element") {
    // 先递归处理子节点
    if (node.children && node.children.length > 0) {
      node.children = node.children.map(child => transTagToTag(child, tag1, tag2)).filter(Boolean);
    }
    // 只处理 tag1
    const tag = node.attributes?.["xml-name"]?.toLowerCase() || "";
    if (tag === tag1) {
      node.name = tag2
    }
    return node;
  }
  return null;
}

function handleSupBack(node) {
  return handleSupScope(node, {
    scopeName: "supback",
    targetTag: "sub",
    targetStyleKey: "margin-left",
    targetStyleValue: "-1em !important"
  });
}

function handleSupFront(node) {
  return handleSupScope(node, {
    scopeName: "supfront",
    targetTag: "sup",
    targetStyleKey: "margin-right",
    targetStyleValue: "-1em !important"
  });
}

function handleSupScope(node, options, inScope = false) {
  if (!node) return null;

  // 文本节点直接返回
  if (node.type === "text") return node;

  if (node.type === "element") {
    const xmlName = node.attributes?.["xml-name"]?.toLowerCase() || "";
    const tagName = node.name?.toLowerCase() || "";

    const {
      scopeName,        // supback / supfront
      targetTag,        // sub / sup
      targetStyleKey,   // margin-left / margin-right
      targetStyleValue  // -1em !important
    } = options;

    // 是否进入作用域
    const currentInScope = inScope || xmlName === scopeName;

    // 1️⃣ 处理作用域节点本身
    if (xmlName === scopeName) {
      node.attributes = node.attributes || {};
      const oldStyle = node.attributes.style || "";
      if (!oldStyle.includes("overflow")) {
        node.attributes.style =
          `${oldStyle};overflow: visible;min-width: 1em;`.replace(/^;/, "");
      }
    }

    // 2️⃣ 仅在作用域内处理目标标签
    if (currentInScope && tagName === targetTag) {
      node.attributes = node.attributes || {};
      const oldStyle = node.attributes.style || "";
      if (!oldStyle.includes(targetStyleKey)) {
        node.attributes.style =
          `${oldStyle};${targetStyleKey}: ${targetStyleValue};`.replace(/^;/, "");
      }
    }

    // 递归处理子节点
    if (node.children && node.children.length > 0) {
      node.children = node.children
        .map(child => handleSupScope(child, options, currentInScope))
        .filter(Boolean);
    }

    return node;
  }

  return null;
}

function handleConsultWord(node) {
  if (!node) return null;
  // 文本节点直接返回
  if (node.type === "text") return node;
  // 元素节点
  if (node.type === "element") {
    // 先递归处理子节点
    if (node.children && node.children.length > 0) {
      node.children = node.children.map(child => handleConsultWord(child)).filter(Boolean);
    }
    // 只处理 tag1
    const tag = node.attributes?.["xml-name"]?.toLowerCase() || "";
    if (tag === "consultword") {
      node.children = node.children.filter(item => item.type === "text");
    }
    return node;
  }
  return null;
}

function handleForeign(node) {
  if (!node) return null;
  // 文本节点直接返回
  if (node.type === "text") return node;
  // 元素节点
  if (node.type === "element") {
    // 先递归处理子节点
    if (node.children && node.children.length > 0) {
      node.children = node.children.map(child => handleForeign(child)).filter(Boolean);
    }
    // 只处理 tag1
    const tag = node.attributes?.["xml-name"]?.toLowerCase() || "";
    if (tag === "foreign") {
      node.attributes.style = "font-family: Times, jmFont, ztFont;";
    }
    return node;
  }
  return null;
}

function addShadowToTag(node) {
  if (!node) return null;
  // 文本节点直接返回
  if (node.type === "text") return node;
  // 元素节点
  if (node.type === "element") {
    // 先递归处理子节点
    if (node.children && node.children.length > 0) {
      node.children = node.children.map(child => addShadowToTag(child)).filter(Boolean);
    }
    // 只处理 tag1
    const tag = node.attributes?.["xml-name"]?.toLowerCase() || "";
    if (tag === "b") {
      node.attributes.style = "text-shadow: 0.01em 0 0 currentcolor, -0.01em 0 0 currentcolor, 0 0.01em 0 currentcolor, 0 -0.01em 0 currentcolor;";
    }
    return node;
  }
  return null;
}

function handleImage(node) {
  if (!node) return null;
  // 文本节点直接返回
  if (node.type === "text") return node;
  // 元素节点
  if (node.type === "element") {
    // 先递归处理子节点
    if (node.children && node.children.length > 0) {
      node.children = node.children.map(child => handleImage(child)).filter(Boolean);
    }
    // 只处理 image
    const tag = node.attributes?.["xml-name"]?.toLowerCase() || "";
    if (tag === 'image') {
      if (node.attributes?.gswImage) {
        node.attributes.style = `width: 100%;`;
      } else if (node.attributes?.scale) {
        node.attributes.style = `height: ${node.attributes.scale}em;`;
      }
      node.name = 'img'
    }
    return node;
  }
  return null;
}



function execPY(node, res) {
  if (!node) return null;
  // 文本节点直接返回
  if (node.type === "text") return node;
  // 元素节点
  if (node.type === "element") {
    // 先递归处理子节点
    if (node.children && node.children.length > 0) {
      node.children = node.children.map(child => execPY(child, res)).filter(Boolean);
    }
    // 只处理 pinyin 和 pinyinlianxie
    const tag = node.name?.toLowerCase() || "";
    if (tag === 'pinyin' || tag === 'pinyinlianxie') {
      if (node.children && node.children.length > 0 && node.children[0].type === "text") {
        res.push({
          tag: tag,
          value: node.children[0].text
        })
      }
    }
    return node;
  }
  return null;
}



/**
 * Format XML 字符串转换成的 HTML 字符串
 * @param {string} xml - XML 字符串
 * @returns {string} 格式化后的 XML/HTML 字符串
 */
export function chFormatXmlHtml(xml) {
  let xmlJson = parse(xml);
  // 处理sensenum与sense义项编号并换行
  xmlJson = formatSenseJson(xmlJson);
  // 删除拼音相关标签
  xmlJson = cleanJsonNode(xmlJson);
  // sensenum标签有但是全部是自闭合，所以暂时不做处理
  // 将繁体和异体前边加文字描述
  xmlJson = addTextBefore(xmlJson);
  // 将consultword标签改为蓝色字体（其实是链接，如果改代码要重构）
  xmlJson = changeLink(xmlJson);
  // 处理如果sup标签体内容为 '㊀', '㊁', '㊂', '㊃', '㊄', '㊅', '㊆', '㊇', '㊈', '㊉' 则设置行高为3 否则 将标签体span为xml-name="sup"专为sup标签
  xmlJson = changeSupLineHeight(xmlJson);
  // 将xml-name="unerline"标签改为u标签
  xmlJson = transTagToTag(xmlJson, 'underline', 'u');
  // xml-name="sub"专为sub标签
  xmlJson = transTagToTag(xmlJson, 'sub', 'sub');
  xmlJson = transTagToTag(xmlJson, 'citation', 'div');
  xmlJson = transTagToTag(xmlJson, 'example', 'div');
  // 处理xml-name="supfront"添加style样式为overflow: visible;其里边如果包含sup，则sup的style样式设置为 margin-right: -1em !important;
  xmlJson = handleSupFront(xmlJson);
  // 处理xml-name="supback"添加style样式为overflow: visible;其里边如果包含sub，则sub的style样式设置为 margin-left: -1em !important;
  xmlJson = handleSupBack(xmlJson);
  // 处理 xml-name="consultword"的标签，只提取文本
  xmlJson = handleConsultWord(xmlJson);
  // 处理 xml-name="foreign"标签，添加样式 style="font-family: Times, jmFont, ztFont;"
  xmlJson = handleForeign(xmlJson);
  // 处理 xml-name="italic"标签改为i标签
  xmlJson = transTagToTag(xmlJson, 'italic', 'i');
  // 由于字体没有加粗样式，所以将 xml-name="b"标签加上shoadow模拟加粗
  xmlJson = addShadowToTag(xmlJson);
  // 处理 xml-name 为 image 的标签
  xmlJson = handleImage(xmlJson);
  // 将xmlJson转换成xml
  xml = format(xmlJson);
  return xml;
}



/**
 * 从 XML 中提取拼音数组
 * @param {string} xml - XML 字符串
 * @returns {Array} 拼音数组
 */
export function execPyArrFromXml(xml) {
  let xmlJson = parse(xml);
  let pyArr = [];
  execPY(xmlJson, pyArr);
  return pyArr;
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

  /**
   * 加载 base64 格式的字体
   * @param {string} fontData - base64 编码的字体数据
   * @param {string} [fontFamily='ztFont'] - 字体家族名称
   * @returns {Promise<void>}
   */
  injectBase64Font(fontData, fontFamily = 'ztFont') {
    return injectBase64Font(fontData, fontFamily);
  }

  /**
   * Format XML 字符串转换成的 HTML 字符串
   * @param {string} xml - XML 字符串
   * @returns {string} 格式化后的 XML/HTML 字符串
   */
  chFormatXmlHtml(xml) {
    return chFormatXmlHtml(xml);
  }

  /**
   * 从 XML 中提取拼音数组
   * @param {string} xml - XML 字符串
   * @returns {Array} 拼音数组
   */
  execPyArrFromXml(xml) {
    return execPyArrFromXml(xml);
  }
}

// 创建默认共享实例，用于静态方法调用
const defaultInstance = new XmlProcessor();

// 绑定静态方法
XmlProcessor.parse = (xml) => parse(xml);
XmlProcessor.format = (node) => format(node);
XmlProcessor.extractText = (xmlStr) => extractText(xmlStr);
XmlProcessor.xmlToHtml = (xmlString, targetTag) => xmlToHtml(xmlString, targetTag);
XmlProcessor.injectBase64Font = (fontData, fontFamily) => injectBase64Font(fontData, fontFamily);
XmlProcessor.chFormatXmlHtml = (xml) => chFormatXmlHtml(xml);
XmlProcessor.execPyArrFromXml = (xml) => execPyArrFromXml(xml);

export default XmlProcessor;
