module.exports = {
    entry: {
        'compile': ['./src/compile.js'],
        'patch': ['./src/patch.js'],
        'transforms': ['./src/transforms.js'],
        'utils': ['./src/utils.js'],
        'Magery': ['./src/magery-runtime.js'],
        'MageryCompiler': ['./src/magery-compiler.js']
    },
    output: {
        path: 'build/test',
        filename: '[name].js',
        // export itself to a global var
        libraryTarget: 'var',
        // name of the global var
        library: '[name]'
    }
};
