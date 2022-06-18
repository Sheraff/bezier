import Curve from './classes/Curve.js'
import Point from './classes/Point.js'
import Vector from './classes/Vector.js'

/** @type {HTMLCanvasElement} */
const canvas = document.getElementById('canvas')

const ctx = canvas.getContext('2d', { alpha: false })
const side = Math.min(innerWidth, innerHeight) * devicePixelRatio
canvas.width = side
canvas.height = side

const MAX_DISTANCE_TO_SELECT = 0.05 * side


const curve = new Curve(
	new Point(0.4*side, 0.4*side, 0.5*side, 0.2*side),
	new Point(0.7*side, 0.6*side, 0.8*side, 0.4*side),
)


void function loop() {
	requestAnimationFrame(() => {
		ctx.fillStyle = '#000'
		ctx.fillRect(0, 0, side, side)
		curve.draw(ctx)
		loop()
	})
}()


let down = false
canvas.addEventListener('pointerdown', (event) => {
	down = true
	if(lastActivePoint) {
		canvas.style.setProperty('cursor', 'grabbing')
	} else {
		const mouse = screenToCanvas(canvas, event)
		const first = curve.points[0].center
		const last = curve.points[curve.points.length - 1].center
		const vec = getClosestToMouse(mouse, [first, last])
		if (mouse.dist(vec) > MAX_DISTANCE_TO_SELECT) {
			const method = vec === first ? 'unshift' : 'push'
			const newPoint = new Point(mouse.x, mouse.y, mouse.x, mouse.y)
			curve.points[method](newPoint)
			lastActivePoint = newPoint
			canvas.style.setProperty('cursor', 'grabbing')
			newPoint.active = vec === first ? 'hAfter' : 'hBefore'
		}
	}
})
canvas.addEventListener('pointerup', (event) => {
	down = false
	if(lastActivePoint) {
		canvas.style.setProperty('cursor', 'grab')
	}
})

let lastActivePoint = null
let inRange = false
canvas.addEventListener('pointermove', (event) => {
	const mouse = screenToCanvas(canvas, event)
	if(!down) {
		const { point, active } = getClosestToMouse(mouse, curve)
		const isNewPoint = point !== lastActivePoint
		const isCloseToAPoint = mouse.dist(point[active]) < MAX_DISTANCE_TO_SELECT
		if(lastActivePoint && (isNewPoint || !isCloseToAPoint)) {
			lastActivePoint.active = null
			lastActivePoint = null
		}
		if(isNewPoint && isCloseToAPoint) {
			point.active = active
			lastActivePoint = point
		}
		if(!inRange && isCloseToAPoint) {
			canvas.style.setProperty('cursor', 'grab')
			inRange = true
		}
		if(inRange && !isCloseToAPoint) {
			canvas.style.setProperty('cursor', 'auto')
			inRange = false
		}
	} else {
		if (lastActivePoint.active === 'center') {
			lastActivePoint.updateCenter(mouse)
		} else {
			lastActivePoint.updateHandle(mouse, lastActivePoint.active)
		}
	}
})

function getClosestToMouse(mouse, input) {
	if(Array.isArray(input)) {
		return getClosestToMouseInArray(mouse, input)
	}
	return getClosestToMouseInCurve(mouse, input)
}

/**
 * @param {Vector} mouse 
 * @param {Curve} curve 
 * @return {{point: Point, active: string}}
 */
function getClosestToMouseInCurve(mouse, curve) {
	let min = Infinity
	let point = null
	let active = null
	curve.points.forEach((_point, i) => {
		const { center, hBefore, hAfter } = _point
		const dist = center.dist(mouse)
		if (dist < min) {
			min = dist
			point = _point
			active = 'center'
		}
		if (i > 0) {
			const dist2 = hBefore.dist(mouse)
			if (dist2 < min) {
				min = dist2
				point = _point
				active = 'hBefore'
			}
		}
		if(i < curve.points.length - 1) {
			const dist3 = hAfter.dist(mouse)
			if (dist3 < min) {
				min = dist3
				point = _point
				active = 'hAfter'
			}
		}
	})
	return { point, active }
}

/**
 * @param {Vector} mouse 
 * @param {Vector[]} vectors
 * @return {Vector}
 */
 function getClosestToMouseInArray(mouse, vectors) {
	let min = Infinity
	let result = null
	vectors.forEach((vector, i) => {
		const dist = vector.dist(mouse)
		if (dist < min) {
			min = dist
			result = vector
		}
	})
	return result
}

/**
 * @param {HTMLCanvasElement} canvas
 * @param {{x: number, y: number}} vector
 */
function screenToCanvas(canvas, {x, y}) {
	const rect = canvas.getBoundingClientRect()
	return new Vector(
		(x - rect.left) * devicePixelRatio,
		(y - rect.top) * devicePixelRatio,
	)
}