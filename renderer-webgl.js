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
			16, // stride (в буффере x, y, dx, dy, а достаем только x, y
			0 // start index
		);
	}

	function render(data, count, width, height) {
		if (width !== canvas.width || height !== canvas.height) {
			canvas.width = width;
			canvas.height = height;
			gl.viewport(0, 0, width, height);

			{
				const attribLocation = gl.getAttribLocation(program, 'scale');
				gl.disableVertexAttribArray(attribLocation);
				gl.vertexAttrib2f(attribLocation, 2 / canvas.width, -2 / canvas.height);
			}
		}

		gl.bufferData(gl.ARRAY_BUFFER, data.subarray(0, count * 4), gl.DYNAMIC_DRAW);
		gl.clear(gl.COLOR_BUFFER_BIT);
		gl.drawArrays(gl.POINTS, 0, count);
	}

	return { render };
}

export async function initClothRenderer(canvas, nParticles = { x: 10, y: 10 }) {
	const gl = canvas.getContext('webgl', { alpha: false, antialias: false });
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

	const posBuffer = gl.createBuffer()
	gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer)

	{
		const attribLocation = gl.getAttribLocation(program, 'coord');
		gl.enableVertexAttribArray(attribLocation);
		gl.vertexAttribPointer(
			attribLocation,
			2,
			gl.FLOAT,
			false,
			16,
			0
		);
	}

//	GLuint bufs[7];
//	GLuint posBufs[2], velBufs[2], normBuf, elBuf;
//	glGenBuffers(7, bufs);
//	clBuf.posBufs[0] = bufs[0];
//	clBuf.posBufs[1] = bufs[1];
//	clBuf.velBufs[0] = bufs[2];
//	clBuf.velBufs[1] = bufs[3];
//	clBuf.normBuf = bufs[4];
//	GLuint parts = nParticles.x * nParticles.y;
//
//	//positions
//	glBindBufferBase(GL_SHADER_STORAGE_BUFFER, 0, clBuf.posBufs[0]);
//	glBufferData(GL_SHADER_STORAGE_BUFFER, parts * 4 * sizeof(GLfloat), &initPos[0], GL_DYNAMIC_DRAW);
//	glBindBufferBase(GL_SHADER_STORAGE_BUFFER, 1, clBuf.posBufs[1]);
//	glBufferData(GL_SHADER_STORAGE_BUFFER, parts * 4 * sizeof(GLfloat), NULL, GL_DYNAMIC_DRAW);
//
//	// Velocities
//	glBindBufferBase(GL_SHADER_STORAGE_BUFFER, 2, clBuf.velBufs[0]);
//	glBufferData(GL_SHADER_STORAGE_BUFFER, parts * 4 * sizeof(GLfloat), &initVel[0], GL_DYNAMIC_COPY);
//	glBindBufferBase(GL_SHADER_STORAGE_BUFFER, 3, clBuf.velBufs[1]);
//	glBufferData(GL_SHADER_STORAGE_BUFFER, parts * 4 * sizeof(GLfloat), NULL, GL_DYNAMIC_COPY);
//
//	// Normal buffer
//	glBindBufferBase(GL_SHADER_STORAGE_BUFFER, 4, clBuf.normBuf);
//	glBufferData(GL_SHADER_STORAGE_BUFFER, parts * 4 * sizeof(GLfloat), NULL, GL_DYNAMIC_COPY);
//
//	glGenVertexArrays(1, &clothVao);
//	glBindVertexArray(clothVao);
//	glEnableVertexAttribArray(0);
//	glEnableVertexAttribArray(1);
//
//	glBindVertexBuffer(0, clBuf.posBufs[0], 0, 4 * sizeof(GLfloat));
//	glBindVertexBuffer(1, clBuf.normBuf, 0, 4 * sizeof(GLfloat));
//
//	glVertexAttribFormat(0, 4, GL_FLOAT, GL_FALSE, 0 * sizeof(GLfloat));
//	glVertexAttribFormat(1, 4, GL_FLOAT, GL_FALSE, 0 * sizeof(GLfloat));
//
//	glVertexAttribBinding(0, 0);
//	glVertexAttribBinding(1, 1);
//
//	glBindBuffer(GL_ELEMENT_ARRAY_BUFFER, elBuf);
//	glBindVertexArray(0);


	let cachedNParticles
	const indexBuffer = gl.createBuffer()
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer)
	function render(posData, nParticles, width, height) {
		if (width !== canvas.width || height !== canvas.height) {
			canvas.width = width;
			canvas.height = height;
			gl.viewport(0, 0, width, height);

			{
				const attribLocation = gl.getAttribLocation(program, 'scale');
				gl.disableVertexAttribArray(attribLocation);
				gl.vertexAttrib2f(attribLocation, 2 / canvas.width, -2 / canvas.height);
			}
		}

		gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer)
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(posData), gl.DYNAMIC_DRAW)

		let el
		if (!el || !cachedNParticles || cachedNParticles.x !== nParticles.x || cachedNParticles.y !== nParticles.y) {
			cachedNParticles = nParticles
			el = indexSurface(nParticles)
			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer)
			gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(el), gl.STATIC_DRAW)
		}

		gl.clear(gl.COLOR_BUFFER_BIT);

		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer)
		gl.drawElements(gl.TRIANGLE_STRIP, el.length, gl.UNSIGNED_SHORT, 0);
		// gl.drawElements(gl.LINE_STRIP, el.length, gl.UNSIGNED_SHORT, 0);
	}

	return { render }
}

function indexSurface(nParticles) {
	let el = []

	for (let row = 0; row < nParticles.y - 1; row++) {
		for (let col = 0; col < nParticles.x; col++) {
			el.push((row + 1) * nParticles.x + (col))
			el.push((row)* nParticles.x + (col))
		}

		row++

		if (row < nParticles.y - 1) {
			for (let col = nParticles.x - 1; col >= 0; col--) {
				el.push((row) * nParticles.x + (col))
				el.push((row + 1) * nParticles.x + (col))
			}
		}
	}
	return el
}
