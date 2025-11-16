#!/usr/bin/env node

/**
 * ShopHub Performance Optimization Script
 * 
 * This script automates:
 * - CSS minification
 * - JavaScript minification
 * - Image compression (via external tools)
 * 
 * Prerequisites:
 * - Node.js installed
 * - Run: npm install (to install dependencies from package.json)
 * 
 * Usage:
 * - node optimize.js
 */

const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    red: '\x1b[31m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

// Simple CSS minifier
function minifyCSS(css) {
    return css
        // Remove comments
        .replace(/\/\*[\s\S]*?\*\//g, '')
        // Remove whitespace around { } : ; ,
        .replace(/\s*([{}:;,])\s*/g, '$1')
        // Remove multiple spaces
        .replace(/\s+/g, ' ')
        // Remove leading/trailing whitespace
        .trim();
}

// Simple JS minifier (basic)
function minifyJS(js) {
    return js
        // Remove single-line comments (but preserve URLs)
        .replace(/(?:^|\s)\/\/(?![^\n]*:\/\/).*$/gm, '')
        // Remove multi-line comments
        .replace(/\/\*[\s\S]*?\*\//g, '')
        // Remove multiple spaces
        .replace(/\s+/g, ' ')
        // Remove spaces around operators (basic)
        .replace(/\s*([{}();,=<>!+\-*/&|])\s*/g, '$1')
        // Remove leading/trailing whitespace
        .trim();
}

// Optimize CSS files
function optimizeCSS() {
    log('\n📦 Optimizing CSS files...', 'blue');
    
    const cssDir = path.join(__dirname, 'styles');
    const distDir = path.join(__dirname, 'dist', 'styles');
    
    if (!fs.existsSync(distDir)) {
        fs.mkdirSync(distDir, { recursive: true });
    }
    
    const cssFiles = fs.readdirSync(cssDir).filter(f => f.endsWith('.css'));
    
    cssFiles.forEach(file => {
        const inputPath = path.join(cssDir, file);
        const outputPath = path.join(distDir, file.replace('.css', '.min.css'));
        
        const originalContent = fs.readFileSync(inputPath, 'utf8');
        const minifiedContent = minifyCSS(originalContent);
        
        fs.writeFileSync(outputPath, minifiedContent);
        
        const originalSize = Buffer.byteLength(originalContent, 'utf8');
        const minifiedSize = Buffer.byteLength(minifiedContent, 'utf8');
        const savings = ((1 - minifiedSize / originalSize) * 100).toFixed(2);
        
        log(`  ✓ ${file}`, 'green');
        log(`    ${formatBytes(originalSize)} → ${formatBytes(minifiedSize)} (${savings}% smaller)`, 'yellow');
    });
}

// Optimize JavaScript files
function optimizeJS() {
    log('\n📦 Optimizing JavaScript files...', 'blue');
    
    const jsDir = path.join(__dirname, 'scripts');
    const distDir = path.join(__dirname, 'dist', 'scripts');
    
    if (!fs.existsSync(distDir)) {
        fs.mkdirSync(distDir, { recursive: true });
    }
    
    const jsFiles = fs.readdirSync(jsDir).filter(f => f.endsWith('.js'));
    
    jsFiles.forEach(file => {
        const inputPath = path.join(jsDir, file);
        const outputPath = path.join(distDir, file.replace('.js', '.min.js'));
        
        const originalContent = fs.readFileSync(inputPath, 'utf8');
        const minifiedContent = minifyJS(originalContent);
        
        fs.writeFileSync(outputPath, minifiedContent);
        
        const originalSize = Buffer.byteLength(originalContent, 'utf8');
        const minifiedSize = Buffer.byteLength(minifiedContent, 'utf8');
        const savings = ((1 - minifiedSize / originalSize) * 100).toFixed(2);
        
        log(`  ✓ ${file}`, 'green');
        log(`    ${formatBytes(originalSize)} → ${formatBytes(minifiedSize)} (${savings}% smaller)`, 'yellow');
    });
}

// Copy HTML files and update references
function copyHTMLFiles() {
    log('\n📄 Copying and updating HTML files...', 'blue');
    
    const distDir = path.join(__dirname, 'dist');
    
    const htmlFiles = fs.readdirSync(__dirname).filter(f => f.endsWith('.html'));
    
    htmlFiles.forEach(file => {
        const inputPath = path.join(__dirname, file);
        const outputPath = path.join(distDir, file);
        
        let content = fs.readFileSync(inputPath, 'utf8');
        
        // Update CSS references
        content = content.replace(
            /(href=["']\.\/styles\/)([^"']+)(\.css["'])/g,
            '$1$2.min.css$3'
        );
        
        // Update JS references
        content = content.replace(
            /(src=["']\.\/scripts\/)([^"']+)(\.js["'])/g,
            '$1$2.min.js$3'
        );
        
        fs.writeFileSync(outputPath, content);
        log(`  ✓ ${file}`, 'green');
    });
}

// Generate performance report
function generateReport() {
    log('\n📊 Performance Optimization Report', 'bright');
    log('═══════════════════════════════════════\n', 'bright');
    
    const report = {
        css: { original: 0, minified: 0 },
        js: { original: 0, minified: 0 }
    };
    
    // Calculate CSS savings
    const cssFiles = fs.readdirSync(path.join(__dirname, 'styles')).filter(f => f.endsWith('.css'));
    cssFiles.forEach(file => {
        const originalSize = fs.statSync(path.join(__dirname, 'styles', file)).size;
        const minifiedSize = fs.statSync(path.join(__dirname, 'dist', 'styles', file.replace('.css', '.min.css'))).size;
        report.css.original += originalSize;
        report.css.minified += minifiedSize;
    });
    
    // Calculate JS savings
    const jsFiles = fs.readdirSync(path.join(__dirname, 'scripts')).filter(f => f.endsWith('.js'));
    jsFiles.forEach(file => {
        const originalSize = fs.statSync(path.join(__dirname, 'scripts', file)).size;
        const minifiedSize = fs.statSync(path.join(__dirname, 'dist', 'scripts', file.replace('.js', '.min.js'))).size;
        report.js.original += originalSize;
        report.js.minified += minifiedSize;
    });
    
    const totalOriginal = report.css.original + report.js.original;
    const totalMinified = report.css.minified + report.js.minified;
    const totalSavings = ((1 - totalMinified / totalOriginal) * 100).toFixed(2);
    
    log(`CSS Files:`, 'blue');
    log(`  Original:  ${formatBytes(report.css.original)}`);
    log(`  Minified:  ${formatBytes(report.css.minified)}`);
    log(`  Savings:   ${((1 - report.css.minified / report.css.original) * 100).toFixed(2)}%\n`, 'green');
    
    log(`JavaScript Files:`, 'blue');
    log(`  Original:  ${formatBytes(report.js.original)}`);
    log(`  Minified:  ${formatBytes(report.js.minified)}`);
    log(`  Savings:   ${((1 - report.js.minified / report.js.original) * 100).toFixed(2)}%\n`, 'green');
    
    log(`Total:`, 'bright');
    log(`  Original:  ${formatBytes(totalOriginal)}`);
    log(`  Minified:  ${formatBytes(totalMinified)}`);
    log(`  Savings:   ${totalSavings}%\n`, 'green');
    
    log('✅ Optimized files saved to ./dist/', 'green');
    log('\n💡 Next Steps:', 'yellow');
    log('   1. Test the optimized files in ./dist/');
    log('   2. For production, replace original files with minified versions');
    log('   3. Consider using a CDN for static assets');
    log('   4. Enable GZIP compression on your web server');
    log('   5. For advanced optimization, use tools like Terser (JS) and cssnano (CSS)\n');
}

// Main execution
async function main() {
    try {
        log('\n🚀 ShopHub Performance Optimizer', 'bright');
        log('═══════════════════════════════════\n', 'bright');
        
        optimizeCSS();
        optimizeJS();
        copyHTMLFiles();
        generateReport();
        
        log('\n✨ Optimization complete!\n', 'green');
    } catch (error) {
        log(`\n❌ Error: ${error.message}\n`, 'red');
        process.exit(1);
    }
}

// Run the script
main();
