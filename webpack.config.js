module.exports = {
    entry: "./magery.js",
    output: {
        path: "build",
        filename: "magery.js",
        // export itself to a global var
        libraryTarget: "var",
        // name of the global var
        library: "Magery"
    }
};
