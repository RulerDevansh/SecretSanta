const dotenv = require('dotenv');
const connectDB = require('./config/db');
dotenv.config();
const createApp = require('./app');
const app = createApp();

const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to start server', err);
    process.exit(1);
  });
