#!/usr/bin/env python3
"""Inventory repository Markdown without changing the workspace."""

from __future__ import annotations

import argparse
import hashlib
import json
import re
from collections import Counter, defaultdict
from pathlib import Path


DEFAULT_EXCLUDES = {
    ".git",
    ".next",
    ".venv",
    "build",
    "coverage",
    "dist",
    "node_modules",
    "out",
    "output",
    "playwright-report",
    "screenshots",
    "target",
    "test-results",
    "tmp",
    "vendor",
}

HEADING = re.compile(r"^(#{1,6})\s+(.+?)\s*$", re.MULTILINE)
LINK = re.compile(r"\[[^\]]*\]\(([^)]+)\)")

SIGNALS = {
    "current-truth": ("architecture", "contract", "current", "overview", "reference", "当前", "架构", "总览", "规范"),
    "operational": ("deploy", "guide", "how-to", "runbook", "troubleshoot", "指南", "操作", "部署", "排障", "运维"),
    "executed-work": ("archive", "changelog", "completed", "history", "postmortem", "已执行", "历史", "归档", "复盘", "验收记录"),
    "future-direction": ("backlog", "future", "roadmap", "todo", "迭代", "规划", "待办", "方向", "剩余缺口"),
    "machine-evidence": ("evidence", "generated", "manifest", "report", "screenshot", "证据", "生成", "报告", "截图"),
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("root", nargs="?", default=".", help="Repository root")
    parser.add_argument(
        "--paths",
        nargs="+",
        default=["README.md", "docs"],
        help="Files or directories relative to root",
    )
    parser.add_argument("--exclude", action="append", default=[], help="Additional directory name to skip")
    parser.add_argument("--output", help="Write JSON to this path instead of stdout")
    return parser.parse_args()


def markdown_files(root: Path, paths: list[str], excludes: set[str]) -> list[Path]:
    found: set[Path] = set()
    for raw in paths:
        candidate = (root / raw).resolve()
        if not candidate.exists():
            continue
        if candidate.is_file() and candidate.suffix.lower() == ".md":
            found.add(candidate)
            continue
        if not candidate.is_dir():
            continue
        for path in candidate.rglob("*.md"):
            if not any(part in excludes for part in path.relative_to(root).parts):
                found.add(path.resolve())
    return sorted(found, key=lambda value: value.as_posix().lower())


def normalize_content(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip().casefold()


def lifecycle_signals(path: str, title: str | None, text: str) -> list[str]:
    sample = f"{path}\n{title or ''}\n{text[:4000]}".casefold()
    return [name for name, terms in SIGNALS.items() if any(term.casefold() in sample for term in terms)]


def main() -> int:
    args = parse_args()
    root = Path(args.root).resolve()
    excludes = DEFAULT_EXCLUDES | set(args.exclude)
    files = markdown_files(root, args.paths, excludes)
    entries = []
    digest_paths: dict[str, list[str]] = defaultdict(list)
    title_paths: dict[str, list[str]] = defaultdict(list)
    directory_counts: Counter[str] = Counter()

    for file in files:
        text = file.read_text(encoding="utf-8", errors="replace")
        relative = file.relative_to(root).as_posix()
        headings = [{"level": len(marker), "text": value.strip()} for marker, value in HEADING.findall(text)]
        title = next((item["text"] for item in headings if item["level"] == 1), None)
        links = [match.strip().removeprefix("<").removesuffix(">") for match in LINK.findall(text)]
        normalized = normalize_content(text)
        digest = hashlib.sha256(normalized.encode("utf-8")).hexdigest() if normalized else None
        if digest:
            digest_paths[digest].append(relative)
        if title:
            title_paths[title.casefold()].append(relative)
        directory_counts[str(Path(relative).parent).replace("\\", "/")] += 1
        entries.append(
            {
                "path": relative,
                "bytes": file.stat().st_size,
                "lines": text.count("\n") + (1 if text else 0),
                "title": title,
                "headings": headings,
                "relativeLinkCount": sum(
                    1
                    for link in links
                    if link and not link.startswith("#") and not re.match(r"^[a-z][a-z+.-]*:", link, re.I)
                ),
                "signals": lifecycle_signals(relative, title, text),
            }
        )

    report = {
        "kind": "documentation-architecture-inventory",
        "root": str(root),
        "summary": {
            "markdownFiles": len(entries),
            "directories": len(directory_counts),
            "rootReadmes": sum(1 for item in entries if Path(item["path"]).name.casefold() == "readme.md"),
            "exactDuplicateGroups": sum(1 for paths in digest_paths.values() if len(paths) > 1),
            "repeatedTitleGroups": sum(1 for paths in title_paths.values() if len(paths) > 1),
        },
        "directoryCounts": dict(sorted(directory_counts.items())),
        "exactDuplicates": [paths for paths in digest_paths.values() if len(paths) > 1],
        "repeatedTitles": [paths for paths in title_paths.values() if len(paths) > 1],
        "files": entries,
    }
    rendered = json.dumps(report, ensure_ascii=False, indent=2) + "\n"
    if args.output:
        output = Path(args.output)
        if not output.is_absolute():
            output = root / output
        output.parent.mkdir(parents=True, exist_ok=True)
        output.write_text(rendered, encoding="utf-8")
    else:
        print(rendered, end="")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
