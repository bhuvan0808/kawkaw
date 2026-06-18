allprojects {
    repositories {
        google()
        mavenCentral()
    }
}

val newBuildDir: Directory =
    rootProject.layout.buildDirectory
        .dir("../../build")
        .get()
rootProject.layout.buildDirectory.value(newBuildDir)

subprojects {
    val newSubprojectBuildDir: Directory = newBuildDir.dir(project.name)
    project.layout.buildDirectory.value(newSubprojectBuildDir)

    // Some plugins (e.g. vibration, geolocator) pull androidx deps that require
    // compileSdk 34/36, but each plugin module defaults to this Flutter's
    // flutter.compileSdkVersion (33). Force every Android subproject to compile
    // against 36 so checkAarMetadata passes — the error's recommended action.
    // Registered here (before evaluationDependsOn below) so it lands while each
    // subproject is still being configured, not after it is already evaluated.
    afterEvaluate {
        val androidExt = project.extensions.findByName("android")
        if (androidExt is com.android.build.gradle.BaseExtension) {
            androidExt.compileSdkVersion(36)
        }
    }
}
subprojects {
    project.evaluationDependsOn(":app")
}

tasks.register<Delete>("clean") {
    delete(rootProject.layout.buildDirectory)
}
