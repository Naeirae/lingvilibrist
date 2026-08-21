param(
  [Parameter(Mandatory = $true)]
  [ValidatePattern('^[a-p]{32}$')]
  [string]$ExtensionId,

  [string]$HostPath = ''
)

$ErrorActionPreference = 'Stop'
$HostName = 'com.lingvilibrist.local_nlp'

if (-not $HostPath) {
  $command = Get-Command 'lingvilibrist-native-host.exe' -ErrorAction SilentlyContinue
  if (-not $command) {
    $command = Get-Command 'lingvilibrist-native-host' -ErrorAction SilentlyContinue
  }
  if (-not $command) {
    throw 'lingvilibrist-native-host is not installed. Run: py -m pip install .\python\nlp'
  }
  $HostPath = $command.Source
}

$HostPath = [System.IO.Path]::GetFullPath($HostPath)
if (-not (Test-Path -LiteralPath $HostPath)) {
  throw "Native host executable not found: $HostPath"
}

$InstallDir = Join-Path $env:LOCALAPPDATA 'Lingvilibrist\native-host'
New-Item -ItemType Directory -Force -Path $InstallDir | Out-Null
$ManifestPath = Join-Path $InstallDir "$HostName.json"

$manifest = [ordered]@{
  name = $HostName
  description = 'Lingvilibrist local morphology host'
  path = $HostPath
  type = 'stdio'
  allowed_origins = @("chrome-extension://$ExtensionId/")
}
$manifest | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath $ManifestPath -Encoding UTF8

$ChromeKey = "HKCU:\Software\Google\Chrome\NativeMessagingHosts\$HostName"
New-Item -Force -Path $ChromeKey | Out-Null
Set-Item -LiteralPath $ChromeKey -Value $ManifestPath

Write-Host "Installed $HostName"
Write-Host "Manifest: $ManifestPath"
Write-Host "Host: $HostPath"
Write-Host "Allowed extension: $ExtensionId"
Write-Host 'Reload Lingvilibrist on chrome://extensions and press "Check local NLP".'
