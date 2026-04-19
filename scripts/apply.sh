#!/bin/bash
# 应用模板到目标项目
# 用法: ./apply.sh /path/to/project

set -e

TARGET_DIR="${1:-.}"

if [ ! -d "$TARGET_DIR" ]; then
    echo "错误: 目录不存在: $TARGET_DIR"
    exit 1
fi

echo "应用模板到: $TARGET_DIR"

# 复制模板文件
cp templates/CLAUDE.md "$TARGET_DIR/"
cp templates/AGENTS.md "$TARGET_DIR/"

# 创建 steering 目录并复制
mkdir -p "$TARGET_DIR/.kiro/steering"
cp -r templates/steering/* "$TARGET_DIR/.kiro/steering/"

# 创建 rules 目录并复制
mkdir -p "$TARGET_DIR/.cursor/rules"
cp -r templates/rules/* "$TARGET_DIR/.cursor/rules/"

echo "完成!"
echo "请根据项目需求修改以下文件:"
echo "  - $TARGET_DIR/CLAUDE.md"
echo "  - $TARGET_DIR/.kiro/steering/"
