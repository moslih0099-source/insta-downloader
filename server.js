const http = require('http');
const url = require('url');
const { exec } = require('child_process');

const server = http.createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        return res.end();
    }
    
    const parsedUrl = url.parse(req.url, true);
    
    if (parsedUrl.pathname === '/download' && req.method === 'GET') {
        const videoUrl = parsedUrl.query.url;
        
        if (!videoUrl) {
            res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
            return res.end(JSON.stringify({ error: 'الرجاء إدخال الرابط أولاً' }));
        }
        
        // استخدام أمر مطور يضيف قناع متصفح حقيقي (User-Agent) ويجلب الفيديو المدمج مباشرة لمنع الحظر
        const command = `yt-dlp -g -f "b" --no-playlist --user-agent "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" "${videoUrl}"`;
        
        exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error(stderr);
                res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
                return res.end(JSON.stringify({ error: 'تعذر الاتصال بانستقرام، جرب تشغيل/إطفاء وضع الطيران لتغيير الـ IP' }));
            }
            
            const lines = stdout.trim().split('\n');
            const realLink = lines[0] ? lines[0].trim() : '';
            
            if (realLink && realLink.startsWith('http')) {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                return res.end(JSON.stringify({ downloadLink: realLink }));
            } else {
                res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
                return res.end(JSON.stringify({ error: 'فشل استخراج الرابط النقي، جرب رابط مقطع آخر' }));
            }
        });
    } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found');
    }
});

process.on('uncaughtException', (err) => {
    console.error('حماية ذاتية:', err.message);
});

server.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
});
