# cishu-data-format

辞书处理 XML 与 JSON 数据格式转换的面向对象 SDK。

本工具库专为辞书（电子词典、数字化词典）XML 结构化数据处理设计，提供解析、格式化转换能力。

## 安装

```bash
npm install cishu-data-format
```

## 核心设计：XmlProcessor SDK

本库采用 **SDK 架构**。您可以使用**静态方法**直接调用；也可以通过实例化 `XmlProcessor` 进行操作。

### 1. 导入方法

```javascript
// 推荐：导入 XmlProcessor 主类
import XmlProcessor from 'cishu-data-format';

// 或者导入命名类
import { XmlProcessor } from 'cishu-data-format';
```

---

## 核心方法使用

### 1. 解析 XML (`parse`)

将 XML 字符串解析为树状 JSON 结构。

- **`XmlProcessor.parse(xmlString)`** 或 `new XmlProcessor().parse(xmlString)`

```javascript
import XmlProcessor from 'cishu-data-format';

const xml = '<entry id="100"><hw>hello</hw></entry>';

// 解析为 JSON
const json = XmlProcessor.parse(xml);
console.log(json);
/* 输出:
{
  type: "element",
  name: "entry",
  attributes: { id: "100" },
  children: [
    {
      type: "element",
      name: "hw",
      attributes: {},
      children: [{ type: "text", text: "hello" }]
    }
  ]
}
*/
```

### 2. 格式化 XML (`format`)

将 JSON 节点结构转换回 XML 字符串（自动处理属性和文本的转义）。

- **`XmlProcessor.format(jsonNode)`** 或 `new XmlProcessor().format(jsonNode)`

```javascript
import XmlProcessor from 'cishu-data-format';

const json = {
  type: "element",
  name: "entry",
  attributes: { id: "100" },
  children: [
    {
      type: "element",
      name: "hw",
      attributes: {},
      children: [{ type: "text", text: "hello" }]
    }
  ]
};

// 格式化回 XML
const xmlString = XmlProcessor.format(json);
console.log(xmlString); // <entry id="100"><hw>hello</hw></entry>
```

### 3. 提取纯文本 (`extractText`)

提取 XML 字符串中的纯文本，去除所有标签和 CDATA 标记，并转换常见的 HTML/XML 实体。

- **`XmlProcessor.extractText(xmlString)`** 或 `new XmlProcessor().extractText(xmlString)`

```javascript
import XmlProcessor from 'cishu-data-format';

const xml = '<entry id="100"><hw>hello &amp; world</hw> <![CDATA[some cdata]]></entry>';

// 提取纯文本
const text = XmlProcessor.extractText(xml);
console.log(text); // "hello & world some cdata"
```

### 4. XML 转 HTML (`xmlToHtml`)

将 XML 字符串转换为 HTML 字符串。所有 XML 标签都转换为指定的 HTML 标签（仅限 `'span'`, `'div'`, `'p'`，默认是 `'span'`），保留所有属性并添加 `xml-name` 属性以保留原标签名。

- **`XmlProcessor.xmlToHtml(xmlString, targetTag)`** 或 `new XmlProcessor().xmlToHtml(xmlString, targetTag)`

```javascript
import XmlProcessor from 'cishu-data-format';

const xml = '<entry id="100" class="entry-class"><hw dialect="en">hello</hw></entry>';

// 转换并生成 span（默认）
const htmlSpan = XmlProcessor.xmlToHtml(xml);
console.log(htmlSpan);
// <span xml-name="entry" id="100" class="entry-class"><span xml-name="hw" dialect="en">hello</span></span>

// 转换并生成 div
const htmlDiv = XmlProcessor.xmlToHtml(xml, 'div');
console.log(htmlDiv);
// <div xml-name="entry" id="100" class="entry-class"><div xml-name="hw" dialect="en">hello</div></div>
```

### 5. 动态加载 base64 格式字体 (`injectBase64Font`)

支持在**微信小程序环境**与**浏览器环境**中动态加载 base64 编码的字体，并返回 `Promise`。

- **`XmlProcessor.injectBase64Font(fontData, fontFamily)`** 或 `new XmlProcessor().injectBase64Font(fontData, fontFamily)`
- 也可以通过命名导入调用：`import { injectBase64Font } from 'cishu-data-format';`

#### 参数
- `fontData` (*string*): base64 编码的字体数据。
- `fontFamily` (*string*, 可选): 字体家族名称，默认为 `'ztFont'`。

#### 返回值
- 返回一个 `Promise<void>`。

```javascript
import { injectBase64Font } from 'cishu-data-format';

const fontBase64 = 'AAEAAAASAQA...'; // base64 字体内容

// 动态注入字体
injectBase64Font(fontBase64, 'customFont')
  .then(() => {
    console.log('字体加载并注入成功，现在可以在 CSS 中使用 fontFamily: "customFont" 了');
  })
  .catch(err => {
    console.error('字体注入失败：', err);
  });
```

### 6. XML 快速预览格式化 (`chFormatXmlPreview`)

将原始的词书 XML 格式数据一步转换为适合前端直接渲染的预览 HTML 字符串。这是一个便捷方法，内部会先将 XML 标签统一转换为 HTML span 标签（保留 `xml-name` 属性），然后进行深度清洗、排版和样式修饰。

- **`XmlProcessor.chFormatXmlPreview(xmlString)`** 或 `new XmlProcessor().chFormatXmlPreview(xmlString)`

#### 转换逻辑说明
此方法相当于先执行 `xmlToHtml(xml)`，再执行格式化处理，包含以下特性：
1. **标签统一化**：所有 XML 标签转换为 HTML `<span>` 标签，并通过 `xml-name` 属性保留原始标签名。
2. **义项与编号排版**：如果存在多个 `<sense>`（义项），会自动在其开头前置插入形如 `[1]`, `[2]` 的灰色框角标，并对 `<sensenum>` 进行识别替换为黑色圆圈数字。
3. **拼音/冗余标签清理**：自动移除 `<pinyin>`、`<pinyinlianxie>`、`<headword>` 等标签，以及没有内容的空标签（如空的 `<title>`）。
4. **简繁与异体字描述**：合并相邻的繁体字（`<tradition>`）或异体字（`<variantion>`）标签，并前置描述前缀（如 `"繁体："` 或 `"异体："`）。
5. **超链接化与样式修饰**：将 `<consultword>` 转换为带蓝色和手型光标的跳转样式；微调 `<sup>` 标签的行高；处理前置角标 `<supfront>` 与后置角标 `<supback>`。
6. **通用标签映射**：将 `<underline>` 映射为 `<u>`，`<sub>` 映射为 `<sub>`，`<italic>` 映射为 `<i>`，`<citation>` 和 `<example>` 映射为 `<div>`。
7. **生僻字加粗模拟**：为 `<b>` 标签添加 `text-shadow` 阴影，以解决部分自定义字体没有粗体字重的问题。
8. **图片渲染转换**：将 `<image>` 转换为 `<img>` 标签，并自动根据属性（如 `gswImage` 或 `scale`）自适应宽度或高度。

```javascript
import XmlProcessor from 'cishu-data-format';

const xml = '<entry id="100"><tradition>張</tradition><sense id="1"><sensenum>1</sensenum><consultword>张开</consultword></sense></entry>';

// 一步转换为预览格式的 HTML
const previewHtml = XmlProcessor.chFormatXmlPreview(xml);
console.log(previewHtml);
// 输出统一标签化并包含繁体字前缀描述、义项序号、跳转链接样式及排版样式的 HTML 字符串
```

#### 使用场景
- **快速预览**：当你需要快速将 XML 词条渲染到前端页面进行预览时。
- **一致性渲染**：确保所有标签都被转换为标准 HTML 标签，便于统一样式控制。
- **原始标签追溯**：通过 `xml-name` 属性可以追溯原始的 XML 标签名，方便调试和样式定制。

### 7. 从 XML 提取拼音数组 (`execPyArrFromXml`)

从 XML 字符串中递归解析并提取出所有的拼音（`pinyin`）及拼音连写（`pinyinlianxie`）字段，并以对象数组的形式返回。

- **`XmlProcessor.execPyArrFromXml(xmlString)`** 或 `new XmlProcessor().execPyArrFromXml(xmlString)`

```javascript
import XmlProcessor from 'cishu-data-format';

const xml = '<entry><pinyin>zhāng</pinyin><pinyinlianxie>zhāngkāi</pinyinlianxie></entry>';

const pyList = XmlProcessor.execPyArrFromXml(xml);
console.log(pyList);
/* 输出:
[
  { tag: "pinyin", value: "zhāng" },
  { tag: "pinyinlianxie", value: "zhāngkāi" }
]
*/
```

### 8. 聚典数据格式化为 HTML (`jdFormatXmlHtml`)

对通过 `xmlToHtml` 转换后的 HTML/XML 字符串进行聚典特定的排版格式化，包含特定的标签映射、样式修饰和元素剔除。

- **`XmlProcessor.jdFormatXmlHtml(htmlString)`** 或 `new XmlProcessor().jdFormatXmlHtml(htmlString)`

#### 转换逻辑说明
1. **标签转换与映射**：将 `xml-name="u"` 的标签转为 `<u>`，`xml-name="citation"` 的标签转为 `<div>`。
2. **样式修饰**：
   - 给 `xml-name="citation"` 标签添加 `color: gray` 样式。
   - 给 `xml-name="word"` 标签添加 `margin-right: 10px` 样式。
   - 给 `xml-name="example"` 标签添加 `color: gray;` 样式。
   - 给 `xml-name="extracontent"` 标签添加 `color: gray;` 样式。
   - 给 `xml-name="example"` 且 `name` 属性为 `"⊙"` 的标签添加上方分割线样式 `border-top: 1px solid #e0e0e0; margin-top: 8px; padding-top: 8px;display: block;`。
   - 给 `xml-name="example"` 且 `name` 属性不为 `"◇"`, `"▷"`, `"⊙"` 的标签设置为 `display: block;`。
3. **元素剔除**：自动删除 `xml-name="seealso"` 的标签及其所有内容。

```javascript
import XmlProcessor from 'cishu-data-format';

const xml = `
<entry>
  <u>underlined text</u>
  <citation>citation content</citation>
  <seealso>see also content</seealso>
</entry>
`.trim();

// 1. 先转为 HTML 字符串
const html = XmlProcessor.xmlToHtml(xml);

// 2. 格式化聚典数据
const result = XmlProcessor.jdFormatXmlHtml(html);
console.log(result);
// 输出：<span xml-name="entry"><u xml-name="u">underlined text</u><div xml-name="citation" style="color: gray">citation content</div></span>
```

### 9. 聚典古诗文 XML 格式化为 HTML (`jdFormatScDetailXml`)

对聚典古诗文 XML 数据进行专门的格式化处理，将其转换为适合前端直接渲染的 HTML 字符串。此方法会自动将标签转换为 HTML，处理注释、图片、换行等特殊元素，并提供可选的内容过滤功能。

- **`XmlProcessor.jdFormatScDetailXml(xmlString, delTag)`** 或 `new XmlProcessor().jdFormatScDetailXml(xmlString, delTag)`

#### 参数
- `xmlString` (*string*): 聚典古诗文 XML 字符串。
- `delTag` (*string*, 可选): 删除标签选项，传入 `'del5'` 将删除 `type` 不为 `5` 的 `extracontent` 节点，默认为空字符串。

#### 返回值
- 返回格式化后的 HTML 字符串，可直接用于前端展示。

#### 转换逻辑说明
1. **标签转换与映射**：
   - 自动为整个内容包裹 `<entry class="entry">` 标签。
   - 将 `xml-name="annotation"` 的标签转换为 `<span>`。
   - 将 `xml-name="extracontent"` 的标签转换为 `<div>`。

2. **注释处理**：
   - 将 `annotation` 标签内的文本全部替换为空字符串（暂时隐藏注释内容）。
   - 后续可解开代码注释将其显示为蓝色边框的 "注" 字标记。

3. **图片处理**：
   - 识别 `xml-name="image"` 且 `scale > 1` 的图片节点，自动添加 `gswImage` 标记。
   - 带有 `gswImage` 标记的图片将设置 `width: 100%` 样式，使其自适应容器宽度。
   - 其他图片根据 `scale` 属性设置高度 `height: ${scale}em`。

4. **换行转换**：
   - 将所有 `\n` 换行符转换为 HTML `<br>` 标签，保持原文本的换行格式。

5. **可选内容过滤**：
   - 当 `delTag` 参数传入 `'del5'` 时，将删除所有 `type` 不为 `5` 的 `extracontent` 节点。

6. **样式美化**：
   - 最终调用 `chFormatXmlHtml` 方法进行统一的样式美化处理（包括义项序号、繁体字描述、链接样式等）。

```javascript
import XmlProcessor from 'cishu-data-format';

// 示例1：基本格式化
const xml1 = `
<annotation>这是一条注释</annotation>
<content>春眠不觉晓，\n处处闻啼鸟。</content>
<image scale="2" src="example.jpg" />
`.trim();

const result1 = XmlProcessor.jdFormatScDetailXml(xml1);
console.log(result1);
// 输出包含注释（已隐藏文本）、换行符转为 <br>、图片自动处理的 HTML 字符串

// 示例2：使用 delTag 参数过滤内容
const xml2 = `
<annotation>注释内容</annotation>
<extracontent type="3">普通扩展内容</extracontent>
<extracontent type="5">重要扩展内容</extracontent>
<content>孤帆远影碧空尽，\n唯见长江天际流。</content>
`.trim();

const result2 = XmlProcessor.jdFormatScDetailXml(xml2, 'del5');
console.log(result2);
// 输出将删除 type 不为 5 的 extracontent 节点（即只保留 type="5" 的重要扩展内容）
```

#### 使用场景
- **古诗文渲染**：专门用于聚典古诗文数据的前端展示。
- **注释管理**：可灵活控制注释的显示/隐藏。
- **图片自适应**：自动处理不同尺寸的图片，确保在不同设备上的最佳显示效果。
- **内容筛选**：通过 `delTag` 参数可以过滤特定类型的扩展内容，实现灵活的内容展示控制。

---

## 许可证

MIT