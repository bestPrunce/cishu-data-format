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

---

## 许可证

MIT