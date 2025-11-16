# ShopHub Performance Optimization Script (PowerShell)
# 
# This script automates:
# - CSS minification
# - JavaScript minification
# - Performance reporting
# 
# Usage: .\optimize.ps1

Write-Host "`n🚀 ShopHub Performance Optimizer" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════`n" -ForegroundColor Cyan

# Create dist directories
$distRoot = Join-Path $PSScriptRoot "dist"
$distStyles = Join-Path $distRoot "styles"
$distScripts = Join-Path $distRoot "scripts"

New-Item -ItemType Directory -Force -Path $distStyles | Out-Null
New-Item -ItemType Directory -Force -Path $distScripts | Out-Null

# Function to minify CSS
function Minify-CSS {
    param([string]$content)
    
    # Remove comments
    $content = $content -replace '/\*[\s\S]*?\*/', ''
    # Remove whitespace around special characters
    $content = $content -replace '\s*([{}:;,])\s*', '$1'
    # Remove multiple spaces
    $content = $content -replace '\s+', ' '
    # Trim
    return $content.Trim()
}

# Function to minify JS
function Minify-JS {
    param([string]$content)
    
    # Remove single-line comments (preserve URLs)
    $content = $content -replace '(?m)^\s*//.*$', ''
    # Remove multi-line comments
    $content = $content -replace '/\*[\s\S]*?\*/', ''
    # Remove multiple spaces
    $content = $content -replace '\s+', ' '
    # Trim
    return $content.Trim()
}

# Function to format bytes
function Format-Bytes {
    param([long]$bytes)
    
    if ($bytes -eq 0) { return "0 Bytes" }
    $sizes = @("Bytes", "KB", "MB")
    $i = [Math]::Floor([Math]::Log($bytes) / [Math]::Log(1024))
    return [Math]::Round($bytes / [Math]::Pow(1024, $i), 2).ToString() + " " + $sizes[$i]
}

# Optimize CSS files
Write-Host "📦 Optimizing CSS files..." -ForegroundColor Blue

$cssFiles = Get-ChildItem -Path (Join-Path $PSScriptRoot "styles") -Filter "*.css"
$totalCssOriginal = 0
$totalCssMinified = 0

foreach ($file in $cssFiles) {
    $content = Get-Content $file.FullName -Raw -Encoding UTF8
    $minified = Minify-CSS -content $content
    
    $outputFile = Join-Path $distStyles ($file.BaseName + ".min.css")
    $minified | Out-File -FilePath $outputFile -Encoding UTF8 -NoNewline
    
    $originalSize = $file.Length
    $minifiedSize = (Get-Item $outputFile).Length
    $savings = [Math]::Round((1 - $minifiedSize / $originalSize) * 100, 2)
    
    $totalCssOriginal += $originalSize
    $totalCssMinified += $minifiedSize
    
    Write-Host "  ✓ $($file.Name)" -ForegroundColor Green
    Write-Host "    $(Format-Bytes $originalSize) → $(Format-Bytes $minifiedSize) ($savings% smaller)" -ForegroundColor Yellow
}

# Optimize JavaScript files
Write-Host "`n📦 Optimizing JavaScript files..." -ForegroundColor Blue

$jsFiles = Get-ChildItem -Path (Join-Path $PSScriptRoot "scripts") -Filter "*.js"
$totalJsOriginal = 0
$totalJsMinified = 0

foreach ($file in $jsFiles) {
    $content = Get-Content $file.FullName -Raw -Encoding UTF8
    $minified = Minify-JS -content $content
    
    $outputFile = Join-Path $distScripts ($file.BaseName + ".min.js")
    $minified | Out-File -FilePath $outputFile -Encoding UTF8 -NoNewline
    
    $originalSize = $file.Length
    $minifiedSize = (Get-Item $outputFile).Length
    $savings = [Math]::Round((1 - $minifiedSize / $originalSize) * 100, 2)
    
    $totalJsOriginal += $originalSize
    $totalJsMinified += $minifiedSize
    
    Write-Host "  ✓ $($file.Name)" -ForegroundColor Green
    Write-Host "    $(Format-Bytes $originalSize) → $(Format-Bytes $minifiedSize) ($savings% smaller)" -ForegroundColor Yellow
}

# Copy and update HTML files
Write-Host "`n📄 Copying and updating HTML files..." -ForegroundColor Blue

$htmlFiles = Get-ChildItem -Path $PSScriptRoot -Filter "*.html"

foreach ($file in $htmlFiles) {
    $content = Get-Content $file.FullName -Raw -Encoding UTF8
    
    # Update CSS references
    $content = $content -replace '(href=["\']\.\/styles\/)([^"\']+)(\.css["\'])', '$1$2.min.css$3'
    
    # Update JS references
    $content = $content -replace '(src=["\']\.\/scripts\/)([^"\']+)(\.js["\'])', '$1$2.min.js$3'
    
    $outputFile = Join-Path $distRoot $file.Name
    $content | Out-File -FilePath $outputFile -Encoding UTF8 -NoNewline
    
    Write-Host "  ✓ $($file.Name)" -ForegroundColor Green
}

# Generate report
Write-Host "`n📊 Performance Optimization Report" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════`n" -ForegroundColor Cyan

$cssSavings = [Math]::Round((1 - $totalCssMinified / $totalCssOriginal) * 100, 2)
$jsSavings = [Math]::Round((1 - $totalJsMinified / $totalJsOriginal) * 100, 2)

$totalOriginal = $totalCssOriginal + $totalJsOriginal
$totalMinified = $totalCssMinified + $totalJsMinified
$totalSavings = [Math]::Round((1 - $totalMinified / $totalOriginal) * 100, 2)

Write-Host "CSS Files:" -ForegroundColor Blue
Write-Host "  Original:  $(Format-Bytes $totalCssOriginal)"
Write-Host "  Minified:  $(Format-Bytes $totalCssMinified)"
Write-Host "  Savings:   $cssSavings%`n" -ForegroundColor Green

Write-Host "JavaScript Files:" -ForegroundColor Blue
Write-Host "  Original:  $(Format-Bytes $totalJsOriginal)"
Write-Host "  Minified:  $(Format-Bytes $totalJsMinified)"
Write-Host "  Savings:   $jsSavings%`n" -ForegroundColor Green

Write-Host "Total:" -ForegroundColor Cyan
Write-Host "  Original:  $(Format-Bytes $totalOriginal)"
Write-Host "  Minified:  $(Format-Bytes $totalMinified)"
Write-Host "  Savings:   $totalSavings%`n" -ForegroundColor Green

Write-Host "✅ Optimized files saved to .\dist\" -ForegroundColor Green

Write-Host "`n💡 Next Steps:" -ForegroundColor Yellow
Write-Host "   1. Test the optimized files in .\dist\"
Write-Host "   2. For production, replace original files with minified versions"
Write-Host "   3. Consider using a CDN for static assets"
Write-Host "   4. Enable GZIP compression on your web server"
Write-Host "   5. For advanced optimization, use tools like Terser (JS) and cssnano (CSS)`n"

Write-Host "✨ Optimization complete!`n" -ForegroundColor Green
