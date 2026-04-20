#!/usr/bin/env bash

set -euo pipefail

usage() {
  cat <<'EOF'
Usage:
  bash scripts/apply-template.sh <target> [--with-cursor] [--with-kiro] [--overwrite|--backup|--skip-existing]
  bash scripts/apply-template.sh <target> --smart [--mode confirm|silent|dry-run] [--backup] [--shallow]
EOF
}

if [[ $# -lt 1 ]]; then
  usage
  exit 1
fi

if [[ "$1" == "--help" || "$1" == "-h" ]]; then
  usage
  exit 0
fi

target_arg="$1"
shift

with_cursor=false
with_kiro=false
smart=false
smart_mode="confirm"
smart_shallow=false
strategy="skip"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --with-cursor)
      with_cursor=true
      shift
      ;;
    --with-kiro)
      with_kiro=true
      shift
      ;;
    --smart)
      smart=true
      shift
      ;;
    --mode)
      if [[ $# -lt 2 ]]; then
        echo "Missing value for --mode" >&2
        exit 1
      fi
      smart_mode="$2"
      shift 2
      ;;
    --mode=*)
      smart_mode="${1#*=}"
      shift
      ;;
    --shallow)
      smart_shallow=true
      shift
      ;;
    --overwrite)
      strategy="overwrite"
      shift
      ;;
    --backup)
      strategy="backup"
      shift
      ;;
    --skip-existing)
      strategy="skip"
      shift
      ;;
    --help|-h)
      usage
      exit 0
      ;;
    *)
      echo "Unknown option: $1" >&2
      usage
      exit 1
      ;;
  esac
done

if [[ ! -d "$target_arg" ]]; then
  echo "Target directory does not exist: $target_arg" >&2
  exit 1
fi

script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
repo_root="$(cd -- "$script_dir/.." && pwd)"
target_dir="$(cd -- "$target_arg" && pwd)"
timestamp="$(date +%Y%m%d%H%M%S)"

source_root_dir="$repo_root/templates"
source_steering_dir="$repo_root/templates/steering"

if [[ "$smart_mode" != "confirm" && "$smart_mode" != "silent" && "$smart_mode" != "dry-run" ]]; then
  echo "Invalid --mode value: $smart_mode" >&2
  exit 1
fi

if $smart; then
  smart_args=("$repo_root/templates/auto-detect/cli.ts" "setup" "$target_dir" "--mode" "$smart_mode")
  if [[ "$strategy" == "backup" ]]; then
    smart_args+=("--backup")
  fi
  if $smart_shallow; then
    smart_args+=("--shallow")
  fi

  if [[ -x "$repo_root/node_modules/.bin/tsx" ]]; then
    "$repo_root/node_modules/.bin/tsx" "${smart_args[@]}"
  elif command -v npx >/dev/null 2>&1; then
    npx tsx "${smart_args[@]}"
  else
    echo "Smart mode requires local dependencies or npm/npx." >&2
    exit 1
  fi
  exit 0
fi

require_file() {
  local path="$1"
  if [[ ! -f "$path" ]]; then
    echo "Required file missing: $path" >&2
    exit 1
  fi
}

require_dir() {
  local path="$1"
  if [[ ! -d "$path" ]]; then
    echo "Required directory missing: $path" >&2
    exit 1
  fi
}

copy_with_strategy() {
  local src="$1"
  local dest="$2"

  mkdir -p "$(dirname "$dest")"

  if [[ -e "$dest" ]]; then
    case "$strategy" in
      skip)
        echo "SKIP $dest"
        return
        ;;
      backup)
        local backup_path="$dest.backup.$timestamp"
        mv "$dest" "$backup_path"
        echo "BACKUP $dest -> $backup_path"
        ;;
      overwrite)
        ;;
    esac
  fi

  cp -f "$src" "$dest"
  echo "COPY $src -> $dest"
}

sync_directory() {
  local src_dir="$1"
  local dest_dir="$2"

  require_dir "$src_dir"

  while IFS= read -r -d '' src_file; do
    local relative_path="${src_file#$src_dir/}"
    copy_with_strategy "$src_file" "$dest_dir/$relative_path"
  done < <(find "$src_dir" -type f -print0)
}

require_file "$source_root_dir/AGENTS.md"
require_file "$source_root_dir/CLAUDE.md"
require_dir "$source_steering_dir"

copy_with_strategy "$source_root_dir/AGENTS.md" "$target_dir/AGENTS.md"
copy_with_strategy "$source_root_dir/CLAUDE.md" "$target_dir/CLAUDE.md"
sync_directory "$source_steering_dir" "$target_dir/steering"

if $with_cursor; then
  cursor_template_dir="$repo_root/templates/adapters/cursor/rules"
  if [[ -d "$cursor_template_dir" ]]; then
    sync_directory "$cursor_template_dir" "$target_dir/.cursor/rules"
  else
    echo "SKIP Cursor mirror: no bundled cursor template in this repository"
  fi
fi

if $with_kiro; then
  sync_directory "$source_steering_dir" "$target_dir/.kiro/steering"
fi

echo
echo "Installed Harness Coding Protocol v2 into: $target_dir"
echo "Strategy: $strategy"
echo "Root truth:"
echo "  - $target_dir/AGENTS.md"
echo "  - $target_dir/CLAUDE.md"
echo "  - $target_dir/steering/"
if $with_cursor; then
  echo "Cursor mirror:"
  echo "  - $target_dir/.cursor/rules/"
fi
if $with_kiro; then
  echo "Kiro mirror:"
  echo "  - $target_dir/.kiro/steering/"
fi
