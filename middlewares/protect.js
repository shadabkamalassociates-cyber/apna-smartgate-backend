const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
dotenv.config({ path: "./.env" });

function extractBearerToken(req) {
  const auth = req.headers.authorization;
  if (typeof auth === "string" && auth.toLowerCase().startsWith("bearer ")) {
    const t = auth.slice("bearer ".length).trim();
    return t || null;
  }

  const alt =
    req.headers["x-access-token"] ||
    req.headers["x-auth-token"] ||
    req.headers["token"];
  if (typeof alt === "string" && alt.trim()) return alt.trim();

  return null;
}

const protect = async (req, res, next) => {
  const token = req.cookies?.token || extractBearerToken(req);
  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const decode = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decode;
    next();
  } catch (error) {
    return res.status(403).json({ message: "Invalid token" });
  }
};

const guardProtect = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) return res.status(401).json({ message: "You are not logged in!" });

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next(); 
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

const adminProtect = (req, res, next) => {
  const token =
    req.cookies?.admin_token || req.cookies?.token || extractBearerToken(req);

  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.admin = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid token" });
  }
};

const authMiddleware = (req, res, next) => {
  // const cookieToken = req.cookies?.token;
  // const headerToken = extractBearerToken(req);
  // const token = cookieToken || headerToken;
  const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjhlMmNkYjU2LTY4Y2EtNDc3Ny04M2FiLWRlNzJhNmMxOTMwMyIsInJvbGUiOiJtYXN0ZXJfYWRtaW4iLCJpYXQiOjE3NzgxNDgyMjksImV4cCI6MTc3ODc1MzAyOX0.2dnqxiN22tFFXvgXOn3oAz1h81lN_mQpWlmk3pZqDlQ';
  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    console.log(decoded,"|||||||||||||||||||||||||||||||")
    req.user = decoded;
    next();
  } catch (err) {
    console.error(err);
    return res.status(401).json({ message: "Invalid Token" });
  }
};

module.exports = { protect, guardProtect, adminProtect, authMiddleware };
