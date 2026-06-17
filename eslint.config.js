import js from "@eslint/js";

export default [
    js.configs.recommended,
    {
        languageOptions: {
            globals: {
                window: "readonly",
                document: "readonly",
                console: "readonly",
            },
            ecmaVersion: "latest",
            sourceType: "module",
        },
        rules: {
            // 變數與宣告相關
            "no-var": "error",           // 禁止使用 var
            "prefer-const": "error",     // 能用 const 就用 const
            "no-unused-vars": "warn",    // 未使用的變數警告
            "no-undef": "error",         // 禁止使用未定義的變數

            // 語法與比較
            "eqeqeq": "error",           // 強制使用 ===
            "no-console": "warn",        // console.log 只警告，不禁止
            "curly": "error",            // if/else 必須加大括號

            // 風格相關
            "semi": ["error", "always"], // 強制分號
            "quotes": ["error", "double"], // 強制雙引號
            "indent": ["error", 4],      // 強制縮排 2 空格
            "no-trailing-spaces": "error", // 禁止行尾空格
            "eol-last": ["error", "always"], // 檔案最後必須有換行

            // 函式與結構
            "no-empty-function": "warn", // 禁止空函式
            "consistent-return": "error", // 函式必須一致 return
            "no-magic-numbers": ["warn", { "ignore": [0, 1, -1] }], // 避免魔法數字

            // ES6+ 特性
            "arrow-spacing": ["error", { "before": true, "after": true }],
            "no-dupe-keys": "error",     // 禁止物件重複 key
            "no-duplicate-imports": "error", // 禁止重複 import
        },
    },
];
