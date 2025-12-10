"use strict";

const dotenv = require('dotenv');
const assert = require('assert');
const path = require('path');

// environment file error should crash whole process
const ENV_FILE_PATH = path.resolve(".env");
const isEnvFound = dotenv.config({ path: ENV_FILE_PATH });
if (isEnvFound.error) {
    throw new Error("Cannot find .env file.");
}

const {
    ENV_ENVIROMENT,
    PORT,
    JWT_SCRET_KEY,
    JWT_EXPIRES_IN,
    SESSION_SECRET,
    SITE_DOMAIN,
    // MINIGAME_API
} = process.env;

assert(ENV_ENVIROMENT, "ENV_ENVIROMENT configuration is required.");
assert(PORT, "PORT configuration is required.");
assert(JWT_SCRET_KEY, "JWT_SCRET_KEY configuration is required.");
assert(JWT_EXPIRES_IN, "JWT_EXPIRES_IN configuration is required.");
assert(SESSION_SECRET, "SESSION_SECRET configuration is required.");
assert(SITE_DOMAIN, "SITE_DOMAIN configuration is required.");
// assert(MINIGAME_API, "MINIGAME_API configuration is required.");

module.exports = process.env;