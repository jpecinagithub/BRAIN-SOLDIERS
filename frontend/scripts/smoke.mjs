import { spawn } from 'node:child_process'
import { setTimeout as delay } from 'node:timers/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const frontendDir = resolve(__dirname, '..')
const backendDir = resolve(frontendDir, '..', 'backend')
const API_BASE = 'http://localhost:3001'

function run(cmd, cwd) {
  return new Promise((resolveRun, rejectRun) => {
    const child = spawn(cmd, {
      cwd,
      shell: true,
      stdio: 'inherit'
    })

    child.on('exit', (code) => {
      if (code === 0) {
        resolveRun()
        return
      }
      rejectRun(new Error(`Command failed (${code}): ${cmd}`))
    })
    child.on('error', rejectRun)
  })
}

async function isApiUp() {
  try {
    const res = await fetch(`${API_BASE}/players`)
    return res.ok
  } catch {
    return false
  }
}

async function waitApiReady(ms = 15000) {
  const started = Date.now()
  while (Date.now() - started < ms) {
    if (await isApiUp()) return true
    await delay(500)
  }
  return false
}

async function checkEndpoint(url, expectedType) {
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`Endpoint failed (${res.status}): ${url}`)
  }
  const contentType = res.headers.get('content-type') || ''
  if (!contentType.includes(expectedType)) {
    throw new Error(`Unexpected content-type for ${url}: ${contentType}`)
  }
}

async function checkAvatarEndpoint() {
  const playersRes = await fetch(`${API_BASE}/players`)
  if (!playersRes.ok) {
    throw new Error(`Endpoint failed (${playersRes.status}): ${API_BASE}/players`)
  }

  const players = await playersRes.json()
  const avatarFile = Array.isArray(players) && players.length > 0 && players[0].avatar_file
    ? players[0].avatar_file
    : 'avatar1.png'

  await checkEndpoint(`${API_BASE}/avatars/${avatarFile}`, 'image/')
}

async function main() {
  console.log('[smoke] 1/4 Frontend build...')
  await run('npm run build', frontendDir)

  console.log('[smoke] 2/4 Backend syntax...')
  await run('node --check server.js', backendDir)

  let backendProcess = null
  let startedBySmoke = false

  if (!(await isApiUp())) {
    console.log('[smoke] 3/4 Starting backend for HTTP checks...')
    backendProcess = spawn('node server.js', {
      cwd: backendDir,
      shell: true,
      stdio: 'ignore',
      detached: false
    })
    startedBySmoke = true
    const ready = await waitApiReady()
    if (!ready) {
      throw new Error('Backend did not start in time on port 3001')
    }
  } else {
    console.log('[smoke] 3/4 Backend already running, reusing it...')
  }

  try {
    console.log('[smoke] 4/4 Endpoint checks...')
    await checkEndpoint(`${API_BASE}/players`, 'application/json')
    await checkAvatarEndpoint()
    console.log('[smoke] OK')
  } finally {
    if (startedBySmoke && backendProcess) {
      backendProcess.kill()
    }
  }
}

main().catch((err) => {
  console.error('[smoke] FAILED:', err.message)
  process.exit(1)
})
