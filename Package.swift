// swift-tools-version: 5.10
import PackageDescription

let package = Package(
    name: "DMVEngine",
    platforms: [
        .iOS(.v17),
        .macOS(.v14),
    ],
    products: [
        .library(name: "DMVEngine", targets: ["DMVEngine"]),
        .executable(name: "SmokeCheck", targets: ["SmokeCheck"]),
    ],
    targets: [
        .target(name: "DMVEngine"),
        .executableTarget(name: "SmokeCheck", dependencies: ["DMVEngine"]),
        .testTarget(name: "DMVEngineTests", dependencies: ["DMVEngine"]),
    ]
)
