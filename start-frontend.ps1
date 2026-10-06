# Music Library Frontend Startup Script
# Windows 11 PowerShell - One-click frontend startup

param(
    [switch]$Verbose
)

$ErrorActionPreference = "Stop"
$FrontendPath = Join-Path $PSScriptRoot "frontend"

Write-Host "🚀 Starting Music Library Frontend..." -ForegroundColor Green
Write-Host "Frontend Path: $FrontendPath" -ForegroundColor Gray

# Change to frontend directory
if (-not (Test-Path $FrontendPath)) {
    Write-Host "❌ Frontend directory not found: $FrontendPath" -ForegroundColor Red
    exit 1
}

Set-Location $FrontendPath
Write-Host "📁 Changed to frontend directory" -ForegroundColor Gray

# Check and create .env file if needed
$EnvFile = Join-Path $FrontendPath ".env"
$EnvExampleFile = Join-Path $FrontendPath ".env.example"

if (-not (Test-Path $EnvFile)) {
    Write-Host "🔧 Creating .env file..." -ForegroundColor Yellow
    
    if (Test-Path $EnvExampleFile) {
        Copy-Item $EnvExampleFile $EnvFile
        Write-Host "✅ Copied .env.example to .env" -ForegroundColor Green
    } else {
        # Create basic .env file
        $EnvContent = @"
# API Configuration
VITE_API_BASE_URL=http://localhost:5000

# Development Configuration
VITE_APP_NAME="Music Catalog Manager"
VITE_APP_VERSION=1.0.0
"@
        Set-Content -Path $EnvFile -Value $EnvContent -Encoding UTF8
        Write-Host "✅ Created .env file with default configuration" -ForegroundColor Green
    }
} else {
    Write-Host "✅ .env file already exists" -ForegroundColor Green
}

# Verify .env content
try {
    $EnvContent = Get-Content $EnvFile -Raw
    $HasApiUrl = $EnvContent -match "VITE_API_(BASE_)?URL"
    
    if (-not $HasApiUrl) {
        Write-Host "⚠️  Adding API URL to .env file..." -ForegroundColor Yellow
        Add-Content -Path $EnvFile -Value "`nVITE_API_BASE_URL=http://localhost:5000"
        Write-Host "✅ Added VITE_API_BASE_URL to .env" -ForegroundColor Green
    }
    
    if ($Verbose) {
        Write-Host "📄 .env file content:" -ForegroundColor Gray
        Get-Content $EnvFile | ForEach-Object { Write-Host "   $_" -ForegroundColor DarkGray }
    }
} catch {
    Write-Host "⚠️  Could not verify .env content: $_" -ForegroundColor Yellow
}

# Check if package.json exists
if (-not (Test-Path "package.json")) {
    Write-Host "❌ package.json not found in frontend directory" -ForegroundColor Red
    exit 1
}

# Check if node_modules exists, run npm install if needed
$NodeModulesPath = Join-Path $FrontendPath "node_modules"

if (-not (Test-Path $NodeModulesPath)) {
    Write-Host "📦 node_modules not found - running npm install..." -ForegroundColor Yellow
    
    try {
        $InstallProcess = Start-Process -FilePath "npm" -ArgumentList "install" -Wait -PassThru -NoNewWindow
        
        if ($InstallProcess.ExitCode -eq 0) {
            Write-Host "✅ npm install completed successfully" -ForegroundColor Green
        } else {
            Write-Host "❌ npm install failed with exit code: $($InstallProcess.ExitCode)" -ForegroundColor Red
            exit 1
        }
    } catch {
        Write-Host "❌ Failed to run npm install: $_" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "✅ node_modules directory exists" -ForegroundColor Green
    
    # Check if package-lock.json is newer than node_modules (optional optimization)
    $PackageLock = Join-Path $FrontendPath "package-lock.json"
    if (Test-Path $PackageLock) {
        $PackageLockTime = (Get-Item $PackageLock).LastWriteTime
        $NodeModulesTime = (Get-Item $NodeModulesPath).LastWriteTime
        
        if ($PackageLockTime -gt $NodeModulesTime) {
            Write-Host "📦 package-lock.json is newer - running npm install..." -ForegroundColor Yellow
            
            try {
                $InstallProcess = Start-Process -FilePath "npm" -ArgumentList "install" -Wait -PassThru -NoNewWindow
                
                if ($InstallProcess.ExitCode -eq 0) {
                    Write-Host "✅ npm install completed successfully" -ForegroundColor Green
                } else {
                    Write-Host "⚠️  npm install had issues but continuing..." -ForegroundColor Yellow
                }
            } catch {
                Write-Host "⚠️  npm install failed but continuing: $_" -ForegroundColor Yellow
            }
        }
    }
}

# Check if backend is running (optional warning)
try {
    $BackendTest = curl.exe -s -w "%{http_code}" -o nul http://127.0.0.1:5000/api/health --connect-timeout 2
    if ($BackendTest -eq "200") {
        Write-Host "✅ Backend is running and accessible" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Backend not responding (HTTP: $BackendTest)" -ForegroundColor Yellow
        Write-Host "💡 Consider starting backend first with: .\start-backend.ps1" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️  Backend not accessible - make sure it's running" -ForegroundColor Yellow
    Write-Host "💡 Start backend first with: .\start-backend.ps1" -ForegroundColor Yellow
}

# Start Vite development server
Write-Host "🌟 Starting Vite development server..." -ForegroundColor Green
Write-Host "   Port: 3001" -ForegroundColor Gray
Write-Host "   Mode: Development" -ForegroundColor Gray

try {
    # Start npm run dev with specific port
    Write-Host "🚀 Launching Vite..." -ForegroundColor Cyan
    Write-Host ""
    
    # Use Start-Process to run npm run dev
    $ViteArgs = @("run", "dev", "--", "--port", "3001", "--host", "localhost")
    $ViteProcess = Start-Process -FilePath "npm" -ArgumentList $ViteArgs -PassThru
    
    if (-not $ViteProcess) {
        Write-Host "❌ Failed to start Vite development server" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "✅ Vite process started (PID: $($ViteProcess.Id))" -ForegroundColor Green
    
    # Wait a moment for Vite to start
    Start-Sleep -Seconds 3
    
    # Test if Vite is responding
    $MaxRetries = 5
    $RetryCount = 0
    $ViteReady = $false
    
    while ($RetryCount -lt $MaxRetries -and -not $ViteReady) {
        try {
            $RetryCount++
            Write-Host "   Testing Vite server (attempt $RetryCount/$MaxRetries)..." -ForegroundColor Gray
            
            $Response = curl.exe -s -w "%{http_code}" -o nul http://localhost:3001 --connect-timeout 3
            
            if ($Response -eq "200") {
                $ViteReady = $true
                Write-Host "✅ Vite is responding!" -ForegroundColor Green
            } else {
                Write-Host "   HTTP Status: $Response - Retrying..." -ForegroundColor Yellow
                Start-Sleep -Seconds 2
            }
        } catch {
            Write-Host "   Connection failed - Retrying..." -ForegroundColor Yellow
            Start-Sleep -Seconds 2
        }
    }
    
    Write-Host ""
    Write-Host "🎉 Frontend is ready!" -ForegroundColor Green -BackgroundColor DarkGreen
    Write-Host "   URL: http://localhost:3001" -ForegroundColor White
    Write-Host "   Process ID: $($ViteProcess.Id)" -ForegroundColor Gray
    Write-Host ""
    Write-Host "💡 To stop the frontend:" -ForegroundColor Yellow
    Write-Host "   Stop-Process -Id $($ViteProcess.Id)" -ForegroundColor Gray
    Write-Host ""
    Write-Host "🌐 Open your browser and navigate to: http://localhost:3001" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Press Ctrl+C to stop this script (Vite will continue running)" -ForegroundColor Cyan
    
    # Keep script running
    try {
        while ($true) {
            Start-Sleep -Seconds 1
        }
    } catch {
        Write-Host "Script interrupted" -ForegroundColor Yellow
    }
    
} catch {
    Write-Host "❌ Failed to start Vite development server: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 Try running manually:" -ForegroundColor Yellow
    Write-Host "   cd $FrontendPath" -ForegroundColor Gray
    Write-Host "   npm run dev -- --port 3001" -ForegroundColor Gray
    exit 1
}