# Music Library Backend Startup Script
# Windows 11 PowerShell - One-click backend startup

param(
    [switch]$Verbose
)

$ErrorActionPreference = "Stop"
$BackendPath = Join-Path $PSScriptRoot "backend"

Write-Host "🚀 Starting Music Library Backend..." -ForegroundColor Green
Write-Host "Backend Path: $BackendPath" -ForegroundColor Gray

# Change to backend directory
if (-not (Test-Path $BackendPath)) {
    Write-Host "❌ Backend directory not found: $BackendPath" -ForegroundColor Red
    exit 1
}

Set-Location $BackendPath
Write-Host "📁 Changed to backend directory" -ForegroundColor Gray

# Check if virtual environment exists
$VenvPath = Join-Path $BackendPath ".venv"
$ActivateScript = Join-Path $VenvPath "Scripts\Activate.ps1"

if (-not (Test-Path $VenvPath)) {
    Write-Host "❌ Virtual environment not found at: $VenvPath" -ForegroundColor Red
    Write-Host "💡 Please create virtual environment first:" -ForegroundColor Yellow
    Write-Host "   python -m venv .venv" -ForegroundColor Yellow
    exit 1
}

if (-not (Test-Path $ActivateScript)) {
    Write-Host "❌ Activate script not found at: $ActivateScript" -ForegroundColor Red
    exit 1
}

# Check if virtual environment is already active
$VenvActive = $false
if ($env:VIRTUAL_ENV) {
    $CurrentVenv = Split-Path $env:VIRTUAL_ENV -Leaf
    if ($CurrentVenv -eq ".venv") {
        Write-Host "✅ Virtual environment already active" -ForegroundColor Green
        $VenvActive = $true
    }
}

# Activate virtual environment if not already active
if (-not $VenvActive) {
    Write-Host "🔧 Activating virtual environment..." -ForegroundColor Yellow
    try {
        & $ActivateScript
        Write-Host "✅ Virtual environment activated" -ForegroundColor Green
    } catch {
        Write-Host "❌ Failed to activate virtual environment: $_" -ForegroundColor Red
        exit 1
    }
}

# Clear Flask environment variables to avoid conflicts
Write-Host "🧹 Clearing Flask environment variables..." -ForegroundColor Gray
$FlaskVars = @("FLASK_APP", "FLASK_ENV", "FLASK_DEBUG", "FLASK_RUN_HOST", "FLASK_RUN_PORT")
foreach ($var in $FlaskVars) {
    if (Get-Item "Env:$var" -ErrorAction SilentlyContinue) {
        Remove-Item "Env:$var"
        if ($Verbose) { Write-Host "   Cleared $var" -ForegroundColor DarkGray }
    }
}

# Check if app.py exists
if (-not (Test-Path "app.py")) {
    Write-Host "❌ app.py not found in backend directory" -ForegroundColor Red
    exit 1
}

# Check if .env file exists
if (-not (Test-Path ".env")) {
    Write-Host "⚠️  .env file not found - using defaults" -ForegroundColor Yellow
} else {
    Write-Host "✅ .env file found" -ForegroundColor Green
}

# Start Flask application
Write-Host "🌟 Starting Flask application..." -ForegroundColor Green
Write-Host "   Host: 127.0.0.1" -ForegroundColor Gray
Write-Host "   Port: 5000" -ForegroundColor Gray
Write-Host "   Debug: ON" -ForegroundColor Gray

# Start Flask in background and capture process
$FlaskProcess = Start-Process -FilePath "python" -ArgumentList "-m", "flask", "run", "--host", "127.0.0.1", "--port", "5000", "--debug" -PassThru -WindowStyle Hidden

if (-not $FlaskProcess) {
    Write-Host "❌ Failed to start Flask application" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Flask process started (PID: $($FlaskProcess.Id))" -ForegroundColor Green

# Wait for Flask to start up
Write-Host "⏳ Waiting for Flask to start up..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

# Test if Flask is responding
$MaxRetries = 10
$RetryCount = 0
$FlaskReady = $false

while ($RetryCount -lt $MaxRetries -and -not $FlaskReady) {
    try {
        $RetryCount++
        Write-Host "   Attempt $RetryCount/$MaxRetries - Testing health endpoint..." -ForegroundColor Gray
        
        $Response = curl.exe -s -w "%{http_code}" -o nul http://127.0.0.1:5000/api/health
        
        if ($Response -eq "200") {
            $FlaskReady = $true
            Write-Host "✅ Flask is responding!" -ForegroundColor Green
        } else {
            Write-Host "   HTTP Status: $Response - Retrying..." -ForegroundColor Yellow
            Start-Sleep -Seconds 2
        }
    } catch {
        Write-Host "   Connection failed - Retrying..." -ForegroundColor Yellow
        Start-Sleep -Seconds 2
    }
}

if (-not $FlaskReady) {
    Write-Host "❌ Flask failed to start properly after $MaxRetries attempts" -ForegroundColor Red
    Write-Host "💡 Check the Flask process manually or look at logs" -ForegroundColor Yellow
    exit 1
}

# Get and display health check response
try {
    Write-Host "🔍 Health Check Response:" -ForegroundColor Cyan
    $HealthResponse = curl.exe -s http://127.0.0.1:5000/api/health | ConvertFrom-Json
    
    if ($HealthResponse.success) {
        Write-Host "   Status: $($HealthResponse.data.status)" -ForegroundColor Green
        Write-Host "   Database: $($HealthResponse.data.database)" -ForegroundColor Green
        Write-Host "   Message: $($HealthResponse.data.message)" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  Health check returned success=false" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ⚠️  Could not parse health response, but server is responding" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🎉 Backend is ready!" -ForegroundColor Green -BackgroundColor DarkGreen
Write-Host "   URL: http://127.0.0.1:5000" -ForegroundColor White
Write-Host "   Health: http://127.0.0.1:5000/api/health" -ForegroundColor White
Write-Host "   Process ID: $($FlaskProcess.Id)" -ForegroundColor Gray
Write-Host ""
Write-Host "💡 To stop the backend:" -ForegroundColor Yellow
Write-Host "   Stop-Process -Id $($FlaskProcess.Id)" -ForegroundColor Gray
Write-Host ""
Write-Host "Press Ctrl+C to stop this script (Flask will continue running)" -ForegroundColor Cyan

# Keep script running to show Flask output
try {
    while ($true) {
        Start-Sleep -Seconds 1
    }
} catch {
    Write-Host "Script interrupted" -ForegroundColor Yellow
}