$ErrorActionPreference = "Stop"

function Show-Usage {
    Write-Host "Usage:"
    Write-Host "  powershell -File scripts/apply-template.ps1 <target> [--with-cursor] [--with-kiro] [--example minimal|complete] [--overwrite|--backup|--skip-existing]"
}

if ($args.Count -lt 1) {
    Show-Usage
    exit 1
}

if ($args[0] -eq "--help" -or $args[0] -eq "-h") {
    Show-Usage
    exit 0
}

$targetArg = $args[0]
$remaining = @()
if ($args.Count -gt 1) {
    $remaining = $args[1..($args.Count - 1)]
}

$withCursor = $false
$withKiro = $false
$exampleName = ""
$strategy = "skip"

for ($i = 0; $i -lt $remaining.Count; $i++) {
    $arg = $remaining[$i]
    switch -Regex ($arg) {
        '^--with-cursor$' {
            $withCursor = $true
            continue
        }
        '^--with-kiro$' {
            $withKiro = $true
            continue
        }
        '^--example=(.+)$' {
            $exampleName = $Matches[1]
            continue
        }
        '^--example$' {
            if ($i + 1 -ge $remaining.Count) {
                throw "Missing value for --example"
            }
            $exampleName = $remaining[$i + 1]
            $i++
            continue
        }
        '^--overwrite$' {
            $strategy = "overwrite"
            continue
        }
        '^--backup$' {
            $strategy = "backup"
            continue
        }
        '^--skip-existing$' {
            $strategy = "skip"
            continue
        }
        '^--help$|^-h$' {
            Show-Usage
            exit 0
        }
        default {
            throw "Unknown option: $arg"
        }
    }
}

$resolvedTarget = Resolve-Path -LiteralPath $targetArg -ErrorAction Stop
if (-not (Test-Path -LiteralPath $resolvedTarget.Path -PathType Container)) {
    throw "Target directory does not exist: $targetArg"
}

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = Split-Path -Parent $scriptDir
$targetDir = $resolvedTarget.Path
$timestamp = Get-Date -Format "yyyyMMddHHmmss"

$sourceRootDir = Join-Path $repoRoot "templates\root"
$sourceSteeringDir = Join-Path $repoRoot "templates\steering"

if ($exampleName) {
    $sourceExampleDir = Join-Path $repoRoot ("examples\" + $exampleName)
    if (-not (Test-Path -LiteralPath $sourceExampleDir -PathType Container)) {
        throw "Example not found: $exampleName"
    }
    $sourceRootDir = $sourceExampleDir
    $sourceSteeringDir = Join-Path $sourceExampleDir "steering"
}

function Require-File([string]$path) {
    if (-not (Test-Path -LiteralPath $path -PathType Leaf)) {
        throw "Required file missing: $path"
    }
}

function Require-Directory([string]$path) {
    if (-not (Test-Path -LiteralPath $path -PathType Container)) {
        throw "Required directory missing: $path"
    }
}

function Copy-WithStrategy([string]$src, [string]$dest) {
    $parent = Split-Path -Parent $dest
    if ($parent) {
        New-Item -ItemType Directory -Force -Path $parent | Out-Null
    }

    if (Test-Path -LiteralPath $dest) {
        switch ($strategy) {
            "skip" {
                Write-Host "SKIP $dest"
                return
            }
            "backup" {
                $backupPath = "$dest.backup.$timestamp"
                Move-Item -LiteralPath $dest -Destination $backupPath -Force
                Write-Host "BACKUP $dest -> $backupPath"
            }
            "overwrite" {
            }
        }
    }

    Copy-Item -LiteralPath $src -Destination $dest -Force
    Write-Host "COPY $src -> $dest"
}

function Sync-Directory([string]$srcDir, [string]$destDir) {
    Require-Directory $srcDir

    Get-ChildItem -LiteralPath $srcDir -Recurse -File | ForEach-Object {
        $relativePath = $_.FullName.Substring($srcDir.Length).TrimStart('\', '/')
        $destPath = Join-Path $destDir $relativePath
        Copy-WithStrategy $_.FullName $destPath
    }
}

Require-File (Join-Path $sourceRootDir "AGENTS.md")
Require-File (Join-Path $sourceRootDir "CLAUDE.md")
Require-Directory $sourceSteeringDir

Copy-WithStrategy (Join-Path $sourceRootDir "AGENTS.md") (Join-Path $targetDir "AGENTS.md")
Copy-WithStrategy (Join-Path $sourceRootDir "CLAUDE.md") (Join-Path $targetDir "CLAUDE.md")
Sync-Directory $sourceSteeringDir (Join-Path $targetDir "steering")

if ($withCursor) {
    $cursorTemplateDir = Join-Path $repoRoot "templates\adapters\cursor\rules"
    Require-Directory $cursorTemplateDir
    Sync-Directory $cursorTemplateDir (Join-Path $targetDir ".cursor\rules")
}

if ($withKiro) {
    $kiroTemplateDir = Join-Path $repoRoot "templates\adapters\kiro"
    Require-Directory $kiroTemplateDir
    Sync-Directory $sourceSteeringDir (Join-Path $targetDir ".kiro\steering")
}

Write-Host ""
Write-Host "Installed Harness Coding Protocol v2 into: $targetDir"
Write-Host "Strategy: $strategy"
if ($exampleName) {
    Write-Host "Example source: $exampleName"
}
Write-Host "Root truth:"
Write-Host "  - $(Join-Path $targetDir 'AGENTS.md')"
Write-Host "  - $(Join-Path $targetDir 'CLAUDE.md')"
Write-Host "  - $(Join-Path $targetDir 'steering')"
if ($withCursor) {
    Write-Host "Cursor mirror:"
    Write-Host "  - $(Join-Path $targetDir '.cursor\rules')"
}
if ($withKiro) {
    Write-Host "Kiro mirror:"
    Write-Host "  - $(Join-Path $targetDir '.kiro\steering')"
}
