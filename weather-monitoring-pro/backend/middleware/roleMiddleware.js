const checkRole = (role) => {
    return (req, res, next) => {
        if (req.user && req.user.role === role) {
            next();
        } else {
            res.status(403);
            res.json({ message: 'Not authorized as ' + role });
        }
    };
};

module.exports = { checkRole };
