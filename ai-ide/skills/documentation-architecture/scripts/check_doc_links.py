#!/usr/bin/env python3
"""Check relative file links in repository Markdown without changing files."""

from __future__ import annotations

import argparse
import json
import re
from pathlib import Path
from urllib.parse import unquote

from inventory_docs import DEFAULT_EXCLUDES, markdown_files


INLINE_LINK = re.compile(r"\[[^\]]*\]\(([^)]+)\)")
REFERENCE_LINK = re.compile(r"^\s*\[[^\]]+\]:\s*(\S+)", re.MULTILINE)
SCHEME = re.compile(r"^[a-z][a-z+.-]*:", re.I)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("root", nargs="?", default=".", help="Repository root")
    parser.add_argument("--paths", nargs="+", default=["README.md", "docs"], help="Files or directories relative to root")
    parser.add_argument("--exclude", action="append", default=[], help="Additional directory name to skip")
    parser.add_argument("--json", action="store_true", help="Print a JSON report")
    return parser.parse_args()


def clean_target(raw: str) -> str | None:
    target = raw.strip().removeprefix("<").removesuffix(">")
    if not target or target.startswith(("#", "/")) or SCHEME.match(target):
        return None
    target = target.split("#", 1)[0].split("?", 1)[0].strip()
    return unquote(target) or None


def main() -> int:
    args = parse_args()
    root = Path(args.root).resolve()
    files = markdown_files(root, args.paths, DEFAULT_EXCLUDES | set(args.exclude))
    checked = 0
    missing = []

    for file in files:
        text = file.read_text(encoding="utf-8", errors="replace")
        raw_targets = INLINE_LINK.findall(text) + REFERENCE_LINK.findall(text)
        for raw in raw_targets:
            target = clean_target(raw)
            if target is None:
                continue
            checked += 1
            resolved = (file.parent / target).resolve()
            if not resolved.exists():
                missing.append(
                    {
                        "source": file.relative_to(root).as_posix(),
                        "target": target,
                    }
                )

    report = {
        "kind": "documentation-link-check",
        "ok": not missing,
        "markdownFiles": len(files),
        "relativeLinksChecked": checked,
        "missing": missing,
    }
    if args.json:
        print(json.dumps(report, ensure_ascii=False, indent=2))
    else:
        print(
            f"Documentation links: {'PASS' if report['ok'] else 'FAIL'} "
            f"({len(files)} files, {checked} relative links, {len(missing)} missing)"
        )
        for finding in missing:
            print(f"- {finding['source']}: {finding['target']}")
    return 0 if report["ok"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
