module.exports = function requireTeamLead(req, res, next) {
  if (req.user?.role !== "team_lead") {
    return res.status(403).json({ ok: false, message: "Access denied" });
  }
  next();
};
