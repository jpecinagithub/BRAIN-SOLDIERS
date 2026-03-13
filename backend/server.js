require("dotenv").config()
const express = require("express")
const sqlite3 = require("sqlite3").verbose()
const cors = require("cors")
const path = require("path")
const fs = require("fs")

const BASE_DIR = path.join(__dirname)
const PUBLIC_DIR = path.join(BASE_DIR, "public")
const AVATAR_DIR = path.join(PUBLIC_DIR, "avatars")
const GAMES_DIR = path.join(PUBLIC_DIR, "games")
const frontendDistEnv = process.env.FRONTEND_DIST_PATH
const FRONTEND_DIST_DIR = frontendDistEnv
  ? path.isAbsolute(frontendDistEnv)
    ? frontendDistEnv
    : path.resolve(BASE_DIR, frontendDistEnv)
  : path.resolve(BASE_DIR, "..", "frontend", "dist")
const FRONTEND_INDEX_PATH = path.join(FRONTEND_DIST_DIR, "index.html")
const hasFrontendDist = fs.existsSync(FRONTEND_INDEX_PATH)

const DEFAULT_DB_PATH = path.join(BASE_DIR, "database.db")
const configuredDbPath = process.env.SQLITE_DB_PATH || DEFAULT_DB_PATH
const RESOLVED_DB_PATH = path.isAbsolute(configuredDbPath)
  ? configuredDbPath
  : path.resolve(BASE_DIR, configuredDbPath)
const dbDir = path.dirname(RESOLVED_DB_PATH)
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true })
}

if (RESOLVED_DB_PATH !== DEFAULT_DB_PATH && fs.existsSync(DEFAULT_DB_PATH) && !fs.existsSync(RESOLVED_DB_PATH)) {
  try {
    fs.copyFileSync(DEFAULT_DB_PATH, RESOLVED_DB_PATH)
  } catch (err) {
    console.error("Error copying seed database:", err.message)
  }
}

const app = express()

const rawCorsOrigins = process.env.CORS_ORIGINS || ""
const allowedOrigins = rawCorsOrigins
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean)

const defaultDevOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173"
]

const effectiveAllowedOrigins = allowedOrigins.length > 0 ? allowedOrigins : defaultDevOrigins
const corsOptions = {
  origin(origin, callback) {
    // Allow curl/postman and same-origin calls with no Origin header.
    if (!origin) {
      callback(null, true)
      return
    }

    if (effectiveAllowedOrigins.includes("*") || effectiveAllowedOrigins.includes(origin)) {
      callback(null, true)
      return
    }

    callback(new Error(`CORS blocked for origin: ${origin}`))
  },
  methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}

app.use(cors(corsOptions))
app.options("*", cors(corsOptions))
app.use(express.json())
app.use("/avatars", express.static(AVATAR_DIR))
app.use("/games", express.static(GAMES_DIR))

if (hasFrontendDist) {
  app.use(express.static(FRONTEND_DIST_DIR))
}

const db = new sqlite3.Database(RESOLVED_DB_PATH)

const initialPlayers = [
  "Pedrochibus",
  "Michel",
  "Gabi",
  "Don Pablo",
  "Don Anselmo",
  "Don Alfonso",
  "Manolo",
  "Jon"
]

const AVATAR_FILES = fs.existsSync(AVATAR_DIR)
  ? fs.readdirSync(AVATAR_DIR)
      .filter((fileName) => /^avatar\d+\.png$/i.test(fileName))
      .sort((a, b) => {
        const aNum = Number((a.match(/\d+/) || [0])[0])
        const bNum = Number((b.match(/\d+/) || [0])[0])
        return aNum - bNum
      })
  : []

function shuffleArray(items) {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

function pickAvailableAvatarFile(callback) {
  if (AVATAR_FILES.length === 0) {
    callback(new Error("No avatar files found in /public/avatars"))
    return
  }

  db.all(
    "SELECT avatar_file FROM players WHERE avatar_file IS NOT NULL AND TRIM(avatar_file) != ''",
    (err, rows) => {
      if (err) {
        callback(err)
        return
      }

      const used = new Set(rows.map((row) => row.avatar_file))
      const available = AVATAR_FILES.filter((fileName) => !used.has(fileName))
      if (available.length === 0) {
        callback(new Error("No avatars available"))
        return
      }

      const randomIndex = Math.floor(Math.random() * available.length)
      callback(null, available[randomIndex])
    }
  )
}

function assignMissingAvatars() {
  if (AVATAR_FILES.length === 0) {
    console.error("No avatar files found in /public/avatars")
    return
  }

  db.all("SELECT id FROM players WHERE avatar_file IS NULL OR TRIM(avatar_file) = ''", (missingErr, missingRows) => {
    if (missingErr) {
      console.error("Error checking missing avatars:", missingErr.message)
      return
    }

    if (!missingRows.length) {
      return
    }

    db.all(
      "SELECT avatar_file FROM players WHERE avatar_file IS NOT NULL AND TRIM(avatar_file) != ''",
      (usedErr, usedRows) => {
        if (usedErr) {
          console.error("Error loading used avatars:", usedErr.message)
          return
        }

        const used = new Set(usedRows.map((row) => row.avatar_file))
        const available = shuffleArray(AVATAR_FILES.filter((fileName) => !used.has(fileName)))

        missingRows.forEach((row, index) => {
          const avatarFile = available[index]
          if (!avatarFile) {
            return
          }

          db.run("UPDATE players SET avatar_file = ? WHERE id = ?", [avatarFile, row.id], (updateErr) => {
            if (updateErr) {
              console.error(`Error assigning avatar for player ${row.id}:`, updateErr.message)
            }
          })
        })
      }
    )
  })
}

function ensureSettingsReady(callback) {
  db.run(
    `
      CREATE TABLE IF NOT EXISTS app_settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      )
    `,
    (createErr) => {
      if (createErr) {
        callback(createErr)
        return
      }

      db.run(
        "INSERT OR IGNORE INTO app_settings (key, value) VALUES ('game_mode', 'individual')",
        (seedErr) => {
          if (seedErr) {
            callback(seedErr)
            return
          }
          callback(null)
        }
      )
    }
  )
}

db.serialize(() => {
  ensureSettingsReady((settingsErr) => {
    if (settingsErr) {
      console.error("Error initializing app settings:", settingsErr.message)
    }
  })

  db.run(`
    CREATE TABLE IF NOT EXISTS teams (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS players (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE,
      score INTEGER DEFAULT 0,
      avatar_file TEXT,
      team_id INTEGER,
      FOREIGN KEY (team_id) REFERENCES teams(id)
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS scores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      player_id INTEGER,
      game TEXT,
      points INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  db.all("PRAGMA table_info(players)", (pragmaErr, columns) => {
    if (pragmaErr) {
      console.error("Error checking players schema:", pragmaErr.message)
      return
    }

    const hasTeamId = Array.isArray(columns) && columns.some((column) => column.name === "team_id")
    if (!hasTeamId) {
      db.run("ALTER TABLE players ADD COLUMN team_id INTEGER", (alterErr) => {
        if (alterErr) {
          console.error("Error adding team_id column:", alterErr.message)
        }
      })
    }

    const hasAvatarFile = Array.isArray(columns) && columns.some((column) => column.name === "avatar_file")
    if (!hasAvatarFile) {
      db.run("ALTER TABLE players ADD COLUMN avatar_file TEXT", (alterErr) => {
        if (alterErr) {
          console.error("Error adding avatar_file column:", alterErr.message)
          return
        }
        assignMissingAvatars()
      })
    } else {
      assignMissingAvatars()
    }
  })

  db.get("SELECT COUNT(*) AS count FROM players", (countErr, row) => {
    if (countErr) {
      console.error("Error checking initial players:", countErr.message)
      return
    }

    if ((row?.count || 0) > 0) {
      return
    }

    const initialAvatars = shuffleArray(AVATAR_FILES)
    const stmt = db.prepare("INSERT INTO players (name, score, avatar_file) VALUES (?, 0, ?)")
    initialPlayers.forEach((name, index) => stmt.run(name, initialAvatars[index] || null))
    stmt.finalize()
  })

})

function getGameMode(callback) {
  ensureSettingsReady((settingsErr) => {
    if (settingsErr) {
      callback(settingsErr)
      return
    }

    db.get(
      "SELECT value FROM app_settings WHERE key = 'game_mode'",
      (err, row) => {
        if (err) {
          callback(err)
          return
        }
        const mode = row?.value === "teams" ? "teams" : "individual"
        callback(null, mode)
      }
    )
  })
}

app.get("/settings/game-mode", (req, res) => {
  getGameMode((err, mode) => {
    if (err) {
      res.status(500).json({ error: err.message })
      return
    }
    res.json({ mode })
  })
})

app.patch("/settings/game-mode", (req, res) => {
  const mode = String(req.body?.mode || "").trim().toLowerCase()
  if (mode !== "individual" && mode !== "teams") {
    res.status(400).json({ error: "Mode must be 'individual' or 'teams'" })
    return
  }

  ensureSettingsReady((settingsErr) => {
    if (settingsErr) {
      res.status(500).json({ error: settingsErr.message })
      return
    }

    db.run(
      "INSERT OR REPLACE INTO app_settings (key, value) VALUES ('game_mode', ?)",
      [mode],
      (err) => {
        if (err) {
          res.status(500).json({ error: err.message })
          return
        }
        res.json({ status: "ok", mode })
      }
    )
  })
})

app.get("/ranking", (req, res) => {
  getGameMode((modeErr, mode) => {
    if (modeErr) {
      res.status(500).json({ error: modeErr.message })
      return
    }

    const query =
      mode === "teams"
        ? `
          SELECT
            COALESCE(teams.name, 'Sin equipo') AS name,
            COALESCE(SUM(players.score), 0) AS score
          FROM players
          LEFT JOIN teams ON teams.id = players.team_id
          GROUP BY COALESCE(teams.name, 'Sin equipo')
          ORDER BY score DESC, name ASC
        `
        : `
          SELECT
            players.name AS name,
            players.score AS score
          FROM players
          ORDER BY players.score DESC, players.name ASC
        `

    db.all(query, (err, rows) => {
      if (err) {
        res.status(500).json({ error: err.message })
        return
      }
      res.json(rows)
    })
  })
})

app.get("/players", (req, res) => {
  db.all(`
    SELECT players.id, players.name, players.score, players.avatar_file, players.team_id, teams.name AS team_name
    FROM players
    LEFT JOIN teams ON teams.id = players.team_id
    ORDER BY players.name ASC
  `, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message })
      return
    }
    res.json(rows)
  })
})

app.post("/players", (req, res) => {
  const name = String(req.body?.name || "").trim()
  if (!name) {
    res.status(400).json({ error: "Name is required" })
    return
  }

  pickAvailableAvatarFile((avatarErr, avatarFile) => {
    if (avatarErr) {
      if (avatarErr.message === "No avatars available") {
        res.status(409).json({ error: "No hay avatares disponibles. Añade más imágenes o elimina jugadores." })
        return
      }
      res.status(500).json({ error: avatarErr.message })
      return
    }

    db.run("INSERT INTO players (name, score, avatar_file, team_id) VALUES (?, 0, ?, NULL)", [name, avatarFile], function(err) {
      if (err) {
        if (err.message.includes("UNIQUE")) {
          res.status(409).json({ error: "Player already exists" })
          return
        }
        res.status(500).json({ error: err.message })
        return
      }

      res.status(201).json({ id: this.lastID, name, score: 0, avatar_file: avatarFile, team_id: null, team_name: null })
    })
  })
})

app.get("/teams", (req, res) => {
  db.all("SELECT id, name FROM teams ORDER BY name ASC", (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message })
      return
    }
    res.json(rows)
  })
})

app.post("/teams", (req, res) => {
  const name = String(req.body?.name || "").trim()
  if (!name) {
    res.status(400).json({ error: "Name is required" })
    return
  }

  db.run("INSERT INTO teams (name) VALUES (?)", [name], function(err) {
    if (err) {
      if (err.message.includes("UNIQUE")) {
        res.status(409).json({ error: "Team already exists" })
        return
      }
      res.status(500).json({ error: err.message })
      return
    }

    res.status(201).json({ id: this.lastID, name })
  })
})

app.delete("/teams/:id", (req, res) => {
  const teamId = Number(req.params.id)
  if (!Number.isInteger(teamId) || teamId <= 0) {
    res.status(400).json({ error: "Invalid team id" })
    return
  }

  db.get("SELECT id FROM teams WHERE id = ?", [teamId], (getErr, row) => {
    if (getErr) {
      res.status(500).json({ error: getErr.message })
      return
    }
    if (!row) {
      res.status(404).json({ error: "Team not found" })
      return
    }

    db.run("UPDATE players SET team_id = NULL WHERE team_id = ?", [teamId], (updateErr) => {
      if (updateErr) {
        res.status(500).json({ error: updateErr.message })
        return
      }

      db.run("DELETE FROM teams WHERE id = ?", [teamId], (deleteErr) => {
        if (deleteErr) {
          res.status(500).json({ error: deleteErr.message })
          return
        }
        res.json({ status: "ok" })
      })
    })
  })
})

app.patch("/players/:id/team", (req, res) => {
  const playerId = Number(req.params.id)
  const teamIdValue = req.body?.teamId

  if (!Number.isInteger(playerId) || playerId <= 0) {
    res.status(400).json({ error: "Invalid player id" })
    return
  }

  const teamId =
    teamIdValue === null || teamIdValue === undefined || teamIdValue === ""
      ? null
      : Number(teamIdValue)

  if (teamId !== null && (!Number.isInteger(teamId) || teamId <= 0)) {
    res.status(400).json({ error: "Invalid team id" })
    return
  }

  db.get("SELECT id FROM players WHERE id = ?", [playerId], (playerErr, playerRow) => {
    if (playerErr) {
      res.status(500).json({ error: playerErr.message })
      return
    }
    if (!playerRow) {
      res.status(404).json({ error: "Player not found" })
      return
    }

    const applyUpdate = () => {
      db.run("UPDATE players SET team_id = ? WHERE id = ?", [teamId, playerId], (updateErr) => {
        if (updateErr) {
          res.status(500).json({ error: updateErr.message })
          return
        }
        res.json({ status: "ok" })
      })
    }

    if (teamId === null) {
      applyUpdate()
      return
    }

    db.get("SELECT id FROM teams WHERE id = ?", [teamId], (teamErr, teamRow) => {
      if (teamErr) {
        res.status(500).json({ error: teamErr.message })
        return
      }
      if (!teamRow) {
        res.status(404).json({ error: "Team not found" })
        return
      }
      applyUpdate()
    })
  })
})

app.delete("/players/:id", (req, res) => {
  const playerId = Number(req.params.id)
  if (!Number.isInteger(playerId) || playerId <= 0) {
    res.status(400).json({ error: "Invalid player id" })
    return
  }

  db.get("SELECT id FROM players WHERE id = ?", [playerId], (getErr, row) => {
    if (getErr) {
      res.status(500).json({ error: getErr.message })
      return
    }
    if (!row) {
      res.status(404).json({ error: "Player not found" })
      return
    }

    db.run("DELETE FROM scores WHERE player_id = ?", [playerId], (scoreErr) => {
      if (scoreErr) {
        res.status(500).json({ error: scoreErr.message })
        return
      }

      db.run("DELETE FROM players WHERE id = ?", [playerId], (deleteErr) => {
        if (deleteErr) {
          res.status(500).json({ error: deleteErr.message })
          return
        }
        res.json({ status: "ok" })
      })
    })
  })
})

app.post("/score", (req, res) => {
  const { player, points, game } = req.body

  if (!player || !points || !game) {
    res.status(400).json({ error: "Missing required fields" })
    return
  }

  db.get("SELECT id FROM players WHERE name = ?", [player], (err, row) => {
    if (err || !row) {
      res.status(404).json({ error: "Player not found" })
      return
    }

    const playerId = row.id

    db.run(`
      INSERT INTO scores(player_id, game, points)
      VALUES(?, ?, ?)
    `, [playerId, game, points], (err) => {
      if (err) {
        res.status(500).json({ error: err.message })
        return
      }

      db.run(`
        UPDATE players
        SET score = score + ?
        WHERE id = ?
      `, [points, playerId], (err) => {
        if (err) {
          res.status(500).json({ error: err.message })
          return
        }
        res.json({ status: "ok" })
      })
    })
  })
})

if (hasFrontendDist) {
  app.get("*", (req, res) => {
    res.sendFile(FRONTEND_INDEX_PATH)
  })
}

const PORT = Number(process.env.PORT) || 3001
const HOST = process.env.HOST || "0.0.0.0"
app.listen(PORT, HOST, () => console.log(`Server running on http://${HOST}:${PORT}`))
