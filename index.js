import path from 'path'
import fs from 'fs'
import _ from 'lodash'
import semver from 'semver'

const resolveModuleRootPath = function(entryPath) {
  let current = entryPath
  while (current !== '/') {
    const lookup = path.join(current, 'package.json')
    if (fs.existsSync(lookup)) {
      return current
    }

    current = path.resolve(path.join(current, '..'))
  }
  return null
}

const compareVersions = comparrer => arr => {
  let max = _.head(arr)
  _.each(arr, x => {
    if (comparrer(max, x)) {
      max = x
    }
  })

  return max
}

const greatestVersion = compareVersions(semver.gt)
const lowestVersion = compareVersions(semver.lt)

module.exports = module_directory => {

  // TODO: Package json path

  console.log(module_directory)
  const packageRoot = resolveModuleRootPath(module_directory)
  console.log(packageRoot)
  const packageJson = require(path.join(packageRoot, 'package.json'))

  const botpressRoot = process.cwd()
  const botpressPackageJson = require(path.join(botpressRoot, 'package.json'))

  const currentBotpressVersion = botpressPackageJson.version
  const currentModuleVersion = packageJson.version

  const lastSupportedVersions = []
  const compatibleBotpressVersions = []

  _.each(packageJson.versioning, version => {
    console.log('::c1:: ', currentBotpressVersion, version.botpress)
    if (semver.satisfies(currentBotpressVersion, version.botpress)) {
      lastSupportedVersions.push(version['~'])
    }

    if (semver.satisfies(currentModuleVersion, version['~'])) {
      compatibleBotpressVersions.push(version.botpress)
    }
  })

  const lastSupportedVersion = greatestVersion(lastSupportedVersions)
  const compatibleBotpressVersion = greatestVersion(compatibleBotpressVersions)
  const minimumBotpressVersion = lowestVersion(compatibleBotpressVersions)

  const isOK = semver.gt(currentBotpressVersion, minimumBotpressVersion)

  console.log(lastSupportedVersions, '>>> BOTPRESS >> ', compatibleBotpressVersions)

  console.log('last supported version for your current version of botpress = ', lastSupportedVersion)
  console.log('minimum botpress version for your current package version = ', minimumBotpressVersion)
  console.log('IS currently OK ??', isOK)
}