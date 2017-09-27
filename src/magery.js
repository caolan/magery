module.exports = {
    compileTemplates: require('./compile').eval,
    Template: require('./template'),
    lookup: require('./utils').lookup,
    Patcher: require('./patch').Patcher,
    patch: require('./patch').patch
};
