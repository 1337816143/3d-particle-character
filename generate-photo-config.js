const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const PHOTOS_DIR = path.join(__dirname, 'photos');
const OUTPUT_FILE = path.join(__dirname, 'photo-groups-config.js');
const FIXED_HEIGHT = 10;
const NUM_ROWS = 5;

async function getPhotoDimensions(photoPath) {
    try {
        const metadata = await sharp(photoPath).metadata();
        return {
            width: metadata.width,
            height: metadata.height,
            aspect: metadata.width / metadata.height
        };
    } catch (error) {
        console.error(`Error reading ${photoPath}:`, error.message);
        return null;
    }
}

async function readPhotos() {
    const files = fs.readdirSync(PHOTOS_DIR);
    const photoFiles = files.filter(file => {
        const ext = path.extname(file).toLowerCase();
        return ['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext);
    });

    const photos = [];
    for (const file of photoFiles) {
        const filePath = path.join(PHOTOS_DIR, file);
        const dimensions = await getPhotoDimensions(filePath);
        if (dimensions) {
            photos.push({
                src: `photos/${file}`,
                originalWidth: dimensions.width,
                originalHeight: dimensions.height,
                aspect: dimensions.aspect,
                height: FIXED_HEIGHT,
                width: FIXED_HEIGHT * dimensions.aspect,
                adjustedWidth: FIXED_HEIGHT * dimensions.aspect
            });
        }
    }

    return photos;
}

function distributePhotosToRows(photos, numRows) {
    const rows = Array.from({ length: numRows }, () => []);
    const rowWidths = Array.from({ length: numRows }, () => 0);

    const sortedPhotos = [...photos].sort((a, b) => b.adjustedWidth - a.adjustedWidth);

    for (const photo of sortedPhotos) {
        const minRow = rowWidths.indexOf(Math.min(...rowWidths));
        rows[minRow].push(photo);
        rowWidths[minRow] += photo.adjustedWidth;
    }

    return rows;
}

function generateConfig(photos, rows) {
    const config = {
        rows: rows.map(row => row.map(photo => ({
            src: photo.src,
            width: photo.width,
            height: photo.height,
            adjustedWidth: photo.adjustedWidth,
            aspect: photo.aspect,
            originalWidth: photo.originalWidth,
            originalHeight: photo.originalHeight
        })))
    };

    return `window.PHOTO_GROUPS_CONFIG = ${JSON.stringify(config, null, 4)};`;
}

async function main() {
    console.log('开始读取照片...');
    const photos = await readPhotos();
    console.log(`共读取 ${photos.length} 张照片`);

    console.log('开始分配照片到行...');
    const rows = distributePhotosToRows(photos, NUM_ROWS);

    console.log('每行照片数量和总宽度:');
    rows.forEach((row, index) => {
        const totalWidth = row.reduce((sum, photo) => sum + photo.adjustedWidth, 0);
        console.log(`第 ${index + 1} 行: ${row.length} 张照片, 总宽度: ${totalWidth.toFixed(2)}`);
    });

    console.log('生成配置文件...');
    const config = generateConfig(photos, rows);
    fs.writeFileSync(OUTPUT_FILE, config, 'utf-8');

    console.log(`配置文件已生成: ${OUTPUT_FILE}`);
}

main().catch(error => {
    console.error('Error:', error);
    process.exit(1);
});
