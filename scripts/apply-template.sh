#!/usr/bin/env bash

set -euo pipefail

usage() {
  cat <<'EOF'
Usage:
  bash scripts/apply-template.sh <target> [--with-cursor] [--with-kiro] [--example minimal|complete] [--overwrite|--backup|--skip-existing]
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
example_name=""
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
    --example)
      if [[ $# -lt 2 ]]; then
        echo "Missing value for --example" >&2
        exit 1
      fi
      example_name="$2"
      shift 2
      ;;
    --example=*)
      example_name="${1#*=}"
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

source_root_dir="$repo_root/templates/root"
source_steering_dir="$repo_root/templates/steering"

if [[ -n "$example_name" ]]; then
  source_example_dir="$repo_root/examples/$example_name"
  if [[ ! -d "$source_example_dir" ]]; then
    echo "Example not found: $example_name" >&2
    exit 1
  fi
  source_root_dir="$source_example_dir"
  source_steering_dir="$source_example_dir/steering"
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
  require_dir "$repo_root/templates/adapters/cursor/rules"
  sync_directory "$repo_root/templates/adapters/cursor/rules" "$target_dir/.cursor/rules"
fi

if $with_kiro; then
  require_dir "$repo_root/templates/adapters/kiro"
  sync_directory "$source_steering_dir" "$target_dir/.kiro/steering"
fi

echo
echo "Installed Harness Coding Protocol v2 into: $target_dir"
echo "Strategy: $strategy"
if [[ -n "$example_name" ]]; then
  echo "Example source: $example_name"
fi
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
