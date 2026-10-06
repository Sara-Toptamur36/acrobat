# Docker Startup Script for Music Library
# Windows 11 PowerShell - Docker Compose startup

param(
    [switch]$Build,
    [switch]$Logs,
    [switch]$Stop,
    [switch]$Clean,
    [switch]$Verbose
)

$ErrorActionPreference = "Stop"

Write-Host "🐳 Music Library - Docker Compose Manager" -ForegroundColor Cyan
Write-Host ""

# Check if Docker is running
try {
    $DockerVersion = docker --version
    Write-Host "✅ Docker: $DockerVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker is not running or not installed" -ForegroundColor Red
    Write-Host "💡 Please start Docker Desktop" -ForegroundColor Yellow
    exit 1
}

# Check if docker-compose.yml exists
if (-not (Test-Path "docker-compose.yml")) {
    Write-Host "❌ docker-compose.yml not found in current directory" -ForegroundColor Red
    exit 1
}

# Handle different operations
if ($Stop) {
    Write-Host "🛑 Stopping all services..." -ForegroundColor Yellow
    docker compose down
    Write-Host "✅ All services stopped" -ForegroundColor Green
    exit 0
}

if ($Clean) {
    Write-Host "🧹 Cleaning up Docker resources..." -ForegroundColor Yellow
    docker compose down -v --remove-orphans
    docker system prune -f
    Write-Host "✅ Docker cleanup completed" -ForegroundColor Green
    exit 0
}

if ($Logs) {
    Write-Host "📋 Showing service logs..." -ForegroundColor Blue
    docker compose logs -f
    exit 0
}

# Start services
Write-Host "🚀 Starting Music Library services..." -ForegroundColor Green

$ComposeArgs = @("up")
if ($Build) {
    $ComposeArgs += "--build"
    Write-Host "🔨 Building images..." -ForegroundColor Yellow
}

if ($Verbose) {
    $ComposeArgs += "--verbose"
}

$ComposeArgs += "-d"

try {
    Write-Host "📦 Running: docker compose $($ComposeArgs -join ' ')" -ForegroundColor Gray
    & docker compose @ComposeArgs
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Docker compose failed with exit code: $LASTEXITCODE" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "✅ Services started successfully!" -ForegroundColor Green
    
} catch {
    Write-Host "❌ Failed to start services: $_" -ForegroundColor Red
    exit 1
}

# Wait for services to be healthy
Write-Host ""
Write-Host "⏳ Waiting for services to be healthy..." -ForegroundColor Yellow

$MaxWait = 120  # 2 minutes
$WaitTime = 0
$CheckInterval = 5

while ($WaitTime -lt $MaxWait) {
    Start-Sleep -Seconds $CheckInterval
    $WaitTime += $CheckInterval
    
    # Check service health
    $Services = docker compose ps --format json | ConvertFrom-Json
    $HealthyServices = 0
    $TotalServices = $Services.Count
    
    foreach ($Service in $Services) {
        $ServiceName = $Service.Service
        $ServiceState = $Service.State
        $ServiceHealth = $Service.Health
        
        if ($ServiceState -eq "running") {
            if ($ServiceHealth -eq "healthy" -or $ServiceHealth -eq "") {
                $HealthyServices++
                if ($Verbose) {
                    Write-Host "   ✅ $ServiceName is healthy" -ForegroundColor Green
                }
            } else {
                if ($Verbose) {
                    Write-Host "   ⏳ $ServiceName is $ServiceHealth" -ForegroundColor Yellow
                }
            }
        } else {
            if ($Verbose) {
                Write-Host "   ❌ $ServiceName is $ServiceState" -ForegroundColor Red
            }
        }
    }
    
    Write-Host "   Health Status: $HealthyServices/$TotalServices services ready" -ForegroundColor Gray
    
    if ($HealthyServices -eq $TotalServices) {
        Write-Host "✅ All services are healthy!" -ForegroundColor Green
        break
    }
}

if ($WaitTime -ge $MaxWait) {
    Write-Host "⚠️  Timeout waiting for services to be healthy" -ForegroundColor Yellow
    Write-Host "💡 Check service logs: docker compose logs" -ForegroundColor Yellow
}

# Test endpoints
Write-Host ""
Write-Host "🔍 Testing service endpoints..." -ForegroundColor Cyan

# Test MySQL
try {
    $MySQLTest = docker compose exec -T mysql mysqladmin ping -h localhost -u root -prootpassword
    if ($MySQLTest -match "mysqld is alive") {
        Write-Host "   ✅ MySQL: Database is responding" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  MySQL: Unexpected response" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ❌ MySQL: Connection failed" -ForegroundColor Red
}

# Test Backend
try {
    Start-Sleep -Seconds 2
    $BackendTest = curl.exe -s -w "%{http_code}" -o nul http://localhost:5000/api/health --connect-timeout 5
    if ($BackendTest -eq "200") {
        Write-Host "   ✅ Backend: API is responding (HTTP 200)" -ForegroundColor Green
        
        # Get health details
        $HealthResponse = curl.exe -s http://localhost:5000/api/health | ConvertFrom-Json
        if ($HealthResponse.success) {
            Write-Host "      Database: $($HealthResponse.data.database)" -ForegroundColor Gray
            Write-Host "      Status: $($HealthResponse.data.status)" -ForegroundColor Gray
        }
    } else {
        Write-Host "   ❌ Backend: HTTP $BackendTest" -ForegroundColor Red
    }
} catch {
    Write-Host "   ❌ Backend: Connection failed" -ForegroundColor Red
}

# Test Frontend
try {
    Start-Sleep -Seconds 2
    $FrontendTest = curl.exe -s -w "%{http_code}" -o nul http://localhost:3001 --connect-timeout 5
    if ($FrontendTest -eq "200") {
        Write-Host "   ✅ Frontend: Vite dev server is responding (HTTP 200)" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Frontend: HTTP $FrontendTest" -ForegroundColor Red
    }
} catch {
    Write-Host "   ❌ Frontend: Connection failed" -ForegroundColor Red
}

# Show service status
Write-Host ""
Write-Host "📊 Service Status:" -ForegroundColor Cyan
docker compose ps

Write-Host ""
Write-Host "🎉 Music Library is ready!" -ForegroundColor Green -BackgroundColor DarkGreen
Write-Host ""
Write-Host "🌐 Access URLs:" -ForegroundColor White
Write-Host "   Frontend: http://localhost:3001" -ForegroundColor Cyan
Write-Host "   Backend:  http://localhost:5000" -ForegroundColor Cyan
Write-Host "   Health:   http://localhost:5000/api/health" -ForegroundColor Cyan
Write-Host "   MySQL:    localhost:3306" -ForegroundColor Cyan
Write-Host ""
Write-Host "💡 Useful Commands:" -ForegroundColor Yellow
Write-Host "   View logs:     docker compose logs -f" -ForegroundColor Gray
Write-Host "   Stop services: docker compose down" -ForegroundColor Gray
Write-Host "   Restart:       docker compose restart" -ForegroundColor Gray
Write-Host "   Rebuild:       docker compose up --build -d" -ForegroundColor Gray
Write-Host ""
Write-Host "🔧 Script Options:" -ForegroundColor Yellow
Write-Host "   .\docker-start.ps1 -Build    # Rebuild images" -ForegroundColor Gray
Write-Host "   .\docker-start.ps1 -Logs     # Show logs" -ForegroundColor Gray
Write-Host "   .\docker-start.ps1 -Stop     # Stop services" -ForegroundColor Gray
Write-Host "   .\docker-start.ps1 -Clean    # Full cleanup" -ForegroundColor Gray