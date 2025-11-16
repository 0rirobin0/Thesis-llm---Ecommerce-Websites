const fs = require('fs').promises;
const path = require('path');
const sharp = require('sharp');
const { minify } = require("terser");
const csso = require('csso');

const SRC_DIR = __dirname;
const DIST_DIR = path.join(__dirname, 'dist');
const SCRIPTS_DIR = path.join(SRC_DIR, 'scripts');
const STYLES_DIR = path.join(SRC_DIR, 'styles');
const DIST_SCRIPTS_DIR = path.join(DIST_DIR, 'scripts');
const DIST_STYLES_DIR = path.join(DIST_DIR, 'styles');
const IMG_DIR = path.join(SRC_DIR, 'images'); // Assuming you create an images folder
const DIST_IMG_DIR = path.join(DIST_DIR, 'images');

async function optimizeAssets() {
    try {
        // Create dist directories
        await fs.mkdir(DIST_DIR, { recursive: true });
        await fs.mkdir(DIST_SCRIPTS_DIR, { recursive: true });
        await fs.mkdir(DIST_STYLES_DIR, { recursive: true });
        await fs.mkdir(DIST_IMG_DIR, { recursive: true });

        // --- Minify JS ---
        const jsFiles = await fs.readdir(SCRIPTS_DIR);
        for (const file of jsFiles) {
            if (path.extname(file) === '.js') {
                const filePath = path.join(SCRIPTS_DIR, file);
                const fileContent = await fs.readFile(filePath, 'utf-8');
                const result = await minify(fileContent);
                await fs.writeFile(path.join(DIST_SCRIPTS_DIR, file), result.code);
                console.log(`Minified JS: ${file}`);
            }
        }

        // --- Minify CSS ---
        const cssFiles = await fs.readdir(STYLES_DIR);
        for (const file of cssFiles) {
            if (path.extname(file) === '.css') {
                const filePath = path.join(STYLES_DIR, file);
                const fileContent = await fs.readFile(filePath, 'utf-8');
                const minifiedCss = csso.minify(fileContent).css;
                await fs.writeFile(path.join(DIST_STYLES_DIR, file), minifiedCss);
                console.log(`Minified CSS: ${file}`);
            }
        }

        // --- Optimize Images ---
        // Note: This part assumes you have downloaded images into an `images` folder.
        // If the folder doesn't exist, it will just skip.
        try {
            const imageFiles = await fs.readdir(IMG_DIR);
            for (const file of imageFiles) {
                if (/\.(jpe?g|png|webp)$/i.test(file)) {
                    const inputPath = path.join(IMG_DIR, file);
                    const outputPath = path.join(DIST_IMG_DIR, file);
                    await sharp(inputPath)
                        .resize({ width: 800, withoutEnlargement: true })
                        .jpeg({ quality: 80 })
                        .toFile(outputPath);
                    console.log(`Optimized image: ${file}`);
                }
            }
        } catch (error) {
            if (error.code === 'ENOENT') {
                console.log('No `images` directory found, skipping image optimization.');
            } else {
                throw error;
            }
        }

        console.log('\nOptimization complete! Assets are in the `dist` folder.');
        console.log('In a real project, you would now update your HTML files to point to these new assets.');

    } catch (error) {
        console.error('An error occurred during optimization:', error);
    }
}

optimizeAssets();