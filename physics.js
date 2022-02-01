export async function initPhysics() {
    let moving = new Float32Array(0);

    function getData() {
        return moving;
    }

    function tickG(count) {
      moving = resizeArray(moving, count * 4);

      const gravity = 10000.0;
      const blackHolePos = [0, 0];
      const particleInvMass = 1.0 / 0.1;
      const deltaT = 0.5;

      function f(x, y) {
          return y + x * deltaT;
      }

      for (let i = 0; i < count * 4; i += 4) {
        const p = [moving[i + 0], moving[i + 1]];
        const v = [moving[i + 2], moving[i + 3]];

        const d = [blackHolePos[0] - p[0], blackHolePos[1] - p[1]];
        const dSqLen = d[0]**2 + d[1]**2
        const dLen = Math.sqrt(dSqLen)
        const dNorm = dLen ? [d[0] / dLen, d[1] / dLen] : [0, 0]
        const falseSqLen = !dSqLen ? 0.1 : dSqLen
        let force = [(gravity / falseSqLen) * dNorm[0], (gravity / falseSqLen) * dNorm[1]];

        let a = [force[0] * particleInvMass, force[1] * particleInvMass];
        let k1, k2, k3, k4;
        k1 = [f(a[0], v[0]), f(a[1], v[1])];
        k2 = [f(a[0] + deltaT / 2, v[0] + deltaT / 2 * k1[0]), f(a[1] + deltaT / 2, v[1] + deltaT / 2 * k1[1])];
        k3 = [f(a[0] + deltaT / 2, v[0] + deltaT / 2 * k2[0]), f(a[1] + deltaT / 2, v[1] + deltaT / 2 * k2[1])];
        k4 = [f(a[0] + deltaT, v[0] + deltaT * k3[0]), f(a[1] + deltaT, v[1] + deltaT * k3[1])];

        moving[i + 0] = p[0] + deltaT / 6.0 * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]);
        moving[i + 1] = p[1] + deltaT / 6.0 * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]);

        moving[i + 2] = v[0] + a[0] * deltaT;
        moving[i + 3] = v[1] + a[1] * deltaT;
      }
    }

    function tick(count) {
        moving = resizeArray(moving, count * 4);

        for (let ptr = 0; ptr < moving.length; ptr += 4) {
            moving[ptr + 0] += moving[ptr + 2];
            moving[ptr + 1] += moving[ptr + 3];
            moving[ptr + 3] += 0.95;
        }
    }

    function fire(x, y) {
        for (let ptr = 0; ptr < moving.length; ptr += 4) {
            moving[ptr + 0] = x;
            moving[ptr + 1] = y;
            const amplitude = Math.sqrt(Math.random()) * 20;
            const angle = Math.random() * Math.PI * 2;
            moving[ptr + 2] = Math.cos(angle) * amplitude;
            moving[ptr + 3] = Math.sin(angle) * amplitude;
        }

    }

    return { getData, tick, tickG, fire };
};

function resizeArray(sourceArray, targetLength) {
    if (sourceArray.length === targetLength) {
        return sourceArray;
    }
    if (sourceArray.length > targetLength) {
        return sourceArray.slice(0, targetLength);
    }
    const newArray = new Float32Array(targetLength);
    newArray.set(sourceArray);
    return newArray;
}
