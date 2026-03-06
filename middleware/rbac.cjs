module.exports = (allowed = []) => {
  return (req, res, next) => {
    const user = req.user;

    if (!user || !allowed.includes(user.role)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    next();
  };
};
