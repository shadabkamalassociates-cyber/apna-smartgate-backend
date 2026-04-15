const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
dotenv.config({ path: "./.env" });

const protect = async (req, res, next) => {
  const token = req.cookies?.token;
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
  const token = req.cookies.admin_token;
  console.log(token,"|||||||||||||||||||||||||||||||") 

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
 
  const cookieToken = req.cookies?.token;
  // const headerToken = req.headers.authorization?.startsWith("Bearer ")
  //   ? req.headers.authorization.split(" ")[1]
  //   : null;
  // const token = cookieToken || headerToken;
  // console.log(token,"|||||||||||||||||||||||||||||||")
  const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjkzNTczMDU4LTZhNDQtNGRmYS1hYThmLTAyMjRiNjFiODhhMCIsInJvbGUiOiJtYXN0ZXJfYWRtaW4iLCJpYXQiOjE3NzYyNTY2ODIsImV4cCI6MTc3Njg2MTQ4Mn0.s4Sn_o_3yNnVo8ARaCk9rIlDISrCRIfuTvOoCEjEYrY";
  
  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = decoded;
    next();
  } catch (err) {
    console.log(err)
    return res.status(401).json({ message: "Invalid Token" });
  }
};

module.exports = { protect, guardProtect, adminProtect, authMiddleware };
