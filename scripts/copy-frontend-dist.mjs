import { promises as fs } from 'fs'
import path from 'path'

const rootDir = path.resolve(process.cwd())
const srcDir = path.join(rootDir, 'frontend', 'dist')
const destDir = path.join(rootDir, 'backend', 'public', 'app')

async function pathExists(target) {
  try {
    await fs.access(target)
    return true
  } catch {
    return false
  }
}

async function removeDir(target) {
  if (await pathExists(target)) {
    await fs.rm(target, { recursive: true, force: true })
  }
}

async function copyDir(src, dest) {
  await fs.mkdir(dest, { recursive: true })
  const entries = await fs.readdir(src, { withFileTypes: true })
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name)
    const destPath = path.join(dest, entry.name)
    if (entry.isDirectory()) {
      await copyDir(srcPath, destPath)
    } else {
      await fs.copyFile(srcPath, destPath)
    }
  }
}

async function main() {
  if (!(await pathExists(srcDir))) {
    console.log(`[copy-frontend-dist] No dist found at ${srcDir}`)
    return
  }

  await removeDir(destDir)
  await copyDir(srcDir, destDir)
  console.log(`[copy-frontend-dist] Copied dist to ${destDir}`)
}

main().catch((err) => {
  console.error('[copy-frontend-dist] Failed:', err)
  process.exitCode = 1
})
