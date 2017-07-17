module.exports = {
    entry: {
        'active_paths': ['./src/active_paths.js'],
        'compile': ['./src/compile.js'],
        'patch': ['./src/patch.js'],
        'transforms': ['./src/transforms.js'],
        'utils': ['./src/utils.js'],
        'Magery': ['./src/magery.js']
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
