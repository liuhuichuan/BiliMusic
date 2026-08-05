# Windows 下搭建 Tauri 2 + React Android 开发环境

本文记录在 Windows 上使用 Tauri 2、React 和 TypeScript 开发 Android App 的环境准备步骤，以及实际搭建过程中遇到的版本兼容问题。

## 推荐版本组合

首次搭建建议以稳定和兼容为优先：

| 组件 | 推荐选择 |
| --- | --- |
| Node.js | 当前 LTS 版本；Node.js 22 可用 |
| Rust | 通过 `rustup` 安装的 stable MSVC 工具链 |
| Gradle JVM | JDK 21 |
| Android Studio Runtime | 使用 Android Studio 自带的 JBR 即可 |
| Android SDK Platform | Android 16 / API 36 必装；API 37 可选 |
| Android SDK Build-Tools | 36.0.0；使用 API 37 时再安装最新 37.x.x |
| NDK | NDK (Side by side) 的最新稳定版，不选择 Beta/RC |
| 模拟器镜像 | API 36、Google Play、x86_64 |

> 从 2026 年 8 月 31 日起，Google Play 的新应用和应用更新需要以 Android 16（API 36）或更高版本为目标平台。实际项目仍应以 Tauri 生成的 Gradle 配置为准；如果构建提示缺少 `android-XX`，在 SDK Manager 中补装对应版本即可。

## 1. 检查已有环境

在 PowerShell 中执行：

```powershell
node --version
npm --version
rustc --version
cargo --version
rustup show active-toolchain
java -version
```

也可以确认命令实际来自哪个目录：

```powershell
Get-Command node
Get-Command rustc
Get-Command cargo
Get-Command java
Get-Command adb -ErrorAction SilentlyContinue
Get-Command sdkmanager -ErrorAction SilentlyContinue
```

Rust 正常安装后，应当可以看到类似结果：

```text
rustc 1.x.x
cargo 1.x.x
stable-x86_64-pc-windows-msvc (default)
```

## 2. 安装 Android Studio

可以从 Android 官方网站下载安装，也可以通过 winget：

```powershell
winget install --id Google.AndroidStudio --exact `
  --accept-package-agreements `
  --accept-source-agreements
```

首次启动 Android Studio 时选择 Standard 配置，然后进入：

```text
Settings
→ Languages & Frameworks
→ Android SDK
```

在 `SDK Platforms` 中安装：

- Android 16 / API 36。
- Android 17 / API 37 可以同时安装；如果本机仍将其标为 Preview，则暂时不要作为唯一的主开发平台。
- 如果需要模拟器，勾选 API 36 对应的 `Google Play x86_64 System Image`。

在 `SDK Tools` 中安装：

- Android SDK Platform-Tools
- Android SDK Build-Tools 36.0.0
- Android SDK Command-line Tools (latest)
- NDK (Side by side) 的最新稳定版
- Android Emulator（使用模拟器时）

不需要安装所有历史 SDK Platform。缺少哪个版本时，再按 Gradle 的错误提示补装。

## 3. 正确区分 Android Studio JBR 和 Gradle JVM

Android Studio 自带的 JBR 用于运行 IDE；Gradle JVM 用于运行项目的 Gradle 构建。这两个版本可以不同。

本项目生成的 Android 工程使用 Gradle 8.14.3：

```text
Gradle 8.14.3 最多可以运行在 JVM 24 上，不能运行在 JVM 25 上。
```

如果 Android Studio 自带的是 JBR 25，Android Studio 本身仍可正常使用，但项目的 Gradle JDK 应选择 JDK 21：

```text
Settings
→ Build, Execution, Deployment
→ Build Tools
→ Gradle
→ Gradle JDK
→ Temurin 21
```

典型错误如下：

```text
The project's Gradle version Gradle 8.14.3 is incompatible with the
Gradle JVM version 25. To fix this, select a JVM version that is at
least 8 and at most 24.
```

解决方案是将项目的 Gradle JDK 改为 21，而不是为了使用 JDK 25 单独修改 `gradle-wrapper.properties`。Gradle、Android Gradle Plugin 和 Tauri 模板之间存在版本约束，应当一起升级。

## 4. 配置环境变量

先确认 Android Studio、SDK、NDK 和 JDK 21 已经安装。以下示例使用本机安装的 Temurin 21；如果安装目录不同，需要修改 `$jdkHome`。

```powershell
$sdk = "$env:LOCALAPPDATA\Android\Sdk"
$jdkHome = "C:\Program Files\Eclipse Adoptium\jdk-21.0.11.10-hotspot"

if (-not (Test-Path $sdk)) {
  throw "Android SDK 不存在：$sdk"
}

if (-not (Test-Path $jdkHome)) {
  throw "JDK 21 不存在：$jdkHome"
}

$ndk = Get-ChildItem "$sdk\ndk" -Directory -ErrorAction Stop |
  Sort-Object { [version]$_.Name } |
  Select-Object -Last 1

if (-not $ndk) {
  throw "尚未安装 NDK (Side by side)"
}

[Environment]::SetEnvironmentVariable("JAVA_HOME", $jdkHome, "User")
[Environment]::SetEnvironmentVariable("ANDROID_HOME", $sdk, "User")
[Environment]::SetEnvironmentVariable("NDK_HOME", $ndk.FullName, "User")

$userPath = [Environment]::GetEnvironmentVariable("Path", "User")
$addPath = @(
  "$sdk\platform-tools",
  "$sdk\cmdline-tools\latest\bin"
)

$newPath = (($addPath + ($userPath -split ";")) |
  Where-Object { $_ } |
  Select-Object -Unique) -join ";"

[Environment]::SetEnvironmentVariable("Path", $newPath, "User")
```

该脚本设置当前 Windows 用户的：

- `JAVA_HOME`：JDK 21，而不是 Android Studio 的 JBR 25。
- `ANDROID_HOME`：标准 Android SDK 目录。
- `NDK_HOME`：已安装的最高版本稳定 NDK。
- `Path`：加入 `adb` 和 `sdkmanager`。

设置完成后关闭并重新打开 PowerShell、Android Studio 和编辑器。也可以仅刷新当前 PowerShell：

```powershell
[Environment]::GetEnvironmentVariables("User").GetEnumerator() |
  ForEach-Object {
    Set-Item -Path "Env:\$($_.Key)" -Value $_.Value
  }
```

## 5. 安装 Rust Android 编译目标

```powershell
rustup target add `
  aarch64-linux-android `
  armv7-linux-androideabi `
  i686-linux-android `
  x86_64-linux-android
```

验证：

```powershell
rustup target list --installed
```

应当包含：

```text
aarch64-linux-android
armv7-linux-androideabi
i686-linux-android
x86_64-linux-android
x86_64-pc-windows-msvc
```

## 6. 创建 Tauri + React 项目

在计划存放项目的父目录中执行：

```powershell
npm create tauri-app@latest BiliMusic
```

交互选项建议选择：

```text
TypeScript / JavaScript
npm
React
TypeScript
```

进入生成的项目目录后再安装依赖：

```powershell
cd .\BiliMusic
npm install
npm run tauri android init
```

`npm install` 必须在包含 `package.json` 的目录中运行。可以先检查：

```powershell
Test-Path .\package.json
```

返回 `True` 后再执行 npm 命令。

## 7. 启动 Android App

先在 Android Studio 的 Device Manager 中启动模拟器，或者连接已启用 USB 调试的 Android 设备，然后检查：

```powershell
adb devices
```

在包含 `package.json` 的项目目录运行：

```powershell
npm run tauri android dev
```

也可以让 Tauri 打开生成的 Android Studio 工程：

```powershell
npm run tauri android dev -- --open
```

## 8. 完整验证清单

重新打开 PowerShell 后执行：

```powershell
$env:JAVA_HOME
$env:ANDROID_HOME
$env:NDK_HOME

java -version
adb version
sdkmanager --version

Get-Command java
Get-Command adb
Get-Command sdkmanager

rustup target list --installed
```

预期结果：

- `java -version` 显示 Java 21。
- `adb` 指向 `%LOCALAPPDATA%\Android\Sdk\platform-tools\adb.exe`。
- `sdkmanager` 指向 `%LOCALAPPDATA%\Android\Sdk\cmdline-tools\latest\bin\sdkmanager.bat`。
- `ANDROID_HOME`、`NDK_HOME` 指向实际存在的目录。
- 四个 Rust Android target 均已安装。

## 9. 常见问题

### npm 提示找不到 package.json

```text
npm error code ENOENT
npm error Could not read package.json
```

原因是当前目录不是 Node/Tauri 项目。进入实际项目目录后再运行：

```powershell
cd E:\BiliMusic\BiliMusic
Test-Path .\package.json
npm install
```

### Gradle 8.14.3 与 JVM 25 不兼容

保留 JBR 25 用于运行 Android Studio，将项目 Gradle JDK 和 `JAVA_HOME` 设置为 JDK 21。

### adb 指向 AOSP 源码树

如果 `Get-Command adb` 指向类似下面的目录：

```text
D:\workspace\aosp_workspace\...\platform-tools\adb.exe
```

说明 PATH 优先使用了 AOSP 自带的 adb。确保标准 SDK 的 `platform-tools` 位于用户 PATH 前部，然后重启终端：

```text
%LOCALAPPDATA%\Android\Sdk\platform-tools
```

### 找不到 sdkmanager

确认已经在 Android Studio 的 SDK Tools 中安装 `Android SDK Command-line Tools (latest)`，并确认下面的目录已加入 PATH：

```text
%LOCALAPPDATA%\Android\Sdk\cmdline-tools\latest\bin
```

### Gradle 提示缺少 android-XX

在 Android Studio 的 SDK Manager 中安装错误信息指定的 SDK Platform。例如：

```text
Failed to find target with hash string 'android-35'
```

此时补装 Android SDK Platform 35 即可。

## 参考资料

- [Tauri prerequisites](https://v2.tauri.app/start/prerequisites/)
- [Tauri create project](https://v2.tauri.app/start/create-project/)
- [Tauri mobile development](https://v2.tauri.app/develop/)
- [Android Studio](https://developer.android.com/studio)
- [Android 17 SDK setup](https://developer.android.com/about/versions/17/setup-sdk)
- [Google Play target API requirements](https://developer.android.com/google/play/requirements/target-sdk)
