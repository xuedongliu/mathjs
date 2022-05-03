import { factory } from '../../../utils/factory.js'
import { extend } from '../../../utils/object.js'
import { createMatAlgo13xDD } from './matAlgo13xDD.js'
import { createMatAlgo14xDs } from './matAlgo14xDs.js'

const name = 'matrixAlgorithmSuite'
const dependencies = ['typed', 'matrix']

export const createMatrixAlgorithmSuite = /* #__PURE__ */ factory(
  name, dependencies, ({ typed, matrix }) => {
    const matAlgo13xDD = createMatAlgo13xDD({ typed })
    const matAlgo14xDs = createMatAlgo14xDs({ typed })

    /**
     * Return a signatures object with the usual boilerplate of
     * matrix algorithms, based on a plain options object with the
     * following properties:
     *   elop: function -- the elementwise operation to use, defaults to self
     *   SS: function -- the algorithm to apply for two sparse matrices
     *   DS: function -- the algorithm to apply for a dense and a sparse matrix
     *   SD: function -- algo for a sparse and a dense; defaults to SD flipped
     *   Ss: function -- the algorithm to apply for a sparse matrix and scalar
     *   sS: function -- algo for scalar and sparse; defaults to Ss flipped
     *   scalar: string -- typed-function type for scalars, defaults to 'any'
     *
     * If Ss is not specified, no matrix-scalar signatures are generated.
     *
     * @param {object} options
     * @return {Object<string, function>} signatures
     */
    return function matrixAlgorithmSuite (options) {
      const elop = options.elop
      const SD = options.SD || options.DS
      let matrixSignatures
      if (elop) {
        // First the dense ones
        matrixSignatures = {
          'DenseMatrix, DenseMatrix': (x, y) => matAlgo13xDD(x, y, elop),
          'Array, Array': (x, y) =>
            matAlgo13xDD(matrix(x), matrix(y), elop).valueOf(),
          'Array, DenseMatrix': (x, y) => matAlgo13xDD(matrix(x), y, elop),
          'DenseMatrix, Array': (x, y) => matAlgo13xDD(x, matrix(y), elop)
        }
        // Now incorporate sparse matrices
        if (options.SS) {
          matrixSignatures['SparseMatrix, SparseMatrix'] =
            (x, y) => options.SS(x, y, elop, false)
        }
        if (options.DS) {
          matrixSignatures['DenseMatrix, SparseMatrix'] =
            (x, y) => options.DS(x, y, elop, false)
          matrixSignatures['Array, SparseMatrix'] =
            (x, y) => options.DS(matrix(x), y, elop, false)
        }
        if (SD) {
          matrixSignatures['SparseMatrix, DenseMatrix'] =
            (x, y) => SD(y, x, elop, true)
          matrixSignatures['SparseMatrix, Array'] =
            (x, y) => SD(matrix(y), x, elop, true)
        }
      } else {
        // No elop, use this
        // First the dense ones
        matrixSignatures = {
          'DenseMatrix, DenseMatrix': function (x, y) {
            return matAlgo13xDD(x, y, this)
          },
          'Array, Array': function (x, y) {
            return matAlgo13xDD(matrix(x), matrix(y), this).valueOf()
          },
          'Array, DenseMatrix': function (x, y) {
            return matAlgo13xDD(matrix(x), y, this)
          },
          'DenseMatrix, Array': function (x, y) {
            return matAlgo13xDD(x, matrix(y), this)
          }
        }
        // Now incorporate sparse matrices
        if (options.SS) {
          matrixSignatures['SparseMatrix, SparseMatrix'] = function (x, y) {
            return options.SS(x, y, this, false)
          }
        }
        if (options.DS) {
          matrixSignatures['DenseMatrix, SparseMatrix'] = function (x, y) {
            return options.DS(x, y, this, false)
          }
          matrixSignatures['Array, SparseMatrix'] = function (x, y) {
            return options.DS(matrix(x), y, this, false)
          }
        }
        if (SD) {
          matrixSignatures['SparseMatrix, DenseMatrix'] = function (x, y) {
            return SD(y, x, this, true)
          }
          matrixSignatures['SparseMatrix, Array'] = function (x, y) {
            return SD(matrix(y), x, this, true)
          }
        }
      }

      // Now add the scalars
      const scalar = options.scalar || 'any'
      const Ds = options.Ds || options.Ss
      if (Ds) {
        if (elop) {
          matrixSignatures['DenseMatrix,' + scalar] =
            (x, y) => matAlgo14xDs(x, y, elop, false)
          matrixSignatures[scalar + ', DenseMatrix'] =
            (x, y) => matAlgo14xDs(y, x, elop, true)
          matrixSignatures['Array,' + scalar] =
            (x, y) => matAlgo14xDs(matrix(x), y, elop, false).valueOf()
          matrixSignatures[scalar + ', Array'] =
            (x, y) => matAlgo14xDs(matrix(y), x, elop, true).valueOf()
        } else {
          matrixSignatures['DenseMatrix,' + scalar] = function (x, y) {
            return matAlgo14xDs(x, y, this, false)
          }
          matrixSignatures[scalar + ', DenseMatrix'] = function (x, y) {
            return matAlgo14xDs(y, x, this, true)
          }
          matrixSignatures['Array,' + scalar] = function (x, y) {
            return matAlgo14xDs(matrix(x), y, this, false).valueOf()
          }
          matrixSignatures[scalar + ', Array'] = function (x, y) {
            return matAlgo14xDs(matrix(y), x, this, true).valueOf()
          }
        }
      }
      const sS = (options.sS !== undefined) ? options.sS : options.Ss
      if (elop) {
        if (options.Ss) {
          matrixSignatures['SparseMatrix,' + scalar] =
            (x, y) => options.Ss(x, y, elop, false)
        }
        if (sS) {
          matrixSignatures[scalar + ', SparseMatrix'] =
            (x, y) => sS(y, x, elop, true)
        }
      } else {
        if (options.Ss) {
          matrixSignatures['SparseMatrix,' + scalar] = function (x, y) {
            return options.Ss(x, y, this, false)
          }
        }
        if (sS) {
          matrixSignatures[scalar + ', SparseMatrix'] = function (x, y) {
            return sS(y, x, this, true)
          }
        }
      }
      // Also pull in the scalar signatures if the operator is a typed function
      if (elop && elop.signatures) {
        extend(matrixSignatures, elop.signatures)
      }
      return matrixSignatures
    }
  })