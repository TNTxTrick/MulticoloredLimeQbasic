const express = require('express');
const fs = require('fs');
const app = express();
const PORT = 3000;

// Static files
app.use(express.json());

app.get("/", async function (req, res) {
	res.sendFile(path.join(__dirname, "/public/index.html"));
});

// Đọc danh sách IP từ file
function readIPFile() {
    try {
        const data = fs.readFileSync('./ip.txt', 'utf8');
        return data.split('\n').filter(ip => ip.trim() !== '');
    } catch (err) {
        console.error('Error reading IP file:', err);
        return [];
    }
}

// Ghi IP vào file
function writeIPToFile(ip) {
    try {
        fs.appendFileSync('./ip.txt', `${ip}\n`);
    } catch (err) {
        console.error('Error writing to IP file:', err);
    }
}

// Xóa file IP
function clearIPFile() {
    try {
        fs.writeFileSync('./ip.txt', '');
        console.log('Reset IP list at midnight');
    } catch (err) {
        console.error('Error clearing IP file:', err);
    }
}

// API endpoint to request an API key
app.get('/request-key', (req, res) => {
    const filePath = './key.txt';
    const clientIP = req.ip; // Lấy IP của client
    const requestedIPs = readIPFile(); // Đọc danh sách IP đã lưu

    // Kiểm tra nếu IP đã yêu cầu key trước đó
    if (requestedIPs.includes(clientIP)) {
        return res.status(403).json({ message: 'You have already requested an API key.' });
    }

    // Đọc file chứa danh sách key
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading key file:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }

        const keys = data.split('\n').filter(key => key.trim() !== '');

        // Kiểm tra nếu còn key
        if (keys.length === 0) {
            return res.json({ message: 'Bạn đã request key trước đó hoặc đã hết key.' });
        }

        const apiKey = keys[0]; // Lấy key đầu tiên

        // Cập nhật danh sách key trong file
        const updatedKeys = keys.slice(1).join('\n');
        fs.writeFile(filePath, updatedKeys, 'utf8', err => {
            if (err) {
                console.error('Error updating key file:', err);
                return res.status(500).json({ error: 'Internal server error' });
            }

            // Ghi IP vào file
            writeIPToFile(clientIP);

            res.json({ apiKey });
        });
    });
});

// Reset danh sách IP vào lúc 0h hàng ngày
function resetIPFileAtMidnight() {
    const now = new Date();
    const msUntilMidnight =
        new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime() - now.getTime();

    setTimeout(() => {
        clearIPFile(); // Xóa file IP
        resetIPFileAtMidnight(); // Đặt lại thời gian reset cho ngày tiếp theo
    }, msUntilMidnight);
}

// Bắt đầu chức năng reset IP
resetIPFileAtMidnight();

// Start server
app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});
