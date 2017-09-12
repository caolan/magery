var BOOLEAN_ATTRIBUTE = exports.BOOLEAN_ATTRIBUTE = 1;
var USE_PROPERTY = exports.USE_PROPERTY = 2;

exports.attributes = {
    'allowfullscreen': BOOLEAN_ATTRIBUTE,
    'async': BOOLEAN_ATTRIBUTE,
    'autofocus': BOOLEAN_ATTRIBUTE,
    'autoplay': BOOLEAN_ATTRIBUTE,
    'capture': BOOLEAN_ATTRIBUTE,
    'checked': BOOLEAN_ATTRIBUTE | USE_PROPERTY,
    'controls': BOOLEAN_ATTRIBUTE,
    'default': BOOLEAN_ATTRIBUTE,
    'defer': BOOLEAN_ATTRIBUTE,
    'disabled': BOOLEAN_ATTRIBUTE,
    'formnovalidate': BOOLEAN_ATTRIBUTE,
    'hidden': BOOLEAN_ATTRIBUTE,
    'itemscope': BOOLEAN_ATTRIBUTE,
    'loop': BOOLEAN_ATTRIBUTE,
    'multiple': BOOLEAN_ATTRIBUTE | USE_PROPERTY,
    'muted': BOOLEAN_ATTRIBUTE | USE_PROPERTY,
    'novalidate': BOOLEAN_ATTRIBUTE,
    'open': BOOLEAN_ATTRIBUTE,
    'readonly': BOOLEAN_ATTRIBUTE,
    'required': BOOLEAN_ATTRIBUTE,
    'reversed': BOOLEAN_ATTRIBUTE,
    'selected': BOOLEAN_ATTRIBUTE | USE_PROPERTY,
    'value': USE_PROPERTY
};

