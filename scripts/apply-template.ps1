$ErrorActionPreference = "Stop"

function Show-Usage {
    Write-Host "Usage:"
    Write-Host "  powershell -File scripts/apply-template.ps1 <target> [--with-cursor] [--with-kiro] [--overwrite|--backup|--skip-existing]"
    Write-Host "  powershell -File scripts/apply-template.ps1 <target> --smart [--mode confirm|silent|dry-run] [--backup] [--shallow]"
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
$smart = $false
$smartMode = "confirm"
$smartShallow = $false
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
        '^--smart$' {
            $smart = $true
            continue
        }
        '^--mode=(.+)$' {
            $smartMode = $Matches[1]
            continue
        }
        '^--mode$' {
            if ($i + 1 -ge $remaining.Count) {
                throw "Missing value for --mode"
            }
            $smartMode = $remaining[$i + 1]
            $i++
            continue
        }
        '^--shallow$' {
            $smartShallow = $true
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

$sourceRootDir = Join-Path $repoRoot "templates"
$sourceSteeringDir = Join-Path $repoRoot "templates\steering"

if (@("confirm", "silent", "dry-run") -notcontains $smartMode) {
    throw "Invalid --mode value: $smartMode"
}

if ($smart) {
    $smartArgs = @((Join-Path $repoRoot "templates\auto-detect\cli.ts"), "setup", $targetDir, "--mode", $smartMode)
    if ($strategy -eq "backup") {
        $smartArgs += "--backup"
    }
    if ($smartShallow) {
        $smartArgs += "--shallow"
    }

    $localTsx = Join-Path $repoRoot "node_modules\.bin\tsx.cmd"
    if (Test-Path -LiteralPath $localTsx -PathType Leaf) {
        & $localTsx @smartArgs
        exit $LASTEXITCODE
    }

    $npx = Get-Command npx -ErrorAction SilentlyContinue
    if (-not $npx) {
        throw "Smart mode requires local dependencies or npm/npx."
    }
    & $($npx.Source) tsx @smartArgs
    exit $LASTEXITCODE
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
    if (Test-Path -LiteralPath $cursorTemplateDir -PathType Container) {
        Sync-Directory $cursorTemplateDir (Join-Path $targetDir ".cursor\rules")
    }
    else {
        Write-Host "SKIP Cursor mirror: no bundled cursor template in this repository"
    }
}

if ($withKiro) {
    Sync-Directory $sourceSteeringDir (Join-Path $targetDir ".kiro\steering")
}

Write-Host ""
Write-Host "Installed Harness Coding Protocol v2 into: $targetDir"
Write-Host "Strategy: $strategy"
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
