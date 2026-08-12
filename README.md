1. pip install requirements.txt
2. cmd python main.py
3. pyinstaller --onefile --windowed --name "CaseManager" --add-data "web;web" --hidden-import eel --hidden-import pandas main.py


用例数据管理工具
一个基于 Eel + Pandas 构建的轻量级桌面应用，用于测试用例数据的 导入、编辑、查询、汇总，支持 场景图上传预览、多条件组合查询、分页展示，并可将数据导出为 CSV 文件。

📌 功能特性
多格式导入：支持 .csv（UTF‑8 / GBK）文件，叠加或覆盖导入。

数据编辑：表格内双击编辑（可编辑任意字段），支持行级保存。

唯一性校验：对“用例编号”字段自动校验重复（空值跳过）。

高级查询：多条件组合（AND / OR），每个条件支持 包含/等于/开头是/结尾是 操作符，简单搜索与高级搜索并存。

分页展示：数据量较大时自动分页，可自定义每页显示条数（20/50/100/200）。

场景图支持：

上传 PNG / JPG / GIF 等格式图片（Base64 存储）。

表格中以缩略图显示，点击可全屏预览大图。

超链接字段：ADC数据保存位置 和 测试结果位置 支持多个链接（用 ; 分隔），表格中换行展示，点击可跳转。

数据导出：一键导出当前全部数据为 CSV 文件（UTF‑8‑BOM 编码，兼容 Excel）。

界面友好：卡片式布局，关键字段高亮（用例编号、用例名称、项目、执行结果）。

⚙️ 系统要求
操作系统：Windows 10 / 11（macOS / Linux 也可运行，但需调整部分路径）

Python 版本：3.8 及以上

浏览器：建议使用 Microsoft Edge（Windows 自带）或 Google Chrome

🚀 快速开始
1. 克隆或下载代码
bash
git clone <repository-url>
cd case_manager
2. 安装 Python 依赖
建议使用虚拟环境：

bash
python -m venv venv
source venv/bin/activate      # Linux / macOS
venv\Scripts\activate         # Windows
安装所需库：

bash
pip install eel pandas
3. 运行应用
bash
python main.py
应用将自动打开一个浏览器窗口（默认使用 Edge）。

📁 项目结构
text
case_manager/
├── main.py               # 后端主程序（Eel 服务 + Pandas 逻辑）
├── web/                  # 前端资源目录
│   ├── case_manager.html # 主界面（含 CSS / JavaScript）
│   └── ...               # 其他静态资源（如有）
├── requirements.txt      # 依赖列表（可自行生成）
└── README.md             # 本文件
🧰 使用说明

导入数据
点击 “选择文件” 或拖拽 CSV 文件到上传区域。

选择导入模式：

叠加导入：新数据追加到现有数据末尾，自动合并列。

覆盖导入：清空现有数据，完全替换为新数据。

导入时自动校验“用例编号”重复（空值忽略）。

查看与编辑
数据以表格形式展示，每行包含“编辑”和“删除”按钮。

编辑：点击“编辑”按钮弹出模态框，修改任意字段（包括场景图）。

删除：确认后移除该行。

修改后点击“保存修改”，数据将持久化（内存中），并刷新当前页。

搜索功能
简单搜索：选择字段 → 输入关键词 → 点击“查询”或按回车。

高级搜索：点击“高级”按钮展开条件面板。

添加多个条件（字段 + 操作符 + 值）。

选择逻辑（AND / OR）。

点击“高级查询”执行。

点击“重置”或“显示全部”恢复所有数据。

分页控制
表格底部显示总记录数和页码。

通过“上一页/下一页/首页/末页”或输入页码跳转。

可切换每页显示条数（20/50/100/200）。

场景图操作
上传：在新增/编辑模态框中，点击“场景图”字段的“选择文件”，选取图片。

预览：上传后自动显示缩略图，点击缩略图可全屏放大查看。

存储：图片以 Base64 编码保存在 CSV 中（导出时包含）。

导出数据
点击 “导出 CSV” 按钮，自动下载当前全部数据（UTF‑8‑BOM 编码），可用 Excel 打开。

🔧 高级配置
修改默认列头
编辑 main.py 中的 STANDARD_COLS 列表，可调整表格显示字段顺序及默认列。

调整分页大小选项
在 case_manager.html 中搜索 pageSizeSelect 的 <option>，可增删或修改每页条数。

浏览器模式
eel.start() 的 mode 参数可改为 'chrome'、'firefox' 或 'default'（系统默认浏览器）。

📦 打包为独立可执行文件（Windows）
便于分发给未安装 Python 的用户：

1. 安装 PyInstaller
bash
pip install pyinstaller
2. 执行打包命令
在项目根目录下运行：

bash
pyinstaller --onefile --windowed --name "CaseManager" --add-data "web;web" --hidden-import eel --hidden-import pandas main.py
3. 运行结果
生成的 CaseManager.exe 位于 dist/ 目录，双击即可运行，无需 Python 环境。

注意：若打包后提示找不到 web/ 资源，请确保 --add-data 路径正确（Windows 用分号 ;，Linux/macOS 用冒号 :）。也可在 main.py 中使用 sys._MEIPASS 动态获取资源路径（参考 PyInstaller 文档）。

🐛 常见问题
Q1：导入 CSV 时提示“字段不存在”或列名不匹配？
确保 CSV 首行为列名，且与 STANDARD_COLS 尽量一致（系统会自动映射，但建议使用标准列名）。

编码问题：请保存为 UTF‑8 或 GBK。

Q2：场景图上传后表格不显示图片？
检查图片大小，Base64 编码后可能过大，建议压缩图片（< 500KB）。

确认后端 update_row 正确保存了 场景图 字段。

Q3：搜索时一直显示“搜索中…”？
检查后端 search_data 函数是否正常返回，查看浏览器控制台和 Python 终端是否有报错。

确保 Eel 版本支持回调或 Promise（若使用旧版 Eel，请用回调方式）。

Q4：打包后运行时提示“Failed to load resource: net::ERR_FILE_NOT_FOUND”？
说明前端资源未正确打包，修改 main.py 中的资源路径为动态获取方式（使用 resource_path 函数）。

Q5:改掉源代码前端或者后端都要的重新编译
bash
pyinstaller --onefile --windowed --name "CaseManager" --add-data "web;web" --hidden-import eel --hidden-import pandas --clean main.py