/**
 * Builds every exercise into one static site:
 *
 *   dist/
 *     index.html            <- project picker
 *     04-transform-objects/ <- each exercise served under its own subpath
 *     ...
 *
 * Usage:
 *   npm run build                      # build everything
 *   npm run build -- 27-shaders 38     # build only matching folders (prefix match)
 */
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const DIST = path.join(ROOT, 'dist')
const require = (await import('node:module')).createRequire(import.meta.url)
const VITE_BIN = path.join(path.dirname(require.resolve('vite/package.json')), 'bin', 'vite.js')
const CONCURRENCY = Number(process.env.BUILD_CONCURRENCY) || Math.max(1, Math.min(4, os.cpus().length - 1))

const filters = process.argv.slice(2)

const projects = fs.readdirSync(ROOT)
    .filter((dir) => /^\d+-/.test(dir) && fs.existsSync(path.join(ROOT, dir, 'package.json')))
    .filter((dir) => filters.length === 0 || filters.some((f) => dir.startsWith(f)))
    .sort()
    .map((slug) => {
        const dir = path.join(ROOT, slug)
        const publicDir = ['static', 'public'].map((d) => path.join(dir, d)).find((d) => fs.existsSync(d))
        return { slug, dir, publicDir }
    })

if (projects.length === 0) {
    console.error('No projects matched', filters)
    process.exit(1)
}

if (filters.length === 0) fs.rmSync(DIST, { recursive: true, force: true })
fs.mkdirSync(DIST, { recursive: true })

function run(project) {
    const outDir = path.join(DIST, project.slug)
    const args = [
        VITE_BIN, 'build',
        '--base', `/${project.slug}/`,
        '--outDir', outDir,
        '--emptyOutDir',
        '--sourcemap', 'false',
        '--logLevel', 'warn',
    ]
    return new Promise((resolve) => {
        const started = Date.now()
        const child = spawn(process.execPath, args, { cwd: project.dir, env: { ...process.env, CI: 'true' } })
        let log = ''
        child.stdout.on('data', (d) => (log += d))
        child.stderr.on('data', (d) => (log += d))
        child.on('close', (code) => {
            const seconds = ((Date.now() - started) / 1000).toFixed(1)
            if (code === 0) {
                rewriteAbsolutePaths(project, outDir)
                console.log(`✓ ${project.slug} (${seconds}s)`)
            } else {
                console.error(`✗ ${project.slug} (${seconds}s)\n${log}`)
            }
            resolve(code === 0)
        })
    })
}

/**
 * Exercises load assets with absolute paths like '/textures/door.jpg'.
 * Vite only rewrites imported assets, not plain strings, so prefix any
 * string that points at a top-level public file/folder with the subpath.
 */
function rewriteAbsolutePaths(project, outDir) {
    if (!project.publicDir) return
    const entries = fs.readdirSync(project.publicDir).map((e) => e.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    if (entries.length === 0) return
    const pattern = new RegExp(`(["'\`(])/(${entries.join('|')})(?=[/"'\`)?#])`, 'g')

    const walk = (dir) => {
        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
            const file = path.join(dir, entry.name)
            if (entry.isDirectory()) walk(file)
            else if (/\.(js|mjs|html|css)$/.test(entry.name) && !file.includes(`${path.sep}draco${path.sep}`)) {
                const source = fs.readFileSync(file, 'utf8')
                const result = source.replace(pattern, `$1/${project.slug}/$2`)
                if (result !== source) fs.writeFileSync(file, result)
            }
        }
    }
    walk(outDir)
}

async function buildAll() {
    console.log(`Building ${projects.length} project(s) with concurrency ${CONCURRENCY}\n`)
    const queue = [...projects]
    const results = new Map()
    await Promise.all(Array.from({ length: CONCURRENCY }, async () => {
        while (queue.length) {
            const project = queue.shift()
            results.set(project.slug, await run(project))
        }
    }))
    return results
}

function escapeHtml(text) {
    return text.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])
}

function writeIndex() {
    // List everything that exists in dist, so partial rebuilds keep the full list
    const built = fs.readdirSync(ROOT)
        .filter((dir) => /^\d+-/.test(dir) && fs.existsSync(path.join(DIST, dir, 'index.html')))
        .sort()
        .map((slug) => {
            const html = fs.readFileSync(path.join(ROOT, slug, 'src', 'index.html'), 'utf8')
            const title = html.match(/<title>([^<]*)<\/title>/)?.[1]?.trim() || slug
            const isR3F = fs.readFileSync(path.join(ROOT, slug, 'package.json'), 'utf8').includes('@react-three/fiber')
            return { slug, title: title.replace(/^\d+\s+/, ''), number: slug.split('-')[0], isR3F }
        })

    const cards = built.map((p) => `
            <a class="card" href="/${p.slug}/" data-search="${escapeHtml(`${p.number} ${p.title} ${p.slug}`.toLowerCase())}">
                <span class="number">${p.number}</span>
                <span class="title">${escapeHtml(p.title)}</span>
                <span class="tag">${p.isR3F ? 'R3F' : 'Three.js'}</span>
            </a>`).join('')

    const template = fs.readFileSync(path.join(ROOT, 'scripts', 'index.template.html'), 'utf8')
    fs.writeFileSync(
        path.join(DIST, 'index.html'),
        template.replace('<!-- CARDS -->', cards).replace('<!-- COUNT -->', String(built.length)),
    )
}

const results = await buildAll()
writeIndex()

const failed = [...results].filter(([, ok]) => !ok).map(([slug]) => slug)
console.log(`\nBuilt ${results.size - failed.length}/${results.size} project(s) into dist/`)
if (failed.length) {
    console.error(`Failed: ${failed.join(', ')}`)
    // Fail the deploy only if nothing could be built
    if (failed.length === results.size) process.exit(1)
}
