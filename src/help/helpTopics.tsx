import type { ReactNode } from 'react'

/**
 * Every explanation shown by an <InfoButton>, in one place.
 *
 * Keeping the copy here (instead of inline in each component) means the UI
 * code stays readable, and `HelpTopicId` makes a typo in a topic name a
 * compile error.
 */
export type HelpTopic = {
  title: string
  /** One-line summary, shown under the title (and read by screen readers). */
  summary: string
  body: ReactNode
}

const topics = {
  // ── Panels ────────────────────────────────────────────────────────────────
  outliner: {
    title: 'Outliner',
    summary: 'The scene graph: every object in the model, as a tree.',
    body: (
      <>
        <p>
          A 3D scene is a tree of objects, called the <em>scene graph</em>. Each object has a position, rotation and
          scale relative to its parent, so moving a parent moves everything inside it. This panel shows that tree,
          the same way the browser's Elements panel shows the DOM.
        </p>
        <p>Each row shows the object's name, its three.js type, and (for meshes) its material:</p>
        <ul>
          <li>
            <strong>Group</strong> / <strong>Object3D</strong>: invisible containers, used only to position and
            organize their children.
          </li>
          <li>
            <strong>Mesh</strong>: something you can see. A mesh is a <em>geometry</em> (the shape, as triangles)
            plus a <em>material</em> (how the surface reacts to light).
          </li>
        </ul>
        <p>
          Tap a row to select it. Selecting a group highlights every mesh inside it. Lights, the ground shadow and
          the camera live outside <code>Product</code>, so they aren't listed.
        </p>
      </>
    ),
  },
  inspector: {
    title: 'Inspector',
    summary: 'Properties of the selected object.',
    body: (
      <>
        <p>
          Shows the object you selected in the viewport or the Outliner: its type, its parent, and its properties.
        </p>
        <p>
          For meshes you can edit the material. Edits are stored as a small list of overrides on top of the
          values loaded from the file, so <strong>Reset</strong> (and, later, undo) just removes overrides.
        </p>
      </>
    ),
  },
  viewport: {
    title: 'Viewport',
    summary: 'The 3D view: how to move around and select things.',
    body: (
      <>
        <ul>
          <li>
            <strong>Rotate</strong>: drag with one finger or the left mouse button.
          </li>
          <li>
            <strong>Pan</strong>: drag with two fingers, or the right mouse button.
          </li>
          <li>
            <strong>Zoom</strong>: pinch, or scroll.
          </li>
          <li>
            <strong>Select</strong>: tap a mesh. Tap empty space (or press Esc) to deselect.
          </li>
        </ul>
        <p>
          The camera orbits around a target point near the shoe; the shoe itself never moves. A tap only selects
          if your finger barely moved, so ending a rotate gesture doesn't change the selection.
        </p>
        <p>
          The selected mesh gets an orange <strong>rim glow</strong> on its edges. It's drawn as a separate overlay,
          so the mesh's own colors stay accurate while you edit them.
        </p>
        <p>
          The meter in the bottom-right corner shows <strong>FPS</strong> (frames per second; 60 is smooth) and how
          many milliseconds each frame costs the <strong>CPU</strong> and <strong>GPU</strong>. At 60 FPS each frame
          has a budget of about 16.7 ms.
        </p>
      </>
    ),
  },

  // ── Material ──────────────────────────────────────────────────────────────
  material: {
    title: 'Material',
    summary: 'How a surface reacts to light. Often shared between meshes.',
    body: (
      <>
        <p>
          A material describes what a surface is made of: its color, how shiny it is, whether it's metal. These are
          <em> physically based</em> (PBR) settings, meaning they describe real-world properties and the renderer
          works out the lighting.
        </p>
        <p>
          <strong>Materials are shared.</strong> Several meshes can point at the same material object. In this
          scene, <code>Plinth_Base</code> and <code>Plinth_Top</code> share <code>StandMaterial</code>. Changing a
          shared material would change every mesh using it.
        </p>
        <p>
          So the first time you edit a mesh, the editor gives that mesh its own copy of the material and edits the
          copy. Textures inside it are still shared, so the copy is cheap. <strong>Reset</strong> discards the copy
          and puts the original back.
        </p>
      </>
    ),
  },
  color: {
    title: 'Color',
    summary: 'The base color of the surface, before lighting.',
    body: (
      <>
        <p>
          The surface's own color, also called <em>albedo</em> or <em>base color</em>: what it would look like under
          perfectly even white light, with no shading or reflections.
        </p>
        <p>
          <strong>With a texture</strong>, this color is <em>multiplied</em> with the texture's pixels. The shoe has a
          color texture, so its color is white (<code>#ffffff</code>), meaning "use the texture as-is". Picking red
          tints the whole texture red, and black makes it black.
        </p>
        <p>
          <strong>Without a texture</strong> (the plinth and nameplate), this is simply the surface color.
        </p>
      </>
    ),
  },
  roughness: {
    title: 'Roughness',
    summary: '0 = mirror-smooth, 1 = completely matte.',
    body: (
      <>
        <p>
          How rough the surface is at a microscopic level, which decides how blurry its reflections are. At{' '}
          <strong>0</strong> it reflects its surroundings like polished chrome or still water. At <strong>1</strong>{' '}
          reflections are smeared out completely, like chalk or felt.
        </p>
        <p>
          <strong>With a roughness texture</strong>, each pixel has its own roughness and this value{' '}
          <em>multiplies</em> it. The shoe has one, which is why its slider starts at 1.00 even though the laces
          and fabric look different: 1 means "use the texture as-is", and lower values make everything shinier.
        </p>
      </>
    ),
  },
  metalness: {
    title: 'Metalness',
    summary: '0 = non-metal (plastic, fabric, leather), 1 = metal.',
    body: (
      <>
        <p>
          Whether the surface behaves like a metal. Metals reflect their surroundings tinted by their color and have
          no diffuse color of their own. Non-metals show their color everywhere and reflect light only faintly.
          Real materials are nearly always <strong>0</strong> or <strong>1</strong>; values in between are mostly
          for blending between the two.
        </p>
        <p>
          <strong>With a metalness texture</strong>, this value <em>multiplies</em> the texture, pixel by pixel. The
          shoe's slider reads 1.00, but its texture marks the fabric, laces and sole as non-metal (0), and 1 × 0 is
          still 0. That's why a "fully metallic" shoe looks like fabric. Lowering the slider only affects parts the
          texture marks as metal.
        </p>
        <p>
          Try the <code>Nameplate</code>: it's brass, metalness 1. Drag it to 0 and it turns into shiny yellow
          plastic.
        </p>
      </>
    ),
  },

  // ── Transform ─────────────────────────────────────────────────────────────
  transform: {
    title: 'Transform (local)',
    summary: "Where the object sits relative to its parent. Read-only here.",
    body: (
      <>
        <p>
          Every object has a position, rotation and scale. They're <strong>local</strong>, meaning relative to the
          object's parent in the Outliner, not to the world. Where an object actually appears is its own transform
          combined with every parent's, all the way up the tree.
        </p>
        <p>
          That's why most objects here show zeros: they sit exactly at their parent's origin. Objects with
          non-zero values are the ones that position the scene:
        </p>
        <ul>
          <li>
            <code>ShoeMount</code>: position y = 0.030, lifting the shoe 3 cm onto the plinth.
          </li>
          <li>
            <code>Nameplate</code>: pushed to the front edge and tilted back 20°.
          </li>
          <li>
            <code>Shoeobj</code>: scale 0.149. The model in the file is about 2 units long; this shrinks it (and
            everything inside it, including the <code>Shoe</code> mesh) to about 30 cm.
          </li>
        </ul>
        <p>These values are read-only: the editor doesn't move objects yet.</p>
      </>
    ),
  },
  position: {
    title: 'Position',
    summary: 'Offset from the parent, in meters (x, y, z).',
    body: (
      <>
        <p>How far the object is moved from its parent's origin, along three axes:</p>
        <ul>
          <li>
            <strong>x</strong>: left (−) / right (+)
          </li>
          <li>
            <strong>y</strong>: down (−) / up (+)
          </li>
          <li>
            <strong>z</strong>: away from the default view (−) / toward it (+)
          </li>
        </ul>
        <p>
          Units are meters, the glTF convention. <code>0.030</code> is 3 cm.
        </p>
      </>
    ),
  },
  rotation: {
    title: 'Rotation',
    summary: 'Turn around each axis, in degrees (x, y, z).',
    body: (
      <>
        <p>
          How far the object is turned around each of its parent's axes. A rotation around <strong>x</strong> tips
          it forward or back, around <strong>y</strong> turns it left or right, and around <strong>z</strong> rolls
          it sideways.
        </p>
        <p>
          three.js stores these as <em>Euler angles</em> in radians; they're shown in degrees here. Because turning
          around one axis moves the others, the order of the three turns changes the result; three.js uses the
          order "XYZ" unless told otherwise.
        </p>
      </>
    ),
  },
  scale: {
    title: 'Scale',
    summary: 'Size multiplier along each axis. 1 = unchanged.',
    body: (
      <>
        <p>
          How much the object is stretched along each axis. <code>1</code> is its natural size, <code>2</code> is
          twice as big, and <code>0.5</code> is half. Scale applies to all children too.
        </p>
        <p>
          Example: <code>Shoeobj</code> has scale 0.149, so the <code>Shoe</code> mesh inside it appears at about 15%
          of the size stored in the file, even though the mesh's own scale is 1.
        </p>
      </>
    ),
  },

  // ── Geometry ──────────────────────────────────────────────────────────────
  geometry: {
    title: 'Geometry',
    summary: "The mesh's shape, stored as vertices and triangles.",
    body: (
      <>
        <p>
          A mesh's shape is a list of points (<em>vertices</em>) joined into <em>triangles</em>. Even curved surfaces
          like the shoe are made entirely of small flat triangles. The renderer smooths the shading between them.
        </p>
        <p>
          More triangles means more detail and more GPU work. The shoe has about 22,700; the box-shaped nameplate
          has 12.
        </p>
      </>
    ),
  },
  vertices: {
    title: 'Vertices',
    summary: 'Points that make up the mesh.',
    body: (
      <>
        <p>
          The corner points of the mesh's triangles. Each vertex stores a position plus extra data: a{' '}
          <em>normal</em> (the direction the surface faces, used for lighting) and texture coordinates.
        </p>
        <p>
          A vertex can only have one normal. At a sharp edge the two faces point in different directions, so the
          corner is stored once per face. That's why the nameplate box has 24 vertices instead of 8: each of its 8
          corners is shared by 3 faces.
        </p>
      </>
    ),
  },
  triangles: {
    title: 'Triangles',
    summary: 'The flat faces the GPU actually draws.',
    body: (
      <p>
        GPUs draw triangles and nothing else: squares are two triangles, and curved surfaces are many small ones.
        Triangle count is the usual measure of how detailed (and how expensive) a mesh is. A product model for a
        web viewer is typically somewhere between a few thousand and a few hundred thousand triangles.
      </p>
    ),
  },
} satisfies Record<string, HelpTopic>

export type HelpTopicId = keyof typeof topics
export const helpTopics: Record<HelpTopicId, HelpTopic> = topics
