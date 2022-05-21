export async function initPhysics() {
  const particleStep = 4

  let positions = new Float32Array(0)
  let newPositions = new Float32Array(positions.length)
  let velocities = []
  let windSourcePoint = [0, 0]

  let forces = []

  let dx = 0;
  let dy = 0;
  let restLengthHoriz = 0;
  let restLengthVert = 0;
  let restLengthDiag = 0;

  const gravity = [0, 10.0]
  const particleMass = 1.1
  const particleInvMass = 1.0 / particleMass
  const springK = 10.0
  const deltaT = 0.00001
  const dampingConst = 5.0

  const length = (vec) => {
    return Math.sqrt(vec[0] ** 2 + vec[1] ** 2)
  }
  const normalize = (vec, len) => {
    return len ? [vec[0] / len, vec[1] / len] : [0, 0]
  }
  const sub = (vecA, vecB) => {
    return [vecA[0] - vecB[0], vecA[1] - vecB[1]]
  }
  const placeSub = (vecA, vecB) => {
    vecA[0] = vecA[0] - vecB[0]
    vecA[1] = vecA[1] - vecB[1]
  }
  const add = (vecA, vecB) => {
    return [vecA[0] + vecB[0], vecA[1] + vecB[1]]
  }
  const placeAdd = (vecA, vecB) => {
    vecA[0] = vecA[0] + vecB[0]
    vecA[1] = vecA[1] + vecB[1]
  }
  const mulConst = (vec, num) => {
    return [vec[0] * num, vec[1] * num]
  }
  const getParticle = (buff, offset) => {
    return [buff[offset + 0], buff[offset + 1]]
  }

  function getData() {
    return positions;
  }

  function generatePhysicCloth(nParticles, clothSize) {
    initPositions(nParticles, clothSize)
    initVelocities(nParticles)

    forces = []
    for (let i = 0; i < nParticles.y; i++) {
      forces.push([])
      for (let j = 0; j < nParticles.x; j++) {
        forces[i].push([0, 0])
      }
    }

    restLengthHoriz = dx
    restLengthVert = dy
    restLengthDiag = Math.sqrt(dx * dx + dy * dy)
  }

  function initPositions(nParticles, clothSize) {
    let initPos = []

    dx = clothSize[0] / (nParticles.x - 1)
    dy = clothSize[1] / (nParticles.y - 1)
    for (let i = 0; i < nParticles.y; i++) {
      for (let j = 0; j < nParticles.x; j++) {
        initPos.push(dx * j - (clothSize[0] / 2))
        initPos.push(dy * i - (clothSize[1] / 2))
        initPos.push(0.0)
        initPos.push(1.0)
      }
    }

    positions = new Float32Array(initPos)
    newPositions = new Float32Array(positions.length)
  }

  function initVelocities(nParticles) {
    velocities = Array.from({ length: nParticles.x * nParticles.y * 4 }).map(() => 0.0)
  }

  function tick({ nParticles, clothSize }) {
    moveParticles({ nParticles, clothSize })
    ;[positions, newPositions] = [newPositions, positions]
  }

  function fire(x, y) {
    const len = length([x, y])
    windSourcePoint = mulConst(normalize([x, y], len), dampingConst)
  }

  function moveParticles({ nParticles }) {
    forces[0][0][0] = 0
    forces[0][0][1] = 0

    for (let i = 0; i < positions.length; i += particleStep) {
      const p = [positions[i + 0], positions[i + 1]]

      const particleFlatIndex = Math.trunc(i / particleStep)
      const x = particleFlatIndex % nParticles.x
      const y = Math.trunc((particleFlatIndex - x) / nParticles.x)

      if (y === 0 && x < nParticles.x - 1) {
        forces[y][x + 1][0] = 0
        forces[y][x + 1][1] = 0
      }

      if (x === 0 && y < nParticles.y - 1) {
        forces[y + 1][x][0] = 0
        forces[y + 1][x][1] = 0
      }

      if (y < nParticles.y - 1) {
        let r = sub(getParticle(positions,(particleFlatIndex + nParticles.x) * particleStep), p)
        const rLen = length(r)
        let force = mulConst(normalize(r, rLen), springK * (rLen - restLengthVert))
        placeAdd(forces[y][x], force)
        placeSub(forces[y + 1][x], force)
      }
      if (x < nParticles.x - 1) {
        let r = sub(getParticle(positions,(i + particleStep)), p)
        const rLen = length(r)
        let force = mulConst(normalize(r, rLen), springK * (rLen - restLengthHoriz))
        placeAdd(forces[y][x], force)
        placeSub(forces[y][x + 1], force)
      }
      if (x < nParticles.x - 1 && y < nParticles.y - 1) {
        let r = sub(getParticle(positions,(particleFlatIndex + nParticles.x + 1) * particleStep), p)
        const rLen = length(r)
        let force = mulConst(normalize(r, rLen), springK * (rLen - restLengthDiag))
        placeAdd(forces[y][x], force)
        forces[y + 1][x + 1] = sub([0, 0], force)
        // placeSub(forces[y + 1][x + 1], force)
      }
      if (x < nParticles.x - 1 && y > 0) {
        let r = sub(getParticle(positions,(particleFlatIndex - nParticles.x + 1) * particleStep), p)
        const rLen = length(r)
        let force = mulConst(normalize(r, rLen), springK * (rLen - restLengthDiag))
        placeAdd(forces[y][x], force)
        placeSub(forces[y - 1][x + 1], force)
      }
    }


    for (let i = 0; i < positions.length; i += particleStep) {
      const p = [positions[i + 0], positions[i + 1]]
      const v = [velocities[i + 0], velocities[i + 1]]

      const particleFlatIndex = Math.trunc(i / particleStep)
      const x = particleFlatIndex % nParticles.x
      const y = Math.trunc((particleFlatIndex - x) / nParticles.x)

      if (
        (x === 0) && (
          y === 0 ||
          y === nParticles.y / 5 ||
          y === nParticles.y * 2 / 5 ||
          y === nParticles.y * 3 / 5 ||
          y === nParticles.y * 4 / 5 ||
          y === nParticles.y - 1
        )
      ) {
        newPositions[i + 0] = p[0]
        newPositions[i + 1] = p[1]

        velocities[i + 0] = 0;
        velocities[i + 1] = 0;

        continue
      }

      let force = mulConst(gravity, particleMass);
      placeAdd(force, forces[y][x])
      placeAdd(force, windSourcePoint)

      let a = [force[0] * particleInvMass * 10000000, force[1] * particleInvMass * 10000000];

      function f(x, y) {
        return y + x * deltaT;
      }

      let k1, k2, k3, k4;
      k1 = [f(a[0], v[0]), f(a[1], v[1])];
      k2 = [f(a[0] + deltaT / 2, v[0] + deltaT / 2 * k1[0]), f(a[1] + deltaT / 2, v[1] + deltaT / 2 * k1[1])];
      k3 = [f(a[0] + deltaT / 2, v[0] + deltaT / 2 * k2[0]), f(a[1] + deltaT / 2, v[1] + deltaT / 2 * k2[1])];
      k4 = [f(a[0] + deltaT, v[0] + deltaT * k3[0]), f(a[1] + deltaT, v[1] + deltaT * k3[1])];

      newPositions[i + 0] = p[0] + deltaT / 6.0 * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]);
      newPositions[i + 1] = p[1] + deltaT / 6.0 * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]);

      velocities[i + 0] = v[0] + a[0] * deltaT;
      velocities[i + 1] = v[1] + a[1] * deltaT;
    }
  }

  return { getData, tick, fire, generatePhysicCloth };
}
