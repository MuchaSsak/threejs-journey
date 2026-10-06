# Three.js Journey

Every exercise I built while going through Bruno Simon's [Three.js Journey](https://threejs-journey.com/) course, in one repo and deployed as one site. Pick a project from the list and it opens right in your browser 🧊✨

_Note: this is pretty old for me at this point. I finished the course in January 2025, and the code reflects where I was back then: it follows the lessons closely and isn't polished or refactored. The course, its starter code and most of the assets (models, textures, environment maps) come from [Three.js Journey](https://threejs-journey.com/) by [Bruno Simon](https://bruno-simon.com/). This repo is not affiliated with or endorsed by him._

[![Three.js Journey certificate of completion](.github/certificate.png)](https://threejs-journey.com/certificate/view/45175)

## What's inside

59 projects, numbered after the course lessons:

- **Basics** (04–13): transforms, animations, cameras, geometries, debug UI, textures, materials, 3D text
- **Classic techniques** (14–23): lights, shadows, a haunted house, particles, a galaxy generator, scroll-based animation, physics, imported models
- **Advanced techniques** (24–26): environment maps, realistic rendering, code structuring
- **Shaders** (27–44): patterns, a raging sea, coffee smoke, holograms, fireworks, an earth shader, GPGPU flow-field particles, procedural terrain
- **Extra** (45–48): post-processing, performance, loading screens, mixing HTML and WebGL
- **Portal scene** (49–52): modelled and baked in Blender, then imported into Three.js
- **React Three Fiber** (55–66): from a first R3F app to a portfolio, physics and a full marble-race game

## Running locally

```bash
npm install

# run one project (any folder name works)
npm run dev -w 16-haunted-house

# build everything into dist/ and preview the site with the project picker
npm run build
npm run preview
```

`npm run build -- 27 38` builds only the projects whose folder starts with `27` or `38`.

## Deploying

The repo is set up for [Vercel](https://vercel.com/): import it as a new project and keep the defaults, since [vercel.json](vercel.json) already sets the build command and output folder. The build script ([scripts/build.mjs](scripts/build.mjs)) builds every project into its own subpath (`/16-haunted-house/`, `/38-earth-shaders/`, …) and generates the index page.

## Acknowledgements

- [Three.js Journey](https://threejs-journey.com/) by [Bruno Simon](https://bruno-simon.com/): the course, starter code and assets
- [Three.js](https://threejs.org/)
- [React Three Fiber](https://r3f.docs.pmnd.rs/), [Drei](https://drei.docs.pmnd.rs/), [Rapier](https://github.com/pmndrs/react-three-rapier) and the rest of [Poimandres](https://pmnd.rs/)
- [Vite](https://vite.dev/)
- [lil-gui](https://lil-gui.georgealways.com/) and [Leva](https://github.com/pmndrs/leva)
- [GSAP](https://gsap.com/)
- [cannon-es](https://pmndrs.github.io/cannon-es/)
- [Blender](https://www.blender.org/)

## License

[MIT](LICENSE): covers my own code only. Course material, starter code and assets from Three.js Journey keep their original terms.
