# ccTaskCopyer

一个适用于 CloudCanal 的 Tampermonkey 用户脚本，在页面上展示作业相关信息，并提供快速复制数据任务启动参数的功能。

## 功能特性

- 在 CloudCanal 页面右下角添加浮动面板，显示源端与目标端数据源类型以及当前作业的数据任务列表。
- 每个任务都带有 **复制** 按钮，可根据自定义模板生成启动参数。
- 内置模板编辑器，模板内容保存在 `localStorage` 中，随时可修改。
- 页面跳转时自动隐藏或显示面板。

## 使用方法

1. 安装 [Tampermonkey](https://www.tampermonkey.net/) 或其他兼容的用户脚本管理器。
2. 新建脚本并将 `ccTaskCopyer.js` 的内容粘贴其中。
3. 访问 `http://localhost:8111/*`（CloudCanal 控制台），进入作业详情页后即可看到浮动面板。
4. 点击相应任务旁的 **复制** 按钮即可复制启动参数，使用 **编辑模板** 可以调整参数模板。

## 模板可用变量

- `${jobId}` – 当前作业 ID
- `${taskId}` – 数据任务 ID
- `${sourceType}` – 源端数据源类型
- `${targetType}` – 目标端数据源类型
- `${dataTaskName}` – 任务名称
- `${dataTaskStatus}` – 任务状态
- `${dataTaskType}` – 任务类型
- `${embeddingProvider}` – 嵌入向量提供方，默认 `DashScope`
- `${llmProvider}` – 大模型提供方，默认 `DashScope`

如有需要，可在模板编辑器中随时恢复默认模板。
