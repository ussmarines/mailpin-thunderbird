[CmdletBinding()]
param([switch]$Force)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$ToolRoot = Join-Path $env:LOCALAPPDATA 'ussmarines-security-tools'
$DownloadRoot = Join-Path $ToolRoot 'downloads'
New-Item -ItemType Directory -Force -Path $ToolRoot, $DownloadRoot | Out-Null

function Get-Sha256([string]$Path) {
    return (Get-FileHash -Algorithm SHA256 -Path $Path).Hash.ToLowerInvariant()
}
function Assert-Hash([string]$Path, [string]$Expected) {
    $actual = Get-Sha256 $Path
    if ($actual -ne $Expected.ToLowerInvariant()) {
        throw "SHA-256 invalide pour $([IO.Path]::GetFileName($Path)). Attendu: $Expected ; obtenu: $actual"
    }
}
function Get-VerifiedFile([string]$Uri, [string]$Destination, [string]$Sha256) {
    if ($Force -or -not (Test-Path $Destination)) {
        Invoke-WebRequest -UseBasicParsing -Uri $Uri -OutFile $Destination
    }
    Assert-Hash -Path $Destination -Expected $Sha256
}
function Assert-ToolChildPath([string]$Path) {
    $resolvedRoot = [IO.Path]::GetFullPath($ToolRoot).TrimEnd([IO.Path]::DirectorySeparatorChar, [IO.Path]::AltDirectorySeparatorChar) + [IO.Path]::DirectorySeparatorChar
    $resolvedPath = [IO.Path]::GetFullPath($Path)
    if (-not $resolvedPath.StartsWith($resolvedRoot, [StringComparison]::OrdinalIgnoreCase)) {
        throw "Chemin d’outil hors racine refusé: $resolvedPath"
    }
}
function Remove-ToolDirectory([string]$Path) {
    Assert-ToolChildPath -Path $Path
    if (Test-Path -LiteralPath $Path) { Remove-Item -LiteralPath $Path -Recurse -Force }
}
function Expand-CleanArchive([string]$Archive, [string]$Destination) {
    Remove-ToolDirectory -Path $Destination
    New-Item -ItemType Directory -Force -Path $Destination | Out-Null
    Expand-Archive -Path $Archive -DestinationPath $Destination -Force
}

Write-Host 'Installation locale et vérifiée des outils de sécurité...' -ForegroundColor Cyan

$OpenGrepVersion = '1.22.0'
$OpenGrepArchive = Join-Path $DownloadRoot 'opengrep-core_windows_x86.zip'
Get-VerifiedFile -Uri "https://github.com/opengrep/opengrep/releases/download/v$OpenGrepVersion/opengrep-core_windows_x86.zip" -Destination $OpenGrepArchive -Sha256 '53d87310653faf591d410389e04335ca3a2558fe72c3f5a949cd9a71628329e7'
$OpenGrepRoot = Join-Path $ToolRoot "opengrep-$OpenGrepVersion"
Expand-CleanArchive -Archive $OpenGrepArchive -Destination $OpenGrepRoot
$OpenGrepExe = Get-ChildItem -Path $OpenGrepRoot -Recurse -File -Filter 'opengrep.exe' | Select-Object -First 1
if (-not $OpenGrepExe) {
    $OpenGrepExe = Get-ChildItem -Path $OpenGrepRoot -Recurse -File -Filter 'opengrep-core.exe' | Select-Object -First 1
}
if (-not $OpenGrepExe) { throw 'Exécutable Opengrep introuvable.' }

$TrivyVersion = '0.70.0'
$TrivyChecksumFile = Join-Path $DownloadRoot "trivy_${TrivyVersion}_checksums.txt"
Get-VerifiedFile -Uri "https://github.com/aquasecurity/trivy/releases/download/v$TrivyVersion/trivy_${TrivyVersion}_checksums.txt" -Destination $TrivyChecksumFile -Sha256 'c45281240bb9211ea9e830fc0bf5cf8acf7c0ca830feb64ac8a0aa932c5c92d9'
$TrivyLine = Get-Content $TrivyChecksumFile | Where-Object { $_ -match '(?i)windows-64bit\.zip$' } | Select-Object -First 1
if (-not $TrivyLine) { throw 'Archive Windows x64 de Trivy introuvable.' }
$TrivyParts = $TrivyLine -split '\s+', 2
$TrivyExpected = $TrivyParts[0].ToLowerInvariant()
$TrivyAsset = $TrivyParts[1].TrimStart('*')
$TrivyArchive = Join-Path $DownloadRoot $TrivyAsset
Get-VerifiedFile -Uri "https://github.com/aquasecurity/trivy/releases/download/v$TrivyVersion/$TrivyAsset" -Destination $TrivyArchive -Sha256 $TrivyExpected
$TrivyRoot = Join-Path $ToolRoot "trivy-$TrivyVersion"
Expand-CleanArchive -Archive $TrivyArchive -Destination $TrivyRoot
$TrivyExe = Get-ChildItem -Path $TrivyRoot -Recurse -File -Filter 'trivy.exe' | Select-Object -First 1
if (-not $TrivyExe) { throw 'Exécutable Trivy introuvable.' }

$GitleaksVersion = '8.30.1'
$GitleaksChecksumFile = Join-Path $DownloadRoot "gitleaks_${GitleaksVersion}_checksums.txt"
Get-VerifiedFile -Uri "https://github.com/gitleaks/gitleaks/releases/download/v$GitleaksVersion/gitleaks_${GitleaksVersion}_checksums.txt" -Destination $GitleaksChecksumFile -Sha256 '061476c21adaf5441516f96f185c1a4706a83cd6329b9b38762271b3d4a52fae'
$GitleaksPattern = if ($env:PROCESSOR_ARCHITECTURE -eq 'ARM64') { '(?i)windows_arm64\.zip$' } else { '(?i)windows_x64\.zip$' }
$GitleaksLine = Get-Content $GitleaksChecksumFile | Where-Object { $_ -match $GitleaksPattern } | Select-Object -First 1
if (-not $GitleaksLine) { throw 'Archive Windows compatible de Gitleaks introuvable.' }
$GitleaksParts = $GitleaksLine -split '\s+', 2
$GitleaksExpected = $GitleaksParts[0].ToLowerInvariant()
$GitleaksAsset = $GitleaksParts[1].TrimStart('*')
$GitleaksArchive = Join-Path $DownloadRoot $GitleaksAsset
Get-VerifiedFile -Uri "https://github.com/gitleaks/gitleaks/releases/download/v$GitleaksVersion/$GitleaksAsset" -Destination $GitleaksArchive -Sha256 $GitleaksExpected
$GitleaksRoot = Join-Path $ToolRoot "gitleaks-$GitleaksVersion"
Expand-CleanArchive -Archive $GitleaksArchive -Destination $GitleaksRoot
$GitleaksExe = Get-ChildItem -Path $GitleaksRoot -Recurse -File -Filter 'gitleaks.exe' | Select-Object -First 1
if (-not $GitleaksExe) { throw 'Exécutable Gitleaks introuvable.' }

if ($env:PROCESSOR_ARCHITECTURE -ne 'AMD64') {
    throw 'L’installation vérifiée de zizmor est actuellement prévue pour Windows x64 (AMD64).'
}
if (-not (Get-Command py -ErrorAction SilentlyContinue)) {
    throw 'Le lanceur Python officiel « py » est requis.'
}
$ZizmorVersion = '1.26.1'
$ZizmorRoot = Join-Path $ToolRoot "zizmor-$ZizmorVersion"
$ZizmorWheelDir = Join-Path $DownloadRoot 'zizmor-wheel'
if ($Force) { Remove-ToolDirectory -Path $ZizmorRoot }
if (-not (Test-Path $ZizmorRoot)) {
    & py -3.12 -m venv $ZizmorRoot
    if ($LASTEXITCODE -ne 0) { & py -3 -m venv $ZizmorRoot }
}
New-Item -ItemType Directory -Force -Path $ZizmorWheelDir | Out-Null
Get-ChildItem -LiteralPath $ZizmorWheelDir -File -Filter '*.whl' -ErrorAction SilentlyContinue | Remove-Item -Force
& (Join-Path $ZizmorRoot 'Scripts\python.exe') -m pip download --disable-pip-version-check --no-deps --only-binary=:all: --dest $ZizmorWheelDir "zizmor==$ZizmorVersion"
if ($LASTEXITCODE -ne 0) { throw 'Téléchargement de zizmor impossible.' }
$ZizmorWheel = Get-ChildItem -Path $ZizmorWheelDir -File -Filter 'zizmor-1.26.1-py3-none-win_amd64.whl' | Select-Object -First 1
if (-not $ZizmorWheel) { throw 'Roue Windows x64 de zizmor introuvable.' }
Assert-Hash -Path $ZizmorWheel.FullName -Expected '0a05acf6068609fb6df3b137276cf18a686226a1e0e207941cb34a85929f16cf'
& (Join-Path $ZizmorRoot 'Scripts\python.exe') -m pip install --disable-pip-version-check --no-index --force-reinstall $ZizmorWheel.FullName
if ($LASTEXITCODE -ne 0) { throw 'Installation de zizmor impossible.' }

$Manifest = [ordered]@{
    installedAtUtc = [DateTime]::UtcNow.ToString('o')
    toolRoot = $ToolRoot
    tools = [ordered]@{
        opengrep = [ordered]@{ version = $OpenGrepVersion; executable = $OpenGrepExe.FullName }
        trivy = [ordered]@{ version = $TrivyVersion; executable = $TrivyExe.FullName }
        gitleaks = [ordered]@{ version = $GitleaksVersion; executable = $GitleaksExe.FullName }
        zizmor = [ordered]@{ version = $ZizmorVersion; executable = (Join-Path $ZizmorRoot 'Scripts\zizmor.exe') }
    }
}
$ManifestPath = Join-Path $ToolRoot 'installed-tools.json'
$Manifest | ConvertTo-Json -Depth 6 | Set-Content -Encoding UTF8 $ManifestPath

Write-Host 'Installation terminée.' -ForegroundColor Green
Write-Host "Manifest partagé: $ManifestPath"
