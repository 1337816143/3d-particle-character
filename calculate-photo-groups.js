const fs = require('fs');
const path = require('path');

const photosDir = path.join(__dirname, 'photos');
const configFile = path.join(__dirname, 'photo-groups-config.js');
const totalRows = 5;
const photoHeight = 10;

function getImageDimensions(filePath) {
    const buffer = fs.readFileSync(filePath);
    
    if (buffer.length < 24) {
        throw new Error('File too small');
    }
    
    let width, height;
    
    if (buffer[0] === 0xFF && buffer[1] === 0xD8) {
        let offset = 2;
        while (offset < buffer.length) {
            if (buffer[offset] !== 0xFF) {
                throw new Error('Invalid JPEG');
            }
            const marker = buffer[offset + 1];
            const length = (buffer[offset + 2] << 8) | buffer[offset + 3];
            
            if (marker === 0xC0 || marker === 0xC2) {
                height = (buffer[offset + 5] << 8) | buffer[offset + 6];
                width = (buffer[offset + 7] << 8) | buffer[offset + 8];
                break;
            }
            
            offset += 2 + length;
        }
    } else if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
        width = (buffer[16] << 24) | (buffer[17] << 16) | (buffer[18] << 8) | buffer[19];
        height = (buffer[20] << 24) | (buffer[21] << 16) | (buffer[22] << 8) | buffer[23];
    } else {
        throw new Error('Unsupported image format');
    }
    
    return { width, height };
}

async function calculatePhotoGroups() {
    console.log('开始计算照片分组...');
    
    const photoFiles = fs.readdirSync(photosDir)
        .filter(file => /\.(jpg|jpeg|png|gif|webp)$/i.test(file))
        .map(file => path.join(photosDir, file))
        .sort();
    
    console.log(`找到 ${photoFiles.length} 张照片`);
    
    const photoInfoList = [];
    
    for (const photoPath of photoFiles) {
        const fileName = path.basename(photoPath);
        const relativePath = `photos/${fileName}`;
        
        try {
            const dimensions = getImageDimensions(photoPath);
            
            const aspect = dimensions.width / dimensions.height;
            const actualPhotoWidth = photoHeight * aspect;
            
            photoInfoList.push({
                src: relativePath,
                width: actualPhotoWidth,
                height: photoHeight,
                aspect: aspect,
                originalWidth: dimensions.width,
                originalHeight: dimensions.height
            });
            
            console.log(`加载照片: ${fileName}, 宽度: ${actualPhotoWidth.toFixed(2)}, 宽高比: ${aspect.toFixed(2)}`);
        } catch (error) {
            console.error(`加载照片失败: ${fileName}`, error.message);
        }
    }
    
    console.log('\n开始随机打乱照片顺序...');
    const shuffledPhotoInfo = [...photoInfoList].sort(() => Math.random() - 0.5);
    
    console.log('开始按宽度智能分组...');
    const sortedPhotos = [...shuffledPhotoInfo].sort((a, b) => b.width - a.width);
    
    const rows = Array.from({ length: totalRows }, () => []);
    const rowWidths = new Array(totalRows).fill(0);
    
    for (const photo of sortedPhotos) {
        let minRow = 0;
        let minWidth = rowWidths[0];
        
        for (let r = 1; r < totalRows; r++) {
            if (rowWidths[r] < minWidth) {
                minWidth = rowWidths[r];
                minRow = r;
            }
        }
        
        rows[minRow].push(photo);
        rowWidths[minRow] += photo.width;
    }
    
    console.log('\n分组结果:');
    rows.forEach((row, index) => {
        const totalWidth = row.reduce((sum, photo) => sum + photo.width, 0);
        console.log(`第 ${index + 1} 行: ${row.length} 张照片, 总宽度: ${totalWidth.toFixed(2)}`);
    });
    
    const avgWidth = rowWidths.reduce((sum, width) => sum + width, 0) / totalRows;
    const maxDeviation = Math.max(...rowWidths.map(width => Math.abs(width - avgWidth)));
    console.log(`\n平均每行宽度: ${avgWidth.toFixed(2)}`);
    console.log(`最大偏差: ${maxDeviation.toFixed(2)} (${(maxDeviation / avgWidth * 100).toFixed(1)}%)`);
    
    const configContent = `window.PHOTO_GROUPS_CONFIG = {
    rows: ${JSON.stringify(rows, null, 4)},
    totalRows: ${totalRows},
    photoHeight: ${photoHeight},
    lastUpdated: '${new Date().toISOString()}'
};`;
    
    fs.writeFileSync(configFile, configContent, 'utf8');
    console.log(`\n配置文件已保存到: ${configFile}`);
    console.log('分组计算完成！');
}

calculatePhotoGroups().catch(console.error);