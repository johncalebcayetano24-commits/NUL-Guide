[CmdletBinding(SupportsShouldProcess = $true)]
param(
    [Parameter(Mandatory = $true, Position = 0)]
    [ValidatePattern('^[A-Za-z0-9_-]+$')]
    [ValidateLength(1, 64)]
    [string]$GroupNumber,

    [switch]$Overwrite
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$workspaceRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$workspaceBoundary = $workspaceRoot.TrimEnd([char[]]@('\', '/')) + [System.IO.Path]::DirectorySeparatorChar

function Assert-WorkspaceChild {
    param([Parameter(Mandatory = $true)][string]$TargetPath)

    $absolutePath = [System.IO.Path]::GetFullPath($TargetPath)
    if (-not $absolutePath.StartsWith($workspaceBoundary, [System.StringComparison]::OrdinalIgnoreCase)) {
        throw "Packaging path must stay inside the project workspace: $absolutePath"
    }
    return $absolutePath
}

$submissionDirectory = Assert-WorkspaceChild (Join-Path $workspaceRoot 'submission')
$archivePath = Assert-WorkspaceChild (Join-Path $submissionDirectory "${GroupNumber}_finals.zip")
$stagingDirectory = Assert-WorkspaceChild (Join-Path $submissionDirectory ('.packaging-' + [guid]::NewGuid().ToString('N')))
$packageDirectory = Assert-WorkspaceChild (Join-Path $stagingDirectory 'NUL-Guide')

if ((Test-Path -LiteralPath $archivePath) -and -not $Overwrite) {
    throw "The archive already exists: $archivePath. Add -Overwrite to replace it intentionally."
}

$requiredFiles = @(
    'index.html', 'package.json', 'package-lock.json', 'vite.config.js', 'README.md',
    'src/main.jsx', 'src/App.jsx', 'src/state/AppContext.jsx', 'src/data/design-assets.json',
    'docs/DEMO_WALKTHROUGH.md', 'scripts/package-submission.ps1'
)
foreach ($relativePath in $requiredFiles) {
    $sourcePath = Assert-WorkspaceChild (Join-Path $workspaceRoot $relativePath)
    if (-not (Test-Path -LiteralPath $sourcePath -PathType Leaf)) {
        throw "A required project file is missing: $relativePath"
    }
}
foreach ($directoryName in @('src', 'public/assets', 'docs', 'tests', 'scripts')) {
    if (-not (Test-Path -LiteralPath (Join-Path $workspaceRoot $directoryName) -PathType Container)) {
        throw "A required project directory is missing: $directoryName"
    }
}

$sourceFiles = New-Object 'System.Collections.Generic.List[System.IO.FileInfo]'
$topLevelFiles = @(
    '.gitignore', 'index.html', 'package.json', 'package-lock.json', 'vite.config.js', 'README.md',
    'LICENSE', 'LICENSE.md', 'LICENSE.txt', 'NOTICE', 'playwright.config.js', 'playwright.config.mjs'
)
foreach ($filename in $topLevelFiles) {
    $sourcePath = Assert-WorkspaceChild (Join-Path $workspaceRoot $filename)
    if (Test-Path -LiteralPath $sourcePath -PathType Leaf) {
        $sourceFiles.Add((Get-Item -LiteralPath $sourcePath -Force))
    }
}

foreach ($directoryName in @('src', 'public', 'docs', 'tests', 'scripts', 'qa', '.github')) {
    $sourceDirectory = Assert-WorkspaceChild (Join-Path $workspaceRoot $directoryName)
    if (-not (Test-Path -LiteralPath $sourceDirectory -PathType Container)) { continue }

    foreach ($source in (Get-ChildItem -LiteralPath $sourceDirectory -Recurse -File -Force)) {
        $relativePath = $source.FullName.Substring($workspaceBoundary.Length)
        if ($relativePath -match '(^|[\\/])(node_modules|dist|\.vscode|\.git|design-reference|submission|screenshots|playwright-report|test-results)([\\/]|$)') { continue }
        if ($source.Extension -ieq '.zip') { continue }
        if ($source.Name -like '.env*' -and $source.Name -ne '.env.example') { continue }
        if ($directoryName -eq 'qa' -and $source.Extension -notin @('.js', '.mjs', '.cjs', '.ts')) { continue }
        if (($source.Attributes -band [System.IO.FileAttributes]::ReparsePoint) -ne 0) {
            throw "Copy real source files into the project before packaging; linked file found: $relativePath"
        }
        [void](Assert-WorkspaceChild $source.FullName)
        $sourceFiles.Add($source)
    }
}

if (-not $PSCmdlet.ShouldProcess($archivePath, "Create source ZIP containing $($sourceFiles.Count) project files")) {
    Write-Output "Packaging preview: $($sourceFiles.Count) files selected; archive would be $archivePath"
    return
}

try {
    [void](New-Item -ItemType Directory -Path $packageDirectory -Force)
    $expectedEntries = New-Object 'System.Collections.Generic.List[string]'

    foreach ($source in $sourceFiles) {
        $relativePath = $source.FullName.Substring($workspaceBoundary.Length)
        $destination = Assert-WorkspaceChild (Join-Path $packageDirectory $relativePath)
        [void](New-Item -ItemType Directory -Path ([System.IO.Path]::GetDirectoryName($destination)) -Force)
        Copy-Item -LiteralPath $source.FullName -Destination $destination
        $expectedEntries.Add('NUL-Guide/' + $relativePath.Replace('\', '/'))
    }

    Compress-Archive -LiteralPath $packageDirectory -DestinationPath $archivePath -CompressionLevel Optimal -Force:$Overwrite

    Add-Type -AssemblyName System.IO.Compression.FileSystem
    $archive = [System.IO.Compression.ZipFile]::OpenRead($archivePath)
    try {
        $entryNames = New-Object 'System.Collections.Generic.HashSet[string]' ([System.StringComparer]::OrdinalIgnoreCase)
        foreach ($entry in $archive.Entries) { [void]$entryNames.Add($entry.FullName.Replace('\', '/')) }
        foreach ($expectedEntry in $expectedEntries) {
            if (-not $entryNames.Contains($expectedEntry)) { throw "Archive verification failed; missing entry: $expectedEntry" }
        }
    }
    finally {
        $archive.Dispose()
    }

    $archiveFile = Get-Item -LiteralPath $archivePath
    Write-Output "Created and verified: $($archiveFile.FullName)"
    Write-Output "Source files: $($sourceFiles.Count); ZIP size: $($archiveFile.Length) bytes; top-level folder: NUL-Guide"
    Write-Output 'After extraction: npm ci, npm test, npm run build, npm run dev.'
}
finally {
    # Re-check the generated absolute target before recursively removing this run's staging folder.
    $verifiedStagingPath = Assert-WorkspaceChild $stagingDirectory
    if ([System.IO.Path]::GetFileName($verifiedStagingPath) -notmatch '^\.packaging-[a-f0-9]{32}$') {
        throw "Refusing to remove an unexpected staging path: $verifiedStagingPath"
    }
    if (Test-Path -LiteralPath $verifiedStagingPath -PathType Container) {
        Remove-Item -LiteralPath $verifiedStagingPath -Recurse -Force
    }
}
