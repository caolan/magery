module.exports = {
    compile: require('./compile'),
    Template: require('./template'),
    lookup: require('./utils').lookup,
    Patcher: require('./patch').Patcher,
    patch: require('./patch').patch
};
