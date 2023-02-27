import { initPhysics } from './physics.js';
import { initRenderer } from './renderer-webgl.js';
import { AABB, QuadTree, Vector2 } from './collision-entitites.js';

async function main() {
  const canvas = document.querySelector('canvas');
  const countInput = document.querySelector('#count');
  const fpsInput = document.querySelector('#fps');
  const quadTreeCheckbox = document.querySelector('#quad_tree');
  const quadTreeRenderCheckbox = document.querySelector('#quad_tree_render');

  let shouldCreateQuadTree = false;
  let shouldShowQuadTree = false;

  let particlesCount;
  let canvasWidth;
  let canvasHeight;

  const { getData, tick, tickG, fire } = await initPhysics();
  const { render } = await initRenderer(canvas);

  {
    const resizeHandler = () => {
      canvasWidth = canvas.clientWidth;
      canvasHeight = canvas.clientHeight;
    }
    window.addEventListener('resize', resizeHandler);
    resizeHandler();
  }

  {
    const inputHandler = () => {
      const inputValue = Math.trunc(countInput.value);
      if (inputValue > 0) {
        particlesCount = inputValue;
      }
    }
    countInput.addEventListener('input', inputHandler);
    inputHandler();
  }

  {
    const quadTreeCheckboxHandler = () => {
      shouldCreateQuadTree = quadTreeCheckbox.checked;
    }
    quadTreeCheckbox.addEventListener('change', quadTreeCheckboxHandler);
    quadTreeCheckboxHandler();
  }

  {
    const quadTreeRenderCheckboxHandler = () => {
      shouldShowQuadTree = quadTreeRenderCheckbox.checked;
    }
    quadTreeRenderCheckbox.addEventListener('change', quadTreeRenderCheckboxHandler);
    quadTreeRenderCheckboxHandler();
  }

  let num = 0;
  {
    const clickHandler = (e) => {
      num = 0;
      fire(e.offsetX - canvas.clientWidth / 2, e.offsetY - canvas.clientHeight / 2);
    }
    canvas.addEventListener('click', clickHandler);
  }

  const createQTree = () => {
    return new QuadTree(new AABB(new Vector2(0, 0), new Vector2(canvasWidth / 2, canvasHeight / 2)))
  }

  {
    let lastTs = 0;
    let framesDrawn = 0;
    let qTree;

    const frame = (timestamp) => {
      requestAnimationFrame(frame);


      if (num > 10) {
        tickG(particlesCount);
      } else {
        tick(particlesCount);
      }

      const data = getData()

      if (shouldCreateQuadTree) {
        qTree = createQTree()
        const len = particlesCount * 4

        for (let ptr = 0; ptr < len; ptr += 4) {
          qTree.insert(new Vector2(data[ptr + 0], data[ptr + 1]))
        }
      }

      let qTreeToRender = null
      if (shouldShowQuadTree) {
        qTreeToRender = qTree
      }

      render(data, particlesCount, canvasWidth, canvasHeight, qTreeToRender);

      framesDrawn++;
      if (timestamp > lastTs + 2000) {
        fpsInput.value = (1000 * framesDrawn / (timestamp - lastTs)).toFixed(1) + ' FPS';
        lastTs = timestamp;
        framesDrawn = 0;
      }

      num++;
    }
    frame();
  }
};

main();
