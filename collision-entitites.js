export class Vector2 {
  static sum(p1, p2) {
    return new Vector2(p1.x + p2.x, p1.y + p2.y)
  }

  static sub(p1, p2) {
    return new Vector2(p1.x - p2.x, p1.y - p2.y)
  }

  constructor(x, y) {
    this.value = new Float32Array(2)
    this.value[0] = x
    this.value[1] = y
  }

  get x() {
    return this.value[0]
  }

  get y() {
    return this.value[1]
  }
}

export class AABB {
  constructor(center, radius) {
    this.center = center
    this.radius = radius
  }

  containsPoint(p) {
    return Math.abs(this.center.x - p.x) < this.radius.x
      && Math.abs(this.center.y - p.y) < this.radius.y
  }

  intersectsAABB(other) {
    if (Math.abs(this.center.x - other.center.x) > (this.radius.x + other.radius.x)) return false
    if (Math.abs(this.center.y - other.center.y) > (this.radius.y + other.radius.y)) return false

    return true
  }
}

const CAPACITY = 4
const MIN_RADIUS = 1

export class QuadTree {
  node1 = null
  node2 = null
  node3 = null
  node4 = null

  points = []

  constructor(boundary) {
    this.boundary = boundary
  }

  insert(p) {
    if (!this.boundary.containsPoint(p)) {
      return false
    }

    if (this.points.length < CAPACITY || this.boundary.radius.x < MIN_RADIUS || this.boundary.radius.y < MIN_RADIUS) {
      this.points.push(p)

      return true
    }

    if (!this.node1) {
      this.subdivide()
    }

    if (this.node1?.insert(p)) return true
    if (this.node2?.insert(p)) return true
    if (this.node3?.insert(p)) return true
    if (this.node4?.insert(p)) return true

    return false
  }

  subdivide() {
    const halfRadius = new Vector2(
      this.boundary.radius.x / 2,
      this.boundary.radius.y / 2
    )
    const reflectedHalfRadius = new Vector2(halfRadius.x, -halfRadius.y)

    this.node1 = new QuadTree(new AABB(Vector2.sum(this.boundary.center, halfRadius), halfRadius))
    this.node2 = new QuadTree(new AABB(Vector2.sum(this.boundary.center, reflectedHalfRadius), halfRadius))
    this.node3 = new QuadTree(new AABB(Vector2.sub(this.boundary.center, halfRadius), halfRadius))
    this.node4 = new QuadTree(new AABB(Vector2.sub(this.boundary.center, reflectedHalfRadius), halfRadius))
  }

  queryRange(range) {
    const pointsInRange = []

    if (!this.boundary.intersectsAABB(range)) {
      return pointsInRange
    }

    for (let i = 0; i < this.points.length; i++) {
      if (range.containsPoint(this.points[i])) {
        pointsInRange.push(this.points[i])
      }
    }

    if (!this.node1) {
      return pointsInRange
    }

    pointsInRange.push(...this.node1?.queryRange(range))
    pointsInRange.push(...this.node2?.queryRange(range))
    pointsInRange.push(...this.node3?.queryRange(range))
    pointsInRange.push(...this.node4?.queryRange(range))

    return pointsInRange
  }
}
