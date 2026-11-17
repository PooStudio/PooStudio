const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();
const allowedOrigins = new Set([
	'https://poostudio.github.io',
	'https://laggy.world',
]);

app.disable('x-powered-by');
app.use(helmet({
	contentSecurityPolicy: false,
	strictTransportSecurity: process.env.NODE_ENV === 'production' ? undefined : false
}));
app.use(cors({
	origin(origin, callback) {
		if (!origin || allowedOrigins.has(origin)) return callback(null, true);
		return callback(new Error('Origin not allowed by CORS'));
	},
	methods: ['GET'],
	optionsSuccessStatus: 204
}));
app.use(express.json({ limit: '16kb' }));
app.use(rateLimit({
	windowMs: 15 * 60 * 1000,
	limit: 100,
	standardHeaders: 'draft-7',
	legacyHeaders: false
}));

app.get('/health', (_req, res) => res.json({ ok: true }));

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server listening on port ${port}`));
