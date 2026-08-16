const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors());
app.use(express.json());

// مسیر اصلی
app.get('/', (req, res) => {
    res.json({ message: 'Server is running!' });
});

// مسیر Health Check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', subscriptions: 0 });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log('Server running on port', PORT);
});