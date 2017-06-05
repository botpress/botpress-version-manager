import path from 'path'
import fs from 'fs'
import semver from 'semver'
import chalk from 'chalk'

module.exports = (bp, module_directory) => {

  const packageRoot = resolveModuleRootPath(module_directory)
  const packageJson = require(path.join(packageRoot, 'package.json'))

  const botpressRoot = process.cwd()
  const botpressPackageJson = require(path.join(botpressRoot, 'package.json'))

  const currentBotpressVersion = botpressPackageJson.version
  const currentModuleVersion = packageJson.version

  const version = packageJson['version-manager']

  // there's nothing to check, return without any error
  if (!version || process.env.BOTPRESS_DISABLE_VERSION_MANAGER) {
    return true
  }

  if (!semver.valid(currentBotpressVersion)) {
    bp.logger.warn('Invalid Botpress version: ' + currentBotpressVersion)
    return true
  }

  if (semver.satisfies(currentBotpressVersion, version['botpress-check'])) {
    return true
  }

  const v = text => chalk.yellow.bold(text)
  const u = text => chalk.underline(text)
  const c = text => chalk.bgWhite.black(text)

  const upgradeCmd = `npm install -S botpress@${version['botpress-update']}`
  const downgradeCmd = `npm install -S ${packageJson.name}@${version['module-downgrade']}`

  bp.logger.error('======= VERSION MANAGER =======')

  bp.logger.error(`The current version of ${packageJson.name} installed is ${v(currentModuleVersion)}`)
  bp.logger.error(`However, your bot is using a local version of botpress version ${v(currentBotpressVersion)}`)
  bp.logger.error(`Which is incompatible with this version of ${packageJson.name}. (botpress should satisfy '${version['botpress-check']}')`)
  bp.logger.error(`To resolve this issue, you may either:\n`)
  bp.logger.error(`${c(' A) ')} Migrate to a newer version of botpress --> ${v(upgradeCmd)}`)
  bp.logger.error(`${c(' B) ')} Try downgrading this module by a major version --> ${v(downgradeCmd)}\n`)

  if (version.warn && version.warn.length > 0) {
    bp.logger.warn("If you decide to update botpress:", version.warn)
  }

  bp.logger.error('================================')

  throw new Error('Package ' + packageJson.name + ' is incompatible with your version of botpress')
}

function resolveModuleRootPath(entryPath) {
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
