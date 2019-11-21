"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const path = __importStar(require("path"));
async function writeFile(p, content) {
    await fs_1.promises.mkdir(path.dirname(p), { recursive: true });
    return fs_1.promises.writeFile(p, content);
}
function createBuildFile(packagePath) {
    const contents = `package(default_visibility = ["//visibility:public"])
load("@build_bazel_rules_nodejs//internal/npm_install:node_module_library.bzl", "node_module_library")

filegroup(
    name = "${packagePath}",
    srcs = [] # we dont care about the actual content, we want a list of dependencies to modify the pnp file around
)
`;
    return writeFile(`${packagePath}/BUILD.bazel`, contents);
}
async function main(workspacePath) {
    const contents = `package(default_visibility = ["//visibility:public"])
exports_files([
    ".pnp.js",
    "package.json",
])`;
    const packageJson = require(path.join(workspacePath, "package.json"));
    await Promise.all([
        "dependencies",
        "devDependencies",
        "peerDependencies",
        "optionalDependencies"
    ].map(d => {
        return Promise.all(Object.keys(packageJson[d] || {})
            .map(createBuildFile)
            .concat([writeFile("BUILD.bazel", contents)]));
    }));
}
main(process.argv[2]);
