require("dotenv").config();
const config = require("@Config");
const path = require("path");
const cors = require("cors");
const express = require("express");
const session = require("express-session");
const app = express();
const expressWs = require("express-ws")(app);
const bodyParser = require("body-parser");
const morgan = require("morgan");
const compression = require("compression");

// Enable CORS BEFORE other middleware
// Cors Origin Configuration
// You can set a comma-separated list in env: CORS_ALLOWED_ORIGINS
// Example: CORS_ALLOWED_ORIGINS="https://vn.78968.site,https://www.78968.site,https://api.78968.site"
const defaultAllowedOrigins = [
  "https://vn.78968.site",
  "https://www.78968.site",
  "https://78968.site",
  "https://m.78968.site",
  "https://api.78968.site",
  "http://localhost:3000",
  "http://localhost:8009",
  "http://localhost:8001",
  "http://localhost:3443",
];

const allowedOrigins = (config.CORS_ALLOWED_ORIGINS && typeof config.CORS_ALLOWED_ORIGINS === 'string')
  ? config.CORS_ALLOWED_ORIGINS.split(',').map(s => s.trim()).filter(Boolean)
  : defaultAllowedOrigins;

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    // If the origin matches the allowed list, return it to allow credentials
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, origin);
    } else {
      // In production be strict: reject unknown origins
      // For now we still allow unknown origins but log a warning
      console.warn(`CORS: origin not in allowed list: ${origin}`);
      callback(null, origin);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH', 'HEAD'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin', 'Access-Control-Request-Method', 'Access-Control-Request-Headers'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  optionsSuccessStatus: 200,
  preflightContinue: false,
  maxAge: 86400
};

// Ensure CORS is applied to ALL routes including errors
app.use((req, res, next) => {
  // Let cors middleware handle it, just ensure headers are always set
  const origin = req.headers.origin;
  if (origin) {
    // Store origin in response for potential use
    res.locals.origin = origin;
  }
  next();
});

// Apply CORS middleware - this handles all CORS headers
app.use(cors(corsOptions));

// Handle OPTIONS requests explicitly
app.options('*', cors(corsOptions));

// CORS middleware already handles all headers, no need for additional hook
// The cors library will set headers for all responses automatically

app.use(express.json());
// đọc dữ liệu from
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
// sử dụng để log mọi request ra console
app.use(morgan("[:date[iso]][:method :url HTTP/:http-version] Completed with status :status in :response-time ms"));
// specify the view engine is ejs
app.set("view engine", "ejs");
// specify the view folder is view
app.set("views", "./views");
// Serve static html, js, css, and image files from the 'public' directory
app.use(express.static(path.join(__dirname, "../public")));
// show request log
app.use(compression());
// express set session options
app.use(session({ resave: true, saveUninitialized: true, secret: config.SESSION_SECRET }));

// Initialize main socket
const socketInit = expressWs.getWss();

app.set("trust proxy", true);

// Initialize original objects, function...  when the application runs
require("@Loaders")(socketInit, null);
// Initialize schedule tasks
require("@Loaders/schedule")();

// Initialize services running in the background
require("@Services")(socketInit);

// Initialize the plugins to run when application runs
require("@Plugins")(socketInit);

// Initialize test sections
require("@Utils")(socketInit);

// Initialize the routers rest api
app.use("/api", require("@HttpRouters"));

// Initialize the routers WebSocket
require("@SocketRouters")(app, socketInit);

// Initialize the routers EntryPoint (Callback)
require("@EntryRouters")(app, socketInit);

// 404 handler - cors middleware already applied
app.use((req, res) => {
  res.status(404).json({
    status: false,
    msg: 'Route not found',
    code: 404
  });
});

// Error handler - cors middleware already applied
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    status: false,
    msg: err.message || 'Internal server error',
    code: 500
  });
});

const server = app.listen(config.PORT, () => {
  console.log(
    ">>> Express server is running at port %d in %s mode!",
    config.PORT,
    config.ENV_ENVIROMENT
  );
  console.log(">>> Press CTRL-C to stop server\n");
});

// Export server handle
module.exports = server;