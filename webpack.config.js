module.exports = [
    {
        entry: "./src/magery-runtime.js",
        output: {
            path: "build",
            filename: "magery-runtime.js",
            // export itself to a global var
            libraryTarget: "var",
            // name of the global var
            library: "Magery"
        }
    },
    {
        entry: "./src/magery-compiler.js",
        output: {
            path: "build",
            filename: "magery-compiler.js",
            // export itself to a global var
            libraryTarget: "var",
            // name of the global var
            library: "MageryCompiler"
        }
    },
];
