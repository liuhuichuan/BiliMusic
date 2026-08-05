$sdk = "E:\Android\Sdk"
$ndk = Get-ChildItem "$sdk\ndk" -Directory |
  Sort-Object Name |
  Select-Object -Last 1

[Environment]::SetEnvironmentVariable(
  "JAVA_HOME",
  "E:\Program Files\Android\Android Studio\jbr",
  "User"
)

[Environment]::SetEnvironmentVariable(
  "ANDROID_HOME",
  $sdk,
  "User"
)

[Environment]::SetEnvironmentVariable(
  "NDK_HOME",
  $ndk.FullName,
  "User"
)

$userPath = [Environment]::GetEnvironmentVariable("Path", "User")
$addPath = @(
  "$sdk\platform-tools",
  "$sdk\cmdline-tools\latest\bin"
)

$newPath = (($addPath + ($userPath -split ";")) |
  Where-Object { $_ } |
  Select-Object -Unique) -join ";"

[Environment]::SetEnvironmentVariable("Path", $newPath, "User")