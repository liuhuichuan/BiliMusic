$androidSdk = "E:\Android\Sdk"

if (-not (Test-Path -LiteralPath $androidSdk)) {
  throw "Android SDK not found: $androidSdk"
}

$jdkCandidates = @(
  [Environment]::GetEnvironmentVariable("JAVA_HOME", "Machine")
  Get-ChildItem "C:\Program Files\Eclipse Adoptium" -Directory -Filter "jdk-21*" -ErrorAction SilentlyContinue |
    Sort-Object Name -Descending |
    Select-Object -ExpandProperty FullName
) | Where-Object { $_ -and (Test-Path -LiteralPath $_) } | Select-Object -Unique

$compatibleJdk = $jdkCandidates | Where-Object {
  $releaseFile = Join-Path $_ "release"
  (Test-Path -LiteralPath $releaseFile) -and
    ((Get-Content -Raw -LiteralPath $releaseFile) -match 'JAVA_VERSION="21(?:\.|\")')
} | Select-Object -First 1

if (-not $compatibleJdk) {
  throw "JDK 21 was not found. Install Temurin 21 and run this script again."
}

$androidNdk = Get-ChildItem (Join-Path $androidSdk "ndk") -Directory -ErrorAction Stop |
  Sort-Object { [version]$_.Name } |
  Select-Object -Last 1

if (-not $androidNdk) {
  throw "Android NDK (Side by side) is not installed."
}

$persistentVariables = @{
  JAVA_HOME = $compatibleJdk
  ANDROID_HOME = $androidSdk
  NDK_HOME = $androidNdk.FullName
}

foreach ($entry in $persistentVariables.GetEnumerator()) {
  [Environment]::SetEnvironmentVariable($entry.Key, $entry.Value, "User")
  Set-Item -Path "Env:\$($entry.Key)" -Value $entry.Value
}

$pathEntries = @(
  (Join-Path $compatibleJdk "bin")
  (Join-Path $androidSdk "platform-tools")
  (Join-Path $androidSdk "cmdline-tools\latest\bin")
)

$userPath = [Environment]::GetEnvironmentVariable("Path", "User")
$newUserPath = (($pathEntries + ($userPath -split ";")) |
  Where-Object { $_ } |
  Select-Object -Unique) -join ";"
[Environment]::SetEnvironmentVariable("Path", $newUserPath, "User")

$env:Path = (($pathEntries + ($env:Path -split ";")) |
  Where-Object { $_ } |
  Select-Object -Unique) -join ";"

Write-Host "Android development environment updated:"
Write-Host "  JAVA_HOME=$compatibleJdk"
Write-Host "  ANDROID_HOME=$androidSdk"
Write-Host "  NDK_HOME=$($androidNdk.FullName)"
Write-Host "This PowerShell session is ready. Reopen any other existing terminals."
