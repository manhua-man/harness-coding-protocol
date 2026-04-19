#!/bin/bash
# apply-template.sh - 应用模板到目标项目

TARGET="${1:-.}"

echo "应用模板到: $TARGET"

# 复制主文件
cp templates/CLAUDE.md "$TARGET/"
cp templates/AGENTS.md "$TARGET/"

# 创建目录并复制
mkdir -p "$TARGET/.kiro/steering"
cp -r templates/steering/* "$TARGET/.kiro/steering/"

mkdir -p "$TARGET/.cursor/rules"
cp -r templates/rules/* "$TARGET/.cursor/rules/"

echo "完成!"
