export async function initRenderer(canvas) {
  const gl = canvas.getContext('webgl', { alpha: false, antialias: false });
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.clearColor(0.8, 0.8, 0.8, 1);

  const program = gl.createProgram();

  {
    const shader = gl.createShader(gl.VERTEX_SHADER);
    const source = await (await fetch('vert.glsl')).text();
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    console.log(gl.getShaderInfoLog(shader));
    gl.attachShader(program, shader);
  }

  {
    const shader = gl.createShader(gl.FRAGMENT_SHADER);
    const source = await (await fetch('frag.glsl')).text();
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    console.log(gl.getShaderInfoLog(shader));
    gl.attachShader(program, shader);
  }

  gl.linkProgram(program);

  gl.useProgram(program);

  {
    const attribLocation = gl.getAttribLocation(program, 'coord');
    gl.enableVertexAttribArray(attribLocation);
    gl.vertexAttribPointer(
      attribLocation, // index
      2, // size (X and Y)
      gl.FLOAT, // float32 each
      false, // normalized. Has no effect on float
      16, // stride (в буффере x, y, dx, dy, а достаем только x, y)
      0 // start index
    );
  }

  function initAABBRenderer() {
    const rectBuff = new Float32Array(4 * 4)
    const rectElementArray = new Uint16Array([0, 1, 2, 3])

    const indexBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer)

    function beforeAABBRenders() {
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer)
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, rectElementArray, gl.DYNAMIC_DRAW)
    }

    function renderAABB(aabb) {
      rectBuff[0] = aabb.center.x - aabb.radius.x
      rectBuff[1] = aabb.center.y - aabb.radius.y

      rectBuff[4] = aabb.center.x - aabb.radius.x
      rectBuff[5] = aabb.center.y + aabb.radius.y

      rectBuff[8] = aabb.center.x + aabb.radius.x
      rectBuff[9] = aabb.center.y + aabb.radius.y

      rectBuff[12] = aabb.center.x + aabb.radius.x
      rectBuff[13] = aabb.center.y - aabb.radius.y

      gl.bufferData(gl.ARRAY_BUFFER, rectBuff, gl.DYNAMIC_DRAW)
      gl.drawElements(gl.LINE_LOOP, rectElementArray.length, gl.UNSIGNED_SHORT, 0);
    }

    return { renderAABB, beforeAABBRenders }
  }

  function render(data, count, width, height, qTree) {
    if (width !== canvas.width || height !== canvas.height) {
      canvas.width = width
      canvas.height = height
      gl.viewport(0, 0, width, height)

      {
        const attribLocation = gl.getAttribLocation(program, 'scale')
        gl.disableVertexAttribArray(attribLocation)
        gl.vertexAttrib2f(attribLocation, 2 / canvas.width, -2 / canvas.height)
      }
    }

    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.bufferData(gl.ARRAY_BUFFER, data.subarray(0, count * 4), gl.DYNAMIC_DRAW);
    gl.drawArrays(gl.POINTS, 0, count);

    if (qTree) {
      const { renderAABB, beforeAABBRenders } = initAABBRenderer()

      const renderTree = (qTree) => {
        renderAABB(qTree.boundary)

        if (qTree.node1) renderTree(qTree.node1)
        if (qTree.node2) renderTree(qTree.node2)
        if (qTree.node3) renderTree(qTree.node3)
        if (qTree.node4) renderTree(qTree.node4)
      }

      beforeAABBRenders()
      renderTree(qTree)
    }
  }

  return { render }
}
