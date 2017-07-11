module.exports = {
    entry: {
        'active_paths': ['./active_paths.js'],
        'context': ['./context.js'],
        'compile': ['./compile.js'],
        'patch': ['./patch.js'],
        'transforms': ['./transforms.js'],
        'utils': ['./utils.js'],
        'Magery': ['./magery.js']
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
