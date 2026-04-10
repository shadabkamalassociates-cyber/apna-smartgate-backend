const allowRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.admin.role))
      return res.status(403).json({ message: "Access denied" });
    next();
  };
};


module.exports = {allowRoles}