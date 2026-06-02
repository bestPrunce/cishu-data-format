# cishu-data-format

辞书处理 XML 与 JSON 数据格式转换的 NPM 工具库。

## 安装

```bash
npm install cishu-data-format
```

## 使用说明

本工具包支持 ES Modules (ESM) 导入。

### 1. 导入方法

```javascript
// 方式一：导入命名函数（推荐）
import { xmlToJson, jsonToXml } from 'cishu-data-format';

// 方式二：导入默认对象
import cishuFormat from 'cishu-data-format';
// 使用 cishuFormat.xmlToJson(...) 或 cishuFormat.jsonToXml(...)
```

### 2. XML 转 JSON (`xmlToJson`)

将 XML 字符串转换为特定的 JSON 树形结构。

#### 参数
- `xml` (`string`): 待转换的 XML 字符串。

#### 返回值
- `Object | Array`: 解析后的 JSON 节点。如果 XML 根节点只有一个，则返回该节点对象；如果有多个并列根节点，则返回节点数组。

#### 示例

```javascript
import { xmlToJson } from 'cishu-data-format';

const xmlString = `
<book id="1" category="fiction">
  <title>Harry Potter</title>
  <author>J.K. Rowling</author>
  <price currency="USD">29.99</price>
  <description />
</book>
`;

const json = xmlToJson(xmlString);
console.log(JSON.stringify(json, null, 2));
```

**输出 JSON 结构：**
```json
{
  "type": "element",
  "name": "book",
  "attributes": {
    "id": "1",
    "category": "fiction"
  },
  "children": [
    {
      "type": "element",
      "name": "title",
      "attributes": {},
      "children": [
        {
          "type": "text",
          "text": "Harry Potter"
        }
      ]
    },
    {
      "type": "element",
      "name": "author",
      "attributes": {},
      "children": [
        {
          "type": "text",
          "text": "J.K. Rowling"
        }
      ]
    },
    {
      "type": "element",
      "name": "price",
      "attributes": {
        "currency": "USD"
      },
      "children": [
        {
          "type": "text",
          "text": "29.99"
        }
      ]
    },
    {
      "type": "element",
      "name": "description",
      "attributes": {},
      "children": []
    }
  ]
}
```

---

### 3. JSON 转 XML (`jsonToXml`)

将符合上述结构的 JSON 树形对象转换回 XML 字符串，且会自动对属性和文本内容进行安全转义（处理 `&`, `<`, `>`, `"` 字符）。

#### 参数
- `node` (`Object`): 符合格式的 JSON 节点对象（包含 `type`, `name`, `attributes`, `children` 或 `text`）。

#### 返回值
- `string`: 转换后的 XML 字符串。

#### 示例

```javascript
import { jsonToXml } from 'cishu-data-format';

const jsonNode = {
  type: "element",
  name: "book",
  attributes: { id: "1" },
  children: [
    {
      type: "element",
      name: "title",
      attributes: {},
      children: [{ type: "text", text: "Harry & Potter" }]
    }
  ]
};

const xmlString = jsonToXml(jsonNode);
console.log(xmlString);
// 输出: <book id="1"><title>Harry &amp; Potter</title></book>
```

---

## 开发者发布指南

如果您需要发布或更新此 NPM 包，可参考以下步骤：

```bash
# 1. 在项目根目录初始化（如果还没做）
npm init -y

# 2. 登录 npm
npm login

# 3. 验证是否登录成功
npm whoami

# 4. 修改版本号（推荐方式）
npm version patch     # 1.0.0 -> 1.0.1
# 或
npm version minor     # 1.0.0 -> 1.1.0
# 或
npm version major     # 1.0.0 -> 2.0.0

# 5. 发布到 npm
npm publish --access public
```