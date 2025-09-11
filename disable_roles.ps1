# PowerShell script to rename role directories to prevent Next.js from building them
$roleDirs = @(
    "(main-director)",
    "(support-director)", 
    "(main-hr)",
    "(support-hr)",
    "(main-admission)",
    "(support-admission)",
    "(doctor)",
    "(chief)",
    "(parent)"
)

$apiRoleDirs = @(
    "main-director",
    "main-director-dashboard",
    "support-director",
    "main-hr", 
    "support-hr",
    "main-admission",
    "support-admission",
    "doctor",
    "chief",
    "parent-gradebook",
    "parent-homework",
    "parent-notifications", 
    "parent-timetables",
    "parents",
    "check-parent-id"
)

# Rename frontend role directories (add .disabled suffix)
foreach ($roleDir in $roleDirs) {
    $sourcePath = "src\app\$roleDir"
    $targetPath = "src\app\$roleDir.disabled"
    if (Test-Path $sourcePath) {
        if (Test-Path $targetPath) {
            Remove-Item $targetPath -Recurse -Force
        }
        Rename-Item $sourcePath $targetPath
        Write-Host "Renamed: $sourcePath -> $targetPath"
    }
}

# Rename API role directories (add .disabled suffix)
foreach ($apiRoleDir in $apiRoleDirs) {
    $sourcePath = "src\app\api\$apiRoleDir"
    $targetPath = "src\app\api\$apiRoleDir.disabled"
    if (Test-Path $sourcePath) {
        if (Test-Path $targetPath) {
            Remove-Item $targetPath -Recurse -Force
        }
        Rename-Item $sourcePath $targetPath
        Write-Host "Renamed: $sourcePath -> $targetPath"
    }
}

Write-Host "Role directories disabled! Next.js will now only build admin, teacher, and student panels."
