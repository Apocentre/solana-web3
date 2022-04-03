import keccak256 from 'keccak256'
import invariant from 'tiny-invariant'

const getPairElement = (idx, layer) => {
  const pairIdx = idx % 2 === 0 ? idx + 1 : idx - 1

  if (pairIdx < layer.length) {
    const pairEl = layer[pairIdx]
    invariant(pairEl, 'pairEl')
    return pairEl
  } else {
    return null
  }
}

const bufDedup = (elements) => {
  return elements.filter((el, idx) => {
    return idx === 0 || !elements[idx - 1]?.equals(el)
  })
}

const bufArrToHexArr = (arr) => {
  if (arr.some((el) => !Buffer.isBuffer(el))) {
    throw new Error('Array is not an array of buffers')
  }

  return arr.map((el) => '0x' + el.toString('hex'))
}

const sortAndConcat = (...args) => {
  return Buffer.concat([...args].sort(Buffer.compare.bind(null)))
}

export default class MerkleTree {
  constructor(elements) {
    this._elements = [...elements]
    // Sort elements
    this._elements.sort(Buffer.compare.bind(null))
    // Deduplicate elements
    this._elements = bufDedup(this._elements)

    this._bufferElementPositionIndex = this._elements.reduce((memo, el, index) => {
      memo[el.toString('hex')] = index
      return memo
    }, {})

    // Create layers
    this._layers = this.getLayers(this._elements)
  }

  getLayers(elements) {
    if (elements.length === 0) {
      throw new Error('empty tree')
    }

    const layers = []
    layers.push(elements)

    // Get next layer until we reach the root
    while ((layers[layers.length - 1]?.length ?? 0) > 1) {
      const nextLayerIndex = layers[layers.length - 1]
      invariant(nextLayerIndex, 'nextLayerIndex')
      layers.push(this.getNextLayer(nextLayerIndex))
    }

    return layers
  }

  getNextLayer(elements) {
    return elements.reduce((layer, el, idx, arr) => {
      if (idx % 2 === 0) {
        // Hash the current element with its pair element
        const pairEl = arr[idx + 1]
        layer.push(MerkleTree.combinedHash(el, pairEl))
      }

      return layer
    }, [])
  }

  static combinedHash(first, second) {
    if (!first) {
      invariant(second, 'second element of pair must exist')
      return second
    }
    if (!second) {
      invariant(first, 'first element of pair must exist')
      return first
    }

    return Buffer.from(keccak256(sortAndConcat(first, second)))
  }

  getRoot() {
    const root = this._layers[this._layers.length - 1]?.[0]
    invariant(root, 'root')
    return root
  }

  getHexRoot() {
    return this.getRoot().toString('hex')
  }

  getProof(el) {
    const initialIdx = this._bufferElementPositionIndex[el.toString('hex')]

    if (typeof initialIdx !== 'number') {
      throw new Error('Element does not exist in Merkle tree')
    }

    let idx = initialIdx
    return this._layers.reduce((proof, layer) => {
      const pairElement = getPairElement(idx, layer)

      if (pairElement) {
        proof.push(pairElement)
      }

      idx = Math.floor(idx / 2)

      return proof
    }, [])
  }

  getHexProof(el) {
    const proof = this.getProof(el)

    return bufArrToHexArr(proof)
  }
}
