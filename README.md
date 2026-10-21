# 3D Editor (R3F Demo)

A small 3D product editor built with React Three Fiber. It loads a shoe model and lets you select its parts, browse them in an outliner, and tweak their materials in an inspector panel.

## Tech stack

- React 19 + TypeScript
- Vite
- [React Three Fiber](https://r3f.docs.pmnd.rs/) + [drei](https://github.com/pmndrs/drei) / Three.js
- Zustand for editor state
- Tailwind CSS + Radix UI
- Vitest for tests

## Getting started

```bash
npm install
npm run dev
```

Then open the URL Vite prints (usually http://localhost:5173).

## Scripts

| Command             | What it does                    |
| ------------------- | ------------------------------- |
| `npm run dev`       | Start the dev server            |
| `npm run build`     | Type-check and build for production |
| `npm run preview`   | Preview the production build    |
| `npm run typecheck` | Run the TypeScript checker      |
| `npm test`          | Run tests with Vitest           |

## Project layout

```
src/
  components/   UI panels (outliner, inspector, sidebar) and shared UI pieces
  editor/       Editor state store and scene tree logic
  scene/        Viewport, model loading, materials, and selection
  help/         In-app help topics
public/models/  3D model assets
```

## 3D model credit

The shoe model (`public/models/MaterialsVariantsShoe.glb`) is **[Materials Variants Shoe](https://github.khronos.org/glTF-Assets/model/MaterialsVariantsShoe)** by **Shopify**, licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).

It comes from the [Khronos glTF Sample Assets](https://github.com/KhronosGroup/glTF-Sample-Assets/tree/master/Models/MaterialsVariantsShoe) repo (the `glTF-Binary` version). The file bundles three color variants (Beach, Midnight, and Street) that share geometry and all textures except base color.
