import express from 'express';
import logger from './middleware/logger.middleware.js'
import router from './Routes/userRoutes.js';

const app = express();

app.use(express.json());

app.use(logger)
app.use('/users', router);

export default app;