import { app } from './src/app.js';
import config from './src/config/config.js';
import { connectDB } from './src/data/database.js';

const startServer = async () => {
    await connectDB();

    app.listen(config.PORT, () => {
        console.log(`Server running on port ${config.PORT}`);
    });
};

startServer().catch((error) => {
    console.error(`Server startup failed: ${error.message}`);
    process.exit(1);
});

