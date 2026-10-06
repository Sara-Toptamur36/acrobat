# Music Library - Start Both Backend and Frontend
# Windows 11 PowerShell - One-click full stack startup

param(
    [switch]$Verbose,
    [switch]$BackendOnly,
    [switch]$FrontendOnly
)

$ErrorActionPreference = "Stop"
$ProjectRoot = $PSScriptRoot

Write-Host "🎵 Music Library - Full Stack Startup" -ForegroundColor Magenta
Write-Host "Project Root: $ProjectRoot" -ForegroundColor Gray
Write-Host ""

# Change to project root
if (-not (Test-Path $ProjectRoot)) {
    Write-Host "❌ Project directory not found: $ProjectRoot" -ForegroundColor Red
    exit 1
}

Set-Location $ProjectRoot

# Check if scripts exist
$BackendScript = Join-Path $ProjectRoot "start-backend.ps1"
$FrontendScript = Join-Path $ProjectRoot "start-frontend.ps1"

if (-not (Test-Path $BackendScript)) {
    Write-Host "❌ Backend script not found: $BackendScript" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path $FrontendScript)) {
    Write-Host "❌ Frontend script not found: $FrontendScript" -ForegroundColor Red
    exit 1
}

# Function to start backend
function Start-Backend {
    Write-Host "🔧 Starting Backend..." -ForegroundColor Blue
    
    $BackendArgs = @()
    if ($Verbose) { $BackendArgs += "-Verbose" }
    
    $BackendJob = Start-Job -ScriptBlock {
        param($ScriptPath, $Args)
        & $ScriptPath @Args
    } -ArgumentList $BackendScript, $BackendArgs
    
    return $BackendJob
}

# Function to start frontend
function Start-Frontend {
    Write-Host "🎨 Starting Frontend..." -ForegroundColor Blue
    
    $FrontendArgs = @()
    if ($Verbose) { $FrontendArgs += "-Verbose" }
    
    $FrontendJob = Start-Job -ScriptBlock {
        param($ScriptPath, $Args)
        & $ScriptPath @Args
    } -ArgumentList $FrontendScript, $FrontendArgs
    
    return $FrontendJob
}

# Start services based on parameters
$Jobs = @()

if ($BackendOnly) {
    Write-Host "🎯 Starting Backend Only..." -ForegroundColor Yellow
    $BackendJob = Start-Backend
    $Jobs += $BackendJob
} elseif ($FrontendOnly) {
    Write-Host "🎯 Starting Frontend Only..." -ForegroundColor Yellow
    $FrontendJob = Start-Frontend
    $Jobs += $FrontendJob
} else {
    Write-Host "🎯 Starting Both Backend and Frontend..." -ForegroundColor Yellow
    
    # Start backend first
    $BackendJob = Start-Backend
    $Jobs += $BackendJob
    
    # Wait a moment for backend to start
    Write-Host "⏳ Waiting for backend to initialize..." -ForegroundColor Gray
    Start-Sleep -Seconds 5
    
    # Start frontend
    $FrontendJob = Start-Frontend
    $Jobs += $FrontendJob
}

Write-Host ""
Write-Host "🚀 Services are starting..." -ForegroundColor Green
Write-Host "📊 Job IDs: $($Jobs.Id -join ', ')" -ForegroundColor Gray

# Monitor jobs
try {
    Write-Host ""
    Write-Host "📋 Service Status:" -ForegroundColor Cyan
    Write-Host "   Press Ctrl+C to stop all services" -ForegroundColor Yellow
    Write-Host ""
    
    while ($true) {
        $RunningJobs = $Jobs | Where-Object { $_.State -eq "Running" }
        
        if ($RunningJobs.Count -eq 0) {
            Write-Host "⚠️  All services have stopped" -ForegroundColor Yellow
            break
        }
        
        # Show job output periodically
        foreach ($Job in $Jobs) {
            $Output = Receive-Job -Job $Job -ErrorAction SilentlyContinue
            if ($Output) {
                Write-Host $Output
            }
        }
        
        Start-Sleep -Seconds 2
    }
} catch {
    Write-Host ""
    Write-Host "🛑 Stopping all services..." -ForegroundColor Red
} finally {
    # Clean up jobs
    foreach ($Job in $Jobs) {
        if ($Job.State -eq "Running") {
            Stop-Job -Job $Job -ErrorAction SilentlyContinue
        }
        Remove-Job -Job $Job -Force -ErrorAction SilentlyContinue
    }
    
    Write-Host "✅ All services stopped" -ForegroundColor Green
}

Write-Host ""
Write-Host "💡 To start services individually:" -ForegroundColor Yellow
Write-Host "   Backend: .\start-backend.ps1" -ForegroundColor Gray
Write-Host "   Frontend: .\start-frontend.ps1" -ForegroundColor Gray
Write-Host "   Both: .\start-all.ps1" -ForegroundColor Gray