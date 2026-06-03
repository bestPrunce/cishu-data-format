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

---

## 许可证

MIT