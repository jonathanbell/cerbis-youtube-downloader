module.exports = {
    "extends": "standard",
    "plugins": [
        "standard"
    ],
    "rules": {
        "indent": ["error", 2],
        "quotes": ["error", "single"],
        "semi": ["error", "always"],
        "no-trailing-spaces": ["error", { "skipBlankLines": true }],
        "no-var": ["error"],
        "space-before-function-paren": ["error", {
            "anonymous": "never",
            "named": "never",
            "asyncArrow": "always"
        }],
        "padded-blocks": [2, "always"]
    }
};
