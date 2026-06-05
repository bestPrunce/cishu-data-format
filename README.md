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

### 10. 远程字体加载与注入 (`jdLoadRemoteFont`)

从远程服务器请求指定的字体文件（.woff 格式），并自动注入到当前运行环境中（支持微信小程序与浏览器环境）。此方法会自动处理网络请求、数据转换和字体注入的全过程。

- **`XmlProcessor.jdLoadRemoteFont(fontId, token, fontFamily)`** 或 `new XmlProcessor().jdLoadRemoteFont(fontId, token, fontFamily)`
- 也可以通过命名导入调用：`import { jdLoadRemoteFont } from 'cishu-data-format';`

#### 参数
- `fontId` (*string*): 字体 ID，例如 `'cZmnsAjAPolJVuYq'`。
- `token` (*string*): 有效的 Bearer token，用于 API 认证。
- `fontFamily` (*string*, 可选): 注册后使用的 CSS 字体名，默认为 `'ztFont'`。

#### 返回值
- 返回一个 `Promise<void>`。

#### 工作原理
1. **构建请求 URL**：根据 `fontId` 拼接完整的字体文件下载地址（`https://api.jdapi.com/font/{fontId}.woff?v=2`）。
2. **环境适配请求**：
   - **微信小程序**：使用 `wx.request` 并设置 `responseType: 'arraybuffer'` 获取字体二进制数据。
   - **浏览器环境**：使用 `fetch` API 获取字体数据并转换为 `ArrayBuffer`。
3. **数据转换**：将 `ArrayBuffer` 转换为 base64 编码字符串。
4. **字体注入**：调用 `injectBase64Font` 方法将 base64 字体注入到当前环境中，使其可在 CSS 中使用。

#### 使用示例

```javascript
import { jdLoadRemoteFont } from 'cishu-data-format';

// 获取用户 token（需要根据实际业务逻辑实现）
const token = 'your-bearer-token-here';

// 加载远程字体
jdLoadRemoteFont('cZmnsAjAPolJVuYq', token)
  .then(() => {
    console.log('字体加载成功，现在可以使用 fontFamily: "ztFont" 了');
  })
  .catch(err => {
    console.error('字体加载失败：', err);
  });

// 或者使用自定义字体名称
jdLoadRemoteFont('cZmnsAjAPolJVuYq', token, 'JDShuFa')
  .then(() => {
    console.log('字体加载成功，现在可以使用 fontFamily: "JDShuFa" 了');
  })
  .catch(err => {
    console.error('字体加载失败：', err);
  });

// 使用 async/await 语法
async function loadFont() {
  try {
    await jdLoadRemoteFont('cZmnsAjAPolJVuYq', getToken(), 'customFont');
    console.log('字体加载完成');
  } catch (error) {
    console.error('字体加载错误：', error);
  }
}
```

#### 使用场景
- **动态字体加载**：在应用运行时根据需要动态加载特殊字体（如生僻字字体、书法字体等）。
- **跨环境兼容**：一套代码同时支持微信小程序和浏览器环境，自动适配不同的网络请求方式。
- **认证访问**：支持带 token 的字体资源访问，适用于需要权限控制的字体资源。
- **辞书渲染**：配合辞书内容渲染，确保生僻字和特殊字符正确显示。

#### 注意事项
- 请确保提供的 `token` 有效且具有访问字体资源的权限。
- 字体文件会通过网络请求获取，首次加载可能需要一定时间，建议在应用启动时预加载。
- 加载失败时会抛出错误，建议使用 `try-catch` 或 `.catch()` 进行错误处理。

### 11. XML 词条结构转换 (`transformEntryXML`)

将词书 XML 数据从三层结构转换为四层结构，自动处理拼音归并、义项分组、内容流重建等复杂转换逻辑。该方法专为词书数据结构优化设计。

- **`XmlProcessor.transformEntryXML(xmlStr)`** 或 `new XmlProcessor().transformEntryXML(xmlStr)`
- 也可以通过命名导入调用：`import { transformEntryXML } from 'cishu-data-format';`

#### 参数
- `xmlStr` (*string*): 原始的词书 XML 字符串（三层结构）。

#### 返回值
- 返回转换后的 XML 字符串（四层结构）。

#### 转换逻辑说明
1. **结构层级转换**：将原始的三层词条结构（entry > definition > content）转换为四层结构（entry > definition > section > content），便于更细粒度的内容管理。

2. **单字词条特殊处理**：
   - 自动识别单字词条（`headword` 长度为 1）。
   - 按拼音对 `definition` 节点进行分组归并。
   - 相同拼音的 `definition` 合并为一个 `definition` 节点，内部创建多个 `section` 节点。

3. **多字词条常规处理**：
   - 每个原始 `definition` 节点转换为一个新的 `definition` 节点。
   - 每个新 `definition` 节点内包含一个 `section` 节点。

4. **拼音处理**：
   - 提取第一个拼音作为分组依据。
   - 对于单字词条，删除原 `definition` 内的首个拼音（避免重复）。
   - 第二个及之后的拼音标签自动转换为 `<duyin>`（多音）标签。

5. **序号与顺序标记**：
   - 为 `definition` 节点添加数字序号 `id` 属性。
   - 为 `section` 节点添加数字序号 `id` 属性和圆圈序号 `order` 属性（如 `①②③④...`）。

6. **内容流重建**：
   - 智能处理文本节点和元素节点的混合内容。
   - 保留原始节点的所有属性和子节点结构。
   - 自动处理括号、空白等格式细节。

#### 使用示例

```javascript
import XmlProcessor from 'cishu-data-format';

// 示例1：单字词条转换（会按拼音分组）
const singleCharXml = `
<entry id="100">
  <headword>干</headword>
  <definition>
    <pinyin>gān</pinyin>
    <content>触犯，冒犯</content>
  </definition>
  <definition>
    <pinyin>gān</pinyin>
    <content>追求，求取</content>
  </definition>
  <definition>
    <pinyin>gàn</pinyin>
    <content>做，办，搞</content>
  </definition>
</entry>
`.trim();

const result1 = XmlProcessor.transformEntryXML(singleCharXml);
console.log(result1);
/* 输出结构：
<entry id="100">
  <headword>干</headword>
  <definition id="1">
    <pinyin>gān</pinyin>
    <pinyinlianxie/>
    <section id="1" order="①">
      <content>触犯，冒犯</content>
    </section>
    <section id="2" order="②">
      <content>追求，求取</content>
    </section>
  </definition>
  <definition id="2">
    <pinyin>gàn</pinyin>
    <pinyinlianxie/>
    <section id="1" order="①">
      <content>做，办，搞</content>
    </section>
  </definition>
</entry>
*/

// 示例2：多字词条转换（不会合并）
const multiCharXml = `
<entry id="200">
  <headword>干部</headword>
  <definition>
    <pinyin>gànbù</pinyin>
    <content>担任一定领导工作的人员</content>
  </definition>
  <definition>
    <content>树木的主干</content>
  </definition>
</entry>
`.trim();

const result2 = XmlProcessor.transformEntryXML(multiCharXml);
console.log(result2);
/* 输出结构：
<entry id="200">
  <headword>干部</headword>
  <definition id="1">
    <section id="1" order="①">
      <pinyin>gànbù</pinyin>
      <content>担任一定领导工作的人员</content>
    </section>
  </definition>
  <definition id="2">
    <section id="1" order="①">
      <content>树木的主干</content>
    </section>
  </definition>
</entry>
*/

// 示例3：使用命名导入
import { transformEntryXML } from 'cishu-data-format';

const xml = '<entry id="300"><headword>好</headword><definition><pinyin>hǎo</pinyin><content>优点多</content></definition></entry>';
const converted = transformEntryXML(xml);
console.log(converted);
```

#### 使用场景
- **词条数据结构升级**：将旧版三层结构词条数据批量转换为新版四层结构。
- **拼音归并与分组**：自动处理多音字词条，按拼音智能分组。
- **数据标准化处理**：统一词条数据格式，便于后续的数据处理和展示。
- **批量数据转换**：适用于大规模词典数据的结构化转换工作。

#### 注意事项
- 该方法依赖浏览器环境的 `DOMParser` 和 `XMLSerializer` API，不支持 Node.js 环境（除非使用 jsdom 等库）。
- 输入的 XML 必须是格式良好的 XML 文档，否则解析会失败。
- 转换过程中会自动清理多余的空白和换行，确保输出 XML 的整洁性。
- 单字词条的识别依据是 `<headword>` 标签的文本内容长度，确保该标签正确且唯一。

---

## 许可证

MIT