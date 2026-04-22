const mongoose = require('mongoose');

const CONNECT_TIMEOUT_MS = 10_000;

const MONGOOSE_OPTS = {
    serverSelectionTimeoutMS: CONNECT_TIMEOUT_MS,
    connectTimeoutMS: CONNECT_TIMEOUT_MS,
    socketTimeoutMS: CONNECT_TIMEOUT_MS,
};

let mongod = null;

function workerScopedUri(uri) {
    // Jest runs each test file in a separate worker against a shared mongod.
    // Give each worker its own DB so parallel files don't step on each other.
    const workerId = process.env.JEST_WORKER_ID || '1';
    const u = new URL(uri);
    const db = (u.pathname.replace(/^\//, '') || 'test') + `_w${workerId}`;
    u.pathname = '/' + db;
    return u.toString();
}

async function connectTestDb() {
    if (process.env.MONGO_TEST_URI) {
        await mongoose.connect(workerScopedUri(process.env.MONGO_TEST_URI), MONGOOSE_OPTS);
        return;
    }

    const { MongoMemoryServer } = require('mongodb-memory-server');
    mongod = await MongoMemoryServer.create();
    await mongoose.connect(mongod.getUri(), MONGOOSE_OPTS);
}

async function disconnectTestDb() {
    await mongoose.disconnect();
    if (mongod) {
        await mongod.stop();
        mongod = null;
    }
}

module.exports = { connectTestDb, disconnectTestDb };
