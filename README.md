# Elaina 个人作品集

静态作品集网站，可直接发布至 GitHub Pages，无需安装依赖。

## 发布

仓库 Settings → Pages → Deploy from a branch，选择 `main` 和 `/ (root)`，保存。
网站地址：https://xieyusi4936-ops.github.io/elaina_web/

## 当前内容

- 三幕滚动介绍与点击切换，使用原图的交叉淡化，并非连续人物骨骼动画。
- 个人简介、项目经历为明确标记的占位内容。
- 三个作品入口展示用户提供的视觉素材，尚非正式项目案例。
- 作品弹窗独立滚动，支持关闭按钮、Escape 关闭以及焦点返回。
- 手机布局与减少动态效果偏好支持。

## 更新

`index.html`：个人简介、经历、作品卡片及详情占位文字。
`app.js`：作品标题、详情图片、场景交互。
`style.css`：页面样式和移动端布局。
`assets/`：经过压缩的网页图片；原始 PNG 未修改。

本地预览：`python3 -m http.server 8000`。
